import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/services - Search and list services
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const minRating = searchParams.get("minRating")
    const verified = searchParams.get("verified") === "true"
    const providerId = searchParams.get("providerId")
    const sortBy = searchParams.get("sortBy") || "relevance"

    // Build where clause
    const where: any = {
      // If filtering by providerId, show all services (including inactive)
      // Otherwise, only show active services
      ...(providerId ? {} : { isActive: true }),
      provider: {
        userType: "provider",
        isVerified: verified ? true : undefined,
        ...(providerId ? { id: providerId } : {}),
      },
    }

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ]
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    // Build orderBy
    let orderBy: any = { createdAt: "desc" }
    if (sortBy === "price_asc") orderBy = { price: "asc" }
    if (sortBy === "price_desc") orderBy = { price: "desc" }
    if (sortBy === "rating") orderBy = { provider: { createdAt: "desc" } } // Placeholder for rating

    const services = await db.service.findMany({
      where,
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            isVerified: true,
            verificationStatus: true,
          },
        },
      },
      orderBy,
    })

    return NextResponse.json({ services })
  } catch (error) {
    console.error("Get services error:", error)
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
  }
}

// POST /api/services - Create a new service (provider only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { providerId, name, description, category, price, priceType, priceRange, duration, image, serviceArea } = body

    if (!providerId || !name || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate pricing based on priceType
    if (priceType === "range") {
      if (!priceRange) {
        return NextResponse.json({ error: "Price range is required for range pricing" }, { status: 400 })
      }
    } else {
      if (!price) {
        return NextResponse.json({ error: "Price is required" }, { status: 400 })
      }
    }

    // Verify provider exists and is a provider
    const provider = await db.user.findUnique({
      where: { id: providerId, userType: "provider" },
    })

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 })
    }

    const service = await db.service.create({
      data: {
        providerId,
        name,
        description,
        category,
        price: priceType === "range" ? 0 : parseFloat(price), // Use 0 for range, actual price otherwise
        priceType: priceType || "fixed",
        priceRange,
        duration: duration ? parseInt(duration) : null,
        image,
        serviceArea,
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            isVerified: true,
          },
        },
      },
    })

    return NextResponse.json({ service }, { status: 201 })
  } catch (error) {
    console.error("Create service error:", error)
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 })
  }
}

