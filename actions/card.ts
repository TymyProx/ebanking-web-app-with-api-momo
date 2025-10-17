"use server"

import { cookies } from "next/headers"

const BASE_URL = process.env.API_BASE_URL
const TENANT_ID = process.env.TENANT_ID
export type Card = {
  id: string
  numCard: string
  typCard: string
  status: string
  dateEmission: string
  dateExpiration: string
  idClient: string
  accountNumber?: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
  createdById?: string
  updatedById?: string
  importHash?: string
  TENANT_ID?: string
}

export type CardsResponse = {
  rows: Card[]
  count: number
}

export type NewCardRequest = {
  typCard: string
  idClient: string
  accountNumber?: string
}

export async function fetchAllCards(): Promise<CardsResponse> {
  const cookieToken = (await cookies()).get("token")?.value
  const usertoken = cookieToken

  //console.log("[v0] Token d'authentification:", usertoken ? "présent" : "manquant")

  if (!usertoken) {
    //console.log("[v0] Token d'authentification manquant, retour de données de test")
    return {
      rows: [],
      count: 0,
    }
  }

  const res = await fetch(`${BASE_URL}/tenant/${TENANT_ID}/card`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${usertoken}`,
    },
    cache: "no-store",
  })

  const contentType = res.headers.get("content-type") || ""
  const bodyText = await res.text()

  //console.log("[v0] Réponse API cartes:", res.status, bodyText)

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${bodyText || "Erreur inconnue"}`)
  }

  let parsed: CardsResponse | null = null
  if (contentType.includes("application/json") && bodyText) {
    parsed = JSON.parse(bodyText) as CardsResponse
  }

  return {
    rows: parsed?.rows ?? [],
    count: parsed?.count ?? 0,
  }
}

export async function createCardRequest(cardData: NewCardRequest): Promise<Card> {
  const cookieToken = (await cookies()).get("token")?.value
  const usertoken = cookieToken

   //console.log("[v0] Envoi de la demande avec type:", cardData.typCard)
   //console.log("[v0] Compte sélectionné:", cardData.accountNumber)
   //console.log("[v0] Token d'authentification:", usertoken ? "présent" : "manquant")

  if (!usertoken) {
    throw new Error("Token d'authentification manquant")
  }

  const today = new Date().toISOString().split("T")[0] // Format YYYY-MM-DD

  const expirationDate = new Date()
  expirationDate.setFullYear(expirationDate.getFullYear() + 4)
  const dateExpiration = expirationDate.toISOString().split("T")[0]

  const requestBody = {
    data: {
      numCard: "",
      typCard: cardData.typCard,
      status: "EN_ATTENTE",
      dateEmission: today,
      dateExpiration: dateExpiration,
      idClient: cardData.idClient,
      accountNumber: cardData.accountNumber || "",
    },
  }

  //console.log("[v0] Corps de la requête:", JSON.stringify(requestBody))

  const res = await fetch(`${BASE_URL}/tenant/${TENANT_ID}/card`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${usertoken}`,
    },
    body: JSON.stringify(requestBody),
  })

  const contentType = res.headers.get("content-type") || ""
  const bodyText = await res.text()

  //console.log("[v0] Réponse API:", res.status, bodyText)

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${bodyText || "Erreur lors de la création"}`)
  }

  if (contentType.includes("application/json") && bodyText) {
    return JSON.parse(bodyText) as Card
  }

  throw new Error("Réponse invalide du serveur")
}