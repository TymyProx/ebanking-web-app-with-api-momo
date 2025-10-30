"use server"
import { setSecureCookie } from "@/lib/cookie-config"

export async function storeAuthToken(token: string, userData: any) {
  try {
    console.log("[v0] Storing auth token in production...")
    console.log("[v0] Token length:", token?.length)
    console.log("[v0] User data:", JSON.stringify(userData))

    await setSecureCookie("token", token)
    await setSecureCookie("user", JSON.stringify(userData))

    console.log("[v0] Auth token and user data stored in HttpOnly cookies successfully")

    return { success: true }
  } catch (error) {
    console.error("[v0] Error storing auth token:", error)
    return { success: false, error: "Failed to store authentication" }
  }
}
