import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/bookings/[id] - Get a single booking
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const booking = await db.booking.findUnique({
      where: { id: resolvedParams.id },
      include: {
        service: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            phone: true,
          },
        },
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            phone: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error("Get booking error:", error)
    return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 })
  }
}

// PUT /api/bookings/[id] - Update booking status
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const body = await request.json()
    const { status, paymentStatus, paymentMethod } = body

    // Get current booking to check status change
    const currentBooking = await db.booking.findUnique({
      where: { id: resolvedParams.id },
    })

    if (!currentBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (paymentStatus) updateData.paymentStatus = paymentStatus
    if (paymentMethod) updateData.paymentMethod = paymentMethod
    if (status === "completed") updateData.completedAt = new Date()

    const booking = await db.booking.update({
      where: { id: resolvedParams.id },
      data: updateData,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            image: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    // If booking is confirmed, block the time slot
    if (status === "confirmed" && currentBooking.status !== "confirmed") {
      const dateStr = formatDateString(currentBooking.scheduledDate)
      await blockTimeSlot(
        currentBooking.providerId,
        dateStr,
        currentBooking.scheduledTime
      )
    }

    // If booking is cancelled and was confirmed, unblock the time slot
    if (status === "cancelled" && currentBooking.status === "confirmed") {
      const dateStr = formatDateString(currentBooking.scheduledDate)
      await unblockTimeSlot(
        currentBooking.providerId,
        dateStr,
        currentBooking.scheduledTime
      )
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error("Update booking error:", error)
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 })
  }
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

// Helper function to format date string without timezone conversion
function formatDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

// Helper function to unblock a time slot
async function unblockTimeSlot(providerId: string, date: string, time: string) {
  try {
    const schedule = await db.providerSchedule.findUnique({
      where: { providerId },
    })

    if (schedule && schedule.blockedTimeSlots) {
      const blockedSlots = JSON.parse(schedule.blockedTimeSlots)
      const slotKey = `${date}|${time}`

      const updatedSlots = blockedSlots.filter(
        (slot: { date: string; time: string }) => `${slot.date}|${slot.time}` !== slotKey
      )

      await db.providerSchedule.update({
        where: { providerId },
        data: {
          blockedTimeSlots: JSON.stringify(updatedSlots),
        },
      })
    }
  } catch (error) {
    console.error("Error unblocking time slot:", error)
  }
}

