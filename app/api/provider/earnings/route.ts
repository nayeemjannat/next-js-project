import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/provider/earnings?providerId=xxx - Get provider earnings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get("providerId")

    if (!providerId) {
      return NextResponse.json({ error: "Provider ID is required" }, { status: 400 })
    }

    // Get platform commission rate
    const settings = await db.platformSettings.findFirst()
    const commissionRate = settings?.commissionRate || 0.15

    // Get all completed bookings with paid status
    const bookings = await db.booking.findMany({
      where: {
        providerId,
        status: "completed",
        paymentStatus: "paid",
      },
      orderBy: { completedAt: "desc" },
    })

    // Calculate totals
    const totalEarnings = bookings.reduce((sum, b) => sum + b.price, 0)
    const totalCommission = totalEarnings * commissionRate
    const netEarnings = totalEarnings - totalCommission

    // Get current month earnings
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthBookings = bookings.filter(
      (b) => b.completedAt && new Date(b.completedAt) >= startOfMonth
    )
    const thisMonthEarnings = thisMonthBookings.reduce((sum, b) => sum + b.price, 0)
    const thisMonthCommission = thisMonthEarnings * commissionRate
    const thisMonthNet = thisMonthEarnings - thisMonthCommission

    // Get last 6 months data for charts
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyData: { [key: string]: { earnings: number; bookings: number; commission: number; net: number } } = {}

    bookings
      .filter((b) => b.completedAt && new Date(b.completedAt) >= sixMonthsAgo)
      .forEach((booking) => {
        if (!booking.completedAt) return
        const date = new Date(booking.completedAt)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        const monthName = date.toLocaleDateString("en-US", { month: "short" })

        if (!monthlyData[monthName]) {
          monthlyData[monthName] = { earnings: 0, bookings: 0, commission: 0, net: 0 }
        }

        monthlyData[monthName].earnings += booking.price
        monthlyData[monthName].bookings += 1
        monthlyData[monthName].commission += booking.price * commissionRate
        monthlyData[monthName].net += booking.price * (1 - commissionRate)
      })

    // Convert to array format for charts
    const chartData = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        earnings: data.earnings,
        bookings: data.bookings,
        commission: data.commission,
        net: data.net,
      }))
      .sort((a, b) => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        return months.indexOf(a.month) - months.indexOf(b.month)
      })

    return NextResponse.json({
      summary: {
        totalEarnings,
        totalCommission,
        netEarnings,
        thisMonthEarnings,
        thisMonthCommission,
        thisMonthNet,
        totalBookings: bookings.length,
        thisMonthBookings: thisMonthBookings.length,
      },
      chartData,
      commissionRate,
    })
  } catch (error) {
    console.error("Get earnings error:", error)
    return NextResponse.json({ error: "Failed to fetch earnings" }, { status: 500 })
  }
}

