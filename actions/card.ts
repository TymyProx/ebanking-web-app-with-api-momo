const BASE_URL = "http://192.168.1.200:8080/api"
const TENANT_ID = "11cacc69-5a49-4f01-8b16-e8f473746634"
const API_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjJhYWY0OWMzLThlOGUtNDZkYS1iZDM4LWIwZDlmNTFiODAzNyIsImlhdCI6MTc1NjQ1OTYzMCwiZXhwIjoxNzU3MDY0NDMwfQ.F1glqniLIDoTxs6PmLa6AEiuaHvAQqWSyCkPswF7n80"

export type Card = {
  id: string
  numCard: string
  typCard: string
  status: string
  dateEmission: string
  dateExpiration: string
  idClient: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
  createdById?: string
  updatedById?: string
  importHash?: string
  tenantId?: string
}

export type CardsResponse = {
  rows: Card[]
  count: number
}

export type NewCardRequest = {
  typCard: string
  idClient: string
}

export async function fetchAllCards(): Promise<CardsResponse> {
  const res = await fetch(`${BASE_URL}/tenant/${TENANT_ID}/card`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_TOKEN}`,
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

  return {
    rows: parsed?.rows ?? [],
    count: parsed?.count ?? 0,
  }
}

export async function createCardRequest(cardData: NewCardRequest): Promise<Card> {
  const res = await fetch(`${BASE_URL}/tenant/${TENANT_ID}/card`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_TOKEN}`,
    },
    body: JSON.stringify(cardData),
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
