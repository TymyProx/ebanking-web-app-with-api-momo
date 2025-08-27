"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

export interface ApiCreditRequest {
  id: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  createdById: string
  updatedById: string
  importHash?: string
  tenantId: string
  applicantName: string
  creditAmount: string
  durationMonths: string
  purpose: string
  status?: "En cours" | "Approuvée" | "Rejetée" | "En attente de documents"
}

export interface ActionResult {
  success?: boolean
  error?: string
  message?: string
}

const serviceRequestSchema = z.object({
  serviceType: z.string().min(1, "Type de service requis"),
  accountId: z.string().min(1, "Compte requis"),
  formData: z.string().min(1, "Données du formulaire requises"),
})

const API_BASE_URL = "http://192.168.1.200:8080/api" //process.env.NEXT_PUBLIC_API_BASE_URL
const TENANT_ID = "11cacc69-5a49-4f01-8b16-e8f473746634"

// Get tenant from user session or environment
async function getTenant(): Promise<string> {
  // TODO: Implement tenant retrieval from user session/JWT
  return process.env.TENANT_ID || "default-tenant"
}

// Get authorization headers
async function getAuthHeaders(): Promise<Record<string, string>> {
  // TODO: Implement token retrieval from session/cookies
  const token = process.env.API_TOKEN || ""
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "X-Tenant-ID": await getTenant(),
  }
}

