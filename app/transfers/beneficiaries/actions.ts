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
}

const API_BASE_URL = process.env.API_BASE_URL || "http://192.168.1.200:8080/api"
const TENANT_ID = process.env.TENANT_ID || "11cacc69-5a49-4f01-8b16-e8f473746634"

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
    if (!name || !account || !bank || !type) {
      return {
        success: false,
        error: "Tous les champs obligatoires doivent être remplis",
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
        const ibanPattern = /^[A-Z]{2}\d{2}\s?[\d\s]+$/
        if (ibanPattern.test(account.replace(/\s/g, ""))) {
          return { isValid: true, message: "IBAN valide" }
        } else {
          return { isValid: false, message: "Format IBAN invalide. Ex: FR76 1234 5678 9012 3456 78" }
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

    // Validation des données
    if (!id || !name || !account || !bank || !type) {
      return {
        success: false,
        error: "Tous les champs obligatoires doivent être remplis",
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
        beneficiaryId: beneficiaryId || `BEN_${Date.now()}`, // Utiliser l'ID existant ou générer un nouveau
        customerId: "CUSTOMER_ID_PLACEHOLDER", // À remplacer par l'ID du client connecté
        name: name,
        accountNumber: account,
        bankCode: getBankCode(bank, type),
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
