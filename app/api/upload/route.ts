import { NextRequest, NextResponse } from "next/server"

// POST /api/upload - Handle image uploads (base64 for now)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image } = body

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // For now, we'll accept base64 images or URLs
    // In production, you'd want to upload to S3, Cloudinary, etc.
    if (image.startsWith("data:image")) {
      // Base64 image - return as is (or process and store)
      return NextResponse.json({ url: image })
    } else if (image.startsWith("http://") || image.startsWith("https://")) {
      // URL - return as is
      return NextResponse.json({ url: image })
    } else {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 })
    }
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}

