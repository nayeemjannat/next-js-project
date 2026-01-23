import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword, verifyPassword } from "@/lib/auth-utils"
import { getSession } from "@/lib/session"
import { verifyGoogleToken } from "@/lib/google-oauth"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { password, currentPassword, googleCode } = body

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Invalid password (min 6 chars)" }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: session.userId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // If user does not have a password yet, allow setting password when the session belongs to the same email
    if (!user.hasPassword) {
      if (!session.email || session.email.toLowerCase() !== user.email.toLowerCase()) {
        // If session email does not match, require explicit Google re-auth (googleCode)
        if (!googleCode) {
          return NextResponse.json({ error: "Google re-auth required to set password" }, { status: 401 })
        }

        // Verify Google code and ensure the token belongs to this user
        const googleUser = await verifyGoogleToken(googleCode)
        if (!googleUser || googleUser.email.toLowerCase() !== user.email.toLowerCase()) {
          return NextResponse.json({ error: "Google re-auth failed" }, { status: 401 })
        }
      }
    } else {
      // User has a password already — require currentPassword to change it
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password required to change password" }, { status: 401 })
      }

      const ok = await verifyPassword(currentPassword, user.password ?? "")
      if (!ok) {
        return NextResponse.json({ error: "Current password incorrect" }, { status: 401 })
      }
    }

    const hashed = await hashPassword(password)
    await db.user.update({ where: { id: user.id }, data: { password: hashed, hasPassword: true, authMethod: user.provider ? "both" : "email" } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Set password error:", error)
    return NextResponse.json({ error: "Failed to set password" }, { status: 500 })
  }
}
