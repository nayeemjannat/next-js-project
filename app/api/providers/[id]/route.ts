import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/providers/[id] - Get public provider profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const providerId = resolvedParams.id

    if (!providerId) {
      return NextResponse.json({ error: "Provider ID is required" }, { status: 400 })
    }

    const provider = await db.user.findUnique({
      where: { 
        id: providerId,
        userType: "provider"
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        phone: true,
        bio: true,
        experience: true,
        location: true,
        specialties: true,
        isVerified: true,
        verificationStatus: true,
        createdAt: true,
      },
    })

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 })
    }

    return NextResponse.json({ provider })
  } catch (error) {
    console.error("Get provider error:", error)
    return NextResponse.json({ error: "Failed to fetch provider" }, { status: 500 })
  }
}
