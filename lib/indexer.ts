import { db } from "@/lib/db"
import fs from "fs"
import path from "path"

function stripTags(text: string) {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\{[^}]*\}/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function sanitizeForIndex(text: string) {
  // redact environment-style secrets and lines that contain sensitive keys
  const secretKeys = ["password", "pass", "token", "secret", "client_secret", "api_key", "aws_access_key_id", "aws_secret_access_key", "sessiontoken", "session_token", "private_key"]
  const lines = text.split(/\r?\n/)
  const out: string[] = []
  for (let l of lines) {
    const low = l.toLowerCase()
    let redacted = false
    for (const k of secretKeys) {
      if (low.includes(k)) {
        redacted = true
        break
      }
    }
    if (redacted) {
      out.push("[REDACTED]")
      continue
    }
    // redact long token-like strings
    l = l.replace(/\b[A-Za-z0-9_\-]{40,}\b/g, "[REDACTED]")
    out.push(l)
  }
  return out.join("\n")
}

function generateKeywordVariants(word: string) {
  const out = new Set<string>()
  if (!word) return out
  const w = word.toLowerCase()
  out.add(w)
  // singular/plural
  if (w.endsWith("s")) out.add(w.slice(0, -1))
  else out.add(w + "s")
  // simple deletions
  for (let i = 0; i < w.length; i++) out.add(w.slice(0, i) + w.slice(i + 1))
  // adjacent swaps
  for (let i = 0; i < w.length - 1; i++) {
    const a = w.split("")
    const tmp = a[i]
    a[i] = a[i + 1]
    a[i + 1] = tmp
    out.add(a.join(""))
  }
  return out
}

function extractKeywordsFromText(text: string) {
  const stop = new Set(["the", "and", "for", "with", "from", "you", "are", "how", "what", "when", "where"])
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !stop.has(w))
    )
  )
}

async function indexFile(filePath: string) {
  try {
    // skip environment files
    if (path.basename(filePath).startsWith(".env")) return
    const raw = await fs.promises.readFile(filePath, "utf8")
    let text = stripTags(raw)
    text = sanitizeForIndex(text)
    const title = path.basename(filePath)
    const keywords = extractKeywordsFromText(text)
    await db.homeaseContent.create({
      data: {
        pageTitle: title,
        pageUrl: `/file${filePath.replace(/\\/g, "/").replace(/[0-9a-fA-F\-]{8,}/g, "<id>")}`,
        contentType: "static",
        content: text,
        keywords: keywords.join(","),
      },
    })
  } catch (e) {
    // ignore file read errors
  }
}

/**
 * Index all site content into `homease_content` for keyword search.
 * - services, providers, platform settings
 * - static pages under `app/` and markdown files
 * - generates expanded keyword variants (misspellings/synonyms)
 */
export async function indexAllContent() {
  // wipe old entries
  await db.homeaseContent.deleteMany({})

  // Index services (detailed)
  const services = await db.service.findMany()
  for (const s of services) {
    const content = `${s.name}\n\n${s.description ?? ""}\n\nPrice: ${s.price ?? "N/A"} (${s.priceType ?? "N/A"})\nArea: ${s.serviceArea ?? ""}`
    const kws = new Set<string>()
    extractKeywordsFromText(content).forEach((k) => generateKeywordVariants(k).forEach((v) => kws.add(v)))
    // include category and name variants
    if (s.category) extractKeywordsFromText(s.category).forEach((k) => generateKeywordVariants(k).forEach((v) => kws.add(v)))

    await db.homeaseContent.create({
      data: {
        pageTitle: s.name,
        pageUrl: `/service/${s.id}`,
        contentType: "service",
        content,
        keywords: Array.from(kws).slice(0, 200).join(","),
      },
    })
  }

  // Index providers
  const providers = await db.user.findMany({ where: { userType: "provider" } })
  for (const p of providers) {
    const content = `${p.name}\n\n${p.bio ?? ""}\nSpecialties: ${p.specialties ?? ""}\nLocation: ${p.location ?? ""}`
    const kws = new Set<string>()
    extractKeywordsFromText(content).forEach((k) => generateKeywordVariants(k).forEach((v) => kws.add(v)))
    await db.homeaseContent.create({
      data: {
        pageTitle: `${p.name} (provider)`,
        pageUrl: `/provider/${p.id}`,
        contentType: "provider",
        content,
        keywords: Array.from(kws).slice(0, 200).join(","),
      },
    })
  }

  // Platform settings
  const settings = await db.platformSettings.findFirst()
  if (settings) {
    const content = `Commission rate: ${settings.commissionRate}`
    await db.homeaseContent.create({ data: { pageTitle: "Platform Settings", pageUrl: "/settings/platform", contentType: "settings", content, keywords: "commission,fees,pricing" } })
  }

  // Index Markdown and page files under app/, public/ and project root docs
  const root = path.resolve(process.cwd())
  const scanDirs = [path.join(root, "app"), path.join(root, "public")] // we'll also scan root docs below
  for (const dir of scanDirs) {
    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true })
      const stack = entries.map((e) => path.join(dir, e.name))
      while (stack.length) {
        const p = stack.pop()!
        const stat = await fs.promises.stat(p)
        if (stat.isDirectory()) {
          const sub = await fs.promises.readdir(p)
          for (const s of sub) stack.push(path.join(p, s))
          continue
        }
        if (p.endsWith(".md") || p.endsWith(".mdx") || p.endsWith("page.tsx") || p.endsWith("page.jsx") || p.endsWith(".html") || p.endsWith(".tsx")) {
          await indexFile(p)
        }
      }
    } catch (e) {
      // ignore missing dirs
    }
  }

  // Scan root docs and common docs in the repo root
  const rootDocs = [
    "CREATE_ADMIN.md",
    "DATABASE_SETUP.md",
    "docker-setup.md",
    "EMAIL_SETUP.md",
    "GOOGLE_OAUTH_IMPLEMENTATION.md",
    "GOOGLE_OAUTH_SETUP.md",
    "LOCAL_DB_SETUP.md",
    "QUICK_START.md",
    "CHECK_TABLES.ts",
    "CREATE_ADMIN.md",
  ]
  for (const d of rootDocs) {
    const p = path.join(root, d)
    try {
      await fs.promises.access(p)
      await indexFile(p)
    } catch (e) {
      // ignore missing
    }
  }

  // Add manual entries summarizing flows (booking, bidding, availability, filters, oauth, email verification)
  const flows = [
    { title: "Booking Process", body: "Users can search services, select a provider or bid, choose date/time, and confirm booking. Payment and notifications follow the booking." },
    { title: "Bidding Process", body: "Customers create service requests; providers submit bids. Customers accept a provider bid to create a booking." },
    { title: "Provider Availability", body: "Provider schedules are stored in ProviderSchedule JSON with working hours and blocked dates; availability checks consult this schedule." },
    { title: "User Search & Filters", body: "Users can filter by category, price, location, rating, and availability. Search matches service names and provider specialties." },
    { title: "Google OAuth", body: "Google OAuth flow creates or links user accounts with providerId/googleId; tokens are stored only for session management, not indexed." },
    { title: "Email Verification", body: "Email verification tokens are issued and stored hashed; verification flow updates emailVerified on success." },
  ]
  for (const f of flows) {
    await db.homeaseContent.create({ data: { pageTitle: f.title, pageUrl: `/flow/${f.title.replace(/\s+/g, "-").toLowerCase()}`, contentType: "flow", content: f.body, keywords: extractKeywordsFromText(f.body).join(",") } })
  }

  return { success: true }
}
