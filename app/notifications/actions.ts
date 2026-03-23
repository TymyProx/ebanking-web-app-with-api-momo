"use server"
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

import { cookies } from "next/headers"
import { getApiBaseUrl, TENANT_ID } from "@/lib/api-url"

const API_BASE_URL = getApiBaseUrl()

export interface NotificationItem {
  id: string
  type:
    | "client_update"
    | "account_update"
    | "transaction"
    | "transfer"
    | "beneficiary"
    | "reclamation_status"
    | "commande_status"
  title: string
  message: string
  date: string
  amount?: number
  entityName: string
  action: string
}

const RELEVANT_ENTITIES = [
  "client",
  "compte",
  "transactions",
  "virementCompte",
  "beneficiaire",
  "reclamation",
  "commande",
]

function parseValues(raw: any): Record<string, any> {
  if (!raw) return {}
  if (typeof raw === "string") {
    try { return JSON.parse(raw) } catch { return {} }
  }
  return raw
}

function buildNotification(entry: any): NotificationItem | null {
  const values = parseValues(entry.values)

  switch (entry.entityName) {
    case "client": {
      if (entry.action === "update") {
        return {
          id: entry.id, type: "client_update",
          title: "Informations mises à jour",
          message: "Vos informations personnelles ont été modifiées.",
          date: entry.timestamp, entityName: entry.entityName, action: entry.action,
        }
      }
      return null
    }

    case "compte": {
      const name = values.accountName || "Votre compte"
      if (entry.action === "update") {
        const status = values.status
        const msg = status
          ? `Le statut du compte « ${name} » est passé à « ${status} ».`
          : `Le compte « ${name} » a été mis à jour.`
        return {
          id: entry.id, type: "account_update",
          title: "Compte modifié",
          message: msg,
          date: entry.timestamp, entityName: entry.entityName, action: entry.action,
        }
      }
      if (entry.action === "delete") {
        return {
          id: entry.id, type: "account_update",
          title: "Compte clôturé",
          message: `Le compte « ${name} » a été clôturé.`,
          date: entry.timestamp, entityName: entry.entityName, action: entry.action,
        }
      }
      return null
    }

    case "transactions": {
      if (entry.action === "create") return null
      const amount = Number(values.amount || values.montant || 0)
      const desc = values.description || values.motif || values.reference || ""
      const currency = values.currency || values.devise || "GNF"
      let message: string
      if (amount) {
        const formatted = new Intl.NumberFormat("fr-FR").format(Math.abs(amount))
        message = `Transaction de ${formatted} ${currency}${desc ? ` — ${desc}` : ""}`
      } else {
        message = desc || "Une transaction a été enregistrée sur votre compte."
      }
      return {
        id: entry.id, type: "transaction",
        title: entry.action === "delete" ? "Transaction supprimée" : "Transaction mise à jour",
        message, date: entry.timestamp, amount,
        entityName: entry.entityName, action: entry.action,
      }
    }

    case "virementCompte": {
      if (entry.action === "create") return null
      const amount = Number(values.montant || values.amount || 0)
      const currency = values.devise || values.currency || "GNF"
      let message: string
      if (amount) {
        const formatted = new Intl.NumberFormat("fr-FR").format(Math.abs(amount))
        message = `Virement de ${formatted} ${currency} effectué avec succès.`
      } else {
        message = "Un virement a été effectué sur votre compte."
      }
      return {
        id: entry.id, type: "transfer",
        title: entry.action === "delete" ? "Virement supprimé" : "Virement mis à jour",
        message, date: entry.timestamp,
        amount: amount ? -Math.abs(amount) : undefined,
        entityName: entry.entityName, action: entry.action,
      }
    }

    case "beneficiaire": {
      const benefName = values.nom || values.name || values.fullName || ""
      const label = benefName ? `« ${benefName} »` : "Un bénéficiaire"
      if (entry.action === "update") {
        return {
          id: entry.id, type: "beneficiary",
          title: "Bénéficiaire modifié",
          message: `Le bénéficiaire ${label} a été mis à jour.`,
          date: entry.timestamp, entityName: entry.entityName, action: entry.action,
        }
      }
      if (entry.action === "delete") {
        return {
          id: entry.id, type: "beneficiary",
          title: "Bénéficiaire supprimé",
          message: `${label} a été retiré de votre liste.`,
          date: entry.timestamp, entityName: entry.entityName, action: entry.action,
        }
      }
      return null
    }

    case "reclamation": {
      if (entry.action !== "update") return null
      const rawStatus = values.status ?? values.statut
      if (rawStatus === undefined || rawStatus === null || rawStatus === "") return null
      const statusNum = Number(rawStatus)
      let statusLabel: string
      if (statusNum === 0) {
        statusLabel = "en attente"
      } else if (statusNum === 1) {
        statusLabel = "en cours de traitement"
      } else if (statusNum === 2) {
        statusLabel = "clôturée"
      } else {
        statusLabel = "mise à jour"
      }
      const ref = values.claimId || values.reference || values.ref || entry.entityId
      return {
        id: entry.id, type: "reclamation_status",
        title: "Statut de réclamation modifié",
        message: `La réclamation ${ref ? `« ${ref} »` : ""} est ${statusLabel}.`,
        date: entry.timestamp, entityName: entry.entityName, action: entry.action,
      }
    }

    case "commande": {
      if (entry.action !== "update") return null
      const stepflow = values.stepflow
      if (stepflow === undefined || stepflow === null) return null
      const step = Number(stepflow)
      const STEP_LABELS: Record<number, string> = {
        1: "prise en charge",
        2: "envoyée à l'imprimeur",
        3: "disponible en agence",
        4: "client notifié",
        5: "retirée",
      }
      const stepLabel = STEP_LABELS[step]
      if (!stepLabel) return null
      const ref = values.referenceCommande || values.reference || entry.entityId
      return {
        id: entry.id, type: "commande_status",
        title: "Commande de chéquier mise à jour",
        message: `La commande ${ref ? `« ${ref} » ` : ""}est ${stepLabel}.`,
        date: entry.timestamp, entityName: entry.entityName, action: entry.action,
      }
    }

    default:
      return null
  }
}

