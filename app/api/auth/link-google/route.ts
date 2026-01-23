import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { verifyGoogleToken } from "@/lib/google-oauth"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { code } = body
    if (!code) {
      return NextResponse.json({ error: "Missing Google code" }, { status: 400 })
    }

    const googleUser = await verifyGoogleToken(code)
    if (!googleUser || !googleUser.email) {
      return NextResponse.json({ error: "Google verification failed" }, { status: 401 })
    }

    // Ensure the Google account email matches the signed-in user's email
    if (googleUser.email.toLowerCase() !== session.email.toLowerCase()) {
      return NextResponse.json({ error: "Google account email does not match your account" }, { status: 409 })
    }

    // Prevent linking if another user already uses this Google account
    const other = await db.user.findFirst({ where: { googleId: googleUser.id, id: { not: session.userId } } })
    if (other) {
      return NextResponse.json({ error: "This Google account is already linked to another user" }, { status: 409 })
    }

    // Link Google to current user
    await db.user.update({ where: { id: session.userId }, data: { provider: "google", providerId: googleUser.id, googleId: googleUser.id, emailVerified: true, authMethod: "both" } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Link Google error:", error)
    return NextResponse.json({ error: "Failed to link Google account" }, { status: 500 })
  }
}
