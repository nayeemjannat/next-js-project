"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Download } from "lucide-react"
import { toast } from "sonner"

interface Payment {
  id: string
  status: string
  transactionId: string | null
  method: string
  amount: number
  createdAt: string
  booking: {
    id: string
    customer: {
      name: string
    }
    provider: {
      name: string
    }
    service: {
      name: string
    }
  }
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/payments")
      const data = await response.json()

      if (response.ok) {
        setPayments(data.payments || [])
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
      toast.error("Failed to load payments")
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = payments.filter(
    (payment) =>
      payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.booking.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.booking.provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.booking.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalRevenue = payments.filter((p) => p.status === "PAID").reduce((sum, p) => sum + p.amount, 0)
  const totalTransactions = payments.length
  const successfulPayments = payments.filter((p) => p.status === "PAID").length

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
          <h1 className="text-3xl font-bold mb-2">Payments</h1>
          <p className="text-muted-foreground">Manage platform payments and transactions</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Total Revenue</div>
            <div className="text-3xl font-bold">${totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Total Transactions</div>
            <div className="text-3xl font-bold">{totalTransactions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Success Rate</div>
            <div className="text-3xl font-bold">
              {totalTransactions > 0 ? ((successfulPayments / totalTransactions) * 100).toFixed(1) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search transactions..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-6">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No payments found matching your search." : "No payments found."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Transaction ID</th>
                    <th className="text-left py-3 px-4 font-semibold">Booking ID</th>
                    <th className="text-left py-3 px-4 font-semibold">Provider</th>
                    <th className="text-left py-3 px-4 font-semibold">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold">Service</th>
                    <th className="text-left py-3 px-4 font-semibold">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold">Method</th>
                    <th className="text-left py-3 px-4 font-semibold">Date</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-border hover:bg-secondary/50 transition">
                      <td className="py-3 px-4 font-mono text-xs">
                        {payment.transactionId ? payment.transactionId.slice(0, 12) + "..." : "N/A"}
                      </td>
                      <td className="py-3 px-4 font-medium">#{payment.booking.id.slice(0, 8)}</td>
                      <td className="py-3 px-4">{payment.booking.provider.name}</td>
                      <td className="py-3 px-4">{payment.booking.customer.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{payment.booking.service.name}</td>
                      <td className="py-3 px-4 font-medium text-primary">${payment.amount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{payment.method}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
