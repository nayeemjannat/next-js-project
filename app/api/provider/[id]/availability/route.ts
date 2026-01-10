import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/provider/[id]/availability?date=YYYY-MM-DD - Get provider availability for a specific date
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get("date")
    
    const resolvedParams = await Promise.resolve(params)
    const providerId = resolvedParams.id

    if (!providerId) {
      return NextResponse.json({ error: "Provider ID is required" }, { status: 400 })
    }

    // Get provider schedule
    const schedule = await db.providerSchedule.findUnique({
      where: { providerId },
    })

    if (!schedule) {
      // Return default availability if no schedule set
      return NextResponse.json({
        available: true,
        availableSlots: [],
        message: "Provider has not set their schedule yet",
      })
    }

    const workingHours = JSON.parse(schedule.workingHours)
    const blockedDates = schedule.blockedDates ? JSON.parse(schedule.blockedDates) : []
    const blockedTimeSlots = schedule.blockedTimeSlots ? JSON.parse(schedule.blockedTimeSlots) : []

    // Debug: Log the working hours structure
    console.log("Provider working hours:", workingHours)
    
    // Test day name mapping
    const testDate = new Date()
    const testDayName = testDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
    console.log("Test day name mapping:", { date: testDate.toDateString(), dayName: testDayName })

    // If date is provided, check specific date availability
    if (dateParam) {
      // Use the dateParam directly to avoid timezone issues
      const dateStr = dateParam
      const selectedDate = new Date(dateParam + "T00:00:00")
      
      // Get day name in consistent format (lowercase)
      const dayName = selectedDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
      
      console.log("Checking availability for:", { dateStr, dayName, workingHours })
      
      // Check if date is blocked
      if (blockedDates.includes(dateStr)) {
        return NextResponse.json({
          available: false,
          availableSlots: [],
          message: "Provider is not available on this date",
        })
      }

      // Check if provider works on this day
      const daySchedule = workingHours[dayName]
      console.log("Day schedule:", { dayName, daySchedule })
      
      if (!daySchedule || !daySchedule.enabled) {
        return NextResponse.json({
          available: false,
          availableSlots: [],
          message: `Provider does not work on ${dayName}`,
        })
      }

      // Get existing bookings for this date
      const startOfDay = new Date(selectedDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(selectedDate)
      endOfDay.setHours(23, 59, 59, 999)

      const existingBookings = await db.booking.findMany({
        where: {
          providerId,
          scheduledDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: {
            notIn: ["cancelled"],
          },
        },
        select: {
          scheduledTime: true,
        },
      })

      // Filter blocked time slots for this date
      const blockedSlotsForDate = blockedTimeSlots
        .filter((slot: { date: string; time: string }) => slot.date === dateStr)
        .map((slot: { date: string; time: string }) => slot.time)

      // Generate available time slots
      const slots = generateTimeSlots(daySchedule.start, daySchedule.end, existingBookings, blockedSlotsForDate)

      // Get booked time slots for display
      const bookedSlots = existingBookings.map((b) => {
        // Convert to 12-hour format if needed
        const timeStr = b.scheduledTime.toUpperCase()
        if (timeStr.includes("AM") || timeStr.includes("PM")) {
          return b.scheduledTime
        } else {
          // Convert 24-hour to 12-hour format
          const [hour, min] = timeStr.split(":").map(Number)
          const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
          const period = hour < 12 ? "AM" : "PM"
          return `${hour12}:${min.toString().padStart(2, "0")} ${period}`
        }
      })

      return NextResponse.json({
        available: true,
        availableSlots: slots,
        bookedSlots: bookedSlots,
        workingHours: {
          start: daySchedule.start,
          end: daySchedule.end,
        },
      })
    }

    // If no date provided, return general schedule info
    return NextResponse.json({
      schedule: {
        workingHours,
        blockedDates,
        blockedTimeSlots,
      },
    })
  } catch (error) {
    console.error("Get provider availability error:", error)
    return NextResponse.json({ error: "Failed to get availability" }, { status: 500 })
  }
}

// Helper function to generate time slots
function generateTimeSlots(
  startTime: string,
  endTime: string,
  existingBookings: { scheduledTime: string }[],
  blockedTimeSlots: string[] = []
): string[] {
  const slots: string[] = []
  const [startHour, startMin] = startTime.split(":").map(Number)
  const [endHour, endMin] = endTime.split(":").map(Number)

  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  // Create 30-minute slots
  const slotDuration = 30
  const bookedTimes = existingBookings.map((b) => {
    // Convert "10:00 AM" or "10:00" format to minutes
    const timeStr = b.scheduledTime.toUpperCase()
    if (timeStr.includes("AM") || timeStr.includes("PM")) {
      const [time, period] = timeStr.split(" ")
      const [hour, min] = time.split(":").map(Number)
      let hour24 = hour
      if (period === "PM" && hour !== 12) hour24 += 12
      if (period === "AM" && hour === 12) hour24 = 0
      return hour24 * 60 + min
    } else {
      const [hour, min] = timeStr.split(":").map(Number)
      return hour * 60 + min
    }
  })

  // Convert blocked time slots to minutes
  const blockedTimes = blockedTimeSlots.map((timeStr) => {
    const time = timeStr.toUpperCase()
    if (time.includes("AM") || time.includes("PM")) {
      const [timePart, period] = time.split(" ")
      const [hour, min] = timePart.split(":").map(Number)
      let hour24 = hour
      if (period === "PM" && hour !== 12) hour24 += 12
      if (period === "AM" && hour === 12) hour24 = 0
      return hour24 * 60 + min
    } else {
      const [hour, min] = time.split(":").map(Number)
      return hour * 60 + min
    }
  })

  for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
    const hour = Math.floor(minutes / 60)
    const min = minutes % 60
    const time24 = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`
    
    // Convert to 12-hour format
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    const period = hour < 12 ? "AM" : "PM"
    const time12 = `${hour12}:${min.toString().padStart(2, "0")} ${period}`

    // Check if this slot is already booked
    const isBooked = bookedTimes.some(
      (booked) => Math.abs(booked - minutes) < slotDuration
    )

    // Check if this slot is blocked
    const isBlocked = blockedTimes.some(
      (blocked) => Math.abs(blocked - minutes) < slotDuration
    )

    if (!isBooked && !isBlocked) {
      slots.push(time12)
    }
  }

  return slots
}

