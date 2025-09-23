"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"

// Schéma de validation pour la mise à disposition de fonds
const fundsProvisionSchema = z.object({
  amount: z.number().min(1, "Le montant doit être strictement supérieur à zéro"),
  sourceAccount: z.string().min(1, "Le compte source est requis"),
  destinationAccount: z.string().regex(/^GN\d{18}$/, "Format de RIB invalide"),
  destinationName: z.string().min(1, "Le nom du bénéficiaire est requis"),
  purpose: z.string().min(1, "L'objet du versement est requis"),
  recoveryMode: z.enum(["cash", "transfer", "card"], {
    errorMap: () => ({ message: "Mode de récupération invalide" }),
  }),
  provisionDate: z.string().min(1, "La date de mise à disposition est requise"),
  hasBlocking: z.boolean(),
  blockingEndDate: z.string().optional(),
  description: z.string().optional(),
  otpCode: z.string().length(6, "Le code OTP doit contenir 6 chiffres"),
})

const otpValidationSchema = z.object({
  phone: z.string().optional(),
  email: z.string().optional(),
})

interface ActionResult {
  success: boolean
  message: string
  reference?: string
  data?: any
  errors?: string[]
}

// Codes OTP prédéfinis pour la simulation
const VALID_OTP_CODES = ["123456", "654321", "111111", "000000"]

// Comptes entreprise simulés avec leurs soldes
const COMPANY_ACCOUNTS = {
  GN001234567890123456: { balance: 8450000, name: "Compte Principal" },
  GN001234567890123457: { balance: 12200000, name: "Compte Opérations" },
  GN001234567890123458: { balance: 3800000, name: "Compte Avances" },
}

// Plafonds de mise à disposition
const DAILY_LIMIT = 15000000 // 15M GNF par jour
const MONTHLY_LIMIT = 100000000 // 100M GNF par mois

// Simulation du suivi des utilisations (en production, ceci serait en base de données)
let dailyUsage = 2500000 // 2.5M GNF déjà utilisé aujourd'hui
let monthlyUsage = 15000000 // 15M GNF utilisé ce mois

export async function validateFundsProvision(formData: FormData): Promise<ActionResult> {
  try {
    // Simuler un délai de traitement
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const validationResult = otpValidationSchema.safeParse({
      phone: formData.get("phone"),
      email: formData.get("email"),
    })

    if (!validationResult.success) {
      return {
        success: false,
        message: "Erreur de validation des données",
        errors: validationResult.error.errors.map((err) => err.message),
      }
    }

    // Simuler l'envoi d'OTP (3% de chance d'échec)
    if (Math.random() < 0.03) {
      return {
        success: false,
        message: "Erreur lors de l'envoi du code OTP. Veuillez réessayer.",
      }
    }

    //console.log("📱 Code OTP envoyé pour validation de mise à disposition")

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

export async function createFundsProvision(formData: FormData): Promise<ActionResult> {
  try {
    // Simuler un délai de traitement
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Extraire et valider les données
    const rawData = {
      amount: Number.parseFloat(formData.get("amount") as string) || 0,
      sourceAccount: formData.get("sourceAccount") as string,
      destinationAccount: formData.get("destinationAccount") as string,
      destinationName: formData.get("destinationName") as string,
      purpose: formData.get("purpose") as string,
      recoveryMode: formData.get("recoveryMode") as string,
      provisionDate: formData.get("provisionDate") as string,
      hasBlocking: formData.get("hasBlocking") === "true",
      blockingEndDate: formData.get("blockingEndDate") as string,
      description: formData.get("description") as string,
      otpCode: formData.get("otpCode") as string,
    }

    // Validation avec Zod
    const validationResult = fundsProvisionSchema.safeParse(rawData)

    if (!validationResult.success) {
      return {
        success: false,
        message: "Erreur de validation. Veuillez vérifier les informations saisies.",
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

    // Vérifier le solde du compte source
    const sourceAccountInfo = COMPANY_ACCOUNTS[data.sourceAccount as keyof typeof COMPANY_ACCOUNTS]
    if (!sourceAccountInfo) {
      return {
        success: false,
        message: "Compte source invalide.",
      }
    }

    if (sourceAccountInfo.balance < data.amount) {
      return {
        success: false,
        message: "Fonds insuffisants sur le compte source.",
      }
    }

    // Vérifier les limites de mise à disposition
    if (dailyUsage + data.amount > DAILY_LIMIT) {
      return {
        success: false,
        message: "Vous avez atteint le plafond de mise à disposition autorisé pour cette période.",
      }
    }

    // Vérifier la cohérence des dates si blocage activé
    if (data.hasBlocking && data.blockingEndDate) {
      const provisionDate = new Date(data.provisionDate)
      const blockingEndDate = new Date(data.blockingEndDate)

      if (blockingEndDate <= provisionDate) {
        return {
          success: false,
          message: "La date de fin de blocage doit être postérieure à la date de mise à disposition.",
        }
      }
    }

    // Simuler une erreur occasionnelle (2% de chance)
    if (Math.random() < 0.02) {
      return {
        success: false,
        message: "Erreur de validation. Veuillez vérifier les informations saisies.",
      }
    }

    // Générer une référence unique
    const reference = `DISP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(
      Math.floor(Math.random() * 1000),
    ).padStart(3, "0")}`

    // Mettre à jour les utilisations (simulation)
    dailyUsage += data.amount
    monthlyUsage += data.amount

    // Simuler l'enregistrement de la transaction
    const provisionData = {
      reference,
      amount: data.amount,
      sourceAccount: data.sourceAccount,
      destinationAccount: data.destinationAccount,
      destinationName: data.destinationName,
      purpose: data.purpose,
      recoveryMode: data.recoveryMode,
      provisionDate: data.provisionDate,
      hasBlocking: data.hasBlocking,
      blockingEndDate: data.blockingEndDate,
      description: data.description,
      status: data.hasBlocking ? "avec_blocage" : "effective",
      createdAt: new Date().toISOString(),
      createdBy: "demo@astrabng.com",
    }

    //console.log("💰 Mise à disposition créée:", provisionData)

    // Revalider la page pour mettre à jour l'interface
    revalidatePath("/services/funds-provision")

    return {
      success: true,
      message: "Mise à disposition validée. Les fonds seront accessibles selon les conditions définies.",
      reference,
      data: provisionData,
    }
  } catch (error) {
    console.error("Erreur lors de la création de la mise à disposition:", error)
    return {
      success: false,
      message: "Une erreur technique est survenue lors du traitement",
    }
  }
}

// Fonction utilitaire pour obtenir les limites actuelles
export async function getCurrentLimits(): Promise<{
  dailyLimit: number
  dailyUsed: number
  dailyAvailable: number
  monthlyLimit: number
  monthlyUsed: number
  monthlyAvailable: number
}> {
  return {
    dailyLimit: DAILY_LIMIT,
    dailyUsed: dailyUsage,
    dailyAvailable: DAILY_LIMIT - dailyUsage,
    monthlyLimit: MONTHLY_LIMIT,
    monthlyUsed: monthlyUsage,
    monthlyAvailable: MONTHLY_LIMIT - monthlyUsage,
  }
}
