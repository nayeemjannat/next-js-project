import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// POST /api/provider-bids - submit a provider bid
// GET /api/provider-bids - list bids (by providerId or serviceBidId)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { providerId, serviceBidId, price, message, estimatedTime } = body

    if (!providerId || !serviceBidId || price === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const [provider, serviceBid] = await Promise.all([
      db.user.findUnique({ where: { id: providerId } }),
      db.serviceBid.findUnique({ where: { id: serviceBidId } }),
    ])

    if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 })
    if (!serviceBid) return NextResponse.json({ error: "Service request not found" }, { status: 404 })

    // Prevent bidding after deadline
    if (serviceBid.deadline && new Date() > new Date(serviceBid.deadline)) {
      return NextResponse.json({ error: "Bidding deadline has passed" }, { status: 400 })
    }

    // Prevent duplicate bids by same provider for same serviceBid
    const existing = await db.providerBid.findFirst({ where: { providerId, serviceBidId } })
    if (existing) return NextResponse.json({ error: "You have already submitted a bid for this request" }, { status: 400 })

    const bid = await db.providerBid.create({
      data: {
        providerId,
        serviceBidId,
        price: Number(price),
        message: message || null,
        estimatedTime: estimatedTime !== undefined ? Number(estimatedTime) : null,
        status: "PENDING",
      },
      include: { provider: { select: { id: true, name: true, avatar: true } } },
    })

    // Notify customer about new proposal
    try {
      await db.notification.create({
        data: {
          title: `New proposal for your service request`,
          body: `${bid.provider.name} submitted a proposal for your request`,
          userId: serviceBid.customerId,
          userType: "customer",
          // Redirect to service-bids list and open the detail dialog via query param
          link: `/dashboard/service-bids?bidId=${serviceBid.id}`,
        },
      })
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr)
    }

    return NextResponse.json({ bid }, { status: 201 })
  } catch (error) {
    console.error("Submit provider bid error:", error)
    return NextResponse.json({ error: "Failed to submit provider bid" }, { status: 500 })
  }
}

// PUT /api/provider-bids - update an existing provider bid
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { bidId, providerId, price, message, estimatedTime } = body

    if (!bidId || !providerId || price === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const existing = await db.providerBid.findUnique({ where: { id: bidId } })
    if (!existing) return NextResponse.json({ error: "Bid not found" }, { status: 404 })

    if (existing.providerId !== providerId) {
      return NextResponse.json({ error: "Not authorized to edit this bid" }, { status: 403 })
    }

    const updated = await db.providerBid.update({
      where: { id: bidId },
      data: {
        price: Number(price),
        message: message || null,
        estimatedTime: estimatedTime !== undefined ? Number(estimatedTime) : null,
        // keep status as-is (still PENDING) when editing
      },
      include: { provider: { select: { id: true, name: true, avatar: true } } },
    })

    return NextResponse.json({ bid: updated })
  } catch (error) {
    console.error("Update provider bid error:", error)
    return NextResponse.json({ error: "Failed to update provider bid" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get("providerId")
    const serviceBidId = searchParams.get("serviceBidId")

    const where: any = {}
    if (providerId) where.providerId = providerId
    if (serviceBidId) where.serviceBidId = serviceBidId

    const bids = await db.providerBid.findMany({
      where,
      include: {
        provider: { select: { id: true, name: true, avatar: true } },
        serviceBid: { select: { id: true, customerId: true, serviceCategory: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ bids })
  } catch (error) {
    console.error("Get provider bids error:", error)
    return NextResponse.json({ error: "Failed to fetch provider bids" }, { status: 500 })
  }
}
