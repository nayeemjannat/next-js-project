import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/addresses?customerId=xxx - Get addresses for a customer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customerId")

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }

    const addresses = await db.address.findMany({
      where: { customerId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    })

    return NextResponse.json({ addresses })
  } catch (error) {
    console.error("Get addresses error:", error)
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 })
  }
}

// POST /api/addresses - Create a new address
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, label, address, city, state, zipCode, isDefault } = body

    if (!customerId || !label || !address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await db.address.updateMany({
        where: { customerId },
        data: { isDefault: false },
      })
    }

    const newAddress = await db.address.create({
      data: {
        customerId,
        label,
        address,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        isDefault: isDefault || false,
      },
    })

    return NextResponse.json({ address: newAddress }, { status: 201 })
  } catch (error) {
    console.error("Create address error:", error)
    return NextResponse.json({ error: "Failed to create address" }, { status: 500 })
  }
}

