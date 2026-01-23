"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { toast } from "sonner"
import { User, Mail, Phone, Calendar } from "lucide-react"

export default function AdminProfilePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
  })

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch(`/api/user/profile?userId=${user.id}`)
      const data = await response.json()

      if (response.ok && data.user) {
        setProfile({
          name: data.user.name || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
          avatar: data.user.avatar || "",
        })
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast.error("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedUserTypes={["admin"]}>
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading profile...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedUserTypes={["admin"]}>
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Profile</h1>
          <p className="text-muted-foreground">View your administrator account information</p>
        </div>

        {/* Profile Picture */}
        <Card className="mb-6 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Picture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                <AvatarImage src={profile.avatar || "/placeholder-user.jpg"} className="object-cover" />
                <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                  {profile.name[0]?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information - Read Only */}
        <Card className="mb-6 shadow-sm">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <div className="pl-6 text-base font-medium">{profile.name || "Not set"}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <div className="pl-6 text-base">{profile.email || "Not set"}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Phone className="w-4 h-4" />
                Phone Number
              </div>
              <div className="pl-6 text-base">{profile.phone || "Not set"}</div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Admin profiles are read-only. Contact system administrator for profile updates.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
