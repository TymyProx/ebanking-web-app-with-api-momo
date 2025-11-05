"use server"

import { cookies } from "next/headers"
import { randomBytes } from "crypto"
import { getCookieConfig } from "@/lib/cookie-config"
import { config } from "@/lib/config"
import { Resend } from "resend"
import { VerificationEmail } from "@/emails/verification-email"

const normalize = (u?: string) => (u ? u.replace(/\/$/, "") : "")
const API_BASE_URL = `${normalize(config.API_BASE_URL)}/api`
const TENANT_ID = config.TENANT_ID
const APP_URL = config.EBANKING_URL || "http://localhost:3000"

interface SignupData {
  fullName: string
  email: string
  phone: string
  password: string
  address: string
}

interface InitialSignupData {
  fullName: string
  email: string
  phone: string
  address: string
}

interface ExistingClientSignupData {
  clientCode: string
}

export async function initiateSignup(data: InitialSignupData) {
  try {
    console.log("[v0] Starting initial signup process...")

    if (!data.email) {
      return { success: false, message: "Email requis" }
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

    // Generate verification token
    const verificationToken = randomBytes(32).toString("hex")

    // Store signup data with verification token
    const cookieStore = await cookies()
    const cookieConfig = getCookieConfig()
    cookieStore.set(
      "pending_signup_data",
      JSON.stringify({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        codeClient: codeClient,
        verificationToken: verificationToken,
      }),
      {
        ...cookieConfig,
        maxAge: 60 * 60 * 24, // 24 hours
      },
    )

    console.log("[v0] Sending verification email via Resend (server action)...")

    const resend = new Resend(process.env.RESEND_API_KEY)
    const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "no-reply@bngebanking.com"
    const verificationUrl = `${APP_URL.replace(/\/$/, "")}/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(
      data.email,
    )}`

    const { data: resendData, error: resendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: "Vérifiez votre adresse email - BNG E-Banking",
      react: VerificationEmail({
        userName: data.fullName || data.email.split("@")[0],
        verificationLink: verificationUrl,
      }),
    })

    if (resendError) {
      console.error("[v0] Resend error:", resendError)
      throw new Error(resendError.message || "Erreur lors de l'envoi de l'email de vérification")
    }
    console.log("[v0] Email sent successfully:", resendData)

    console.log("[v0] Verification email sent successfully via Resend")

    return {
      success: true,
      message: "Un email de vérification a été envoyé à votre adresse email.",
    }
  } catch (error: any) {
    console.error("[v0] Initial signup error:", error)
    return {
      success: false,
      message: error.message || "Une erreur est survenue lors de l'inscription",
    }
  }
}

