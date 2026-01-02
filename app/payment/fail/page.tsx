"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"
import { Header } from "@/components/header"
import Link from "next/link"

export default function PaymentFailPage() {
  const searchParams = useSearchParams()
  const transactionId = searchParams.get("transactionId")

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-12 h-12 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-3xl mb-4">Payment Failed</CardTitle>
              <p className="text-muted-foreground mb-6">
                Your payment could not be processed. Please try again or contact support if the problem persists.
              </p>
              {transactionId && (
                <p className="text-sm text-muted-foreground mb-6">
                  Transaction ID: <span className="font-mono">{transactionId}</span>
                </p>
              )}
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

