import { OAuth2Client } from "google-auth-library"
import { randomBytes } from "crypto"
import { SignJWT, jwtVerify } from "jose"

// CSRF token secret for state validation
const csrfSecret = process.env.CSRF_SECRET || process.env.SESSION_SECRET || "your-csrf-secret-change-in-production"
const encodedCsrfKey = new TextEncoder().encode(csrfSecret)

export const googleOAuthClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/google/callback`
)

// Validate Google OAuth configuration
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn("Warning: Google OAuth credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.")
}

interface OAuthState {
  userType: string
  returnUrl: string
  csrfToken: string
  timestamp: number
  action?: "login" | "signup" | "link"
}

/**
 * Generate a secure CSRF token for OAuth state
 */
async function generateCSRFToken(): Promise<string> {
  const token = randomBytes(32).toString("hex")
  const jwt = await new SignJWT({ token })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m") // 10 minutes expiry
    .sign(encodedCsrfKey)
  return jwt
}

/**
 * Verify CSRF token
 */
async function verifyCSRFToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, encodedCsrfKey, {
      algorithms: ["HS256"],
    })
    return true
  } catch {
    return false
  }
}

/**
 * Create a secure OAuth state with CSRF protection
 */
export async function createOAuthState(userType: string, returnUrl: string, action: "login" | "signup" | "link" = "login"): Promise<string> {
  const csrfToken = await generateCSRFToken()
  const state: OAuthState = {
    userType,
    returnUrl,
    csrfToken,
    timestamp: Date.now(),
    action,
  }
  
  // Encode state as JWT for additional security
  const stateJWT = await new SignJWT(state)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m") // 10 minutes expiry
    .sign(encodedCsrfKey)
  
  return stateJWT
}

/**
 * Parse and validate OAuth state
 */
export async function parseOAuthState(state: string): Promise<OAuthState | null> {
  try {
    const { payload } = await jwtVerify(state, encodedCsrfKey, {
      algorithms: ["HS256"],
    })
    
    // Check if state is expired (older than 10 minutes)
    const timestamp = payload.timestamp as number
    if (Date.now() - timestamp > 10 * 60 * 1000) {
      return null
    }
    
    return {
      userType: payload.userType as string,
      returnUrl: payload.returnUrl as string,
      csrfToken: payload.csrfToken as string,
      timestamp: payload.timestamp as number,
      action: (payload.action as "login" | "signup" | "link") || "login",
    }
  } catch {
    return null
  }
}

export async function getGoogleAuthUrl(state?: string): Promise<string> {
  const scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ]

  const url = googleOAuthClient.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
    state: state || undefined,
  })

  return url
}

export async function verifyGoogleToken(code: string) {
  try {
    const { tokens } = await googleOAuthClient.getToken(code)
    googleOAuthClient.setCredentials(tokens)

    const ticket = await googleOAuthClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    if (!payload) {
      throw new Error("Invalid token payload")
    }

    return {
      id: payload.sub,
      email: payload.email!,
      name: payload.name!,
      picture: payload.picture,
      emailVerified: payload.email_verified || false,
    }
  } catch (error) {
    console.error("Google token verification error:", error)
    throw new Error("Failed to verify Google token")
  }
}

