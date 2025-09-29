"use server"

import { cookies } from "next/headers"

const API_BASE_URL = process.env.API_BASE_URL
const TENANT_ID = process.env.TENANT_ID

// Fonction pour générer une référence unique au format souhaité
export function generateReference(type: "credit" | "checkbook", index: number): string {
  const year = new Date().getFullYear()
  const prefix = type === "credit" ? "CRD" : "CHQ"
  const counter = String(index).padStart(3, "0")
  return `${prefix}-${year}-${counter}`
}

// Fonction pour obtenir le prochain numéro de séquence pour un type de demande
export async function getNextReferenceNumber(type: "credit" | "checkbook"): Promise<number> {
  try {
    const cookieToken = (await cookies()).get("token")?.value

    if (!cookieToken) {
      // En mode test, retourner un numéro aléatoire
      return Math.floor(Math.random() * 100) + 1
    }

    // Récupérer toutes les demandes du type spécifié
    const endpoint = type === "credit" ? "demande-credit" : "commande"
    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookieToken}`,
      },
    })

    if (!response.ok) {
      // En cas d'erreur, retourner 1
      return 1
    }

    const data = await response.json()
    const count = data.rows ? data.rows.length : data.count || 0

    // Retourner le prochain numéro
    return count + 1
  } catch (error) {
    console.error("[v0] Erreur lors de la récupération du numéro de référence:", error)
    return 1
  }
}
