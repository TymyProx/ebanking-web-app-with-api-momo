"use server"

import { cookies } from "next/headers"

const BASE_URL = process.env.API_BASE_URL
const TENANT_ID = process.env.TENANT_ID

export type Card = {
  id: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
  createdById?: string
  updatedById?: string
  importHash?: string
  tenantId?: string
  numCard: string
  typCard: string
  status: string
  dateEmission: string
  dateExpiration: string
  clientId: string
  accountNumber?: string
}

export type CardsResponse = {
  rows: Card[]
  count: number
}

export type NewCardRequest = {
  typCard: string
  accountNumber?: string
}

async function getCurrentUserInfo(token: string) {
  try {
    const response = await fetch(`${BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch user info")
    }

    const userData = await response.json()
    return userData.id
  } catch (error) {
    console.error("[v0] Error fetching user info:", error)
    throw new Error("Unable to get user information")
  }
}

export async function fetchAllCards(): Promise<CardsResponse> {
  const cookieToken = (await cookies()).get("token")?.value
  const usertoken = cookieToken

  if (!usertoken) {
    return {
      rows: [],
      count: 0,
    }
  }

  let currentUserId: string | null = null
  try {
    const userResponse = await fetch(`${BASE_URL}/auth/me`, {
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
    console.error("[v0] Error fetching user ID:", error)
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

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${bodyText || "Erreur inconnue"}`)
  }

  let parsed: CardsResponse | null = null
  if (contentType.includes("application/json") && bodyText) {
    parsed = JSON.parse(bodyText) as CardsResponse
  }

  let filteredRows = parsed?.rows ?? []
  if (currentUserId && filteredRows.length > 0) {
    filteredRows = filteredRows.filter((card) => card.clientId === currentUserId)
  }

  return {
    rows: filteredRows,
    count: filteredRows.length,
  }
}

export async function getCardDetails(cardId: string): Promise<Card> {
  const cookieToken = (await cookies()).get("token")?.value
  const usertoken = cookieToken

  if (!usertoken) {
    throw new Error("Token d'authentification manquant")
  }

  const res = await fetch(`${BASE_URL}/tenant/${TENANT_ID}/card/${cardId}`, {
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

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${bodyText || "Erreur inconnue"}`)
  }

  if (contentType.includes("application/json") && bodyText) {
    return JSON.parse(bodyText) as Card
  }

  throw new Error("Réponse invalide du serveur")
}

export async function createCardRequest(cardData: NewCardRequest): Promise<Card> {
  const cookieToken = (await cookies()).get("token")?.value
  const usertoken = cookieToken

  if (!usertoken) {
    throw new Error("Token d'authentification manquant")
  }

  // Get clientId from logged-in user
  const clientId = await getCurrentUserInfo(usertoken)

  const today = new Date().toISOString().split("T")[0]

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
      clientId: clientId,
      accountNumber: cardData.accountNumber || "",
    },
  }

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

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${bodyText || "Erreur lors de la création"}`)
  }

  if (contentType.includes("application/json") && bodyText) {
    return JSON.parse(bodyText) as Card
  }

  throw new Error("Réponse invalide du serveur")
}
