"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star } from "lucide-react"
import { Clock, MapPin, DollarSign, MessageSquare, ArrowUpDown, Eye, Edit } from "lucide-react"
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
    images?: {
      id: string
      imageUrl: string
      order: number
    }[]
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
  const [sortBy, setSortBy] = useState("date_desc")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    if (user) {
      fetchBookings()
    }
  }, [user, sortBy])

  const fetchBookings = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/bookings?userId=${user.id}&userType=customer&sortBy=${sortBy}`)
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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
          <p className="text-muted-foreground">View and manage your service bookings</p>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Newest First</SelectItem>
              <SelectItem value="date_asc">Oldest First</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
                      <ReviewButton booking={booking} onReviewSubmitted={fetchBookings} />
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

function ReviewButton({ booking, onReviewSubmitted }: { booking: Booking; onReviewSubmitted: () => void }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [hasReview, setHasReview] = useState(false)

  useEffect(() => {
    checkExistingReview()
  }, [booking.id])

  const checkExistingReview = async () => {
    try {
      const response = await fetch(`/api/reviews?bookingId=${booking.id}`)
      const data = await response.json()
      if (response.ok && data.review) {
        setHasReview(true)
        setRating(data.review.rating)
        setComment(data.review.comment || "")
      }
    } catch (error) {
      console.error("Error checking review:", error)
    }
  }

  const handleSubmit = async () => {
    if (!user || !rating) return

    setSubmitting(true)
    try {
      if (hasReview) {
        // Update existing review - need to get review ID first
        const reviewCheck = await fetch(`/api/reviews?bookingId=${booking.id}`)
        const reviewData = await reviewCheck.json()
        
        if (reviewData.review) {
          const response = await fetch(`/api/reviews/${reviewData.review.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rating, comment, customerId: user.id }),
          })

          const data = await response.json()
          if (response.ok) {
            toast.success("Review updated successfully!")
            setOpen(false)
            onReviewSubmitted()
          } else {
            throw new Error(data.error || "Failed to update review")
          }
        }
      } else {
        // Create new review
        const response = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: booking.id,
            customerId: user.id,
            providerId: booking.provider.id,
            serviceId: booking.service.id,
            rating,
            comment,
          }),
        })

        const data = await response.json()
        if (response.ok) {
          toast.success("Review submitted successfully!")
          setOpen(false)
          setHasReview(true)
          onReviewSubmitted()
        } else {
          throw new Error(data.error || "Failed to submit review")
        }
      }
    } catch (error) {
      console.error("Error submitting review:", error)
      toast.error(error instanceof Error ? error.message : "Failed to submit review")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          {hasReview ? "Edit Review" : "Leave Review"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{hasReview ? "Edit Review" : "Leave a Review"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Rating *</Label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="comment">Comment</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              rows={4}
              className="mt-2"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={submitting || !rating}
              className="flex-1"
            >
              {submitting ? "Submitting..." : hasReview ? "Update Review" : "Submit Review"}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
          <p className="text-muted-foreground">View and manage your service bookings</p>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Newest First</SelectItem>
              <SelectItem value="date_asc">Oldest First</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
            <Card 
              key={booking.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedBooking(booking)
                setDetailsOpen(true)
              }}
            >
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
                  <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button size="sm" variant="outline">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                    {(booking.status === "confirmed" || booking.status === "pending") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCancel(booking.id)
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                    {booking.status === "completed" && (
                      <ReviewButton booking={booking} onReviewSubmitted={fetchBookings} />
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
