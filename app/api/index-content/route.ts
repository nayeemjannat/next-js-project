import { NextResponse } from "next/server"
import { indexAllContent } from "@/lib/indexer"

export async function POST(request: Request) {
  // TODO: Add admin auth check if needed
  try {
    const result = await indexAllContent()
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 })
  }
}