export async function fetchUserNotifications(): Promise<NotificationItem[]> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    if (!token) return []

    const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!meRes.ok) return []
    const me = await meRes.json()
    const userId: string = me.id

    const comptesRes = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/compte`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    let userAccountIds: string[] = []
    if (comptesRes.ok) {
      const comptesData = await comptesRes.json()
      const rows = comptesData.rows || comptesData.data || comptesData || []
      userAccountIds = (Array.isArray(rows) ? rows : [])
        .filter((a: any) => a.clientId === userId)
        .map((a: any) => a.id)
    }

    const params = new URLSearchParams()
    RELEVANT_ENTITIES.forEach((e) => params.append("filter[entityNames][]", e))
    params.set("limit", "50")
    params.set("orderBy", "timestamp_DESC")

    const auditRes = await fetch(
      `${API_BASE_URL}/tenant/${TENANT_ID}/audit-log?${params.toString()}`,
      {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    )
    if (!auditRes.ok) return []

    const auditData = await auditRes.json()
    const entries: any[] = auditData.rows || auditData.data || []

    const relevant = entries.filter((e) => {
      const vals = parseValues(e.values)
      switch (e.entityName) {
        case "client":
          return e.entityId === userId
        case "compte":
          return userAccountIds.includes(e.entityId)
        case "transactions":
        case "virementCompte":
        case "beneficiaire":
          return e.createdById === userId
        case "reclamation":
        case "commande":
          return vals.clientId === userId || vals.createdById === userId || e.createdById === userId
        default:
          return false
      }
    })

    return relevant.map(buildNotification).filter((n): n is NotificationItem => n !== null)
  } catch (error) {
    console.error("Error fetching user notifications:", error)
    return []
  }
}
