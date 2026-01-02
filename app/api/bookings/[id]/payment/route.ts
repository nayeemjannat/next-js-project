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
    const newStatus = booking.status === "pending" ? "confirmed" : booking.status
    const updatedBooking = await db.booking.update({
      where: { id: resolvedParams.id },
      data: {
        paymentStatus: "paid",
        paymentMethod,
        status: newStatus,
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

    // If booking is confirmed, block the time slot
    if (newStatus === "confirmed" && booking.status !== "confirmed") {
      const dateStr = formatDateString(booking.scheduledDate)
      await blockTimeSlot(
        booking.providerId,
        dateStr,
        booking.scheduledTime
      )
    }

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
      // Create schedule if it doesn't exist
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

    // Check if already blocked
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

