import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/services/[id] - Get a single service
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const serviceId = resolvedParams.id
    
    if (!serviceId) {
      return NextResponse.json({ error: "Service ID is required" }, { status: 400 })
    }

    const service = await db.service.findUnique({
      where: { id: serviceId },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            phone: true,
            isVerified: true,
            verificationStatus: true,
          },
        },
      },
    })

    if (!service) {
      console.error(`Service not found: ${serviceId}`)
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    console.log(`Service found: ${service.id} - ${service.name}`)
    return NextResponse.json({ service })
  } catch (error) {
    console.error("Get service error:", error)
    return NextResponse.json({ error: "Failed to fetch service" }, { status: 500 })
  }
}

// PUT /api/services/[id] - Update a service
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const serviceId = resolvedParams.id
    
    if (!serviceId) {
      return NextResponse.json({ error: "Service ID is required" }, { status: 400 })
    }

    const body = await request.json()
    const { name, description, category, price, priceType, priceRange, duration, image, serviceArea, isActive } = body

    // Build update data based on priceType to avoid conflicts
    const updateData: any = {}
    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (category) updateData.category = category
    if (priceType) {
      updateData.priceType = priceType
      // Clear conflicting fields based on priceType
      if (priceType === "range") {
        updateData.price = 0 // Set to 0 for range pricing
        if (priceRange !== undefined) updateData.priceRange = priceRange
        // Clear price if switching to range
        updateData.price = 0
      } else {
        // For fixed or hourly, use price and clear priceRange
        if (price !== undefined && price !== "") {
          updateData.price = parseFloat(price)
        }
        updateData.priceRange = null // Clear priceRange
      }
    } else {
      // If priceType not provided, handle price/priceRange separately
      if (price !== undefined && price !== "") {
        updateData.price = parseFloat(price)
      }
      if (priceRange !== undefined) {
        updateData.priceRange = priceRange
      }
    }
    if (duration !== undefined) updateData.duration = duration ? parseInt(duration) : null
    if (image !== undefined) updateData.image = image
    if (serviceArea !== undefined) updateData.serviceArea = serviceArea
    if (isActive !== undefined) updateData.isActive = isActive

    const service = await db.service.update({
      where: { id: serviceId },
      data: updateData,
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({ service })
  } catch (error) {
    console.error("Update service error:", error)
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 })
  }
}

// DELETE /api/services/[id] - Delete a service
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const serviceId = resolvedParams.id
    
    if (!serviceId) {
      return NextResponse.json({ error: "Service ID is required" }, { status: 400 })
    }

    await db.service.delete({
      where: { id: serviceId },
    })

    return NextResponse.json({ message: "Service deleted successfully" })
  } catch (error) {
    console.error("Delete service error:", error)
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 })
  }
}

