import { db } from "@/lib/db"

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434"

function generateVariants(word: string) {
  const out = new Set<string>()
  if (!word) return out
  const w = word.toLowerCase()
  out.add(w)
  if (w.endsWith("s")) out.add(w.slice(0, -1))
  else out.add(w + "s")
  for (let i = 0; i < w.length; i++) out.add(w.slice(0, i) + w.slice(i + 1))
  for (let i = 0; i < w.length - 1; i++) {
    const a = w.split("")
    const tmp = a[i]
    a[i] = a[i + 1]
    a[i + 1] = tmp
    out.add(a.join(""))
  }
  return out
}

function extractKeywords(question: string) {
  const stopWords = new Set([
    "how",
    "what",
    "when",
    "where",
    "is",
    "are",
    "the",
    "a",
    "an",
    "do",
    "does",
    "much",
    "many",
    "i",
    "you",
    "we",
    "me",
    "my",
  ])

  return question
    .toLowerCase()
    .replace(/[.,!?;()"'`]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
    .map((w) => {
      // naive plural normalization: 'providers' -> 'provider', 'services' -> 'service'
      if (w.length > 3 && w.endsWith("s")) {
        return w.slice(0, -1)
      }
      return w
    })
}

export async function searchContent(question: string, limit = 5) {
  const keywords = extractKeywords(question)

  // synonyms map to capture common variants
  const synonymsMap: Record<string, string[]> = {
    providers: ["provider", "providers"],
    provider: ["provider", "providers"],
    services: ["service", "services"],
    service: ["service", "services"],
    cleaning: ["cleaning", "housekeeping", "janitorial"],
    housekeeping: ["cleaning", "housekeeping"],
  }

  if (keywords.length === 0) {
    // fallback: full text contains the original question
    return db.homeaseContent.findMany({ where: { content: { contains: question } }, take: limit })
  }

  // Build OR conditions for Prisma
  const or = [] as any[]
  for (const kw of keywords.slice(0, 8)) {
    const terms = new Set<string>([kw])
    if (synonymsMap[kw]) for (const s of synonymsMap[kw]) terms.add(s)
    // expand with misspelling/variant generation to match indexed variants
    for (const t of Array.from(terms)) {
        for (const v of Array.from(generateVariants(t))) {
          or.push({ content: { contains: v } })
          or.push({ pageTitle: { contains: v } })
          or.push({ pageUrl: { contains: v } })
          or.push({ contentType: { contains: v } })
          or.push({ keywords: { contains: v } })
        }
    }
  }

  const results = await db.homeaseContent.findMany({ where: { OR: or }, take: limit })
  return results
}

async function generateWithOllama(prompt: string, model?: string) {
  const modelName = model ?? process.env.OLLAMA_MODEL ?? "llama3.2"
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (process.env.OLLAMA_API_KEY) headers["Authorization"] = `Bearer ${process.env.OLLAMA_API_KEY}`

    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify({ model: modelName, prompt, max_tokens: 512 }),
    })

    const rawText = await res.text()
    if (!res.ok) {
      throw new Error(`Ollama error: ${res.status} ${rawText}`)
    }

    // Try to parse as a single JSON response
    try {
      const data = JSON.parse(rawText)
      if (Array.isArray(data.output) && data.output[0]?.content) return data.output[0].content
      if (data.text) return data.text
      if (typeof data.response === "string") return data.response
      return JSON.stringify(data)
    } catch (e) {
      // Fallback: Ollama streams NDJSON (newline-delimited JSON). Parse and concat `response` fragments.
      const lines = rawText.split(/\r?\n/).filter(Boolean)
      let lastObj: any = null
      let acc = ""
      for (const line of lines) {
        try {
          const obj = JSON.parse(line)
          lastObj = obj
          if (typeof obj.response === "string") acc += obj.response
          else if (obj.text && typeof obj.text === "string") acc += obj.text
          else if (Array.isArray(obj.output) && obj.output[0]?.content) acc += obj.output[0].content
        } catch (_) {
          // ignore parse errors for partial lines
        }
      }

      if (acc) return acc
      if (lastObj) return JSON.stringify(lastObj)
      return rawText
    }
  } catch (err) {
    throw err
  }
}

export async function answerQuestion(question: string) {
  const results = await searchContent(question, 5)
  const retrieved = results.map((r) => `-- ${r.pageTitle} (${r.pageUrl})\n${r.content}`).join("\n\n")

  const prompt = `You are Homease assistant. Use ONLY the following information to answer the question.\n\nRELEVANT INFORMATION FROM HOMEASE:\n${retrieved}\n\nUSER QUESTION: ${question}\n\nProvide a helpful, accurate answer based only on the information above. If the information doesn't contain the answer, say so and suggest contacting support.`

  const answer = await generateWithOllama(prompt)
  return { answer, sources: results }
}

export async function healthCheck() {
  // Check Ollama
  let ollamaOk = false
  try {
    // Debug: log URL being used
    // eslint-disable-next-line no-console
    console.debug("healthCheck: probing OLLAMA_URL=", OLLAMA_URL)
    const r = await fetch(`${OLLAMA_URL}/api/models`)
    // eslint-disable-next-line no-console
    console.debug("healthCheck: ollama response status=", r.status)
    if (!r.ok) {
      const body = await r.text().catch(() => "<no-body>")
      // eslint-disable-next-line no-console
      console.debug("healthCheck: ollama response body=", body)
    }
    ollamaOk = r.ok
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("healthCheck: error contacting Ollama:", e)
    ollamaOk = false
  }

  // Check DB
  let dbOk = false
  try {
    await db.$queryRaw`SELECT 1`
    dbOk = true
  } catch (e) {
    dbOk = false
  }

  return { ollama: ollamaOk, database: dbOk }
}
