import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getApiBaseUrl } from "@/lib/api-url"
import { getServerAuthToken } from "@/lib/server-auth-token"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const tabId = url.searchParams.get("tabId") ?? undefined
    const authHeader = request.headers.get("authorization")
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : undefined

    const token = bearer || (await getServerAuthToken(tabId ?? undefined))

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 200 })
    }

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
