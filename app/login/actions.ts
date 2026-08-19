"use server"
import { setSecureCookie, deleteSecureCookie } from "@/lib/cookie-config"
import { tokenCookieName, userCookieName } from "@/lib/auth-cookie-names"

export async function storeAuthToken(token: string, userData: unknown, tabId: string) {
  try {
    await setSecureCookie(tokenCookieName(tabId), token)
    await setSecureCookie(userCookieName(tabId), JSON.stringify(userData))

    await deleteSecureCookie("token")
    await deleteSecureCookie("user")
    await deleteSecureCookie("auth_tab_id")

    return { success: true }
  } catch (error) {
    console.error("[auth] Error storing tab-scoped auth token:", error)
    return { success: false, error: "Failed to store authentication" }
  }
}
