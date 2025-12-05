"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Plus, Trash2 } from "lucide-react"

export default function PaymentsPage() {
  const paymentMethods = [
    {
      id: 1,
      type: "Credit Card",
      label: "Visa",
      last4: "4242",
      expiryMonth: "12",
      expiryYear: "2025",
      isDefault: true,
    },
    {
      id: 2,
      type: "Credit Card",
      label: "Mastercard",
      last4: "5555",
      expiryMonth: "08",
      expiryYear: "2026",
      isDefault: false,
    },
    {
      id: 3,
      type: "PayPal",
      label: "PayPal",
      last4: "email@example.com",
      isDefault: false,
    },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Payment Methods</h1>
          <p className="text-muted-foreground">Manage your payment information</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 gap-2">
          <Plus className="w-4 h-4" />
          Add Payment Method
        </Button>
      </div>

      <div className="space-y-3 max-w-2xl">
        {paymentMethods.map((method) => (
          <Card key={method.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{method.label}</h3>
                      {method.isDefault && <Badge className="bg-primary/20 text-primary border-0">Default</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {method.type === "PayPal" ? method.last4 : `•••• •••• •••• ${method.last4}`}
                    </p>
                    {method.expiryMonth && (
                      <p className="text-xs text-muted-foreground">
                        Expires {method.expiryMonth}/{method.expiryYear}
                      </p>
                    )}
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
