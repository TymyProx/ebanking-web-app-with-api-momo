import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getApiBaseUrl } from "@/lib/api-url"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      console.log("[Auth Check] No token cookie found")
      return NextResponse.json({ authenticated: false }, { status: 200 })
    }

    console.log("[Auth Check] Token found, validating with API...")

    // Vérifier que le token est valide en appelant /auth/me
    const API_BASE_URL = getApiBaseUrl()
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    if (response.ok) {
      const userData = await response.json()
      console.log("[Auth Check] Token is valid, user authenticated")
      return NextResponse.json({ authenticated: true, user: userData }, { status: 200 })
    }

    console.log("[Auth Check] Token validation failed, status:", response.status)
    return NextResponse.json({ authenticated: false }, { status: 200 })
  } catch (error) {
    console.error("[Auth Check] Error checking authentication:", error)
    return NextResponse.json({ authenticated: false }, { status: 200 })
  }
}
