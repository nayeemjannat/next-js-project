"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProtectedRoute } from "@/components/protected-route"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-context"

export default function AdminBidsPage() {
  const { user } = useAuth()
  const [bids, setBids] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBids()
  }, [])

  const fetchBids = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/service-bids`)
      const data = await res.json()
      if (res.ok) setBids(data.bids || [])
    } catch (err) {
      console.error(err)
      toast.error("Failed to load bids")
    } finally {
      setLoading(false)
    }
  }

  const handleDisableBid = async (providerBidId: string) => {
    try {
      const res = await fetch(`/api/admin/bids/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disableBid", providerBidId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Bid disabled")
        fetchBids()
      } else throw new Error(data.error || "Failed")
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to disable bid")
    }
  }

  const handleSuspendProvider = async (providerId: string) => {
    try {
      const res = await fetch(`/api/admin/bids/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suspendProvider", providerId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Provider suspended")
        fetchBids()
      } else throw new Error(data.error || "Failed")
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to suspend provider")
    }
  }

  if (!user) return <div className="p-8">Loading...</div>

  return (
    <ProtectedRoute allowedUserTypes={["admin"]}>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Service Bids Moderation</h1>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="space-y-4">
            {bids.map((b) => (
              <Card key={b.id}>
                <CardHeader>
                  <CardTitle>{b.serviceCategory} — {b.customer?.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{b.description}</p>
                  <div className="mt-3 space-y-2">
                    {b.providerBids && b.providerBids.length > 0 ? (
                      b.providerBids.map((pb: any) => (
                        <div key={pb.id} className="flex items-center justify-between border rounded p-2">
                          <div>
                            <div className="font-medium">{pb.provider?.name}</div>
                            <div className="text-xs text-muted-foreground">${pb.price} • {pb.message}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleDisableBid(pb.id)}>Disable</Button>
                            <Button size="sm" onClick={() => handleSuspendProvider(pb.providerId)}>Suspend Provider</Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground">No proposals</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
