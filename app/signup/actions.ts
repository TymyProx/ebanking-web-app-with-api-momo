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

interface SignupExistingClientData {
  numClient: string
  email: string
  phone: string
  password: string
  fullName: string
  address: string
}

interface SignupResult {
  success: boolean
  message: string
  requiresVerification?: boolean
  email?: string
  maskedEmail?: string
}

function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@")
  if (!localPart || !domain) return email

  if (localPart.length <= 2) {
    return `${localPart[0]}*@${domain}`
  }

  const visibleChars = Math.min(2, Math.floor(localPart.length / 3))
  const maskedPart = "*".repeat(6)
  return `${localPart.substring(0, visibleChars)}${maskedPart}@${domain}`
}

export async function initiateSignup(data: InitialSignupData) {
  try {
    console.log("[v0] Starting initial signup process for NEW client...")

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

    // Generate verification token
    const verificationToken = randomBytes(32).toString("hex")

    // ============================================================
    // SAVE DATA IN COOKIE FOR LATER (Backend will create client)
    // ============================================================
    const cookieStore = await cookies()
    const cookieConfig = getCookieConfig()
    cookieStore.set(
      "pending_signup_data",
      JSON.stringify({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        verificationToken: verificationToken,
        clientType: "new",
      }),
      {
        ...cookieConfig,
        maxAge: 60 * 60 * 24, // 24 hours
      },
    )

    // ============================================================
    // SEND VERIFICATION EMAIL
    // ============================================================
    console.log("[v0] Sending verification email via Resend...")

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

export async function initiateExistingClientSignup(data: { clientCode: string }) {
  try {
    console.log("[v0] Starting existing client signup process...")
    console.log("[v0] Client code (numClient):", data.clientCode)

    if (!data.clientCode) {
      return { success: false, message: "Racine du compte requis" }
    }

    console.log("[v0] Step 1: Authenticating with support account...")

    const SUPPORT_EMAIL = "support@proxyma-technologies.net"
    const SUPPORT_PASSWORD = "123"

    const loginPayload = {
      email: SUPPORT_EMAIL,
      password: SUPPORT_PASSWORD,
      tenantId: String(TENANT_ID),
      invitationToken: "",
    }

    const loginResponse = await fetch(`${API_BASE_URL}/auth/sign-in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginPayload),
    })

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text()
      console.error("[v0] Failed to login with support account:", errorText)
      throw new Error("Erreur lors de l'authentification du système")
    }

    const loginResponseText = await loginResponse.text()
    const supportToken = loginResponseText.startsWith("eyJ") ? loginResponseText : JSON.parse(loginResponseText).token

    if (!supportToken) {
      throw new Error("Token système non reçu")
    }
    
    console.log("[v0] Step 2: Searching for client in BdClientBng...")

    const searchUrl = `${API_BASE_URL}/tenant/${TENANT_ID}/bd-client-bng?numClient=${encodeURIComponent(data.clientCode)}`

    const bdClientResponse = await fetch(searchUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supportToken}`,
      },
    })

    if (!bdClientResponse.ok) {
      if (bdClientResponse.status === 404) {
        return {
          success: false,
          message: "Racine du compte invalide. Veuillez vérifier votre racine et réessayer.",
        }
      }
      throw new Error("Erreur lors de la recherche du client dans la base BNG")
    }

    const bdClientResponseData = await bdClientResponse.json()

    let bdClientData
    let clientArray: any[] = []

    if (Array.isArray(bdClientResponseData)) {
      clientArray = bdClientResponseData
    } else if (bdClientResponseData.data && Array.isArray(bdClientResponseData.data)) {
      clientArray = bdClientResponseData.data
    } else if (bdClientResponseData.rows && Array.isArray(bdClientResponseData.rows)) {
      clientArray = bdClientResponseData.rows
    } else {
      bdClientData = bdClientResponseData
    }

    // Find the client with exact numClient match
    if (clientArray.length > 0) {
      bdClientData = clientArray.find((client) => client.numClient === data.clientCode)

      if (!bdClientData) {
        return {
          success: false,
          message: "Racine du compte invalide. Veuillez vérifier votre racine et réessayer.",
        }
      }
    }

    if (!bdClientData) {
      return {
        success: false,
        message: "Racine du compte invalide. Veuillez vérifier votre racine et réessayer.",
      }
    }

    const clientEmail = bdClientData.email
    const clientFullName = bdClientData.nomComplet || bdClientData.fullName || bdClientData.name || ""
    const clientPhone = bdClientData.numTelephone || bdClientData.telephone || bdClientData.phone || ""
    const numClient = bdClientData.numClient || data.clientCode

    if (!clientEmail) {
      throw new Error("Email du client non trouvé dans la base BNG")
    }

    console.log("[v0] Client found in BdClientBng:", clientFullName, clientEmail)

    // Check if email already has an account
    console.log("[v0] Step 3: Checking if email already exists...")

    const existingUsersUrl = `${API_BASE_URL}/tenant/${TENANT_ID}/users?filter=email||$eq||${encodeURIComponent(clientEmail)}`

    const existingUsersResponse = await fetch(existingUsersUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supportToken}`,
      },
    })

    if (existingUsersResponse.ok) {
      const existingUsersData = await existingUsersResponse.json()

      let existingUsers: any[] = []
      if (Array.isArray(existingUsersData)) {
        existingUsers = existingUsersData
      } else if (existingUsersData.data && Array.isArray(existingUsersData.data)) {
        existingUsers = existingUsersData.data
      } else if (existingUsersData.rows && Array.isArray(existingUsersData.rows)) {
        existingUsers = existingUsersData.rows
      }

      if (existingUsers.length > 0) {
        console.log("[v0] User with this email already exists")
        return {
          success: false,
          message: "Ce compte est déjà inscrit. Veuillez vous connecter avec vos identifiants.",
        }
      }
    }

    const verificationToken = randomBytes(32).toString("hex")

    // ============================================================
    // SAVE DATA IN COOKIE (Backend will create client later)
    // ============================================================
    const cookieStore = await cookies()
    const cookieConfig = getCookieConfig()
    cookieStore.set(
      "pending_signup_data",
      JSON.stringify({
        email: clientEmail,
        fullName: clientFullName,
        phone: clientPhone,
        address: bdClientData.adresse || bdClientData.address || "",
        numClient: numClient,
        verificationToken: verificationToken,
        clientType: "existing",
      }),
      {
        ...cookieConfig,
        maxAge: 60 * 60 * 24, // 24 hours
      },
    )

    // ============================================================
    // SEND VERIFICATION EMAIL
    // ============================================================
    console.log("[v0] Step 4: Sending verification email...")

    const resend = new Resend(process.env.RESEND_API_KEY)
    const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "no-reply@bngebanking.com"
    const verificationUrl = `${APP_URL.replace(/\/$/, "")}/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(
      clientEmail,
    )}`

    const { data: resendData, error: resendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: clientEmail,
      subject: "Activez votre accès en ligne - BNG E-Banking",
      react: VerificationEmail({
        userName: clientFullName || clientEmail.split("@")[0],
        verificationLink: verificationUrl,
      }),
    })

    if (resendError) {
      console.error("[v0] Resend error:", resendError)
      throw new Error("Erreur lors de l'envoi de l'email de vérification")
    }

    console.log("[v0] Verification email sent successfully:", resendData)

    return {
      success: true,
      message: "Email de vérification envoyé",
      maskedEmail: maskEmail(clientEmail),
    }
  } catch (error: any) {
    console.error("[v0] Existing client signup error:", error)

    return {
      success: false,
      message: error.message || "Une erreur est survenue",
    }
  }
}

// export async function signupExistingClient(data: SignupExistingClientData): Promise<SignupResult> {
//   try {
//     if (!data.numClient) {
//       return { success: false, message: "Numéro client requis" }
//     }
//     if (!data.email) {
//       return { success: false, message: "Email requis" }
//     }
//     if (!data.password) {
//       return { success: false, message: "Mot de passe requis" }
//     }
//     if (!data.fullName) {
//       return { success: false, message: "Nom complet requis" }
//     }
//     if (!data.phone) {
//       return { success: false, message: "Téléphone requis" }
//     }
//     if (!data.address) {
//       return { success: false, message: "Adresse requise" }
//     }

//     // Split full name into first and last name
//     const nameParts = data.fullName.trim().split(" ")
//     const firstName = nameParts[0] || ""
//     const lastName = nameParts.slice(1).join(" ") || nameParts[0] || ""

//     console.log("[v0] Step 1: Creating auth account via /auth/sign-up...")

//     const signupPayload = {
//       email: String(data.email),
//       password: String(data.password),
//       tenantId: String(TENANT_ID),
//     }

//     console.log("[v0] Signup payload:", JSON.stringify({ ...signupPayload, password: "***" }))

//     const signupResponse = await fetch(`${API_BASE_URL}/auth/sign-up`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(signupPayload),
//     })

//     console.log("[v0] Signup response status:", signupResponse.status)
//     const signupResponseText = await signupResponse.text()
//     console.log("[v0] Signup response body:", signupResponseText.substring(0, 200) + "...")

//     if (!signupResponse.ok) {
//       let errorData: any = {}
//       try {
//         errorData = JSON.parse(signupResponseText)
//       } catch (e) {
//         errorData = { message: signupResponseText || `HTTP ${signupResponse.status}` }
//       }
//       console.error("[v0] Signup failed:", errorData)

//       if (errorData.message?.includes("Email is already in use") || errorData.message?.includes("already exists")) {
//         return {
//           success: false,
//           message: "Ce compte existe déjà. Veuillez vous connecter avec vos identifiants.",
//         }
//       }

//       throw new Error(errorData.message || "Erreur lors de la création du compte")
//     }

//     let token: string
//     if (signupResponseText.startsWith("eyJ")) {
//       token = signupResponseText
//       console.log("[v0] Received JWT token directly")
//     } else {
//       const signupData = JSON.parse(signupResponseText)
//       token = signupData.token || signupData.data?.token || signupData
//       console.log("[v0] Extracted token from JSON response")
//     }

//     if (!token) {
//       console.error("[v0] No token received from server")
//       return { success: false, message: "Aucun token reçu du serveur" }
//     }

//     console.log("[v0] Auth account created successfully")

//     const verificationToken = randomBytes(32).toString("hex")

//     const cookieStore = await cookies()
//     const cookieConfig = getCookieConfig()
//     cookieStore.set(
//       "pending_signup_data",
//       JSON.stringify({
//         fullName: data.fullName,
//         email: data.email,
//         phone: data.phone,
//         address: data.address,
//         numClient: data.numClient, // Store numClient, not CLI- code
//         verificationToken: verificationToken,
//         clientType: "existing", // Mark as existing BNG client
//       }),
//       {
//         ...cookieConfig,
//         maxAge: 60 * 60 * 24, // 24 hours
//       },
//     )

//     console.log("[v0] Sending verification email via Resend...")

//     const resend = new Resend(process.env.RESEND_API_KEY)
//     const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "no-reply@bngebanking.com"
//     const verificationUrl = `${APP_URL.replace(/\/$/, "")}/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(
//       data.email,
//     )}`

//     const { data: resendData, error: resendError } = await resend.emails.send({
//       from: FROM_EMAIL,
//       to: data.email,
//       subject: "Vérifiez votre adresse email - BNG E-Banking",
//       react: VerificationEmail({
//         userName: data.fullName || data.email.split("@")[0],
//         verificationLink: verificationUrl,
//       }),
//     })

//     if (resendError) {
//       console.error("[v0] Resend error:", resendError)
//       throw new Error(resendError.message || "Erreur lors de l'envoi de l'email de vérification")
//     }
//     console.log("[v0] Email sent successfully:", resendData)

//     return {
//       success: true,
//       message: "Un email de vérification a été envoyé à votre adresse email.",
//       requiresVerification: true,
//       email: data.email,
//     }
//   } catch (error: any) {
//     console.error("[v0] Signup existing client error:", error)
//     return {
//       success: false,
//       message: error.message || "Une erreur est survenue lors de l'inscription",
//     }
//   }
// }
