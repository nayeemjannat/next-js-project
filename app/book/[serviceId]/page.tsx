"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, MapPin, DollarSign, CreditCard, CheckCircle } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { toast } from "sonner"

interface Service {
  id: string
  name: string
  description: string | null
  category: string
  price: number
  priceType: string
  priceRange: string | null
  duration: number | null
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

  useEffect(() => {
    if (!user) {
      router.push("/auth/login?redirect=/book/" + params.serviceId)
      return
    }
    fetchService()
  }, [params.serviceId, user])

  const fetchService = async () => {
    try {
      if (!params.serviceId) {
        toast.error("Service ID is missing")
        setLoading(false)
        return
      }

      const response = await fetch(`/api/services/${params.serviceId}`)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !service) return

    if (!booking.scheduledDate || !booking.scheduledTime || !booking.address) {
      toast.error("Please fill in all required fields")
      return
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
        // For range pricing, use the minimum price from the range
        const rangeMatch = service.priceRange.match(/(\d+)-(\d+)/)
        if (rangeMatch) {
          bookingPrice = parseFloat(rangeMatch[1]) // Use minimum price
        } else {
          bookingPrice = 0
        }
      }

      // Create booking
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
        throw new Error("Failed to create booking")
      }

      const { booking: createdBooking } = await bookingResponse.json()

      // Process payment (demo)
      const paymentResponse = await fetch(`/api/bookings/${createdBooking.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: "demo" }),
      })

      if (!paymentResponse.ok) {
        throw new Error("Payment failed")
      }

      toast.success("Booking confirmed! Payment processed (demo mode)")
      router.push(`/dashboard/bookings`)
    } catch (error) {
      console.error("Error creating booking:", error)
      toast.error("Failed to create booking")
    } finally {
      setProcessing(false)
    }
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
                        onChange={(e) => setBooking({ ...booking, scheduledDate: e.target.value })}
                        min={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="time">Service Time *</Label>
                      <Input
                        id="time"
                        type="time"
                        value={booking.scheduledTime}
                        onChange={(e) => setBooking({ ...booking, scheduledTime: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        placeholder="123 Main Street"
                        value={booking.address}
                        onChange={(e) => setBooking({ ...booking, address: e.target.value })}
                        required
                      />
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
                  <CardTitle>Payment (Demo Mode)</CardTitle>
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
                        This is a demo payment. No actual charges will be made.
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
                      {processing ? "Processing..." : "Complete Payment (Demo)"}
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
    </div>
  )
}

