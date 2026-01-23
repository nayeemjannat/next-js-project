import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/user/profile?userId=xxx - Get user profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        userType: true,
        bio: true,
        experience: true,
        location: true,
        specialties: true,
        createdAt: true,
        provider: true,
        authMethod: true,
        hasPassword: true,
        googleId: true,
        emailVerified: true,
        password: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Do not return password; expose only a boolean indicating if password exists
    const safeUser = {
      ...user,
      // Prefer explicit DB field `hasPassword` if available, otherwise infer from password
      hasPassword: typeof user?.hasPassword === "boolean" ? user.hasPassword : !!user?.password,
    }
    // remove password field from payload if present
    if ((safeUser as any).password) delete (safeUser as any).password

    return NextResponse.json({ user: safeUser })
  } catch (error) {
    console.error("Get user profile error:", error)
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
  }
}

// PUT /api/user/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, phone, avatar, bio, address } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (avatar !== undefined) updateData.avatar = avatar
    if (bio !== undefined) updateData.bio = bio

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        userType: true,
        bio: true,
        provider: true,
        emailVerified: true,
      },
    })

    // Handle address separately (if provided, update or create default address)
    if (address !== undefined && address.trim()) {
      // For customers, we can store address in Address table
      // For simplicity, we'll just store it as a note for now
      // In a full implementation, you'd want to parse and store structured address
    }

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Update user profile error:", error)
    return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 })
  }
}


