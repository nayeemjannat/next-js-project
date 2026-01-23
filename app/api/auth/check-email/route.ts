import { NextResponse } from "next/server"
import { db } from "../../../../lib/db"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ ok: false, error: "Missing email" }, { status: 400 })

    const normalized = String(email).trim().toLowerCase()
    const user = await db.user.findUnique({ where: { email: normalized } })
    if (!user) return NextResponse.json({ ok: true, exists: false })

    return NextResponse.json({ ok: true, exists: true, provider: user.authMethod ?? user.provider ?? "email" })
  } catch (err) {
    console.error("check-email error", err)
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 })
  }
}
