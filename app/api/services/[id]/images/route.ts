import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/services/[id]/images - Get all images for a service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const images = await db.serviceImage.findMany({
      where: { serviceId: resolvedParams.id },
      orderBy: { order: "asc" },
    })

    return NextResponse.json({ images })
  } catch (error) {
    console.error("Get service images error:", error)
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 })
  }
}

// POST /api/services/[id]/images - Add images to a service
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const body = await request.json()
    const { images } = body // Array of image URLs/base64

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "Images array is required" }, { status: 400 })
    }

    // Verify service exists
    const service = await db.service.findUnique({
      where: { id: resolvedParams.id },
    })

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    // Get current max order
    const existingImages = await db.serviceImage.findMany({
      where: { serviceId: resolvedParams.id },
      orderBy: { order: "desc" },
      take: 1,
    })

    const startOrder = existingImages.length > 0 ? existingImages[0].order + 1 : 0

    // Create images
    const createdImages = await Promise.all(
      images.map((imageUrl: string, index: number) =>
        db.serviceImage.create({
          data: {
            serviceId: resolvedParams.id,
            imageUrl,
            order: startOrder + index,
          },
        })
      )
    )

    return NextResponse.json({ images: createdImages }, { status: 201 })
  } catch (error) {
    console.error("Create service images error:", error)
    return NextResponse.json({ error: "Failed to add images" }, { status: 500 })
  }
}

// DELETE /api/services/[id]/images - Delete an image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get("imageId")

    if (!imageId) {
      return NextResponse.json({ error: "Image ID is required" }, { status: 400 })
    }

    await db.serviceImage.delete({
      where: { id: imageId },
    })

    return NextResponse.json({ message: "Image deleted successfully" })
  } catch (error) {
    console.error("Delete service image error:", error)
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 })
  }
}

