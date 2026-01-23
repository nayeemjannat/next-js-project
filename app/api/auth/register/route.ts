import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/auth-utils"
import { validateEmail, validatePassword, type UserType } from "@/lib/auth"
import { createSession, setSessionCookie } from "@/lib/session"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, userType } = body

    // Validate inputs
    if (!email || !password || !name || !userType) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    if (!validatePassword(password)) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    if (!name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    const validUserTypes: UserType[] = ["customer", "provider", "admin"]
    if (!validUserTypes.includes(userType)) {
      return NextResponse.json(
        { error: "Invalid user type" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user in database
    // Set verification status for providers
    const verificationData =
      userType === "provider"
        ? {
            isVerified: false,
            verificationStatus: "pending" as const,
          }
        : {}

    const newUser = await db.user.create({
      data: {
        email: email.toLowerCase(),
        name: name.trim(),
        password: hashedPassword,
        authMethod: "email",
        hasPassword: true,
        userType,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`,
        ...verificationData,
      },
    })

    // Create session
    const sessionToken = await createSession({
      userId: newUser.id,
      email: newUser.email,
      userType: newUser.userType,
    })

    // Store session token in database
    await db.user.update({
      where: { id: newUser.id },
      data: { sessionToken },
    })

    // Set session cookie
    await setSessionCookie(sessionToken)

    // Return user data without password
    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json(
      {
        user: {
          ...userWithoutPassword,
          createdAt: userWithoutPassword.createdAt.toISOString(),
          updatedAt: userWithoutPassword.updatedAt.toISOString(),
          verifiedAt: userWithoutPassword.verifiedAt?.toISOString() || null,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === "development" ? String(error) : undefined },
      { status: 500 }
    )
  }
}

