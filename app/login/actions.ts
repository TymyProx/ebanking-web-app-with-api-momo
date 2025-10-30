"use server"

import { cookies } from "next/headers"

export async function storeAuthToken(token: string, userData: any) {
  try {
    const cookieStore = await cookies()

    // Store token in HttpOnly cookie for Server Actions
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    // Store user data in HttpOnly cookie
    cookieStore.set("user", JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    console.log("[v0] Auth token and user data stored in HttpOnly cookies")

    return { success: true }
  } catch (error) {
    console.error("[v0] Error storing auth token:", error)
    return { success: false, error: "Failed to store authentication" }
  }
}
