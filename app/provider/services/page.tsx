"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Plus, X, Camera, Image as ImageIcon, Eye } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { toast } from "sonner"
import Image from "next/image"

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
  serviceArea: string | null
  isActive: boolean
  images?: {
    id: string
    imageUrl: string
    order: number
  }[]
}

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

export default function ProviderServicesPage() {
  const { user } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Cleaning",
    price: "",
    priceType: "fixed",
    priceRange: "",
    duration: "",
    image: "",
    serviceArea: "",
    isActive: true,
  })
  const [serviceImages, setServiceImages] = useState<string[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    if (user) {
      fetchServices()
    }
  }, [user])

  const fetchServices = async () => {
    if (!user) return

    try {
      // Fetch services for this provider
      const response = await fetch(`/api/services?providerId=${user.id}`)
      const data = await response.json()
      
      // Filter to only show this provider's services
      const providerServices = (data.services || []).filter(
        (s: any) => s.provider.id === user.id
      )
      setServices(providerServices)
    } catch (error) {
      console.error("Error fetching services:", error)
      toast.error("Failed to load services")
    } finally {
      setLoading(false)
    }
  }

  const fetchServiceImages = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/services/${serviceId}/images`)
      const data = await response.json()
      if (response.ok && data.images) {
        const imageUrls = data.images.map((img: any) => img.imageUrl)
        setServiceImages(imageUrls)
        setImagePreviews(imageUrls)
      }
    } catch (error) {
      console.error("Error fetching service images:", error)
    }
  }

  const handleOpenDialog = async (service?: Service) => {
    if (service) {
      setEditingService(service)
      // Initialize form based on priceType - avoid conflicts
      const isRange = service.priceType === "range"
      setFormData({
        name: service.name,
        description: service.description || "",
        category: service.category,
        price: isRange ? "" : service.price.toString(),
        priceType: service.priceType,
        priceRange: isRange ? (service.priceRange || "") : "",
        duration: service.duration?.toString() || "",
        image: service.image || "",
        serviceArea: service.serviceArea || "",
        isActive: service.isActive,
      })
      await fetchServiceImages(service.id)
    } else {
      setEditingService(null)
      setFormData({
        name: "",
        description: "",
        category: "Cleaning",
        price: "",
        priceType: "fixed",
        priceRange: "",
        duration: "",
        image: "",
        serviceArea: "",
        isActive: true,
      })
      setServiceImages([])
      setImagePreviews([])
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingService(null)
    setServiceImages([])
    setImagePreviews([])
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newPreviews: string[] = []
    const newImages: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`)
        continue
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`)
        continue
      }

      try {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = reader.result as string
          newPreviews.push(base64)
          newImages.push(base64)

          if (newPreviews.length === files.length) {
            setImagePreviews([...imagePreviews, ...newPreviews])
            setServiceImages([...serviceImages, ...newImages])
          }
        }
        reader.readAsDataURL(file)
      } catch (error) {
        console.error("Error reading file:", error)
        toast.error(`Failed to process ${file.name}`)
      }
    }
  }

  const handleRemoveImage = (index: number) => {
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    const newImages = serviceImages.filter((_, i) => i !== index)
    setImagePreviews(newPreviews)
    setServiceImages(newImages)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!formData.name || !formData.category) {
      toast.error("Please fill in all required fields")
      return
    }

    // Validate pricing based on priceType
    if (formData.priceType === "range") {
      if (!formData.priceRange) {
        toast.error("Please enter a price range")
        return
      }
    } else {
      if (!formData.price) {
        toast.error("Please enter a price")
        return
      }
    }

    try {
      let serviceId: string

      if (editingService) {
        // Update service
        const response = await fetch(`/api/services/${editingService.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            category: formData.category,
            price: formData.price,
            priceType: formData.priceType,
            priceRange: formData.priceRange || null,
            duration: formData.duration || null,
            image: formData.image || null,
            serviceArea: formData.serviceArea || null,
            isActive: formData.isActive,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to update service")
        }

        serviceId = editingService.id
        toast.success("Service updated successfully")
      } else {
        // Create service
        const response = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            providerId: user.id,
            name: formData.name,
            description: formData.description,
            category: formData.category,
            price: formData.price,
            priceType: formData.priceType,
            priceRange: formData.priceRange || null,
            duration: formData.duration || null,
            image: formData.image || null,
            serviceArea: formData.serviceArea || null,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to create service")
        }

        const data = await response.json()
        serviceId = data.service.id
        toast.success("Service created successfully")
      }

      // Save images if any
      if (serviceImages.length > 0) {
        try {
          const imagesResponse = await fetch(`/api/services/${serviceId}/images`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ images: serviceImages }),
          })

          if (!imagesResponse.ok) {
            console.error("Failed to save images")
          }
        } catch (error) {
          console.error("Error saving images:", error)
        }
      }

      handleCloseDialog()
      fetchServices()
    } catch (error) {
      console.error("Error saving service:", error)
      toast.error("Failed to save service")
    }
  }

  const handleDelete = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return

    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete service")
      }

      toast.success("Service deleted successfully")
      fetchServices()
    } catch (error) {
      console.error("Error deleting service:", error)
      toast.error("Failed to delete service")
    }
  }

  const formatPrice = (service: Service) => {
    if (service.priceRange) return `$${service.priceRange}`
    if (service.priceType === "hourly") return `$${service.price}/hour`
    return `$${service.price}`
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading services...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Manage Services</h1>
          <p className="text-muted-foreground mt-1">Add, edit, or remove your services</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90" onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Service
        </Button>
      </div>

      {services.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No services yet</p>
            <Button onClick={() => handleOpenDialog()}>Add Your First Service</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Services ({services.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">Service</th>
                    <th className="text-left py-3 px-4 font-semibold">Category</th>
                    <th className="text-left py-3 px-4 font-semibold">Pricing</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Images</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.id} className="border-b border-border hover:bg-secondary transition">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{service.name}</div>
                          {service.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1">{service.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{service.category}</td>
                      <td className="py-3 px-4 text-primary font-medium">{formatPrice(service)}</td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            service.isActive
                              ? "bg-green-100 text-green-700 border-0"
                              : "bg-gray-100 text-gray-700 border-0"
                          }
                        >
                          {service.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {service.images && service.images.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                              {service.images.slice(0, 3).map((image, index) => (
                                <div key={image.id} className="w-6 h-6 rounded-full border-2 border-background overflow-hidden">
                                  <img
                                    src={image.imageUrl}
                                    alt={`Image ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {service.images.length} image{service.images.length > 1 ? 's' : ''}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const imageUrls = service.images!.map(img => img.imageUrl)
                                openGallery(imageUrls, 0)
                              }}
                              title="View gallery"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No images</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(service)}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(service.id)}
                            title="Delete"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Service Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingService ? "Edit Service" : "Add New Service"}</DialogTitle>
            <DialogDescription>
              {editingService
                ? "Update your service details below"
                : "Fill in the details to add a new service to your profile"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">
                  Service Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Home Cleaning"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your service..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="priceType">Price Type</Label>
                <select
                  id="priceType"
                  value={formData.priceType}
                  onChange={(e) => {
                    const newPriceType = e.target.value
                    // Clear conflicting fields when changing price type
                    if (newPriceType === "range") {
                      setFormData({ ...formData, priceType: newPriceType, price: "" })
                    } else {
                      setFormData({ ...formData, priceType: newPriceType, priceRange: "" })
                    }
                  }}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="fixed">Fixed Price</option>
                  <option value="hourly">Per Hour</option>
                  <option value="range">Price Range</option>
                </select>
              </div>

              {formData.priceType === "range" ? (
                <div className="col-span-2">
                  <Label htmlFor="priceRange">
                    Price Range <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="priceRange"
                    placeholder="e.g., 80-120"
                    value={formData.priceRange}
                    onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Enter range as "min-max" (e.g., 80-120)</p>
                </div>
              ) : (
                <div className="col-span-2">
                  <Label htmlFor="price">
                    Price <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 100"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
              )}

              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="e.g., 120"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="serviceArea">Service Area</Label>
                <Input
                  id="serviceArea"
                  placeholder="e.g., San Francisco, CA"
                  value={formData.serviceArea}
                  onChange={(e) => setFormData({ ...formData, serviceArea: e.target.value })}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="image">Main Image URL (Optional)</Label>
                <Input
                  id="image"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">This will be used as the primary thumbnail</p>
              </div>

              <div className="col-span-2">
                <Label>Service Gallery (Previous Work Photos)</Label>
                <div className="mt-2">
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" asChild>
                      <span>
                        <Camera className="w-4 h-4 mr-2" />
                        Upload Images
                      </span>
                    </Button>
                  </Label>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground mt-2">Upload multiple images to showcase your previous work</p>
                </div>

                {imagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border border-border">
                          <Image
                            src={preview}
                            alt={`Service image ${index + 1}`}
                            width={150}
                            height={150}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {editingService && (
                <div className="col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm">Active (visible to customers)</span>
                  </label>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                {editingService ? "Update Service" : "Create Service"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black-70"
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
