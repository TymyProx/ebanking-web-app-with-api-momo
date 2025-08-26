"use server"

import { z } from "zod"

const serviceRequestSchema = z.object({
  serviceType: z.string().min(1, "Type de service requis"),
  accountId: z.string().min(1, "Compte requis"),
  formData: z.string().min(1, "Données du formulaire requises"),
})

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://192.168.1.200:8080/api"
const TENANT_ID = "afa25e29-08dd-46b6-8ea2-d778cb2d6694"

// ------------------ Helpers ------------------

async function getTenant(): Promise<string> {
  return process.env.TENANT_ID || TENANT_ID
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = process.env.API_TOKEN || ""
  if (!token) console.warn("[API] Aucun token fourni, utilisation de mock")
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "X-Tenant-ID": await getTenant(),
  }
}

// ------------------ Main Submit Function ------------------

export async function submitServiceRequest(prevState: any, formData: FormData) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const validatedFields = serviceRequestSchema.safeParse({
      serviceType: formData.get("serviceType"),
      accountId: formData.get("accountId"),
      formData: formData.get("formData"),
    })

    if (!validatedFields.success) {
      return { success: false, error: "Données invalides. Veuillez vérifier le formulaire." }
    }

    const { serviceType, accountId, formData: formDataString } = validatedFields.data
    const parsedFormData = JSON.parse(formDataString)

    const validationResult = validateServiceSpecificFields(serviceType, parsedFormData)
    if (!validationResult.success) return { success: false, error: validationResult.error }

    const apiResult = await callServiceAPI(serviceType, accountId, parsedFormData)

    if (!apiResult.success) return { success: false, error: apiResult.error || "Erreur lors de la soumission." }

    console.log(`[AUDIT] Nouvelle demande - Type: ${serviceType}, Compte: ${accountId}, Ref: ${apiResult.reference}`)

    return {
      success: true,
      reference: apiResult.reference,
      serviceType,
      processingTime: apiResult.processingTime,
      nextSteps: apiResult.nextSteps,
    }
  } catch (error) {
    console.error("Erreur lors de la soumission:", error)
    return { success: false, error: "Une erreur inattendue s'est produite. Veuillez réessayer." }
  }
}

// ------------------ API Router ------------------

async function callServiceAPI(serviceType: string, accountId: string, formData: any) {
  const headers = await getAuthHeaders()

  // Si token absent, on retourne un mock
  if (!headers.Authorization || headers.Authorization === "Bearer ") {
    console.warn(`[API] Token manquant, retour mock pour ${serviceType}`)
    return {
      success: true,
      reference: generateRequestReference(serviceType),
      processingTime: "2-3 jours",
      nextSteps: ["Validation interne", "Notification"],
    }
  }

  const endpointMap: Record<string, string> = {
    checkbook: "/api/requests/checkbook",
    certificate: "/api/requests/certificate",
    credit_personal: "/api/requests/credit/personal",
    credit_mortgage: "/api/requests/credit/mortgage",
    credit_auto: "/api/requests/credit/auto",
    credit_student: "/api/requests/credit/student",
    business_account: "/api/requests/account/business",
    card_request: "/api/requests/card",
    credit_request: "/api/credit-requests",
  }

  const endpoint = endpointMap[serviceType]
  if (!endpoint) return { success: false, error: `Type de service non supporté: ${serviceType}` }

  try {
    const requestPayload = { accountId, serviceType, ...formData, submittedAt: new Date().toISOString(), tenant: await getTenant() }

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
    return {
      success: false,
      error: "Erreur de connexion ou serveur API. Retour mock appliqué",
    }
  }
}

// ------------------ Validation ------------------

function validateServiceSpecificFields(serviceType: string, formData: any) {
  switch (serviceType) {
    case "credit_personal":
      if (!formData.loan_amount) return { success: false, error: "Montant du prêt requis" }
      if (!formData.loan_duration) return { success: false, error: "Durée requise" }
      if (!formData.loan_purpose) return { success: false, error: "Objet du crédit requis" }
      if (!formData.monthly_income) return { success: false, error: "Revenu mensuel requis" }
      if (!formData.employment_type) return { success: false, error: "Type d'emploi requis" }
      if (!formData.guarantor_name) return { success: false, error: "Garant requis" }
      break

    case "certificate":
      if (!formData.certificate_type) return { success: false, error: "Type d'attestation requis" }
      if (!formData.purpose) return { success: false, error: "Motif requis" }
      if (formData.purpose === "other" && !formData.purpose_details) return { success: false, error: "Précisez le motif" }
      break

    case "checkbook":
      if (!formData.checkbook_type) return { success: false, error: "Type de chéquier requis" }
      if (!formData.delivery_method) return { success: false, error: "Mode de livraison requis" }
      if (formData.delivery_method === "home" && !formData.delivery_address) return { success: false, error: "Adresse de livraison requise" }
      if (formData.delivery_method === "branch" && !formData.branch_location) return { success: false, error: "Agence de retrait requise" }
      break

    case "card_request":
      if (!formData.card_type) return { success: false, error: "Type de carte requis" }
      if (!formData.card_category) return { success: false, error: "Catégorie requise" }
      if (!formData.request_reason) return { success: false, error: "Motif requis" }
      if (formData.request_reason === "replacement" && !formData.incident_details) return { success: false, error: "Détails de l'incident requis" }
      if (!formData.delivery_method) return { success: false, error: "Mode de livraison requis" }
      break
  }

  if (!formData.contact_phone) return { success: false, error: "Numéro de téléphone requis" }
  if (!formData.contact_email) return { success: false, error: "Email requis" }
  if (!formData.terms) return { success: false, error: "Acceptation des conditions requise" }

  return { success: true }
}

// ------------------ Utils ------------------

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
    credit_request: "CREQ",
  }

  const prefix = prefixes[serviceType as keyof typeof prefixes] || "SRV"
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0")

  return `${prefix}${timestamp}${random}`
}

function getProcessingInfo(serviceType: string) {
  const processingInfo = {
    credit_request: { processingTime: "7-14 jours ouvrables", nextSteps: ["Étude du dossier", "Analyse de solvabilité", "Décision de crédit", "Notification"] },
  }

  return processingInfo[serviceType as keyof typeof processingInfo] || { processingTime: "5-7 jours ouvrables", nextSteps: ["Traitement de la demande", "Notification de la décision"] }
}
