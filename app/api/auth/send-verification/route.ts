import { NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "../../../../lib/db"
import sendEmail from "../../../../lib/email"

export async function POST(req: Request) {
  try {
      const { userId, newEmail } = await req.json()
      if (!userId || !newEmail) return NextResponse.json({ ok: false, error: "Missing" }, { status: 400 })

      const user = await db.user.findUnique({ where: { id: userId } })
      if (!user) return NextResponse.json({ ok: false, error: "Invalid user" }, { status: 400 })

      // generate 6-digit OTP
      const otp = (Math.floor(100000 + Math.random() * 900000)).toString()
      const tokenHash = crypto.createHash("sha256").update(otp).digest("hex")
      const expiresAt = new Date(Date.now() + 1000 * 60 * 10) // 10 minutes

      await db.emailVerification.create({
        data: {
          userId: user.id,
          tokenHash,
          newEmail,
          expiresAt,
        },
      })

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

      const html = `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#111">
          <h2 style="color:#0b5fff">Homease — Verify Your Email</h2>
          <p>Please use the following verification code to confirm your email address (<strong>${newEmail}</strong>):</p>
          <p style="font-size:22px;margin:18px 0;padding:12px 16px;border-radius:6px;background:#f5f7ff;display:inline-block">
            <div style="font-size:28px;color:#0b5fff;margin-top:6px;letter-spacing:4px">${otp}</div>
          </p>
          <p>This code will expire in 10 minutes. If you didn't create an account, ignore this email.</p>
          <hr style="margin:20px 0;border:none;border-top:1px solid #eee" />
          <p style="font-size:12px;color:#666">Need help? Reply to this email or visit <a href="${appUrl}" style="color:#0b5fff">Homease</a>.</p>
        </div>
      `

      const devMode = process.env.NODE_ENV !== "production" || process.env.SHOW_OTP_IN_TERMINAL === "true"

      // Always attempt to send the email (if SMTP is configured).
      try {
        await sendEmail({ to: newEmail, subject: "Verify your Homease email", html, text: `Verification code: ${otp}` })
      } catch (emailErr) {
        console.error("send-verification: sendEmail failed", emailErr)
        // we'll still return ok so the flow can continue; developer can check logs
      }

      // In development, also print the OTP to the server console for convenience.
      if (devMode) {
        console.info(`DEV: Verification OTP for ${newEmail}: ${otp}`)
      }

      return NextResponse.json({ ok: true, dev: devMode })
  } catch (err) {
    console.error("send-verification error", err)
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 })
  }
}
