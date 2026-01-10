"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Star, Award, Verified, Clock, MapPin, ArrowLeft } from "lucide-react"
import Image from "next/image"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { toast } from "sonner"
import Link from "next/link"

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
  images?: {
    id: string
    imageUrl: string
    order: number
  }[]
}

interface Review {
  id: string
  rating: number
  comment: string | null
  customer: {
    name: string
    avatar: string | null
  }
  createdAt: string
}

export default function PublicProviderProfilePage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("services")

  useEffect(() => {
    console.log("Profile page loaded with params:", params.id)
    if (params.id) {
      fetchProviderData()
    }
  }, [params.id])

  const fetchProviderData = async () => {
    try {
      const providerId = Array.isArray(params.id) ? params.id[0] : params.id
      
      // Fetch provider
      const providerRes = await fetch(`/api/providers/${providerId}`)
      const providerData = await providerRes.json()
      
      if (providerRes.ok && providerData.provider) {
        setProvider(providerData.provider)
      } else {
        setProvider(null)
        setLoading(false)
        return
      }

      // Fetch services
      const servicesRes = await fetch(`/api/services?providerId=${providerId}`)
      const servicesData = await servicesRes.json()
      if (servicesRes.ok) {
        setServices(servicesData.services || [])
      }

      // Fetch reviews
      const reviewsRes = await fetch(`/api/reviews?providerId=${providerId}`)
      const reviewsData = await reviewsRes.json()
      if (reviewsRes.ok) {
        setReviews(reviewsData.reviews || [])
      }
    } catch (error) {
      console.error("Error fetching provider data:", error)
      toast.error("Failed to load provider profile")
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (service: Service) => {
    if (service.priceRange) return `$${service.priceRange}`
    if (service.priceType === "hourly") return `$${service.price}/hour`
    return `$${service.price}`
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading provider profile...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Provider not found</p>
              <Button onClick={() => router.push("/services")}>Back to Services</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <div className="border-b bg-background">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-semibold">Provider Profile</h1>
          </div>
        </div>
      </div>

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
            
            <div className="flex items-center gap-4 mb-4">
              {averageRating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{averageRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({reviews.length} reviews)</span>
                </div>
              )}
              {provider.experience && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Award className="w-4 h-4" />
                  {provider.experience} years experience
                </div>
              )}
            </div>

            {provider.bio && (
              <p className="text-muted-foreground mb-4">{provider.bio}</p>
            )}

            <div className="space-y-2">
              {provider.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{provider.location}</span>
                </div>
              )}
              {provider.specialties && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Specialties: {provider.specialties}</span>
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3 mt-6">
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

          <TabsContent value="services">
            <div className="grid gap-6">
              {services.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No services available</p>
                  </CardContent>
                </Card>
              ) : (
                services.map((service) => (
                  <Card key={service.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">{service.name}</h3>
                          {service.description && (
                            <p className="text-muted-foreground mb-2">{service.description}</p>
                          )}
                          <Badge variant="secondary">{service.category}</Badge>
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
                              <div className="aspect-square rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                +{service.images.length - 4}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="availability">
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

          <TabsContent value="reviews">
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No reviews yet</p>
                  </CardContent>
                </Card>
              ) : (
                reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                          {review.customer.avatar ? (
                            <Image
                              src={review.customer.avatar}
                              alt={review.customer.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted text-xs">
                              {review.customer.name[0]}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{review.customer.name}</h4>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {review.comment && <p className="text-sm text-foreground">{review.comment}</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
