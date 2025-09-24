"use server"
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { z } from "zod"

const serviceRequestSchema = z.object({
  serviceType: z.string().min(1, "Type de service requis"),
  accountId: z.string().min(1, "Compte requis"),
  formData: z.string().min(1, "Données du formulaire requises"),
})

export async function submitServiceRequest(prevState: any, formData: FormData) {
  try {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

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

    // Simulate random error (5% chance)
    if (Math.random() < 0.05) {
      return {
        success: false,
        error: "Erreur technique temporaire. Veuillez réessayer dans quelques minutes.",
      }
    }

    // Generate request reference
    const reference = generateRequestReference(serviceType)

    // Log the request for audit
    //console.log(
    //   `[AUDIT] Nouvelle demande de service - Type: ${serviceType}, Compte: ${accountId}, Référence: ${reference}`,
    // )
    //console.log(`[AUDIT] Données de la demande:`, parsedFormData)

    // Simulate business logic
    const processingInfo = getProcessingInfo(serviceType)

    return {
      success: true,
      reference,
      serviceType,
      processingTime: processingInfo.processingTime,
      nextSteps: processingInfo.nextSteps,
    }
  } catch (error) {
    console.error("Erreur lors de la soumission de la demande:", error)
    return {
      success: false,
      error: "Une erreur inattendue s'est produite. Veuillez réessayer.",
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
