import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/admin/settings - Get platform settings
export async function GET(request: NextRequest) {
  try {
    let settings = await db.platformSettings.findFirst()

    if (!settings) {
      // Create default settings
      settings = await db.platformSettings.create({
        data: {
          commissionRate: 0.15, // 15%
        },
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Get settings error:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

// PUT /api/admin/settings - Update platform settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { commissionRate, updatedBy } = body

    if (commissionRate === undefined) {
      return NextResponse.json({ error: "Commission rate is required" }, { status: 400 })
    }

    if (commissionRate < 0 || commissionRate > 1) {
      return NextResponse.json({ error: "Commission rate must be between 0 and 1" }, { status: 400 })
    }

    let settings = await db.platformSettings.findFirst()

    if (!settings) {
      settings = await db.platformSettings.create({
        data: {
          commissionRate,
          updatedBy: updatedBy || null,
        },
      })
    } else {
      settings = await db.platformSettings.update({
        where: { id: settings.id },
        data: {
          commissionRate,
          updatedBy: updatedBy || null,
        },
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Update settings error:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}

