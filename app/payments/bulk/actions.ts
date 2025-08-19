"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"

// Schéma de validation pour le fichier de paiement de masse
const bulkPaymentFileSchema = z.object({
  companyAccount: z.string().min(1, "Le compte entreprise est requis"),
  totalAmount: z.number().min(1, "Le montant total doit être supérieur à 0"),
  beneficiaryCount: z.number().min(1, "Le nombre de bénéficiaires doit être supérieur à 0"),
  paymentDate: z.string().min(1, "La date de paiement est requise"),
})

const bulkPaymentSchema = z.object({
  companyName: z.string().min(1, "Le nom de l'entreprise est requis"),
  companyAccount: z.string().min(1, "Le compte entreprise est requis"),
  totalAmount: z.number().min(1, "Le montant total doit être supérieur à 0"),
  beneficiaryCount: z.number().min(1, "Le nombre de bénéficiaires doit être supérieur à 0"),
  paymentDate: z.string().min(1, "La date de paiement est requise"),
  description: z.string().optional(),
  otpCode: z.string().length(6, "Le code OTP doit contenir 6 chiffres"),
})

interface ActionResult {
  success: boolean
  message: string
  reference?: string
  data?: any
  errors?: string[]
}

interface BeneficiaryData {
  nom: string
  prenom: string
  rib: string
  montant: number
  reference: string
}

// Codes OTP prédéfinis pour la simulation
const VALID_OTP_CODES = ["123456", "654321", "111111", "000000"]

// Simulation de données de bénéficiaires pour le fichier Excel
const SAMPLE_BENEFICIARIES: BeneficiaryData[] = [
  {
    nom: "DIALLO",
    prenom: "Mamadou",
    rib: "GN001234567890123456",
    montant: 850000,
    reference: "SAL202501001",
  },
  {
    nom: "BAH",
    prenom: "Aissatou",
    rib: "GN001234567890123457",
    montant: 750000,
    reference: "SAL202501002",
  },
  {
    nom: "CAMARA",
    prenom: "Ibrahima",
    rib: "GN001234567890123458",
    montant: 920000,
    reference: "SAL202501003",
  },
  {
    nom: "TOURE",
    prenom: "Fatoumata",
    rib: "GN001234567890123459",
    montant: 680000,
    reference: "SAL202501004",
  },
  {
    nom: "SOW",
    prenom: "Ousmane",
    rib: "GN001234567890123460",
    montant: 1100000,
    reference: "SAL202501005",
  },
]

// Fonction pour valider le nom (pas de caractères spéciaux)
function validateName(name: string): boolean {
  const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/
  return nameRegex.test(name)
}

// Fonction pour valider le RIB guinéen
function validateRIB(rib: string): boolean {
  const ribRegex = /^GN\d{18}$/
  return ribRegex.test(rib)
}

export async function uploadBulkPaymentFile(formData: FormData): Promise<ActionResult> {
  try {
    // Simuler un délai de traitement du fichier
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const file = formData.get("file") as File
    const companyAccount = formData.get("companyAccount") as string
    const totalAmount = Number.parseFloat(formData.get("totalAmount") as string) || 0
    const beneficiaryCount = Number.parseInt(formData.get("beneficiaryCount") as string) || 0
    const paymentDate = formData.get("paymentDate") as string

    // Validation des paramètres de base
    const validationResult = bulkPaymentFileSchema.safeParse({
      companyAccount,
      totalAmount,
      beneficiaryCount,
      paymentDate,
    })

    if (!validationResult.success) {
      return {
        success: false,
        message: "Paramètres de validation invalides",
        errors: validationResult.error.errors.map((err) => err.message),
      }
    }

    // Vérifier l'extension du fichier
    if (!file) {
      return {
        success: false,
        message: "Aucun fichier sélectionné",
      }
    }

    const allowedExtensions = [".xlsx", ".xls"]
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))

    if (!allowedExtensions.includes(fileExtension)) {
      return {
        success: false,
        message: "Erreur : Le fichier doit être au format Excel (.xlsx ou .xls)",
      }
    }

    // Simuler la lecture du fichier Excel et générer des données de test
    const beneficiaries = SAMPLE_BENEFICIARIES.slice(0, Math.min(beneficiaryCount, SAMPLE_BENEFICIARIES.length))

    // Ajuster les montants pour correspondre au total demandé
    if (beneficiaries.length > 0) {
      const currentTotal = beneficiaries.reduce((sum, b) => sum + b.montant, 0)
      const ratio = totalAmount / currentTotal
      beneficiaries.forEach((b) => {
        b.montant = Math.round(b.montant * ratio)
      })
    }

    // Validation des données du fichier
    const errors: string[] = []

    // Vérifier le format du fichier (colonnes obligatoires)
    const requiredColumns = ["Nom", "Prénom", "RIB", "Montant", "Référence"]
    // Simulation : on suppose que le fichier a les bonnes colonnes

    // Vérifier chaque bénéficiaire
    for (let i = 0; i < beneficiaries.length; i++) {
      const beneficiary = beneficiaries[i]

      // Vérifier les noms (pas de caractères spéciaux)
      if (!validateName(beneficiary.nom)) {
        errors.push(`Ligne ${i + 2}: Nom invalide : les caractères spéciaux ne sont pas autorisés (${beneficiary.nom})`)
      }

      if (!validateName(beneficiary.prenom)) {
        errors.push(
          `Ligne ${i + 2}: Prénom invalide : les caractères spéciaux ne sont pas autorisés (${beneficiary.prenom})`,
        )
      }

      // Vérifier le RIB
      if (!validateRIB(beneficiary.rib)) {
        errors.push(`Ligne ${i + 2}: Format de RIB invalide (${beneficiary.rib})`)
      }

      // Vérifier le montant
      if (beneficiary.montant <= 0) {
        errors.push(`Ligne ${i + 2}: Le montant doit être supérieur à 0`)
      }
    }

    // Vérifier la cohérence du nombre de bénéficiaires
    if (beneficiaries.length !== beneficiaryCount) {
      errors.push("Incohérence détectée entre les informations saisies et le fichier téléversé.")
    }

    // Vérifier la cohérence du montant total
    const fileTotal = beneficiaries.reduce((sum, b) => sum + b.montant, 0)
    const tolerance = Math.abs(fileTotal - totalAmount)
    if (tolerance > 1000) {
      // Tolérance de 1000 GNF pour les arrondis
      errors.push("Incohérence détectée entre les informations saisies et le fichier téléversé.")
    }

    // Vérifier la date de paiement
    const paymentDateObj = new Date(paymentDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (paymentDateObj < today) {
      errors.push("Date de paiement invalide. Veuillez choisir une date ultérieure.")
    }

    // Simuler une erreur occasionnelle (5% de chance)
    if (Math.random() < 0.05) {
      errors.push("Erreur : Le fichier doit contenir les colonnes obligatoires (Nom, RIB, Montant, etc.)")
    }

    if (errors.length > 0) {
      return {
        success: false,
        message: "Une ou plusieurs erreurs ont été détectées. Merci de corriger les points suivants :",
        errors,
      }
    }

    console.log("📊 Fichier Excel validé avec succès:", {
      fileName: file.name,
      beneficiaryCount: beneficiaries.length,
      totalAmount: fileTotal,
    })

    return {
      success: true,
      message: "Votre fichier a été vérifié avec succès. Paiement de masse en cours de traitement.",
      data: {
        beneficiaries,
        totalAmount: fileTotal,
        beneficiaryCount: beneficiaries.length,
      },
    }
  } catch (error) {
    console.error("Erreur lors de la validation du fichier:", error)
    return {
      success: false,
      message: "Erreur lors du traitement du fichier",
    }
  }
}

