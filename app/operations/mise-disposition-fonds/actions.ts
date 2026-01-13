"use server"

const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL
const TENANT_ID = process.env.TENANT_ID || process.env.NEXT_PUBLIC_TENANT_ID

export async function submitFundsProvisionRequest(data: {
  compteAdebiter: string
  montant: number
  fullNameBenef: string
  numCni: string
  agence: string
  statut: string
}) {
  try {
    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/mise-dpstion-fonds`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    })

    if (!response.ok) {
      throw new Error("Erreur lors de la soumission de la demande")
    }

    const result = await response.json()
    return result
  } catch (error: any) {
    console.error("Error submitting funds provision request:", error)
    throw new Error(error.message || "Erreur lors de la soumission")
  }
}

export async function getFundsProvisionRequests() {
  try {
    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/mise-dpstion-fonds`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des demandes")
    }

    const result = await response.json()
    return result
  } catch (error: any) {
    console.error("Error fetching funds provision requests:", error)
    throw new Error(error.message || "Erreur lors de la récupération des demandes")
  }
}

export async function getFundsProvisionById(id: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/mise-dpstion-fonds/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des détails")
    }

    const result = await response.json()
    return result
  } catch (error: any) {
    console.error("Error fetching funds provision details:", error)
    throw new Error(error.message || "Erreur lors de la récupération des détails")
  }
}
