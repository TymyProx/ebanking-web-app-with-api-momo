"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
interface ActionResult {
  success?: boolean
  error?: string
  message?: string
}

interface ApiBeneficiary {
  id: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  createdById: string
  updatedById: string
  importHash?: string
  tenantId: string
  beneficiaryId: string
  customerId: string
  name: string
  accountNumber: string
  bankCode: string
  bankName: string
  status: number
  typeBeneficiary: string
  favoris: boolean
}

const API_BASE_URL =
  process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "https://192.168.1.200:8080/api"
const TENANT_ID = process.env.TENANT_ID || "aa1287f6-06af-45b7-a905-8c57363565c2"

export async function getBeneficiaries(): Promise<ApiBeneficiary[]> {
  const cookieToken = (await cookies()).get("token")?.value
  const usertoken = cookieToken
  try {
    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/beneficiaire`, {
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
    //Retourne la reponse sous forme de tableau
    if (Array.isArray(data.rows)) {
      return data.rows
    }
    return [data.rows]
  } catch (error) {
    console.error("Erreur lors de la récupération des bénéficiaires:", error)
    return []
  }
}

function getBankNameFromCode(bankCode: string): string {
  const bankNames: Record<string, string> = {
    bng: "Banque Nationale de Guinée",
    bici: "BICIGUI",
    sgbg: "Société Générale de Banques en Guinée",
    uba: "United Bank for Africa",
    eco: "Ecobank Guinée",
    vista: "VISTA BANK",
    bnpp: "BNP Paribas",
    sg: "Société Générale",
    ca: "Crédit Agricole",
    hsbc: "HSBC",
    db: "Deutsche Bank",
  }

  return bankNames[bankCode.toLowerCase()] || bankCode
}

function getBeneficiaryType(bankCode: string): "BNG-BNG" | "BNG-CONFRERE" | "BNG-INTERNATIONAL" {
  const lowerBankCode = bankCode.toLowerCase()
  if (lowerBankCode === "bng") {
    return "BNG-BNG"
  } else if (["bici", "sgbg", "uba", "eco", "vista"].includes(lowerBankCode)) {
    return "BNG-CONFRERE"
  } else {
    return "BNG-INTERNATIONAL"
  }
}

export async function addBeneficiary(prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    // Simulation d'un délai de traitement
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const name = formData.get("name") as string
    const account = formData.get("account") as string
    const bank = formData.get("bank") as string
    const type = formData.get("type") as string

    // Validation des données
    if (!name || !account || !type) {
      return {
        success: false,
        error: "Tous les champs obligatoires doivent être remplis",
      }
    }

    // Special validation for international type - bank name is required
    if (type === "BNG-INTERNATIONAL" && !bank) {
      return {
        success: false,
        error: "Le nom de la banque est obligatoire pour les bénéficiaires internationaux",
      }
    }

    // For other types, bank is also required
    if (type === "BNG-CONFRERE" && !bank) {
      return {
        success: false,
        error: "Le nom de la banque est obligatoire",
      }
    }

    const ribValidation = await validateRIB(account, type)
    if (!ribValidation.isValid) {
      return {
        success: false,
        error: ribValidation.message,
      }
    }

    const apiData = {
      data: {
        beneficiaryId: `BEN_${Date.now()}`, // Génération d'un ID unique
        customerId: "CUSTOMER_ID_PLACEHOLDER", // À remplacer par l'ID du client connecté
        name: name,
        accountNumber: account,
        bankCode: getBankCode(bank, type),
        bankName: bank,
        status: 0,
        typeBeneficiary: type,
        favoris: false, // Default value as requested
      },
    }
    const cookieToken = (await cookies()).get("token")?.value
    const usertoken = cookieToken
    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/beneficiaire`, {
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
        error: errorData.message || `Erreur API: ${response.status} ${response.statusText}`,
      }
    }

    const result = await response.json()
    console.log("Bénéficiaire ajouté via API:", result)

    revalidatePath("/transfers/beneficiaries")
    revalidatePath("/transfers/new")

    return {
      success: true,
      message: "Bénéficiaire ajouté avec succès",
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout du bénéficiaire:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur inattendue s'est produite",
    }
  }
}

function getBankCode(bankName: string, type: string): string {
  const bankCodes: Record<string, string> = {
    "Banque Nationale de Guinée": "bng",
    BICIGUI: "bici",
    "Société Générale de Banques en Guinée": "sgbg",
    "United Bank for Africa": "uba",
    "Ecobank Guinée": "eco",
    "VISTA BANK": "vista",
    "BNP Paribas": "bnpp",
    "Société Générale": "sg",
    "Crédit Agricole": "ca",
    HSBC: "hsbc",
    "Deutsche Bank": "db",
  }

  return bankCodes[bankName] || bankName.substring(0, 4).toLowerCase()
}

