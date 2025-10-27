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
    console.log("[v0] Step 1: Creating authentication account...")
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

    console.log("[v0] Signup response status:", signupResponse.status)
    const signupResponseText = await signupResponse.text()
    console.log("[v0] Signup response body:", signupResponseText)

    if (!signupResponse.ok) {
      let errorData: any = {}
      try {
        errorData = JSON.parse(signupResponseText)
      } catch (e) {
        console.error("[v0] Failed to parse signup error response as JSON")
      }
      throw new Error(
        errorData.message ||
          errorData.error ||
          `Erreur lors de la création du compte d'authentification (Status: ${signupResponse.status})`,
      )
    }

    const signupData = JSON.parse(signupResponseText)
    const token = signupData.token || signupData.data?.token

    if (!token) {
      console.error("[v0] Signup data received:", signupData)
      throw new Error("Token non reçu de l'API")
    }

    console.log("[v0] Authentication account created, token received")

    console.log("[v0] Step 2: Creating user...")
    const userResponse = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
        console.error("[v0] Failed to parse user error response as JSON")
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

    // Step 3: Create client record
    console.log("[v0] Step 3: Creating client record...")
    const codeClient = `CLI-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    const clientResponse = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/client`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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

    console.log("[v0] Client creation response status:", clientResponse.status)
    const clientResponseText = await clientResponse.text()
    console.log("[v0] Client creation response body:", clientResponseText)

    if (!clientResponse.ok) {
      let errorData: any = {}
      try {
        errorData = JSON.parse(clientResponseText)
      } catch (e) {
        console.error("[v0] Failed to parse client error response as JSON")
      }
      throw new Error(
        errorData.message ||
          errorData.error ||
          `Erreur lors de la création du client (Status: ${clientResponse.status})`,
      )
    }

    const clientData = JSON.parse(clientResponseText)
    console.log("[v0] Client created successfully")

    // Store token in cookies
    const cookieStore = await cookies()
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

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
