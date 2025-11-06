"use server"

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
import { cookies } from "next/headers"

const normalize = (u?: string) => (u ? u.replace(/\/$/, "") : "")
const API_BASE_URL = `${normalize(process.env.NEXT_PUBLIC_API_URL || "https://35.184.98.9:4000")}/api`
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "aa1287f6-06af-45b7-a905-8c57363565c2"

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

    // Générer un claimId unique
    const claimId = `REC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

    // Préparer les données pour l'API
    const reclamationData: ReclamationData = {
      claimId: claimId,
      description: formData.description,
      dateRecl: new Date(formData.complainDate).toISOString(),
      status: "En cours",
      email: formData.email,
      motifRecl: formData.complainObject || formData.complainType, // Use complainObject if available, otherwise use complainType
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
      reference: claimId,
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
