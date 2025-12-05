"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Download } from "lucide-react"

export default function PaymentsPage() {
  const transactions = [
    {
      id: 1,
      bookingId: "#001",
      provider: "Alex R.",
      customer: "Sophia Clark",
      amount: "$150",
      date: "2024-12-15",
      status: "completed",
    },
    {
      id: 2,
      bookingId: "#002",
      provider: "Sarah L.",
      customer: "Emily Carter",
      amount: "$200",
      date: "2024-12-14",
      status: "completed",
    },
    {
      id: 3,
      bookingId: "#003",
      provider: "Mike J.",
      customer: "David Smith",
      amount: "$120",
      date: "2024-12-13",
      status: "pending",
    },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Payments</h1>
          <p className="text-muted-foreground">Manage platform payments and transactions</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search transactions..." className="pl-10" />
      </div>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Booking ID</th>
                  <th className="text-left py-3 px-4 font-semibold">Provider</th>
                  <th className="text-left py-3 px-4 font-semibold">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-border hover:bg-secondary/50 transition">
                    <td className="py-3 px-4 font-medium">{tx.bookingId}</td>
                    <td className="py-3 px-4">{tx.provider}</td>
                    <td className="py-3 px-4">{tx.customer}</td>
                    <td className="py-3 px-4 font-medium text-primary">{tx.amount}</td>
                    <td className="py-3 px-4 text-muted-foreground">{tx.date}</td>
                    <td className="py-3 px-4">
                      <Badge
                        className={
                          tx.status === "completed"
                            ? "bg-green-100 text-green-800 border-0"
                            : "bg-yellow-100 text-yellow-800 border-0"
                        }
                      >
                        {tx.status}
                      </Badge>
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
