"use server"
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

import { cookies } from "next/headers"
import { getApiBaseUrl, TENANT_ID } from "@/lib/api-url"
import { normalizeAccountStatus } from "@/lib/status-utils"

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

/** clientId dans l’audit peut être une string UUID ou un objet Sequelize { id } */
function clientIdFromValues(v: Record<string, any>): string | undefined {
  const c = v?.clientId
  if (c == null) return undefined
  if (typeof c === "object" && c !== null && "id" in c) return String((c as { id: unknown }).id)
  return String(c)
}

/**
 * Nouveaux clients : leurs demandes de compte ont leur userId en clientId dans les values,
 * mais l’entityId de l’audit est l’id du compte — il faut aussi matcher sur clientId.
 */
function compteAuditConcernsUser(entry: any, userId: string, userAccountIds: string[]): boolean {
  if (userAccountIds.includes(entry.entityId)) return true
  const vals = parseValues(entry.values ?? entry.newValues ?? entry.after)
  const olds = parseValues(entry.oldValues ?? entry.previousValues ?? entry.before)
  const uid = String(userId)
  return clientIdFromValues(vals) === uid || clientIdFromValues(olds) === uid
}

/**
 * Détecte les champs modifiés.
 * Le backend peut inclure `__auditPrevious` dans `values` (compte) pour l’état avant update.
 */
function getChangedFields(entry: any): {
  changed: Set<string>
  hasPreviousState: boolean
  /** values sans __auditPrevious (affichage / libellés) */
  cleanNewVals: Record<string, any>
} {
  const rawNew = parseValues(entry.values ?? entry.newValues ?? entry.after)
  let oldVals = parseValues(entry.oldValues ?? entry.previousValues ?? entry.before)
  let newVals: Record<string, any> = { ...rawNew }

  if (
    rawNew &&
    typeof rawNew === "object" &&
    "__auditPrevious" in rawNew &&
    Object.keys(oldVals).length === 0
  ) {
    const prev = (rawNew as Record<string, unknown>).__auditPrevious
    oldVals = prev && typeof prev === "object" ? { ...(prev as Record<string, any>) } : parseValues(prev)
    const { __auditPrevious: _a, ...rest } = rawNew as Record<string, any>
    newVals = rest
  }

  const hasPreviousState = Object.keys(oldVals).length > 0
  const changed = new Set<string>()
  if (!hasPreviousState) {
    return { changed, hasPreviousState: false, cleanNewVals: newVals }
  }
  const allKeys = new Set([...Object.keys(oldVals), ...Object.keys(newVals)])
  for (const k of allKeys) {
    if (k === "__auditPrevious") continue
    const ov = oldVals[k]
    const nv = newVals[k]
    if (JSON.stringify(ov) !== JSON.stringify(nv)) changed.add(k)
  }
  return { changed, hasPreviousState: true, cleanNewVals: newVals }
}

function stripAuditPrevious(raw: Record<string, any>): Record<string, any> {
  if (!raw || typeof raw !== "object") return raw
  const { __auditPrevious: _a, ...rest } = raw
  return rest
}

const COMPTE_FIELD_LABELS: Record<string, string> = {
  avisDC: "préférence avis débit/crédit",
  accountName: "intitulé du compte",
  accountNumber: "numéro de compte",
  accountId: "identifiant compte",
  currency: "devise",
  bookBalance: "solde comptable",
  availableBalance: "solde disponible",
  codeAgence: "agence",
  codeBanque: "code banque",
  cleRib: "clé RIB",
  rejectionReason: "motif de rejet",
  type: "type de compte",
  clientId: "rattachement client",
  importHash: "référence d’import",
  status: "statut",
  statut: "statut",
}

function describeCompteFieldChanges(keys: string[]): string {
  const labels = keys.map((k) => COMPTE_FIELD_LABELS[k] || k).filter(Boolean)
  if (labels.length === 0) return "autres informations"
  if (labels.length === 1) return labels[0]
  if (labels.length === 2) return `${labels[0]} et ${labels[1]}`
  return `${labels.slice(0, -1).join(", ")} et ${labels[labels.length - 1]}`
}

