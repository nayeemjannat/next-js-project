"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Star } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { toast } from "sonner"

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

export default function ReviewsPage() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && user.userType === "provider") {
      fetchReviews()
    }
  }, [user])

  const fetchReviews = async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch(`/api/reviews?providerId=${user.id}`)
      const data = await response.json()

      if (response.ok) {
        setReviews(data.reviews || [])
        setStats({
          averageRating: data.averageRating || 0,
          totalReviews: data.totalReviews || 0,
          ratingDistribution: data.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        })
      } else {
        throw new Error(data.error || "Failed to fetch reviews")
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
      toast.error("Failed to load reviews")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedUserTypes={["provider"]}>
        <div className="p-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading reviews...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedUserTypes={["provider"]}>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-2">Reviews</h1>
        <p className="text-muted-foreground mb-8">View feedback from your customers</p>

        {/* Rating Summary */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-center gap-8">
              <div>
                <div className="text-5xl font-bold text-primary mb-2">
                  {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "0.0"}
                </div>
                <div className="flex gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(stats.averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-muted-foreground">{stats.totalReviews} reviews</p>
              </div>
              {stats.totalReviews > 0 && (
                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution] || 0
                    const percentage = (count / stats.totalReviews) * 100
                    return (
                      <div key={rating} className="flex items-center gap-2">
                        <span className="text-xs font-medium w-4">{rating}</span>
                        <div className="flex-1 h-2 bg-input rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-12">{count} reviews</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No reviews yet. Reviews will appear here once customers leave feedback.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      <AvatarImage src={review.customer.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{review.customer.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold">{review.customer.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()} • {review.service.name}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  {review.comment && <p className="text-sm text-foreground">{review.comment}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
