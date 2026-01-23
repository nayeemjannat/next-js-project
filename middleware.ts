import { type NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/session"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const protectedRoutes = {
    admin: /^\/admin/,
    provider: /^\/provider/,
    customer: /^\/dashboard/,
  }

  const isAdminRoute = protectedRoutes.admin.test(pathname)
  const isProviderRoute = protectedRoutes.provider.test(pathname)
  const isCustomerRoute = protectedRoutes.customer.test(pathname)

  // Check session for protected routes
  if (isAdminRoute || isProviderRoute || isCustomerRoute) {
    const sessionToken = request.cookies.get("session")?.value

    if (!sessionToken) {
      // No session - redirect to login
      const loginUrl = new URL("/auth/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Verify session
    const session = await verifySession(sessionToken)
    if (!session) {
      // Invalid session - redirect to login
      const loginUrl = new URL("/auth/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete("session")
      return response
    }

    // Check user type access
    if (isAdminRoute && session.userType !== "admin") {
      return NextResponse.redirect(new URL("/", request.url))
    }
    if (isProviderRoute && session.userType !== "provider") {
      return NextResponse.redirect(new URL("/", request.url))
    }
    if (isCustomerRoute && session.userType !== "customer") {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/provider/:path*", "/dashboard/:path*"],
}
