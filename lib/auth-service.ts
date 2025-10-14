import axios from "axios"
import Cookies from "js-cookie"

const API_BASE_URL = process.env.API_BASE_URL || "https://35.184.98.9:4000/api"

if (!API_BASE_URL) {
  throw new Error("API_BASE_URL environment variable is required")
}

const authAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // Réduit à 10 secondes pour une réponse plus rapide
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  // Accepter les certificats auto-signés en développement
  ...(process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0" && {
    httpsAgent:
      typeof window === "undefined"
        ? new (require("https").Agent)({
            rejectUnauthorized: false,
          })
        : undefined,
  }),
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
    TENANT_ID: string
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
  static async signIn(email: string, password: string, TENANT_ID: string, invitationToken = "") {
    try {
      console.log("[v0] Tentative de connexion:", {
        email,
        TENANT_ID,
        baseURL: authAxios.defaults.baseURL,
        endpoint: "/auth/sign-in",
        fullURL: `${authAxios.defaults.baseURL}/auth/sign-in`,
        isClient: typeof window !== "undefined",
        timeout: authAxios.defaults.timeout,
      })

      const response = await authAxios.post("/auth/sign-in", {
        email,
        password,
        TENANT_ID,
        invitationToken,
      })

      console.log("[v0] Réponse reçue:", {
        status: response.status,
        hasData: !!response.data,
      })

      const token = response.data
      if (token) {
        localStorage.setItem("token", token)
        Cookies.set("token", token)
        return { success: true, token }
      }

      throw new Error("Token non reçu")
    } catch (error: any) {
      console.error("[v0] Erreur de connexion détaillée:", {
        // Informations de base sur l'erreur
        errorName: error.name,
        errorCode: error.code,
        errorMessage: error.message,

        // Informations sur la réponse HTTP (si disponible)
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        responseHeaders: error.response?.headers,

        // Informations sur la requête
        requestURL: error.config?.url,
        requestBaseURL: error.config?.baseURL,
        requestMethod: error.config?.method,
        requestHeaders: error.config?.headers,

        // Informations réseau
        isNetworkError: !error.response && !error.request,
        hasRequest: !!error.request,
        hasResponse: !!error.response,

        // Erreur complète pour debug
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      })

      // Erreur réseau (pas de réponse du serveur)
      if (!error.response && error.request) {
        console.error("[v0] Erreur réseau - Le serveur n'a pas répondu:", {
          possibleCauses: [
            "Le serveur backend n'est pas démarré",
            "Problème CORS - Le navigateur bloque la requête",
            "Certificat SSL invalide",
            "Firewall ou réseau bloque la connexion",
            "L'adresse IP/port est incorrecte",
          ],
        })
        throw new Error(
          "Impossible de contacter le serveur. Vérifiez que le backend est accessible et que CORS est configuré correctement.",
        )
      }

      // Timeout
      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        throw new Error("Le serveur met trop de temps à répondre (timeout après 10s). Réessayez plus tard.")
      }

      // Connexion refusée
      if (error.code === "ECONNREFUSED") {
        throw new Error("Connexion refusée. Vérifiez que le serveur backend est démarré sur le bon port.")
      }

      // Erreurs HTTP spécifiques
      if (error.response?.status === 500) {
        throw new Error(
          error.response?.data?.message ||
            "Erreur serveur (500). Vérifiez les logs du backend ou contactez l'administrateur.",
        )
      }

      if (error.response?.status === 401) {
        throw new Error("Email ou mot de passe incorrect.")
      }

      if (error.response?.status === 400) {
        throw new Error(error.response?.data?.message || "Données invalides. Vérifiez vos informations.")
      }

      // Erreur générique
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Erreur de connexion inconnue. Consultez la console pour plus de détails.",
      )
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
