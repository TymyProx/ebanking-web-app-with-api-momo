"use server"

import { z } from "zod"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://192.168.1.200:8080/api"
const TENANT_ID = "afa25e29-08dd-46b6-8ea2-d778cb2d6694"

// Schéma de validation pour les virements
const transferSchema = z.object({
  sourceAccount: z.string().min(1, "Le compte débiteur est requis"),
  beneficiaryId: z.string().min(1, "Le bénéficiaire est requis"),
  amount: z.string().refine((val) => Number.parseFloat(val) >= 1000, "Montant minimum: 1,000 GNF"),
  purpose: z.string().min(5, "Le motif doit contenir au moins 5 caractères"),
  transferDate: z.string().min(1, "La date d'exécution est requise"),
})

// Schéma de validation OTP
const otpSchema = z.object({
  otpCode: z.string().length(6, "Le code OTP doit contenir 6 chiffres"),
})

// Simulation des comptes pour validation du solde
const accounts = [
  { id: "1", balance: 2400000, currency: "GNF" },
  { id: "2", balance: 850000, currency: "GNF" },
  { id: "3", balance: 1250, currency: "USD" },
]

// Simulation des bénéficiaires
const beneficiaries = [
  { id: "1", type: "BNG-BNG", fee: 0 },
  { id: "2", type: "BNG-CONFRERE", fee: 2500 },
  { id: "3", type: "BNG-CONFRERE", fee: 2500 },
  { id: "4", type: "BNG-INTERNATIONAL", fee: 5000 },
]

// Stockage temporaire des OTP (en production, utiliser Redis ou base de données)
const otpStorage = new Map<string, { code: string; expires: Date; attempts: number }>()

