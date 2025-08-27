"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"

// Schéma de validation pour la génération de document
const documentGenerationSchema = z.object({
  type: z.enum(["attestation_solde", "attestation_compte", "demande_credit", "contrat_epargne"], {
    errorMap: () => ({ message: "Type de document invalide" }),
  }),
  accountId: z.string().min(1, "Le compte est requis"),
  amount: z.string().optional(),
  purpose: z.string().optional(),
  recipient: z.string().optional(),
  additionalInfo: z.string().optional(),
})

// Schéma de validation pour la signature de document
const documentSignatureSchema = z.object({
  documentId: z.string().min(1, "L'ID du document est requis"),
  method: z.enum(["otp", "biometric"], {
    errorMap: () => ({ message: "Méthode de signature invalide" }),
  }),
  otpCode: z.string().optional(),
})

// Schéma de validation pour la demande de crédit API
const creditRequestSchema = z.object({
  applicantName: z.string().min(1, "Le nom du demandeur est requis"),
  creditAmount: z.string().min(1, "Le montant du crédit est requis"),
  durationMonths: z.string().min(1, "La durée est requise"),
  purpose: z.string().min(1, "L'objet du crédit est requis"),
})

interface ActionResult {
  success: boolean
  message: string
  content?: string
  reference?: string
  downloadUrl?: string
  errors?: string[]
}

// Codes OTP prédéfinis pour la simulation
const VALID_OTP_CODES = ["123456", "654321", "111111", "000000"]

// Comptes disponibles pour les documents
const ACCOUNTS = {
  ACC001: { name: "Compte Courant - 1234567890", balance: "2,450,000 GNF" },
  ACC002: { name: "Compte Épargne - 0987654321", balance: "5,780,000 GNF" },
  ACC003: { name: "Compte Professionnel - 1122334455", balance: "12,300,000 GNF" },
}

