"use server"
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
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
  TENANT_ID: string
  beneficiaryId: string
  clientId: string // Changed from customerId to clientId
  name: string
  accountNumber: string
  bankCode: string
  bankName: string
  status: number
  typeBeneficiary: string
  favoris: boolean
  codagence: string // NEW field
  clerib: string // NEW field
}

const API_BASE_URL = process.env.API_BASE_URL
const TENANT_ID = process.env.TENANT_ID

async function getCurrentClientId(): Promise<string> {
  const cookieToken = (await cookies()).get("token")?.value
  if (!cookieToken) {
    throw new Error("Token non trouvé")
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
      throw new Error("Impossible de récupérer les informations utilisateur")
    }

    const userData = await response.json()
    return userData.id
  } catch (error) {
    console.error("Erreur lors de la récupération du clientId:", error)
    throw error
  }
}

function extractAccountParts(accountNumber: string, type: string): { codagence: string; clerib: string } {
  if (type === "BNG-BNG" || type === "BNG-CONFRERE") {
    const parts = accountNumber.split("-")
    if (parts.length === 3) {
      return {
        codagence: parts[0],
        clerib: parts[2],
      }
    }
  }

  return {
    codagence: "N/A",
    clerib: "N/A",
  }
}

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
      cache: "no-store",
    })

    if (!response.ok) {
      console.error(`Erreur API: ${response.status} ${response.statusText}`)
      return []
    }

    const data = await response.json()
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
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const name = formData.get("name") as string
    const account = formData.get("account") as string
    const bank = formData.get("bank") as string
    const type = formData.get("type") as string
    const bankname = formData.get("bankname") as string

    if (!name || !account || !type) {
      return {
        success: false,
        error: "Tous les champs obligatoires doivent être remplis",
      }
    }

    if (type === "BNG-INTERNATIONAL" && !bank) {
      return {
        success: false,
        error: "Le nom de la banque est obligatoire pour les bénéficiaires internationaux",
      }
    }

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

    const clientId = await getCurrentClientId()
    const { codagence, clerib } = extractAccountParts(account, type)

    const apiData = {
      data: {
        beneficiaryId: `BEN_${Date.now()}`,
        clientId: clientId,
        name: name,
        accountNumber: account,
        bankCode: bank,
        bankName: bankname,
        status: 0,
        typeBeneficiary: type,
        favoris: false,
        codagence: codagence,
        clerib: clerib,
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

export async function updateBeneficiary(prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
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

    if (type === "BNG-INTERNATIONAL" && !bank) {
      return {
        success: false,
        error: "Le nom de la banque est obligatoire pour les bénéficiaires internationaux",
      }
    }

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

    const clientId = await getCurrentClientId()
    const { codagence, clerib } = extractAccountParts(account, type)

    const apiData = {
      data: {
        beneficiaryId: beneficiaryId || `BEN_${Date.now()}`,
        clientId: clientId,
        name: name,
        accountNumber: account,
        bankCode: getBankCode(bank, type),
        bankName: bank,
        status: 0,
        typeBeneficiary: type,
        favoris: currentBeneficiary?.favoris || false,
        codagence: codagence,
        clerib: clerib,
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
        ids: [id],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.message || `Erreur API: ${response.status} ${response.statusText}`,
      }
    }

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
        clientId: currentBeneficiary.clientId,
        name: currentBeneficiary.name,
        accountNumber: currentBeneficiary.accountNumber,
        bankCode: currentBeneficiary.bankCode,
        bankName: currentBeneficiary.bankName,
        status: currentBeneficiary.status,
        typeBeneficiary: currentBeneficiary.typeBeneficiary,
        favoris: !currentFavoriteStatus,
        codagence: currentBeneficiary.codagence,
        clerib: currentBeneficiary.clerib,
      },
    }

    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/beneficiaire/${beneficiaryId}`, {
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
        clientId: currentBeneficiary.clientId,
        name: currentBeneficiary.name,
        accountNumber: currentBeneficiary.accountNumber,
        bankCode: currentBeneficiary.bankCode,
        bankName: currentBeneficiary.bankName,
        status: 1,
        typeBeneficiary: currentBeneficiary.typeBeneficiary,
        favoris: currentBeneficiary.favoris,
        codagence: currentBeneficiary.codagence,
        clerib: currentBeneficiary.clerib,
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
        clientId: currentBeneficiary.clientId,
        name: currentBeneficiary.name,
        accountNumber: currentBeneficiary.accountNumber,
        bankCode: currentBeneficiary.bankCode,
        bankName: currentBeneficiary.bankName,
        status: 0,
        typeBeneficiary: currentBeneficiary.typeBeneficiary,
        favoris: currentBeneficiary.favoris,
        codagence: currentBeneficiary.codagence,
        clerib: currentBeneficiary.clerib,
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
    await new Promise((resolve) => setTimeout(resolve, 500))

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
