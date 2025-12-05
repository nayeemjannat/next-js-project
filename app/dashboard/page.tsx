"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-context"
import { ProtectedRoute } from "@/components/protected-route"

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <ProtectedRoute allowedUserTypes={["customer"]}>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground mb-8">Welcome back, {user?.name || "User"}</p>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Booking Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">3</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">5</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Earnings This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">$1,250</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "Sarah", action: "New booking request for home cleaning", time: "2h ago" },
                  { name: "Emily", action: "Review for home cleaning service", time: "1d ago" },
                ].map((activity, idx) => (
                  <div key={idx} className="flex items-center gap-4 pb-4 border-b last:border-0">
                    <Avatar className="w-10 h-10">
                      <AvatarImage
                        src={`https://images.unsplash.com/photo-${idx === 0 ? "1507003211169-0a1dd7228f2d" : "1494790108377-be9c29b29330"}?w=40&h=40&fit=crop`}
                      />
                      <AvatarFallback>{activity.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{activity.name}</p>
                      <p className="text-xs text-muted-foreground">{activity.action}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
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
                <Button className="w-full bg-primary hover:bg-primary/90">Book a Service</Button>
                <Button variant="outline" className="w-full bg-transparent">
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
