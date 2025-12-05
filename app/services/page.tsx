"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Star, Clock, DollarSign } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function ServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState("Cleaning")
  const [sortBy, setSortBy] = useState("Relevance")

  const categories = [
    "Plumbing",
    "Electrical",
    "Cleaning",
    "Handyman",
    "Painting",
    "Moving",
    "Gardening",
    "Pest Control",
    "Appliance Repair",
    "Car Wash",
  ]

  const providers = [
    {
      id: 1,
      name: "Golden Gate Cleaning",
      rating: 4.8,
      reviews: 123,
      distance: 2.5,
      eta: 15,
      cost: "80-120",
      status: "Available",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    },
    {
      id: 2,
      name: "Bay Area Cleaning Solutions",
      rating: 4.7,
      reviews: 98,
      distance: 3.2,
      eta: 20,
      cost: "90-130",
      status: "Busy",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    },
    {
      id: 3,
      name: "Citywide Cleaning Services",
      rating: 4.6,
      reviews: 75,
      distance: 4.1,
      eta: 25,
      cost: "100-150",
      status: "Available",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="flex">
        {/* Left Sidebar - Filters */}
        <aside className="w-64 bg-secondary border-r border-border p-6 min-h-[calc(100vh-64px)]">
          <div className="mb-6">
            <Input placeholder="Search services" className="w-full" />
          </div>

          <h3 className="font-semibold mb-4">Filters</h3>

          {/* Category Filter */}
          <div className="mb-6">
            <h4 className="font-medium text-sm mb-3">Category</h4>
            <div className="space-y-2">
              {categories.map((cat) => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value={cat}
                    checked={selectedCategory === cat}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="mb-6">
            <h4 className="font-medium text-sm mb-3">Price Range</h4>
            <input type="range" min="0" max="500" className="w-full" />
          </div>

          {/* Rating Filter */}
          <div className="mb-6">
            <h4 className="font-medium text-sm mb-3">Rating</h4>
            <div className="space-y-2">
              {["4 stars & up", "3 stars & up", "2 stars & up", "1 star & up"].map((rating) => (
                <label key={rating} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="rating" className="w-4 h-4 accent-primary" />
                  <span className="text-sm">{rating}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Verified Providers */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-primary" />
            <span className="text-sm">Verified Providers</span>
          </label>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-2">{selectedCategory} Services in San Francisco</h1>
          <p className="text-muted-foreground mb-8">
            Find top-rated {selectedCategory.toLowerCase()} for any job, big or small.
          </p>

          {/* Sort Options */}
          <div className="flex gap-4 mb-6">
            <div className="flex gap-2">
              <Button variant={sortBy === "Map" ? "default" : "outline"} onClick={() => setSortBy("Map")}>
                Map
              </Button>
              <Button variant={sortBy === "List" ? "default" : "outline"} onClick={() => setSortBy("List")}>
                List
              </Button>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option>Relevance</option>
              <option>Price (Low to High)</option>
              <option>Price (High to Low)</option>
            </select>
          </div>

          {/* Map View Placeholder */}
          <div className="bg-blue-100 rounded-lg h-96 mb-8 flex items-center justify-center text-muted-foreground">
            Interactive Map - Nearby {selectedCategory} Providers
          </div>

          {/* Provider List */}
          <h2 className="text-xl font-bold mb-4">Nearby {selectedCategory} Providers</h2>
          <div className="space-y-4">
            {providers.map((provider) => (
              <Card key={provider.id} className="hover:shadow-lg transition">
                <CardContent className="p-0">
                  <div className="flex gap-4">
                    {/* Provider Image */}
                    <div className="w-24 h-24 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                      <Image
                        src={provider.image || "/placeholder.svg"}
                        alt={provider.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Provider Info */}
                    <div className="flex-1 py-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">{provider.name}</h3>
                        <Link href={`/provider/${provider.id}`}>
                          <Button variant="ghost" size="sm">
                            View Profile
                          </Button>
                        </Link>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-primary text-primary" />
                          {provider.rating} ({provider.reviews} reviews)
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {provider.distance} miles
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          ETA: {provider.eta} min
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          Est. Cost: ${provider.cost}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            provider.status === "Available"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          Status: {provider.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Multi-Provider Bids Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Multi-Provider Bids</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground mb-4">
                Get multiple bids for your {selectedCategory.toLowerCase()} project
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Post your project details and receive bids from multiple providers. Compare quotes and choose the best
                fit for your needs.
              </p>
              <Button className="bg-primary hover:bg-primary/90">Post a Project</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
