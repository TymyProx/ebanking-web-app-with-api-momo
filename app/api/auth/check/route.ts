import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getApiBaseUrl } from "@/lib/api-url"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 200 })
    }

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
      return NextResponse.json({ authenticated: true, user: userData }, { status: 200 })
    }

    return NextResponse.json({ authenticated: false }, { status: 200 })
  } catch (error) {
    console.error("Error checking authentication:", error)
    return NextResponse.json({ authenticated: false }, { status: 200 })
  }
}
