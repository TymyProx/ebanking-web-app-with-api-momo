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
}

interface GetReclamationsResponse {
  rows: Reclamation[]
  count: number
}

async function generateReclamationReference(): Promise<string> {
  try {
    // Récupérer le token
    const cookieToken = (await cookies()).get("token")?.value

    if (!cookieToken) {
      throw new Error("Token introuvable.")
    }

    // Récupérer toutes les réclamations existantes pour compter
    const reclamations = await getReclamations()
    const existingCount = reclamations?.rows?.length || 0

    const currentYear = new Date().getFullYear()
    const sequence = String(existingCount + 1).padStart(3, "0")

    return `REC-${currentYear}-${sequence}`
  } catch (error) {
    // En cas d'erreur, générer une référence basée sur le timestamp
    const currentYear = new Date().getFullYear()
    const timestamp = Date.now().toString().slice(-3)
    return `REC-${currentYear}-${timestamp}`
  }
}

export async function getReclamations(): Promise<GetReclamationsResponse> {
  try {
    const cookieToken = (await cookies()).get("token")?.value
    const usertoken = cookieToken

    if (!cookieToken) {
      console.log("[v0] Token d'authentification manquant, retour de données vides")
      return { rows: [], count: 0 }
    }

    // Récupérer l'ID de l'utilisateur connecté
    let currentUserId: string | null = null
    try {
      const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${usertoken}`,
        },
      })

      if (userResponse.ok) {
        const userData = await userResponse.json()
        currentUserId = userData.id
      }
    } catch (error) {
      console.error("[v0] Erreur lors de la récupération du user ID:", error)
    }

    // Envoi de la requête GET vers l'API backend
    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/reclamation`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usertoken}`,
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
    console.log("[v0] Erreur lors de la récupération, retour de données vides:", error.message)
    return { rows: [], count: 0 }
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
    // Récupération du token JWT stocké dans les cookies
    const cookieToken = (await cookies()).get("token")?.value
    const usertoken = cookieToken

    if (!cookieToken) {
      throw new Error("Token d'authentification introuvable.")
    }

    // Récupérer les informations de l'utilisateur connecté
    const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${usertoken}`,
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

    // Envoi de la requête POST vers l'API
    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/reclamation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usertoken}`,
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
    console.error("[v0] Erreur lors de la création de la réclamation:", error.message)
    throw new Error(error.message || "Une erreur s'est produite lors de la soumission")
  }
}

export async function submitComplain(data: any) {
  // TODO: Implémenter l'appel API pour soumettre une réclamation
  return {
    success: true,
    reference: `REC-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
  }
}

export async function getComplains() {
  // TODO: Implémenter l'appel API pour récupérer les réclamations
  return []
}

export async function getComplainById(id: string) {
  // TODO: Implémenter l'appel API pour récupérer une réclamation par ID
  return null
}
