"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import {
  Home,
  Calendar,
  MapPin,
  User,
  Users,
  HelpCircle,
  LogOut,
  FileText,
  Clock,
  Star,
  DollarSign,
  MessageSquare,
  BarChart3,
  Settings,
} from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-context"

interface SidebarProps {
  userType?: "customer" | "provider" | "admin"
}

export function Sidebar({ userType = "customer" }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const customerLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/dashboard/bookings", label: "My Bookings", icon: Calendar },
    { href: "/dashboard/addresses", label: "My Addresses", icon: MapPin },
    { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    { href: "/dashboard/payments", label: "Payment Methods", icon: DollarSign },
    { href: "/dashboard/referrals", label: "Referrals", icon: Users },
    { href: "/dashboard/profile", label: "Profile", icon: User },
    { href: "/help", label: "Help", icon: HelpCircle },
  ]

  const providerLinks = [
    { href: "/provider/dashboard", label: "Dashboard", icon: Home },
    { href: "/provider/bookings", label: "Bookings", icon: Calendar },
    { href: "/provider/services", label: "Services", icon: FileText },
    { href: "/provider/availability", label: "Availability", icon: Clock },
    { href: "/provider/reviews", label: "Reviews", icon: Star },
    { href: "/provider/earnings", label: "Earnings", icon: DollarSign },
    { href: "/provider/messages", label: "Messages", icon: MessageSquare },
    { href: "/provider/profile", label: "Profile", icon: User },
  ]

  const adminLinks = [
    { href: "/admin/dashboard", label: "Dashboard", icon: Home },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/providers", label: "Providers", icon: User },
    { href: "/admin/bookings", label: "Bookings", icon: Calendar },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/payments", label: "Payments", icon: DollarSign },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ]

  const links = userType === "provider" ? providerLinks : userType === "admin" ? adminLinks : customerLinks

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <aside className="w-64 bg-secondary border-r border-border min-h-screen">
      {/* Profile Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-2">
          <Avatar className="w-12 h-12">
            <AvatarImage src={user?.avatar || "/placeholder.svg"} />
            <AvatarFallback>
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{user?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{userType} Member</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg transition text-sm",
                isActive ? "bg-white text-primary font-medium" : "text-foreground hover:bg-white/50",
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{link.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="absolute bottom-4 left-4 right-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <LogOut className="w-5 h-5" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  )
}
