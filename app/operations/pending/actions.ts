"use server"
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
import { cookies } from "next/headers"
import { getApiBaseUrl, TENANT_ID } from "@/lib/api-url"

const API_BASE_URL = getApiBaseUrl()

// Récupérer les opérations en attente depuis l'API epayments
export async function getPendingOperations() {
  try {
    const cookieStore = await cookies()
    const usertoken = cookieStore.get("token")?.value

    if (!usertoken) {
      return {
        success: false,
        error: "Non authentifié",
        timestamp: new Date().toISOString(),
      }
    }

    // Récupérer l'ID de l'utilisateur connecté
    let currentUserId: string | null = null
    try {
      const me = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: { Authorization: `Bearer ${usertoken}`, "Content-Type": "application/json" },
      })
      if (me.ok) {
        const userData = await me.json()
        currentUserId = userData.id || null
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error)
    }

    if (!currentUserId) {
      return {
        success: false,
        error: "Impossible de récupérer les informations utilisateur",
        timestamp: new Date().toISOString(),
      }
    }

    // Récupérer les epayments avec tri et limite
    const res = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/epayments?orderBy=createdAt_DESC&limit=100`, {
      method: "GET",
      headers: { Authorization: `Bearer ${usertoken}`, Accept: "application/json" },
    })

    const contentType = res.headers.get("content-type") || ""
    const bodyText = await res.text()
    
    if (!res.ok) {
      throw new Error("Erreur lors de la récupération des opérations")
    }

    const parsed = contentType.includes("application/json") && bodyText ? JSON.parse(bodyText) : { rows: [] }
    let rows: any[] = parsed.rows || []

    // Filtrer par utilisateur
    rows = rows.filter((r: any) => r.clientId === currentUserId || r.createdById === currentUserId)

    // Filtrer par statut en attente (inclure aussi EN_ATTENTE pour les mises à disposition)
    const pendingStatuses = ["PENDING", "PROCESSING", "APPROVAL_REQUIRED", "FAILED", "EN_ATTENTE", "EN_COURS"]
    const filteredOperations = rows
      .filter((payment: any) => {
        const status = (payment.status || "").toUpperCase()
        return pendingStatuses.includes(status)
      })
      .map((payment: any) => {
        const status = (payment.status || "").toUpperCase()
        
        // Mapper le statut de l'API vers le format attendu
        let mappedStatus: "pending" | "processing" | "failed" | "approval_required" = "pending"
        if (status === "PROCESSING" || status === "IN_PROGRESS" || status === "EN_COURS") {
          mappedStatus = "processing"
        } else if (status === "FAILED" || status === "REJECTED" || status === "REJETE") {
          mappedStatus = "failed"
        } else if (status === "APPROVAL_REQUIRED" || status === "AWAITING_APPROVAL") {
          mappedStatus = "approval_required"
        } else if (status === "EN_ATTENTE" || status === "PENDING") {
          mappedStatus = "pending"
        }

        // Déterminer le type d'opération
        // Vérifier d'abord si c'est une mise à disposition des fonds
        let operationType: "transfer" | "payment" | "deposit" | "withdrawal" = "transfer"
        const description = String(payment.description || payment.commentnotes || "").toLowerCase()
        
        // Identifier les mises à disposition des fonds
        // Elles peuvent avoir des champs spécifiques comme fullNameBenef, numCni, agence, etc.
        const hasFundsProvisionFields = 
          payment.fullNameBenef || 
          payment.numCni || 
          payment.agence ||
          payment.reference?.startsWith("RET-") ||
          payment.reference?.startsWith("MDF-") ||
          description.includes("mise à disposition") ||
          description.includes("mise a disposition") ||
          description.includes("disposition des fonds")
        
        if (hasFundsProvisionFields) {
          operationType = "withdrawal" // Mise à disposition = retrait en agence
        } else if (description.includes("paiement") || description.includes("payment")) {
          operationType = "payment"
        } else if (description.includes("dépôt") || description.includes("deposit")) {
          operationType = "deposit"
        } else if (description.includes("retrait") || description.includes("withdrawal")) {
          operationType = "withdrawal"
        }

        // Fonction helper pour extraire du texte depuis un objet potentiellement chiffré
        const extractText = (value: any): string => {
          if (!value) return ""
          if (typeof value === "string") return value
          if (typeof value === "object" && (value.ct || value.iv)) {
            // Objet chiffré - retourner un placeholder
            return "[Chiffré]"
          }
          return String(value)
        }

        // Construire la description pour les mises à disposition
        let operationDescription = extractText(payment.description) || extractText(payment.commentnotes) || "Virement"
        if (hasFundsProvisionFields) {
          const benefName = extractText(payment.fullNameBenef || payment.nomBeneficiaire)
          const agence = extractText(payment.agence)
          operationDescription = `Mise à disposition des fonds${benefName ? ` - ${benefName}` : ""}${agence ? ` - Agence: ${agence}` : ""}`
        }

        return {
          id: payment.id || payment.referenceOperation || "",
          type: operationType,
          description: operationDescription,
          amount: Number(payment.montantOperation || payment.montant || 0),
          currency: "GNF",
          recipient: extractText(payment.fullNameBenef || payment.nomBeneficiaire) || "",
          status: mappedStatus,
          createdAt: payment.dateOrdre || payment.createdAt || new Date().toISOString(),
          estimatedCompletion: payment.dateExecution || undefined,
          failureReason: mappedStatus === "failed" ? "Opération échouée" : undefined,
          canCancel: (mappedStatus === "pending" || mappedStatus === "approval_required") && !hasFundsProvisionFields, // Les mises à disposition ne peuvent généralement pas être annulées
          canRetry: mappedStatus === "failed",
        }
      })

    console.log("[PENDING OPS] Total epayments récupérés:", rows.length)
    console.log("[PENDING OPS] Opérations filtrées:", filteredOperations.length)
    console.log("[PENDING OPS] Détail des opérations:", filteredOperations.map(op => ({
      id: op.id,
      type: op.type,
      description: op.description,
      status: op.status,
      amount: op.amount
    })))

    return {
      success: true,
      message: "Opérations récupérées avec succès",
      data: filteredOperations,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des opérations:", error)

    return {
      success: false,
      error: "Erreur de connexion. Opérations non disponibles.",
      timestamp: new Date().toISOString(),
    }
  }
}

// Annuler une opération
export async function cancelOperation(operationId: string) {
  try {
    const cookieStore = await cookies()
    const usertoken = cookieStore.get("token")?.value

    if (!usertoken) {
      return {
        success: false,
        error: "Non authentifié",
        timestamp: new Date().toISOString(),
      }
    }

    // Mise à jour du statut de l'opération
    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/epayments/${operationId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usertoken}`,
      },
      body: JSON.stringify({
        status: "CANCELLED",
      }),
    })

    if (!response.ok) {
      throw new Error("Erreur lors de l'annulation")
    }

    console.log(`[AUDIT] Annulation opération ${operationId} à ${new Date().toISOString()}`)

    return {
      success: true,
      message: `Opération ${operationId} annulée avec succès`,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Erreur lors de l'annulation:", error)

    return {
      success: false,
      error: "Impossible d'annuler l'opération. Veuillez réessayer.",
      timestamp: new Date().toISOString(),
    }
  }
}

