"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import type { UserType } from "@/lib/auth"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedUserTypes: UserType[]
}

export function ProtectedRoute({ children, allowedUserTypes }: ProtectedRouteProps) {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      router.push("/auth/login")
      return
    }

    if (!allowedUserTypes.includes(user.userType)) {
      router.push("/")
      return
    }
  }, [user, isLoading, router, allowedUserTypes])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !allowedUserTypes.includes(user.userType)) {
    return null
  }

  return <>{children}</>
}
