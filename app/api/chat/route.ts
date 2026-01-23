import { NextResponse } from "next/server"
import { answerQuestion } from "@/lib/ai-chat"
import fs from "fs"
import path from "path"

const LOG_DIR = path.join(process.cwd(), "logs")
if (!fs.existsSync(LOG_DIR)) {
  try {
    fs.mkdirSync(LOG_DIR)
  } catch (_) {}
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { question } = body
    if (!question || typeof question !== "string") return NextResponse.json({ error: "Missing question" }, { status: 400 })

    const { answer, sources } = await answerQuestion(question)
    return NextResponse.json({ answer, sources })
  } catch (err: any) {
    const stack = err && err.stack ? err.stack : String(err)
    // Log full error server-side to help debugging
    // eslint-disable-next-line no-console
    console.error("/api/chat error:", stack)
    try {
      fs.appendFileSync(path.join(LOG_DIR, "chat-error.log"), new Date().toISOString() + "\n" + stack + "\n\n")
    } catch (_) {}
    // Return stack trace in response temporarily for debugging
    return NextResponse.json({ error: err.message ?? String(err), stack }, { status: 500 })
  }
}
