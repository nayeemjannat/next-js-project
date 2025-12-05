import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header authenticated={true} />
      <div className="flex">
        <Sidebar userType="customer" />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
