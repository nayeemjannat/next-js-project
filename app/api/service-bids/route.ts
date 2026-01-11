import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/service-bids - list or fetch
// POST /api/service-bids - create a new service bid (customer)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const userType = searchParams.get("userType") // customer | provider | admin
    const status = searchParams.get("status") // e.g., OPEN
    const category = searchParams.get("category")

    const where: any = {}
    if (status) where.status = status
    if (category) where.serviceCategory = category

    if (userId && userType === "customer") {
      where.customerId = userId
      const bids = await db.serviceBid.findMany({
        where,
        include: {
          providerBids: {
            include: {
              provider: { select: { id: true, name: true, avatar: true, isVerified: true } },
            },
            orderBy: { createdAt: "desc" },
          },
          customer: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: "desc" },
      })
      // fetch bookings for this customer so we can map any booking created from a bid
      const bookings = await db.booking.findMany({ where: { customerId: userId } })

      const bidsWithBooking = bids.map((b) => {
        const related = bookings.find((bk) => bk.notes && bk.notes.includes(b.id))
        return { ...b, booking: related || null }
      })
      return NextResponse.json({ bids: bidsWithBooking })
    }

    if (userId && userType === "provider") {
      // Providers see open bids; optional filters applied
      const openWhere = { ...where, status: "OPEN" }
      const bids = await db.serviceBid.findMany({
        where: openWhere,
        include: {
          customer: { select: { id: true, name: true, avatar: true, location: true } },
          providerBids: { select: { id: true, providerId: true, price: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
      })
      return NextResponse.json({ bids })
    }

    // Admin or public: return all
    const bids = await db.serviceBid.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        providerBids: { include: { provider: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ bids })
  } catch (error) {
    console.error("Get service bids error:", error)
    return NextResponse.json({ error: "Failed to fetch service bids" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, serviceCategory, description, budgetMin, budgetMax, deadline, address, city, state, zipCode } = body

    if (!customerId || !serviceCategory) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Ensure customer exists
    const customer = await db.user.findUnique({ where: { id: customerId } })
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 })

    const bid = await db.serviceBid.create({
      data: {
        customerId,
        serviceCategory,
        description: description || null,
        budgetMin: budgetMin !== undefined ? Number(budgetMin) : null,
        budgetMax: budgetMax !== undefined ? Number(budgetMax) : null,
        address: address || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        deadline: deadline ? new Date(deadline) : null,
        status: "OPEN",
      },
    })

    return NextResponse.json({ bid }, { status: 201 })
  } catch (error) {
    console.error("Create service bid error:", error)
    return NextResponse.json({ error: "Failed to create service bid" }, { status: 500 })
  }
}
