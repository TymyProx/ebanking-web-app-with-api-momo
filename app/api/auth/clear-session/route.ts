import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { tokenCookieName, userCookieName } from "@/lib/auth-cookie-names"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const tabId = typeof body.tabId === "string" ? body.tabId : undefined

    const cookieStore = await cookies()

    if (tabId) {
      cookieStore.delete(tokenCookieName(tabId))
      cookieStore.delete(userCookieName(tabId))
    }

    cookieStore.delete("token")
    cookieStore.delete("user")
    cookieStore.delete("auth_tab_id")

    return NextResponse.json({ success: true, message: "Session cleared" })
  } catch (error) {
    console.error("Error clearing session:", error)
    return NextResponse.json({ success: false, error: "Failed to clear session" }, { status: 500 })
  }
}
