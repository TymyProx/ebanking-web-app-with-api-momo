"use server"
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
import { getApiBaseUrl, TENANT_ID } from "@/lib/api-url"
import { cookies } from "next/headers"

const API_BASE_URL = getApiBaseUrl()

/**
 * Vérifie l'existence d'un client avec email et codeClient
 * Utilise les identifiants support@proxyma-technologies.net / 123 pour l'authentification
 */
export async function verifyClientForPasswordReset(email: string, codeClient: string) {
  try {
    // Authentification avec les identifiants support
    const authResponse = await fetch(`${API_BASE_URL}/auth/sign-in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "support@proxyma-technologies.net",
        password: "123",
        tenantId: TENANT_ID,
      }),
    })

    if (!authResponse.ok) {
      return {
        success: false,
        error: "Erreur d'authentification pour la vérification",
      }
    }

    const authData = await authResponse.json()
    const token = authData.token

    // Rechercher le client avec email et codeClient
    // Le backend utilise filter[email] et filter[codeClient] séparément, ce qui fait un AND
    const clientUrl = `${API_BASE_URL}/tenant/${TENANT_ID}/client?filter[email]=${encodeURIComponent(email)}&filter[codeClient]=${encodeURIComponent(codeClient)}`

    const clientResponse = await fetch(clientUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!clientResponse.ok) {
      const errorText = await clientResponse.text().catch(() => "")
      console.error("[FORGOT_PASSWORD] Erreur API client:", clientResponse.status, errorText)
      return {
        success: false,
        error: "Erreur lors de la recherche du client",
      }
    }

    const clientData = await clientResponse.json()
    const clients = clientData.rows || clientData.content || clientData.data || []

    console.log("[FORGOT_PASSWORD] Clients trouvés:", clients.length, "pour email:", email, "codeClient:", codeClient)

    if (clients.length === 0) {
      return {
        success: false,
        error: "Aucun client trouvé avec ces informations.",
      }
    }

    // Vérifier que le client correspond bien aux deux critères
    const client = clients.find(
      (c: any) =>
        c.email?.toLowerCase() === email.toLowerCase() && c.codeClient === codeClient
    )

    if (!client) {
      return {
        success: false,
        error: "Aucun client trouvé avec ces informations.",
      }
    }

    // Récupérer le userId associé
    // Le userId peut être dans client.userid ou il faut chercher dans la table users
    let userId = client.userid

    if (!userId) {
      // Chercher l'utilisateur par email dans la table users
      const usersUrl = `${API_BASE_URL}/tenant/${TENANT_ID}/users?filter[email]=${encodeURIComponent(email)}`

      const usersResponse = await fetch(usersUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        const users = usersData.rows || usersData.content || usersData.data || []
        if (users.length > 0) {
          userId = users[0].id
        }
      }
    }

    if (!userId) {
      return {
        success: false,
        error: "Aucun utilisateur associé à ce client",
      }
    }

    return {
      success: true,
      userId,
      email: client.email,
    }
  } catch (error) {
    console.error("[FORGOT_PASSWORD] Erreur lors de la vérification:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    }
  }
}

/**
 * Envoie l'email de réinitialisation de mot de passe
 */
export async function sendPasswordResetEmail(email: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/send-password-reset-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        tenantId: TENANT_ID,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.error || "Erreur lors de l'envoi de l'email",
      }
    }

    return {
      success: true,
      message: "Un email de réinitialisation a été envoyé à votre adresse email.",
    }
  } catch (error) {
    console.error("[FORGOT_PASSWORD] Erreur lors de l'envoi de l'email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    }
  }
}

/**
 * Réinitialise le mot de passe avec le token
 */
export async function resetPassword(token: string, password: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/password-reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        password,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.error || "Erreur lors de la réinitialisation du mot de passe",
      }
    }

    return {
      success: true,
      message: "Votre mot de passe a été réinitialisé avec succès.",
    }
  } catch (error) {
    console.error("[RESET_PASSWORD] Erreur lors de la réinitialisation:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    }
  }
}
