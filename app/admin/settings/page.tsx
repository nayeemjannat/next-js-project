"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { toast } from "sonner"
import { Save } from "lucide-react"

export default function SettingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [commissionRate, setCommissionRate] = useState("15")

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/settings")
      const data = await response.json()

      if (response.ok && data.settings) {
        setCommissionRate((data.settings.commissionRate * 100).toFixed(1))
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      toast.error("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    const rate = parseFloat(commissionRate) / 100
    if (isNaN(rate) || rate < 0 || rate > 1) {
      toast.error("Commission rate must be between 0% and 100%")
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commissionRate: rate,
          updatedBy: user.id,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Settings updated successfully!")
      } else {
        throw new Error(data.error || "Failed to update settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to update settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedUserTypes={["admin"]}>
        <div className="p-8 max-w-3xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading settings...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedUserTypes={["admin"]}>
      <div className="p-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground mb-8">Manage platform settings and configuration</p>

        {/* Commission & Fees */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Commission & Fees</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="commission">Platform Commission (%)</Label>
              <Input
                id="commission"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                placeholder="15"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This percentage will be deducted from provider earnings. Current rate: {commissionRate}%
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>About Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The platform commission is automatically calculated and deducted from provider earnings when bookings are completed and paid.
              This rate applies to all providers on the platform. Changes to the commission rate will affect future bookings only.
            </p>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
