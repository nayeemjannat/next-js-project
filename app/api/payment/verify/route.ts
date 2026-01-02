import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// Helper function to format date string without timezone conversion
function formatDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

// Helper function to block a time slot
async function blockTimeSlot(providerId: string, date: string, time: string) {
  try {
    let schedule = await db.providerSchedule.findUnique({
      where: { providerId },
    })

    if (!schedule) {
      const defaultHours = {
        monday: { start: "09:00", end: "17:00", enabled: true },
        tuesday: { start: "09:00", end: "17:00", enabled: true },
        wednesday: { start: "09:00", end: "17:00", enabled: true },
        thursday: { start: "09:00", end: "17:00", enabled: true },
        friday: { start: "09:00", end: "17:00", enabled: true },
        saturday: { start: "09:00", end: "17:00", enabled: false },
        sunday: { start: "09:00", end: "17:00", enabled: false },
      }

      schedule = await db.providerSchedule.create({
        data: {
          providerId,
          workingHours: JSON.stringify(defaultHours),
          blockedDates: JSON.stringify([]),
          blockedTimeSlots: JSON.stringify([]),
        },
      })
    }

    const blockedSlots = schedule.blockedTimeSlots ? JSON.parse(schedule.blockedTimeSlots) : []
    const slotKey = `${date}|${time}`

    if (!blockedSlots.some((slot: { date: string; time: string }) => `${slot.date}|${slot.time}` === slotKey)) {
      blockedSlots.push({ date, time })

      await db.providerSchedule.update({
        where: { providerId },
        data: {
          blockedTimeSlots: JSON.stringify(blockedSlots),
        },
      })
    }
  } catch (error) {
    console.error("Error blocking time slot:", error)
  }
}

// GET /api/payment/verify?transactionId=xxx - Verify payment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get("transactionId")

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 })
    }

    const payment = await db.payment.findFirst({
      where: { transactionId },
      include: { booking: true },
    })

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // If payment is already PAID, return success
    if (payment.status === "PAID") {
      return NextResponse.json({
        verified: true,
        payment,
        booking: payment.booking,
      })
    }

    // Check if bookingId is provided in query (from success page)
    const bookingId = searchParams.get("bookingId")

    // For SSLCommerz, verify payment status
    // In production, you'd call SSLCommerz verification API
    // For now, if status is PENDING and we're in dummy/sandbox mode, mark as paid
    const paymentMode = process.env.PAYMENT_MODE || "sandbox"

    if ((paymentMode === "dummy" || paymentMode === "sandbox") && payment.status === "PENDING") {
      await db.payment.update({
        where: { id: payment.id },
        data: { status: "PAID" },
      })

      const updatedBooking = await db.booking.update({
        where: { id: payment.bookingId },
        data: {
          paymentStatus: "paid",
          paymentMethod: payment.method,
          status: payment.booking.status === "pending" ? "confirmed" : payment.booking.status,
        },
      })

      // Block time slot if booking is confirmed
      if (updatedBooking.status === "confirmed") {
        const dateStr = formatDateString(updatedBooking.scheduledDate)
        await blockTimeSlot(updatedBooking.providerId, dateStr, updatedBooking.scheduledTime)
      }

      return NextResponse.json({
        verified: true,
        payment: { ...payment, status: "PAID" },
        booking: updatedBooking,
      })
    }

    return NextResponse.json({
      verified: payment.status === "PAID",
      payment,
      booking: payment.booking,
    })
  } catch (error) {
    console.error("Verify payment error:", error)
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 })
  }
}

