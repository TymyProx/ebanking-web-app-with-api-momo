import axios from "axios"
import { config } from "./config"

// Ensure no trailing slash and include /api once
const normalizeBase = (url: string) => url.replace(/\/api\/?$/, "").replace(/\/$/, "")

const tenantId = config.TENANT_ID
const isBrowser = typeof window !== "undefined"
const DEFAULT_API_BASE_URL = "https://astra-apps.net:4000/"
const resolvedApiBase = (() => {
  const cleaned = normalizeBase(config.API_BASE_URL || "")
  if (!cleaned) {
    return DEFAULT_API_BASE_URL
  }
  const lower = cleaned.toLowerCase()
  if (lower.startsWith("http://localhost:3000") || lower.startsWith("http://127.0.0.1:3000")) {
    return DEFAULT_API_BASE_URL
  }
  return cleaned
})()
const API_BASE_URL = `${resolvedApiBase}/api/tenant/${tenantId}/otp`

// Configuration de l'instance axios pour l'OTP
const otpAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Intercepteur pour ajouter le token aux requêtes
otpAxios.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (token) {
      config.headers = config.headers ?? {}
      config.headers["Authorization"] = `Bearer ${token}`
    } else {
      console.warn("⚠️ [OTP Service] Pas de token trouvé dans localStorage")
      console.log("User doit être connecté pour utiliser OTP")
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Intercepteur pour gérer les erreurs de réponse
otpAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expiré ou non authentifié
      console.error("❌ [OTP Service] Erreur d'authentification")
      if (typeof window !== "undefined") {
        const hasToken = localStorage.getItem("token")
        if (!hasToken) {
          console.error("❌ Pas de token - Utilisateur non connecté")
        } else {
          console.error("❌ Token invalide ou expiré")
          localStorage.removeItem("token")
          localStorage.removeItem("user")
        }
        // Rediriger vers login
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  },
)

const buildEndpoint = (suffix: string) => suffix

export interface OtpGenerateOptions {
  purpose: string
  referenceId?: string
  phoneNumber?: string
  email?: string
  deliveryMethod?: "SMS" | "EMAIL" | "BOTH"
  expiresInMinutes?: number
  maxAttempts?: number
  metadata?: any
}

export interface OtpVerifyOptions {
  code: string
  purpose: string
  referenceId?: string
}

export interface OtpGenerateResponse {
  success: boolean
  otpId: string
  expiresAt: string
}

export interface OtpVerifyResponse {
  success: boolean
  verified: boolean
  message?: string
}

export class OtpService {
  /**
   * Generate and send an OTP
   */
  static async generate(options: OtpGenerateOptions): Promise<OtpGenerateResponse> {
    try {
      const response = await otpAxios.post(buildEndpoint("/generate"), options)
      return response.data
    } catch (error: any) {
      console.error("Erreur lors de la génération de l'OTP:", error)
      let errorMessage = "Erreur lors de la génération de l'OTP"

      if (error.response?.data) {
        errorMessage =
          error.response.data.message ||
          error.response.data.error ||
          error.response.data.msg ||
          (typeof error.response.data === "string" ? error.response.data : null) ||
          errorMessage
      } else if (error.message) {
        errorMessage = error.message
      }

      throw new Error(errorMessage)
    }
  }

  /**
   * Verify an OTP code
   */
  static async verify(options: OtpVerifyOptions): Promise<OtpVerifyResponse> {
    try {
      const response = await otpAxios.post(buildEndpoint("/verify"), options)
      return response.data
    } catch (error: any) {
      console.error("Erreur lors de la vérification de l'OTP:", error)
      console.error("Response data:", error.response?.data)
      console.error("Response status:", error.response?.status)

      let errorMessage = "otp.invalid" // Default with backend format

      if (error.response?.data) {
        // Backend can send error in multiple formats
        if (typeof error.response.data === "string") {
          errorMessage = error.response.data
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message
        } else if (error.response.data.msg) {
          errorMessage = error.response.data.msg
        }
      } else if (error.message) {
        errorMessage = error.message
      }

      console.log("Final error message:", errorMessage)
      throw new Error(errorMessage)
    }
  }

  /**
   * Resend OTP
   */
  static async resend(purpose: string, referenceId?: string): Promise<OtpGenerateResponse> {
    try {
      const response = await otpAxios.post(buildEndpoint("/resend"), {
        purpose,
        referenceId,
      })
      return response.data
    } catch (error: any) {
      console.error("Erreur lors du renvoi de l'OTP:", error)
      let errorMessage = "Erreur lors du renvoi de l'OTP"

      if (error.response?.data) {
        errorMessage =
          error.response.data.message ||
          error.response.data.error ||
          error.response.data.msg ||
          (typeof error.response.data === "string" ? error.response.data : null) ||
          errorMessage
      } else if (error.message) {
        errorMessage = error.message
      }

      throw new Error(errorMessage)
    }
  }

  /**
   * Get OTP list (for admin purposes)
   */
  static async list(filters?: any): Promise<any> {
    try {
      if (isBrowser) {
        throw new Error("La récupération de la liste OTP n'est pas disponible côté client")
      }
      const response = await otpAxios.get('', { params: filters })
      return response.data
    } catch (error: any) {
      console.error("Erreur lors de la récupération des OTP:", error)
      let errorMessage = "Erreur lors de la récupération des OTP"

      if (error.response?.data) {
        errorMessage =
          error.response.data.message ||
          error.response.data.error ||
          error.response.data.msg ||
          (typeof error.response.data === "string" ? error.response.data : null) ||
          errorMessage
      } else if (error.message) {
        errorMessage = error.message
      }

      throw new Error(errorMessage)
    }
  }
}