function buildNotification(entry: any): NotificationItem | null {
  const { changed: changedFields, hasPreviousState, cleanNewVals } = getChangedFields(entry)
  const parsed = parseValues(entry.values ?? entry.newValues ?? entry.after)
  const values: Record<string, any> =
    entry.entityName === "compte"
      ? stripAuditPrevious(Object.keys(cleanNewVals).length > 0 ? cleanNewVals : parsed)
      : parsed

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
      if (entry.action === "create") {
        const statusRaw = values.status ?? values.statut
        const statusLabel = normalizeAccountStatus(statusRaw)
        return {
          id: entry.id,
          type: "account_update",
          title: "Demande d'ouverture de compte",
          message: `Votre demande « ${name} » a été prise en compte. Statut : ${statusLabel}. Vous serez notifié à chaque changement (validation, refus, etc.).`,
          date: entry.timestamp,
          entityName: entry.entityName,
          action: entry.action,
        }
      }
      if (entry.action === "update") {
        const statusChanged = hasPreviousState && (changedFields.has("status") || changedFields.has("statut"))
        const balanceChanged =
          hasPreviousState &&
          (changedFields.has("availableBalance") ||
            changedFields.has("bookBalance") ||
            changedFields.has("balance") ||
            changedFields.has("solde"))
        const availableBalance = values.availableBalance ?? values.balance
        const hasBalanceInValues = availableBalance !== undefined && availableBalance !== null
        const onlyBalanceChanged = balanceChanged && !statusChanged
        const hasStatusInPayload = values.status !== undefined || values.statut !== undefined
        const likelyBalanceOnly =
          !hasPreviousState && hasBalanceInValues && !hasStatusInPayload

        if (onlyBalanceChanged || likelyBalanceOnly) {
          return null
        }

        /** Champs techniques : pas de notification « métier » dédiée à eux seuls */
        const NOISE_KEYS = new Set([
          "updatedAt",
          "updatedById",
          "createdAt",
          "createdById",
          "deletedAt",
        ])
        const meaningfulChangedKeys = [...changedFields].filter(
          (k) => !NOISE_KEYS.has(k) && k !== "__auditPrevious",
        )

        if (hasPreviousState && meaningfulChangedKeys.length === 0) {
          return null
        }

        const rawVals = parseValues(entry.values ?? entry.newValues ?? entry.after)
        const prevSnap =
          rawVals && typeof rawVals === "object" ? (rawVals as Record<string, any>).__auditPrevious : undefined
        const oldStatusRaw =
          prevSnap && typeof prevSnap === "object" ? prevSnap.status ?? prevSnap.statut : undefined
        const newStatusRaw = values.status ?? values.statut
        const oldLabel =
          oldStatusRaw !== undefined && oldStatusRaw !== null && String(oldStatusRaw).trim() !== ""
            ? normalizeAccountStatus(oldStatusRaw)
            : null
        const newLabel =
          newStatusRaw !== undefined && newStatusRaw !== null && String(newStatusRaw).trim() !== ""
            ? normalizeAccountStatus(newStatusRaw)
            : null

        const onlyAvisDcChanged =
          hasPreviousState &&
          !statusChanged &&
          meaningfulChangedKeys.length === 1 &&
          meaningfulChangedKeys[0] === "avisDC"
        if (onlyAvisDcChanged) {
          const on = Number(values.avisDC) === 1
          return {
            id: entry.id,
            type: "account_update",
            title: on ? "Avis débit/crédit activés" : "Avis débit/crédit désactivés",
            message: on
              ? `Pour le compte « ${name} », vous recevrez les avis débit et crédit par e-mail.`
              : `Pour le compte « ${name} », les avis débit et crédit ne seront plus envoyés par e-mail.`,
            date: entry.timestamp,
            entityName: entry.entityName,
            action: entry.action,
          }
        }

        let message: string
        let title = "Compte modifié"

        if (oldLabel && newLabel && oldLabel !== newLabel) {
          if (newLabel === "Actif") {
            title = "Compte activé"
            message = `Le statut de votre compte est passé à ACTIF.`
          } else if (newLabel === "Rejeté") {
            title = "Demande d’ouverture refusée"
            message = `Votre demande d’ouverture a été refusée.`
          } else {
            title = `Statut : ${newLabel}`
            if (newLabel === "En attente") {
              message = `Le compte « ${name} » est au statut « ${newLabel} » (auparavant « ${oldLabel} »).`
            } else {
              message = `Le statut du compte « ${name} » est passé de « ${oldLabel} » à « ${newLabel} ».`
            }
          }
        } else if (statusChanged && newLabel) {
          if (newLabel === "Actif") {
            title = "Compte activé"
            message = `Le statut de votre compte est passé à ACTIF.`
          } else if (newLabel === "Rejeté") {
            title = "Demande d’ouverture refusée"
            message = `Votre demande d’ouverture a été refusée.`
          } else {
            title = `Statut : ${newLabel}`
            message = `Le compte « ${name} » — statut actuel : « ${newLabel} ».`
          }
        } else if (statusChanged) {
          const s = values.status ?? values.statut
          const fallback = s != null && String(s).trim() !== "" ? String(s) : "indéterminé"
          title = "Compte modifié"
          message = `Le compte « ${name} » a été modifié. Statut indiqué : ${fallback}.`
        } else if (meaningfulChangedKeys.length > 0) {
          title = "Compte modifié"
          message = `Le compte « ${name} » a été mis à jour (${describeCompteFieldChanges(meaningfulChangedKeys)}).`
        } else {
          title = "Compte modifié"
          message = `Le compte « ${name} » a été modifié. Consultez la fiche compte pour le détail.`
        }

        return {
          id: entry.id, type: "account_update",
          title,
          message,
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
    params.set("limit", "100")
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
          return compteAuditConcernsUser(e, userId, userAccountIds)
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