export async function getServiceRequests(accountId?: string) {
  try {
    const headers = await getAuthHeaders()
    const url = new URL(`${API_BASE_URL}/api/requests`)

    if (accountId) {
      url.searchParams.append("accountId", accountId)
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return {
      success: true,
      data: data.requests || [],
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des demandes:", error)
    return {
      success: false,
      error: "Impossible de récupérer les demandes. Veuillez réessayer.",
    }
  }
}

export async function getUserAccounts() {
  try {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/api/accounts`, {
      method: "GET",
      headers,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return {
      success: true,
      data: data.accounts || [],
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des comptes:", error)
    return {
      success: false,
      error: "Impossible de récupérer les comptes. Veuillez réessayer.",
    }
  }
}

export async function submitServiceRequest(prevState: any, formData: FormData) {
  try {
    // Simulate processing delay for UX
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const validatedFields = serviceRequestSchema.safeParse({
      serviceType: formData.get("serviceType"),
      accountId: formData.get("accountId"),
      formData: formData.get("formData"),
    })

    if (!validatedFields.success) {
      return {
        success: false,
        error: "Données invalides. Veuillez vérifier le formulaire.",
      }
    }

    const { serviceType, accountId, formData: formDataString } = validatedFields.data
    const parsedFormData = JSON.parse(formDataString)

    // Validate required fields based on service type
    const validationResult = validateServiceSpecificFields(serviceType, parsedFormData)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error,
      }
    }

    const apiResult = await callServiceAPI(serviceType, accountId, parsedFormData)

    if (!apiResult.success) {
      return {
        success: false,
        error: apiResult.error || "Erreur lors de la soumission de la demande.",
      }
    }

    // Log the request for audit
    console.log(
      `[AUDIT] Nouvelle demande de service - Type: ${serviceType}, Compte: ${accountId}, Référence: ${apiResult.reference}`,
    )

    return {
      success: true,
      reference: apiResult.reference,
      serviceType,
      processingTime: apiResult.processingTime,
      nextSteps: apiResult.nextSteps,
    }
  } catch (error) {
    console.error("Erreur lors de la soumission de la demande:", error)
    return {
      success: false,
      error: "Une erreur inattendue s'est produite. Veuillez réessayer.",
    }
  }
}

async function callServiceAPI(serviceType: string, accountId: string, formData: any) {
  const headers = await getAuthHeaders()

  // Map service types to API endpoints
  const endpointMap: Record<string, string> = {
    checkbook: "/api/requests/checkbook",
    certificate: "/api/requests/certificate",
    credit_personal: "/api/requests/credit/personal",
    credit_mortgage: "/api/requests/credit/mortgage",
    credit_auto: "/api/requests/credit/auto",
    credit_student: "/api/requests/credit/student",
    business_account: "/api/requests/account/business",
    card_request: "/api/requests/card",
  }

  const endpoint = endpointMap[serviceType]
  if (!endpoint) {
    return {
      success: false,
      error: `Type de service non supporté: ${serviceType}`,
    }
  }

  try {
    const requestPayload = {
      accountId,
      serviceType,
      ...formData,
      submittedAt: new Date().toISOString(),
      tenant: await getTenant(),
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestPayload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    return {
      success: true,
      reference: result.reference || generateRequestReference(serviceType),
      processingTime: result.processingTime || getProcessingInfo(serviceType).processingTime,
      nextSteps: result.nextSteps || getProcessingInfo(serviceType).nextSteps,
    }
  } catch (error) {
    console.error(`Erreur API pour ${serviceType}:`, error)

    // Return specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes("401")) {
        return { success: false, error: "Session expirée. Veuillez vous reconnecter." }
      }
      if (error.message.includes("403")) {
        return { success: false, error: "Accès non autorisé pour ce type de demande." }
      }
      if (error.message.includes("429")) {
        return { success: false, error: "Trop de demandes. Veuillez patienter avant de réessayer." }
      }
      if (error.message.includes("500")) {
        return { success: false, error: "Erreur serveur temporaire. Veuillez réessayer plus tard." }
      }
    }

    return {
      success: false,
      error: "Erreur de connexion à l'API. Veuillez vérifier votre connexion et réessayer.",
    }
  }
}

export async function getRequestStatus(requestId: string) {
  try {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/status`, {
      method: "GET",
      headers,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return {
      success: true,
      data: data.status,
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du statut:", error)
    return {
      success: false,
      error: "Impossible de récupérer le statut de la demande.",
    }
  }
}

export async function downloadRequestDocument(requestId: string, documentType: string) {
  try {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/documents/${documentType}`, {
      method: "GET",
      headers: {
        ...headers,
        Accept: "application/pdf",
      },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const blob = await response.blob()
    return {
      success: true,
      data: blob,
      filename: `${requestId}_${documentType}.pdf`,
    }
  } catch (error) {
    console.error("Erreur lors du téléchargement:", error)
    return {
      success: false,
      error: "Impossible de télécharger le document.",
    }
  }
}

function validateServiceSpecificFields(serviceType: string, formData: any) {
  switch (serviceType) {
    case "checkbook":
      if (!formData.checkbook_type) {
        return { success: false, error: "Type de chéquier requis" }
      }
      if (!formData.delivery_method) {
        return { success: false, error: "Mode de livraison requis" }
      }
      if (formData.delivery_method === "home" && !formData.delivery_address) {
        return { success: false, error: "Adresse de livraison requise" }
      }
      if (formData.delivery_method === "branch" && !formData.branch_location) {
        return { success: false, error: "Agence de retrait requise" }
      }
      break

    case "certificate":
      if (!formData.certificate_type) {
        return { success: false, error: "Type d'attestation requis" }
      }
      if (!formData.purpose) {
        return { success: false, error: "Motif de la demande requis" }
      }
      if (formData.purpose === "other" && !formData.purpose_details) {
        return { success: false, error: "Précision du motif requise" }
      }
      if (!formData.language) {
        return { success: false, error: "Langue du document requise" }
      }
      if (!formData.recipient) {
        return { success: false, error: "Destinataire requis" }
      }
      break

    case "credit_personal":
      if (!formData.loan_amount || Number.parseFloat(formData.loan_amount) < 500000) {
        return { success: false, error: "Montant minimum: 500,000 GNF" }
      }
      if (!formData.loan_duration) {
        return { success: false, error: "Durée du crédit requise" }
      }
      if (!formData.loan_purpose) {
        return { success: false, error: "Objet du crédit requis" }
      }
      if (!formData.monthly_income || Number.parseFloat(formData.monthly_income) < 300000) {
        return { success: false, error: "Revenus mensuels minimum: 300,000 GNF" }
      }
      if (!formData.employment_type) {
        return { success: false, error: "Type d'emploi requis" }
      }
      if (!formData.employer) {
        return { success: false, error: "Employeur requis" }
      }
      if (!formData.guarantor_name) {
        return { success: false, error: "Nom du garant requis" }
      }
      if (!formData.guarantor_phone) {
        return { success: false, error: "Téléphone du garant requis" }
      }
      break

    case "card_request":
      if (!formData.card_type) {
        return { success: false, error: "Type de carte requis" }
      }
      if (!formData.card_category) {
        return { success: false, error: "Catégorie de carte requise" }
      }
      if (!formData.request_reason) {
        return { success: false, error: "Motif de la demande requis" }
      }
      if (formData.request_reason === "replacement" && !formData.incident_details) {
        return { success: false, error: "Détails de l'incident requis" }
      }
      if (!formData.delivery_method) {
        return { success: false, error: "Mode de livraison requis" }
      }
      break
  }

  // Common validations
  if (!formData.contact_phone) {
    return { success: false, error: "Numéro de téléphone requis" }
  }
  if (!formData.contact_email) {
    return { success: false, error: "Adresse email requise" }
  }
  if (!formData.terms) {
    return { success: false, error: "Acceptation des conditions requise" }
  }

  // Validate phone format
  const phoneRegex = /^\+224\s?[67]\d{8}$/
  if (!phoneRegex.test(formData.contact_phone)) {
    return { success: false, error: "Format de téléphone invalide (+224 6XX XXX XXX)" }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.contact_email)) {
    return { success: false, error: "Format d'email invalide" }
  }

  return { success: true }
}

function generateRequestReference(serviceType: string) {
  const prefixes = {
    checkbook: "CHQ",
    certificate: "ATT",
    credit_personal: "CRP",
    credit_mortgage: "CRM",
    credit_auto: "CRA",
    credit_student: "CRS",
    business_account: "BUS",
    card_request: "CAR",
  }

  const prefix = prefixes[serviceType as keyof typeof prefixes] || "SRV"
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")

  return `${prefix}${timestamp}${random}`
}

function getProcessingInfo(serviceType: string) {
  const processingInfo = {
    checkbook: {
      processingTime: "3-5 jours ouvrables",
      nextSteps: ["Vérification de votre compte", "Préparation du chéquier", "Notification de disponibilité"],
    },
    certificate: {
      processingTime: "24-48 heures",
      nextSteps: ["Vérification des informations", "Génération du document", "Envoi par email sécurisé"],
    },
    credit_personal: {
      processingTime: "5-10 jours ouvrables",
      nextSteps: ["Étude de votre dossier", "Vérification des garanties", "Décision de crédit", "Signature du contrat"],
    },
    credit_mortgage: {
      processingTime: "15-30 jours ouvrables",
      nextSteps: [
        "Évaluation du bien",
        "Étude de faisabilité",
        "Validation du comité de crédit",
        "Finalisation du dossier",
      ],
    },
    credit_auto: {
      processingTime: "3-7 jours ouvrables",
      nextSteps: ["Vérification du devis", "Étude de solvabilité", "Validation du financement", "Déblocage des fonds"],
    },
    credit_student: {
      processingTime: "5-10 jours ouvrables",
      nextSteps: [
        "Vérification des documents académiques",
        "Validation du garant",
        "Approbation du crédit",
        "Mise en place du financement",
      ],
    },
    business_account: {
      processingTime: "7-14 jours ouvrables",
      nextSteps: [
        "Vérification des documents légaux",
        "Validation KYC/AML",
        "Ouverture du compte",
        "Activation des services",
      ],
    },
    card_request: {
      processingTime: "7-10 jours ouvrables",
      nextSteps: ["Validation de la demande", "Production de la carte", "Activation sécurisée", "Livraison"],
    },
  }

  return (
    processingInfo[serviceType as keyof typeof processingInfo] || {
      processingTime: "5-7 jours ouvrables",
      nextSteps: ["Traitement de votre demande", "Notification de la décision"],
    }
  )
}
