"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

interface AuthContextType {
  userType: "customer" | "provider" | "admin" | null
  isAuthenticated: boolean
  userEmail: string | null
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userType, setUserType] = useState<"customer" | "provider" | "admin" | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    // Check localStorage for existing session
    const savedUserType = localStorage.getItem("userType") as "customer" | "provider" | "admin" | null
    const savedEmail = localStorage.getItem("userEmail")
    const isAuth = localStorage.getItem("isAuthenticated") === "true"

    if (isAuth && savedUserType) {
      setIsAuthenticated(true)
      setUserType(savedUserType)
      setUserEmail(savedEmail)
    }
  }, [])

  const logout = () => {
    localStorage.removeItem("userType")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("isAuthenticated")
    setIsAuthenticated(false)
    setUserType(null)
    setUserEmail(null)
  }

  return (
    <AuthContext.Provider value={{ userType, isAuthenticated, userEmail, logout }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
