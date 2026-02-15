import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = await cookies()
    
    // Supprimer tous les cookies d'authentification
    cookieStore.delete("token")
    cookieStore.delete("user")
    
    return NextResponse.json({ success: true, message: "Session cleared" })
  } catch (error) {
    console.error("Error clearing session:", error)
    return NextResponse.json({ success: false, error: "Failed to clear session" }, { status: 500 })
  }
}
