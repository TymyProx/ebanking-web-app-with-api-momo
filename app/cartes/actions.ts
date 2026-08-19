"use server"

import { cookies } from "next/headers"
import { decryptDataServer } from "@/lib/server-encryption"
import { getApiBaseUrl, TENANT_ID } from "@/lib/api-url"

const BASE_URL = getApiBaseUrl()

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
  titulaire_name?: string
  plafond?: number
}

export type CardsResponse = {
  rows: Card[]
  count: number
}

export type NewCardRequest = {
  typCard: string
  accountNumber?: string
  clientId: string
  titulaire_name?: string
  plafond?: number
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

async function getClientFullName(clientId: string, token: string): Promise<string> {
  try {
    // Use filter to find client by userid (which is the authenticated user's ID)
    const filterUrl = `${BASE_URL}/tenant/${TENANT_ID}/client?filter=userid||$eq||${clientId}`
    console.log("[v0] Fetching client from:", filterUrl)

    const response = await fetch(filterUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error("[v0] Failed to fetch client details:", response.status)
      return ""
    }

    const clientData = await response.json()
    console.log("[v0] Client data received:", JSON.stringify(clientData, null, 2))

    let client = null
    let clients: any[] = []

    // Handle different response formats
    if (Array.isArray(clientData)) {
      clients = clientData
    } else if (clientData.rows && Array.isArray(clientData.rows)) {
      clients = clientData.rows
    } else if (clientData.data && Array.isArray(clientData.data)) {
      clients = clientData.data
    } else if (clientData.value && Array.isArray(clientData.value)) {
      clients = clientData.value
    } else {
      // Single client object
      client = clientData
    }

    // If we have an array, find the client with matching userid
    if (clients.length > 0) {
      client = clients.find((c: any) => c.userid === clientId)

      if (!client) {
        console.error("[v0] No client found with matching userid:", clientId)
        console.log(
          "[v0] Available clients:",
          clients.map((c: any) => ({ id: c.id, userid: c.userid, name: c.nomComplet })),
        )
        return ""
      }
    }

    if (!client) {
      console.error("[v0] No client found for userid:", clientId)
      return ""
    }

    const fullName = client.nomComplet || client.fullName || client.name || ""
    console.log("[v0] Client full name:", fullName)
    return fullName
  } catch (error) {
    console.error("[v0] Error fetching client name:", error)
    return ""
  }
}

function getDefaultPlafond(cardType: string): number {
  const plafondDefaults: { [key: string]: number } = {
    DEBIT: 5000000, // 5,000,000 GNF per day
    CREDIT: 10000000, // 10,000,000 GNF per month
    PREPAID: 3000000, // 3,000,000 GNF (loaded amount)
    VIRTUAL: 2000000, // 2,000,000 GNF per transaction
  }

  return plafondDefaults[cardType] || 5000000 // Default to 5M GNF if type not found
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
    filteredRows = filteredRows.filter(
      (card: any) => card.clientId === currentUserId || card.createdById === currentUserId,
    )
    if (logDebug) console.log("[CARDS] filtered by clientId/createdById:", before, "->", filteredRows.length)
  }

  const decryptedRows = await Promise.all(filteredRows.map((card) => decryptDataServer(card as any)))

  return {
    rows: decryptedRows as Card[],
    count: decryptedRows.length,
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

  const clientId = await getCurrentUserInfo(usertoken)
  console.log("[v0] createCardRequest - clientId:", clientId)

  const titulaireCompletName = await getClientFullName(clientId, usertoken)
  console.log("[v0] createCardRequest - titulaireCompletName:", titulaireCompletName)

  const plafond = cardData.plafond || getDefaultPlafond(cardData.typCard)
  console.log("[v0] createCardRequest - plafond:", plafond)

  const today = new Date().toISOString().split("T")[0]

  const expirationDate = new Date()
  expirationDate.setFullYear(expirationDate.getFullYear() + 4)
  const dateExpiration = expirationDate.toISOString().split("T")[0]

  const secure = (process.env.NEXT_PUBLIC_PORTAL_SECURE_MODE || "false").toLowerCase() === "true"
  const keyB64 = process.env.PORTAL_KEY_B64 || ""
  let requestBody: any
  if (secure && keyB64) {
    const { encryptAesGcmNode } = await import("../transfers/new/secure")
    const enc = (v: any) => ({ ...encryptAesGcmNode(v, keyB64), key_id: "k1-mobile-v1" })
    requestBody = {
      data: {
        numCard_json: enc("AUTO"),
        typCard_json: enc(cardData.typCard),
        status_json: enc("EN_ATTENTE"),
        dateEmission_json: enc(today),
        dateExpiration_json: enc(dateExpiration),
        clientId_json: enc(clientId),
        clientId: clientId,
        accountNumber_json: enc(cardData.accountNumber || ""),
        titulaire_name_json: enc(titulaireCompletName),
        plafond_json: enc(plafond), // Added plafond to encrypted payload
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
        titulaire_name: titulaireCompletName,
        plafond: plafond, // Added plafond to unencrypted payload
      },
    }
  }

  console.log("[v0] createCardRequest - requestBody:", JSON.stringify(requestBody, null, 2))

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

  console.log("[v0] createCardRequest - response status:", res.status)
  console.log("[v0] createCardRequest - response body:", bodyText)

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${bodyText || "Erreur lors de la création"}`)
  }

  if (contentType.includes("application/json") && bodyText) {
    return JSON.parse(bodyText) as Card
  }

  throw new Error("Réponse invalide du serveur")
}

export async function toggleCardStatus(cardId: string, currentStatus: string) {
  const cookieToken = (await cookies()).get("token")?.value
  const usertoken = cookieToken

  if (!usertoken) {
    return {
      success: false,
      error: "Token d'authentification manquant",
    }
  }

  try {
    const newStatus = currentStatus?.toUpperCase() === "ACTIF" ? "BLOCKED" : "ACTIF"

    const secure = (process.env.NEXT_PUBLIC_PORTAL_SECURE_MODE || "false").toLowerCase() === "true"
    const keyB64 = process.env.PORTAL_KEY_B64 || ""
    let requestBody: any

    if (secure && keyB64) {
      const { encryptAesGcmNode } = await import("../transfers/new/secure")
      const enc = (v: any) => ({ ...encryptAesGcmNode(v, keyB64), key_id: "k1-mobile-v1" })
      requestBody = {
        data: {
          status_json: enc(newStatus),
          key_id: "k1-mobile-v1",
        },
      }
    } else {
      requestBody = {
        data: {
          status: newStatus,
        },
      }
    }

    const res = await fetch(`${BASE_URL}/tenant/${TENANT_ID}/card/${cardId}`, {
      method: "PUT",
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
      return {
        success: false,
        error: `Erreur ${res.status}: ${bodyText || "Erreur lors de la mise à jour"}`,
      }
    }

    let result: any = {}
    if (contentType.includes("application/json") && bodyText) {
      result = JSON.parse(bodyText)
    }

    return {
      success: true,
      message: newStatus === "ACTIF" ? "Carte débloquée avec succès" : "Carte bloquée avec succès",
      data: result,
    }
  } catch (error) {
    console.error("[v0] Error toggling card status:", error)
    return {
      success: false,
      error: "Erreur lors de la mise à jour du statut. Veuillez réessayer.",
    }
  }
}
