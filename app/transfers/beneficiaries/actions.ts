"use server"
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { encryptAesGcmNode } from "../../transfers/new/secure"
import { config } from "@/lib/config"
import { decryptDataServer } from "@/lib/server-encryption"

interface ActionResult {
  success?: boolean
  error?: string
  message?: string
  details?: any
}

interface ApiBeneficiary {
  id: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  createdById: string
  updatedById: string
  importHash?: string
  tenantId: string // Changed from TENANT_ID to tenantId
  beneficiaryId: string
  clientId: string
  name: string
  accountNumber: string
  bankCode: string
  bankName: string
  status: number
  workflowStatus?: string
  workflowMetadata?: any
  typeBeneficiary: string
  favoris: boolean
  codagence: string
  clerib: string
}

interface GetBeneficiariesResponse {
  rows: ApiBeneficiary[]
  count: number
}

import { getApiBaseUrl, TENANT_ID } from "@/lib/api-url"

const API_BASE_URL = getApiBaseUrl()

/**
 * Extrait le message d'erreur d'une réponse HTTP
 * Gère les cas où le backend renvoie du JSON ou une chaîne de caractères
 * Le backend renvoie généralement une chaîne de caractères pour les erreurs 400
 */
async function extractErrorMessage(response: Response): Promise<string> {
  let errorMessage = `Erreur API: ${response.status} ${response.statusText}`
  
  try {
    // Le backend renvoie généralement une chaîne de caractères pour Error400
    // Essayons d'abord de lire comme texte
    const textResponse = await response.text()
    
    if (textResponse && textResponse.trim()) {
      // Essayer de parser comme JSON au cas où
      try {
        const parsed = JSON.parse(textResponse)
        if (parsed && typeof parsed === "object") {
          // Extraire le message d'erreur de différentes structures possibles
          errorMessage = 
            parsed.message || 
            parsed.error || 
            parsed.errors?.join?.("\n") ||
            (Array.isArray(parsed.errors) ? parsed.errors.join("\n") : null) ||
            textResponse
        } else {
          errorMessage = textResponse
        }
      } catch {
        // Si ce n'est pas du JSON, utiliser directement le texte
        // C'est le cas pour Error400 qui renvoie directement le message
        errorMessage = textResponse
      }
    }
  } catch (parseError) {
    console.error("Erreur lors de l'extraction du message d'erreur:", parseError)
    // Si tout échoue, garder le message par défaut
  }
  
  // Nettoyer et formater le message d'erreur
  errorMessage = errorMessage.trim()
  
  // Si le message contient plusieurs lignes (erreurs multiples), les formater proprement
  if (errorMessage.includes("\n")) {
    errorMessage = errorMessage.split("\n").map(line => line.trim()).filter(line => line).join(". ")
  }
  
  return errorMessage
}

/**
 * Traduit les erreurs du backend en messages utilisateur clairs en français
 */