export async function validateRIB(account: string, type: string): Promise<{ isValid: boolean; message: string }> {
  try {
    // Simulation d'un délai de validation
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Validation selon le type
    switch (type) {
      case "BNG-BNG":
        const bngPattern = /^\d{4}-\d{6}-\d{2}$/
        if (bngPattern.test(account)) {
          return { isValid: true, message: "Numéro de compte BNG valide" }
        } else {
          return { isValid: false, message: "Format invalide. Utilisez: 0001-234567-89" }
        }

      case "BNG-CONFRERE":
        const confrerePattern = /^\d{4}-\d{6}-\d{2}$/
        if (confrerePattern.test(account)) {
          return { isValid: true, message: "Numéro de compte confrère valide" }
        } else {
          return { isValid: false, message: "Format invalide. Utilisez: 0002-234567-89" }
        }

      case "BNG-INTERNATIONAL":
        const cleanedAccount = account.replace(/\s/g, "")
        const ibanPattern = /^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/
        if (cleanedAccount.length >= 15 && cleanedAccount.length <= 34 && ibanPattern.test(cleanedAccount)) {
          return { isValid: true, message: "IBAN valide" }
        } else {
          return { isValid: false, message: "Format IBAN invalide. Ex: FR7612345678901234567890 (15-34 caractères)" }
        }

      default:
        return { isValid: false, message: "Type de compte non reconnu" }
    }
  } catch (error) {
    return { isValid: false, message: "Erreur lors de la validation" }
  }
}

export async function updateBeneficiary(prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    // Simulation d'un délai de traitement
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const id = formData.get("id") as string
    const beneficiaryId = formData.get("beneficiaryId") as string
    const name = formData.get("name") as string
    const account = formData.get("account") as string
    const bank = formData.get("bank") as string
    const type = formData.get("type") as string

    if (!id || !name || !account || !type) {
      return {
        success: false,
        error: "Tous les champs obligatoires doivent être remplis",
      }
    }

    // Special validation for international type - bank name is required
    if (type === "BNG-INTERNATIONAL" && !bank) {
      return {
        success: false,
        error: "Le nom de la banque est obligatoire pour les bénéficiaires internationaux",
      }
    }

    // For other types, bank is also required
    if (type === "BNG-CONFRERE" && !bank) {
      return {
        success: false,
        error: "Le nom de la banque est obligatoire",
      }
    }

    const ribValidation = await validateRIB(account, type)
    if (!ribValidation.isValid) {
      return {
        success: false,
        error: ribValidation.message,
      }
    }

    const currentBeneficiaries = await getBeneficiaries()
    const currentBeneficiary = currentBeneficiaries.find((b) => b.id === id)

    const apiData = {
      data: {
        beneficiaryId: beneficiaryId || `BEN_${Date.now()}`,
        customerId: "CUSTOMER_ID_PLACEHOLDER", // À remplacer par l'ID du client connecté
        name: name,
        accountNumber: account,
        bankCode: getBankCode(bank, type),
        bankName: bank,
        status: 0,
        typeBeneficiary: type,
        favoris: currentBeneficiary?.favoris || false, // Preserve existing favoris status
      },
    }
    const cookieToken = (await cookies()).get("token")?.value
    const usertoken = cookieToken
    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/beneficiaire/${id}`, {
      method: "PUT",
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
        error: errorData.message || `Erreur API: ${response.status} ${response.statusText}`,
      }
    }

    const result = await response.json()
    console.log("Bénéficiaire modifié via API:", result)

    revalidatePath("/transfers/beneficiaries")
    revalidatePath("/transfers/new")

    return {
      success: true,
      message: "Bénéficiaire modifié avec succès",
    }
  } catch (error) {
    console.error("Erreur lors de la modification du bénéficiaire:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur inattendue s'est produite",
    }
  }
}

export async function deleteBeneficiary(prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    // Simulation d'un délai de traitement
    await new Promise((resolve) => setTimeout(resolve, 800))

    const id = formData.get("id") as string

    if (!id) {
      return {
        success: false,
        error: "Identifiant du bénéficiaire manquant",
      }
    }
    const cookieToken = (await cookies()).get("token")?.value
    const usertoken = cookieToken

    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/beneficiaire`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usertoken}`,
      },
      body: JSON.stringify({
        ids: [id], // L'API s'attend à un tableau d'IDs
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.message || `Erreur API: ${response.status} ${response.statusText}`,
      }
    }

    console.log("Bénéficiaire supprimé via API:", id)

    revalidatePath("/transfers/beneficiaries")
    revalidatePath("/transfers/new")

    return {
      success: true,
      message: "Bénéficiaire supprimé avec succès",
    }
  } catch (error) {
    console.error("Erreur lors de la suppression du bénéficiaire:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur inattendue s'est produite",
    }
  }
}

export async function toggleBeneficiaryFavorite(
  beneficiaryId: string,
  currentFavoriteStatus: boolean,
): Promise<ActionResult> {
  try {
    const cookieToken = (await cookies()).get("token")?.value
    const usertoken = cookieToken

    const currentBeneficiaries = await getBeneficiaries()
    const currentBeneficiary = currentBeneficiaries.find((b) => b.id === beneficiaryId)

    if (!currentBeneficiary) {
      return {
        success: false,
        error: "Bénéficiaire non trouvé",
      }
    }

    const apiData = {
      data: {
        beneficiaryId: currentBeneficiary.beneficiaryId,
        customerId: currentBeneficiary.customerId,
        name: currentBeneficiary.name,
        accountNumber: currentBeneficiary.accountNumber,
        bankCode: currentBeneficiary.bankCode,
        bankName: currentBeneficiary.bankName,
        status: currentBeneficiary.status,
        typeBeneficiary: currentBeneficiary.typeBeneficiary,
        favoris: !currentFavoriteStatus, // Toggle the current status
      },
    }

    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/beneficiaire/${beneficiaryId}`, {
      method: "PUT", // Use PUT instead of PATCH to send complete data
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
        error: errorData.message || `Erreur API: ${response.status} ${response.statusText}`,
      }
    }

    const result = await response.json()
    console.log("Statut favori modifié via API:", result)

    revalidatePath("/transfers/beneficiaries")
    revalidatePath("/transfers/new")

    return {
      success: true,
      message: "Statut favori modifié avec succès",
    }
  } catch (error) {
    console.error("Erreur lors de la modification du statut favori:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur inattendue s'est produite",
    }
  }
}

