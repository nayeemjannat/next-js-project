import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// POST /api/provider-bids/accept - customer accepts a provider bid
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { actorId, actorType, providerBidId } = body

    if (!actorId || !actorType || !providerBidId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Only customers can accept provider bids
    if (actorType !== "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const providerBid = await db.providerBid.findUnique({
      where: { id: providerBidId },
      include: { serviceBid: true, provider: true },
    })

    if (!providerBid) return NextResponse.json({ error: "Provider bid not found" }, { status: 404 })

    // Only the customer who created the serviceBid can accept
    if (providerBid.serviceBid.customerId !== actorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update the chosen bid to ACCEPTED
    await db.providerBid.update({ where: { id: providerBidId }, data: { status: "ACCEPTED" } })

    // Reject all other bids for the same serviceBid
    await db.providerBid.updateMany({
      where: { serviceBidId: providerBid.serviceBidId, id: { not: providerBidId } },
      data: { status: "REJECTED" },
    })

    // Update serviceBid status to ASSIGNED
    await db.serviceBid.update({ where: { id: providerBid.serviceBidId }, data: { status: "ASSIGNED" } })

    // Notify selected provider
    try {
      await db.notification.create({
        data: {
          title: `Your proposal was accepted!`,
          body: `The customer accepted your proposal for the request. Please check your dashboard.`,
          userId: providerBid.providerId,
          userType: "provider",
          link: `/provider/bookings`,
        },
      })
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr)
    }

    // Create a booking record so the flow matches normal bookings.
    try {
      // Instead of attaching an arbitrary existing service (which can be unrelated),
      // create a snapshot Service record representing this ServiceBid so the booking
      // reflects the customer's requested service details (no unrelated images/title).
      const snapshotService = await db.service.create({
        data: {
          providerId: providerBid.providerId,
          name: providerBid.serviceBid.serviceCategory || `Service Request`,
          description: providerBid.serviceBid.description || "",
          category: providerBid.serviceBid.serviceCategory || "general",
          price: providerBid.price || 0,
          priceType: "fixed",
          isActive: false, // keep snapshot hidden from provider's public listings
        },
      })

      const booking = await db.booking.create({
        data: {
          customerId: providerBid.serviceBid.customerId,
          providerId: providerBid.providerId,
          serviceId: snapshotService.id,
          scheduledDate: new Date(),
          scheduledTime: "TBD",
          address: providerBid.serviceBid.address || "",
          city: providerBid.serviceBid.city || null,
          state: providerBid.serviceBid.state || null,
          zipCode: providerBid.serviceBid.zipCode || null,
          // link booking to the bidding flow
          providerBidId: providerBid.id,
          serviceBidId: providerBid.serviceBidId,
          // preserve bid details for clarity
          notes: `serviceBid:${providerBid.serviceBidId}; providerBid:${providerBid.id}; message:${providerBid.message || ''}`,
          price: providerBid.price,
          status: "pending",
          paymentStatus: "pending",
        },
      })

      // notify customer about booking created from accepted bid
      try {
        await db.notification.create({
          data: {
            title: `Booking created from your accepted bid`,
            body: `A booking has been created. Please complete scheduling and payment to confirm.`,
            userId: providerBid.serviceBid.customerId,
            userType: "customer",
            link: `/dashboard/bookings`,
          },
        })
      } catch (notifErr) {
        console.error("Failed to notify customer about booking:", notifErr)
      }
    } catch (bookingErr) {
      console.error("Failed to create booking from accepted bid:", bookingErr)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Accept provider bid error:", error)
    return NextResponse.json({ error: "Failed to accept provider bid" }, { status: 500 })
  }
}
