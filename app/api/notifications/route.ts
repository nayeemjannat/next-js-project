import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId")
    const userType = url.searchParams.get("userType")
    const limit = parseInt(url.searchParams.get("limit") || "50", 10)

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

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    const unreadCount = await db.notification.count({
      where: { ...(where || {}), isRead: false },
    })

    return NextResponse.json({ ok: true, notifications, unreadCount })
  } catch (error) {
    console.error("GET /api/notifications error", error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, body: text, userId, userType, data, link } = body

    if (!title) return NextResponse.json({ ok: false, error: "Missing title" }, { status: 400 })

    const notification = await db.notification.create({
      data: {
        title,
        body: text || null,
        userId: userId || null,
        userType: userType || null,
        data: data || null,
        link: link || null,
      },
    })

    return NextResponse.json({ ok: true, notification })
  } catch (error) {
    console.error("POST /api/notifications error", error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
