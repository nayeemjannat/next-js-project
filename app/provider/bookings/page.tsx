"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Clock, MapPin, DollarSign, MessageSquare, CheckCircle, XCircle } from "lucide-react"

export default function ProviderBookingsPage() {
  const bookings = [
    {
      id: 1,
      customer: "Emily Carter",
      service: "Home Cleaning",
      date: "2024-12-15",
      time: "10:00 AM",
      location: "123 Main St, San Francisco",
      price: "$150",
      status: "confirmed",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop",
    },
    {
      id: 2,
      customer: "David Smith",
      service: "Deep Cleaning",
      date: "2024-12-18",
      time: "2:00 PM",
      location: "456 Oak Ave, San Francisco",
      price: "$200",
      status: "pending",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop",
    },
    {
      id: 3,
      customer: "Jessica Johnson",
      service: "Window Cleaning",
      date: "2024-12-12",
      time: "9:00 AM",
      location: "789 Pine Rd, San Francisco",
      price: "$120",
      status: "completed",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop",
    },
  ]

  const statusColors = {
    confirmed: "bg-blue-100 text-blue-800",
    pending: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Bookings</h1>
      <p className="text-muted-foreground mb-8">Manage your service bookings and appointments</p>

      <div className="space-y-4">
        {bookings.map((booking) => (
          <Card key={booking.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-4 flex-1">
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    <AvatarImage src={booking.image || "/placeholder.svg"} />
                    <AvatarFallback>{booking.customer[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{booking.service}</h3>
                      <Badge className={statusColors[booking.status as keyof typeof statusColors]}>
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">From {booking.customer}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {booking.date} at {booking.time}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {booking.location}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="w-4 h-4" />
                        {booking.price}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  {booking.status === "pending" && (
                    <>
                      <Button size="sm" className="bg-primary hover:bg-primary/90">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive bg-transparent">
                        <XCircle className="w-4 h-4 mr-2" />
                        Decline
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
