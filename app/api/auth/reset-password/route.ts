import { NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "../../../../lib/db"
import { hashPassword } from "../../../../lib/auth-utils"

export async function POST(req: Request) {
  try {
    const { email, otp, password } = await req.json()
    if (!email || !otp || !password) return NextResponse.json({ ok: false, error: "Missing" }, { status: 400 })

    const user = await db.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ ok: false, error: "Invalid token or email" }, { status: 400 })

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex")

    const reset = await db.passwordReset.findFirst({ where: { userId: user.id, tokenHash: otpHash } })
    if (!reset) return NextResponse.json({ ok: false, error: "Invalid or expired token" }, { status: 400 })
    if (reset.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ ok: false, error: "Token expired" }, { status: 400 })
    }

    const hashed = await hashPassword(password)

    await db.user.update({ where: { id: reset.userId }, data: { password: hashed } })

    // remove all reset tokens for user
    await db.passwordReset.deleteMany({ where: { userId: reset.userId } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("reset-password error", err)
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 })
  }
}
