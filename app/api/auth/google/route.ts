import { NextRequest, NextResponse } from "next/server"
import { getGoogleAuthUrl, createOAuthState } from "@/lib/google-oauth"

export async function GET(request: NextRequest) {
  try {
    // Validate Google OAuth is configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json(
        { error: "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables." },
        { status: 500 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const userType = searchParams.get("userType") || "customer"
    const returnUrl = searchParams.get("returnUrl") || "/dashboard"
    const actionParam = (searchParams.get("action") as "login" | "signup" | "link") || "login"

    // Validate userType
    const validUserTypes = ["customer", "provider", "admin"]
    if (!validUserTypes.includes(userType)) {
      return NextResponse.json(
        { error: "Invalid user type" },
        { status: 400 }
      )
    }

    // Create secure state with CSRF protection
    const state = await createOAuthState(userType, returnUrl, actionParam)

    const authUrl = await getGoogleAuthUrl(state)

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error("Google OAuth initiation error:", error)
    return NextResponse.json(
      { error: "Failed to initiate Google OAuth" },
      { status: 500 }
    )
  }
}

