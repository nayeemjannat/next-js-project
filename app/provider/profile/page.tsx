"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronRight, Lock } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { ProtectedRoute } from "@/components/protected-route"

export default function ProviderProfilePage() {
  const { user } = useAuth()

  return (
    <ProtectedRoute allowedUserTypes={["provider"]}>
      <div className="p-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Profile</h1>
        <p className="text-muted-foreground mb-8">Manage your account settings and preferences</p>

        {/* Personal Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <Input defaultValue={user?.name || "Your Name"} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input defaultValue={user?.email || "your@email.com"} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <Input defaultValue={user?.phone || "+1 (555) 000-0000"} />
            </div>
            <Button className="bg-primary hover:bg-primary/90">Edit Profile</Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Email Notifications</p>
                <p className="text-xs text-muted-foreground">
                  Receive updates about your bookings, promotions, and more.
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary" />
            </div>
            <div className="flex items-center justify-between border-t border-border pt-4">
              <div>
                <p className="font-medium text-sm">Push Notifications</p>
                <p className="text-xs text-muted-foreground">
                  Get instant alerts for booking confirmations, reminders, and service updates.
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium text-sm">Credit Card</p>
                <p className="text-xs text-muted-foreground">Visa ending in 4242</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium text-sm">PayPal</p>
                <p className="text-xs text-muted-foreground">Linked to your account</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy & Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full text-left flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary transition">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                <span className="text-sm">Manage Data Sharing</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="w-full text-left flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary transition">
              <span className="text-sm">Terms of Service</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="w-full text-left flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary transition">
              <span className="text-sm">Privacy Policy</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
