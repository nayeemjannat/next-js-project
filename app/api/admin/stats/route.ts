import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/admin/stats - Get admin dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Get total users (customers)
    const totalUsers = await db.user.count({
      where: { userType: "customer" },
    })

    // Get active providers (verified)
    const activeProviders = await db.user.count({
      where: { userType: "provider", isVerified: true },
    })

    // Get completed bookings
    const completedBookings = await db.booking.count({
      where: { status: "completed" },
    })

    // Get total revenue (sum of paid bookings)
    const revenueData = await db.booking.aggregate({
      where: {
        paymentStatus: "paid",
      },
      _sum: {
        price: true,
      },
    })

    const totalRevenue = revenueData._sum.price || 0

    // Get recent bookings count (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentBookings = await db.booking.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    })

    // Get pending providers
    const pendingProviders = await db.user.count({
      where: {
        userType: "provider",
        verificationStatus: "pending",
        isVerified: false,
      },
    })

    return NextResponse.json({
      totalUsers,
      activeProviders,
      completedBookings,
      totalRevenue,
      recentBookings,
      pendingProviders,
    })
  } catch (error) {
    console.error("Get admin stats error:", error)
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
  }
}

