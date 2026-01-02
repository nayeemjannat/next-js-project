import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// POST /api/payment/callback - Unified SSLCommerz callback handler
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const data = Object.fromEntries(formData.entries())
    
    const { tran_id, status, val_id, amount, currency, card_type, store_amount, bank_tran_id, error } = data as any

    if (!tran_id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Find payment by transaction ID
    const payment = await db.payment.findFirst({
      where: { transactionId: tran_id },
      include: { booking: true },
    })

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Update payment status
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: status === "SUCCESS" || status === "VALID" ? "PAID" : "FAILED",
        gatewayResponse: JSON.stringify(data),
      },
    })

    // Update booking payment status
    if (status === "SUCCESS" || status === "VALID") {
      await db.booking.update({
        where: { id: payment.bookingId },
        data: {
          paymentStatus: "paid",
          paymentMethod: payment.method,
        },
      })
    }

    // Determine redirect URL based on status
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    let redirectUrl = `${baseUrl}/payment/fail?bookingId=${payment.bookingId}&transactionId=${tran_id}`
    
    if (status === "SUCCESS" || status === "VALID") {
      redirectUrl = `${baseUrl}/payment/success?bookingId=${payment.bookingId}&transactionId=${tran_id}`
    } else if (status === "CANCELLED") {
      redirectUrl = `${baseUrl}/payment/cancel?bookingId=${payment.bookingId}&transactionId=${tran_id}`
    }

    // Return HTML redirect for SSLCommerz
    const html = `
      <html>
        <head><title>Redirecting...</title></head>
        <body>
          <script>
            window.location.href = "${redirectUrl}";
          </script>
          <p>Redirecting... <a href="${redirectUrl}">Click here if not redirected</a></p>
        </body>
      </html>
    `

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (error) {
    console.error("Callback error:", error)
    return NextResponse.json({ error: "Callback processing failed" }, { status: 500 })
  }
}

// GET handler for IPN notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const { tran_id, status } = Object.fromEntries(searchParams.entries())

    if (!tran_id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Find payment by transaction ID
    const payment = await db.payment.findFirst({
      where: { transactionId: tran_id },
    })

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Update payment status
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: status === "SUCCESS" || status === "VALID" ? "PAID" : "FAILED",
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("IPN error:", error)
    return NextResponse.json({ error: "IPN processing failed" }, { status: 500 })
  }
}
