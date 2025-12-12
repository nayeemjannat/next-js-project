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

    return NextResponse.json({ booking })
  } catch (error) {
    console.error("Update booking error:", error)
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 })
  }
}

