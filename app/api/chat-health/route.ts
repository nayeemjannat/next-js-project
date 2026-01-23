import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  // Probe Ollama tags endpoint on loopback and check for configured model
  const ollamaUrl = process.env.OLLAMA_URL || "http://127.0.0.1:11434"
  const modelName = process.env.OLLAMA_MODEL || "llama3.2:3b"

  let ollamaOk = false
  try {
    const res = await fetch(`${ollamaUrl.replace(/\/$/, "")}/api/tags`, { cache: "no-store" })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.models)) {
        ollamaOk = data.models.some((m: any) => m.name === modelName || m.model === modelName)
      }
    }
  } catch (e) {
    // ignore — ollamaOk stays false
  }

  // Check DB connectivity
  let dbOk = false
  try {
    await db.$queryRaw`SELECT 1`
    dbOk = true
  } catch (e) {
    dbOk = false
  }

  return NextResponse.json({ ollama: ollamaOk, database: dbOk })
}
