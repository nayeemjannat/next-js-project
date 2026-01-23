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
      const targetUser = await db.user.findUnique({ where: { id: ev.userId } })
      if (!targetUser) return NextResponse.json({ ok: false, error: "Invalid user" }, { status: 400 })
      // Prevent Google OAuth accounts from changing email via token/OTP flow
      if (targetUser.provider === "google") {
        return NextResponse.json({ ok: false, error: "Use Google sign-in to change email", provider: "google" }, { status: 403 })
      }

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

      // Prevent Google OAuth accounts from changing email via OTP
      const owner = await db.user.findUnique({ where: { id: ev.userId } })
      if (!owner) return NextResponse.json({ ok: false, error: "Invalid user" }, { status: 400 })
      if (owner.provider === "google") {
        return NextResponse.json({ ok: false, error: "Use Google sign-in to change email", provider: "google" }, { status: 403 })
      }

      // If newEmail is provided in the request, use it; otherwise use the one from emailVerification record
      const emailToSet = (body.newEmail || ev.newEmail || user.email).trim().toLowerCase()

      // Ensure no other user already owns this email
      const existing = await db.user.findUnique({ where: { email: emailToSet } })
      if (existing && existing.id !== ev.userId) {
        if (existing.provider === "google") {
          return NextResponse.json({ ok: false, error: "Email linked to Google" }, { status: 409 })
        }
        return NextResponse.json({ ok: false, error: "Email already registered" }, { status: 409 })
      }

      // Update email (this will replace the old email)
      await db.user.update({ 
        where: { id: ev.userId }, 
        data: { 
          email: emailToSet,
          emailVerified: true 
        } 
      })
      
      // Clean up all email verification records for this user
      await db.emailVerification.deleteMany({ where: { userId: ev.userId } })
      return NextResponse.json({ ok: true, newEmail: emailToSet })
    }

    return NextResponse.json({ ok: false, error: 'Missing parameters' }, { status: 400 })
  } catch (err) {
    console.error("verify-email error", err)
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 })
  }
}
