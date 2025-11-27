"use server"

import { cookies } from "next/headers"
import { config } from "@/lib/config"

const normalize = (u?: string) => (u ? u.replace(/\/$/, "") : "")
const BASE_URL = `${normalize(config.API_BASE_URL)}/api`
const TENANT_ID = config.TENANT_ID

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
  clientId:string
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
  const logDebug = (process.env.LOG_LEVEL || "").toLowerCase() === "debug"
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
      if (logDebug) console.log("[CARDS] currentUserId:", currentUserId)
    }
  } catch (error) {
    console.error("[v0] Error fetching user ID:", error)
  }

  const res = await fetch(`${BASE_URL}/tenant/${TENANT_ID}/card?limit=500&orderBy=createdAt_DESC`, {
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
  if (logDebug) {
    console.log("[CARDS] api rows:", filteredRows.length)
    if (filteredRows[0]) {
      const c: any = filteredRows[0]
      console.log("[CARDS] sample types:", {
        clientIdType: typeof c.clientId,
        numCardType: typeof c.numCard,
      })
    }
  }
  if (currentUserId && filteredRows.length > 0) {
    const before = filteredRows.length
    filteredRows = filteredRows.filter((card: any) => card.clientId === currentUserId || card.createdById === currentUserId)
    if (logDebug) console.log("[CARDS] filtered by clientId/createdById:", before, "->", filteredRows.length)
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

  const secure = (process.env.NEXT_PUBLIC_PORTAL_SECURE_MODE || "false").toLowerCase() === "false"
  const keyB64 = process.env.NEXT_PUBLIC_PORTAL_KEY_B64 || ""
  let requestBody: any
  if (secure && keyB64) {
    const { encryptAesGcmNode } = await import("../app/transfers/new/secure")
    const enc = (v: any) => ({ ...encryptAesGcmNode(v, keyB64), key_id: "k1-mobile-v1" })
    requestBody = {
      data: {
        numCard_json: enc("AUTO"),
        typCard_json: enc(cardData.typCard),
        status_json: enc("EN_ATTENTE"),
        dateEmission_json: enc(today),
        dateExpiration_json: enc(dateExpiration),
        clientId_json: enc(clientId),
        // keep plaintext clientId for server-side filtering and client list
        clientId: clientId,
        accountNumber_json: enc(cardData.accountNumber || ""),
        key_id: "k1-mobile-v1",
      },
    }
  } else {
    requestBody = {
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
