"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MapPin, Edit2, Trash2, Plus } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { toast } from "sonner"

interface Address {
  id: string
  label: string
  address: string
  city: string | null
  state: string | null
  zipCode: string | null
  isDefault: boolean
}

export default function AddressesPage() {
  const { user } = useAuth()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [formData, setFormData] = useState({
    label: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    isDefault: false,
  })

  useEffect(() => {
    if (user) {
      fetchAddresses()
    }
  }, [user])

  const fetchAddresses = async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch(`/api/addresses?customerId=${user.id}`)
      const data = await response.json()

      if (response.ok) {
        setAddresses(data.addresses || [])
      }
    } catch (error) {
      console.error("Error fetching addresses:", error)
      toast.error("Failed to load addresses")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (address?: Address) => {
    if (address) {
      setEditingAddress(address)
      setFormData({
        label: address.label,
        address: address.address,
        city: address.city || "",
        state: address.state || "",
        zipCode: address.zipCode || "",
        isDefault: address.isDefault,
      })
    } else {
      setEditingAddress(null)
      setFormData({
        label: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        isDefault: false,
      })
    }
    setOpen(true)
  }

  const handleSave = async () => {
    if (!user) return

    if (!formData.label || !formData.address) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      if (editingAddress) {
        // Update existing address
        const response = await fetch(`/api/addresses/${editingAddress.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            customerId: user.id,
          }),
        })

        const data = await response.json()
        if (response.ok) {
          toast.success("Address updated successfully!")
          setOpen(false)
          fetchAddresses()
        } else {
          throw new Error(data.error || "Failed to update address")
        }
      } else {
        // Create new address
        const response = await fetch("/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            customerId: user.id,
          }),
        })

        const data = await response.json()
        if (response.ok) {
          toast.success("Address added successfully!")
          setOpen(false)
          fetchAddresses()
        } else {
          throw new Error(data.error || "Failed to add address")
        }
      }
    } catch (error) {
      console.error("Error saving address:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save address")
    }
  }

  const handleDelete = async (addressId: string) => {
    if (!user) return
    if (!confirm("Are you sure you want to delete this address?")) return

    try {
      const response = await fetch(`/api/addresses/${addressId}?customerId=${user.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Address deleted successfully!")
        fetchAddresses()
      } else {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete address")
      }
    } catch (error) {
      console.error("Error deleting address:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete address")
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading addresses...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Addresses</h1>
          <p className="text-muted-foreground">Manage your service locations</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 gap-2" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4" />
              Add Address
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAddress ? "Edit Address" : "Add New Address"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="label">Label *</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Home, Work, etc."
                />
              </div>
              <div>
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main Street"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="San Francisco"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="CA"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="94102"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 accent-primary"
                />
                <Label htmlFor="isDefault" className="cursor-pointer">
                  Set as default address
                </Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1">
                  {editingAddress ? "Update Address" : "Add Address"}
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No addresses saved yet</p>
            <Button onClick={() => handleOpenDialog()}>Add Your First Address</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <Card key={address.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex items-start gap-4 flex-1">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{address.label}</h3>
                        {address.isDefault && (
                          <Badge className="bg-primary/20 text-primary border-0">Default</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {address.address}
                        {address.city && `, ${address.city}`}
                        {address.state && `, ${address.state}`}
                        {address.zipCode && ` ${address.zipCode}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(address)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(address.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
