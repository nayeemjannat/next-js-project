import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, userType } = body

    if (!userId && !userType) return NextResponse.json({ ok: false, error: "Missing userId or userType" }, { status: 400 })

    const where: any = {}
    if (userId) {
      where.OR = [
        { userId },
        { userType: userType ?? null },
        { userType: null },
      ]
    } else if (userType) {
      where.OR = [{ userType }, { userType: null }]
    }

    console.log("mark-all-read where:", JSON.stringify(where))

    const result = await db.notification.updateMany({ where, data: { isRead: true } })

    console.log(`Marked ${result.count} notifications read for userId=${userId} userType=${userType}`)

    return NextResponse.json({ ok: true, count: result.count })
  } catch (error) {
    console.error("POST /api/notifications/mark-all-read error", error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
