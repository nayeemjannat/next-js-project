"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Star, ThumbsUp, ThumbsDown } from "lucide-react"

export default function ReviewsPage() {
  const reviews = [
    {
      id: 1,
      customer: "Emily Carter",
      rating: 5,
      date: "July 15, 2024",
      text: "Ethan did an excellent job fixing my leaky faucet. He was prompt, professional, and the price was fair. Highly recommend!",
      likes: 12,
      dislikes: 0,
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop",
    },
    {
      id: 2,
      customer: "David Smith",
      rating: 4,
      date: "June 22, 2024",
      text: "Great service overall. Ethan was very professional and courteous. There was a slight delay but the work was well done.",
      likes: 5,
      dislikes: 1,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop",
    },
    {
      id: 3,
      customer: "Jessica Johnson",
      rating: 5,
      date: "May 10, 2024",
      text: "Ethan is a true professional. He installed my new light fixture perfectly and was very courteous. Will definitely hire again.",
      likes: 8,
      dislikes: 0,
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop",
    },
  ]

  const averageRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Reviews</h1>
      <p className="text-muted-foreground mb-8">View feedback from your customers</p>

      {/* Rating Summary */}
      <Card className="mb-8">
        <CardContent className="p-8">
          <div className="flex items-center gap-8">
            <div>
              <div className="text-5xl font-bold text-primary mb-2">{averageRating}</div>
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.round(Number(averageRating))
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <p className="text-muted-foreground">{reviews.length} reviews</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="w-12 h-12 flex-shrink-0">
                  <AvatarImage src={review.image || "/placeholder.svg"} />
                  <AvatarFallback>{review.customer[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold">{review.customer}</h3>
                    <p className="text-xs text-muted-foreground">{review.date}</p>
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
              <p className="text-sm text-foreground mb-4">{review.text}</p>
              <div className="flex gap-4">
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition">
                  <ThumbsUp className="w-4 h-4" />
                  {review.likes}
                </button>
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition">
                  <ThumbsDown className="w-4 h-4" />
                  {review.dislikes}
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
