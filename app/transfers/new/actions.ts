"use server"
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
import { z } from "zod"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { config } from "@/lib/config"
import { getAccounts as fetchAccounts } from "../../accounts/actions"
import { getBeneficiaries as fetchBeneficiaries } from "../beneficiaries/actions"

import { getApiBaseUrl, TENANT_ID } from "@/lib/api-url"

const API_BASE_URL = getApiBaseUrl()

interface CurrentUserInfo {
  id: string | null
  fullName?: string
}

interface ActionSecurityContext {
  token?: string
  currentUser?: CurrentUserInfo | null
  allowedAccountIds?: Set<string>
}

interface BeneficiarySecurityContext extends ActionSecurityContext {
  allowedBeneficiaryIds?: Set<string>
}

async function getCurrentUserInfo(token?: string): Promise<CurrentUserInfo | null> {
  const cookieToken = token ?? (await cookies()).get("token")?.value
  if (!cookieToken) {
    return null
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookieToken}`,
      },
    })

    if (!response.ok) {
      console.error(`[v0] Unable to retrieve current user info: ${response.status} ${response.statusText}`)
      return null
    }

    const userData = await response.json()
    return {
      id: userData?.id ?? null,
      fullName: userData?.fullName ?? userData?.name ?? undefined,
    }
  } catch (error) {
    console.error("[v0] Error while fetching current user info:", error)
    return null
  }
}

function extractAccountOwnerId(account: any): string | null {
  if (!account || typeof account !== "object") {
    return null
  }

  return account.clientId ?? account.customerId ?? account.client?.id ?? account.ownerId ?? account.createdById ?? null
}

function extractBeneficiaryOwnerId(beneficiary: any): string | null {
  if (!beneficiary || typeof beneficiary !== "object") {
    return null
  }

  return beneficiary.clientId ?? beneficiary.createdById ?? null
}

function buildAllowedAccountIdSet(accounts: any[]): Set<string> {
  const ids = new Set<string>()
  for (const account of accounts || []) {
    if (account?.id) {
      ids.add(String(account.id))
    }
    if (account?.accountId) {
      ids.add(String(account.accountId))
    }
  }
  return ids
}

// Schéma de validation pour les virements
const transferSchema = z
  .object({
    sourceAccount: z.string().min(1, "Le compte débiteur est requis"),
    transferType: z.enum(["account-to-account", "account-to-beneficiary"]),
    beneficiaryId: z.string().optional(), // Optionnel pour les virements compte à compte
    targetAccount: z.string().optional(), // Pour les virements compte à compte
    amount: z.string().refine((val) => Number.parseFloat(val) >= 1000, "Montant minimum: 1,000 GNF"),
    purpose: z.string().min(5, "Le motif doit contenir au moins 5 caractères"),
    transferDate: z.string().min(1, "La date d'exécution est requise"),
  })
  .refine(
    (data) => {
      if (data.transferType === "account-to-beneficiary") {
        return data.beneficiaryId && data.beneficiaryId.length > 0
      }
      return true // Pas de validation du beneficiaryId pour account-to-account
    },
    {
      message: "Veuillez sélectionner un bénéficiaire",
      path: ["beneficiaryId"],
    },
  )
  .refine(
    (data) => {
      if (data.transferType === "account-to-account") {
        return data.targetAccount && data.targetAccount.length > 0
      }
      return true // Pas de validation du targetAccount pour account-to-beneficiary
    },
    {
      message: "Veuillez sélectionner un compte destinataire",
      path: ["targetAccount"],
    },
  )

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
    //console.log(`[SMS] Code OTP ${otpCode} envoyé au ${phone} pour virement de ${amount} GNF`)

    // Log d'audit
    //console.log(`[AUDIT] OTP envoyé - Téléphone: ${phone} à ${new Date().toISOString()}`)

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
    //console.log(`[AUDIT] OTP validé avec succès - Téléphone: ${phone} à ${new Date().toISOString()}`)

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
      return "INTERNAL" // Was "INTERNAL_TRANSFER" (17 chars)
    case "BNG-CONFRERE":
      return "DOMESTIC" // Was "DOMESTIC_TRANSFER" (17 chars)
    case "BNG-INTERNATIONAL":
      return "INTERNATIONAL" // Was "INTERNATIONAL_TRANSFER" (22 chars)
    default:
      return "TRANSFER"
  }
}

export async function debitAccountBalance(accountId: string, amount: number, context: ActionSecurityContext = {}) {
  const cookieToken = context.token ?? (await cookies()).get("token")?.value
  const usertoken = cookieToken

  try {
    console.log(`[v0] Débit du solde disponible - Compte: ${accountId}, Montant: ${amount}`)

    if (!usertoken) {
      console.log("[v0] Token manquant pour le débit du solde")
      return { success: false, error: "Token d'authentification manquant" }
    }

    if (context.allowedAccountIds && !context.allowedAccountIds.has(accountId)) {
      console.warn(`[v0] Tentative de débit sur un compte non autorisé: ${accountId}`)
      return { success: false, error: "Compte débiteur invalide pour cet utilisateur" }
    }

    const currentUser = context.currentUser ?? (await getCurrentUserInfo(usertoken))

    if (!currentUser?.id) {
      console.warn("[v0] Impossible de déterminer l'utilisateur courant pour le débit")
      return { success: false, error: "Utilisateur non authentifié" }
    }

    // Récupérer d'abord les informations du compte
    const accountResponse = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/compte/${accountId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usertoken}`,
      },
    })

    if (!accountResponse.ok) {
      console.log("[v0] Impossible de récupérer les informations du compte")
      return { success: false, error: "Impossible de récupérer les informations du compte" }
    }

    const accountData = await accountResponse.json()
    const account = accountData.data || accountData

    const ownerId = extractAccountOwnerId(account)
    if (ownerId && ownerId !== currentUser.id) {
      console.warn(
        `[v0] Tentative de débit refusée: compte ${accountId} appartient à ${ownerId}, utilisateur ${currentUser.id}`,
      )
      return { success: false, error: "Compte débiteur non autorisé" }
    }

    const currentAvailableBalance = Number.parseFloat(account.availableBalance || "0")
    const newAvailableBalance = currentAvailableBalance - amount

    // Vérifier que le solde est suffisant
    if (newAvailableBalance < 0) {
      return {
        success: false,
        error: `Solde insuffisant. Solde disponible: ${currentAvailableBalance}, Montant demandé: ${amount}`,
      }
    }

    // Mettre à jour le solde disponible
    const updateData = {
      data: {
        ...account,
        availableBalance: newAvailableBalance.toString(),
      },
    }

    const updateResponse = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/compte/${accountId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usertoken}`,
      },
      body: JSON.stringify(updateData),
    })

    if (!updateResponse.ok) {
      console.log("[v0] Erreur lors de la mise à jour du solde disponible")
      return { success: false, error: "Erreur lors de la mise à jour du solde disponible" }
    }

    console.log(`[v0] Solde disponible débité avec succès - Nouveau solde: ${newAvailableBalance}`)
    return {
      success: true,
      previousBalance: currentAvailableBalance,
      newBalance: newAvailableBalance,
    }
  } catch (error) {
    console.error("[v0] Erreur lors du débit du solde disponible:", error)
    return { success: false, error: "Erreur lors du débit du solde disponible" }
  }
}

export async function creditAccountBalance(accountId: string, amount: number, context: ActionSecurityContext = {}) {
  const cookieToken = context.token ?? (await cookies()).get("token")?.value
  const usertoken = cookieToken

  try {
    console.log(`[v0] Crédit du solde disponible - Compte: ${accountId}, Montant: ${amount}`)

    if (!usertoken) {
      console.log("[v0] Token manquant pour le crédit du solde")
      return { success: false, error: "Token d'authentification manquant" }
    }

    if (context.allowedAccountIds && !context.allowedAccountIds.has(accountId)) {
      console.warn(`[v0] Tentative de crédit sur un compte non autorisé: ${accountId}`)
      return { success: false, error: "Compte destinataire invalide pour cet utilisateur" }
    }

    const currentUser = context.currentUser ?? (await getCurrentUserInfo(usertoken))

    if (!currentUser?.id) {
      console.warn("[v0] Impossible de déterminer l'utilisateur courant pour le crédit")
      return { success: false, error: "Utilisateur non authentifié" }
    }

    // Récupérer d'abord les informations du compte
    const accountResponse = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/compte/${accountId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usertoken}`,
      },
    })

    if (!accountResponse.ok) {
      console.log("[v0] Impossible de récupérer les informations du compte destinataire")
      return { success: false, error: "Impossible de récupérer les informations du compte destinataire" }
    }

    const accountData = await accountResponse.json()
    const account = accountData.data || accountData

    const ownerId = extractAccountOwnerId(account)
    if (ownerId && ownerId !== currentUser.id) {
      console.warn(
        `[v0] Tentative de crédit refusée: compte ${accountId} appartient à ${ownerId}, utilisateur ${currentUser.id}`,
      )
      return { success: false, error: "Compte destinataire non autorisé" }
    }

    const currentAvailableBalance = Number.parseFloat(account.availableBalance || "0")
    const newAvailableBalance = currentAvailableBalance + amount

    // Mettre à jour le solde disponible
    const updateData = {
      data: {
        ...account,
        availableBalance: newAvailableBalance.toString(),
      },
    }

    const updateResponse = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/compte/${accountId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usertoken}`,
      },
      body: JSON.stringify(updateData),
    })

    if (!updateResponse.ok) {
      console.log("[v0] Erreur lors de la mise à jour du solde disponible du destinataire")
      return { success: false, error: "Erreur lors de la mise à jour du solde disponible du destinataire" }
    }

    console.log(`[v0] Solde disponible crédité avec succès - Nouveau solde: ${newAvailableBalance}`)
    return {
      success: true,
      previousBalance: currentAvailableBalance,
      newBalance: newAvailableBalance,
    }
  } catch (error) {
    console.error("[v0] Erreur lors du crédit du solde disponible:", error)
    return { success: false, error: "Erreur lors du crédit du solde disponible" }
  }
}

// Action pour exécuter le virement
export async function executeTransfer(prevState: any, formData: FormData) {
  try {
    const data = {
      sourceAccount: formData.get("sourceAccount") as string,
      transferType: formData.get("transferType") as string,
      beneficiaryId: formData.get("beneficiaryId") as string | null,
      targetAccount: formData.get("targetAccount") as string | null,
      amount: formData.get("amount") as string,
      purpose: formData.get("purpose") as string,
      transferDate: formData.get("transferDate") as string,
    }

    const cleanedData = {
      sourceAccount: data.sourceAccount,
      transferType: data.transferType,
      beneficiaryId: data.beneficiaryId || undefined,
      targetAccount: data.targetAccount || undefined,
      amount: data.amount,
      purpose: data.purpose,
      transferDate: data.transferDate,
    }

    // Validation des données
    const validatedData = transferSchema.parse(cleanedData)
    const transferAmount = Number.parseFloat(validatedData.amount)

    const cookieToken = (await cookies()).get("token")?.value
    const usertoken = cookieToken

    if (!usertoken) {
      return {
        success: false,
        error: "Utilisateur non authentifié",
      }
    }

    const [currentUser, userAccounts] = await Promise.all([getCurrentUserInfo(usertoken), fetchAccounts()])

    if (!currentUser?.id) {
      return {
        success: false,
        error: "Utilisateur non authentifié",
      }
    }

    const allowedAccountIds = buildAllowedAccountIdSet(userAccounts)
    if (!allowedAccountIds.has(validatedData.sourceAccount)) {
      return {
        success: false,
        error: "Compte débiteur non autorisé",
      }
    }

    if (validatedData.transferType === "account-to-account" && validatedData.targetAccount) {
      if (!allowedAccountIds.has(validatedData.targetAccount)) {
        return {
          success: false,
          error: "Compte destinataire non autorisé",
        }
      }
    }

    let allowedBeneficiaryIds: Set<string> | undefined
    if (validatedData.transferType === "account-to-beneficiary" && validatedData.beneficiaryId) {
      const userBeneficiaries = await fetchBeneficiaries()
      allowedBeneficiaryIds = new Set<string>(userBeneficiaries.map((b: any) => String(b.id)))
      if (!allowedBeneficiaryIds.has(validatedData.beneficiaryId)) {
        return {
          success: false,
          error: "Bénéficiaire non autorisé",
        }
      }
    }

    let sourceAccountData: any = null
    let ribClient = ""
    try {
      const accountResponse = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/compte/${validatedData.sourceAccount}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${usertoken}`,
        },
      })

      if (!accountResponse.ok) {
        console.error("[v0] Failed to fetch source account details:", accountResponse.status)
        return {
          success: false,
          error: "Impossible de récupérer les informations du compte source",
        }
      }

      const accountDataResponse = await accountResponse.json()
      sourceAccountData = accountDataResponse.data || accountDataResponse

      const ownerId = extractAccountOwnerId(sourceAccountData)
      if (ownerId && ownerId !== currentUser.id) {
        console.warn(
          `[v0] Source account ownership mismatch: compte ${validatedData.sourceAccount} -> ${ownerId}, utilisateur ${currentUser.id}`,
        )
        return {
          success: false,
          error: "Compte débiteur non autorisé",
        }
      }

      ribClient = sourceAccountData.accountNumber || ""
      console.log("[v0] Source account number:", ribClient)
    } catch (error) {
      console.error("[v0] Error fetching source account details:", error)
      return {
        success: false,
        error: "Impossible de récupérer les informations du compte source",
      }
    }

    // Retiré : modification du solde disponible lors du virement
    // const debitResult = await debitAccountBalance(validatedData.sourceAccount, transferAmount, {
    //   token: usertoken,
    //   currentUser,
    //   allowedAccountIds,
    // })

    // if (!debitResult.success) {
    //   return {
    //     success: false,
    //     error: debitResult.error || "Impossible de débiter le compte source",
    //   }
    // }

    const timestamp = Date.now().toString()
    const random = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0")
    // requestID: max 14 caractères - format: REQ + 11 chiffres
    const requestID = `REQ${timestamp.slice(-8)}${random.slice(0, 3)}`.substring(0, 14)
    // referenceOperation: max 16 caractères - format: TXN + 13 chiffres
    const referenceOperation = `TXN${timestamp.slice(-10)}${random.slice(0, 3)}`.substring(0, 16)
    console.log("[v0] Generated requestID:", requestID, "(length:", requestID.length, ")")
    console.log("[v0] Generated referenceOperation:", referenceOperation, "(length:", referenceOperation.length, ")")

    let nomBeneficiaire = ""
    let ribBeneficiaire = ""

    if (validatedData.transferType === "account-to-account") {
      // Pour les virements compte à compte
      if (validatedData.targetAccount) {
        console.log(`[v0] Crédit automatique du compte destinataire: ${validatedData.targetAccount}`)

        try {
          const targetAccountResponse = await fetch(
            `${API_BASE_URL}/tenant/${TENANT_ID}/compte/${validatedData.targetAccount}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${usertoken}`,
              },
            },
          )

          if (!targetAccountResponse.ok) {
            console.error("[v0] Failed to fetch target account details:", targetAccountResponse.status)
            // Retiré : restauration du solde
            return {
              success: false,
              error: "Impossible de récupérer le compte destinataire",
            }
          }

          const targetAccountData = await targetAccountResponse.json()
          const targetAccount = targetAccountData.data || targetAccountData

          const targetOwnerId = extractAccountOwnerId(targetAccount)
          if (targetOwnerId && targetOwnerId !== currentUser.id) {
            console.warn(
              `[v0] Target account ownership mismatch: compte ${validatedData.targetAccount} -> ${targetOwnerId}, utilisateur ${currentUser.id}`,
            )
            // Retiré : restauration du solde
            return {
              success: false,
              error: "Compte destinataire non autorisé",
            }
          }

          nomBeneficiaire = targetAccount.accountName || ""
          ribBeneficiaire = `${targetAccount.codeBanque || ""}${targetAccount.codeAgence || ""}${targetAccount.accountNumber || ""}${targetAccount.cleRib || ""}`
          console.log("[v0] Target account details retrieved:", { nomBeneficiaire, ribBeneficiaire })
        } catch (error) {
          console.error("[v0] Error fetching target account details:", error)
          // Retiré : restauration du solde
          return {
            success: false,
            error: "Erreur lors de la récupération du compte destinataire",
          }
        }

        // Retiré : crédit du solde disponible
        // const creditResult = await creditAccountBalance(validatedData.targetAccount, transferAmount, {
        //   token: usertoken,
        //   currentUser,
        //   allowedAccountIds,
        // })

        // if (!creditResult.success) {
        //   console.log("[v0] Erreur lors du crédit, restauration du solde source")
        //   await debitAccountBalance(validatedData.sourceAccount, -transferAmount, {
        //     token: usertoken,
        //     currentUser,
        //     allowedAccountIds,
        //   })
        //   return {
        //     success: false,
        //     error: creditResult.error || "Impossible de créditer le compte destinataire",
        //   }
        // }

        // console.log(`[v0] Compte destinataire crédité avec succès - Nouveau solde: ${creditResult.newBalance}`)
      }
    } else if (validatedData.beneficiaryId) {
      console.log(`[v0] Récupération des informations du bénéficiaire: ${validatedData.beneficiaryId}`)
      const beneficiary = await getBeneficiaryById(validatedData.beneficiaryId, {
        token: usertoken,
        currentUser,
        allowedBeneficiaryIds,
      })

      if (!beneficiary) {
        console.log("[v0] Bénéficiaire non trouvé")
        // Retiré : restauration du solde
        return {
          success: false,
          error: "Bénéficiaire non trouvé",
        }
      }

      nomBeneficiaire = beneficiary.name || ""
      ribBeneficiaire = `${beneficiary.bankCode || ""}${beneficiary.codagence || ""}${beneficiary.accountNumber || ""}${beneficiary.clerib || ""}`
      console.log(`[v0] Bénéficiaire trouvé - nomBeneficiaire: ${nomBeneficiaire}, ribBeneficiaire: ${ribBeneficiaire}`)
    }

    let clientId = ""
    let nomClient = ""
    try {
      const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${usertoken}`,
        },
      })
      if (meResponse.ok) {
        const userData = await meResponse.json()
        clientId = userData.id || ""
        nomClient = userData.fullName || userData.name || ""
      }
    } catch (error) {
      console.error("[v0] Erreur lors de la récupération du clientId:", error)
    }

    const currentDate = new Date().toISOString()
    const apiData = {
      data: {
        affiliateid: "BNG",
        stepflow: 0,
        montantOperation: validatedData.amount,
        requestID: requestID,
        ribClient: ribClient,
        dateOrdre: currentDate,
        nomClient: nomClient,
        status: "PENDING",
        referenceOperation: referenceOperation,
        dateReception: currentDate,
        dateExecution: new Date(validatedData.transferDate).toISOString(),
        dateNotification: currentDate,
        referencePaiement: referenceOperation,
        nomBeneficiaire: nomBeneficiaire,
        ribBeneficiaire: ribBeneficiaire,
        commentnotes: validatedData.purpose,
        productCode: "",
        description: validatedData.purpose,
        clientId: clientId,
      },
    }

    const transactionUrl = `${API_BASE_URL}/tenant/${TENANT_ID}/epayments`
    
    // Envoyer les données directement sans cryptage
    const bodyToSend: any = apiData

    if ((process.env.NEXT_PUBLIC_LOG_LEVEL || "error").toLowerCase() === "debug") {
      console.log("[v0] ===== EPAYMENT CREATION DEBUG =====")
      console.log("[v0] Transaction URL:", transactionUrl)
      console.log("[v0] API_BASE_URL:", API_BASE_URL)
      console.log("[v0] TENANT_ID:", TENANT_ID)
      // Mask sensitive fields in logs
      const masked = JSON.parse(JSON.stringify(bodyToSend))
      if (masked?.data) {
        for (const f of [
          "montantOperation",
          "ribClient",
          "nomClient",
          "nomBeneficiaire",
          "ribBeneficiaire",
          "commentnotes",
          "description",
        ]) {
          if (masked.data[f]) masked.data[f] = "***"
        }
      }
      console.log("[v0] Request body (masked):", JSON.stringify(masked, null, 2))
      console.log("[v0] ========================================")
    }

    const response = await fetch(transactionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usertoken}`,
      },
      body: JSON.stringify(bodyToSend),
    })

    if ((process.env.NEXT_PUBLIC_LOG_LEVEL || "error").toLowerCase() === "debug") {
      console.log("[v0] Epayment response status:", response.status)
      console.log("[v0] Epayment response status text:", response.statusText)
    }

    if (!response.ok) {
      if ((process.env.NEXT_PUBLIC_LOG_LEVEL || "error").toLowerCase() === "debug") {
        console.log("[v0] Erreur API")
      }

      const responseText = await response.text()
      if ((process.env.NEXT_PUBLIC_LOG_LEVEL || "error").toLowerCase() === "debug") {
        console.log("[v0] Error response body:", responseText)
      }

      // Retiré : restauration du solde disponible

      let errorMessage = `❌ Erreur API: ${response.status} ${response.statusText}`

      try {
        const errorData = JSON.parse(responseText)
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        if (responseText) {
          errorMessage = `❌ ${responseText}`
        }
      }

      return {
        success: false,
        error: errorMessage,
      }
    }

    const result = await response.json()
    if ((process.env.NEXT_PUBLIC_LOG_LEVEL || "error").toLowerCase() === "debug") {
      console.log("[v0] Epayment created successfully")
    }

    let successMessage = `Virement de ${new Intl.NumberFormat("fr-FR").format(transferAmount)} GNF effectué avec succès.`

    if (validatedData.transferType === "account-to-account") {
      successMessage 
    } else {
      successMessage 
    }

    if ((process.env.NEXT_PUBLIC_LOG_LEVEL || "error").toLowerCase() === "debug") {
      console.log(
        `[AUDIT] Virement exécuté - RequestID: ${requestID}, Type: ${validatedData.transferType} à ${new Date().toISOString()}`,
      )
    }

    revalidatePath("/transfers/new")
    revalidatePath("/accounts")

    return {
      success: true,
      message: successMessage,
      transactionId: referenceOperation,
      amount: transferAmount,
      executedAt: new Date().toISOString(),
      apiResponse: result,
      // Retiré : informations de solde
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
      accountStatus: "ACTIF",
    }
  } catch (error) {
    return {
      success: false,
      error: "Impossible de valider le bénéficiaire",
    }
  }
}

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

