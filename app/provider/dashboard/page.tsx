"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import type { User } from "@/lib/auth"
import { useRouter } from "next/navigation"

function ProviderMetrics({ providerId }: { providerId?: string }) {
  const [metrics, setMetrics] = useState({
    pendingBookings: 0,
    upcomingBookings: 0,
    monthlyEarnings: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (providerId) {
      fetchMetrics()
    }
  }, [providerId])

  const fetchMetrics = async () => {
    if (!providerId) return

    try {
      const response = await fetch(`/api/bookings?userId=${providerId}&userType=provider`)
      const data = await response.json()

      if (response.ok && data.bookings) {
        const bookings = data.bookings
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        const pendingBookings = bookings.filter((b: any) => b.status === "pending").length
        const upcomingBookings = bookings.filter(
          (b: any) => b.status === "confirmed" && new Date(b.scheduledDate) >= now
        ).length
        const monthlyEarnings = bookings
          .filter(
            (b: any) =>
              b.status === "completed" &&
              b.paymentStatus === "paid" &&
              new Date(b.completedAt || b.scheduledDate) >= startOfMonth
          )
          .reduce((sum: number, b: any) => sum + b.price, 0)

        setMetrics({
          pendingBookings,
          upcomingBookings,
          monthlyEarnings,
        })
      }
    } catch (error) {
      console.error("Error fetching metrics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">—</div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Active Booking Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.pendingBookings}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.upcomingBookings}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Earnings This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">${metrics.monthlyEarnings.toFixed(2)}</div>
        </CardContent>
      </Card>
    </div>
  )
}
  
  

