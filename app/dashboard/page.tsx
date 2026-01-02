"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { useRouter } from "next/navigation"

function CustomerMetrics({ customerId }: { customerId?: string }) {
  const [metrics, setMetrics] = useState({
    activeBookings: 0,
    upcomingBookings: 0,
    totalSpent: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (customerId) {
      fetchMetrics()
    }
  }, [customerId])

  const fetchMetrics = async () => {
    if (!customerId) return

    try {
      const response = await fetch(`/api/bookings?userId=${customerId}&userType=customer`)
      const data = await response.json()

      if (response.ok && data.bookings) {
        const bookings = data.bookings
        const now = new Date()

        const activeBookings = bookings.filter(
          (b: any) => b.status === "pending" || b.status === "confirmed"
        ).length
        const upcomingBookings = bookings.filter(
          (b: any) => b.status === "confirmed" && new Date(b.scheduledDate) >= now
        ).length
        const totalSpent = bookings
          .filter((b: any) => b.paymentStatus === "paid")
          .reduce((sum: number, b: any) => sum + b.price, 0)

        setMetrics({
          activeBookings,
          upcomingBookings,
          totalSpent,
        })
      }
    } catch (error) {
      console.error("Error fetching metrics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">—</div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Active Booking Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.activeBookings}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.upcomingBookings}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">${metrics.totalSpent.toFixed(2)}</div>
        </CardContent>
      </Card>
    </div>
  )
}

function RecentActivity({ customerId }: { customerId?: string }) {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (customerId) {
      fetchActivities()
    }
  }, [customerId])

  const fetchActivities = async () => {
    if (!customerId) return

    try {
      const response = await fetch(`/api/bookings?userId=${customerId}&userType=customer`)
      const data = await response.json()

      if (response.ok && data.bookings) {
        const activitiesList = data.bookings.slice(0, 5).map((booking: any) => ({
          type: "booking",
          name: booking.provider.name,
          action: `Booking for ${booking.service.name}`,
          time: formatTimeAgo(new Date(booking.createdAt)),
          avatar: booking.provider.avatar,
        }))

        setActivities(activitiesList)
      }
    } catch (error) {
      console.error("Error fetching activities:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading activities...</div>
  }

  if (activities.length === 0) {
    return <div className="text-sm text-muted-foreground">No recent activity</div>
  }

  return (
    <>
      {activities.map((activity, idx) => (
        <div key={idx} className="flex items-center gap-4 pb-4 border-b last:border-0">
          <Avatar className="w-10 h-10">
            <AvatarImage src={activity.avatar || "/placeholder.svg"} />
            <AvatarFallback>{activity.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium text-sm">{activity.name}</p>
            <p className="text-xs text-muted-foreground">{activity.action}</p>
          </div>
          <span className="text-xs text-muted-foreground">{activity.time}</span>
        </div>
      ))}
    </>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()

  return (
    <ProtectedRoute allowedUserTypes={["customer"]}>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground mb-8">Welcome back, {user?.name || "User"}</p>

        {/* Overview Cards */}
        <CustomerMetrics customerId={user?.id} />

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RecentActivity customerId={user?.id} />
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={() => router.push("/services")}
                >
                  Find Services
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full bg-transparent"
                  onClick={() => router.push("/dashboard/bookings")}
                >
                  View Bookings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
