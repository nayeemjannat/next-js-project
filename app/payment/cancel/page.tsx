"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { Header } from "@/components/header"
import Link from "next/link"

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-12 h-12 text-yellow-600" />
                </div>
              </div>
              <CardTitle className="text-3xl mb-4">Payment Cancelled</CardTitle>
              <p className="text-muted-foreground mb-6">
                You cancelled the payment process. Your booking is still pending payment.
              </p>
              <div className="flex gap-4 justify-center">
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link href="/dashboard/bookings">Go to Bookings</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/services">Browse Services</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

