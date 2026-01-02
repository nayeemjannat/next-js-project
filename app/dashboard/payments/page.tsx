"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Plus, Trash2, DollarSign, TrendingUp } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { toast } from "sonner"

interface Payment {
  id: string
  amount: number
  status: string
  method: string
  transactionId: string | null
  createdAt: string
  booking: {
    id: string
    service: {
      name: string
    }
    provider: {
      name: string
    }
  }
}

export default function PaymentsPage() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    totalSpent: 0,
    thisMonthSpent: 0,
    totalPayments: 0,
    successfulPayments: 0,
  })

  useEffect(() => {
    if (user) {
      fetchPayments()
    }
  }, [user])

  const fetchPayments = async () => {
    if (!user) return

    try {
      setLoading(true)
      // Fetch bookings and their payments
      const bookingsRes = await fetch(`/api/bookings?userId=${user.id}&userType=customer`)
      const bookingsData = await bookingsRes.json()

      if (bookingsRes.ok && bookingsData.bookings) {
        // Fetch payments for each booking
        const paymentsList: Payment[] = []
        for (const booking of bookingsData.bookings) {
          if (booking.paymentStatus === "paid") {
            // Try to get payment record
            try {
              const paymentRes = await fetch(`/api/payment/by-booking?bookingId=${booking.id}`)
              const paymentData = await paymentRes.json()
              if (paymentRes.ok && paymentData.payment) {
                paymentsList.push({
                  ...paymentData.payment,
                  booking: {
                    id: booking.id,
                    service: booking.service,
                    provider: booking.provider,
                  },
                })
              } else {
                // Create payment record from booking data
                paymentsList.push({
                  id: booking.id,
                  amount: booking.price,
                  status: "PAID",
                  method: booking.paymentMethod || "Unknown",
                  transactionId: null,
                  createdAt: booking.createdAt,
                  booking: {
                    id: booking.id,
                    service: booking.service,
                    provider: booking.provider,
                  },
                })
              }
            } catch (error) {
              // Fallback: create from booking
              paymentsList.push({
                id: booking.id,
                amount: booking.price,
                status: "PAID",
                method: booking.paymentMethod || "Unknown",
                transactionId: null,
                createdAt: booking.createdAt,
                booking: {
                  id: booking.id,
                  service: booking.service,
                  provider: booking.provider,
                },
              })
            }
          }
        }

        setPayments(paymentsList)

        // Calculate summary
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        const totalSpent = paymentsList.reduce((sum, p) => sum + p.amount, 0)
        const thisMonthSpent = paymentsList
          .filter((p) => new Date(p.createdAt) >= startOfMonth)
          .reduce((sum, p) => sum + p.amount, 0)
        const successfulPayments = paymentsList.filter((p) => p.status === "PAID").length

        setSummary({
          totalSpent,
          thisMonthSpent,
          totalPayments: paymentsList.length,
          successfulPayments,
        })
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
      toast.error("Failed to load payments")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading payments...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Payment Methods</h1>
          <p className="text-muted-foreground">Manage your payment information and transaction history</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                <p className="text-3xl font-bold">${summary.totalSpent.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">This Month</p>
                <p className="text-3xl font-bold">${summary.thisMonthSpent.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Payments</p>
                <p className="text-3xl font-bold">{summary.totalPayments}</p>
              </div>
              <CreditCard className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Payment History</h2>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No payment history yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{payment.booking.service.name}</h3>
                        <Badge
                          className={
                            payment.status === "PAID"
                              ? "bg-green-100 text-green-800 border-0"
                              : payment.status === "FAILED"
                              ? "bg-red-100 text-red-800 border-0"
                              : "bg-yellow-100 text-yellow-800 border-0"
                          }
                        >
                          {payment.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Provider: {payment.booking.provider.name} • {payment.method}
                      </p>
                      {payment.transactionId && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Transaction: <span className="font-mono">{payment.transactionId.slice(0, 16)}...</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">${payment.amount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
