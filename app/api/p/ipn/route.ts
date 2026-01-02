import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// POST /api/p/ipn - SSLCommerz IPN handler (shortened URL)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tran_id, status, amount } = body

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
        status: status === "SUCCESS" ? "PAID" : "FAILED",
        gatewayResponse: JSON.stringify(body),
      },
    })

    // Update booking payment status
    if (status === "SUCCESS") {
      await db.booking.update({
        where: { id: payment.bookingId },
        data: {
          paymentStatus: "paid",
          paymentMethod: payment.method,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("IPN error:", error)
    return NextResponse.json({ error: "IPN processing failed" }, { status: 500 })
  }
}
