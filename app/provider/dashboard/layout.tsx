// This layout is now handled by app/provider/layout.tsx
// Keeping this file to avoid breaking existing routes
import type React from "react"

export default function ProviderDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
