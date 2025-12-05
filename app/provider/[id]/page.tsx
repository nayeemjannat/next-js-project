"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, Award, Verified } from "lucide-react"
import Image from "next/image"

export default function ProviderProfilePage({ params }: { params: { id: string } }) {
  const [selectedDate, setSelectedDate] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState("services")

  // Mock provider data
  const provider = {
    name: "Alex R.",
    category: "Plumbing",
    rating: 4.9,
    reviews: 123,
    verified: true,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
    description: "Professional plumber with 10+ years of experience.",
    responseTime: "2 hours",
    responseRate: "98%",
  }

  const services = [
    { name: "Plumbing", price: "$50/hr" },
    { name: "Electrical", price: "$60/hr" },
    { name: "Handyman", price: "$40/hr" },
  ]

  const reviews = [
    {
      author: "Olivia Bennett",
      date: "July 15, 2024",
      rating: 5,
      text: "Ethan did an excellent job fixing my leaky faucet. He was prompt, professional, and the price was fair. Highly recommend!",
    },
    {
      author: "Noah Thompson",
      date: "June 22, 2024",
      rating: 4,
      text: "Ethan was great, but there was a slight delay in his arrival. The work was well done, though.",
    },
    {
      author: "Chloe Hayes",
      date: "May 10, 2024",
      rating: 5,
      text: "Ethan is a true professional. He installed my new light fixture perfectly and was very courteous. Will definitely hire again.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Provider Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Profile Image */}
          <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            <Image
              src={provider.image || "/placeholder.svg"}
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
              {provider.verified && <Verified className="w-5 h-5 text-primary fill-primary" />}
            </div>
            <p className="text-muted-foreground mb-4">{provider.category}</p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mb-6">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <span className="text-sm font-medium">
                  {provider.rating} ({provider.reviews} reviews)
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Award className="w-4 h-4 text-primary" />
                <span>Response: {provider.responseTime}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Verified className="w-4 h-4 text-primary" />
                <span>{provider.responseRate} response rate</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3">
              <Button className="bg-primary hover:bg-primary/90">Book Now</Button>
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
                <div className="space-y-4">
                  {services.map((service, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <span className="font-medium">{service.name}</span>
                      <span className="text-primary font-semibold">{service.price}</span>
                    </div>
                  ))}
                </div>
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
                <div className="space-y-4">
                  {/* Calendar Header */}
                  <div className="flex justify-between items-center mb-6">
                    <button className="text-2xl">&lt;</button>
                    <h3 className="text-lg font-semibold">July 2024</h3>
                    <button className="text-2xl">&gt;</button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                      <div key={idx} className="text-center font-semibold text-xs text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                    {[...Array(31)].map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedDate(idx + 1)}
                        className={`p-2 rounded text-sm font-medium transition ${
                          selectedDate === idx + 1 ? "bg-primary text-white" : "bg-secondary hover:bg-input"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>

                  {selectedDate && (
                    <p className="text-sm text-muted-foreground mt-4">Selected: July {selectedDate}, 2024</p>
                  )}
                </div>
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
                <div className="flex items-center gap-6 mb-8 pb-8 border-b border-border">
                  <div>
                    <div className="text-5xl font-bold">{provider.rating}</div>
                    <div className="flex gap-1 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{provider.reviews} reviews</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center gap-2">
                        <span className="text-xs font-medium">{rating}</span>
                        <div className="flex-1 h-2 bg-input rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${(6 - rating) * 15}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{Math.round((6 - rating) * 8)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Individual Reviews */}
                <div className="space-y-6">
                  {reviews.map((review, idx) => (
                    <div key={idx} className="pb-6 border-b border-border last:border-0">
                      <div className="flex gap-3 mb-3">
                        <Image
                          src={`https://images.unsplash.com/photo-${idx === 0 ? "1507003211169-0a1dd7228f2d" : idx === 1 ? "1494790108377-be9c29b29330" : "1500648767791-00dcc994a43e"}?w=40&h=40&fit=crop`}
                          alt={review.author}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold">{review.author}</h4>
                          <p className="text-xs text-muted-foreground">{review.date}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < review.rating ? "fill-primary text-primary" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-foreground">{review.text}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