// Action pour envoyer l'OTP
export async function sendOTP(prevState: any, formData: FormData) {
  try {
    const phone = formData.get("phone") as string
    const amount = formData.get("amount") as string

    // Simulation d'un délai d'envoi SMS
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Génération d'un code OTP aléatoire
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Stockage temporaire de l'OTP (5 minutes de validité)
    const expires = new Date(Date.now() + 5 * 60 * 1000)
    otpStorage.set(phone, { code: otpCode, expires, attempts: 0 })

    // Simulation d'une erreur d'envoi SMS (5% de chance)
    if (Math.random() < 0.05) {
      throw new Error("Erreur lors de l'envoi du SMS")
    }

    // Log pour le développement (en production, envoyer vraiment le SMS)
    console.log(`[SMS] Code OTP ${otpCode} envoyé au ${phone} pour virement de ${amount} GNF`)

    // Log d'audit
    console.log(`[AUDIT] OTP envoyé - Téléphone: ${phone} à ${new Date().toISOString()}`)

    return {
      success: true,
      message: `Code OTP envoyé au ${phone}`,
      // En développement seulement - ne jamais retourner le code en production
      devCode: otpCode,
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'OTP:", error)

    return {
      success: false,
      error: "Impossible d'envoyer le code OTP. Veuillez réessayer.",
    }
  }
}

// Action pour valider l'OTP
export async function validateOTP(prevState: any, formData: FormData) {
  try {
    const otpCode = formData.get("otpCode") as string
    const phone = "+224 622 123 456" // Numéro du client (normalement récupéré du profil)

    // Validation du format OTP
    const validatedOtp = otpSchema.parse({ otpCode })

    // Simulation d'un délai de validation
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Récupération de l'OTP stocké
    const storedOtp = otpStorage.get(phone)

    if (!storedOtp) {
      return {
        success: false,
        error: "Code OTP expiré ou inexistant. Demandez un nouveau code.",
      }
    }

    // Vérification de l'expiration
    if (new Date() > storedOtp.expires) {
      otpStorage.delete(phone)
      return {
        success: false,
        error: "Code OTP expiré. Demandez un nouveau code.",
      }
    }

    // Vérification du nombre de tentatives
    if (storedOtp.attempts >= 3) {
      otpStorage.delete(phone)
      return {
        success: false,
        error: "Trop de tentatives. Demandez un nouveau code.",
      }
    }

    // Validation du code
    if (validatedOtp.otpCode !== storedOtp.code) {
      storedOtp.attempts++
      return {
        success: false,
        error: `Code OTP incorrect. ${3 - storedOtp.attempts} tentative(s) restante(s).`,
      }
    }

    // Code valide - suppression de l'OTP
    otpStorage.delete(phone)

    // Log d'audit
    console.log(`[AUDIT] OTP validé avec succès - Téléphone: ${phone} à ${new Date().toISOString()}`)

    return {
      success: true,
      message: "Code OTP validé avec succès",
    }
  } catch (error) {
    console.error("Erreur lors de la validation OTP:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      }
    }

    return {
      success: false,
      error: "Erreur lors de la validation. Veuillez réessayer.",
    }
  }
}

function getTransactionType(beneficiaryType: string): string {
  switch (beneficiaryType) {
    case "BNG-BNG":
      return "INTERNAL_TRANSFER"
    case "BNG-CONFRERE":
      return "DOMESTIC_TRANSFER"
    case "BNG-INTERNATIONAL":
      return "INTERNATIONAL_TRANSFER"
    default:
      return "TRANSFER"
  }
}

// Action pour exécuter le virement
export async function executeTransfer(prevState: any, formData: FormData) {
  try {
    const data = {
      sourceAccount: formData.get("sourceAccount") as string,
      beneficiaryId: formData.get("beneficiaryId") as string,
      amount: formData.get("amount") as string,
      purpose: formData.get("purpose") as string,
      transferDate: formData.get("transferDate") as string,
    }

    // Validation des données
    const validatedData = transferSchema.parse(data)

    const transactionId = `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`

    const apiData = {
      data: {
        txnId: transactionId,
        accountId: validatedData.sourceAccount,
        txnType: getTransactionType("BNG-BNG"), // Par défaut, peut être déterminé dynamiquement
        amount: validatedData.amount,
        valueDate: new Date(validatedData.transferDate).toISOString(),
        status: "PENDING",
        description: validatedData.purpose,
      },
    }

    const cookieToken = (await cookies()).get("token")?.value
    const usertoken = cookieToken

    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usertoken}`,
      },
      body: JSON.stringify(apiData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.message || `❌ Erreur API: ${response.status} ${response.statusText}`,
      }
    }

    const result = await response.json()
    console.log("Virement exécuté via API:", result)

    console.log(
      `[AUDIT] Virement exécuté via API - ID: ${transactionId}, Montant: ${validatedData.amount} GNF, Compte: ${validatedData.sourceAccount} à ${new Date().toISOString()}`,
    )

    revalidatePath("/transfers/new")
    revalidatePath("/accounts")

    return {
      success: true,
      message: `✅ Virement de ${new Intl.NumberFormat("fr-FR").format(Number.parseFloat(validatedData.amount))} GNF effectué avec succès`,
      transactionId,
      amount: Number.parseFloat(validatedData.amount),
      executedAt: new Date().toISOString(),
      apiResponse: result,
    }
  } catch (error) {
    console.error("Erreur lors de l'exécution du virement:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      }
    }

    return {
      success: false,
      error: "❌ Erreur lors du traitement du virement. Veuillez réessayer.",
    }
  }
}

// Action pour vérifier la disponibilité d'un bénéficiaire
export async function validateBeneficiary(accountNumber: string, bankCode: string) {
  try {
    // Simulation d'une vérification auprès de la banque destinataire
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Simulation de validation (95% de succès)
    const isValid = Math.random() > 0.05

    if (!isValid) {
      return {
        success: false,
        error: "Compte bénéficiaire introuvable ou inactif",
      }
    }

    return {
      success: true,
      message: "Bénéficiaire validé avec succès",
      accountStatus: "ACTIVE",
    }
  } catch (error) {
    return {
      success: false,
      error: "Impossible de valider le bénéficiaire",
    }
  }
}

// Action pour calculer les frais de virement
export async function calculateTransferFees(beneficiaryType: string, amount: number) {
  try {
    let fee = 0

    switch (beneficiaryType) {
      case "BNG-BNG":
        fee = 0
        break
      case "BNG-CONFRERE":
        fee = 2500
        break
      case "BNG-INTERNATIONAL":
        fee = Math.max(5000, amount * 0.01) // 1% minimum 5000 GNF
        break
    }

    return {
      success: true,
      fee,
      total: amount + fee,
    }
  } catch (error) {
    return {
      success: false,
      error: "Erreur lors du calcul des frais",
    }
  }
}

export async function getTransactions(): Promise<any[]> {
  const cookieToken = (await cookies()).get("token")?.value
  const usertoken = cookieToken

  try {
    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/transaction`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usertoken}`,
      },
      cache: "no-store", // Always fetch fresh data
    })

    if (!response.ok) {
      console.error(`Erreur API: ${response.status} ${response.statusText}`)
      return []
    }

    const data = await response.json()
    // Retourne la réponse sous forme de tableau
    if (Array.isArray(data.rows)) {
      return data.rows
    }
    return Array.isArray(data) ? data : [data]
  } catch (error) {
    console.error("Erreur lors de la récupération des transactions:", error)
    return []
  }
}