export async function deactivateBeneficiary(prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    // Simulation d'un délai de traitement
    await new Promise((resolve) => setTimeout(resolve, 800))

    const id = formData.get("id") as string

    if (!id) {
      return {
        success: false,
        error: "Identifiant du bénéficiaire manquant",
      }
    }

    const cookieToken = (await cookies()).get("token")?.value
    const usertoken = cookieToken

    const currentBeneficiaries = await getBeneficiaries()
    const currentBeneficiary = currentBeneficiaries.find((b) => b.id === id)

    if (!currentBeneficiary) {
      return {
        success: false,
        error: "Bénéficiaire non trouvé",
      }
    }

    const apiData = {
      data: {
        beneficiaryId: currentBeneficiary.beneficiaryId,
        customerId: currentBeneficiary.customerId,
        name: currentBeneficiary.name,
        accountNumber: currentBeneficiary.accountNumber,
        bankCode: currentBeneficiary.bankCode,
        bankName: currentBeneficiary.bankName,
        status: 1, // Set status to 1 to deactivate
        typeBeneficiary: currentBeneficiary.typeBeneficiary,
        favoris: currentBeneficiary.favoris,
      },
    }

    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/beneficiaire/${id}`, {
      method: "PUT",
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
        error: errorData.message || `Erreur API: ${response.status} ${response.statusText}`,
      }
    }

    console.log("Bénéficiaire désactivé via API:", id)

    revalidatePath("/transfers/beneficiaries")
    revalidatePath("/transfers/new")

    return {
      success: true,
      message: "Bénéficiaire désactivé avec succès",
    }
  } catch (error) {
    console.error("Erreur lors de la désactivation du bénéficiaire:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur inattendue s'est produite",
    }
  }
}

export async function reactivateBeneficiary(prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    // Simulation d'un délai de traitement
    await new Promise((resolve) => setTimeout(resolve, 800))

    const id = formData.get("id") as string

    if (!id) {
      return {
        success: false,
        error: "Identifiant du bénéficiaire manquant",
      }
    }

    const cookieToken = (await cookies()).get("token")?.value
    const usertoken = cookieToken

    const currentBeneficiaries = await getBeneficiaries()
    const currentBeneficiary = currentBeneficiaries.find((b) => b.id === id)

    if (!currentBeneficiary) {
      return {
        success: false,
        error: "Bénéficiaire non trouvé",
      }
    }

    const apiData = {
      data: {
        beneficiaryId: currentBeneficiary.beneficiaryId,
        customerId: currentBeneficiary.customerId,
        name: currentBeneficiary.name,
        accountNumber: currentBeneficiary.accountNumber,
        bankCode: currentBeneficiary.bankCode,
        bankName: currentBeneficiary.bankName,
        status: 0, // Set status to 0 to reactivate
        typeBeneficiary: currentBeneficiary.typeBeneficiary,
        favoris: currentBeneficiary.favoris,
      },
    }

    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/beneficiaire/${id}`, {
      method: "PUT",
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
        error: errorData.message || `Erreur API: ${response.status} ${response.statusText}`,
      }
    }

    console.log("Bénéficiaire réactivé via API:", id)

    revalidatePath("/transfers/beneficiaries")
    revalidatePath("/transfers/new")

    return {
      success: true,
      message: "Bénéficiaire réactivé avec succès",
    }
  } catch (error) {
    console.error("Erreur lors de la réactivation du bénéficiaire:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur inattendue s'est produite",
    }
  }
}
