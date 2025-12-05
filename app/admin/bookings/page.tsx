"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, MoreVertical } from "lucide-react"

export default function BookingsPage() {
  const bookings = [
    {
      id: 1,
      customer: "Sophia Clark",
      provider: "Alex R.",
      service: "Plumbing",
      date: "2024-12-15",
      amount: "$150",
      status: "completed",
    },
    {
      id: 2,
      customer: "Emily Carter",
      provider: "Sarah L.",
      service: "Electrical",
      date: "2024-12-14",
      amount: "$200",
      status: "confirmed",
    },
    {
      id: 3,
      customer: "David Smith",
      provider: "Mike J.",
      service: "Cleaning",
      date: "2024-12-13",
      amount: "$120",
      status: "completed",
    },
    {
      id: 4,
      customer: "Jessica Johnson",
      provider: "Jessica T.",
      service: "Painting",
      date: "2024-12-16",
      amount: "$300",
      status: "pending",
    },
  ]

  const statusColors = {
    completed: "bg-green-100 text-green-800",
    confirmed: "bg-blue-100 text-blue-800",
    pending: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-red-100 text-red-800",
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Bookings</h1>
          <p className="text-muted-foreground">Monitor all platform bookings and transactions</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search bookings..." className="pl-10" />
      </div>

      {/* Bookings Table */}
      <Card>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Booking ID</th>
                  <th className="text-left py-3 px-4 font-semibold">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold">Provider</th>
                  <th className="text-left py-3 px-4 font-semibold">Service</th>
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-border hover:bg-secondary/50 transition">
                    <td className="py-3 px-4 font-medium">#{booking.id}</td>
                    <td className="py-3 px-4">{booking.customer}</td>
                    <td className="py-3 px-4">{booking.provider}</td>
                    <td className="py-3 px-4 text-muted-foreground">{booking.service}</td>
                    <td className="py-3 px-4 text-muted-foreground">{booking.date}</td>
                    <td className="py-3 px-4 font-medium">{booking.amount}</td>
                    <td className="py-3 px-4">
                      <Badge className={statusColors[booking.status as keyof typeof statusColors]}>
                        {booking.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button size="sm" variant="ghost">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
