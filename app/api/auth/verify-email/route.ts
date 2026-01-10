import { NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "../../../../lib/db"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // support either token (from link) or email+otp
    if (body.token) {
      const tokenHash = crypto.createHash("sha256").update(body.token).digest("hex")
      const ev = await db.emailVerification.findFirst({ where: { tokenHash } })
      if (!ev) return NextResponse.json({ ok: false, error: "Invalid or expired token" }, { status: 400 })
      if (ev.expiresAt.getTime() < Date.now()) return NextResponse.json({ ok: false, error: "Expired" }, { status: 400 })

      await db.user.update({ where: { id: ev.userId }, data: { email: ev.newEmail ?? undefined, emailVerified: true } })
      await db.emailVerification.deleteMany({ where: { userId: ev.userId } })
      return NextResponse.json({ ok: true })
    }

    if (body.email && body.otp) {
      const user = await db.user.findUnique({ where: { email: body.email } })
      if (!user) return NextResponse.json({ ok: false, error: "Invalid" }, { status: 400 })
      const otpHash = crypto.createHash("sha256").update(String(body.otp)).digest("hex")
      const ev = await db.emailVerification.findFirst({ where: { userId: user.id, tokenHash: otpHash } })
      if (!ev) return NextResponse.json({ ok: false, error: "Invalid or expired" }, { status: 400 })
      if (ev.expiresAt.getTime() < Date.now()) return NextResponse.json({ ok: false, error: "Expired" }, { status: 400 })

      await db.user.update({ where: { id: ev.userId }, data: { email: ev.newEmail ?? undefined, emailVerified: true } })
      await db.emailVerification.deleteMany({ where: { userId: ev.userId } })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: false, error: 'Missing parameters' }, { status: 400 })
  } catch (err) {
    console.error("verify-email error", err)
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 })
  }
}
