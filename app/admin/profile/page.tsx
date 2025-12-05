"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronRight, Lock } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { ProtectedRoute } from "@/components/protected-route"

export default function AdminProfilePage() {
  const { user } = useAuth()

  return (
    <ProtectedRoute allowedUserTypes={["admin"]}>
      <div className="p-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Admin Profile</h1>
        <p className="text-muted-foreground mb-8">Manage your administrator account settings</p>

        {/* Personal Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <Input defaultValue={user?.name || "Admin User"} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input defaultValue={user?.email || "admin@homease.com"} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <Input defaultValue={user?.phone || "+1 (555) 000-0000"} />
            </div>
            <Button className="bg-primary hover:bg-primary/90">Edit Profile</Button>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full text-left flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary transition">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                <span className="text-sm">Change Password</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="w-full text-left flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary transition">
              <span className="text-sm">Two-Factor Authentication</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>

        {/* Admin Privileges */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Privileges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 border border-border rounded-lg">
                <p className="font-medium text-sm">Role</p>
                <p className="text-sm text-muted-foreground">Super Administrator</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <p className="font-medium text-sm">Last Login</p>
                <p className="text-sm text-muted-foreground">Today at 10:30 AM</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
