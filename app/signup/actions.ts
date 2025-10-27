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

    // Generate a unique client code
    const codeClient = `CLI-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`

    // Step 1: Create user with admin role
    console.log("[v0] Step 1: Creating user...")
    const userResponse = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          emails: [data.email],
          roles: ["admin"],
        },
      }),
    })

    if (!userResponse.ok) {
      const errorData = await userResponse.json().catch(() => ({}))
      console.error("[v0] User creation failed:", errorData)
      throw new Error(errorData.message || "Erreur lors de la création de l'utilisateur")
    }

    const userData = await userResponse.json()
    console.log("[v0] User created successfully:", userData)

    // Extract user ID from response
    const userId = userData.id || userData.data?.id

    if (!userId) {
      throw new Error("ID utilisateur non trouvé dans la réponse")
    }

    // Step 2: Create authentication account
    console.log("[v0] Step 2: Creating authentication account...")
    const signupResponse = await fetch(`${API_BASE_URL}/auth/sign-up`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        invitationToken: "string",
        tenantId: TENANT_ID,
      }),
    })

    if (!signupResponse.ok) {
      const errorData = await signupResponse.json().catch(() => ({}))
      console.error("[v0] Signup failed:", errorData)
      throw new Error(errorData.message || "Erreur lors de la création du compte")
    }

    const signupData = await signupResponse.json()
    console.log("[v0] Authentication account created successfully")

    // Extract token from response
    const token = signupData.token || signupData.data?.token || signupData

    // Step 3: Create client record
    console.log("[v0] Step 3: Creating client record...")
    const clientResponse = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/client`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        data: {
          nomComplet: data.fullName,
          email: data.email,
          telephone: data.phone,
          adresse: data.address,
          codeClient: codeClient,
          userid: userId,
        },
      }),
    })

    if (!clientResponse.ok) {
      const errorData = await clientResponse.json().catch(() => ({}))
      console.error("[v0] Client creation failed:", errorData)
      throw new Error(errorData.message || "Erreur lors de la création du profil client")
    }

    const clientData = await clientResponse.json()
    console.log("[v0] Client created successfully:", clientData)

    // Store token in cookies
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
    }
  } catch (error: any) {
    console.error("[v0] Signup error:", error)
    return {
      success: false,
      message: error.message || "Une erreur est survenue lors de l'inscription",
    }
  }
}
