"use server"

import { cookies } from "next/headers"
import { createHmac, randomBytes, randomInt } from "crypto"
import { getCookieConfig } from "@/lib/cookie-config"
import { config } from "@/lib/config"
import { Resend } from "resend"
import { VerificationEmail } from "@/emails/verification-email"
import { OtpEmail } from "@/emails/otp-email"
import { getApiBaseUrl, TENANT_ID } from "@/lib/api-url"
import {
  SIGNUP_STEP_TTL_MS,
  SIGNUP_STEP_TTL_MINUTES,
  SIGNUP_PENDING_COOKIE_MAX_AGE_SEC,
} from "@/lib/signup-flow"

const API_BASE_URL = getApiBaseUrl()
const APP_URL = config.EBANKING_URL || "http://localhost:3000"

// Fonction fetch avec gestion des erreurs SSL
async function safeFetch(url: string, options: RequestInit = {}): Promise<Response> {
  try {
    return await fetch(url, options)
  } catch (error: any) {
    // Si erreur SSL et URL HTTPS, essayer avec HTTP
    if ((error?.code === "ERR_SSL_WRONG_VERSION_NUMBER" || error?.message?.includes("SSL")) && url.startsWith("https://")) {
      console.warn(`[safeFetch] Erreur SSL, tentative avec HTTP: ${url}`)
      const httpUrl = url.replace("https://", "http://")
      return await fetch(httpUrl, options)
    }
    throw error
  }
}

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
  /** Nouveau ou client existant : OTP envoyé, saisie requise avant le lien e-mail */
  requiresOtp?: boolean
  /** E-mail en clair (parcours existant : nécessaire pour la redirection après OTP) */
  email?: string
  maskedEmail?: string
}

const SIGNUP_OTP_MAX_ATTEMPTS = 3

function getSignupOtpSecret(): string {
  return (
    process.env.SIGNUP_OTP_SECRET ||
    process.env.AUTH_SECRET ||
    "dev-insecure-signup-otp-change-in-production"
  )
}

function normalizeOtpInput(raw: string): string {
  return String(raw || "").replace(/\D/g, "").slice(0, 8)
}

function hashSignupOtp(code: string): string {
  return createHmac("sha256", getSignupOtpSecret()).update(normalizeOtpInput(code)).digest("hex")
}

function generateSignupOtpDigits(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0")
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

export async function initiateSignup(data: InitialSignupData): Promise<SignupResult> {
  try {
    console.log("[v0] Starting initial signup process for NEW client (OTP first)...")

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

    const emailNorm = String(data.email).trim().toLowerCase()
    const otpPlain = generateSignupOtpDigits()
    const otpHash = hashSignupOtp(otpPlain)
    const expiresAt = Date.now() + SIGNUP_STEP_TTL_MS

    const cookieStore = await cookies()
    const cookieConfig = getCookieConfig()
    cookieStore.set(
      "pending_signup_data",
      JSON.stringify({
        fullName: data.fullName.trim(),
        email: emailNorm,
        phone: data.phone.trim(),
        address: data.address.trim(),
        clientType: "new",
        signupOtpHash: otpHash,
        signupOtpExpiresAt: expiresAt,
        signupOtpAttempts: 0,
      }),
      {
        ...cookieConfig,
        maxAge: SIGNUP_PENDING_COOKIE_MAX_AGE_SEC,
      },
    )

    const resend = new Resend(process.env.RESEND_API_KEY)
    const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "no-reply@bngebanking.com"

    const { data: resendData, error: resendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: emailNorm,
      subject: "Code de vérification — inscription BNG CONNECT",
      react: OtpEmail({
        otpCode: otpPlain,
        userName: data.fullName.trim() || emailNorm.split("@")[0],
        purpose: "votre inscription",
        validityMinutes: SIGNUP_STEP_TTL_MINUTES,
      }),
    })

    if (resendError) {
      console.error("[v0] Resend OTP error:", resendError)
      throw new Error(resendError.message || "Erreur lors de l'envoi du code par e-mail")
    }
    console.log("[v0] Signup OTP email sent:", resendData)

    return {
      success: true,
      requiresOtp: true,
      message: "Un code de vérification a été envoyé à votre adresse e-mail.",
    }
  } catch (error: any) {
    console.error("[v0] Initial signup error:", error)
    return {
      success: false,
      message: error.message || "Une erreur est survenue lors de l'inscription",
    }
  }
}

