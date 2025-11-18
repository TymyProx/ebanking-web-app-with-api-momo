import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { config } from "@/lib/config"

const normalize = (u?: string) => (u ? u.replace(/\/$/, "") : "")
const API_BASE_URL = `${normalize(config.API_BASE_URL)}/api`
const TENANT_ID = config.TENANT_ID

export async function GET() {
  try {
    const cookieToken = (await cookies()).get("token")?.value

    if (!cookieToken) {
      console.log("[v0] No token found in cookies")
      return NextResponse.json({ hasClientInfo: false }, { status: 200 })
    }

    console.log("[v0] Fetching user from auth/me...")
    const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookieToken}`,
      },
    })

    if (!userResponse.ok) {
      console.log("[v0] Failed to fetch user:", userResponse.status)
      return NextResponse.json({ hasClientInfo: false }, { status: 200 })
    }

    const userData = await userResponse.json()
    console.log("[v0] User data received:", JSON.stringify(userData, null, 2))
    
    const userId = userData.id || userData.data?.id
    
    console.log("[v0] Extracted user ID:", userId)

    if (!userId) {
      console.log("[v0] No user ID found in response")
      return NextResponse.json({ hasClientInfo: false }, { status: 200 })
    }

    const checkUrl = `${API_BASE_URL}/tenant/${TENANT_ID}/ClientAdditionalInfo?filter=clientId eq '${userId}'`
    console.log("[v0] Checking ClientAdditionalInfo with URL:", checkUrl)
    
    const response = await fetch(checkUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookieToken}`,
      },
    })

    if (!response.ok) {
      console.log("[v0] ClientAdditionalInfo API failed:", response.status)
      return NextResponse.json({ hasClientInfo: false }, { status: 200 })
    }

    const data = await response.json()
    const hasClientInfo = data.data && data.data.length > 0

    console.log("[v0] ClientAdditionalInfo check result:", {
      userId,
      recordCount: data.data?.length || 0,
      hasClientInfo,
      records: data.data
    })

    return NextResponse.json({ hasClientInfo }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error checking client info:", error)
    return NextResponse.json({ hasClientInfo: false }, { status: 200 })
  }
}
