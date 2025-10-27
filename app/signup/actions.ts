"use server"

import { cookies } from "next/headers"

const API_BASE_URL = process.env.API_BASE_URL
const TENANT_ID = "aa1287f6-06af-45b7-a905-8c57363565c2"

interface SignupData {
  fullName: string
  email: string
  phone: string
  password: string
  address: string
}

export async function signupUser(data: SignupData) {
  try {
    console.log("[v0] Starting signup process...")

    if (!data.email) {
      return { success: false, message: "Email requis" }
    }
    if (!data.password) {
      return { success: false, message: "Mot de passe requis" }
    }
    if (!data.fullName) {
      return { success: false, message: "Nom complet requis" }
    }
    if (!data.phone) {
      return { success: false, message: "Téléphone requis" }
    }
    if (!data.address) {
      return { success: false, message: "Adresse requise" }
    }

    // Generate a unique client code
    const codeClient = `CLI-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`

    console.log("[v0] Step 1: Creating authentication account...")

    const signupPayload = {
      email: String(data.email),
      password: String(data.password),
      invitationToken: "string",
      tenantId: String(TENANT_ID),
      roles: ["admin"], // Set role to admin
      status: "active", // Set status to active
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
    console.log("[v0] Signup response body:", signupResponseText.substring(0, 100) + "...")

    if (!signupResponse.ok) {
      let errorData: any = {}
      try {
        errorData = JSON.parse(signupResponseText)
      } catch (e) {
        errorData = { message: signupResponseText || `HTTP ${signupResponse.status}` }
      }
      console.error("[v0] Signup failed:", errorData)

      if (errorData.message?.includes("Email is already in use") || errorData.message?.includes("already exists")) {
        return {
          success: false,
          message: "Ce compte existe déjà. Veuillez vous connecter avec vos identifiants.",
        }
      }

      throw new Error(errorData.message || "Erreur lors de la création du compte")
    }

    let token: string
    if (signupResponseText.startsWith("eyJ")) {
      // Response is a JWT token string
      token = signupResponseText
      console.log("[v0] Received JWT token directly")
    } else {
      // Response is JSON
      const signupData = JSON.parse(signupResponseText)
      token = signupData.token || signupData.data?.token || signupData
      console.log("[v0] Extracted token from JSON response")
    }

    if (!token) {
      console.error("[v0] No token received from server")
      return { success: false, message: "Aucun token reçu du serveur" }
    }

    console.log("[v0] Authentication account created successfully")

    console.log("[v0] Step 2: Getting user info...")
    const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!meResponse.ok) {
      const errorData = await meResponse.json().catch(() => ({}))
      console.error("[v0] Failed to get user info:", errorData)
      throw new Error("Erreur lors de la récupération des informations utilisateur")
    }

    const userData = await meResponse.json()
    console.log("[v0] User info retrieved successfully")
    console.log("[v0] User roles:", userData.roles)
    console.log("[v0] User status:", userData.status)

    const userId = userData.id

    if (!userId) {
      throw new Error("ID utilisateur non trouvé")
    }

    console.log("[v0] Step 3: Creating client record...")

    const clientRequestBody = {
      data: {
        nomComplet: String(data.fullName),
        email: String(data.email),
        telephone: String(data.phone),
        adresse: String(data.address),
        codeClient: String(codeClient),
        userid: String(userId),
      },
    }
    console.log("[v0] Client request body:", JSON.stringify(clientRequestBody))
    console.log("[v0] API URL:", `${API_BASE_URL}/tenant/${TENANT_ID}/client`)

    const clientResponse = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/client`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(clientRequestBody),
    })

    console.log("[v0] Client response status:", clientResponse.status)
    console.log("[v0] Client response status text:", clientResponse.statusText)
    const clientResponseText = await clientResponse.text()
    console.log("[v0] Client response body:", clientResponseText.substring(0, 200) + "...")

    if (!clientResponse.ok) {
      let errorData: any = {}
      try {
        errorData = JSON.parse(clientResponseText)
      } catch (e) {
        console.error("[v0] Failed to parse error response as JSON")
        errorData = { message: clientResponseText || `HTTP ${clientResponse.status}: ${clientResponse.statusText}` }
      }
      console.error("[v0] Client creation failed:", errorData)
      throw new Error(errorData.message || "Erreur lors de la création du profil client")
    }

    let clientData: any
    try {
      clientData = JSON.parse(clientResponseText)
    } catch (e) {
      console.error("[v0] Failed to parse client response as JSON")
      throw new Error("Réponse invalide du serveur")
    }
    console.log("[v0] Client created successfully")

    // Store token in cookies
    const cookieStore = await cookies()
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token)
      localStorage.setItem("user_data", JSON.stringify(userData))
    }

    console.log("[v0] Signup process completed successfully!")

    return {
      success: true,
      message: "Inscription réussie !",
      token,
      userId,
      clientId: clientData.id || clientData.data?.id,
      user: {
        id: userData.id,
        email: userData.email,
        roles: userData.roles || ["admin"],
        status: userData.status || "active",
      },
    }
  } catch (error: any) {
    console.error("[v0] Signup error:", error)
    return {
      success: false,
      message: error.message || "Une erreur est survenue lors de l'inscription",
    }
  }
}
