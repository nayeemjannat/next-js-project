"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Calendar,
  MapPin,
  User,
  Users,
  BarChart3,
  Settings,
  LogOut,
  MessageSquare,
  DollarSign,
  FileText,
  Clock,
  Star,
} from "lucide-react"

interface UserSidebarProps {
  userType: "customer" | "provider" | "admin"
}

export function UserSidebar({ userType }: UserSidebarProps) {
  const pathname = usePathname()

  const getNavItems = () => {
    if (userType === "admin") {
      return [
        { href: "/admin/dashboard", label: "Dashboard", icon: Home },
        { href: "/admin/users", label: "Users", icon: Users },
        { href: "/admin/providers", label: "Providers", icon: User },
        { href: "/admin/bookings", label: "Bookings", icon: Calendar },
        { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
        { href: "/admin/payments", label: "Payments", icon: DollarSign },
        { href: "/admin/settings", label: "Settings", icon: Settings },
      ]
    }

    if (userType === "provider") {
      return [
        { href: "/provider/dashboard", label: "Dashboard", icon: Home },
        { href: "/provider/bookings", label: "Bookings", icon: Calendar },
        { href: "/provider/services", label: "Services", icon: FileText },
        { href: "/provider/availability", label: "Availability", icon: Clock },
        { href: "/provider/reviews", label: "Reviews", icon: Star },
        { href: "/provider/earnings", label: "Earnings", icon: DollarSign },
        { href: "/provider/messages", label: "Messages", icon: MessageSquare },
        { href: "/provider/profile", label: "Profile", icon: User },
      ]
    }

    return [
      { href: "/dashboard", label: "Dashboard", icon: Home },
      { href: "/dashboard/bookings", label: "My Bookings", icon: Calendar },
      { href: "/dashboard/addresses", label: "My Addresses", icon: MapPin },
      { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
      { href: "/dashboard/payments", label: "Payment Methods", icon: DollarSign },
      { href: "/dashboard/referrals", label: "Referrals", icon: Users },
      { href: "/dashboard/profile", label: "Profile", icon: User },
    ]
  }

  const navItems = getNavItems()

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen p-6 fixed left-0 top-0">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-12">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
          H
        </div>
        <span className="font-bold text-lg">Homease</span>
      </Link>

      {/* Navigation */}
      <nav className="space-y-2 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="space-y-2 pt-4 border-t border-border">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary transition-colors text-left">
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}
