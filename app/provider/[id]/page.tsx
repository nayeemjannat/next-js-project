"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, Award, Verified, Clock, MapPin } from "lucide-react"
import Image from "next/image"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { toast } from "sonner"

interface Provider {
  id: string
  name: string
  email: string
  avatar: string | null
  phone: string | null
  bio: string | null
  experience: number | null
  location: string | null
  specialties: string | null
  isVerified: boolean
}

interface Service {
  id: string
  name: string
  description: string | null
  category: string
  price: number
  priceType: string
  priceRange: string | null
  duration: number | null
  images?: Array<{
    id: string
    imageUrl: string
    order: number
  }>
}

interface Review {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  customer: {
    id: string
    name: string
    avatar: string | null
  }
  service: {
    id: string
    name: string
  }
  booking: {
    scheduledDate: string
  }
}

export default function ProviderProfilePage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("services")

  useEffect(() => {
    if (params.id) {
      fetchProviderData()
    }
  }, [params.id])

  const fetchProviderData = async () => {
    try {
      setLoading(true)
      const providerId = params.id as string

      // Fetch provider profile
      const providerRes = await fetch(`/api/provider/profile?providerId=${providerId}`)
      const providerData = await providerRes.json()

      if (providerRes.ok && providerData.provider) {
        setProvider(providerData.provider)
      } else {
        toast.error("Provider not found")
        router.push("/services")
        return
      }

      // Fetch provider services
      const servicesRes = await fetch(`/api/services?providerId=${providerId}`)
      const servicesData = await servicesRes.json()
      if (servicesRes.ok && servicesData.services) {
        const activeServices = servicesData.services.filter((s: Service) => s.isActive)
        // Fetch images for each service
        const servicesWithImages = await Promise.all(
          activeServices.map(async (service: Service) => {
            try {
              const imagesRes = await fetch(`/api/services/${service.id}/images`)
              const imagesData = await imagesRes.json()
              return {
                ...service,
                images: imagesData.images || [],
              }
            } catch (error) {
              return { ...service, images: [] }
            }
          })
        )
        setServices(servicesWithImages)
      }

      // Fetch reviews
      const reviewsRes = await fetch(`/api/reviews?providerId=${providerId}`)
      const reviewsData = await reviewsRes.json()
      if (reviewsRes.ok) {
        setReviews(reviewsData.reviews || [])
        setReviewStats({
          averageRating: reviewsData.averageRating || 0,
          totalReviews: reviewsData.totalReviews || 0,
          ratingDistribution: reviewsData.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        })
      }
    } catch (error) {
      console.error("Error fetching provider data:", error)
      toast.error("Failed to load provider information")
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (service: Service) => {
    if (service.priceRange) return `$${service.priceRange}`
    if (service.priceType === "hourly") return `$${service.price}/hour`
    return `$${service.price}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading provider profile...</p>
        </div>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Provider not found</p>
          <Button onClick={() => router.push("/services")}>Back to Services</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
        {/* Provider Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Profile Image */}
          <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            <Image
              src={provider.avatar || "/placeholder-user.jpg"}
              alt={provider.name}
              width={160}
              height={160}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Provider Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">{provider.name}</h1>
              {provider.isVerified && <Verified className="w-5 h-5 text-primary fill-primary" />}
            </div>
            {provider.bio && <p className="text-muted-foreground mb-4">{provider.bio}</p>}
            {provider.location && (
              <p className="text-muted-foreground mb-4 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {provider.location}
              </p>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mb-6">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(reviewStats.averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">
                  {reviewStats.averageRating > 0
                    ? `${reviewStats.averageRating.toFixed(1)} (${reviewStats.totalReviews} reviews)`
                    : "No reviews yet"}
                </span>
              </div>
              {provider.experience && (
                <div className="flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4 text-primary" />
                  <span>{provider.experience} years experience</span>
                </div>
              )}
              {provider.specialties && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Specialties: {provider.specialties}</span>
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3">
              {services.length > 0 && user?.userType !== "admin" && (
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => {
                    if (!user) {
                      router.push(`/auth/login?redirect=/book/${services[0].id}`)
                    } else {
                      router.push(`/book/${services[0].id}`)
                    }
                  }}
                >
                  Book Service
                </Button>
              )}
              <Button variant="outline">Contact</Button>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-12">
          <TabsList className="grid w-full md:w-auto grid-cols-3">
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Services</CardTitle>
              </CardHeader>
              <CardContent>
                {services.length === 0 ? (
                  <p className="text-muted-foreground">No services available</p>
                ) : (
                  <div className="space-y-6">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className="border border-border rounded-lg p-4 hover:bg-secondary transition"
                      >
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <span className="font-medium text-lg">{service.name}</span>
                            {service.description && (
                              <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                            )}
                            {service.duration && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {service.duration} minutes
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-primary font-semibold text-lg">{formatPrice(service)}</span>
                            {user?.userType !== "admin" && (
                              <Button
                                size="sm"
                                className="ml-4"
                                onClick={() => {
                                  if (!user) {
                                    router.push(`/auth/login?redirect=/book/${service.id}`)
                                  } else {
                                    router.push(`/book/${service.id}`)
                                  }
                                }}
                              >
                                Book
                              </Button>
                            )}
                          </div>
                        </div>
                        {/* Service Image Gallery */}
                        {service.images && service.images.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs text-muted-foreground mb-2">Previous Work:</p>
                            <div className="grid grid-cols-4 gap-2">
                              {service.images.slice(0, 4).map((img, idx) => (
                                <div key={img.id} className="aspect-square rounded-lg overflow-hidden border border-border">
                                  <Image
                                    src={img.imageUrl}
                                    alt={`${service.name} - Image ${idx + 1}`}
                                    width={150}
                                    height={150}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                              {service.images.length > 4 && (
                                <div className="aspect-square rounded-lg overflow-hidden border border-border bg-secondary flex items-center justify-center">
                                  <span className="text-xs text-muted-foreground">+{service.images.length - 4} more</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Availability Tab */}
          <TabsContent value="availability" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Check availability when booking a service. The provider's schedule will be shown during booking.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Ratings and Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Summary */}
                {reviewStats.totalReviews > 0 && (
                  <div className="flex items-center gap-6 mb-8 pb-8 border-b border-border">
                    <div>
                      <div className="text-5xl font-bold">{reviewStats.averageRating.toFixed(1)}</div>
                      <div className="flex gap-1 mt-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(reviewStats.averageRating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{reviewStats.totalReviews} reviews</p>
                    </div>
                    <div className="flex-1 space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = reviewStats.ratingDistribution[rating as keyof typeof reviewStats.ratingDistribution] || 0
                        const percentage = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0
                        return (
                          <div key={rating} className="flex items-center gap-2">
                            <span className="text-xs font-medium">{rating}</span>
                            <div className="flex-1 h-2 bg-input rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{Math.round(percentage)}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Individual Reviews */}
                {reviews.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No reviews yet</p>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="pb-6 border-b border-border last:border-0">
                        <div className="flex gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                            {review.customer.avatar ? (
                              <Image
                                src={review.customer.avatar}
                                alt={review.customer.name}
                                width={40}
                                height={40}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium">{review.customer.name[0]}</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{review.customer.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString()} • {review.service.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        {review.comment && <p className="text-sm text-foreground">{review.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  )
}
