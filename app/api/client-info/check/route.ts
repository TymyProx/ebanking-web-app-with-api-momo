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
      return NextResponse.json({ hasClientInfo: false }, { status: 200 })
    }

    // First get the current user
    const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookieToken}`,
      },
    })

    if (!userResponse.ok) {
      return NextResponse.json({ hasClientInfo: false }, { status: 200 })
    }

    const userData = await userResponse.json()
    const clientId = userData.data?.id

    if (!clientId) {
      return NextResponse.json({ hasClientInfo: false }, { status: 200 })
    }

    // Check if client has additional info
    const response = await fetch(
      `${API_BASE_URL}/tenant/${TENANT_ID}/ClientAdditionalInfo?filter=clientId eq '${clientId}'`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookieToken}`,
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json({ hasClientInfo: false }, { status: 200 })
    }

    const data = await response.json()
    const hasClientInfo = data.data && data.data.length > 0

    console.log("[v0] Client has additional info:", hasClientInfo)

    return NextResponse.json({ hasClientInfo }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error checking client info:", error)
    return NextResponse.json({ hasClientInfo: false }, { status: 200 })
  }
}
