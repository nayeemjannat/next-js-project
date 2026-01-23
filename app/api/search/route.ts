import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const q = (url.searchParams.get("q") || "").trim()
    const userId = url.searchParams.get("userId")
    const userType = url.searchParams.get("userType")

    if (!q) {
      return NextResponse.json({ ok: true, services: [], providers: [], bookings: [], users: [] })
    }

    // Search services
    const services = await db.service.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 10,
    })

    // Search providers (users with userType === 'provider')
    const providers = await db.user.findMany({
      where: {
        userType: "provider",
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { bio: { contains: q, mode: "insensitive" } },
          { specialties: { contains: q, mode: "insensitive" } },
          { location: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 10,
      select: { id: true, name: true, avatar: true, bio: true, specialties: true, location: true },
    })

    // Search bookings depending on role
    const bookingWhere: any = {
      OR: [
        { id: { contains: q } },
        { service: { is: { name: { contains: q, mode: "insensitive" } } } },
        { provider: { is: { name: { contains: q, mode: "insensitive" } } } },
      ],
    }
    if (userType === "customer" && userId) bookingWhere.customerId = userId
    else if (userType === "provider" && userId) bookingWhere.providerId = userId
    // admin or others get access to all matching bookings

    const bookings = await db.booking.findMany({
      where: bookingWhere,
      include: { service: true, provider: true, customer: true },
      take: 10,
    })

    // Users search (admin-only)
    let users: any[] = []
    if (userType === "admin") {
      users = await db.user.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 10,
        select: { id: true, name: true, email: true, userType: true },
      })
    }

    return NextResponse.json({ ok: true, services, providers, bookings, users })
  } catch (error) {
    console.error("GET /api/search error", error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
