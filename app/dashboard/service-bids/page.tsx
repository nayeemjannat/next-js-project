"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/components/auth-context"
import { toast } from "sonner"

export default function ServiceBidsPage() {
  const { user } = useAuth()
  const [bids, setBids] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Create form state
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [budgetMin, setBudgetMin] = useState("")
  const [budgetMax, setBudgetMax] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [stateVal, setStateVal] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [deadline, setDeadline] = useState("")
  const [creating, setCreating] = useState(false)

  const [selectedBid, setSelectedBid] = useState<any | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (user) fetchBids()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Open detail dialog if notification linked with ?bidId=
  const searchParams = useSearchParams()
  useEffect(() => {
    const bidId = searchParams?.get?.("bidId")
    if (bidId && bids.length > 0) {
      const found = bids.find((x) => x.id === bidId)
      if (found) {
        setSelectedBid(found)
        setDetailOpen(true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, bids])

  const fetchBids = async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch(`/api/service-bids?userId=${user.id}&userType=customer`)
      const data = await res.json()
      if (res.ok) setBids(data.bids || [])
    } catch (err) {
      console.error(err)
      toast.error("Failed to load bids")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!user) return
    if (!category) return toast.error("Please select a category")
    setCreating(true)
    try {
      const res = await fetch("/api/service-bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: user.id,
          serviceCategory: category,
          description,
          budgetMin: budgetMin ? Number(budgetMin) : undefined,
          budgetMax: budgetMax ? Number(budgetMax) : undefined,
          address,
          city,
          state: stateVal,
          zipCode,
          deadline: deadline || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Service request created")
        // refresh
        fetchBids()
      } else {
        throw new Error(data.error || "Failed to create")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to create service request")
    } finally {
      setCreating(false)
    }
  }

  const handleAccept = async (providerBidId: string) => {
    if (!user) return
    try {
      const res = await fetch(`/api/provider-bids/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: user.id, actorType: user.userType, providerBidId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Provider accepted — request assigned")
        fetchBids()
      } else {
        throw new Error(data.error || "Failed to accept")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to accept bid")
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Service Requests</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Create Service Bid</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Service Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Category *</Label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Plumbing" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Budget Min</Label>
                  <Input value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="Optional" />
                </div>
                <div>
                  <Label>Budget Max</Label>
                  <Input value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="Optional" />
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>City</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
                </div>
                <div>
                  <Label>State</Label>
                  <Input value={stateVal} onChange={(e) => setStateVal(e.target.value)} placeholder="State" />
                </div>
                <div>
                  <Label>Zip</Label>
                  <Input value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="Zip" />
                </div>
              </div>
              <div>
                <Label>Deadline</Label>
                <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={creating}>{creating ? "Creating..." : "Create"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {bids.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">No service requests found</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bids.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{b.serviceCategory}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{b.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">Status: {b.status}</p>
                    {(b.address || b.city) && (
                      <p className="text-xs text-muted-foreground mt-1">{b.address}{b.city ? `, ${b.city}` : ''}{b.state ? `, ${b.state}` : ''} {b.zipCode || ''}</p>
                    )}
                  </div>
                  <div className="min-w-[260px]">
                    <h4 className="text-sm font-medium">Proposals</h4>
                    <div className="space-y-2 mt-2">
                      {b.providerBids && b.providerBids.length > 0 ? (
                        b.providerBids.slice(0, 3).map((pb: any) => (
                          <div key={pb.id} className="flex items-center justify-between border rounded p-2">
                            <div>
                              <div className="font-medium">{pb.provider?.name || "Provider"}</div>
                              <div className="text-xs text-muted-foreground">${pb.price.toFixed(2)} • {pb.estimatedTime ? `${pb.estimatedTime} mins` : "—"}</div>
                              {pb.message && <div className="text-xs mt-1">{pb.message}</div>}
                            </div>
                            <div className="flex flex-col gap-2">
                              <div className="text-xs">{pb.status}</div>
                              {pb.status === "PENDING" && (
                                <Button size="sm" onClick={() => handleAccept(pb.id)}>Accept</Button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-muted-foreground">No proposals yet</div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => { setSelectedBid(b); setDetailOpen(true) }}>View Details</Button>
                      {b.booking && b.booking.status?.toString().trim() !== 'completed' && (
                        <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/bookings?bookingId=${b.booking.id}`)}>Complete Booking</Button>
                      )}
                      {b.booking && b.booking.status?.toString().trim() !== 'completed' && (b.booking.paymentStatus?.toString().toLowerCase() !== 'paid') && (
                        <div className="text-xs text-amber-600">Booking created — needs completion</div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <ServiceBidDetailDialog open={detailOpen} onOpenChange={(open: boolean) => { setDetailOpen(open); if (!open) setSelectedBid(null) }} bid={selectedBid} onAccept={handleAccept} />
    </div>
  )
}

function ServiceBidDetailDialog({ open, onOpenChange, bid, onAccept }: any) {
  if (!bid) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{bid.serviceCategory}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">{bid.description}</div>
          {(bid.address || bid.city) && (
            <div className="text-sm">Address: {bid.address}{bid.city ? `, ${bid.city}` : ''}{bid.state ? `, ${bid.state}` : ''} {bid.zipCode || ''}</div>
          )}
          {(bid.budgetMin || bid.budgetMax) && (
            <div className="text-sm">Budget: {bid.budgetMin ? `$${bid.budgetMin.toFixed(2)}` : '—'}{bid.budgetMax ? ` - $${bid.budgetMax.toFixed(2)}` : ''}</div>
          )}
          <div>
            <h4 className="font-medium">Proposals</h4>
            <div className="space-y-2 mt-2">
              {bid.providerBids && bid.providerBids.length > 0 ? (
                bid.providerBids.map((pb: any) => (
                  <div key={pb.id} className="flex items-center justify-between border rounded p-2">
                    <div>
                      <div className="font-medium">{pb.provider?.name || 'Provider'}</div>
                      <div className="text-xs text-muted-foreground">${pb.price.toFixed(2)} • {pb.estimatedTime ? `${pb.estimatedTime} mins` : '—'}</div>
                      {pb.message && <div className="text-xs mt-1">{pb.message}</div>}
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="text-xs">{pb.status}</div>
                      {pb.status === 'PENDING' && <Button size="sm" onClick={() => onAccept(pb.id)}>Accept</Button>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground">No proposals yet</div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
