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

    console.log("[v0] Step 1: Creating user account via /tenant/{tenantId}/user...")

    const createUserPayload = {
      data: {
        emails: [String(data.email)],
        roles: ["custom"], // Client role
        firstName: String(firstName),
        lastName: String(lastName),
        sendInvitationEmail: false, // No email for self-signup
      },
    }

    console.log("[v0] Create user payload:", JSON.stringify(createUserPayload))

    const createUserResponse = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createUserPayload),
    })

    console.log("[v0] Create user response status:", createUserResponse.status)
    const createUserResponseText = await createUserResponse.text()
    console.log("[v0] Create user response body:", createUserResponseText.substring(0, 200) + "...")

    if (!createUserResponse.ok) {
      let errorData: any = {}
      try {
        errorData = JSON.parse(createUserResponseText)
      } catch (e) {
        errorData = { message: createUserResponseText || `HTTP ${createUserResponse.status}` }
      }
      console.error("[v0] User creation failed:", errorData)

      if (errorData.message?.includes("Email is already in use") || errorData.message?.includes("already exists")) {
        return {
          success: false,
          message: "Ce compte existe déjà. Veuillez vous connecter avec vos identifiants.",
        }
      }

      throw new Error(errorData.message || "Erreur lors de la création du compte utilisateur")
    }

    let userData: any
    try {
      userData = JSON.parse(createUserResponseText)
    } catch (e) {
      console.error("[v0] Failed to parse user creation response as JSON")
      throw new Error("Réponse invalide du serveur")
    }

    const userId = userData.id || userData.data?.id
    if (!userId) {
      throw new Error("ID utilisateur non trouvé dans la réponse")
    }

    console.log("[v0] User account created successfully, userId:", userId)

    console.log("[v0] Step 2: Activating user account with password...")

    const activateUserPayload = {
      email: String(data.email),
      password: String(data.password),
      invitationToken: userId, // Use userId as token for self-signup
      token: userId,
      tenantId: String(TENANT_ID),
      firstName: String(firstName),
      lastName: String(lastName),
    }

    console.log("[v0] Activate user payload:", JSON.stringify({ ...activateUserPayload, password: "***" }))

    const activateResponse = await fetch(`${API_BASE_URL}/auth/sign-up`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(activateUserPayload),
    })

    console.log("[v0] Activate response status:", activateResponse.status)
    const activateResponseText = await activateResponse.text()
    console.log("[v0] Activate response body:", activateResponseText.substring(0, 100) + "...")

    if (!activateResponse.ok) {
      let errorData: any = {}
      try {
        errorData = JSON.parse(activateResponseText)
      } catch (e) {
        errorData = { message: activateResponseText || `HTTP ${activateResponse.status}` }
      }
      console.error("[v0] User activation failed:", errorData)
      throw new Error(errorData.message || "Erreur lors de l'activation du compte")
    }

    // Extract JWT token from response
    let token: string
    if (activateResponseText.startsWith("eyJ")) {
      token = activateResponseText
      console.log("[v0] Received JWT token directly")
    } else {
      const activateData = JSON.parse(activateResponseText)
      token = activateData.token || activateData.data?.token || activateData
      console.log("[v0] Extracted token from JSON response")
    }

    if (!token) {
      console.error("[v0] No token received from server")
      return { success: false, message: "Aucun token reçu du serveur" }
    }

    console.log("[v0] User account activated successfully")

    console.log("[v0] Step 3: Getting authenticated user info...")

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

    const authenticatedUserData = await meResponse.json()
    console.log("[v0] User info retrieved successfully")

    console.log("[v0] Step 4: Creating client profile...")

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

    const clientResponse = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/client`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
        console.error("[v0] Failed to parse error response as JSON")
        errorData = { message: clientResponseText || `HTTP ${clientResponse.status}` }
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
    console.log("[v0] Client profile created successfully")

    const cookieStore = await cookies()
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    console.log("[v0] Signup process completed successfully!")

    return {
      success: true,
      message: "Inscription réussie !",
      token,
      userId,
      clientId: clientData.id || clientData.data?.id,
      user: {
        id: authenticatedUserData.id,
        email: authenticatedUserData.email,
        firstName: authenticatedUserData.firstName,
        lastName: authenticatedUserData.lastName,
        roles: authenticatedUserData.roles || ["custom"],
        status: authenticatedUserData.status || "active",
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
