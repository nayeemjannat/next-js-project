"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { type AuthContextType, type User, type UserType, validateEmail, validatePassword } from "@/lib/auth"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check session from server
        const sessionResponse = await fetch("/api/auth/session")
        if (sessionResponse.ok) {
          const data = await sessionResponse.json()
          if (data.user) {
            setUser(data.user)
            localStorage.setItem("homease_user", JSON.stringify(data.user))
            return
          }
        }

        // Fallback to localStorage for backward compatibility
        const storedUser = localStorage.getItem("homease_user")
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
      } catch (error) {
        console.error("Auth check failed:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Validate inputs
      if (!validateEmail(email)) {
        throw new Error("Invalid email format")
      }

      // Call API endpoint
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      setUser(data.user)
      localStorage.setItem("homease_user", JSON.stringify(data.user))
    } catch (error) {
      setUser(null)
      localStorage.removeItem("homease_user")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email: string, password: string, name: string, userType: UserType) => {
    setIsLoading(true)
    try {
      // Validate inputs
      if (!validateEmail(email)) {
        throw new Error("Invalid email format")
      }
      if (!validatePassword(password)) {
        throw new Error("Password must be at least 6 characters")
      }
      if (!name.trim()) {
        throw new Error("Name is required")
      }

      // Call API endpoint
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name, userType }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      setUser(data.user)
      localStorage.setItem("homease_user", JSON.stringify(data.user))

      // After registration, send email verification OTP
      try {
        await fetch('/api/auth/send-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: data.user.id, newEmail: data.user.email }),
          credentials: 'include',
        })
      } catch (err) {
        console.error('send-verification error', err)
      }
    } catch (error) {
      setUser(null)
      localStorage.removeItem("homease_user")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithGoogle = async (
    userType: UserType = "customer",
    returnUrl?: string,
    action: "login" | "signup" = "login"
  ) => {
    try {
      const params = new URLSearchParams({ userType })
      params.set("action", action)
      if (returnUrl) {
        params.set("returnUrl", returnUrl)
      }

      const response = await fetch(`/api/auth/google?${params.toString()}`)
      const data = await response.json()

      if (!response.ok || !data.authUrl) {
        throw new Error(data.error || "Failed to initiate Google OAuth")
      }

      // Redirect to Google OAuth
      window.location.href = data.authUrl
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      // Call logout API to clear server session
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (error) {
      console.error("Logout API error:", error)
    } finally {
      // Clear client state regardless of API call result
      setUser(null)
      localStorage.removeItem("homease_user")
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    loginWithGoogle,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
