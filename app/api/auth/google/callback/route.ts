import { NextRequest, NextResponse } from "next/server"
import { verifyGoogleToken, parseOAuthState } from "@/lib/google-oauth"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"
import { createSession, setSessionCookie } from "@/lib/session"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    // Handle OAuth errors from Google
    if (error) {
      console.error("Google OAuth error:", error)
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(`OAuth error: ${error}`)}`, request.url)
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/auth/login?error=missing_code", request.url)
      )
    }

    // Parse and validate state (CSRF protection)
    let userType = "customer"
    let returnUrl = "/dashboard"
    let stateData: any = null

    if (state) {
      stateData = await parseOAuthState(state)
      if (!stateData) {
        // Invalid or expired state - potential CSRF attack
        console.error("Invalid or expired OAuth state")
        return NextResponse.redirect(
          new URL("/auth/login?error=invalid_state", request.url)
        )
      }
      userType = stateData.userType || "customer"
      returnUrl = stateData.returnUrl || "/dashboard"
    }

    // Verify Google token and get user info
    const googleUser = await verifyGoogleToken(code)

    if (!googleUser.email) {
      return NextResponse.redirect(
        new URL("/auth/login?error=no_email", request.url)
      )
    }

    // Check if user exists
    let user = await db.user.findUnique({
      where: { email: googleUser.email.toLowerCase() },
    })

    // If OAuth flow was initiated for LINK and a session exists, link Google to the signed-in user
    if (stateData?.action === "link") {
      const session = await getSession()
      if (session) {
        // Only link if session email matches the Google email to avoid account takeover
        if (session.email && session.email.toLowerCase() === googleUser.email.toLowerCase()) {
          // Update the session user's record to include Google details
          await db.user.update({
            where: { id: session.userId },
            data: {
              provider: "google",
              providerId: googleUser.id,
              googleId: googleUser.id,
              emailVerified: true,
              avatar: googleUser.picture || undefined,
              authMethod: (await db.user.findUnique({ where: { id: session.userId } }))?.password ? "both" : "google",
              hasPassword: !!((await db.user.findUnique({ where: { id: session.userId } }))?.password),
            },
          })

          // Redirect back to the returnUrl (link flow complete)
          const redirectUrl = new URL(returnUrl, request.url)
          redirectUrl.searchParams.set("linked", "google")
          return NextResponse.redirect(redirectUrl)
        } else {
          // Session exists but emails don't match — do not link
          const redirectUrl = new URL(returnUrl, request.url)
          redirectUrl.searchParams.set("link_error", "email_mismatch")
          const response = NextResponse.redirect(redirectUrl)
          // Set a short-lived cookie as a fallback if the query param is lost
          response.cookies.set("link_error", "email_mismatch", {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 10,
            path: "/",
          })
          return response
        }
      }
      // If no session, fall through to normal login/signup behavior
    }

    if (user) {
      // If the OAuth flow was initiated specifically for SIGNUP,
      // and a user with this email already exists, instruct them to log in instead.
      if (state && stateData?.action === "signup") {
        return NextResponse.redirect(
          new URL(
            `/auth/login?error=${encodeURIComponent("account_exists_use_login")}`,
            request.url
          )
        )
      }

      // User exists - update OAuth info if needed (normal login/link flow)
      if (!user.provider || user.provider !== "google") {
        await db.user.update({
          where: { id: user.id },
          data: {
            provider: "google",
            providerId: googleUser.id,
            googleId: googleUser.id,
            // If the user already has a password, mark both methods available
            authMethod: user.password ? "both" : "google",
            hasPassword: !!user.password,
            emailVerified: googleUser.emailVerified || user.emailVerified,
            avatar: googleUser.picture || user.avatar,
          },
        })
      } else {
        // Update avatar if changed
        if (googleUser.picture && googleUser.picture !== user.avatar) {
          await db.user.update({
            where: { id: user.id },
            data: {
              avatar: googleUser.picture,
              emailVerified: googleUser.emailVerified || user.emailVerified,
            },
          })
        }
      }

      // Refresh user data
      user = await db.user.findUnique({
        where: { id: user.id },
      })
    } else {
      // Create new user
      user = await db.user.create({
        data: {
          email: googleUser.email.toLowerCase(),
          name: googleUser.name,
          provider: "google",
          providerId: googleUser.id,
          googleId: googleUser.id,
          authMethod: "google",
          hasPassword: false,
          emailVerified: googleUser.emailVerified,
          avatar: googleUser.picture || null,
          userType: userType,
          // Set verification status for providers
          ...(userType === "provider"
            ? {
                isVerified: false,
                verificationStatus: "pending" as const,
              }
            : {}),
        },
      })
    }

    if (!user) {
      return NextResponse.redirect(
        new URL("/auth/login?error=user_creation_failed", request.url)
      )
    }

    // Create session
    const sessionToken = await createSession({
      userId: user.id,
      email: user.email,
      userType: user.userType,
    })

    // Store session token in database for validation
    await db.user.update({
      where: { id: user.id },
      data: { sessionToken },
    })

    // Redirect based on user type
    let redirectPath = returnUrl
    if (user.userType === "admin") {
      redirectPath = "/admin/dashboard"
    } else if (user.userType === "provider") {
      redirectPath = "/provider/dashboard"
    } else if (user.userType === "customer") {
      redirectPath = "/dashboard"
    }

    // Create redirect response and set session cookie
    const redirectUrl = new URL(redirectPath, request.url)
    const response = NextResponse.redirect(redirectUrl)
    
    // Set session cookie on the response
    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })
    
    return response
  } catch (error) {
    console.error("Google OAuth callback error:", error)
    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent(
          error instanceof Error ? error.message : "oauth_failed"
        )}`,
        request.url
      )
    )
  }
}

