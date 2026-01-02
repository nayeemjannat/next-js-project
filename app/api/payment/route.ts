import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// POST /api/payment - Demo payment processing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId, amount, customerName, customerEmail, customerPhone, customerAddress } = body

    if (!bookingId || !amount || !customerEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify booking exists
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Demo payment - auto approve payment
    const payment = await db.payment.create({
      data: {
        bookingId,
        status: "PAID",
        transactionId: `DEMO_${Date.now()}`,
        method: "Demo Payment",
        amount: parseFloat(amount),
      },
    })

    // Update booking payment status
    await db.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: "paid",
        paymentMethod: "Demo Payment",
      },
    })

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      redirectUrl: `/payment/success?bookingId=${bookingId}&transactionId=${payment.transactionId}`,
    })
  } catch (error) {
    console.error("Payment processing error:", error)
    return NextResponse.json({ error: "Failed to process payment" }, { status: 500 })
  }
}

