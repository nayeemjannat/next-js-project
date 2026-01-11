import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// POST /api/admin/bids/actions - moderator actions: disableBid, suspendProvider
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, providerBidId, providerId } = body

    if (!action) return NextResponse.json({ error: "Action required" }, { status: 400 })

    if (action === "disableBid") {
      if (!providerBidId) return NextResponse.json({ error: "providerBidId required" }, { status: 400 })
      await db.providerBid.update({ where: { id: providerBidId }, data: { status: "REJECTED" } })
      return NextResponse.json({ success: true })
    }

    if (action === "suspendProvider") {
      if (!providerId) return NextResponse.json({ error: "providerId required" }, { status: 400 })
      await db.user.update({ where: { id: providerId }, data: { isVerified: false, verificationStatus: "rejected", rejectionReason: "Suspended by admin" } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (error) {
    console.error("Admin bids action error:", error)
    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 })
  }
}
