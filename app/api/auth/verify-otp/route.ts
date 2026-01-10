import { NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "../../../../lib/db"

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json()
    if (!email || !otp) return NextResponse.json({ ok: false, error: 'Missing' }, { status: 400 })

    const user = await db.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ ok: false, error: 'Invalid' }, { status: 400 })

    const otpHash = crypto.createHash('sha256').update(String(otp)).digest('hex')
    const reset = await db.passwordReset.findFirst({ where: { userId: user.id, tokenHash: otpHash } })
    if (!reset) return NextResponse.json({ ok: false, error: 'Invalid or expired' }, { status: 400 })
    if (reset.expiresAt.getTime() < Date.now()) return NextResponse.json({ ok: false, error: 'Expired' }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[verify-otp] error', err)
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 })
  }
}
