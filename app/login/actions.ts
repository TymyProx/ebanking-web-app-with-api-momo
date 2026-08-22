"use server"
import { setSecureCookie } from "@/lib/cookie-config"

export async function storeAuthToken(token: string, userData: unknown) {
  try {
    await setSecureCookie("token", token)
    await setSecureCookie("user", JSON.stringify(userData))
    return { success: true }
  } catch {
    return { success: false, error: "Failed to store authentication" }
  }
}
