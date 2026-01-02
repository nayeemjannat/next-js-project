"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts"
import { useAuth } from "@/components/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { DollarSign, TrendingUp, Calendar, Percent } from "lucide-react"

export default function EarningsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    totalEarnings: 0,
    totalCommission: 0,
    netEarnings: 0,
    thisMonthEarnings: 0,
    thisMonthCommission: 0,
    thisMonthNet: 0,
    totalBookings: 0,
    thisMonthBookings: 0,
  })
  const [chartData, setChartData] = useState<any[]>([])
  const [commissionRate, setCommissionRate] = useState(0.15)

  useEffect(() => {
    if (user && user.userType === "provider") {
      fetchEarnings()
    }
  }, [user])

  const fetchEarnings = async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch(`/api/provider/earnings?providerId=${user.id}`)
      const data = await response.json()

      if (response.ok) {
        setSummary(data.summary)
        setChartData(data.chartData || [])
        setCommissionRate(data.commissionRate || 0.15)
      }
    } catch (error) {
      console.error("Error fetching earnings:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedUserTypes={["provider"]}>
        <div className="p-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading earnings...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedUserTypes={["provider"]}>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-2">Earnings</h1>
        <p className="text-muted-foreground mb-8">Track your income and financial performance</p>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${summary.totalEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${summary.thisMonthNet.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Net (after {((commissionRate * 100).toFixed(0))}% commission)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Percent className="w-4 h-4" />
                Commission Paid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${summary.totalCommission.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Total platform fees</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Completed Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.totalBookings}</div>
              <p className="text-xs text-muted-foreground mt-1">{summary.thisMonthBookings} this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Earnings Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Gross Earnings (All Time)</p>
                <p className="text-2xl font-bold">${summary.totalEarnings.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Platform Commission ({((commissionRate * 100).toFixed(1))}%)</p>
                <p className="text-2xl font-bold text-red-600">-${summary.totalCommission.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Net Earnings (Your Take)</p>
                <p className="text-2xl font-bold text-green-600">${summary.netEarnings.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Earnings Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="earnings"
                      stroke="hsl(var(--primary))"
                      name="Gross Earnings"
                    />
                    <Line
                      type="monotone"
                      dataKey="net"
                      stroke="hsl(var(--chart-2))"
                      name="Net Earnings"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bookings per Month</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="bookings" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {chartData.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No earnings data available yet. Complete bookings to see your earnings.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  )
}
