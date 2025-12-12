import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// POST /api/bookings/[id]/payment - Process payment (demo)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const body = await request.json()
    const { paymentMethod = "demo" } = body

    // Find booking
    const booking = await db.booking.findUnique({
      where: { id: resolvedParams.id },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (booking.paymentStatus === "paid") {
      return NextResponse.json({ error: "Booking already paid" }, { status: 400 })
    }

    // Demo payment processing - always succeeds
    // In production, integrate with Stripe, PayPal, etc.
    const paymentResult = {
      success: true,
      transactionId: `demo_${Date.now()}`,
      paymentMethod,
      amount: booking.price,
      timestamp: new Date().toISOString(),
    }

    // Update booking payment status
    const updatedBooking = await db.booking.update({
      where: { id: resolvedParams.id },
      data: {
        paymentStatus: "paid",
        paymentMethod,
        status: booking.status === "pending" ? "confirmed" : booking.status,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      booking: updatedBooking,
      payment: paymentResult,
      message: "Payment processed successfully (demo mode)",
    })
  } catch (error) {
    console.error("Process payment error:", error)
    return NextResponse.json({ error: "Failed to process payment" }, { status: 500 })
  }
}