// Relancer une opération échouée
export async function retryOperation(operationId: string) {
  try {
    const cookieStore = await cookies()
    const usertoken = cookieStore.get("token")?.value

    if (!usertoken) {
      return {
        success: false,
        error: "Non authentifié",
        timestamp: new Date().toISOString(),
      }
    }

    // Mise à jour du statut de l'opération pour la relancer
    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/epayments/${operationId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usertoken}`,
      },
      body: JSON.stringify({
        status: "PENDING",
      }),
    })

    if (!response.ok) {
      throw new Error("Erreur lors de la relance")
    }

    console.log(`[AUDIT] Relance opération ${operationId} à ${new Date().toISOString()}`)

    return {
      success: true,
      message: `Opération ${operationId} relancée avec succès`,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Erreur lors de la relance:", error)

    return {
      success: false,
      error: "Impossible de relancer l'opération. Vérifiez les conditions.",
      timestamp: new Date().toISOString(),
    }
  }
}

// Obtenir les détails d'une opération
export async function getOperationDetails(operationId: string) {
  try {
    const cookieStore = await cookies()
    const usertoken = cookieStore.get("token")?.value

    if (!usertoken) {
      return {
        success: false,
        error: "Non authentifié",
        timestamp: new Date().toISOString(),
      }
    }

    // Récupérer les détails de l'opération
    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/epayments/${operationId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usertoken}`,
      },
    })

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des détails")
    }

    const payment = await response.json()
    const status = (payment.status || "").toUpperCase()
    
    let mappedStatus: "pending" | "processing" | "failed" | "approval_required" = "pending"
    if (status === "PROCESSING" || status === "IN_PROGRESS") {
      mappedStatus = "processing"
    } else if (status === "FAILED" || status === "REJECTED") {
      mappedStatus = "failed"
    } else if (status === "APPROVAL_REQUIRED" || status === "AWAITING_APPROVAL") {
      mappedStatus = "approval_required"
    }

    // Fonction helper pour extraire du texte depuis un objet potentiellement chiffré
    const extractText = (value: any): string => {
      if (!value) return ""
      if (typeof value === "string") return value
      if (typeof value === "object" && (value.ct || value.iv)) {
        // Objet chiffré - retourner un placeholder
        return "[Chiffré]"
      }
      return String(value)
    }

    const operationDetails = {
      id: payment.id || payment.referenceOperation || operationId,
      type: "transfer" as const,
      description: extractText(payment.description) || extractText(payment.commentnotes) || "Virement",
      amount: Number(payment.montantOperation || 0),
      currency: "GNF",
      recipient: extractText(payment.nomBeneficiaire) || "",
      recipientAccount: extractText(payment.ribBeneficiaire) || "",
      status: mappedStatus,
      createdAt: payment.dateOrdre || payment.createdAt || new Date().toISOString(),
      estimatedCompletion: payment.dateExecution || undefined,
      steps: [
        {
          step: "Validation initiale",
          status: "completed",
          timestamp: payment.dateOrdre || new Date().toISOString(),
          description: "Vérification des informations de base",
        },
        {
          step: "Traitement bancaire",
          status: mappedStatus === "processing" ? "in_progress" : mappedStatus === "failed" ? "failed" : "pending",
          timestamp: payment.dateReception || undefined,
          description: "Traitement par le système bancaire",
        },
        {
          step: "Finalisation",
          status: "pending",
          description: "Confirmation finale et notification",
        },
      ],
      canCancel: mappedStatus === "pending" || mappedStatus === "approval_required",
      canRetry: mappedStatus === "failed",
    }

    return {
      success: true,
      data: operationDetails,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des détails:", error)

    return {
      success: false,
      error: "Impossible de récupérer les détails de l'opération",
      timestamp: new Date().toISOString(),
    }
  }
}
