"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Star, Clock, DollarSign, Search } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"

interface Service {
  id: string
  name: string
  description: string | null
  category: string
  price: number
  priceType: string
  priceRange: string | null
  duration: number | null
  image: string | null
  provider: {
    id: string
    name: string
    avatar: string | null
    isVerified: boolean
  }
}

export default function ServicesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("relevance")
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")

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

  useEffect(() => {
    fetchServices()
  }, [selectedCategory, sortBy, verifiedOnly, minPrice, maxPrice])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCategory) params.append("category", selectedCategory)
      if (searchQuery) params.append("search", searchQuery)
      if (minPrice) params.append("minPrice", minPrice)
      if (maxPrice) params.append("maxPrice", maxPrice)
      if (verifiedOnly) params.append("verified", "true")
      params.append("sortBy", sortBy)

      const response = await fetch(`/api/services?${params.toString()}`)
      const data = await response.json()
      setServices(data.services || [])
    } catch (error) {
      console.error("Error fetching services:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchServices()
  }

  const formatPrice = (service: Service) => {
    if (service.priceRange) return `$${service.priceRange}`
    if (service.priceType === "hourly") return `$${service.price}/hour`
    return `$${service.price}`
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="flex">
        {/* Left Sidebar - Filters */}
        <aside className="w-64 bg-secondary border-r border-border p-6 min-h-[calc(100vh-64px)] overflow-y-auto">
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search services"
                className="w-full pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          <h3 className="font-semibold mb-4">Filters</h3>

          {/* Category Filter */}
          <div className="mb-6">
            <h4 className="font-medium text-sm mb-3">Category</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === null}
                  onChange={() => setSelectedCategory(null)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm">All Categories</span>
              </label>
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
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Min $"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full"
              />
              <Input
                type="number"
                placeholder="Max $"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Sort Options */}
          <div className="mb-6">
            <h4 className="font-medium text-sm mb-3">Sort By</h4>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="relevance">Relevance</option>
              <option value="price_asc">Price (Low to High)</option>
              <option value="price_desc">Price (High to Low)</option>
            </select>
          </div>

          {/* Verified Providers */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm">Verified Providers Only</span>
          </label>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-2">
            {selectedCategory ? `${selectedCategory} Services` : "All Services"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {selectedCategory
              ? `Find top-rated ${selectedCategory.toLowerCase()} services`
              : "Find top-rated service providers for any job, big or small."}
          </p>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading services...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No services found</p>
              <Button onClick={() => {
                setSelectedCategory(null)
                setSearchQuery("")
                setMinPrice("")
                setMaxPrice("")
                fetchServices()
              }}>Clear Filters</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((service) => (
                <Card key={`service-${service.id}`} className="hover:shadow-lg transition">
                  <CardContent className="p-0">
                    <div className="flex gap-4">
                      {/* Service Image */}
                      <div className="w-24 h-24 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                        <Image
                          src={service.image || service.provider.avatar || "/placeholder.svg"}
                          alt={service.name}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Service Info */}
                      <div className="flex-1 py-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{service.name}</h3>
                            <p className="text-sm text-muted-foreground mb-1">
                              by {service.provider.name}
                              {service.provider.isVerified && (
                                <span className="ml-2 text-primary">✓ Verified</span>
                              )}
                            </p>
                            {service.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span className="font-medium text-foreground">{formatPrice(service)}</span>
                          {service.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {service.duration} min
                            </span>
                          )}
                          <span className="text-xs bg-secondary px-2 py-1 rounded">{service.category}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                          <Link href={`/provider/${service.provider.id}`}>
                            <Button variant="outline" size="sm">
                              View Profile
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90"
                            onClick={() => {
                              if (!user) {
                                router.push(`/auth/login?redirect=/book/${service.id}`)
                              } else {
                                router.push(`/book/${service.id}`)
                              }
                            }}
                          >
                            Book Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
