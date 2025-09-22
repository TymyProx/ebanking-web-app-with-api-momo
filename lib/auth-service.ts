import axios from "axios"
import Cookies from "js-cookie"
import { API_ENDPOINTS } from "@/lib/api-config"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://192.168.1.200:8080/api"

// Configuration de l'instance axios pour l'authentification
const authAxios = axios.create({
  baseURL: API_ENDPOINTS.AUTH.SIGN_IN.replace("/auth/sign-in", ""),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds timeout
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
  fullName: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  emailVerified: boolean
  tenants: Array<{
    id: string
    userId: string
    roles: string[]
    status: string
    tenantId: string
    tenant: {
      id: string
      name: string
      url: string
      plan: string
      planStatus: string
    }
  }>
  avatars: Array<{
    id: string
    name: string
    publicUrl: string
    downloadUrl: string
  }>
}

export class AuthService {
  static async signIn(email: string, password: string, tenantId: string, invitationToken = "") {
    try {
      const response = await authAxios.post(API_ENDPOINTS.AUTH.SIGN_IN, {
        email,
        password,
        tenantId,
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
      throw new Error(error.response?.data?.message || "Erreur de connexion")
    }
  }

  static async fetchMe(): Promise<User> {
    try {
      const response = await authAxios.get(API_ENDPOINTS.AUTH.FETCH_ME)
      const userData = response.data

      localStorage.setItem("user", JSON.stringify(userData))
      console.log("Informations utilisateur récupérées et stockées:", userData)
      return userData
    } catch (error: any) {
      console.error("Erreur lors de la récupération des informations utilisateur:", error)
      throw new Error(error.response?.data?.message || "Impossible de récupérer les informations utilisateur")
    }
  }

  // Méthode pour se déconnecter
  static async signOut() {
    try {
      // Optionnel: appeler l'API de déconnexion si elle existe
      // await authAxios.post('/auth/sign-out')

      localStorage.removeItem("token")
      localStorage.removeItem("user")

      return { success: true }
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
      // Même en cas d'erreur, on nettoie le localStorage
      localStorage.removeItem("token")
      localStorage.removeItem("user")
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
}

export default AuthService
