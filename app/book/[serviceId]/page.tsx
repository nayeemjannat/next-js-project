"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, MapPin, DollarSign, CreditCard, CheckCircle, X } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { toast } from "sonner"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface Service {
  id: string
  name: string
  description: string | null
  category: string
  price: number
  priceType: string
  priceRange: string | null
  duration: number | null
  images?: {
    id: string
    imageUrl: string
    order: number
  }[]
  provider: {
    id: string
    name: string
    avatar: string | null
    isVerified: boolean
  }
}

export default function BookServicePage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [booking, setBooking] = useState({
    scheduledDate: "",
    scheduledTime: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    notes: "",
  })
  const [paymentStep, setPaymentStep] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [addresses, setAddresses] = useState<any[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [useNewAddress, setUseNewAddress] = useState(true)
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      if (params.serviceId) {
        const serviceId = Array.isArray(params.serviceId) ? params.serviceId[0] : params.serviceId
        router.push(`/auth/login?redirect=/book/${encodeURIComponent(serviceId)}`)
      }
      return
    }
    fetchService()
    fetchAddresses()
  }, [params.serviceId, user])

  const fetchAddresses = async () => {
    if (!user) return
    try {
      const response = await fetch(`/api/addresses?customerId=${user.id}`)
      const data = await response.json()
      if (response.ok && data.addresses) {
        setAddresses(data.addresses)
        const defaultAddress = data.addresses.find((a: any) => a.isDefault)
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id)
          setUseNewAddress(false)
          setBooking({
            ...booking,
            address: defaultAddress.address,
            city: defaultAddress.city || "",
            state: defaultAddress.state || "",
            zipCode: defaultAddress.zipCode || "",
          })
        }
      }
    } catch (error) {
      console.error("Error fetching addresses:", error)
    }
  }

  useEffect(() => {
    if (service && booking.scheduledDate) {
      fetchAvailability()
    } else {
      setAvailableSlots([])
      setAvailabilityError(null)
    }
  }, [booking.scheduledDate, service])

  const fetchService = async () => {
    try {
      const serviceId = Array.isArray(params.serviceId) ? params.serviceId[0] : params.serviceId
      
      if (!serviceId) {
        toast.error("Service ID is missing")
        setLoading(false)
        return
      }

      const response = await fetch(`/api/services/${serviceId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch service")
      }

      if (!data.service) {
        toast.error("Service not found")
        setService(null)
      } else {
        setService(data.service)
      }
    } catch (error) {
      console.error("Error fetching service:", error)
      toast.error("Failed to load service")
      setService(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailability = async () => {
    if (!service || !booking.scheduledDate) return

    setLoadingSlots(true)
    setAvailabilityError(null)
    try {
      const response = await fetch(
        `/api/provider/${service.provider.id}/availability?date=${booking.scheduledDate}`
      )
      const data = await response.json()

      if (response.ok && data.available) {
        setAvailableSlots(data.availableSlots || [])
        if (data.availableSlots.length === 0) {
          setAvailabilityError("No available time slots for this date")
        }
      } else {
        setAvailableSlots([])
        setAvailabilityError(data.message || "Provider is not available on this date")
        // Clear selected time if date is not available
        setBooking({ ...booking, scheduledTime: "" })
      }
    } catch (error) {
      console.error("Error fetching availability:", error)
      setAvailableSlots([])
      setAvailabilityError("Failed to load availability")
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleDateChange = (date: string) => {
    setBooking({ ...booking, scheduledDate: date, scheduledTime: "" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !service) return

    if (!booking.scheduledDate || !booking.scheduledTime || !booking.address) {
      toast.error("Please fill in all required fields")
      return
    }

    // Validate that selected time is available
    if (availableSlots.length > 0 && !availableSlots.includes(booking.scheduledTime)) {
      toast.error("Selected time is no longer available. Please choose another time.")
      return
    }

    // Save new address if using new address and user wants to save it
    if (useNewAddress && booking.address) {
      // Address will be saved when booking is created
    }

    setPaymentStep(true)
  }

  const handlePayment = async () => {
    if (!user || !service) return

    setProcessing(true)
    try {
      // Calculate price based on priceType
      let bookingPrice = service.price
      if (service.priceType === "range" && service.priceRange) {
        // For range pricing, use minimum price from range
        const rangeMatch = service.priceRange.match(/(\d+)-(\d+)/)
        if (rangeMatch) {
          bookingPrice = parseFloat(rangeMatch[1]) // Use minimum price
        } else {
          bookingPrice = 0
        }
      }

      let bookingId = createdBookingId

      // Create booking if not already created
      if (!bookingId) {
        const bookingResponse = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId: user.id,
            providerId: service.provider.id,
            serviceId: service.id,
            scheduledDate: booking.scheduledDate,
            scheduledTime: booking.scheduledTime,
            address: booking.address,
            city: booking.city,
            state: booking.state,
            zipCode: booking.zipCode,
            notes: booking.notes,
            price: bookingPrice,
          }),
        })

        if (!bookingResponse.ok) {
          const errorData = await bookingResponse.json()
          throw new Error(errorData.error || "Failed to create booking")
        }

        const bookingData = await bookingResponse.json()
        bookingId = bookingData.booking.id
        setCreatedBookingId(bookingId)
      }

      // Process payment
      const paymentResponse = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          amount: bookingPrice,
          customerName: user.name,
          customerEmail: user.email,
          customerPhone: user.phone || "",
          customerAddress: `${booking.address}, ${booking.city}, ${booking.state}`,
        }),
      })

      if (!paymentResponse.ok) {
        throw new Error("Payment processing failed")
      }

      const paymentData = await paymentResponse.json()
      toast.success("Payment successful! Redirecting...")
      
      // Redirect to success page
      setTimeout(() => {
        router.push(paymentData.redirectUrl)
      }, 1500)
    } catch (error: any) {
      console.error("Payment error:", error)
      toast.error(error.message || "Payment failed")
    } finally {
      setProcessing(false)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading service...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Service not found</p>
            <Button onClick={() => router.push("/services")}>Back to Services</Button>
          </div>
        </div>
      </div>
    )
  }

  const formatPrice = () => {
    if (service.priceRange) return `$${service.priceRange}`
    if (service.priceType === "hourly") return `$${service.price}/hour`
    return `$${service.price}`
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Book Service</h1>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="md:col-span-2">
            {!paymentStep ? (
              <Card>
                <CardHeader>
                  <CardTitle>Booking Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="date">Service Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={booking.scheduledDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        required
                      />
                      {availabilityError && booking.scheduledDate && (
                        <p className="text-sm text-destructive mt-1">{availabilityError}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="time">Service Time *</Label>
                      {booking.scheduledDate ? (
                        <div className="space-y-2">
                          {loadingSlots ? (
                            <div className="text-sm text-muted-foreground py-2">Loading available times...</div>
                          ) : availabilityError ? (
                            <div className="text-sm text-destructive py-2">{availabilityError}</div>
                          ) : availableSlots.length > 0 ? (
                            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                              {availableSlots.map((slot) => (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => setBooking({ ...booking, scheduledTime: slot })}
                                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                                    booking.scheduledTime === slot
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-background hover:bg-secondary border-border"
                                  }`}
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground py-2">
                              Please select a date to see available times
                            </div>
                          )}
                          {booking.scheduledTime && (
                            <div className="text-sm text-muted-foreground">
                              Selected: {booking.scheduledTime}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground py-2">
                          Please select a date first to see available times
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Select Address *</Label>
                      {addresses.length > 0 && (
                        <div className="mb-3">
                          <label className="flex items-center gap-2 mb-2">
                            <input
                              type="radio"
                              name="addressType"
                              checked={!useNewAddress}
                              onChange={() => {
                                setUseNewAddress(false)
                                const selected = addresses.find((a) => a.id === selectedAddressId)
                                if (selected) {
                                  setBooking({
                                    ...booking,
                                    address: selected.address,
                                    city: selected.city || "",
                                    state: selected.state || "",
                                    zipCode: selected.zipCode || "",
                                  })
                                }
                              }}
                              className="w-4 h-4 accent-primary"
                            />
                            <span className="text-sm">Use saved address</span>
                          </label>
                          {!useNewAddress && (
                            <select
                              value={selectedAddressId || ""}
                              onChange={(e) => {
                                const address = addresses.find((a) => a.id === e.target.value)
                                if (address) {
                                  setSelectedAddressId(address.id)
                                  setBooking({
                                    ...booking,
                                    address: address.address,
                                    city: address.city || "",
                                    state: address.state || "",
                                    zipCode: address.zipCode || "",
                                  })
                                }
                              }}
                              className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                            >
                              <option value="">Select an address</option>
                              {addresses.map((addr) => (
                                <option key={addr.id} value={addr.id}>
                                  {addr.label} - {addr.address}
                                </option>
                              ))}
                            </select>
                          )}
                          <label className="flex items-center gap-2 mt-2">
                            <input
                              type="radio"
                              name="addressType"
                              checked={useNewAddress}
                              onChange={() => setUseNewAddress(true)}
                              className="w-4 h-4 accent-primary"
                            />
                            <span className="text-sm">Use new address</span>
                          </label>
                        </div>
                      )}
                      {useNewAddress && (
                        <>
                          <Input
                            id="address"
                            placeholder="123 Main Street"
                            value={booking.address}
                            onChange={(e) => setBooking({ ...booking, address: e.target.value })}
                            required
                          />
                        </>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          placeholder="San Francisco"
                          value={booking.city}
                          onChange={(e) => setBooking({ ...booking, city: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          placeholder="CA"
                          value={booking.state}
                          onChange={(e) => setBooking({ ...booking, state: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        placeholder="94102"
                        value={booking.zipCode}
                        onChange={(e) => setBooking({ ...booking, zipCode: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any special instructions or requirements..."
                        value={booking.notes}
                        onChange={(e) => setBooking({ ...booking, notes: e.target.value })}
                        rows={4}
                      />
                    </div>

                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                      Continue to Payment
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="bg-secondary p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Payment Method</p>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        <span className="font-medium">Demo Payment</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        This is a demo payment. Your booking will be confirmed immediately without actual payment processing.
                      </p>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-muted-foreground">Service</span>
                        <span className="font-medium">{service.name}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-muted-foreground">Provider</span>
                        <span className="font-medium">{service.provider.name}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-muted-foreground">Date & Time</span>
                        <span className="font-medium">
                          {new Date(booking.scheduledDate).toLocaleDateString()} at {booking.scheduledTime}
                        </span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold">Total</span>
                          <span className="text-lg font-bold text-primary">{formatPrice()}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handlePayment}
                      disabled={processing}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      {processing ? "Processing..." : "Pay Now"}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setPaymentStep(false)}
                      className="w-full"
                      disabled={processing}
                    >
                      Back
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Service Summary */}
          <div className="md:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Service Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Service Images Gallery */}
                {service.images && service.images.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Service Photos</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {service.images.slice(0, 6).map((image, index) => (
                        <div
                          key={image.id}
                          className="aspect-square rounded-lg overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            const imageUrls = service.images!.map(img => img.imageUrl)
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
                      {service.images.length > 6 && (
                        <div className="aspect-square rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground cursor-pointer hover:bg-secondary transition-colors"
                             onClick={() => {
                               const imageUrls = service.images!.map(img => img.imageUrl)
                               openGallery(imageUrls, 0)
                             }}>
                          +{service.images.length - 6}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-1">{service.name}</h3>
                  <p className="text-sm text-muted-foreground">by {service.provider.name}</p>
                  {service.provider.isVerified && (
                    <span className="text-xs text-primary mt-1 inline-block">✓ Verified Provider</span>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="w-4 h-4" />
                    <span>{formatPrice()}</span>
                  </div>
                  {service.duration && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{service.duration} minutes</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-xs bg-secondary px-2 py-1 rounded">{service.category}</span>
                  </div>
                </div>

                {service.description && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      <Dialog open={galleryOpen} onOpenChange={closeGallery}>
        <DialogContent className="max-w-4xl w-full p-0">
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
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70"
                    >
                      <X className="w-5 h-5 rotate-180" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70"
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
    </div>
  )
}