export async function generateDocument(formData: FormData): Promise<ActionResult> {
  try {
    // Simuler un délai de génération
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Extraire et valider les données
    const rawData = {
      type: formData.get("type") as string,
      accountId: formData.get("accountId") as string,
      amount: formData.get("amount") as string,
      purpose: formData.get("purpose") as string,
      recipient: formData.get("recipient") as string,
      additionalInfo: formData.get("additionalInfo") as string,
    }

    // Validation avec Zod
    const validationResult = documentGenerationSchema.safeParse(rawData)

    if (!validationResult.success) {
      return {
        success: false,
        message: "Erreur de validation des données",
        errors: validationResult.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`),
      }
    }

    const data = validationResult.data

    // Vérifier que le compte existe
    const account = ACCOUNTS[data.accountId as keyof typeof ACCOUNTS]
    if (!account) {
      return {
        success: false,
        message: "Compte sélectionné invalide",
      }
    }

    // Simuler une erreur occasionnelle (3% de chance)
    if (Math.random() < 0.03) {
      return {
        success: false,
        message: "Erreur lors de la génération du document. Veuillez réessayer.",
      }
    }

    // Générer le contenu du document selon le type
    let documentContent = ""
    const currentDate = new Date().toLocaleDateString("fr-FR")

    switch (data.type) {
      case "attestation_solde":
        documentContent = `
ATTESTATION DE SOLDE

La Banque Nationale de Guinée certifie que le compte :
${account.name}

Présente un solde de : ${account.balance}
En date du : ${currentDate}

Motif : ${data.purpose || "Non spécifié"}
${data.recipient ? `Destinataire : ${data.recipient}` : ""}

Cette attestation est délivrée pour servir et valoir ce que de droit.
        `
        break

      case "attestation_compte":
        documentContent = `
ATTESTATION D'EXISTENCE DE COMPTE

La Banque Nationale de Guinée certifie que :
Titulaire : Utilisateur Demo
Compte : ${account.name}

Est titulaire d'un compte ouvert dans nos livres.

Motif : ${data.purpose || "Non spécifié"}
${data.recipient ? `Destinataire : ${data.recipient}` : ""}

Cette attestation est délivrée pour servir et valoir ce que de droit.
        `
        break

      case "demande_credit":
        documentContent = `
DEMANDE DE CRÉDIT

Demandeur : Utilisateur Demo
Compte : ${account.name}
Montant demandé : ${data.amount ? `${Number.parseInt(data.amount).toLocaleString()} GNF` : "Non spécifié"}

Objet du crédit : ${data.purpose || "Non spécifié"}

Informations complémentaires :
${data.additionalInfo || "Aucune"}

Date de la demande : ${currentDate}
        `
        break

      case "contrat_epargne":
        documentContent = `
CONTRAT D'ÉPARGNE

Titulaire : Utilisateur Demo
Compte de référence : ${account.name}
Montant initial : ${data.amount ? `${Number.parseInt(data.amount).toLocaleString()} GNF` : "Non spécifié"}

Conditions :
- Taux d'intérêt : 3.5% par an
- Durée minimale : 12 mois
- Versements libres

Informations complémentaires :
${data.additionalInfo || "Aucune"}

Date d'ouverture : ${currentDate}
        `
        break
    }

    console.log("📄 Document généré:", {
      type: data.type,
      accountId: data.accountId,
      timestamp: new Date().toISOString(),
    })

    return {
      success: true,
      message: "Document généré avec succès",
      content: documentContent.trim(),
    }
  } catch (error) {
    console.error("Erreur lors de la génération du document:", error)
    return {
      success: false,
      message: "Une erreur technique est survenue lors de la génération",
    }
  }
}

export async function sendOTP(): Promise<ActionResult> {
  try {
    // Simuler un délai d'envoi
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Simuler l'envoi d'OTP (3% de chance d'échec)
    if (Math.random() < 0.03) {
      return {
        success: false,
        message: "Erreur lors de l'envoi du code OTP. Veuillez réessayer.",
      }
    }

    console.log("📱 Code OTP envoyé pour signature électronique")

    return {
      success: true,
      message: "Code OTP envoyé par SMS",
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi OTP:", error)
    return {
      success: false,
      message: "Une erreur technique est survenue",
    }
  }
}

export async function signDocument(formData: FormData): Promise<ActionResult> {
  try {
    // Simuler un délai de signature
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Extraire et valider les données
    const rawData = {
      documentId: formData.get("documentId") as string,
      method: formData.get("method") as string,
      otpCode: formData.get("otpCode") as string,
    }

    // Validation avec Zod
    const validationResult = documentSignatureSchema.safeParse(rawData)

    if (!validationResult.success) {
      return {
        success: false,
        message: "Erreur de validation des données de signature",
        errors: validationResult.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`),
      }
    }

    const data = validationResult.data

    // Vérifier le code OTP si la méthode est OTP
    if (data.method === "otp") {
      if (!data.otpCode || !VALID_OTP_CODES.includes(data.otpCode)) {
        return {
          success: false,
          message:
            "Erreur lors de la signature. Veuillez vérifier le code de confirmation ou réessayer ultérieurement.",
        }
      }
    }

    // Simuler une erreur occasionnelle (2% de chance)
    if (Math.random() < 0.02) {
      return {
        success: false,
        message: "Erreur lors de la signature. Veuillez vérifier le code de confirmation ou réessayer ultérieurement.",
      }
    }

    // Générer une référence de signature
    const signatureReference = `SIG-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(
      Math.floor(Math.random() * 1000),
    ).padStart(3, "0")}`

    // Simuler la signature électronique
    const signatureData = {
      documentId: data.documentId,
      method: data.method,
      reference: signatureReference,
      timestamp: new Date().toISOString(),
      hash: `SHA256:${Math.random().toString(36).substring(2, 15)}`,
      certificate: `CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      signedBy: "demo@astrabng.com",
    }

    console.log("✍️ Document signé électroniquement:", signatureData)

    // Revalider la page pour mettre à jour l'interface
    revalidatePath("/services/signature")

    return {
      success: true,
      message: "Votre document a été généré et signé avec succès. Vous pouvez le télécharger ou l'envoyer par email.",
      reference: signatureReference,
      downloadUrl: `/documents/${data.documentId}-signed.pdf`,
    }
  } catch (error) {
    console.error("Erreur lors de la signature du document:", error)
    return {
      success: false,
      message: "Une erreur technique est survenue lors de la signature",
    }
  }
}

export async function submitCreditRequest(formData: FormData): Promise<ActionResult> {
  try {
    // Simuler un délai de traitement
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Extraire les données du formulaire
    const rawData = {
      applicantName: formData.get("applicantName") as string,
      creditAmount: formData.get("creditAmount") as string,
      durationMonths: formData.get("durationMonths") as string,
      purpose: formData.get("purpose") as string,
    }

    // Validation avec Zod
    const validationResult = creditRequestSchema.safeParse(rawData)

    if (!validationResult.success) {
      return {
        success: false,
        message: "Erreur de validation des données",
        errors: validationResult.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`),
      }
    }

    const data = validationResult.data

    // Récupérer les variables d'environnement
    const apiBaseUrl = process.env.API_BASE_URL
    const tenantId = process.env.TENANT_ID

    if (!apiBaseUrl || !tenantId) {
      console.error("Variables d'environnement manquantes:", { apiBaseUrl, tenantId })
      return {
        success: false,
        message: "Configuration du système incomplète",
      }
    }

    // Préparer le body de la requête
    const requestBody = {
      data: {
        applicantName: data.applicantName,
        creditAmount: data.creditAmount,
        durationMonths: data.durationMonths,
        purpose: data.purpose,
      },
    }

    console.log("[v0] Envoi demande de crédit:", requestBody)

    // Appel à l'API
    const response = await fetch(`${apiBaseUrl}/tenant/${tenantId}/demande-credit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    console.log("[v0] Réponse API demande crédit:", response.status)

    if (!response.ok) {
      console.error("Erreur API demande crédit:", response.status, response.statusText)
      return {
        success: false,
        message: "Erreur lors de l'envoi de la demande de crédit. Veuillez réessayer.",
      }
    }

    const responseData = await response.json()
    console.log("[v0] Données réponse demande crédit:", responseData)

    // Revalider la page pour mettre à jour l'interface
    revalidatePath("/services/signature")

    return {
      success: true,
      message: "Votre demande de crédit a été soumise avec succès. Vous recevrez une réponse sous 48h.",
      reference: `CREDIT-${Date.now()}`,
    }
  } catch (error) {
    console.error("Erreur lors de la soumission de la demande de crédit:", error)
    return {
      success: false,
      message: "Une erreur technique est survenue lors de l'envoi de la demande",
    }
  }
}
