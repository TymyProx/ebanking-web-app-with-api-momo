"use server"

import { cookies } from "next/headers"

const API_BASE_URL = process.env.API_BASE_URL || "https://api.example.com"
const TENANT_ID = "aa1287f6-06af-45b7-a905-8c57363565c2"

interface SignupData {
  nomComplet: string
  email: string
  telephone: string
  adresse: string
  password: string
}

export async function signupUser(data: SignupData) {
  try {
    // Step 1: Create user with role "client"
    console.log("[v0] Step 1: Creating user...")
    console.log("[v0] API URL:", `${API_BASE_URL}/tenant/${TENANT_ID}/user`)
    console.log(
      "[v0] Request body:",
      JSON.stringify({
        data: {
          emails: [data.email],
          roles: ["client"],
        },
      }),
    )

    const userResponse = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          emails: [data.email],
          roles: ["client"],
        },
      }),
    })

    console.log("[v0] User creation response status:", userResponse.status)
    const userResponseText = await userResponse.text()
    console.log("[v0] User creation response body:", userResponseText)

    if (!userResponse.ok) {
      let errorData: any = {}
      try {
        errorData = JSON.parse(userResponseText)
      } catch (e) {
        console.error("[v0] Failed to parse error response as JSON")
      }
      throw new Error(
        errorData.message ||
          errorData.error ||
          `Erreur lors de la création de l'utilisateur (Status: ${userResponse.status})`,
      )
    }

    const userData = JSON.parse(userResponseText)
    const userId = userData.id || userData.data?.id

    if (!userId) {
      console.error("[v0] User data received:", userData)
      throw new Error("ID utilisateur non reçu de l'API")
    }

    console.log("[v0] User created with ID:", userId)

    // Step 2: Create authentication account (sign-up)
    console.log("[v0] Step 2: Creating authentication account...")
    const signupResponse = await fetch(`${API_BASE_URL}/auth/sign-up`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        invitationToken: "",
        tenantId: TENANT_ID,
      }),
    })

    if (!signupResponse.ok) {
      const errorData = await signupResponse.json().catch(() => ({}))
      throw new Error(errorData.message || "Erreur lors de la création du compte d'authentification")
    }

    const signupData = await signupResponse.json()
    const token = signupData.token || signupData.data?.token

    console.log("[v0] Authentication account created")

    // Step 3: Create client record
    console.log("[v0] Step 3: Creating client record...")
    const codeClient = `CLI-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    const clientResponse = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/client`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        data: {
          nomComplet: data.nomComplet,
          email: data.email,
          telephone: data.telephone,
          adresse: data.adresse,
          codeClient: codeClient,
          userid: userId,
        },
      }),
    })

    if (!clientResponse.ok) {
      const errorData = await clientResponse.json().catch(() => ({}))
      throw new Error(errorData.message || "Erreur lors de la création du client")
    }

    const clientData = await clientResponse.json()
    console.log("[v0] Client created successfully")

    // Store token in cookies if available
    if (token) {
      const cookieStore = await cookies()
      cookieStore.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    return {
      success: true,
      message: "Inscription réussie",
      token,
      userId,
      clientId: clientData.id || clientData.data?.id,
    }
  } catch (error: any) {
    console.error("[v0] Signup error:", error)
    console.error("[v0] Error stack:", error.stack)
    return {
      success: false,
      message: error.message || "Une erreur est survenue lors de l'inscription",
    }
  }
}
