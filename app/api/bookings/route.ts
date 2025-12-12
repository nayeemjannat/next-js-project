import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/bookings - Get bookings (filtered by user type)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const userType = searchParams.get("userType") // "customer" | "provider"
    const status = searchParams.get("status")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const where: any = {}
    if (userType === "customer") {
      where.customerId = userId
    } else if (userType === "provider") {
      where.providerId = userId
    }

    if (status) {
      where.status = status
    }

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
      orderBy: { scheduledDate: "desc" },
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

