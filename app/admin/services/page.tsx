"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Trash2, Search, Filter, Image as ImageIcon } from "lucide-react"
import Image from "next/image"
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
  isActive: boolean
  provider: {
    id: string
    name: string
    email: string
    avatar: string | null
    isVerified: boolean
  }
  images?: {
    id: string
    imageUrl: string
    order: number
  }[]
}

export default function AdminServicesPage() {
  const { user } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const categories = [
    "Plumbing",
    "Electrical", 
    "Cleaning",
    "Handyman",
    "Painting",
    "Moving",
    "Gardening",
    "Pest Control",
    "HVAC",
    "Carpentry",
    "Roofing"
  ]

  useEffect(() => {
    if (user) {
      fetchServices()
    }
  }, [user, searchQuery, selectedCategory])

  const fetchServices = async () => {
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append("search", searchQuery)
      if (selectedCategory) params.append("category", selectedCategory)
      params.append("includeInactive", "true") // Show all services for admin

      const response = await fetch(`/api/services?${params.toString()}`)
      const data = await response.json()
      
      if (response.ok && data.services) {
        setServices(data.services)
      }
    } catch (error) {
      console.error("Error fetching services:", error)
      toast.error("Failed to load services")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteImage = async (serviceId: string, imageId: string) => {
    try {
      const response = await fetch(`/api/services/${serviceId}/images?imageId=${imageId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Image deleted successfully")
        // Refresh the service details
        const updatedServices = services.map(service => {
          if (service.id === serviceId) {
            return {
              ...service,
              images: service.images?.filter(img => img.id !== imageId) || []
            }
          }
          return service
        })
        setServices(updatedServices)
        
        // Update selected service if modal is open
        if (selectedService && selectedService.id === serviceId) {
          setSelectedService({
            ...selectedService,
            images: selectedService.images?.filter(img => img.id !== imageId) || []
          })
        }
      } else {
        throw new Error("Failed to delete image")
      }
    } catch (error) {
      console.error("Error deleting image:", error)
      toast.error("Failed to delete image")
    }
  }

  const toggleServiceStatus = async (serviceId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      })

      if (response.ok) {
        toast.success(`Service ${isActive ? "activated" : "deactivated"} successfully`)
        setServices(services.map(service => 
          service.id === serviceId ? { ...service, isActive } : service
        ))
      } else {
        throw new Error("Failed to update service status")
      }
    } catch (error) {
      console.error("Error updating service:", error)
      toast.error("Failed to update service status")
    }
  }

  const viewServiceDetails = (service: Service) => {
    setSelectedService(service)
    setDetailsOpen(true)
  }

  const formatPrice = (service: Service) => {
    if (service.priceRange) return `$${service.priceRange}`
    if (service.priceType === "hourly") return `$${service.price}/hour`
    return `$${service.price}`
  }

  const filteredServices = services.filter(service => {
    const matchesSearch = !searchQuery || 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.provider.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = !selectedCategory || service.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading services...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Service Management</h1>
            <p className="text-muted-foreground">Monitor and manage all services and their images</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search services, providers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="w-48">
                <Select value={selectedCategory || ""} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services List */}
        <div className="space-y-4">
          {filteredServices.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground mb-4">No services found</p>
                <Button onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory(null)
                }}>Clear Filters</Button>
              </CardContent>
            </Card>
          ) : (
            filteredServices.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {/* Service Images */}
                    <div className="flex-shrink-0">
                      {service.images && service.images.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {service.images.slice(0, 6).map((image, index) => (
                            <div key={image.id} className="relative group">
                              <div className="w-20 h-20 rounded-lg overflow-hidden border">
                                <Image
                                  src={image.imageUrl}
                                  alt={`Service image ${index + 1}`}
                                  width={80}
                                  height={80}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <button
                                onClick={() => handleDeleteImage(service.id, image.id)}
                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete image"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {service.images.length > 6 && (
                            <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                              +{service.images.length - 6}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Service Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{service.name}</h3>
                          <p className="text-sm text-muted-foreground">by {service.provider.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={service.isActive ? "default" : "secondary"}>
                              {service.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">{service.category}</Badge>
                            {service.provider.isVerified && (
                              <Badge variant="secondary" className="text-xs">✓ Verified</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatPrice(service)}</p>
                          {service.duration && (
                            <p className="text-sm text-muted-foreground">{service.duration} min</p>
                          )}
                        </div>
                      </div>
                      
                      {service.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {service.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewServiceDetails(service)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleServiceStatus(service.id, !service.isActive)}
                        >
                          {service.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Service Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Service Details - {selectedService?.name}</DialogTitle>
          </DialogHeader>
          {selectedService && (
            <div className="space-y-6">
              {/* Provider Info */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={selectedService.provider.avatar || ""} />
                  <AvatarFallback>{selectedService.provider.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">{selectedService.provider.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedService.provider.email}</p>
                  {selectedService.provider.isVerified && (
                    <Badge variant="secondary" className="mt-1">✓ Verified Provider</Badge>
                  )}
                </div>
              </div>

              {/* Service Images Gallery */}
              <div>
                <h4 className="font-semibold mb-3">Service Images ({selectedService.images?.length || 0})</h4>
                {selectedService.images && selectedService.images.length > 0 ? (
                  <div className="grid grid-cols-4 gap-3">
                    {selectedService.images.map((image, index) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border">
                          <Image
                            src={image.imageUrl}
                            alt={`Service image ${index + 1}`}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                            onClick={() => window.open(image.imageUrl, '_blank')}
                          />
                        </div>
                        <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          #{index + 1}
                        </div>
                        <button
                          onClick={() => handleDeleteImage(selectedService.id, image.id)}
                          className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-muted rounded-lg">
                    <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No images uploaded for this service</p>
                  </div>
                )}
              </div>

              {/* Service Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Service Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span>{selectedService.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span>{formatPrice(selectedService)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{selectedService.duration ? `${selectedService.duration} minutes` : "Not specified"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={selectedService.isActive ? "default" : "secondary"}>
                        {selectedService.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {selectedService.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{selectedService.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
