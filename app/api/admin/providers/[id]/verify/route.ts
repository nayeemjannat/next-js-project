import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { action, reason } = body // action: "approve" | "reject"
    const { id: providerId } = await params

    // TODO: Add admin authentication check here
    // const user = await getCurrentUser(request)
    // if (user?.userType !== "admin") {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    if (!action || (action !== "approve" && action !== "reject")) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      )
    }

    const provider = await db.user.findUnique({
      where: { id: providerId },
    })

    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      )
    }

    if (provider.userType !== "provider") {
      return NextResponse.json(
        { error: "User is not a provider" },
        { status: 400 }
      )
    }

    if (action === "approve") {
      const updated = await db.user.update({
        where: { id: providerId },
        data: {
          isVerified: true,
          verificationStatus: "approved",
          verifiedAt: new Date(),
          verifiedBy: "admin", // TODO: Replace with actual admin ID from auth
          rejectionReason: null,
        },
      })

      const { password: _, ...providerWithoutPassword } = updated

      return NextResponse.json({
        message: "Provider verified successfully",
        provider: {
          ...providerWithoutPassword,
          createdAt: providerWithoutPassword.createdAt.toISOString(),
          updatedAt: providerWithoutPassword.updatedAt.toISOString(),
          verifiedAt: providerWithoutPassword.verifiedAt?.toISOString() || null,
        },
      })
    } else if (action === "reject") {
      const updated = await db.user.update({
        where: { id: providerId },
        data: {
          isVerified: false,
          verificationStatus: "rejected",
          rejectionReason: reason || "Verification rejected by admin",
          verifiedBy: "admin", // TODO: Replace with actual admin ID from auth
        },
      })

      const { password: _, ...providerWithoutPassword } = updated

      return NextResponse.json({
        message: "Provider verification rejected",
        provider: {
          ...providerWithoutPassword,
          createdAt: providerWithoutPassword.createdAt.toISOString(),
          updatedAt: providerWithoutPassword.updatedAt.toISOString(),
          verifiedAt: providerWithoutPassword.verifiedAt?.toISOString() || null,
        },
      })
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Verification error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

