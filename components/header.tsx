"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Bell, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-context"

export function Header({ authenticated = false }: { authenticated?: boolean }) {
  const router = useRouter()
  const { user, logout, isAuthenticated } = useAuth()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const showAuth = authenticated || isAuthenticated

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">◆</span>
          </div>
          <span className="font-bold text-lg">Homease</span>
        </Link>

        {/* Navigation - Desktop */}
        {!showAuth && (
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/services" className="text-sm font-medium hover:text-primary transition">
              Services
            </Link>
            <Link href="/providers" className="text-sm font-medium hover:text-primary transition">
              Providers
            </Link>
            <Link href="/about" className="text-sm font-medium hover:text-primary transition">
              About Us
            </Link>
            <Link href="/contact" className="text-sm font-medium hover:text-primary transition">
              Contact
            </Link>
          </nav>
        )}

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-secondary rounded-full px-3 py-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search"
              className="bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground w-32"
            />
          </div>

          {showAuth && user ? (
            <>
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <Avatar className="w-9 h-9 cursor-pointer">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {user.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.userType}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                <LogOut className="w-5 h-5" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" className="hidden sm:flex">
                  Log In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-primary hover:bg-primary/90">Become a Provider</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
