"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { toast } from "sonner"
import { Save, Camera, Mail, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react"
import { OTPInput } from "@/components/ui/otp-input"

export default function CustomerProfilePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
    bio: "",
    address: "",
    authMethod: "",
    hasPassword: false,
    provider: "",
    googleId: null as string | null,
    emailVerified: false,
  })
  const [showSetPassword, setShowSetPassword] = useState(false)
  const [newPasswordInput, setNewPasswordInput] = useState("")
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("")
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const [originalEmail, setOriginalEmail] = useState("")
  
  // Email change & verification state
  const [newEmail, setNewEmail] = useState("")
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "available" | "exists" | "google">("idle")
  const [emailMessage, setEmailMessage] = useState<string | null>(null)
  const [isChangingEmail, setIsChangingEmail] = useState(false)
  const [sendingVerification, setSendingVerification] = useState(false)
  const [showOtpInput, setShowOtpInput] = useState(false)
  // Separate OTP UI for verifying current email (distinct from change-email OTP)
  const [showVerifyOtpInput, setShowVerifyOtpInput] = useState(false)
  const [verifyOtp, setVerifyOtp] = useState("")
  const [verifyingVerifyOtp, setVerifyingVerifyOtp] = useState(false)
  const [otp, setOtp] = useState("")
  const [verifyingOtp, setVerifyingOtp] = useState(false)

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
          bio: data.user.bio || "",
          address: "", // Address will be fetched separately if needed
          authMethod: data.user.authMethod || data.user.provider || "email",
          hasPassword: typeof data.user.hasPassword === "boolean" ? data.user.hasPassword : !!data.user.password,
          provider: data.user.provider || "",
          googleId: data.user.googleId || null,
          emailVerified: !!data.user.emailVerified,
        })
        setOriginalEmail(data.user.email || "")
        setAvatarPreview(data.user.avatar || "")
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast.error("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const hasGoogleLinked = () => {
    return (
      profile.authMethod === "google" ||
      profile.authMethod === "both" ||
      profile.provider === "google" ||
      !!profile.googleId
    )
  }

  const handleVerifyCurrentEmail = async () => {
    if (!user) return
    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, newEmail: profile.email }),
        credentials: "include",
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Verification code sent to your email")
        // Show a dedicated OTP input for verifying current email (do not reuse change-email UI)
        setShowVerifyOtpInput(true)
        setVerifyOtp("")
      } else {
        throw new Error(data.error || "Failed to send verification")
      }
    } catch (err) {
      console.error("send verification current email error", err)
      toast.error(err instanceof Error ? err.message : "Failed to send verification")
    }
  }

  const handleSubmitVerifyCurrentOtp = async () => {
    if (!verifyOtp || verifyOtp.length !== 6) {
      toast.error("Please enter the complete 6-digit code")
      return
    }

    setVerifyingVerifyOtp(true)
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email, otp: verifyOtp }),
        credentials: "include",
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Email verified successfully!")
        setShowVerifyOtpInput(false)
        setVerifyOtp("")
        // Refresh profile to get updated emailVerified
        await fetchProfile()
        // Update local storage
        try {
          const raw = localStorage.getItem("homease_user")
          if (raw) {
            const u = JSON.parse(raw)
            u.emailVerified = true
            localStorage.setItem("homease_user", JSON.stringify(u))
          }
        } catch (e) {
          console.error("update local user", e)
        }
      } else {
        throw new Error(data.error || "Verification failed")
      }
    } catch (err) {
      console.error("verify current email otp error", err)
      toast.error(err instanceof Error ? err.message : "Verification failed")
    } finally {
      setVerifyingVerifyOtp(false)
    }
  }

  const handleConnectGoogle = async () => {
    try {
      const returnUrl = window.location.pathname + window.location.search
      const res = await fetch(`/api/auth/google?userType=customer&action=link&returnUrl=${encodeURIComponent(returnUrl)}`)
      const data = await res.json()
      if (res.ok && data.authUrl) {
        window.location.href = data.authUrl
      } else {
        throw new Error(data.error || "Failed to start Google OAuth")
      }
    } catch (err) {
      console.error("connect google error", err)
      toast.error(err instanceof Error ? err.message : "Failed to start Google OAuth")
    }
  }

  // Show link error (from OAuth return) if present in URL
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      let le = params.get("link_error")
      // fallback to cookie if query param missing
      if (!le) {
        const m = document.cookie.match(/(?:^|; )link_error=([^;]+)/)
        if (m) le = decodeURIComponent(m[1])
      }
      if (le === "email_mismatch") {
        toast.error("Google account email does not match your current account email. Please sign in with the matched Google account or use the email associated with your account.")
        // remove query param if present
        if (params.has("link_error")) {
          params.delete("link_error")
          const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : "")
          window.history.replaceState({}, document.title, newUrl)
        }
        // clear cookie fallback
        document.cookie = "link_error=; Max-Age=0; path=/;"
      }
    } catch (e) {
      // ignore
    }
  }, [])

  const handleShowSetPassword = () => {
    setShowSetPassword(true)
    setNewPasswordInput("")
    setConfirmPasswordInput("")
  }

  const handleSubmitSetPassword = async () => {
    if (!newPasswordInput || newPasswordInput.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    if (newPasswordInput !== confirmPasswordInput) {
      toast.error("Passwords do not match")
      return
    }

    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPasswordInput }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Password set successfully")
        setShowSetPassword(false)
        await fetchProfile()
      } else {
        throw new Error(data.error || "Failed to set password")
      }
    } catch (err) {
      console.error("set password error", err)
      toast.error(err instanceof Error ? err.message : "Failed to set password")
    }
  }

  const handleUnlinkGoogle = async () => {
    if (!profile.hasPassword) {
      toast.error("Set a password first before unlinking Google")
      return
    }
    const current = prompt("Enter your current password to confirm unlinking Google:")
    if (!current) return
    try {
      const res = await fetch("/api/auth/unlink-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "google", currentPassword: current }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Google unlinked")
        await fetchProfile()
      } else {
        throw new Error(data.error || "Failed to unlink Google")
      }
    } catch (err) {
      console.error("unlink google error", err)
      toast.error(err instanceof Error ? err.message : "Failed to unlink Google")
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

    // Validation
    if (!profile.name.trim()) {
      toast.error("Name is required")
      return
    }

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
          bio: profile.bio,
          address: profile.address,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Profile updated successfully!")
        // Refresh profile data
        await fetchProfile()
        // Update local storage user data
        const updatedUser = { ...user, ...data.user }
        localStorage.setItem("homease_user", JSON.stringify(updatedUser))
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

  const handleStartEmailChange = () => {
    setIsChangingEmail(true)
    setNewEmail("")
    setShowOtpInput(false)
    setOtp("")
  }

  const handleCancelEmailChange = () => {
    setIsChangingEmail(false)
    setNewEmail("")
    setShowOtpInput(false)
    setOtp("")
  }

  const handleSendVerification = async () => {
    if (!user || !newEmail.trim()) {
      toast.error("Please enter a new email address")
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      toast.error("Please enter a valid email address")
      return
    }

    if (newEmail.toLowerCase() === originalEmail.toLowerCase()) {
      toast.error("New email must be different from current email")
      return
    }
    // Final availability check before sending OTP
    try {
      setSendingVerification(true)
      const chk = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.trim().toLowerCase() }),
        credentials: "include",
      })
      const chkData = await chk.json()
      if (!chk.ok) throw new Error(chkData.error || "Check failed")
      if (chkData.exists) {
        if (chkData.provider === "google" || chkData.provider === "both") {
          setEmailStatus("google")
          setEmailMessage("This email is linked to a Google account. To use this email, please sign in with Google instead")
          toast.error("Email is linked to a Google account. Use Google sign-in.")
          return
        }
        setEmailStatus("exists")
        setEmailMessage("This email is already registered")
        toast.error("This email is already registered")
        return
      }
    } catch (err) {
      console.error("email check before send failed", err)
    } finally {
      setSendingVerification(false)
    }

    // Send verification (server will also enforce availability)
    setSendingVerification(true)
    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, newEmail: newEmail.trim().toLowerCase() }),
        credentials: "include",
      })
      const data = await res.json()
      if (res.ok) {
        setShowOtpInput(true)
        setOtp("")
        setEmailStatus("available")
        setEmailMessage(null)
        if (data.dev) {
          toast.success("Verification code sent! Check server console (dev mode)")
        } else {
          toast.success("Verification code sent to your new email")
        }
      } else {
        if (res.status === 409 && (data.provider === "google" || data.provider === "both")) {
          setEmailStatus("google")
          setEmailMessage("This email is linked to a Google account. To use this email, please sign in with Google instead")
          toast.error(data.error || "Email linked to Google")
          return
        }
        if (res.status === 409) {
          setEmailStatus("exists")
          setEmailMessage(data.error || "Email already registered")
        }
        throw new Error(data.error || "Failed to send verification")
      }
    } catch (err) {
      console.error("send verification error", err)
      toast.error(err instanceof Error ? err.message : "Failed to send verification")
    } finally {
      setSendingVerification(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!newEmail || otp.length !== 6) {
      toast.error("Please enter the complete 6-digit code")
      return
    }

    setVerifyingOtp(true)
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: originalEmail, otp, newEmail: newEmail.trim().toLowerCase() }),
        credentials: "include",
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Email verified and updated successfully!")
        // Reset email change state
        setIsChangingEmail(false)
        setShowOtpInput(false)
        setNewEmail("")
        setOtp("")
        // Refresh profile to get new email
        await fetchProfile()
        // Update local storage
        try {
          const raw = localStorage.getItem("homease_user")
          if (raw) {
            const u = JSON.parse(raw)
            u.email = newEmail.trim().toLowerCase()
            u.emailVerified = true
            localStorage.setItem("homease_user", JSON.stringify(u))
          }
        } catch (e) {
          console.error("update local user", e)
        }
      } else {
        if (res.status === 409 && data.error) {
          toast.error(data.error)
          setEmailMessage(data.error)
        }
        throw new Error(data.error || "Verification failed")
      }
    } catch (err) {
      console.error("verify otp error", err)
      toast.error(err instanceof Error ? err.message : "Verification failed")
    } finally {
      setVerifyingOtp(false)
    }
  }

  // Debounced email availability check (500ms)
  useEffect(() => {
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setEmailStatus("idle")
      setEmailMessage(null)
      return
    }

    setEmailStatus("checking")
    setEmailMessage(null)
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/auth/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: newEmail.trim().toLowerCase() }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Check failed")
        if (data.exists) {
          if (data.provider === "google" || data.provider === "both") {
            setEmailStatus("google")
            setEmailMessage("This email is linked to a Google account. To use this email, please sign in with Google instead")
          } else {
            setEmailStatus("exists")
            setEmailMessage("This email is already registered")
          }
        } else {
          setEmailStatus("available")
          setEmailMessage(null)
        }
      } catch (err) {
        console.error("debounced check failed", err)
        setEmailStatus("idle")
      }
    }, 500)

    return () => clearTimeout(t)
  }, [newEmail])

  // Check if user is Google OAuth user
  const isGoogleUser = user?.provider === "google"
  const needsEmailVerification = !isGoogleUser && !user?.emailVerified

  if (loading) {
    return (
      <ProtectedRoute allowedUserTypes={["customer"]}>
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
    <ProtectedRoute allowedUserTypes={["customer"]}>
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        {/* Profile Picture */}
        <Card className="mb-6 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Profile Picture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                  <AvatarImage src={avatarPreview || "/placeholder-user.jpg"} className="object-cover" />
                  <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                    {profile.name[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                {avatarPreview && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 w-full sm:w-auto">
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <Button variant="outline" asChild className="w-full sm:w-auto">
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
                  className="sr-only"
                />
                <p className="text-xs text-muted-foreground mt-2">JPG, PNG or GIF. Max size 5MB</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Personal Information */}
                
                  {/* Authentication Methods Card inserted here */}
                  <div className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">Authentication</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Methods:</span>
                            <div className="inline-flex items-center gap-2">
                              {profile.authMethod === "google" && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">Google</span>}
                              {profile.authMethod === "email" && <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Email/Password</span>}
                              {profile.authMethod === "both" && (
                                <>
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">Google</span>
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Email/Password</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-3 flex-wrap">
                            {/* Connect Google */}
                            {!hasGoogleLinked() && (
                              <Button onClick={handleConnectGoogle}>Connect with Google</Button>
                            )}

                            {/* Set Password for Google-only users or upgrade to both */}
                            {!profile.hasPassword && (
                              <Button variant="outline" onClick={handleShowSetPassword}>Set password</Button>
                            )}

                            {/* Verify email for unverified non-Google users */}
                            {!profile.emailVerified && !hasGoogleLinked() && (
                              <Button variant="outline" onClick={handleVerifyCurrentEmail}>Verify email</Button>
                            )}

                            {/* Unlink Google (only allowed if password exists) */}
                            {profile.authMethod === "google" || profile.authMethod === "both" ? (
                              <Button variant="destructive" onClick={handleUnlinkGoogle}>Unlink Google</Button>
                            ) : null}

                            {/* (No UI option to completely remove stored password; unlinking email is disabled in UI) */}
                          </div>

                          {/* Verify current email OTP (separate from change-email OTP) */}
                          {showVerifyOtpInput && (
                            <div className="mt-3 p-3 border rounded bg-muted/50">
                              <div>
                                <Label>Enter Verification Code</Label>
                                <div className="mt-2">
                                  <OTPInput
                                    value={verifyOtp}
                                    onChange={setVerifyOtp}
                                    length={6}
                                    disabled={verifyingVerifyOtp}
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground mt-2 text-center">
                                  Enter the 6-digit code sent to {profile.email}
                                </p>
                              </div>
                              <div className="flex gap-2 mt-3">
                                <Button
                                  type="button"
                                  onClick={handleSubmitVerifyCurrentOtp}
                                  disabled={verifyingVerifyOtp || verifyOtp.length !== 6}
                                  className="flex-1"
                                >
                                  {verifyingVerifyOtp ? "Verifying..." : "Verify Email"}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={handleVerifyCurrentEmail}
                                  disabled={sendingVerification}
                                >
                                  {sendingVerification ? "Resending..." : "Resend"}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => { setShowVerifyOtpInput(false); setVerifyOtp("") }}
                                  disabled={verifyingVerifyOtp}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Inline set-password form */}
                          {showSetPassword && (
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <Input placeholder="New password" type="password" value={newPasswordInput} onChange={(e) => setNewPasswordInput(e.target.value)} />
                              <Input placeholder="Confirm password" type="password" value={confirmPasswordInput} onChange={(e) => setConfirmPasswordInput(e.target.value)} />
                              <div className="col-span-2 flex gap-2">
                                <Button onClick={handleSubmitSetPassword}>Save password</Button>
                                <Button variant="outline" onClick={() => setShowSetPassword(false)}>Cancel</Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
        <Card className="mb-6 shadow-sm">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Your Name"
                className="mt-1"
              />
            </div>

            {/* Email Section */}
            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="mt-1 space-y-3" onClick={(e) => e.stopPropagation()}>
                {!isChangingEmail ? (
                  <div className="flex items-center gap-3">
                    <Input
                      id="email"
                      value={profile.email}
                      disabled
                      className="bg-muted flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleStartEmailChange}
                      className="whitespace-nowrap"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Change Email
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                    <div>
                      <Label htmlFor="new-email">New Email Address</Label>
                      <div className="mt-1 relative">
                        <Input
                          id="new-email"
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          onBlur={async () => {
                            if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return
                            setEmailStatus("checking")
                            try {
                              const res = await fetch("/api/auth/check-email", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ email: newEmail.trim().toLowerCase() }),
                              })
                              const data = await res.json()
                              if (!res.ok) throw new Error(data.error || "Check failed")
                              if (data.exists) {
                                if (data.provider === "google") {
                                  setEmailStatus("google")
                                  setEmailMessage("This email is linked to a Google account. To use this email, please sign in with Google instead")
                                } else {
                                  setEmailStatus("exists")
                                  setEmailMessage("This email is already registered")
                                }
                              } else {
                                setEmailStatus("available")
                                setEmailMessage(null)
                              }
                            } catch (err) {
                              console.error("blur check failed", err)
                              setEmailStatus("idle")
                            }
                          }}
                          placeholder="Enter new email"
                          className="mt-1"
                          disabled={showOtpInput}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          {emailStatus === "checking" && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                          {emailStatus === "available" && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                          {emailStatus === "exists" && <XCircle className="w-4 h-4 text-red-600" />}
                          {emailStatus === "google" && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                        </div>
                      </div>
                      {emailMessage && <p className="text-xs text-amber-600 mt-1">{emailMessage}</p>}
                    </div>
                    {!showOtpInput ? (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={handleSendVerification}
                          disabled={sendingVerification || !newEmail.trim()}
                          className="flex-1"
                        >
                          {sendingVerification ? "Sending..." : "Send Verification Code"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancelEmailChange}
                          disabled={sendingVerification}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <Label>Enter Verification Code</Label>
                          <div className="mt-2">
                            <OTPInput
                              value={otp}
                              onChange={setOtp}
                              length={6}
                              disabled={verifyingOtp}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 text-center">
                            Enter the 6-digit code sent to {newEmail}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={handleVerifyOtp}
                            disabled={verifyingOtp || otp.length !== 6}
                            className="flex-1"
                          >
                            {verifyingOtp ? "Verifying..." : "Verify & Update Email"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleSendVerification}
                            disabled={sendingVerification}
                          >
                            Resend
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={handleCancelEmailChange}
                            disabled={verifyingOtp}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {user?.emailVerified ? (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Email verified</span>
                  </div>
                ) : needsEmailVerification ? (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <XCircle className="w-4 h-4" />
                    <span>Email not verified</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                placeholder="Enter your full address"
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="bio">Bio / About</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">A brief description about yourself</p>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={saving || !profile.name.trim()}
                className="w-full sm:w-auto min-w-[140px]"
                size="lg"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
