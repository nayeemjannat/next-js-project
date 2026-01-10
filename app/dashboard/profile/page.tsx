"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { toast } from "sonner"
import { Upload, Save, Camera } from "lucide-react"

export default function CustomerProfilePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
  })
  const [avatarPreview, setAvatarPreview] = useState<string>("")

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
        setAvatarPreview(data.user.avatar || "")
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast.error("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB")
      return
    }

    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        setAvatarPreview(base64)
        setProfile({ ...profile, avatar: base64 })
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error reading file:", error)
      toast.error("Failed to process image")
    }
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: profile.name,
          phone: profile.phone,
          avatar: profile.avatar,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Profile updated successfully!")
        // Update local storage user data
        if (user) {
          const updatedUser = { ...user, ...data.user }
          localStorage.setItem("homease_user", JSON.stringify(updatedUser))
        }
      } else {
        throw new Error(data.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const [sendingVerification, setSendingVerification] = useState(false)
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [otp, setOtp] = useState("")

  const handleSendVerification = async () => {
    if (!user) return
    setSendingVerification(true)
    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, newEmail: profile.email }),
      })
      const data = await res.json()
      if (res.ok) {
        setShowOtpInput(true)
        setOtp("")
        if (data.dev) {
          toast.success("Verification code printed to server console (dev)")
        } else {
          toast.success("Verification email sent")
        }
      } else {
        throw new Error(data.error || "Failed to send verification")
      }
    } catch (err) {
      console.error("send verification error", err)
      toast.error("Failed to send verification")
    } finally {
      setSendingVerification(false)
    }
  }

    const handleVerifyOtp = async () => {
      if (!profile.email) return
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: profile.email, otp })
        })
        const data = await res.json()
        if (res.ok) {
          toast.success('Email verified')
          // update localStorage and reload to refresh auth state
          try {
            const raw = localStorage.getItem('homease_user')
            if (raw) {
              const u = JSON.parse(raw)
              u.emailVerified = true
              localStorage.setItem('homease_user', JSON.stringify(u))
            }
          } catch (e) {
            console.error('update local user', e)
          }
          window.location.reload()
        } else {
          throw new Error(data.error || 'Verification failed')
        }
      } catch (err) {
        console.error('verify otp error', err)
        toast.error(String(err))
      }
    }

  if (loading) {
    return (
      <ProtectedRoute allowedUserTypes={["customer"]}>
        <div className="p-8 max-w-3xl">
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
    <ProtectedRoute allowedUserTypes={["customer"]}>
      <div className="p-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Profile</h1>
        <p className="text-muted-foreground mb-8">Manage your account settings and preferences</p>

        {/* Profile Picture */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={avatarPreview || "/placeholder-user.jpg"} />
                <AvatarFallback className="text-2xl">{profile.name[0] || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <Button variant="outline" asChild>
                    <span>
                      <Camera className="w-4 h-4 mr-2" />
                      Upload Photo
                    </span>
                  </Button>
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground mt-2">JPG, PNG or GIF. Max size 5MB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Your Name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>

            {user && !user.emailVerified && (
              <div className="p-3 rounded border border-red-200 bg-red-50 text-red-800">
                <p className="font-medium">Email not verified</p>
                <p className="text-sm">Please verify your email to unlock certain features. In development the code is printed to the server console.</p>
                <div className="mt-3">
                    <div>
                      <Button onClick={handleSendVerification} disabled={sendingVerification} className="bg-red-600 hover:bg-red-700">
                        {sendingVerification ? "Sending..." : "Send verification"}
                      </Button>
                    </div>
                </div>
              </div>
            )}
            {showOtpInput && (
              <div className="mt-4">
                <Label htmlFor="otp">Enter OTP</Label>
                <div className="flex gap-2 mt-2">
                  <Input id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit code" maxLength={6} />
                  <Button onClick={handleVerifyOtp} className="bg-primary">Verify</Button>
                  <Button variant="outline" onClick={handleSendVerification} disabled={sendingVerification}>Resend</Button>
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || !profile.name}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
