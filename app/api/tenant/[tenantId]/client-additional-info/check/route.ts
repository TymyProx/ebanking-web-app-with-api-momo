import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { config } from "@/lib/config"

const normalize = (u?: string) => (u ? u.replace(/\/$/, "") : "")
const API_BASE_URL = `${normalize(config.API_BASE_URL)}/api`

export async function GET(request: NextRequest, { params }: { params: { tenantId: string } }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return NextResponse.json({ hasAdditionalInfo: false }, { status: 200 })
    }

    // Get current user ID
    const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!userResponse.ok) {
      return NextResponse.json({ hasAdditionalInfo: false }, { status: 200 })
    }

    const userData = await userResponse.json()
    const clientId = userData.id

    // Check if client has additional info in ClientAdditionalInfos table
    const response = await fetch(`${API_BASE_URL}/tenant/${params.tenantId}/client-additional-info?filter=${encodeURIComponent(JSON.stringify({ clientId }))}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      // If API fails or doesn't exist, assume no additional info
      return NextResponse.json({ hasAdditionalInfo: false }, { status: 200 })
    }

    const data = await response.json()
    const hasAdditionalInfo = data.rows && data.rows.length > 0

    return NextResponse.json({ hasAdditionalInfo }, { status: 200 })
  } catch (error) {
    console.error("Error checking client additional info:", error)
    // On error, return false to show fields by default (safer option)
    return NextResponse.json({ hasAdditionalInfo: false }, { status: 200 })
  }
}
