import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// POST /api/payment/ipn - SSLCommerz IPN (Instant Payment Notification)
export async function POST(request: NextRequest) {
  try {
    const body = await request.formData()
    const status = body.get("status")
    const tranId = body.get("tran_id")
    const valId = body.get("val_id")

    if (!tranId) {
      return NextResponse.json({ error: "Transaction ID missing" }, { status: 400 })
    }

    // Find payment by transaction ID
    const payment = await db.payment.findFirst({
      where: { transactionId: tranId as string },
      include: { booking: true },
    })

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Update payment status
    if (status === "VALID" || status === "VALIDATED") {
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          gatewayResponse: JSON.stringify(Object.fromEntries(body.entries())),
        },
      })

      // Update booking payment status
      await db.booking.update({
        where: { id: payment.bookingId },
        data: {
          paymentStatus: "paid",
          paymentMethod: payment.method,
        },
      })
    } else {
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          gatewayResponse: JSON.stringify(Object.fromEntries(body.entries())),
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("IPN error:", error)
    return NextResponse.json({ error: "IPN processing failed" }, { status: 500 })
  }
}