/** Après OTP valide : enregistre le token de lien et envoie l’e-mail de vérification. */
export async function verifyNewClientSignupOtp(otp: string): Promise<SignupResult> {
  try {
    const normalized = normalizeOtpInput(otp)
    if (normalized.length !== 6) {
      return { success: false, message: "Le code doit comporter 6 chiffres." }
    }

    const cookieStore = await cookies()
    const raw = cookieStore.get("pending_signup_data")?.value
    if (!raw) {
      return { success: false, message: "Session d’inscription expirée. Veuillez recommencer." }
    }

    let pending: Record<string, unknown>
    try {
      pending = JSON.parse(raw)
    } catch {
      return { success: false, message: "Données d’inscription invalides. Veuillez recommencer." }
    }

    const flowType = String(pending.clientType || "")
    if (flowType !== "new" && flowType !== "existing") {
      return { success: false, message: "Cette étape ne concerne pas votre parcours." }
    }

    if (pending.verificationToken) {
      return {
        success: false,
        message: "Un lien a déjà été envoyé. Consultez votre boîte e-mail ou recommencez l’inscription.",
      }
    }

    const expiresAt = Number(pending.signupOtpExpiresAt || 0)
    if (!expiresAt || Date.now() > expiresAt) {
      return { success: false, message: "Le code a expiré. Demandez un nouveau code." }
    }

    let attempts = Number(pending.signupOtpAttempts || 0)
    if (attempts >= SIGNUP_OTP_MAX_ATTEMPTS) {
      return { success: false, message: "Trop de tentatives incorrectes. Recommencez l’inscription." }
    }

    const expectedHash = String(pending.signupOtpHash || "")
    if (!expectedHash || hashSignupOtp(normalized) !== expectedHash) {
      attempts += 1
      const cookieConfig = getCookieConfig()
      cookieStore.set(
        "pending_signup_data",
        JSON.stringify({
          ...pending,
          signupOtpAttempts: attempts,
        }),
        { ...cookieConfig, maxAge: SIGNUP_PENDING_COOKIE_MAX_AGE_SEC },
      )
      const left = SIGNUP_OTP_MAX_ATTEMPTS - attempts
      return {
        success: false,
        message:
          left > 0
            ? `Code incorrect. Il vous reste ${left} tentative${left > 1 ? "s" : ""}.`
            : "Trop de tentatives incorrectes. Recommencez l’inscription.",
      }
    }

    const verificationToken = randomBytes(32).toString("hex")
    const email = String(pending.email || "").toLowerCase()
    const fullName = String(pending.fullName || "")

    const nextPayload: Record<string, unknown> = {
      fullName: pending.fullName,
      email: pending.email,
      phone: pending.phone,
      address: pending.address,
      clientType: flowType === "existing" ? "existing" : "new",
      verificationToken,
      verificationTokenExpiresAt: Date.now() + SIGNUP_STEP_TTL_MS,
    }
    if (flowType === "existing" && pending.numClient != null) {
      nextPayload.numClient = pending.numClient
    }

    const cookieConfig = getCookieConfig()
    cookieStore.set("pending_signup_data", JSON.stringify(nextPayload), {
      ...cookieConfig,
      maxAge: SIGNUP_PENDING_COOKIE_MAX_AGE_SEC,
    })

    const resend = new Resend(process.env.RESEND_API_KEY)
    const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "no-reply@bngebanking.com"
    const verificationUrl = `${APP_URL.replace(/\/$/, "")}/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`

    const verifySubject =
      flowType === "existing"
        ? "Activez votre accès en ligne - BNG CONNECT"
        : "Vérifiez votre adresse email - BNG CONNECT"

    const { error: resendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: verifySubject,
      react: VerificationEmail({
        userName: fullName || email.split("@")[0],
        verificationLink: verificationUrl,
        linkValidityMinutes: SIGNUP_STEP_TTL_MINUTES,
      }),
    })

    if (resendError) {
      console.error("[v0] Resend verification error:", resendError)
      throw new Error(resendError.message || "Erreur lors de l’envoi du lien de vérification")
    }

    return {
      success: true,
      message: "E-mail de vérification envoyé. Ouvrez le lien pour définir votre mot de passe.",
    }
  } catch (error: any) {
    console.error("[v0] verifyNewClientSignupOtp:", error)
    return {
      success: false,
      message: error.message || "Une erreur est survenue",
    }
  }
}