function RecentActivity({ providerId }: { providerId?: string }) {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (providerId) {
      fetchActivities()
    }
  }, [providerId])

  const fetchActivities = async () => {
    if (!providerId) return

    try {
      const [bookingsRes, reviewsRes] = await Promise.all([
        fetch(`/api/bookings?userId=${providerId}&userType=provider`),
        fetch(`/api/reviews?providerId=${providerId}`),
      ])

      const bookingsData = await bookingsRes.json()
      const reviewsData = await reviewsRes.json()

      const activitiesList: any[] = []

      // Add recent bookings
      if (bookingsData.bookings) {
        bookingsData.bookings
          .slice(0, 3)
          .forEach((booking: any) => {
            activitiesList.push({
              type: "booking",
              name: booking.customer.name,
              action: `New booking request for ${booking.service.name}`,
              time: formatTimeAgo(new Date(booking.createdAt)),
              avatar: booking.customer.avatar,
            })
          })
      }

      // Add recent reviews
      if (reviewsData.reviews) {
        reviewsData.reviews.slice(0, 2).forEach((review: any) => {
          activitiesList.push({
            type: "review",
            name: review.customer.name,
            action: `Review for ${review.service.name}`,
            time: formatTimeAgo(new Date(review.createdAt)),
            avatar: review.customer.avatar,
          })
        })
      }

      // Sort by time and take latest 5
      setActivities(activitiesList.slice(0, 5))
    } catch (error) {
      console.error("Error fetching activities:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading activities...</div>
  }

  if (activities.length === 0) {
    return <div className="text-sm text-muted-foreground">No recent activity</div>
  }

  return (
    <>
      {activities.map((activity, idx) => (
        <div key={idx} className="flex items-center gap-4 pb-4 border-b last:border-0">
          <Avatar className="w-10 h-10">
            <AvatarImage src={activity.avatar || "/placeholder.svg"} />
            <AvatarFallback>{activity.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium text-sm">{activity.name}</p>
            <p className="text-xs text-muted-foreground">{activity.action}</p>
          </div>
          <span className="text-xs text-muted-foreground">{activity.time}</span>
        </div>
      ))}
    </>
  )
}

function AvailableBids({ providerId }: { providerId?: string | null }) {
  const [bids, setBids] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Proposal form
  const [selectedBid, setSelectedBid] = useState<any | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBidId, setEditingBidId] = useState<string | null>(null)
  const [bidsListOpen, setBidsListOpen] = useState(false)
  const [bidsList, setBidsList] = useState<any[]>([])
  const [price, setPrice] = useState("")
  const [message, setMessage] = useState("")
  const [estimatedTime, setEstimatedTime] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (providerId) fetchAvailable()
  }, [providerId])

  const fetchAvailable = async () => {
    if (!providerId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/service-bids?userId=${providerId}&userType=provider`)
      const data = await res.json()
      if (res.ok) setBids(data.bids || [])
    } catch (err) {
      console.error(err)
      toast.error("Failed to load available bids")
    } finally {
      setLoading(false)
    }
  }

  const submitProposal = async () => {
    if (!providerId || !selectedBid) return
    if (!price) return toast.error("Please enter a price")
    setSubmitting(true)
    try {
      let res
      if (editingBidId) {
        res = await fetch(`/api/provider-bids`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bidId: editingBidId,
            providerId,
            price: Number(price),
            message,
            estimatedTime: estimatedTime ? Number(estimatedTime) : undefined,
          }),
        })
      } else {
        res = await fetch(`/api/provider-bids`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            providerId,
            serviceBidId: selectedBid.id,
            price: Number(price),
            message,
            estimatedTime: estimatedTime ? Number(estimatedTime) : undefined,
          }),
        })
      }
      const data = await res.json()
      if (res.ok) {
        toast.success(editingBidId ? "Proposal updated" : "Proposal submitted")
        setSelectedBid(null)
        setDialogOpen(false)
        setPrice("")
        setMessage("")
        setEstimatedTime("")
        setEditingBidId(null)
        fetchAvailable()
      } else {
        throw new Error(data.error || "Failed to submit proposal")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to submit proposal")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-sm text-muted-foreground">Loading available bids...</div>

  return (
    <div>
      {bids.length === 0 ? (
        <div className="text-sm text-muted-foreground">No open requests</div>
      ) : (
        <div className="space-y-3">
          {bids.slice(0, 5).map((b) => (
            <div key={b.id} className="flex items-center justify-between border rounded p-3">
              <div>
                <div className="font-medium">{b.serviceCategory}</div>
                <div className="text-xs text-muted-foreground">{b.description}</div>
                {(b.budgetMin || b.budgetMax) && (
                  <div className="text-xs text-muted-foreground mt-1">Budget: {b.budgetMin ? `$${b.budgetMin.toFixed(2)}` : "—"} {b.budgetMax ? ` - $${b.budgetMax.toFixed(2)}` : ""}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const myBid = b.providerBids?.find((pb: any) => pb.providerId === providerId)
                  if (myBid) {
                    return (
                      <Button size="sm" onClick={() => {
                        setSelectedBid(b)
                        setPrice(String(myBid.price))
                        setMessage(myBid.message || "")
                        setEstimatedTime(myBid.estimatedTime ? String(myBid.estimatedTime) : "")
                        setEditingBidId(myBid.id)
                        setDialogOpen(true)
                      }}>Edit Proposal</Button>
                    )
                  }
                  return <Button size="sm" onClick={() => { setSelectedBid(b); setDialogOpen(true); setEditingBidId(null) }}>Submit Proposal</Button>
                })()}
                <Button size="sm" variant="outline" onClick={async () => {
                  try {
                    const res = await fetch(`/api/provider-bids?serviceBidId=${b.id}`)
                    const data = await res.json()
                    if (res.ok) {
                      setBidsList(data.bids || [])
                      setBidsListOpen(true)
                    } else {
                      toast.error(data.error || "Failed to load bids")
                    }
                  } catch (err) {
                    console.error(err)
                    toast.error("Failed to load bids")
                  }
                }}>View Proposals</Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ProposalDialog
        open={dialogOpen}
        onOpenChange={(open: boolean) => { setDialogOpen(open); if (!open) setSelectedBid(null) }}
        selectedBid={selectedBid}
        price={price}
        setPrice={setPrice}
        estimatedTime={estimatedTime}
        setEstimatedTime={setEstimatedTime}
        message={message}
        setMessage={setMessage}
        submitProposal={submitProposal}
        submitting={submitting}
      />
      <BidsListDialog open={bidsListOpen} onOpenChange={(open: boolean) => { setBidsListOpen(open); if (!open) setBidsList([]) }} bids={bidsList} />
    </div>
  )
}

// Global proposal dialog (renders once)
function ProposalDialog({ open, onOpenChange, selectedBid, price, setPrice, estimatedTime, setEstimatedTime, message, setMessage, submitProposal, submitting }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Proposal</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Price *</Label>
            <Input type="number" inputMode="decimal" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 120.00" />
          </div>
          <div>
            <Label>Estimated Time (minutes)</Label>
            <Input value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
          </div>
          <div className="flex gap-2">
            <Button onClick={submitProposal} disabled={submitting}>{submitting ? "Submitting..." : "Submit"}</Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function BidsListDialog({ open, onOpenChange, bids }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Proposals</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {bids.length === 0 ? (
            <div className="text-sm text-muted-foreground">No proposals</div>
          ) : (
            bids.map((pb: any) => (
              <div key={pb.id} className="flex items-center justify-between border rounded p-2">
                <div>
                  <div className="font-medium">{pb.provider?.name || 'Provider'}</div>
                  <div className="text-xs text-muted-foreground">${pb.price.toFixed(2)} • {pb.estimatedTime ? `${pb.estimatedTime} mins` : '—'}</div>
                  {pb.message && <div className="text-xs mt-1">{pb.message}</div>}
                </div>
                <div className="text-xs">{pb.status}</div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function ProviderDashboardPage() {
  const { user: authUser } = useAuth()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(authUser || null)

  // Refresh user data on mount to get latest verification status
  useEffect(() => {
    const refreshUser = async () => {
      try {
        const storedUser = localStorage.getItem("homease_user")
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
          
          // Fetch latest user data from API to get updated verification status
          const response = await fetch(`/api/auth/me?userId=${parsedUser.id}`)
          if (response.ok) {
            const data = await response.json()
            if (data.user) {
              setUser(data.user)
              localStorage.setItem("homease_user", JSON.stringify(data.user))
            }
          }
        }
      } catch (error) {
        console.error("Error refreshing user:", error)
      }
    }
    
    refreshUser()
    // Refresh every 30 seconds to check for verification status updates
    const interval = setInterval(refreshUser, 30000)
    return () => clearInterval(interval)
  }, [])

  const getVerificationStatus = () => {
    if (user?.isVerified) {
      return {
        status: "verified",
        icon: CheckCircle2,
        message: "Your account is verified and active.",
        className: "border-green-200 bg-green-50",
        iconColor: "text-green-600",
        textColor: "text-green-900",
      }
    }
    if (user?.verificationStatus === "rejected") {
      return {
        status: "rejected",
        icon: XCircle,
        message: user.rejectionReason || "Your verification was rejected. Please contact support.",
        className: "border-red-200 bg-red-50",
        iconColor: "text-red-600",
        textColor: "text-red-900",
      }
    }
    return {
      status: "pending",
      icon: Clock,
      message: "Your account verification is pending. You'll be notified once verified.",
      className: "border-yellow-200 bg-yellow-50",
      iconColor: "text-yellow-600",
      textColor: "text-yellow-900",
    }
  }

  const verificationInfo = getVerificationStatus()
  const StatusIcon = verificationInfo.icon

  return (
    <ProtectedRoute allowedUserTypes={["provider"]}>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground mb-8">Welcome back, {user?.name || "User"}</p>

        {/* Verification Status Banner */}
        {user?.userType === "provider" && (
          <Card className={`mb-6 ${verificationInfo.className}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <StatusIcon className={`w-5 h-5 ${verificationInfo.iconColor}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`font-medium ${verificationInfo.textColor}`}>
                      Verification Status:{" "}
                      <Badge
                        variant="outline"
                        className={
                          verificationInfo.status === "verified"
                            ? "bg-green-100 text-green-800 border-green-300"
                            : verificationInfo.status === "rejected"
                            ? "bg-red-100 text-red-800 border-red-300"
                            : "bg-yellow-100 text-yellow-800 border-yellow-300"
                        }
                      >
                        {verificationInfo.status === "verified"
                          ? "Verified"
                          : verificationInfo.status === "rejected"
                          ? "Rejected"
                          : "Pending"}
                      </Badge>
                    </p>
                  </div>
                  <p className={`text-sm ${verificationInfo.textColor} opacity-90`}>
                    {verificationInfo.message}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overview Cards */}
        <ProviderMetrics providerId={user?.id} />

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Available Bids Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Available Bids</CardTitle>
              </CardHeader>
              <CardContent>
                <AvailableBids providerId={user?.id} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RecentActivity providerId={user?.id} />
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={() => router.push("/provider/availability")}
                >
                  Update Availability
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full bg-transparent"
                  onClick={() => router.push("/provider/bookings")}
                >
                  View Bookings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
