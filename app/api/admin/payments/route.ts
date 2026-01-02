import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/admin/payments - Get all payments
export async function GET(request: NextRequest) {
  try {
    const payments = await db.payment.findMany({
      include: {
        booking: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
            provider: {
              select: {
                id: true,
                name: true,
              },
            },
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ payments })
  } catch (error) {
    console.error("Get payments error:", error)
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
  }
}