export async function getTransactions(): Promise<{ data: any[] }> {
  const cookieToken = (await cookies()).get("token")?.value
  const usertoken = cookieToken

  if (!usertoken) {
    return {
      data: [
        {
          txnId: "TXN_1734624422780_001",
          accountId: "1",
          txnType: "CREDIT",
          amount: "150000",
          valueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: "COMPLETED",
          description: "Virement vers compte épargne",
        },
        {
          txnId: "TXN_1734538022780_002",
          accountId: "1",
          txnType: "DEBIT",
          amount: "75000",
          valueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          status: "COMPLETED",
          description: "Paiement facture électricité",
        },
        {
          txnId: "TXN_1734451622780_003",
          accountId: "2",
          txnType: "CREDIT",
          amount: "500000",
          valueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: "COMPLETED",
          description: "Dépôt de salaire",
        },
      ],
    }
  }

  try {
    let clientId = ""
    try {
      const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${usertoken}`,
        },
        next: { revalidate: 60 },
      })
      if (meResponse.ok) {
        const userData = await meResponse.json()
        clientId = userData.id || ""
      }
    } catch (_) {}

    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/transactions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usertoken}`,
      },
      next: { revalidate: 60 }, // Cache for 60 seconds instead of no-store
    })

    if (!response.ok) {
      if (response.status === 401) {
        return {
          data: [
            {
              txnId: "TXN_1734624422780_001",
              accountId: "1",
              txnType: "CREDIT",
              amount: "150000",
              valueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              status: "COMPLETED",
              description: "Virement vers compte épargne",
            },
          ],
        }
      }

      return { data: [] }
    }

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      return { data: [] }
    }

    const data = await response.json()

    let transactions = []
    if (Array.isArray(data.rows)) {
      transactions = data.rows
    } else if (Array.isArray(data)) {
      transactions = data
    } else if (data.data) {
      transactions = Array.isArray(data.data) ? data.data : [data.data]
    }

    if (clientId) {
      transactions = transactions.filter((txn: any) => txn.clientId === clientId)
    }

    return { data: transactions }
  } catch (_) {
    return {
      data: [
        {
          txnId: "TXN_1734624422780_001",
          accountId: "1",
          txnType: "CREDIT",
          amount: "150000",
          valueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: "COMPLETED",
          description: "Virement vers compte épargne",
        },
      ],
    }
  }
}

