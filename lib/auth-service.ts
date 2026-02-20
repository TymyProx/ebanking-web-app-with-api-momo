import axios from "axios"
import Cookies from "js-cookie"
import { getApiBaseUrl, TENANT_ID } from "./api-url"

const API_BASE_URL = getApiBaseUrl();

if (!API_BASE_URL) {
  throw new Error("API_BASE_URL environment variable is required")
}

// Configuration de l'instance axios pour l'authentification
const authAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Intercepteur pour ajouter le token aux requêtes
authAxios.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Intercepteur pour gérer les erreurs de réponse
authAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      if (typeof window !== "undefined") {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  },
)

export interface User {
  id: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  createdById: string
  updatedById: string
  fullName: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  emailVerified: boolean
  emailVerificationTokenExpiresAt: string
  provider: string
  providerId: string
  passwordResetTokenExpiresAt: string
  jwtTokenInvalidBefore: string
  importHash: string
  tenants: Array<{
    id: string
    createdAt: string
    updatedAt: string
    deletedAt: string | null
    createdById: string
    updatedById: string
    userId: string
    roles: string[]
    invitationToken: string
    status: string
    tenantId: string
    tenant: {
      id: string
      createdAt: string
      updatedAt: string
      deletedAt: string | null
      createdById: string
      updatedById: string
      name: string
      url: string
      plan: string
      planStatus: string
      planStripeCustomerId: string
      planUserId: string
      settings: Array<{
        id: string
        createdAt: string
        updatedAt: string
        deletedAt: string | null
        createdById: string
        updatedById: string
        theme: string
        backgroundImageUrl: string
        logoUrl: string
        backgroundImages: Array<{
          id: string
          createdAt: string
          updatedAt: string
          deletedAt: string | null
          createdById: string
          updatedById: string
          name: string
          sizeInBytes: number
          privateUrl: string
          publicUrl: string
          downloadUrl: string
        }>
        logos: Array<{
          id: string
          createdAt: string
          updatedAt: string
          deletedAt: string | null
          createdById: string
          updatedById: string
          name: string
          sizeInBytes: number
          privateUrl: string
          publicUrl: string
          downloadUrl: string
        }>
        tenantId: string
      }>
    }
  }>
  avatars: Array<{
    id: string
    createdAt: string
    updatedAt: string
    deletedAt: string | null
    createdById: string
    updatedById: string
    name: string
    sizeInBytes: number
    privateUrl: string
    publicUrl: string
    downloadUrl: string
  }>
}

export class AuthService {
  // Méthode pour se connecter
  static async signIn(email: string, password: string, TENANT_ID: string, invitationToken = "") {
    try {
      const response = await authAxios.post("/auth/sign-in", {
        email,
        password,
        TENANT_ID,
        invitationToken,
      })

      const token = response.data
      if (token) {
        localStorage.setItem("token", token)
        Cookies.set("token", token)
        return { success: true, token }
      }

      throw new Error("Token non reçu")
    } catch (error: any) {
      console.error("Erreur de connexion:", error)
      let errorMessage = "Erreur de connexion"

      if (error.response?.data) {
        // Try different possible error message formats from API
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

  // Méthode pour récupérer les informations utilisateur
  static async fetchMe(): Promise<User> {
    try {
      const response = await authAxios.get("/auth/me")
      const userData = response.data

      // Stocker les informations utilisateur
      localStorage.setItem("user", JSON.stringify(userData))
      //console.log("Informations utilisateur récupérées et stockées:", userData)
      return userData
    } catch (error: any) {
      console.error("Erreur lors de la récupération des informations utilisateur:", error)
      let errorMessage = "Impossible de récupérer les informations utilisateur"

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

  // Méthode pour se déconnecter
  static async signOut() {
    try {
      // Optionnel: appeler l'API de déconnexion si elle existe
      // await authAxios.post('/auth/sign-out')

      localStorage.removeItem("token")
      localStorage.removeItem("user")
      Cookies.remove("token")

      return { success: true }
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
      // Même en cas d'erreur, on nettoie le localStorage et les cookies
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      Cookies.remove("token")
      return { success: true }
    }
  }

  // Méthode pour vérifier si l'utilisateur est connecté
  static isAuthenticated(): boolean {
    if (typeof window === "undefined") return false
    return !!localStorage.getItem("token")
  }

  // Méthode pour récupérer l'utilisateur depuis le localStorage
  static getCurrentUser(): User | null {
    if (typeof window === "undefined") return null

    const userStr = localStorage.getItem("user")
    if (!userStr) return null

    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }

  // Méthode pour récupérer le token
  static getToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem("token")
  }

  static async sendPasswordResetEmail(email: string) {
    try {
      await authAxios.post("/auth/send-password-reset-email", {
        email,
        tenantId: TENANT_ID,
      })
      return { success: true }
    } catch (error: any) {
      console.error("Erreur sendPasswordResetEmail:", error)
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Erreur lors de l'envoi de l'email"
      throw new Error(msg)
    }
  }

  static async passwordReset(token: string, password: string) {
    try {
      await authAxios.put("/auth/password-reset", {
        token,
        password,
      })
      return { success: true }
    } catch (error: any) {
      console.error("Erreur passwordReset:", error)
      const data = error?.response?.data
      const msg =
        (typeof data === "string" ? data : data?.message || data?.error) ||
        error?.message ||
        "Erreur lors de la réinitialisation"
      const e: any = new Error(msg)
      e.status = error?.response?.status
      throw e
    }
  }

  static async changePassword(oldPassword: string, newPassword: string) {
    try {
      await authAxios.put("/auth/change-password", {
        oldPassword,
        newPassword,
      })
      return { success: true }
    } catch (error: any) {
      console.error("Erreur changePassword:", error)
      const data = error?.response?.data
      const msg =
        (typeof data === "string" ? data : data?.message || data?.error) ||
        error?.message ||
        "Erreur lors du changement de mot de passe"
      const e: any = new Error(msg)
      e.status = error?.response?.status
      throw e
    }
  }
}

export default AuthService
