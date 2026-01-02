import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  // Redirect to the actual fail page with all parameters
  const params = searchParams.toString()
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment/fail?${params}`)
}
