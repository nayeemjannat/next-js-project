"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Clock, MapPin, DollarSign, MessageSquare } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { toast } from "sonner"

interface Booking {
  id: string
  status: string
  scheduledDate: string
  scheduledTime: string
  address: string
  city: string | null
  state: string | null
  price: number
  paymentStatus: string
  service: {
    id: string
    name: string
    category: string
    image: string | null
  }
  provider: {
    id: string
    name: string
    avatar: string | null
  }
}

export default function BookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchBookings()
    }
  }, [user])

  const fetchBookings = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/bookings?userId=${user.id}&userType=customer`)
      const data = await response.json()
      setBookings(data.bookings || [])
    } catch (error) {
      console.error("Error fetching bookings:", error)
      toast.error("Failed to load bookings")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      })

      if (response.ok) {
        toast.success("Booking cancelled")
        fetchBookings()
      } else {
        throw new Error("Failed to cancel booking")
      }
    } catch (error) {
      console.error("Error cancelling booking:", error)
      toast.error("Failed to cancel booking")
    }
  }

  const statusColors = {
    confirmed: "bg-blue-100 text-blue-800",
    pending: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    in_progress: "bg-purple-100 text-purple-800",
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading bookings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
      <p className="text-muted-foreground mb-8">View and manage your service bookings</p>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No bookings found</p>
            <Button onClick={() => window.location.href = "/services"}>Browse Services</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-6">
                  {/* Left Section */}
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      <AvatarImage src={booking.provider.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{booking.provider.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{booking.service.name}</h3>
                        <Badge className={statusColors[booking.status as keyof typeof statusColors]}>
                          {booking.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">By {booking.provider.name}</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {new Date(booking.scheduledDate).toLocaleDateString()} at {booking.scheduledTime}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          {booking.address}
                          {booking.city && `, ${booking.city}`}
                          {booking.state && `, ${booking.state}`}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          ${booking.price.toFixed(2)} ({booking.paymentStatus})
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Actions */}
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="outline">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                    {(booking.status === "confirmed" || booking.status === "pending") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive bg-transparent"
                        onClick={() => handleCancel(booking.id)}
                      >
                        Cancel
                      </Button>
                    )}
                    {booking.status === "completed" && (
                      <Button size="sm" variant="outline">
                        Leave Review
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
