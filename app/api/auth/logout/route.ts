import { NextRequest, NextResponse } from "next/server"
import { deleteSessionCookie, getSession } from "@/lib/session"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (session) {
      // Clear session token from database
      await db.user.update({
        where: { id: session.userId },
        data: { sessionToken: null },
      })
    }

    // Delete session cookie
    await deleteSessionCookie()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    // Still try to delete cookie even if database update fails
    await deleteSessionCookie()
    return NextResponse.json({ success: true })
  }
}

