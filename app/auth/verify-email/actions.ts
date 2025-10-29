"use server"

import { cookies } from "next/headers"

const normalize = (u?: string) => (u ? u.replace(/\/$/, "") : "")
const API_BASE_URL = `${normalize(process.env.NEXT_PUBLIC_API_URL || "https://35.184.98.9:4000")}/api`
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "aa1287f6-06af-45b7-a905-8c57363565c2"

export async function verifyEmail(token: string) {
  try {
    console.log("[v0] Starting email verification process...")

    const cookieStore = await cookies()
    const pendingDataCookie = cookieStore.get("pending_signup_data")

    if (!pendingDataCookie) {
      console.error("[v0] No pending signup data found")
      throw new Error("Données d'inscription manquantes ou expirées")
    }

    const pendingData = JSON.parse(pendingDataCookie.value)

    // Verify the token matches
    if (pendingData.verificationToken !== token) {
      console.error("[v0] Token mismatch")
      throw new Error("Token de vérification invalide")
    }

    console.log("[v0] Token verified successfully")

    // Use the stored auth token
    const authToken = pendingData.token

    if (!authToken) {
      console.error("[v0] No auth token in pending data")
      throw new Error("Token d'authentification manquant")
    }

    // Step 1: Get user info
    console.log("[v0] Step 1: Getting authenticated user info...")

    const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })

    if (!meResponse.ok) {
      const errorData = await meResponse.json().catch(() => ({}))
      console.error("[v0] Failed to get user info:", errorData)
      throw new Error("Erreur lors de la récupération des informations utilisateur")
    }

    const userData = await meResponse.json()
    const userId = userData.id
    console.log("[v0] User info retrieved successfully, userId:", userId)

    // Step 2: Create client profile
    console.log("[v0] Step 2: Creating client profile...")

    const clientRequestBody = {
      data: {
        nomComplet: String(pendingData.fullName),
        email: String(pendingData.email),
        telephone: String(pendingData.phone),
        adresse: String(pendingData.address),
        codeClient: String(pendingData.codeClient),
        userid: String(userId),
      },
    }

    console.log("[v0] Client request body:", JSON.stringify(clientRequestBody))

    const clientResponse = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/client`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(clientRequestBody),
    })

    console.log("[v0] Client response status:", clientResponse.status)
    const clientResponseText = await clientResponse.text()
    console.log("[v0] Client response body:", clientResponseText.substring(0, 200) + "...")

    if (!clientResponse.ok) {
      let errorData: any = {}
      try {
        errorData = JSON.parse(clientResponseText)
      } catch (e) {
        errorData = { message: clientResponseText || `HTTP ${clientResponse.status}` }
      }
      console.error("[v0] Client creation failed:", errorData)
      throw new Error(errorData.message || "Erreur lors de la création du profil client")
    }

    console.log("[v0] Client profile created successfully")

    // Set auth token in cookie
    cookieStore.set("token", authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    // Clear pending signup data
    cookieStore.delete("pending_signup_data")

    console.log("[v0] Email verification and account setup completed successfully!")

    return {
      success: true,
      message: "Votre compte a été activé avec succès !",
    }
  } catch (error: any) {
    console.error("[v0] Email verification error:", error)
    return {
      success: false,
      message: error.message || "Une erreur est survenue lors de la vérification de l'email",
    }
  }
}