function translateBeneficiaryError(
  status: number,
  errorDetails: any,
  defaultMessage: string
): string {
  // Extraire le message d'erreur du backend
  let backendMessage = errorDetails?.message || errorDetails?.error || ""
  let errorString = String(backendMessage).toLowerCase().trim()
  
  // Nettoyer le defaultMessage pour enlever les codes d'erreur techniques
  let cleanDefaultMessage = defaultMessage
    .replace(/Erreur API:\s*\d+/gi, "")
    .replace(/\(\d{3}\)/g, "")
    .replace(/Bad Request/gi, "")
    .trim()

  // Si le message backend contient uniquement des codes d'erreur techniques, l'ignorer
  if (status === 400 && (
    errorString === "400" || 
    errorString === "bad request" || 
    errorString === "" ||
    errorString === "error 400" ||
    errorString === "erreur 400" ||
    errorString.includes("erreur api: 400") ||
    errorString.includes("error api: 400")
  )) {
    backendMessage = "" // Forcer l'utilisation des messages traduits
    errorString = ""
  }

  // Messages spécifiques selon le code de statut HTTP
  if (status === 400) {
    // Erreurs de validation
    if (
      errorString.includes("rib") || 
      errorString.includes("clé") || 
      errorString.includes("cle rib") || 
      errorString.includes("clerib") ||
      errorString.includes("cle-rib") ||
      errorString.includes("key") ||
      errorString.includes("cle") ||
      errorString.includes("rib key") ||
      errorString.includes("ribkey") ||
      errorString.includes("invalid rib") ||
      errorString.includes("rib invalide") ||
      errorString.includes("rib incorrect")
    ) {
      return "La clé RIB saisie est incorrecte. Veuillez vérifier la clé RIB sur vos documents bancaires."
    }
    if (errorString.includes("account") || errorString.includes("compte") || errorString.includes("accountnumber")) {
      return "Le numéro de compte saisi est invalide. Veuillez vérifier le numéro de compte."
    }
    if (errorString.includes("bank") || errorString.includes("banque") || errorString.includes("bankcode")) {
      return "Le code banque ou le nom de la banque est invalide. Veuillez vérifier ces informations."
    }
    if (errorString.includes("agence") || errorString.includes("agency") || errorString.includes("codagence")) {
      return "Le code agence saisi est invalide. Veuillez vérifier le code agence."
    }
    if (errorString.includes("name") || errorString.includes("nom")) {
      return "Le nom du bénéficiaire est invalide. Veuillez saisir un nom valide."
    }
    if (errorString.includes("validation") || errorString.includes("invalid")) {
      return "Les informations saisies sont invalides. Veuillez vérifier tous les champs et réessayer."
    }
    if (errorString.includes("duplicate") || errorString.includes("existe") || errorString.includes("déjà")) {
      return "Ce bénéficiaire existe déjà dans votre liste. Veuillez vérifier les informations saisies."
    }
    // Message générique pour les erreurs 400
    return "Les informations saisies sont incorrectes. Veuillez vérifier tous les champs et réessayer."
  }

  if (status === 401) {
    return "Votre session a expiré. Veuillez vous reconnecter."
  }

  if (status === 403) {
    return "Vous n'avez pas l'autorisation d'effectuer cette action."
  }

  if (status === 404) {
    return "La ressource demandée est introuvable."
  }

  if (status === 409) {
    return "Ce bénéficiaire existe déjà dans votre liste."
  }

  if (status === 422) {
    // Erreurs de validation spécifiques
    if (
      errorString.includes("rib") || 
      errorString.includes("clé") || 
      errorString.includes("cle rib") ||
      errorString.includes("clerib") ||
      errorString.includes("cle-rib") ||
      errorString.includes("key") ||
      errorString.includes("cle") ||
      errorString.includes("rib key") ||
      errorString.includes("ribkey") ||
      errorString.includes("invalid rib") ||
      errorString.includes("rib invalide") ||
      errorString.includes("rib incorrect")
    ) {
      return "La clé RIB saisie est incorrecte. Veuillez vérifier la clé RIB sur vos documents bancaires."
    }
    return "Les données saisies ne sont pas valides. Veuillez vérifier tous les champs."
  }

  if (status === 500 || status === 502 || status === 503) {
    return "Une erreur technique s'est produite. Veuillez réessayer dans quelques instants."
  }

  // Si le backend a fourni un message spécifique et qu'il ne contient pas de codes d'erreur techniques
  if (backendMessage && 
      backendMessage.trim().length > 0 &&
      !errorString.includes("400") &&
      !errorString.includes("bad request") &&
      !errorString.includes("erreur api") &&
      !errorString.includes("error api") &&
      !errorString.includes("500") &&
      !errorString.includes("internal server error")) {
    return backendMessage
  }

  // Si le defaultMessage ou le backendMessage contient des codes d'erreur techniques, utiliser un message générique clair
  const hasTechnicalError = 
    defaultMessage.includes("400") || 
    defaultMessage.includes("Bad Request") || 
    defaultMessage.includes("Erreur API") ||
    errorString.includes("erreur api: 400") ||
    errorString.includes("error api: 400") ||
    errorString.includes("400 bad request")
  
  if (hasTechnicalError) {
    if (status === 400) {
      return "Les informations saisies sont incorrectes. Veuillez vérifier tous les champs et réessayer."
    }
    if (status === 500 || status === 502 || status === 503) {
      return "Une erreur technique s'est produite. Veuillez réessayer dans quelques instants."
    }
    // Pour les autres codes, utiliser un message générique
    return "Une erreur s'est produite. Veuillez réessayer."
  }

  // Message par défaut nettoyé
  return cleanDefaultMessage || defaultMessage
}