export async function validateBulkPayment(formData: FormData): Promise<ActionResult> {
  try {
    // Simuler un délai de traitement
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Simuler l'envoi d'OTP (3% de chance d'échec)
    if (Math.random() < 0.03) {
      return {
        success: false,
        message: "Erreur lors de l'envoi du code OTP. Veuillez réessayer.",
      }
    }

    console.log("📱 Code OTP envoyé pour validation de paiement de masse")

    return {
      success: true,
      message: "Code OTP envoyé avec succès",
    }
  } catch (error) {
    console.error("Erreur lors de la validation OTP:", error)
    return {
      success: false,
      message: "Une erreur technique est survenue",
    }
  }
}

export async function processBulkPayment(formData: FormData): Promise<ActionResult> {
  try {
    // Simuler un délai de traitement
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Extraire et valider les données
    const rawData = {
      companyName: formData.get("companyName") as string,
      companyAccount: formData.get("companyAccount") as string,
      totalAmount: Number.parseFloat(formData.get("totalAmount") as string) || 0,
      beneficiaryCount: Number.parseInt(formData.get("beneficiaryCount") as string) || 0,
      paymentDate: formData.get("paymentDate") as string,
      description: formData.get("description") as string,
      otpCode: formData.get("otpCode") as string,
    }

    // Validation avec Zod
    const validationResult = bulkPaymentSchema.safeParse(rawData)

    if (!validationResult.success) {
      return {
        success: false,
        message: "Une ou plusieurs erreurs ont été détectées. Merci de corriger les points suivants :",
        errors: validationResult.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`),
      }
    }

    const data = validationResult.data

    // Vérifier le code OTP
    if (!VALID_OTP_CODES.includes(data.otpCode)) {
      return {
        success: false,
        message: "Code OTP invalide. Veuillez vérifier le code reçu.",
      }
    }

    // Simuler une erreur occasionnelle (2% de chance)
    if (Math.random() < 0.02) {
      return {
        success: false,
        message: "Une ou plusieurs erreurs ont été détectées. Merci de corriger les points suivants : [Erreur système]",
      }
    }

    // Générer une référence unique
    const reference = `BATCH${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(
      Math.floor(Math.random() * 1000),
    ).padStart(3, "0")}`

    // Simuler l'enregistrement du batch de paiement
    const batchData = {
      reference,
      companyName: data.companyName,
      companyAccount: data.companyAccount,
      totalAmount: data.totalAmount,
      beneficiaryCount: data.beneficiaryCount,
      paymentDate: data.paymentDate,
      description: data.description,
      status: "en_cours",
      createdAt: new Date().toISOString(),
      createdBy: "demo@astrabng.com",
    }

    console.log("💳 Paiement de masse traité:", batchData)

    // Revalider la page pour mettre à jour l'interface
    revalidatePath("/payments/bulk")

    return {
      success: true,
      message: "Paiement confirmé. Référence : " + reference + ".",
      reference,
      data: batchData,
    }
  } catch (error) {
    console.error("Erreur lors du traitement du paiement de masse:", error)
    return {
      success: false,
      message: "Une erreur technique est survenue lors du traitement",
    }
  }
}
