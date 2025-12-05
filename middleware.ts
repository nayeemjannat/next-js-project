import { type NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const protectedRoutes = {
    admin: /^\/admin/,
    provider: /^\/provider/,
    customer: /^\/dashboard/,
  }

  const isAdminRoute = protectedRoutes.admin.test(pathname)
  const isProviderRoute = protectedRoutes.provider.test(pathname)
  const isCustomerRoute = protectedRoutes.customer.test(pathname)

  // Allow access to protected routes - client-side auth context will handle redirects
  if (isAdminRoute || isProviderRoute || isCustomerRoute) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/provider/:path*", "/dashboard/:path*"],
}
