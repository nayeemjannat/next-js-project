import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    // Verify session token in database
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        avatar: true,
        phone: true,
        isVerified: true,
        verificationStatus: true,
        verifiedAt: true,
        rejectionReason: true,
        createdAt: true,
        updatedAt: true,
        sessionToken: true,
        provider: true,
        authMethod: true,
        hasPassword: true,
        googleId: true,
        emailVerified: true,
      },
    })

    if (!user || user.sessionToken !== (await request.cookies.get("session")?.value)) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    // Return user data without password
    return NextResponse.json({
      user: {
        ...user,
        authMethod: user.authMethod || user.provider || null,
        hasPassword: typeof user.hasPassword === "boolean" ? user.hasPassword : !!(user as any).password,
        googleId: (user as any).googleId || null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        verifiedAt: user.verifiedAt?.toISOString() || null,
        provider: user.provider || null,
        emailVerified: user.emailVerified || false,
      },
    })
  } catch (error) {
    console.error("Session check error:", error)
    return NextResponse.json({ user: null }, { status: 401 })
  }
}

