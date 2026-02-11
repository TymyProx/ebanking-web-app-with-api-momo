"use server"
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

import { cookies } from "next/headers"
import { getApiBaseUrl, TENANT_ID } from "@/lib/api-url"

const API_BASE_URL = getApiBaseUrl()

interface ReclamationData {
  claimId: string
  description: string
  dateRecl: string
  status: string
  email: string
  motifRecl: string
  telephone: string
  clientId: string
}

interface Reclamation {
  id: string
  claimId: string
  description: string
  dateRecl: string
  status: string
  email: string
  motifRecl: string
  telephone: string
  clientId: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  createdById?: string
  updatedById?: string
  importHash?: string
  tenantId?: string
}

interface GetReclamationsResponse {
  rows: Reclamation[]
  count: number
}

/**
 * Récupère le client depuis la table client en filtrant sur userid
 */
export async function getClientByUserId(userId: string): Promise<{ email?: string; telephone?: string; phoneNumber?: string } | null> {
  try {
    const cookieToken = (await cookies()).get("token")?.value

    if (!cookieToken) {
      console.error("[Reclamation] Token introuvable pour récupérer le client")
      return null
    }

    // Récupérer le client depuis l'API en filtrant par userid
    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/client?filter[userid]=${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookieToken}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      console.error("[Reclamation] Erreur API lors de la récupération du client:", response.status)
      return null
    }

    const data = await response.json()
    
    // L'API peut retourner soit un objet avec rows, soit directement un tableau
    const clients = data.rows || data.data || (Array.isArray(data) ? data : [])
    
    if (clients.length > 0) {
      const client = clients[0]
      console.log("[Reclamation] Client trouvé par userid:", {
        id: client.id,
        email: client.email,
        telephone: client.telephone,
        phoneNumber: client.phoneNumber,
        phone: client.phone,
      })
      
      return {
        email: client.email || "",
        telephone: client.telephone || client.phoneNumber || client.phone || "",
        phoneNumber: client.telephone || client.phoneNumber || client.phone || "",
      }
    }

    console.warn("[Reclamation] Aucun client trouvé avec userid:", userId)
    return null
  } catch (error) {
    console.error("[Reclamation] Erreur lors de la récupération du client par userid:", error)
    return null
  }
}

async function generateReclamationReference(): Promise<string> {
  try {
    const cookieToken = (await cookies()).get("token")?.value

    if (!cookieToken) {
      throw new Error("Token introuvable.")
    }

    const reclamations = await getReclamations()
    const existingCount = reclamations?.rows?.length || 0

    const currentYear = new Date().getFullYear()
    const sequence = String(existingCount + 1).padStart(3, "0")

    return `REC-${currentYear}-${sequence}`
  } catch (error) {
    const currentYear = new Date().getFullYear()
    const timestamp = Date.now().toString().slice(-3)
    return `REC-${currentYear}-${timestamp}`
  }
}

export async function getReclamations(): Promise<GetReclamationsResponse> {
  try {
    const cookieToken = (await cookies()).get("token")?.value

    if (!cookieToken) {
      return { rows: [], count: 0 }
    }

    // Récupérer l'ID de l'utilisateur connecté
    let currentUserId: string | null = null
    try {
      const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookieToken}`,
        },
      })

      if (userResponse.ok) {
        const userData = await userResponse.json()
        currentUserId = userData.id
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du user ID:", error)
    }

    // GET /tenant/{tenantId}/reclamation
    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/reclamation`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookieToken}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Erreur lors de la récupération")
    }

    const data = await response.json()
    const responseData = data as GetReclamationsResponse

    // Filtrer les réclamations pour ne garder que celles de l'utilisateur connecté
    if (currentUserId && responseData.rows) {
      responseData.rows = responseData.rows.filter((reclamation) => reclamation.clientId === currentUserId)
      responseData.count = responseData.rows.length
    }

    return responseData
  } catch (error: any) {
    console.error("Erreur lors de la récupération des réclamations:", error.message)
    return { rows: [], count: 0 }
  }
}

export async function getReclamationById(id: string): Promise<Reclamation | null> {
  try {
    const cookieToken = (await cookies()).get("token")?.value

    if (!cookieToken) {
      throw new Error("Token introuvable.")
    }

    // GET /tenant/{tenantId}/reclamation/{id}
    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/reclamation/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookieToken}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Erreur lors de la récupération des détails")
    }

    const data = await response.json()
    return data as Reclamation
  } catch (error: any) {
    console.error("Erreur lors de la récupération des détails:", error.message)
    return null
  }
}

export async function createReclamation(formData: {
  complainType: string
  complainObject: string
  description: string
  complainDate: string
  phone: string
  email: string
}) {
  try {
    const cookieToken = (await cookies()).get("token")?.value

    if (!cookieToken) {
      throw new Error("Token d'authentification introuvable.")
    }

    // Récupérer les informations de l'utilisateur connecté
    const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${cookieToken}`,
      },
    })

    if (!userResponse.ok) {
      throw new Error("Impossible de récupérer les informations utilisateur")
    }

    const userData = await userResponse.json()
    const clientId = userData.id

    const reference = await generateReclamationReference()

    // Préparer les données pour l'API
    const reclamationData: ReclamationData = {
      claimId: reference,
      description: formData.description,
      dateRecl: new Date(formData.complainDate).toISOString(),
      status: "En cours",
      email: formData.email,
      motifRecl: formData.complainObject || formData.complainType,
      telephone: formData.phone,
      clientId: clientId,
    }

    // POST /tenant/{tenantId}/reclamation
    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/reclamation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookieToken}`,
      },
      body: JSON.stringify({
        data: reclamationData,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Erreur lors de la soumission de la réclamation")
    }

    const data = await response.json()

    return {
      success: true,
      reference: reference,
      data: data,
    }
  } catch (error: any) {
    console.error("Erreur lors de la création de la réclamation:", error.message)
    throw new Error(error.message || "Une erreur s'est produite lors de la soumission")
  }
}
