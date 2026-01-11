"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Star } from "lucide-react"
import { Clock, MapPin, DollarSign, MessageSquare, ArrowUpDown, Eye, CreditCard, X, Image as ImageIcon } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { toast } from "sonner"
import Image from "next/image"

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
  notes?: string | null
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
  providerBid?: {
    id: string
    price: number
    message?: string | null
    estimatedTime?: number | null
    status: string
    provider?: { id: string; name: string; avatar?: string | null }
  } | null
  serviceBid?: {
    id: string
    serviceCategory: string
    description?: string | null
    budgetMin?: number | null
    budgetMax?: number | null
  } | null
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <Button onClick={handleSubmit} disabled={submitting || !rating} className="flex-1">
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
}

export default function BookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState("date_desc")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [processingPayment, setProcessingPayment] = useState(false)

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
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: user?.id, actorType: user?.userType }),
      })

      if (response.ok) {
        toast.success("Booking cancelled successfully")
        fetchBookings()
      } else {
        throw new Error("Failed to cancel booking")
      }
    } catch (error) {
      console.error("Error cancelling booking:", error)
      toast.error("Failed to cancel booking")
    }
  }

  const handleRetryPayment = async (booking: Booking) => {
    setProcessingPayment(true)
    try {
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: booking.price,
          customerName: user?.name,
          customerEmail: user?.email,
          customerPhone: user?.phone || "",
          customerAddress: `${booking.address}, ${booking.city || ""}, ${booking.state || ""}`,
        }),
      })

      if (!response.ok) {
        throw new Error("Payment processing failed")
      }

      const paymentData = await response.json()
      toast.success("Payment successful! Redirecting...")
      
      // Redirect to success page
      setTimeout(() => {
        window.location.href = paymentData.redirectUrl
      }, 1500)
    } catch (error: any) {
      console.error("Payment error:", error)
      toast.error(error.message || "Payment failed")
    } finally {
      setProcessingPayment(false)
    }
  }

  const openGallery = (images: string[], index: number = 0) => {
    setGalleryImages(images)
    setCurrentImageIndex(index)
    setGalleryOpen(true)
  }

  const closeGallery = () => {
    setGalleryOpen(false)
    setGalleryImages([])
    setCurrentImageIndex(0)
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
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
    <>
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
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-6">
                    {/* Left Section */}
                    <div className="flex items-start gap-4 flex-1">
                      {/* Service Images */}
                      <div className="flex-shrink-0">
                        {booking.service.images && booking.service.images.length > 0 ? (
                          <div className="relative">
                            <div className="w-16 h-16 rounded-lg overflow-hidden border cursor-pointer"
                              onClick={() => {
                                const imageUrls = booking.service.images!.map(img => img.imageUrl)
                                openGallery(imageUrls, 0)
                              }}
                            >
                              <img
                                src={booking.service.images[0].imageUrl}
                                alt={booking.service.name}
                                className="w-full h-full object-cover hover:scale-105 transition-transform"
                              />
                            </div>
                            {booking.service.images.length > 1 && (
                              <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                +{booking.service.images.length - 1}
                              </div>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                const imageUrls = booking.service.images!.map(img => img.imageUrl)
                                openGallery(imageUrls, 0)
                              }}
                              className="absolute bottom-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 hover:opacity-100 transition-opacity"
                              title="View gallery"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{booking.service.name}</h3>
                          <Badge className={statusColors[booking.status as keyof typeof statusColors]}>
                            {booking.status.replace("_", " ")}
                          </Badge>
                          {booking.paymentStatus === "pending" && (
                            <Badge variant="destructive" className="text-xs">
                              Payment Pending
                            </Badge>
                          )}
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
                          {booking.notes && (
                            <div className="mt-2 text-sm">
                              <span className="font-medium">Notes: </span>
                              <span className="text-muted-foreground">{booking.notes}</span>
                            </div>
                          )}
                          {booking.providerBid && (
                            <div className="mt-2 text-sm p-2 border-l-2 border-primary bg-primary/5 rounded">
                              <div className="font-medium">Created from an accepted proposal</div>
                              <div className="text-xs text-muted-foreground">Proposal: ${booking.providerBid.price.toFixed(2)} — {booking.providerBid.message || 'No message'}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedBooking(booking)
                          setDetailsOpen(true)
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                      {booking.paymentStatus === "pending" && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRetryPayment(booking)
                          }}
                          disabled={processingPayment}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          {processingPayment ? "Processing..." : "Pay Now"}
                        </Button>
                      )}
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

      {/* Booking Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              {/* Service Images in Details */}
              {selectedBooking.service.images && selectedBooking.service.images.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Service Photos</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedBooking.service.images.slice(0, 8).map((image, index) => (
                      <div
                        key={image.id}
                        className="aspect-square rounded-lg overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          const imageUrls = selectedBooking.service!.images!.map(img => img.imageUrl)
                          openGallery(imageUrls, index)
                        }}
                      >
                        <img
                          src={image.imageUrl}
                          alt={`Service photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {selectedBooking.service.images.length > 8 && (
                      <div className="aspect-square rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground cursor-pointer hover:bg-secondary transition-colors"
                           onClick={() => {
                             const imageUrls = selectedBooking.service!.images!.map(img => img.imageUrl)
                             openGallery(imageUrls, 0)
                           }}>
                        +{selectedBooking.service.images.length - 8}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Service</Label>
                  <p className="text-sm">{selectedBooking.service.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Provider</Label>
                  <p className="text-sm">{selectedBooking.provider.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={statusColors[selectedBooking.status as keyof typeof statusColors]}>
                    {selectedBooking.status.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment Status</Label>
                  <p className="text-sm">{selectedBooking.paymentStatus}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date & Time</Label>
                  <p className="text-sm">
                    {new Date(selectedBooking.scheduledDate).toLocaleDateString()} at {selectedBooking.scheduledTime}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Price</Label>
                  <p className="text-sm">${selectedBooking.price.toFixed(2)}</p>
                </div>
                {selectedBooking.providerBid && (
                  <div>
                    <Label className="text-sm font-medium">Proposal</Label>
                    <p className="text-sm">${selectedBooking.providerBid.price.toFixed(2)} — {selectedBooking.providerBid.message || 'No message'}</p>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium">Address</Label>
                <p className="text-sm">
                  {selectedBooking.address}
                  {selectedBooking.city && `, ${selectedBooking.city}`}
                  {selectedBooking.state && `, ${selectedBooking.state}`}
                </p>
              </div>
              {selectedBooking.notes && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <p className="text-sm">{selectedBooking.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Gallery Modal */}
      <Dialog open={galleryOpen} onOpenChange={closeGallery}>
        <DialogContent className="max-w-4xl w-full p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Service Images Gallery</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <button
              onClick={closeGallery}
              className="absolute top-4 right-4 z-10 bg-black/50 text-white rounded-full p-2 hover:bg-black/70"
            >
              <X className="w-5 h-5" />
            </button>
            
            {galleryImages.length > 0 && (
              <div className="relative">
                <div className="flex items-center justify-center min-h-[500px] bg-black">
                  <img
                    src={galleryImages[currentImageIndex]}
                    alt={`Gallery image ${currentImageIndex + 1}`}
                    className="max-w-full max-h-[80vh] object-contain"
                  />
                </div>
                
                {galleryImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black-70"
                    >
                      <X className="w-5 h-5 rotate-180" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black-70"
                    >
                      <X className="w-5 h-5 rotate-90" />
                    </button>
                    
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                      {galleryImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentImageIndex ? "bg-white" : "bg-white/50"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
