import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// PUT /api/addresses/[id] - Update an address
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const body = await request.json()
    const { label, address, city, state, zipCode, isDefault, customerId } = body

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }

    const existingAddress = await db.address.findUnique({
      where: { id: resolvedParams.id },
    })

    if (!existingAddress) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 })
    }

    if (existingAddress.customerId !== customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await db.address.updateMany({
        where: { customerId, id: { not: resolvedParams.id } },
        data: { isDefault: false },
      })
    }

    const updatedAddress = await db.address.update({
      where: { id: resolvedParams.id },
      data: {
        ...(label && { label }),
        ...(address && { address }),
        ...(city !== undefined && { city: city || null }),
        ...(state !== undefined && { state: state || null }),
        ...(zipCode !== undefined && { zipCode: zipCode || null }),
        ...(isDefault !== undefined && { isDefault }),
      },
    })

    return NextResponse.json({ address: updatedAddress })
  } catch (error) {
    console.error("Update address error:", error)
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 })
  }
}

// DELETE /api/addresses/[id] - Delete an address
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customerId")

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }

    const address = await db.address.findUnique({
      where: { id: resolvedParams.id },
    })

    if (!address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 })
    }

    if (address.customerId !== customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await db.address.delete({
      where: { id: resolvedParams.id },
    })

    return NextResponse.json({ message: "Address deleted successfully" })
  } catch (error) {
    console.error("Delete address error:", error)
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 })
  }
}

