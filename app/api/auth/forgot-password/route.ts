import { NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "../../../../lib/db"
import sendEmail from "../../../../lib/email"

function generateOtp() {
  return (Math.floor(100000 + Math.random() * 900000)).toString()
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ ok: true })

    const user = await db.user.findUnique({ where: { email } })

    // Always respond with success to avoid email enumeration
    if (!user) return NextResponse.json({ ok: true })

    const otp = generateOtp()
    const tokenHash = crypto.createHash("sha256").update(otp).digest("hex")
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10) // 10 minutes

    await db.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#111">
        <h2 style="color:#0b5fff">Homease — Password Reset</h2>
        <p>We received a request to reset the password for your Homease account (<strong>${user.email}</strong>).</p>
        <p style="font-size:22px;margin:18px 0;padding:12px 16px;border-radius:6px;background:#f5f7ff;display:inline-block">
          <strong>One-time code:</strong>
          <div style="font-size:28px;color:#0b5fff;margin-top:6px;letter-spacing:4px">${otp}</div>
        </p>
        <p>This code will expire in 10 minutes. If you didn't request a password reset, you can safely ignore this email.</p>
        <hr style="margin:20px 0;border:none;border-top:1px solid #eee" />
        <p style="font-size:12px;color:#666">If you need help, reply to this email or visit <a href="${appUrl}" style="color:#0b5fff">Homease</a>.</p>
      </div>
    `

    await sendEmail({
      to: user.email,
      subject: "Your Homease password reset code",
      html,
      text: `Your Homease password reset code: ${otp} (expires in 10 minutes)`,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("forgot-password error", err)
    return NextResponse.json({ ok: true })
  }
}