const WORKFLOW_STATUS = {
  CREATED: "cree",
  VERIFIED: "verifie",
  VALIDATED: "valide",
  AVAILABLE: "disponible",
  SUSPENDED: "suspendu",
} as const

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

export async function getBeneficiaries(): Promise<ApiBeneficiary[]> {
  const cookieToken = (await cookies()).get("token")?.value
  const usertoken = cookieToken
  try {
    let currentUserId: string | null = null
    try {
      const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${usertoken}`,
        },
      })

      if (userResponse.ok) {
        const userData = await userResponse.json()
        currentUserId = userData.id
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du user ID:", error)
    }

    const queryParams = new URLSearchParams()
    if (currentUserId) {
      queryParams.set("filter[clientId]", currentUserId)
    }
    queryParams.set("limit", "200")

    const endpoint = `${API_BASE_URL}/tenant/${TENANT_ID}/beneficiaire${queryParams.toString() ? `?${queryParams.toString()}` : ""}`

    const response = await fetch(endpoint, {
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

    const data: GetBeneficiariesResponse = await response.json()

    let beneficiaries: ApiBeneficiary[] = []
    if (data.rows && Array.isArray(data.rows)) {
      if (currentUserId) {
        beneficiaries = data.rows.filter((beneficiary) => beneficiary.clientId === currentUserId)
      } else {
        beneficiaries = data.rows
      }
    }

    const decryptedBeneficiaries = await Promise.all(
      beneficiaries.map((beneficiary) => decryptDataServer(beneficiary as any)),
    )

    return decryptedBeneficiaries as ApiBeneficiary[]
  } catch (error) {
    console.error("Erreur lors de la récupération des bénéficiaires:", error)
    return []
  }
}

export async function getBeneficiaryDetails(beneficiaryId: string): Promise<ApiBeneficiary | null> {
  const cookieToken = (await cookies()).get("token")?.value
  const usertoken = cookieToken

  if (!beneficiaryId) {
    console.error("Beneficiary ID is required")
    return null
  }

  try {
    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/beneficiaire/${beneficiaryId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usertoken}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      console.error(`Erreur API: ${response.status} ${response.statusText}`)
      return null
    }

    const beneficiary: ApiBeneficiary = await response.json()
    return beneficiary
  } catch (error) {
    console.error("Erreur lors de la récupération des détails du bénéficiaire:", error)
    return null
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

/**
 * ✅ STREAMLINED: Create and activate beneficiary after OTP verification
 * This automatically: creates → verifies RIB → validates → makes available
 * The beneficiary is immediately active and usable
 */
export async function addBeneficiaryAndActivate(
  prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const getStr = (k: string) => (formData.get(k) as string) || ""
    const name = getStr("name") || getStr("1_name")
    const account = getStr("account") || getStr("1_account")
    const type = getStr("type") || getStr("1_type")

    // Extract bank code from multiple possible field names
    let codeBanque =
      getStr("codeBanque") || getStr("bankCode") || getStr("1_bankCode") || getStr("bank") || getStr("1_bank")

    // Extract bank name
    let bankname = getStr("bankname") || getStr("1_bankname") || getStr("bankName") || getStr("1_bankName")

    // If we have a bank name but no code, try to derive the code
    if (bankname && !codeBanque) {
      codeBanque = getBankCode(bankname, type)
    }

    // If we have a code but no name, try to derive the name
    if (codeBanque && !bankname) {
      bankname = getBankNameFromCode(codeBanque)
    }

    const codeAgence = getStr("codeAgence") || getStr("1_codeAgence")
    const cleRib = getStr("cleRib") || getStr("1_cleRib")

    if (!name || !account || !type) {
      return {
        success: false,
        error: "Tous les champs obligatoires doivent être remplis",
      }
    }

    if (type === "BNG-INTERNATIONAL" && !bankname && !codeBanque) {
      return {
        success: false,
        error: "Le nom de la banque est obligatoire pour les bénéficiaires internationaux",
      }
    }

    if (type === "BNG-CONFRERE" && !(bankname || codeBanque)) {
      return {
        success: false,
        error: "Le nom de la banque est obligatoire",
      }
    }

    if (type !== "BNG-INTERNATIONAL") {
      const digitsOnly = account.replace(/\D/g, "")
      // Récupérer le statut pour vérifier si c'est un bénéficiaire ponctuel
      const statusStr = formData.get("status") as string | null
      const beneficiaryStatus = statusStr ? Number.parseInt(statusStr, 10) : 0
      const isOccasionalBeneficiary = beneficiaryStatus === 100
      
      // Pour les bénéficiaires ponctuels, le numéro de compte doit avoir 18 positions
      // Pour les autres, 10 positions
      const expectedLength = isOccasionalBeneficiary ? 18 : 10
      const errorMessage = isOccasionalBeneficiary 
        ? "Le numéro de compte doit contenir exactement 18 chiffres sans caractères spéciaux"
        : "Le numéro de compte doit contenir exactement 10 chiffres sans caractères spéciaux"
      
      if (digitsOnly.length !== expectedLength || account !== digitsOnly) {
        return {
          success: false,
          error: errorMessage,
        }
      }
    }

    const clientId = await getCurrentClientId()

    const secureMode = (process.env.NEXT_PUBLIC_PORTAL_SECURE_MODE || "false").toLowerCase() === "true"
    const keyB64 = process.env.PORTAL_KEY_B64 || ""
    const keyId = process.env.PORTAL_KEY_ID || "k1-mobile-v1"

    console.log("[addBeneficiaryAndActivate] Form values", {
      name,
      account,
      type,
      codeBanque,
      bankname,
      codeAgence,
      cleRib,
    })

    // Récupérer le statut depuis le FormData (100 pour bénéficiaire ponctuel, 0 par défaut)
    const statusStr = getStr("status")
    let beneficiaryStatus = 0
    if (statusStr) {
      const parsedStatus = Number.parseInt(statusStr, 10)
      if (!Number.isNaN(parsedStatus)) {
        beneficiaryStatus = parsedStatus
      }
    }
    const isOccasionalBeneficiary = beneficiaryStatus === 100

    console.log("[addBeneficiaryAndActivate] Status from FormData:", {
      statusStr,
      beneficiaryStatus,
      isOccasionalBeneficiary,
      type: typeof beneficiaryStatus,
    })

    const base = {
      beneficiaryId: `BEN_${Date.now()}`,
      clientId: clientId,
      status: beneficiaryStatus, // 100 pour bénéficiaire ponctuel, 0 pour normal - DOIT être un nombre
      workflowStatus: WORKFLOW_STATUS.AVAILABLE, // ✅ Directly available
      typeBeneficiary: type,
      favoris: false,
    }

    // S'assurer que le statut est bien un nombre dans l'objet base
    if (typeof base.status !== "number") {
      console.error("[addBeneficiaryAndActivate] ERREUR: Le statut n'est pas un nombre!", base.status)
      base.status = Number.parseInt(String(base.status), 10) || 0
    }

    let apiData: any
    const plainFields = {
      name,
      accountNumber: account,
      bankCode: codeBanque || "",
      bankName: bankname || "",
      codagence: type === "BNG-INTERNATIONAL" ? "N/A" : codeAgence || "N/A",
      clerib: type === "BNG-INTERNATIONAL" ? "N/A" : cleRib || "N/A",
    }

    if (secureMode && keyB64) {
      const enc = (v: any) => ({ ...encryptAesGcmNode(v, keyB64), key_id: keyId })
      apiData = {
        data: {
          ...base,
          ...plainFields,
          name_json: enc(name),
          accountNumber_json: enc(account),
          bankCode_json: enc(codeBanque || ""),
          bankName_json: enc(bankname || ""),
          codagence_json: enc(type === "BNG-INTERNATIONAL" ? "N/A" : codeAgence || "N/A"),
          clerib_json: enc(type === "BNG-INTERNATIONAL" ? "N/A" : cleRib || "N/A"),
          key_id: keyId,
        },
      }
    } else {
      apiData = {
        data: {
          ...base,
          ...plainFields,
        },
      }
    }

    const payloadToSend = apiData.data ?? apiData

    // Vérifier que le statut est bien dans le payload
    console.log("[addBeneficiaryAndActivate] Status check:", {
      statusInBase: base.status,
      statusInPayload: payloadToSend.status,
      beneficiaryStatus,
      statusStr,
      isOccasionalBeneficiary,
    })

    // S'assurer que le statut est bien 100 dans le payload final si c'est un bénéficiaire ponctuel
    if (isOccasionalBeneficiary && payloadToSend.status !== 100) {
      console.warn("[addBeneficiaryAndActivate] ATTENTION: Le statut devrait être 100 mais est:", payloadToSend.status)
      payloadToSend.status = 100
    }

    console.log("[addBeneficiaryAndActivate] API payload (secureMode:", secureMode, ")", apiData)
    console.log("[addBeneficiaryAndActivate] Payload sent to API (final status:", payloadToSend.status, ")", payloadToSend)

    const cookieToken = (await cookies()).get("token")?.value
    const usertoken = cookieToken

    // ✅ Use new streamlined endpoint
    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/beneficiaire/create-and-activate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usertoken}`,
      },
      body: JSON.stringify(payloadToSend),
    })

    if (!response.ok) {
      const errorMessage = await extractErrorMessage(response)
      return {
        success: false,
        error: errorMessage,
      }
    }

    const result = await response.json()

    revalidatePath("/transfers/beneficiaries")
    revalidatePath("/transfers/new")

    return {
      success: true,
      message: "Bénéficiaire ajouté et activé avec succès",
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout du bénéficiaire:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Une erreur inattendue s'est produite",
    }
  }
}

