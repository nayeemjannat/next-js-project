import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/auth-utils"

// This is a one-time setup endpoint to create an admin user
// In production, you should protect this endpoint or remove it after use
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email = "admin@homease.com", password = "admin123", name = "Admin User" } = body

    // Check if admin already exists
    const existingAdmin = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: "Admin user already exists", email: existingAdmin.email },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create admin user
    const admin = await db.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        password: hashedPassword,
        userType: "admin",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      },
    })

    const { password: _, ...adminWithoutPassword } = admin

    return NextResponse.json(
      {
        message: "Admin user created successfully",
        user: {
          ...adminWithoutPassword,
          createdAt: adminWithoutPassword.createdAt.toISOString(),
          updatedAt: adminWithoutPassword.updatedAt.toISOString(),
        },
        credentials: {
          email: admin.email,
          password: password, // Only shown on creation
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create admin error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

