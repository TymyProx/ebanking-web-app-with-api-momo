"use server"

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
import { cookies } from "next/headers"

const normalize = (u?: string) => (u ? u.replace(/\/$/, "") : "")
const API_BASE_URL = `${normalize(process.env.NEXT_PUBLIC_API_URL || "https://35.184.98.9:4000")}/api`
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "aa1287f6-06af-45b7-a905-8c57363565c2"

interface FundsProvisionData {
  reference: string
  compteAdebiter: string
  montant: number
  fullNameBenef: string
  numCni: string
  agence: string
  statut: string
  clientId: string
}

interface FundsProvision {
  id: string
  reference: string
  compteAdebiter: string
  montant: string
  fullNameBenef: string
  numCni: string
  agence: string
  statut: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  createdById?: string
  updatedById?: string
  importHash?: string
  tenantId?: string
}

interface GetFundsProvisionsResponse {
  success: boolean
  data: {
    rows: FundsProvision[]
    count: number
  }
}

async function generateFundsProvisionReference(): Promise<string> {
  try {
    const requests = await getFundsProvisionRequests()
    const existingCount = requests.data?.rows?.length || 0

    const currentYear = new Date().getFullYear()
    const sequence = String(existingCount + 1).padStart(3, "0")

    return `MDF-${currentYear}-${sequence}`
  } catch (error) {
    const currentYear = new Date().getFullYear()
    const timestamp = Date.now().toString().slice(-3)
    return `MDF-${currentYear}-${timestamp}`
  }
}

export async function submitFundsProvisionRequest(data: {
  compteAdebiter: string
  montant: number
  fullNameBenef: string
  numCni: string
  agence: string
}) {
  try {
    const cookieToken = (await cookies()).get("token")?.value

    if (!cookieToken) {
      throw new Error("Token d'authentification introuvable.")
    }

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

    const reference = await generateFundsProvisionReference()

    const fundsProvisionData: FundsProvisionData = {
      reference,
      compteAdebiter: data.compteAdebiter,
      montant: data.montant,
      fullNameBenef: data.fullNameBenef,
      numCni: data.numCni,
      agence: data.agence,
      statut: "EN_ATTENTE",
      clientId: clientId,
    }

    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/mise-dpstion-fonds`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookieToken}`,
      },
      body: JSON.stringify({ data: fundsProvisionData }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Erreur lors de la soumission de la demande")
    }

    const result = await response.json()
    return {
      success: true,
      reference,
      data: result,
    }
  } catch (error: any) {
    console.error("Error submitting funds provision request:", error)
    throw new Error(error.message || "Erreur lors de la soumission")
  }
}

export async function getFundsProvisionRequests(): Promise<GetFundsProvisionsResponse> {
  try {
    const cookieToken = (await cookies()).get("token")?.value

    if (!cookieToken) {
      return { success: false, data: { rows: [], count: 0 } }
    }

    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/mise-dpstion-fonds`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookieToken}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      console.log("[v0] Response not OK, status:", response.status)
      const errorData = await response.json()
      throw new Error(errorData.message || "Erreur lors de la récupération des demandes")
    }

    const result = await response.json()
    console.log("[v0] API Response in action:", result)
    return result
  } catch (error: any) {
    console.error("Error fetching funds provision requests:", error)
    return { success: false, data: { rows: [], count: 0 } }
  }
}

export async function getFundsProvisionById(id: string): Promise<any> {
  try {
    const cookieToken = (await cookies()).get("token")?.value

    if (!cookieToken) {
      throw new Error("Token introuvable.")
    }

    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/mise-dpstion-fonds/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookieToken}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Erreur lors de la récupération des détails")
    }

    const result = await response.json()
    return result
  } catch (error: any) {
    console.error("Error fetching funds provision details:", error)
    return null
  }
}
