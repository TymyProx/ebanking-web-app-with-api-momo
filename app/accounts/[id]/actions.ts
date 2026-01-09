"use server"
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import type { Account } from "../actions"
import { config } from "@/lib/config"

export async function getAccountDetails(accountId: string): Promise<Account | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      throw new Error("Non authentifié")
    }

    // Get user info to retrieve tenantId
    const { getApiBaseUrl } = await import("@/lib/api-url")
    const API_BASE_URL = getApiBaseUrl()
    const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!userResponse.ok) {
      throw new Error("Impossible de récupérer les informations utilisateur")
    }

    const userData = await userResponse.json()
    const tenantId = userData.tenants?.[0]?.tenantId || config.TENANT_ID

    if (!tenantId) {
      throw new Error("Tenant ID non trouvé")
    }

    const response = await fetch(`${API_BASE_URL}/tenant/${tenantId}/compte/${accountId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Impossible de récupérer les détails du compte")
    }

    const accountData = await response.json()

    return accountData as Account
  } catch (error) {
    console.error("Erreur lors de la récupération des détails du compte:", error)
    return null
  }
}

export async function toggleAccountStatus(accountId: string, newStatus: string) {
  // Simulation d'un appel API
  await new Promise((resolve) => setTimeout(resolve, 500))

  try {
    const statusMessages = {
      ACTIF: "activé",
      BLOCKED: "bloqué",
      SUSPENDED: "suspendu",
      CLOSED: "fermé",
      PENDING: "mis en attente",
    }

    const message = `Le statut de votre compte ${accountId} a été modifié vers "${statusMessages[newStatus as keyof typeof statusMessages] || newStatus.toLowerCase()}".`

    revalidatePath(`/accounts/${accountId}`)

    return {
      success: true,
      message: `Statut du compte mis à jour: ${newStatus}`,
      notification: {
        type: "account_status",
        title: "Changement de statut de compte",
        message,
      },
    }
  } catch (error) {
    console.error("Erreur lors de la création de la notification:", error)
    return {
      success: false,
      message: "Erreur lors de la mise à jour du statut",
    }
  }
}
