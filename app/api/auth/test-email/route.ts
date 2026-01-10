import { NextResponse } from "next/server"
import sendEmail from "../../../../lib/email"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('[test-email] request body:', body)
    const { to } = body || {}
    if (!to) return NextResponse.json({ ok: false, error: 'missing to' }, { status: 400 })

    try {
      await sendEmail({
        to,
        subject: 'Test email from Homease',
        text: 'This is a test email sent from the local Homease instance to verify SMTP settings.',
        html: '<p>This is a test email sent from the local Homease instance to verify SMTP settings.</p>',
      })
    } catch (sendErr) {
      console.error('[test-email] nodemailer error:', sendErr && (sendErr.stack || sendErr))
      return NextResponse.json({ ok: false, error: (sendErr && sendErr.message) || String(sendErr) }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[test-email] unexpected error', err && (err.stack || err))
    return NextResponse.json({ ok: false, error: (err && err.message) || String(err) }, { status: 500 })
  }
}