/**
 * OLD METHOD: Creates beneficiary in "CREATED" status (requires manual verification)
 * Kept for backward compatibility or manual workflows
 */
export async function addBeneficiary(prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const getStr = (k: string) => (formData.get(k) as string) || ""
    const name = getStr("name") || getStr("1_name")
    const account = getStr("account") || getStr("1_account")
    const type = getStr("type") || getStr("1_type")

    // Extract bank code from multiple possible field names
    let codeBanque =
      getStr("codeBanque") || getStr("bankCode") || getStr("1_bankCode") || getStr("bank") || getStr("1_bank")

    // Extract bank name
    let bankname = getStr("bankname") || getStr("1_bankname") || getStr("bankName") || getStr("1_bankName")

    // If we have a bank name but no code, try to derive the code
    if (bankname && !codeBanque) {
      codeBanque = getBankCode(bankname, type)
    }

    // If we have a code but no name, try to derive the name
    if (codeBanque && !bankname) {
      bankname = getBankNameFromCode(codeBanque)
    }

    const codeAgence = getStr("codeAgence") || getStr("1_codeAgence")
    const cleRib = getStr("cleRib") || getStr("1_cleRib")

    if (!name || !account || !type) {
      return {
        success: false,
        error: "Tous les champs obligatoires doivent être remplis",
      }
    }

    if (type === "BNG-INTERNATIONAL" && !bankname && !codeBanque) {
      return {
        success: false,
        error: "Le nom de la banque est obligatoire pour les bénéficiaires internationaux",
      }
    }

    if (type === "BNG-CONFRERE" && !(bankname || codeBanque)) {
      return {
        success: false,
        error: "Le nom de la banque est obligatoire",
      }
    }

    if (type !== "BNG-INTERNATIONAL") {
      const digitsOnly = account.replace(/\D/g, "")
      // Récupérer le statut pour vérifier si c'est un bénéficiaire ponctuel
      const statusStr = formData.get("status") as string | null
      const beneficiaryStatus = statusStr ? Number.parseInt(statusStr, 10) : 0
      const isOccasionalBeneficiary = beneficiaryStatus === 100
      
      // Pour les bénéficiaires ponctuels, le numéro de compte doit avoir 18 positions
      // Pour les autres, 10 positions
      const expectedLength = isOccasionalBeneficiary ? 18 : 10
      const errorMessage = isOccasionalBeneficiary 
        ? "Le numéro de compte doit contenir exactement 18 chiffres sans caractères spéciaux"
        : "Le numéro de compte doit contenir exactement 10 chiffres sans caractères spéciaux"
      
      if (digitsOnly.length !== expectedLength || account !== digitsOnly) {
        return {
          success: false,
          error: errorMessage,
        }
      }
    }

    const clientId = await getCurrentClientId()

    const secureMode = (process.env.NEXT_PUBLIC_PORTAL_SECURE_MODE || "false").toLowerCase() === "true"
    const keyB64 = process.env.PORTAL_KEY_B64 || ""
    const keyId = process.env.PORTAL_KEY_ID || "k1-mobile-v1"

    const base = {
      beneficiaryId: `BEN_${Date.now()}`,
      clientId: clientId,
      status: 0,
      workflowStatus: WORKFLOW_STATUS.CREATED,
      typeBeneficiary: type,
      favoris: false,
    }

    let apiData: any
    if (secureMode && keyB64) {
      const enc = (v: any) => ({ ...encryptAesGcmNode(v, keyB64), key_id: keyId })
      apiData = {
        data: {
          ...base,
          name_json: enc(name),
          accountNumber_json: enc(account),
          bankCode_json: enc(codeBanque || ""),
          bankName_json: enc(bankname || ""),
          codagence_json: enc(type === "BNG-INTERNATIONAL" ? "N/A" : codeAgence || "N/A"),
          clerib_json: enc(type === "BNG-INTERNATIONAL" ? "N/A" : cleRib || "N/A"),
          key_id: keyId,
          workflowStatus: WORKFLOW_STATUS.CREATED,
        },
      }
    } else {
      apiData = {
        data: {
          ...base,
          name: name,
          accountNumber: account,
          bankCode: codeBanque || "",
          bankName: bankname || "",
          codagence: type === "BNG-INTERNATIONAL" ? "N/A" : codeAgence || "N/A",
          clerib: type === "BNG-INTERNATIONAL" ? "N/A" : cleRib || "N/A",
          workflowStatus: WORKFLOW_STATUS.CREATED,
        },
      }
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
      const errorMessage = await extractErrorMessage(response)
      return {
        success: false,
        error: errorMessage,
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
    const codeAgence = formData.get("codeAgence") as string
    const codeBanque = formData.get("codeBanque") as string
    const cleRib = formData.get("cleRib") as string

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

    if (type !== "BNG-INTERNATIONAL") {
      const digitsOnly = account.replace(/\D/g, "")
      // Récupérer le statut pour vérifier si c'est un bénéficiaire ponctuel
      const statusStr = formData.get("status") as string | null
      const beneficiaryStatus = statusStr ? Number.parseInt(statusStr, 10) : 0
      const isOccasionalBeneficiary = beneficiaryStatus === 100
      
      // Pour les bénéficiaires ponctuels, le numéro de compte doit avoir 18 positions
      // Pour les autres, 10 positions
      const expectedLength = isOccasionalBeneficiary ? 18 : 10
      const errorMessage = isOccasionalBeneficiary 
        ? "Le numéro de compte doit contenir exactement 18 chiffres sans caractères spéciaux"
        : "Le numéro de compte doit contenir exactement 10 chiffres sans caractères spéciaux"
      
      if (digitsOnly.length !== expectedLength || account !== digitsOnly) {
        return {
          success: false,
          error: errorMessage,
        }
      }
    }

    const currentBeneficiaries = await getBeneficiaries()
    const currentBeneficiary = currentBeneficiaries.find((b) => b.id === id)

    const clientId = await getCurrentClientId()

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
        codagence: type === "BNG-INTERNATIONAL" ? "N/A" : codeAgence || "N/A",
        clerib: type === "BNG-INTERNATIONAL" ? "N/A" : cleRib || "N/A",
        workflowStatus: currentBeneficiary?.workflowStatus || WORKFLOW_STATUS.AVAILABLE,
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
      const errorMessage = await extractErrorMessage(response)
      return {
        success: false,
        error: errorMessage,
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
      const errorMessage = await extractErrorMessage(response)
      return {
        success: false,
        error: errorMessage,
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

    const apiData = {
      data: {
        favoris: !currentFavoriteStatus,
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
      console.error("[toggleBeneficiaryFavorite] API Error:", errorData)
      const defaultMessage = `Erreur lors de la modification du favori (${response.status})`
      const errorMessage = translateBeneficiaryError(response.status, errorData, defaultMessage)
      return {
        success: false,
        error: errorMessage,
      }
    }

    await response.json()

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

    const apiData = {
      data: {
        status: 1,
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
      const errorMessage = await extractErrorMessage(response)
      return {
        success: false,
        error: errorMessage,
      }
    }

    await response.json()

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

    const apiData = {
      data: {
        status: 0,
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
      const errorMessage = await extractErrorMessage(response)
      return {
        success: false,
        error: errorMessage,
      }
    }

    await response.json()

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

export async function getBanks() {
  const cookieToken = (await cookies()).get("token")?.value
  const usertoken = cookieToken

  try {
    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/banque`, {
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
    return data.rows || []
  } catch (error) {
    console.error("Erreur lors de la récupération des banques:", error)
    return []
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
