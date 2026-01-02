import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/bookings - Get bookings (filtered by user type)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const userType = searchParams.get("userType") // "customer" | "provider" | "admin"
    const status = searchParams.get("status")
    const sortBy = searchParams.get("sortBy") || "date_desc"

    const where: any = {}
    // If userId is provided, filter by user
    if (userId && userType) {
      if (userType === "customer") {
        where.customerId = userId
      } else if (userType === "provider") {
        where.providerId = userId
      }
    }
    // If no userId, return all bookings (for admin)

    if (status) {
      where.status = status
    }

    // Build orderBy based on sortBy parameter
    let orderBy: any = { createdAt: "desc" }
    if (sortBy === "date_asc") orderBy = { createdAt: "asc" }
    if (sortBy === "date_desc") orderBy = { createdAt: "desc" }
    if (sortBy === "price_asc") orderBy = { price: "asc" }
    if (sortBy === "price_desc") orderBy = { price: "desc" }
    if (sortBy === "status") orderBy = { status: "asc" }

    const bookings = await db.booking.findMany({
      where,
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
      orderBy,
    })

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error("Get bookings error:", error)
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
  }
}

// POST /api/bookings - Create a new booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerId,
      providerId,
      serviceId,
      scheduledDate,
      scheduledTime,
      address,
      city,
      state,
      zipCode,
      notes,
      price,
    } = body

    // Validate required fields
    if (!customerId || !providerId || !serviceId || !scheduledDate || !scheduledTime || !address || !price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify service exists
    const service = await db.service.findUnique({
      where: { id: serviceId },
    })

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    // Verify customer and provider exist
    const [customer, provider] = await Promise.all([
      db.user.findUnique({ where: { id: customerId } }),
      db.user.findUnique({ where: { id: providerId } }),
    ])

    if (!customer || !provider) {
      return NextResponse.json({ error: "Customer or provider not found" }, { status: 404 })
    }

    // Check provider availability
    // Use scheduledDate directly to avoid timezone issues (it should be in YYYY-MM-DD format)
    const dateStr = scheduledDate
    const bookingDate = new Date(scheduledDate + "T00:00:00")
    const schedule = await db.providerSchedule.findUnique({
      where: { providerId },
    })

    if (schedule) {
      const workingHours = JSON.parse(schedule.workingHours)
      const blockedDates = schedule.blockedDates ? JSON.parse(schedule.blockedDates) : []
      const blockedTimeSlots = schedule.blockedTimeSlots ? JSON.parse(schedule.blockedTimeSlots) : []

      // Check if date is blocked
      if (blockedDates.includes(dateStr)) {
        return NextResponse.json(
          { error: "Provider is not available on this date" },
          { status: 400 }
        )
      }

      // Check if provider works on this day
      const dayName = bookingDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
      const daySchedule = workingHours[dayName]
      if (!daySchedule || !daySchedule.enabled) {
        return NextResponse.json(
          { error: "Provider does not work on this day" },
          { status: 400 }
        )
      }

      // Check if time slot is within working hours
      const [timeStr, period] = scheduledTime.toUpperCase().split(" ")
      const [hour, min] = timeStr.split(":").map(Number)
      let hour24 = hour
      if (period === "PM" && hour !== 12) hour24 += 12
      if (period === "AM" && hour === 12) hour24 = 0
      const bookingTime = `${hour24.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`

      if (bookingTime < daySchedule.start || bookingTime >= daySchedule.end) {
        return NextResponse.json(
          { error: "Selected time is outside provider's working hours" },
          { status: 400 }
        )
      }

      // Check if time slot is blocked
      const isTimeSlotBlocked = blockedTimeSlots.some(
        (slot: { date: string; time: string }) => slot.date === dateStr && slot.time === scheduledTime
      )
      if (isTimeSlotBlocked) {
        return NextResponse.json(
          { error: "This time slot is blocked by the provider" },
          { status: 400 }
        )
      }
    }

    // Check for conflicting bookings
    const startOfDay = new Date(bookingDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(bookingDate)
    endOfDay.setHours(23, 59, 59, 999)

    const conflictingBooking = await db.booking.findFirst({
      where: {
        providerId,
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        scheduledTime,
        status: {
          notIn: ["cancelled"],
        },
      },
    })

    if (conflictingBooking) {
      return NextResponse.json(
        { error: "This time slot is already booked" },
        { status: 400 }
      )
    }

    // Create booking
    const booking = await db.booking.create({
      data: {
        customerId,
        providerId,
        serviceId,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        address,
        city,
        state,
        zipCode,
        notes,
        price: parseFloat(price),
        status: "pending",
        paymentStatus: "pending",
      },
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

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    console.error("Create booking error:", error)
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
  }
}

