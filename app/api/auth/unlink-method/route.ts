import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { verifyPassword } from "@/lib/auth-utils"
import { verifyGoogleToken } from "@/lib/google-oauth"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { method, currentPassword, googleCode } = body
    if (!method || (method !== "google" && method !== "email")) {
      return NextResponse.json({ error: "Invalid method" }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: session.userId } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // Ensure user won't remove their last authentication method
    const hasGoogle = !!user.googleId || user.provider === "google"
    const hasEmail = !!user.password || user.hasPassword
    if ((method === "google" && !hasGoogle) || (method === "email" && !hasEmail)) {
      return NextResponse.json({ error: "Method not enabled" }, { status: 400 })
    }

    // If removing Google, require password re-auth OR Google re-auth depending on what's available
    if (method === "google") {
      // If user has a password, require currentPassword
      if (user.hasPassword) {
        if (!currentPassword) return NextResponse.json({ error: "Current password required" }, { status: 401 })
        const ok = await verifyPassword(currentPassword, user.password ?? "")
        if (!ok) return NextResponse.json({ error: "Current password incorrect" }, { status: 401 })
      } else {
        // No password set — require Google re-auth
        if (!googleCode) return NextResponse.json({ error: "Google re-auth required" }, { status: 401 })
        const g = await verifyGoogleToken(googleCode)
        if (!g || g.email.toLowerCase() !== user.email.toLowerCase()) return NextResponse.json({ error: "Google re-auth failed" }, { status: 401 })
      }

      // Prevent unlinking if it is the only method
      if (!hasEmail) {
        return NextResponse.json({ error: "Cannot unlink the only authentication method" }, { status: 400 })
      }

      await db.user.update({ where: { id: user.id }, data: { provider: null, providerId: null, googleId: null, authMethod: user.hasPassword ? "email" : null } })
      return NextResponse.json({ success: true })
    }

    // Removing email/password method
    if (method === "email") {
      // Require password verification
      if (!currentPassword) return NextResponse.json({ error: "Current password required" }, { status: 401 })
      const ok = await verifyPassword(currentPassword, user.password ?? "")
      if (!ok) return NextResponse.json({ error: "Current password incorrect" }, { status: 401 })

      // Prevent unlinking if it's the only method
      if (!hasGoogle) {
        return NextResponse.json({ error: "Cannot unlink the only authentication method" }, { status: 400 })
      }

      // Do NOT delete the stored password — only disable password-based login while keeping the hashed password for recovery/record.
      await db.user.update({ where: { id: user.id }, data: { hasPassword: false, authMethod: "google" } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Unhandled" }, { status: 400 })
  } catch (error) {
    console.error("Unlink method error:", error)
    return NextResponse.json({ error: "Failed to unlink method" }, { status: 500 })
  }
}
