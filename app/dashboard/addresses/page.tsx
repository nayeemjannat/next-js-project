"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Edit2, Trash2, Plus } from "lucide-react"

export default function AddressesPage() {
  const addresses = [
    {
      id: 1,
      label: "Home",
      address: "123 Main Street, San Francisco, CA 94102",
      isDefault: true,
    },
    {
      id: 2,
      label: "Work",
      address: "456 Market Street, San Francisco, CA 94103",
      isDefault: false,
    },
    {
      id: 3,
      label: "Parent's House",
      address: "789 Oak Avenue, Oakland, CA 94607",
      isDefault: false,
    },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Addresses</h1>
          <p className="text-muted-foreground">Manage your service locations</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 gap-2">
          <Plus className="w-4 h-4" />
          Add Address
        </Button>
      </div>

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
                      {address.isDefault && <Badge className="bg-primary/20 text-primary border-0">Default</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{address.address}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
