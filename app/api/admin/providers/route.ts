import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // const user = await getCurrentUser(request)
    // if (user?.userType !== "admin") {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    const providers = await db.user.findMany({
      where: { userType: "provider" },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        phone: true,
        isVerified: true,
        verificationStatus: true,
        verifiedAt: true,
        verifiedBy: true,
        rejectionReason: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      providers: providers.map((provider) => ({
        ...provider,
        createdAt: provider.createdAt.toISOString(),
        updatedAt: provider.updatedAt.toISOString(),
        verifiedAt: provider.verifiedAt?.toISOString() || null,
      })),
    })
  } catch (error) {
    console.error("Get providers error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

