import nodemailer from "nodemailer"

type SendMailOptions = {
  to: string
  subject: string
  html?: string
  text?: string
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined,
})

export async function sendEmail(opts: SendMailOptions) {
  const from = process.env.FROM_EMAIL || `no-reply@${process.env.NEXT_PUBLIC_APP_URL ?? "localhost"}`

  const info = await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  })

  return info
}

export default sendEmail
