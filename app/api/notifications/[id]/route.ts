import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const notif = await db.notification.findUnique({ where: { id } })
    if (!notif) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 })
    console.log(`GET /api/notifications/${id} -> isRead=${notif.isRead}`)
    return NextResponse.json({ ok: true, notification: notif })
  } catch (error) {
    console.error("GET /api/notifications/[id] error", error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log("PUT /api/notifications params:", params)
    let id = params.id
    if (!id) {
      // Try to extract id from the raw request URL as a fallback
      try {
        const url = new URL(request.url)
        const parts = url.pathname.split("/").filter(Boolean)
        id = parts.length > 0 ? parts[parts.length - 1] : undefined
        console.log("PUT /api/notifications extracted id from URL:", id)
      } catch (e) {
        console.error("Failed to parse request.url for id", e)
      }
    }

    if (!id) {
      console.error("PUT /api/notifications missing id param", params)
      return NextResponse.json({ ok: false, error: "Missing id param" }, { status: 400 })
    }
    const body = await request.json()
    console.log(`PUT /api/notifications/${id} body:`, body)
    // Support mark read/unread
    const data: any = {}
    if (typeof body.isRead === "boolean") data.isRead = body.isRead

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ ok: false, error: "No fields to update" }, { status: 400 })
    }

    let notification
    try {
      notification = await db.notification.update({ where: { id }, data })
    } catch (e: any) {
      // Prisma throws when record not found
      if (e?.code === 'P2025' || /Record to update not found/.test(String(e?.message || '')) ) {
        return NextResponse.json({ ok: false, error: 'Notification not found' }, { status: 404 })
      }
      throw e
    }

    console.log(`Updated notification ${id} isRead=${notification.isRead}`)

    return NextResponse.json({ ok: true, notification })
  } catch (error) {
    console.error("PUT /api/notifications/[id] error", error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    await db.notification.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("DELETE /api/notifications/[id] error", error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
