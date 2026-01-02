import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/provider/profile?providerId=xxx - Get provider profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get("providerId")

    if (!providerId) {
      return NextResponse.json({ error: "Provider ID is required" }, { status: 400 })
    }

    const provider = await db.user.findUnique({
      where: { id: providerId, userType: "provider" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
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
    console.error("Get provider profile error:", error)
    return NextResponse.json({ error: "Failed to fetch provider profile" }, { status: 500 })
  }
}

// PUT /api/provider/profile - Update provider profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { providerId, name, phone, avatar, bio, experience, location, specialties } = body

    if (!providerId) {
      return NextResponse.json({ error: "Provider ID is required" }, { status: 400 })
    }

    // Verify provider exists
    const provider = await db.user.findUnique({
      where: { id: providerId, userType: "provider" },
    })

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 })
    }

    // Update provider profile
    const updatedProvider = await db.user.update({
      where: { id: providerId },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(avatar !== undefined && { avatar }),
        ...(bio !== undefined && { bio }),
        ...(experience !== undefined && { experience: experience ? parseInt(experience) : null }),
        ...(location !== undefined && { location }),
        ...(specialties !== undefined && { specialties }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        bio: true,
        experience: true,
        location: true,
        specialties: true,
        isVerified: true,
        verificationStatus: true,
      },
    })

    return NextResponse.json({ provider: updatedProvider })
  } catch (error) {
    console.error("Update provider profile error:", error)
    return NextResponse.json({ error: "Failed to update provider profile" }, { status: 500 })
  }
}

