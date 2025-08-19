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

const API_BASE_URL = "http://192.168.1.200:8080/api" //process.env.NEXT_PUBLIC_API_BASE_URL
const TENANT_ID = "afa25e29-08dd-46b6-8ea2-d778cb2d6694"

const cookieToken = (await cookies()).get("token")?.value
export async function getBeneficiaries(): Promise<ApiBeneficiary[]> {
  const usertoken = cookieToken
  console.log("Récupération des bénéficiaires avec token:", usertoken)
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
    BNG: "Banque Nationale de Guinée",
    BICI: "BICIGUI",
    SGBG: "Société Générale de Banques en Guinée",
    UBA: "United Bank for Africa",
    ECO: "Ecobank Guinée",
    VISTA: "VISTA BANK",
    BNPP: "BNP Paribas",
    SG: "Société Générale",
    CA: "Crédit Agricole",
    HSBC: "HSBC",
    DB: "Deutsche Bank",
  }

  return bankNames[bankCode] || bankCode
}

function getBeneficiaryType(bankCode: string): "BNG-BNG" | "BNG-CONFRERE" | "BNG-INTERNATIONAL" {
  if (bankCode === "BNG") {
    return "BNG-BNG"
  } else if (["BICI", "SGBG", "UBA", "ECO", "VISTA"].includes(bankCode)) {
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
    "Banque Nationale de Guinée": "BNG",
    BICIGUI: "BICI",
    "Société Générale de Banques en Guinée": "SGBG",
    "United Bank for Africa": "UBA",
    "Ecobank Guinée": "ECO",
    "VISTA BANK": "VISTA",
    "BNP Paribas": "BNPP",
    "Société Générale": "SG",
    "Crédit Agricole": "CA",
    HSBC: "HSBC",
    "Deutsche Bank": "DB",
  }

  return bankCodes[bankName] || bankName.substring(0, 4).toUpperCase()
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

    const beneficiaryId = formData.get("beneficiaryId") as string
    const name = formData.get("name") as string
    const account = formData.get("account") as string
    const bank = formData.get("bank") as string
    const type = formData.get("type") as string

    // Validation des données
    if (!beneficiaryId || !name || !account || !bank || !type) {
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
        beneficiaryId: beneficiaryId,
        customerId: "CUSTOMER_ID_PLACEHOLDER", // À remplacer par l'ID du client connecté
        name: name,
        accountNumber: account,
        bankCode: getBankCode(bank, type),
      },
    }

    const usertoken = cookieToken
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

    const beneficiaryId = formData.get("beneficiaryId") as string

    if (!beneficiaryId) {
      return {
        success: false,
        error: "Identifiant du bénéficiaire manquant",
      }
    }

    const usertoken = cookieToken
    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/beneficiaire/${beneficiaryId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usertoken}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.message || `Erreur API: ${response.status} ${response.statusText}`,
      }
    }

    console.log("Bénéficiaire supprimé via API:", beneficiaryId)

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
