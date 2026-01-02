import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/payment/by-booking?bookingId=xxx - Get payment by booking ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get("bookingId")

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 })
    }

    const payment = await db.payment.findUnique({
      where: { bookingId },
    })

    return NextResponse.json({ payment })
  } catch (error) {
    console.error("Get payment by booking error:", error)
    return NextResponse.json({ error: "Failed to fetch payment" }, { status: 500 })
  }
}

