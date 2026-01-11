"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import { Header } from "@/components/header"
import Link from "next/link"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const bid = params.get("bookingId")
    const tid = params.get("transactionId") || params.get("tran_id") || params.get("val_id")
    setBookingId(bid)
    setTransactionId(tid)

    // Verify payment if transaction ID is present
    if (tid) {
      verifyPayment(tid, bid)
    } else {
      setVerifying(false)
    }
  }, [])

  const verifyPayment = async (tranId: string, bid: string | null) => {
    try {
      const response = await fetch(`/api/payment/verify?transactionId=${tranId}${bid ? `&bookingId=${bid}` : ""}`)
      if (response.ok) {
        const data = await response.json()
        if (data.verified && data.booking) {
          // Payment verified and booking updated
        }
      }
    } catch (error) {
      console.error("Payment verification error:", error)
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>
              {verifying ? (
                <>
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <CardTitle className="text-3xl mb-4">Verifying Payment...</CardTitle>
                  <p className="text-muted-foreground mb-6">Please wait while we verify your payment.</p>
                </>
              ) : (
                <>
                  <CardTitle className="text-3xl mb-4">Payment Successful!</CardTitle>
                  <p className="text-muted-foreground mb-6">
                    Your payment has been processed successfully. Your booking is now confirmed.
                  </p>
                  {transactionId && (
                    <p className="text-sm text-muted-foreground mb-6">
                      Transaction ID: <span className="font-mono">{transactionId}</span>
                    </p>
                  )}
                </>
              )}
              <div className="flex gap-4 justify-center">
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link href="/dashboard/bookings">View My Bookings</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/services">Browse More Services</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

