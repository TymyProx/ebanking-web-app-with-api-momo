"use server"
import { setSecureCookie } from "@/lib/cookie-config"

export async function storeAuthToken(token: string, userData: any) {
  try {
    await setSecureCookie("token", token)
    await setSecureCookie("user", JSON.stringify(userData))

    console.log("[v0] Auth token and user data stored in HttpOnly cookies")

    return { success: true }
  } catch (error) {
    console.error("[v0] Error storing auth token:", error)
    return { success: false, error: "Failed to store authentication" }
  }
}
