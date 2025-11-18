import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      console.error("[v0] BLOB_READ_WRITE_TOKEN not found in environment variables")
      return NextResponse.json({ error: "Storage not configured" }, { status: 500 })
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const fileName = `id-documents/${timestamp}-${file.name}`

    const blob = await put(fileName, file, {
      access: "public",
      token,
    })

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