export async function initiateExistingClientSignup(data: ExistingClientSignupData) {
  let tempUserId: string | null = null
  let tempToken: string | null = null

  try {
    console.log("[v0] Starting existing client signup process...")
    console.log("[v0] Client code:", data.clientCode)

    if (!data.clientCode) {
      return { success: false, message: "Code client requis" }
    }

    console.log("[v0] Step 1: Creating temporary user to obtain token...")

    const tempEmail = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}@temp.bngebanking.com`
    const tempPassword = randomBytes(32).toString("hex")

    const tempUserPayload = {
      email: tempEmail,
      password: tempPassword,
      tenantId: String(TENANT_ID),
    }

    const tempUserResponse = await fetch(`${API_BASE_URL}/auth/sign-up`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tempUserPayload),
    })

    console.log("[v0] Temp user creation response status:", tempUserResponse.status)

    if (!tempUserResponse.ok) {
      const errorText = await tempUserResponse.text()
      console.error("[v0] Failed to create temp user:", errorText)
      throw new Error("Erreur lors de la vérification du code client")
    }

    const tempUserResponseText = await tempUserResponse.text()

    // Extract token
    if (tempUserResponseText.startsWith("eyJ")) {
      tempToken = tempUserResponseText
    } else {
      const tempUserData = JSON.parse(tempUserResponseText)
      tempToken = tempUserData.token || tempUserData.data?.token || tempUserData
    }

    if (!tempToken) {
      throw new Error("Impossible d'obtenir le token d'authentification")
    }

    console.log("[v0] Temporary token obtained successfully")

    // Get temp user ID for cleanup if needed
    const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tempToken}`,
      },
    })

    if (meResponse.ok) {
      const meData = await meResponse.json()
      tempUserId = meData.id
      console.log("[v0] Temp user ID:", tempUserId)
    }

    console.log("[v0] Step 2: Searching for client with code:", data.clientCode)

    const clientResponse = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/client`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tempToken}`,
      },
    })

    console.log("[v0] Client API response status:", clientResponse.status)

    if (!clientResponse.ok) {
      const errorText = await clientResponse.text()
      console.error("[v0] Client API error:", errorText)

      if (tempUserId && tempToken) {
        console.log("[v0] Deleting temporary user...")
        await fetch(`${API_BASE_URL}/auth/user/${tempUserId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${tempToken}`,
          },
        }).catch((err) => console.error("[v0] Failed to delete temp user:", err))
      }

      throw new Error("Erreur lors de la recherche du client")
    }

    const clientData = await clientResponse.json()
    console.log("[v0] Client API response received")

    // Extract clients array from response
    let clients: any[] = []
    if (clientData.rows && Array.isArray(clientData.rows)) {
      clients = clientData.rows
    } else if (clientData.data && Array.isArray(clientData.data)) {
      clients = clientData.data
    } else if (Array.isArray(clientData)) {
      clients = clientData
    }

    console.log("[v0] Found", clients.length, "clients in database")

    const client = clients.find(
      (c) => c.codeClient === data.clientCode || c.code === data.clientCode || c.clientCode === data.clientCode,
    )

    if (!client) {
      console.error("[v0] Client not found with code:", data.clientCode)

      if (tempUserId && tempToken) {
        console.log("[v0] Deleting temporary user...")
        await fetch(`${API_BASE_URL}/auth/user/${tempUserId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${tempToken}`,
          },
        }).catch((err) => console.error("[v0] Failed to delete temp user:", err))
      }

      return {
        success: false,
        message: "Code client invalide. Veuillez vérifier votre code et réessayer.",
      }
    }

    console.log("[v0] Client found:", client.id, client.nomComplet || client.email)

    if (!client.email) {
      if (tempUserId && tempToken) {
        console.log("[v0] Deleting temporary user...")
        await fetch(`${API_BASE_URL}/auth/user/${tempUserId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${tempToken}`,
          },
        }).catch((err) => console.error("[v0] Failed to delete temp user:", err))
      }

      return {
        success: false,
        message: "Aucun email associé à ce code client. Veuillez contacter votre agence.",
      }
    }

    const clientEmail = client.email
    const clientId = client.id

    // Delete temporary user now that we have the client info
    if (tempUserId && tempToken) {
      console.log("[v0] Deleting temporary user...")
      await fetch(`${API_BASE_URL}/auth/user/${tempUserId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${tempToken}`,
        },
      }).catch((err) => console.error("[v0] Failed to delete temp user:", err))
    }

    // Generate verification token and send email
    const verificationToken = randomBytes(32).toString("hex")

    // Store signup data with verification token and mark as existing client
    const cookieStore = await cookies()
    const cookieConfig = getCookieConfig()
    cookieStore.set(
      "pending_signup_data",
      JSON.stringify({
        email: clientEmail,
        codeClient: data.clientCode,
        clientId: clientId,
        verificationToken: verificationToken,
        isExistingClient: true,
        fullName: client.nomComplet || clientEmail.split("@")[0],
      }),
      {
        ...cookieConfig,
        maxAge: 60 * 60 * 24, // 24 hours
      },
    )

    console.log("[v0] Sending verification email via Resend...")

    const resend = new Resend(process.env.RESEND_API_KEY)
    const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "no-reply@bngebanking.com"
    const verificationUrl = `${APP_URL.replace(/\/$/, "")}/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(
      clientEmail,
    )}`

    const { data: resendData, error: resendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: clientEmail,
      subject: "Activez votre compte en ligne - BNG E-Banking",
      react: VerificationEmail({
        userName: client.nomComplet || clientEmail.split("@")[0],
        verificationLink: verificationUrl,
      }),
    })

    if (resendError) {
      console.error("[v0] Resend error:", resendError)
      throw new Error(resendError.message || "Erreur lors de l'envoi de l'email de vérification")
    }

    console.log("[v0] Email sent successfully:", resendData)

    return {
      success: true,
      message: "Un email de vérification a été envoyé à l'adresse associée à votre compte.",
      email: clientEmail,
    }
  } catch (error: any) {
    console.error("[v0] Existing client signup error:", error)

    if (tempUserId && tempToken) {
      console.log("[v0] Cleaning up temporary user due to error...")
      await fetch(`${API_BASE_URL}/auth/user/${tempUserId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${tempToken}`,
        },
      }).catch((err) => console.error("[v0] Failed to delete temp user during cleanup:", err))
    }

    return {
      success: false,
      message: error.message || "Une erreur est survenue lors de l'inscription",
    }
  }
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

    // Step 2: Sending email verification via Resend is now handled in initiateSignup

    console.log("[v0] Signup process completed - awaiting email verification")

    return {
      success: true,
      message: "Inscription réussie ! Veuillez vérifier votre email pour activer votre compte.",
      requiresVerification: true,
      email: data.email,
    }
  } catch (error: any) {
    console.error("[v0] Signup error:", error)
    return {
      success: false,
      message: error.message || "Une erreur est survenue lors de l'inscription",
    }
  }
}
