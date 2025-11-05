"use server"

import { cookies } from "next/headers"
import { setSecureCookie } from "@/lib/cookie-config"
import { config } from "@/lib/config"

const normalize = (u?: string) => (u ? u.replace(/\/$/, "") : "")
const API_BASE_URL = `${normalize(config.API_BASE_URL)}/api`
const TENANT_ID = config.TENANT_ID

export async function completeSignup(token: string, password: string, emailFallback?: string) {
  try {
    console.log("[v0] Starting signup completion process...")

    const cookieStore = await cookies()
    const pendingDataCookie = cookieStore.get("pending_signup_data")

    let pendingData: any | null = null
    if (!pendingDataCookie) {
      console.warn("[v0] No pending signup data found - using email fallback and skipping client profile creation")
      if (!emailFallback) {
        throw new Error("Données d'inscription manquantes ou expirées")
      }
      pendingData = {
        email: emailFallback,
        fullName: emailFallback.split("@")[0],
        phone: "",
        address: "",
        codeClient: `CLI-${Date.now()}`,
        verificationToken: token,
        isExistingClient: false,
        clientId: null,
      }
    } else {
      pendingData = JSON.parse(pendingDataCookie.value)
    }

    // Verify the token matches
    if (pendingData.verificationToken !== token) {
      console.error("[v0] Token mismatch")
      throw new Error("Token de vérification invalide")
    }

    console.log("[v0] Token verified successfully")

    // Step 1: Create auth account with password
    console.log("[v0] Step 1: Creating auth account via /auth/sign-up...")

    const signupPayload = {
      email: String(pendingData.email),
      password: String(password),
      tenantId: String(TENANT_ID),
    }

    console.log("[v0] Signup payload:", JSON.stringify({ ...signupPayload, password: "***" }))

    const signupResponse = await fetch(`${API_BASE_URL}/auth/sign-up`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(signupPayload),
    })

    console.log("[v0] Signup response status:", signupResponse.status)
    const signupResponseText = await signupResponse.text()
    console.log("[v0] Signup response body:", signupResponseText.substring(0, 200) + "...")

    if (!signupResponse.ok) {
      let errorData: any = {}
      try {
        errorData = JSON.parse(signupResponseText)
      } catch (e) {
        errorData = { message: signupResponseText || `HTTP ${signupResponse.status}` }
      }
      console.error("[v0] Signup failed:", errorData)

      if (errorData.message?.includes("Email is already in use") || errorData.message?.includes("already exists")) {
        throw new Error("Ce compte existe déjà. Veuillez vous connecter avec vos identifiants.")
      }

      throw new Error(errorData.message || "Erreur lors de la création du compte")
    }

    let authToken: string
    if (signupResponseText.startsWith("eyJ")) {
      authToken = signupResponseText
      console.log("[v0] Received JWT token directly")
    } else {
      const signupData = JSON.parse(signupResponseText)
      authToken = signupData.token || signupData.data?.token || signupData
      console.log("[v0] Extracted token from JSON response")
    }

    if (!authToken) {
      console.error("[v0] No token received from server")
      throw new Error("Aucun token reçu du serveur")
    }

    console.log("[v0] Auth account created successfully")

    // Step 2: Get user info
    console.log("[v0] Step 2: Getting authenticated user info...")

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

    await setSecureCookie("user", JSON.stringify(userData))
    console.log("[v0] User info stored in cookie")

    console.log("[v0] Step 3: Creating client profile...")

    if (pendingDataCookie && !pendingData.isExistingClient) {
      // Only create new client profile if this is a new client
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

      // Clear pending signup data
      cookieStore.delete("pending_signup_data")
    } else if (pendingData.isExistingClient) {
      console.log("[v0] Linking user account to existing client...")

      // Update the existing client with the new userid
      const updateClientBody = {
        data: {
          userid: String(userId),
        },
      }

      const updateResponse = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/client/${pendingData.clientId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updateClientBody),
      })

      if (!updateResponse.ok) {
        console.error("[v0] Failed to link user to existing client")
        throw new Error("Erreur lors de la liaison du compte utilisateur")
      }

      console.log("[v0] User account linked to existing client successfully")

      // Clear pending signup data
      cookieStore.delete("pending_signup_data")
    } else {
      console.log("[v0] Skipping client profile creation due to missing pending signup data")
    }

    console.log("[v0] Signup completion successful!")

    return {
      success: true,
      message: "Votre compte a été créé avec succès !",
    }
  } catch (error: any) {
    console.error("[v0] Signup completion error:", error)
    return {
      success: false,
      message: error.message || "Une erreur est survenue lors de la finalisation de l'inscription",
    }
  }
}
