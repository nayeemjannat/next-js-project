"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Users, Zap, Eye } from "lucide-react"

export default function AdminAnalyticsPage() {
  const userGrowthData = [
    { month: "Jan", users: 2400 },
    { month: "Feb", users: 1398 },
    { month: "Mar", users: 9800 },
    { month: "Apr", users: 3908 },
    { month: "May", users: 4800 },
    { month: "Jun", users: 3800 },
    { month: "Jul", users: 4300 },
  ]

  const serviceData = [
    { service: "Cleaning", bookings: 1200 },
    { service: "Plumbing", bookings: 980 },
    { service: "Electrical", bookings: 750 },
    { service: "Appliance Repair", bookings: 450 },
    { service: "Painting", bookings: 520 },
  ]

  const earningsData = [
    { service: "Cleaning", earnings: 2400 },
    { service: "Plumbing", earnings: 1980 },
    { service: "Electrical", earnings: 1650 },
    { service: "Appliance Repair", earnings: 980 },
    { service: "Painting", earnings: 1200 },
  ]

  const providers = [
    { name: "Liam Carter", rating: 4.8, bookings: 234, earnings: "$5,678" },
    { name: "Olivia Bennett", rating: 4.9, bookings: 212, earnings: "$5,432" },
    { name: "Ethan Harper", rating: 4.7, bookings: 198, earnings: "$4,987" },
    { name: "Sophia Reed", rating: 4.6, bookings: 185, earnings: "$4,765" },
    { name: "Noah Foster", rating: 4.5, bookings: 172, earnings: "$4,543" },
  ]

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analytics Summary</h1>
        <p className="text-muted-foreground">Overview of platform performance and key metrics</p>
      </div>

      {/* Top Navigation */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Button variant="outline">Provider Management</Button>
        <Button variant="outline">User Management</Button>
        <Button variant="outline">Analytics</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <select className="border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary">
          <option>Date Range</option>
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>Last 90 days</option>
        </select>
        <select className="border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary">
          <option>Service Category</option>
          <option>All</option>
          <option>Cleaning</option>
          <option>Plumbing</option>
          <option>Electrical</option>
        </select>
        <select className="border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary">
          <option>Provider</option>
          <option>All</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="w-5 h-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12,345</div>
            <p className="text-xs text-primary mt-2">+5% from last month</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Providers</CardTitle>
              <Zap className="w-5 h-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2,567</div>
            <p className="text-xs text-green-600 mt-2">+3% from last month</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed Bookings</CardTitle>
              <Eye className="w-5 h-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8,912</div>
            <p className="text-xs text-blue-600 mt-2">+7% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Service Demand Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Service Demand</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="service" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Earnings by Service */}
        <Card>
          <CardHeader>
            <CardTitle>Total Earnings by Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={earningsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis type="number" />
                  <YAxis dataKey="service" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Providers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-2 font-semibold">Provider Name</th>
                    <th className="text-left py-3 px-2 font-semibold">Rating</th>
                    <th className="text-left py-3 px-2 font-semibold">Bookings</th>
                    <th className="text-left py-3 px-2 font-semibold">Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((provider, idx) => (
                    <tr key={idx} className="border-b border-border hover:bg-secondary transition">
                      <td className="py-3 px-2 font-medium">{provider.name}</td>
                      <td className="py-3 px-2">{provider.rating}</td>
                      <td className="py-3 px-2">{provider.bookings}</td>
                      <td className="py-3 px-2 font-medium text-primary">{provider.earnings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
