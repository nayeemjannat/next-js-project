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
    } catch (error) {
      setUser(null)
      localStorage.removeItem("homease_user")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("homease_user")
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
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