export async function getEpayments(): Promise<{ rows: any[] }> {
  const cookieToken = (await cookies()).get("token")?.value
  const usertoken = cookieToken
  if (!usertoken) return { rows: [] }

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
  } catch (_) {}

  const res = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/epayments?orderBy=createdAt_DESC&limit=100`, {
    method: "GET",
    headers: { Authorization: `Bearer ${usertoken}`, Accept: "application/json" },
    next: { revalidate: 60 },
  })
  const contentType = res.headers.get("content-type") || ""
  const bodyText = await res.text()
  if (!res.ok) {
    return { rows: [] }
  }
  const parsed = contentType.includes("application/json") && bodyText ? JSON.parse(bodyText) : { rows: [] }
  let rows: any[] = parsed.rows || []
  if (currentUserId) rows = rows.filter((r: any) => r.clientId === currentUserId || r.createdById === currentUserId)
  return { rows }
}

async function getBeneficiaryById(beneficiaryId: string, context: BeneficiarySecurityContext = {}) {
  const cookieToken = context.token ?? (await cookies()).get("token")?.value
  const usertoken = cookieToken

  if (context.allowedBeneficiaryIds && !context.allowedBeneficiaryIds.has(beneficiaryId)) {
    console.warn(`[v0] Tentative d'accès à un bénéficiaire non autorisé: ${beneficiaryId}`)
    return null
  }

  try {
    if (!usertoken) {
      console.warn("[v0] Token manquant pour la récupération du bénéficiaire")
      return null
    }

    const currentUser = context.currentUser ?? (await getCurrentUserInfo(usertoken))

    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/beneficiaire/${beneficiaryId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usertoken}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      console.error(`[v0] Erreur lors de la récupération du bénéficiaire ${beneficiaryId}: ${response.status}`)
      return null
    }

    const data = await response.json()
    const beneficiary = data.data || data

    const ownerId = extractBeneficiaryOwnerId(beneficiary)
    if (currentUser?.id && ownerId && ownerId !== currentUser.id) {
      console.warn(
        `[v0] Tentative d'accès refusée: bénéficiaire ${beneficiaryId} appartient à ${ownerId}, utilisateur ${currentUser.id}`,
      )
      return null
    }

    if (context.allowedBeneficiaryIds && !ownerId) {
      // Si nous ne pouvons pas confirmer le propriétaire, refuser par défaut
      console.warn(`[v0] Propriété bénéficiaire inconnue pour ${beneficiaryId}, accès refusé`)
      return null
    }

    return beneficiary
  } catch (error) {
    console.error("[v0] Erreur lors de la récupération du bénéficiaire:", error)
    return null
  }
}
