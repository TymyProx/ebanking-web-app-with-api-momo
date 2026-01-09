"use server"

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
import { cookies } from "next/headers"
import { getApiBaseUrl } from "@/lib/api-url"

const API_BASE_URL = getApiBaseUrl()

export interface UserProfile {
  id: string
  email: string
  firstName?: string
  lastName?: string
  fullName?: string
  first_name?: string
  last_name?: string
  [key: string]: any
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const cookieToken = (await cookies()).get("token")?.value

    if (!cookieToken) {
      console.log("[v0] No token found in cookies")
      return null
    }

    console.log("[v0] Fetching user from API...")
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookieToken}`,
      },
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      console.log("[v0] API response not ok:", response.status)
      return null
    }

    const userData = await response.json()
    console.log("[v0] User data from API:", userData)
    return userData
  } catch (error) {
    console.error("[v0] Error fetching user data:", error)
    return null
  }
}
