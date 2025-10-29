"use server"

import { cookies } from "next/headers"

const normalize = (u?: string) => (u ? u.replace(/\/$/, "") : "")
const API_BASE_URL = `${normalize(process.env.NEXT_PUBLIC_API_URL || "https://35.184.98.9:4000")}/api`
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "aa1287f6-06af-45b7-a905-8c57363565c2"

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

    // Split full name into first and last name
    const nameParts = data.fullName.trim().split(" ")
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || nameParts[0] || ""

    // Generate a unique client code
    const codeClient = `CLI-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`

    console.log("[v0] Step 1: Creating auth account via /auth/sign-up...")

    const signupPayload = {
      email: String(data.email),
      password: String(data.password),
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
        return {
          success: false,
          message: "Ce compte existe déjà. Veuillez vous connecter avec vos identifiants.",
        }
      }

      throw new Error(errorData.message || "Erreur lors de la création du compte")
    }

    let token: string
    if (signupResponseText.startsWith("eyJ")) {
      token = signupResponseText
      console.log("[v0] Received JWT token directly")
    } else {
      const signupData = JSON.parse(signupResponseText)
      token = signupData.token || signupData.data?.token || signupData
      console.log("[v0] Extracted token from JSON response")
    }

    if (!token) {
      console.error("[v0] No token received from server")
      return { success: false, message: "Aucun token reçu du serveur" }
    }

    console.log("[v0] Auth account created successfully")

    console.log("[v0] Step 2: Attempting to send email verification...")
    try {
      const verificationPayload = {
        email: String(data.email),
        tenantId: String(TENANT_ID),
      }

      const verificationResponse = await fetch(`${API_BASE_URL}/auth/send-email-address-verification-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(verificationPayload),
      })

      if (verificationResponse.ok) {
        console.log("[v0] Verification email sent successfully")
      } else {
        console.log("[v0] Email verification not available (provider not configured), continuing without it...")
      }
    } catch (emailError) {
      console.log("[v0] Email verification not available, continuing without it...")
    }

    console.log("[v0] Step 3: Getting user info...")
    const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!meResponse.ok) {
      console.error("[v0] Failed to get user info")
      throw new Error("Erreur lors de la récupération des informations utilisateur")
    }

    const userData = await meResponse.json()
    const userId = userData.id || userData.data?.id
    console.log("[v0] User ID:", userId)

    if (!userId) {
      console.error("[v0] No user ID found")
      throw new Error("ID utilisateur non trouvé")
    }

    console.log("[v0] Step 4: Creating client profile...")
    const clientPayload = {
      data: {
        userid: userId,
        codeclient: codeClient,
        nom: lastName,
        prenom: firstName,
        email: data.email,
        telephone: data.phone,
        adresse: data.address,
        statut: "active",
      },
    }

    console.log("[v0] Client payload:", JSON.stringify(clientPayload))

    const clientResponse = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/client`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(clientPayload),
    })

    console.log("[v0] Client creation response status:", clientResponse.status)
    const clientResponseText = await clientResponse.text()
    console.log("[v0] Client creation response body:", clientResponseText)

    if (!clientResponse.ok) {
      let errorData: any = {}
      try {
        errorData = JSON.parse(clientResponseText)
      } catch (e) {
        errorData = { message: clientResponseText || `HTTP ${clientResponse.status}` }
      }
      console.error("[v0] Failed to create client profile:", errorData)
      throw new Error(errorData.message || "Erreur lors de la création du profil client")
    }

    console.log("[v0] Client profile created successfully")

    const cookieStore = await cookies()
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    console.log("[v0] Signup process completed successfully")

    return {
      success: true,
      message: "Inscription réussie ! Vous allez être redirigé vers votre tableau de bord.",
      token: token,
    }
  } catch (error: any) {
    console.error("[v0] Signup error:", error)
    return {
      success: false,
      message: error.message || "Une erreur est survenue lors de l'inscription",
    }
  }
}
