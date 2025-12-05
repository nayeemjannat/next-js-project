"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Search, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-context"

interface Provider {
  id: string
  name: string
  email: string
  avatar: string | null
  phone: string | null
  isVerified: boolean
  verificationStatus: string | null
  verifiedAt: string | null
  rejectionReason: string | null
  createdAt: string
}

export default function ProvidersPage() {
  const { user } = useAuth()
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      const res = await fetch("/api/admin/providers")
      const data = await res.json()
      setProviders(data.providers || [])
    } catch (error) {
      console.error("Error fetching providers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerification = async (providerId: string, action: "approve" | "reject") => {
    setProcessing(providerId)
    try {
      const res = await fetch(`/api/admin/providers/${providerId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      const data = await res.json()

      if (res.ok) {
        fetchProviders() // Refresh list
        alert(`Provider ${action === "approve" ? "verified" : "rejected"} successfully`)
      } else {
        alert(data.error || "Failed to update verification status")
      }
    } catch (error) {
      console.error("Verification error:", error)
      alert("Failed to update verification status")
    } finally {
      setProcessing(null)
    }
  }

  const getStatusBadge = (status: string | null, isVerified: boolean) => {
    if (isVerified) {
      return <Badge className="bg-green-100 text-green-800 border-0">Verified</Badge>
    }
    if (status === "rejected") {
      return <Badge className="bg-red-100 text-red-800 border-0">Rejected</Badge>
    }
    return <Badge className="bg-yellow-100 text-yellow-800 border-0">Pending</Badge>
  }

  const filteredProviders = providers.filter(
    (provider) =>
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Providers</h1>
          <p className="text-muted-foreground">Manage service providers and verification</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search providers by name or email..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Providers Table */}
      <Card>
        <CardContent className="p-6">
          {filteredProviders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No providers found matching your search." : "No providers found."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Provider</th>
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 font-semibold">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProviders.map((provider) => (
                    <tr
                      key={provider.id}
                      className="border-b border-border hover:bg-secondary/50 transition"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={provider.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{provider.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{provider.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{provider.email}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {provider.phone || "—"}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(provider.verificationStatus, provider.isVerified)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {!provider.isVerified &&
                            provider.verificationStatus !== "rejected" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleVerification(provider.id, "approve")}
                                  disabled={processing === provider.id}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  {processing === provider.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-4 h-4 mr-1" />
                                      Approve
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleVerification(provider.id, "reject")}
                                  disabled={processing === provider.id}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  {processing === provider.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Reject
                                    </>
                                  )}
                                </Button>
                              </>
                            )}
                          {provider.isVerified && (
                            <span className="text-sm text-muted-foreground">Verified</span>
                          )}
                          {provider.verificationStatus === "rejected" && (
                            <span className="text-sm text-muted-foreground">Rejected</span>
                          )}
                        </div>
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
