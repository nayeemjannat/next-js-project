"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"

export default function ProviderServicesPage() {
  const services = [
    {
      id: 1,
      name: "Plumbing Repair",
      category: "Home Repair",
      price: "$50 - $150 (Fixed)",
      status: "Active",
    },
    {
      id: 2,
      name: "Electrical Wiring",
      category: "Home Repair",
      price: "$60/hour",
      status: "Active",
    },
    {
      id: 3,
      name: "Appliance Installation",
      category: "Home Repair",
      price: "$70 - $200 (Fixed)",
      status: "Inactive",
    },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Manage Services</h1>
        <Button className="bg-primary hover:bg-primary/90">Add New Service</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Services</CardTitle>
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
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id} className="border-b border-border hover:bg-secondary transition">
                    <td className="py-3 px-4 font-medium">{service.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{service.category}</td>
                    <td className="py-3 px-4 text-primary font-medium">{service.price}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          service.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {service.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
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
    </div>
  )
}
