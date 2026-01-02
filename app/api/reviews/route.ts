import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/reviews?providerId=xxx - Get reviews for a provider
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get("providerId")
    const bookingId = searchParams.get("bookingId")

    if (bookingId) {
      // Get review for a specific booking
      const review = await db.review.findUnique({
        where: { bookingId },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      return NextResponse.json({ review })
    }

    if (!providerId) {
      return NextResponse.json({ error: "Provider ID is required" }, { status: 400 })
    }

    // Get all reviews for a provider
    const reviews = await db.review.findMany({
      where: { providerId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
          },
        },
        booking: {
          select: {
            scheduledDate: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Calculate average rating
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    // Calculate rating distribution
    const ratingDistribution = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    }

    return NextResponse.json({
      reviews,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReviews: reviews.length,
      ratingDistribution,
    })
  } catch (error) {
    console.error("Get reviews error:", error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}

// POST /api/reviews - Create a new review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId, customerId, providerId, serviceId, rating, comment } = body

    if (!bookingId || !customerId || !providerId || !serviceId || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    // Verify booking exists and is completed
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (booking.status !== "completed") {
      return NextResponse.json(
        { error: "You can only review completed bookings" },
        { status: 400 }
      )
    }

    if (booking.customerId !== customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Check if review already exists
    const existingReview = await db.review.findUnique({
      where: { bookingId },
    })

    if (existingReview) {
      return NextResponse.json({ error: "Review already exists for this booking" }, { status: 400 })
    }

    // Create review
    const review = await db.review.create({
      data: {
        bookingId,
        customerId,
        providerId,
        serviceId,
        rating,
        comment: comment || null,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error("Create review error:", error)
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
  }
}