/** Nouveau code OTP (même inscription, avant envoi du lien). */
export async function resendNewClientSignupOtp(): Promise<SignupResult> {
  try {
    const cookieStore = await cookies()
    const raw = cookieStore.get("pending_signup_data")?.value
    if (!raw) {
      return { success: false, message: "Aucune inscription en cours. Recommencez depuis le formulaire." }
    }

    let pending: Record<string, unknown>
    try {
      pending = JSON.parse(raw)
    } catch {
      return { success: false, message: "Données invalides. Recommencez l’inscription." }
    }

    const flowType = String(pending.clientType || "")
    if (flowType !== "new" && flowType !== "existing") {
      return { success: false, message: "Renvoi de code non disponible pour ce parcours." }
    }

    if (pending.verificationToken) {
      return { success: false, message: "Le lien a déjà été envoyé. Consultez vos e-mails." }
    }

    const email = String(pending.email || "").trim().toLowerCase()
    if (!email) {
      return { success: false, message: "E-mail manquant. Recommencez l’inscription." }
    }

    const otpPlain = generateSignupOtpDigits()
    const otpHash = hashSignupOtp(otpPlain)
    const expiresAt = Date.now() + SIGNUP_STEP_TTL_MS

    const cookieConfig = getCookieConfig()
    cookieStore.set(
      "pending_signup_data",
      JSON.stringify({
        ...pending,
        signupOtpHash: otpHash,
        signupOtpExpiresAt: expiresAt,
        signupOtpAttempts: 0,
      }),
      { ...cookieConfig, maxAge: SIGNUP_PENDING_COOKIE_MAX_AGE_SEC },
    )

    const resend = new Resend(process.env.RESEND_API_KEY)
    const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "no-reply@bngebanking.com"
    const fullName = String(pending.fullName || "")

    const otpSubject =
      flowType === "existing"
        ? "Nouveau code — activation accès BNG CONNECT"
        : "Nouveau code — inscription BNG CONNECT"

    const { error: resendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: otpSubject,
      react: OtpEmail({
        otpCode: otpPlain,
        userName: fullName || email.split("@")[0],
        purpose: flowType === "existing" ? "l’activation de votre accès en ligne" : "votre inscription",
        validityMinutes: SIGNUP_STEP_TTL_MINUTES,
      }),
    })

    if (resendError) {
      throw new Error(resendError.message || "Erreur lors de l’envoi du code")
    }

    return { success: true, message: "Un nouveau code a été envoyé." }
  } catch (error: any) {
    console.error("[v0] resendNewClientSignupOtp:", error)
    return { success: false, message: error.message || "Erreur lors du renvoi du code" }
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

    const loginResponse = await safeFetch(`${API_BASE_URL}/auth/sign-in`, {
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

    const bdClientResponse = await safeFetch(searchUrl, {
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

    // Step 3: Vérifier dans compteBng si cette racine a des comptes
    console.log("[v0] Step 3: Checking for accounts in CompteBng...")
    
    const COMPTE_BNG_ENDPOINT = `${API_BASE_URL}/tenant/${TENANT_ID}/compte-bng`
    const compteBngUrl = `${COMPTE_BNG_ENDPOINT}?filter=clientId||$eq||${encodeURIComponent(numClient)}`
    
    const compteBngResponse = await safeFetch(compteBngUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supportToken}`,
      },
    })

    let comptesBng: any[] = []
    if (compteBngResponse.ok) {
      const compteBngData = await compteBngResponse.json()
      
      if (Array.isArray(compteBngData)) {
        comptesBng = compteBngData
      } else if (compteBngData.data && Array.isArray(compteBngData.data)) {
        comptesBng = compteBngData.data
      } else if (compteBngData.rows && Array.isArray(compteBngData.rows)) {
        comptesBng = compteBngData.rows
      }
      
      // Filtrer pour s'assurer que clientId correspond exactement
      comptesBng = comptesBng.filter((c: any) => String(c.clientId || "").trim() === String(numClient).trim())
      
      console.log(`[v0] Found ${comptesBng.length} compte(s) in CompteBng for client ${numClient}`)
    } else if (compteBngResponse.status !== 404) {
      console.warn("[v0] Error fetching CompteBng:", compteBngResponse.status)
    }

    // Step 4: Vérifier dans la table client si le client existe déjà (seulement après avoir vérifié bdClientBng et compteBng)
    console.log("[v0] Step 4: Checking if client already exists in client table...")
    console.log("[v0] Searching for codeClient:", numClient)
    
    const existingClientUrl = `${API_BASE_URL}/tenant/${TENANT_ID}/client?filter=codeClient||$eq||${encodeURIComponent(numClient)}`
    console.log("[v0] Client search URL:", existingClientUrl)
    
    const existingClientResponse = await safeFetch(existingClientUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supportToken}`,
      },
    })

    console.log("[v0] Client search response status:", existingClientResponse.status)

    // Vérifier seulement si la réponse est OK (200)
    if (existingClientResponse.ok && existingClientResponse.status === 200) {
      const responseText = await existingClientResponse.text()
      console.log("[v0] Client search response text (first 500 chars):", responseText.substring(0, 500))
      
      // Si la réponse est vide ou null, pas de client existant
      if (!responseText || responseText.trim() === "" || responseText.trim() === "null") {
        console.log("[v0] Empty response, no existing client found")
      } else {
        try {
          const existingClientData = JSON.parse(responseText)
          console.log("[v0] Client search response parsed:", JSON.stringify(existingClientData).substring(0, 500))

          let existingClients: any[] = []
          if (Array.isArray(existingClientData)) {
            existingClients = existingClientData
          } else if (existingClientData.data && Array.isArray(existingClientData.data)) {
            existingClients = existingClientData.data
          } else if (existingClientData.rows && Array.isArray(existingClientData.rows)) {
            existingClients = existingClientData.rows
          } else if (existingClientData.count !== undefined) {
            // Si la réponse contient un count, vérifier s'il est > 0
            const count = Number(existingClientData.count) || 0
            console.log("[v0] Response contains count:", count)
            if (count > 0 && existingClientData.rows && Array.isArray(existingClientData.rows)) {
              existingClients = existingClientData.rows
            }
          }

          console.log("[v0] Found existing clients count:", existingClients.length)
          
          // Vérifier que le codeClient correspond exactement - SEULEMENT si on trouve un match exact
          const exactMatch = existingClients.find((c: any) => {
            const clientCode = String(c.codeClient || "").trim()
            const searchCode = String(numClient).trim()
            const match = clientCode === searchCode
            if (match) {
              console.log("[v0] ✅ Exact match found:", { clientCode, searchCode, clientId: c.id })
            }
            return match
          })
          
          if (exactMatch) {
            console.log("[v0] ❌ Client with codeClient", numClient, "already exists in client table - blocking signup")
            return {
              success: false,
              message: "Le client a déjà un compte. Veuillez vous connecter.",
            }
          } else {
            if (existingClients.length > 0) {
              console.log("[v0] ⚠️ Some clients found but NO exact match for codeClient", numClient)
              console.log("[v0] Found clients have codeClient:", existingClients.map((c: any) => c.codeClient))
            } else {
              console.log("[v0] ✅ No existing clients found for codeClient", numClient, "- continuing with signup...")
            }
          }
        } catch (parseError) {
          console.error("[v0] Error parsing client search response:", parseError)
          console.log("[v0] Response text was:", responseText)
        }
      }
    } else {
      console.log("[v0] Client search returned non-ok status or empty, assuming no existing client")
    }

    // Check if email already has an account
    console.log("[v0] Step 5: Checking if email already exists...")

    const existingUsersUrl = `${API_BASE_URL}/tenant/${TENANT_ID}/users?filter=email||$eq||${encodeURIComponent(clientEmail)}`

    const existingUsersResponse = await safeFetch(existingUsersUrl, {
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

    // ============================================================
    // OTP puis lien (même logique que le nouveau client)
    // ============================================================
    const emailNorm = String(clientEmail).trim().toLowerCase()
    const otpPlain = generateSignupOtpDigits()
    const otpHash = hashSignupOtp(otpPlain)
    const expiresAt = Date.now() + SIGNUP_STEP_TTL_MS

    const cookieStore = await cookies()
    const cookieConfig = getCookieConfig()
    cookieStore.set(
      "pending_signup_data",
      JSON.stringify({
        email: emailNorm,
        fullName: clientFullName,
        phone: clientPhone,
        address: bdClientData.adresse || bdClientData.address || "",
        numClient: numClient,
        clientType: "existing",
        signupOtpHash: otpHash,
        signupOtpExpiresAt: expiresAt,
        signupOtpAttempts: 0,
      }),
      {
        ...cookieConfig,
        maxAge: SIGNUP_PENDING_COOKIE_MAX_AGE_SEC,
      },
    )

    console.log("[v0] Step 6: Sending OTP email (existing client)...")

    const resend = new Resend(process.env.RESEND_API_KEY)
    const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "no-reply@bngebanking.com"

    const { data: resendData, error: resendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: emailNorm,
      subject: "Code de vérification — activation accès BNG CONNECT",
      react: OtpEmail({
        otpCode: otpPlain,
        userName: clientFullName || emailNorm.split("@")[0],
        purpose: "l’activation de votre accès en ligne",
        validityMinutes: SIGNUP_STEP_TTL_MINUTES,
      }),
    })

    if (resendError) {
      console.error("[v0] Resend OTP error (existing client):", resendError)
      throw new Error(resendError.message || "Erreur lors de l'envoi du code par e-mail")
    }

    console.log("[v0] Existing client signup OTP sent:", resendData)

    return {
      success: true,
      requiresOtp: true,
      message: "Un code de vérification a été envoyé à votre adresse e-mail.",
      maskedEmail: maskEmail(clientEmail),
      email: emailNorm,
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
//         maxAge: SIGNUP_PENDING_COOKIE_MAX_AGE_SEC, // 24 hours
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
//       subject: "Vérifiez votre adresse email - BNG CONNECT",
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
