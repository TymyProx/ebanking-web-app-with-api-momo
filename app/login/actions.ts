"use server"
import { setSecureCookie } from "@/lib/cookie-config"

export async function storeAuthToken(token: string, userData: any) {
  try {
    console.log("[v0] Storing auth token in HttpOnly cookies...")
    console.log("[v0] Token length:", token?.length)
    console.log("[v0] User data:", JSON.stringify(userData))

    // Définir les cookies avec les options sécurisées
    await setSecureCookie("token", token)
    await setSecureCookie("user", JSON.stringify(userData))

    console.log("[v0] Auth token and user data stored in HttpOnly cookies successfully")
    console.log("[v0] Cookies configured with maxAge: 24h (session will persist on refresh)")

    return { success: true }
  } catch (error) {
    console.error("[v0] Error storing auth token:", error)
    return { success: false, error: "Failed to store authentication" }
  }
}
