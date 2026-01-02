import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/admin/analytics - Get analytics data
export async function GET(request: NextRequest) {
  try {
    // Get totals
    const totalUsers = await db.user.count({ where: { userType: "customer" } })
    const totalProviders = await db.user.count({ where: { userType: "provider" } })
    const totalBookings = await db.booking.count()

    // Get total revenue
    const revenueData = await db.booking.aggregate({
      where: { paymentStatus: "paid" },
      _sum: { price: true },
    })
    const totalRevenue = revenueData._sum.price || 0

    // Get last 6 months data
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyData: { [key: string]: { users: number; providers: number; bookings: number; revenue: number } } = {}

    // Get users by month
    const users = await db.user.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, userType: true },
    })

    users.forEach((user) => {
      const date = new Date(user.createdAt)
      const monthKey = date.toLocaleDateString("en-US", { month: "short" })
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { users: 0, providers: 0, bookings: 0, revenue: 0 }
      }
      if (user.userType === "customer") {
        monthlyData[monthKey].users++
      } else if (user.userType === "provider") {
        monthlyData[monthKey].providers++
      }
    })

    // Get bookings by month
    const bookings = await db.booking.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, price: true, paymentStatus: true },
    })

    bookings.forEach((booking) => {
      const date = new Date(booking.createdAt)
      const monthKey = date.toLocaleDateString("en-US", { month: "short" })
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { users: 0, providers: 0, bookings: 0, revenue: 0 }
      }
      monthlyData[monthKey].bookings++
      if (booking.paymentStatus === "paid") {
        monthlyData[monthKey].revenue += booking.price
      }
    })

    // Convert to array and sort
    const monthlyArray = Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        return months.indexOf(a.month) - months.indexOf(b.month)
      })

    // Get status distribution
    const statusCounts = await db.booking.groupBy({
      by: ["status"],
      _count: { id: true },
    })

    const statusDistribution = {
      completed: statusCounts.find((s) => s.status === "completed")?._count.id || 0,
      confirmed: statusCounts.find((s) => s.status === "confirmed")?._count.id || 0,
      pending: statusCounts.find((s) => s.status === "pending")?._count.id || 0,
      cancelled: statusCounts.find((s) => s.status === "cancelled")?._count.id || 0,
    }

    // Get category distribution
    const categoryCounts = await db.service.groupBy({
      by: ["category"],
      _count: { id: true },
    })

    const categoryDistribution = categoryCounts
      .map((c) => ({ category: c.category, count: c._count.id }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      totalUsers,
      totalProviders,
      totalBookings,
      totalRevenue,
      monthlyData: monthlyArray,
      statusDistribution,
      categoryDistribution,
    })
  } catch (error) {
    console.error("Get analytics error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}

