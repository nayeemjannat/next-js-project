import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/admin/users - Get all users (customers)
export async function GET(request: NextRequest) {
  try {
    const users = await db.user.findMany({
      where: { userType: "customer" },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        userType: true,
        createdAt: true,
        _count: {
          select: {
            bookingsAsCustomer: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const usersWithCounts = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      userType: user.userType,
      createdAt: user.createdAt,
      bookingsCount: user._count.bookingsAsCustomer,
    }))

    return NextResponse.json({ users: usersWithCounts })
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

