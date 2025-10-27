"use server"

import { cookies } from "next/headers"

interface SignupData {
  nomComplet: string
  email: string
  telephone: string
  adresse: string
  password: string
}

interface ClientResponse {
  data: {
    id: string
    codeClient: string
    nomComplet: string
    email: string
    telephone: string
    adresse: string
  }
}

interface SignupResponse {
  token: string
  user: {
    id: string
    email: string
    fullName: string
  }
}

export async function signupClient(data: SignupData) {
  try {
    const apiBaseUrl = process.env.API_BASE_URL
    const tenantId = process.env.TENANT_ID

    if (!apiBaseUrl || !tenantId) {
      throw new Error("Configuration manquante")
    }

    // Generate a unique client code
    const codeClient = `CLI-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`

    // Step 1: Create client record in the database
    const clientResponse = await fetch(`${apiBaseUrl}/tenant/${tenantId}/client`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          nomComplet: data.nomComplet,
          email: data.email,
          telephone: data.telephone,
          adresse: data.adresse,
          codeClient: codeClient,
        },
      }),
    })

    if (!clientResponse.ok) {
      const errorData = await clientResponse.json().catch(() => ({}))
      throw new Error(errorData.message || "Erreur lors de la création du client")
    }

    const clientData: ClientResponse = await clientResponse.json()
    console.log("[v0] Client created:", clientData)

    // Step 2: Create authentication account
    const signupResponse = await fetch(`${apiBaseUrl}/auth/sign-up`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        invitationToken: "", // Empty string if no invitation token
        tenantId: tenantId,
      }),
    })

    if (!signupResponse.ok) {
      const errorData = await signupResponse.json().catch(() => ({}))
      throw new Error(errorData.message || "Erreur lors de la création du compte")
    }

    const signupData: SignupResponse = await signupResponse.json()
    console.log("[v0] Auth account created:", signupData)

    // Store the token in cookies
    const cookieStore = await cookies()
    cookieStore.set("token", signupData.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return {
      success: true,
      message: "Inscription réussie",
      data: {
        client: clientData.data,
        user: signupData.user,
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
