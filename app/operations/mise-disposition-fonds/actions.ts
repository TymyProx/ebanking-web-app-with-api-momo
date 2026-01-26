"use server"
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

import { cookies } from "next/headers"
import { getApiBaseUrl, TENANT_ID } from "@/lib/api-url"

const API_BASE_URL = getApiBaseUrl()

interface FundsProvisionData {
  reference: string
  compteAdebiter: string
  montant: number
  fullNameBenef: string
  numCni: string
  agence: string
  statut: string
  clientId: string
}

interface FundsProvision {
  id: string
  reference: string
  compteAdebiter: string
  montant: string
  fullNameBenef: string
  numCni: string
  agence: string
  statut: string
  clientId?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  createdById?: string
  updatedById?: string
  importHash?: string
  tenantId?: string
}

interface GetFundsProvisionsResponse {
  success: boolean
  data: {
    rows: FundsProvision[]
    count: number
  }
}

async function generateFundsProvisionReference(): Promise<string> {
  try {
    const requests = await getFundsProvisionRequests()
    const existingCount = requests.data?.rows?.length || 0

    const currentYear = new Date().getFullYear()
    const sequence = String(existingCount + 1).padStart(3, "0")

    return `MDF-${currentYear}-${sequence}`
  } catch (error) {
    const currentYear = new Date().getFullYear()
    const timestamp = Date.now().toString().slice(-3)
    return `MDF-${currentYear}-${timestamp}`
  }
}

/**
 * Génère un code de référence unique pour le retrait en caisse
 * Format: RET-YYYYMMDD-HHMMSS-XXXX (ex: RET-20241215-143025-A7B2)
 */
function generateWithdrawalCode(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")
  const seconds = String(now.getSeconds()).padStart(2, "0")
  
  // Générer 4 caractères alphanumériques aléatoires
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let randomCode = ""
  for (let i = 0; i < 4; i++) {
    randomCode += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return `RET-${year}${month}${day}-${hours}${minutes}${seconds}-${randomCode}`
}

/**
 * Génère un PDF avec le résumé de la mise à disposition des fonds
 */
async function generateFundsProvisionPDF(data: {
  reference: string
  withdrawalCode: string
  compteAdebiter: string
  montant: number
  fullNameBenef: string
  numCni: string
  agence: string
  clientName?: string
  clientEmail?: string
}): Promise<Uint8Array> {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF()
  const pageWidth = 210
  const pageHeight = 297
  
  const blackText: [number, number, number] = [0, 0, 0]
  const grayText: [number, number, number] = [100, 100, 100]
  const primaryGreen: [number, number, number] = [11, 132, 56]
  
  let yPos = 15
  
  // En-tête
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...primaryGreen)
  doc.text("BANQUE NATIONALE DE GUINÉE", pageWidth / 2, yPos, { align: "center" })
  
  yPos += 8
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...grayText)
  doc.text("6ème Avenue Boulevard DIALLO Telly BP: 1781 Conakry", pageWidth / 2, yPos, { align: "center" })
  
  yPos += 15
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...blackText)
  doc.text("MISE À DISPOSITION DES FONDS", pageWidth / 2, yPos, { align: "center" })
  
  yPos += 10
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...grayText)
  doc.text(`Date d'émission: ${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}`, pageWidth / 2, yPos, { align: "center" })
  
  yPos += 15
  
  // Informations de l'opération
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...blackText)
  doc.text("RÉSUMÉ DE L'OPÉRATION", 15, yPos)
  
  yPos += 8
  
  // Fonction pour formater le montant sans slash
  const formatAmount = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  }
  
  const infoItems = [
    { label: "Code de retrait", value: data.withdrawalCode },
    { label: "Compte à débiter", value: data.compteAdebiter },
    { label: "Montant", value: `${formatAmount(data.montant)} GNF` },
    { label: "Nom du bénéficiaire", value: data.fullNameBenef },
    { label: "Numéro CNI", value: data.numCni },
    { label: "Agence de retrait", value: data.agence },
  ]
  
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  infoItems.forEach((item) => {
    doc.setTextColor(...grayText)
    doc.text(`${item.label}:`, 15, yPos)
    doc.setTextColor(...blackText)
    doc.setFont("helvetica", "bold")
    const valueX = 80
    doc.text(item.value, valueX, yPos)
    doc.setFont("helvetica", "normal")
    yPos += 7
  })
  
  yPos += 10
  
  // Instructions importantes
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...primaryGreen)
  doc.text("INSTRUCTIONS IMPORTANTES", 15, yPos)
  
  yPos += 8
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...blackText)
  
  const instructions = [
    `Le bénéficiaire doit se présenter à l'agence ${data.agence} avec:`,
    "- Ce document (ou une copie)",
    "- Une pièce d'identité valide (CNI)",
    `- Le code de retrait: ${data.withdrawalCode}`,
    "",
    "Le bénéficiaire devra présenter sa CNI correspondant au numéro indiqué ci-dessus.",
    "Le retrait doit être effectué dans un délai de 30 jours à compter de la date d'émission.",
  ]
  
  instructions.forEach((instruction) => {
    doc.text(instruction, 15, yPos)
    yPos += 5
  })
  
  // Pied de page
  yPos = pageHeight - 20
  doc.setFontSize(7)
  doc.setTextColor(...grayText)
  doc.text("Ce document est généré automatiquement et fait foi de la demande de mise à disposition des fonds.", pageWidth / 2, yPos, { align: "center" })
  
  yPos += 5
  doc.text("Pour toute question, contactez le service client au +224 XXX XXX XXX", pageWidth / 2, yPos, { align: "center" })
  
  return doc.output("arraybuffer") as unknown as Uint8Array
}

/**
 * Envoie le PDF par email au client
 */
async function sendFundsProvisionEmail(data: {
  to: string
  clientName?: string
  reference: string
  withdrawalCode: string
  montant: number
  pdfContent: Uint8Array
}): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "BNG eBanking <no-reply@bngebanking.com>"
  
  if (!resendApiKey) {
    console.error("[MDF] RESEND_API_KEY manquante. Impossible d'envoyer l'email.")
    return {
      success: false,
      error: "Clé API Resend manquante",
    }
  }
  
  try {
    // Convertir Uint8Array en base64
    const base64Content = Buffer.from(data.pdfContent).toString("base64")
    const fileName = `Mise_Disposition_Fonds_${data.withdrawalCode}_${new Date().toISOString().split("T")[0]}.pdf`
    
    const clientName = data.clientName || "Client"
    const emailSubject = `Mise à disposition des fonds - Code de retrait ${data.withdrawalCode}`
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0B8338;">Mise à disposition des fonds</h2>
        <p>Bonjour ${clientName},</p>
        <p>Votre demande de mise à disposition des fonds a été enregistrée avec succès.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Code de retrait:</strong> <span style="font-size: 18px; color: #0B8338; font-weight: bold;">${data.withdrawalCode}</span></p>
          <p><strong>Montant:</strong> ${data.montant.toLocaleString("fr-FR")} GNF</p>
        </div>
        <p><strong>Important:</strong> Le bénéficiaire doit se présenter à l'agence avec ce document, sa CNI et le code de retrait ci-dessus.</p>
        <p>Veuillez trouver ci-joint le récapitulatif de votre opération au format PDF.</p>
        <p>Cordialement,<br/>Banque Nationale de Guinée</p>
      </div>
    `
    const emailText = `Bonjour ${clientName},\n\nVotre demande de mise à disposition des fonds a été enregistrée avec succès.\n\nCode de retrait: ${data.withdrawalCode}\nMontant: ${data.montant.toLocaleString("fr-FR")} GNF\n\nLe bénéficiaire doit se présenter à l'agence avec ce document, sa CNI et le code de retrait.\n\nCordialement,\nBanque Nationale de Guinée`
    
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: data.to,
        subject: emailSubject,
        html: emailHtml,
        text: emailText,
        attachments: [
          {
            filename: fileName,
            content: base64Content,
            content_type: "application/pdf",
          },
        ],
      }),
    })
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => null)
      const message = errorBody?.message || errorBody?.error || response.statusText
      throw new Error(message || "Requête Resend échouée")
    }
    
    return {
      success: true,
    }
  } catch (error) {
    console.error("[MDF] Erreur lors de l'envoi de l'email via Resend:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    }
  }
}

export async function submitFundsProvisionRequest(data: {
  compteAdebiter: string
  montant: number
  fullNameBenef: string
  numCni: string
  agence: string
}) {
  try {
    const cookieToken = (await cookies()).get("token")?.value

    if (!cookieToken) {
      throw new Error("Token d'authentification introuvable.")
    }

    const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${cookieToken}`,
      },
    })

    if (!userResponse.ok) {
      throw new Error("Impossible de récupérer les informations utilisateur")
    }

    const userData = await userResponse.json()
    const clientId = userData.id
    const clientName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || userData.fullName || "Client"
    const clientEmail = userData.email

    const mdfReference = await generateFundsProvisionReference()
    const withdrawalCode = generateWithdrawalCode()
    
    // Le code de retrait est utilisé comme référence pour le retrait en caisse
    // La référence MDF est conservée pour le suivi interne mais le withdrawalCode est la référence principale
    const reference = withdrawalCode

    const fundsProvisionData: FundsProvisionData = {
      reference, // Code de retrait utilisé pour le retrait en caisse
      compteAdebiter: data.compteAdebiter,
      montant: data.montant,
      fullNameBenef: data.fullNameBenef,
      numCni: data.numCni,
      agence: data.agence,
      statut: "EN_ATTENTE",
      clientId: clientId,
    }

    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/mise-dpstion-fonds`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookieToken}`,
      },
      body: JSON.stringify({ data: fundsProvisionData }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Erreur lors de la soumission de la demande")
    }

    const result = await response.json()

    // Générer le PDF et envoyer par email
    try {
      const pdfContent = await generateFundsProvisionPDF({
        reference: mdfReference, // Utiliser la référence MDF pour l'affichage
        withdrawalCode, // Code de retrait
        compteAdebiter: data.compteAdebiter,
        montant: data.montant,
        fullNameBenef: data.fullNameBenef,
        numCni: data.numCni,
        agence: data.agence,
        clientName,
        clientEmail,
      })

      if (clientEmail) {
        await sendFundsProvisionEmail({
          to: clientEmail,
          clientName,
          reference,
          withdrawalCode,
          montant: data.montant,
          pdfContent,
        })
        console.log(`[MDF] Email envoyé avec succès à ${clientEmail}`)
      } else {
        console.warn("[MDF] Aucun email trouvé pour l'utilisateur, le PDF n'a pas été envoyé")
      }
    } catch (pdfError) {
      console.error("[MDF] Erreur lors de la génération du PDF ou de l'envoi de l'email:", pdfError)
      // Ne pas faire échouer la soumission si le PDF/email échoue
    }

    return {
      success: true,
      reference,
      withdrawalCode, // Retourner aussi le code de retrait
      data: result,
    }
  } catch (error: any) {
    console.error("Error submitting funds provision request:", error)
    throw new Error(error.message || "Erreur lors de la soumission")
  }
}

export async function getFundsProvisionRequests(): Promise<GetFundsProvisionsResponse> {
  try {
    const cookieToken = (await cookies()).get("token")?.value

    if (!cookieToken) {
      return { success: false, data: { rows: [], count: 0 } }
    }

    // Récupérer les informations de l'utilisateur connecté pour obtenir le clientId
    const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${cookieToken}`,
      },
    })

    if (!userResponse.ok) {
      console.error("[MDF] Impossible de récupérer les informations utilisateur")
      return { success: false, data: { rows: [], count: 0 } }
    }

    const userData = await userResponse.json()
    const clientId = userData.id

    if (!clientId) {
      console.error("[MDF] clientId introuvable dans les données utilisateur")
      return { success: false, data: { rows: [], count: 0 } }
    }

    // Récupérer toutes les demandes avec filtre clientId dans l'URL
    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/mise-dpstion-fonds?filter[clientId]=${clientId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookieToken}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      console.log("[v0] Response not OK, status:", response.status)
      
      // Si le filtre dans l'URL ne fonctionne pas, récupérer toutes les demandes et filtrer côté client
      const fallbackResponse = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/mise-dpstion-fonds`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookieToken}`,
        },
        cache: "no-store",
      })

      if (!fallbackResponse.ok) {
        const errorData = await fallbackResponse.json()
        throw new Error(errorData.message || "Erreur lors de la récupération des demandes")
      }

      const fallbackResult = await fallbackResponse.json()
      
      // Filtrer les résultats par clientId côté client
      if (fallbackResult?.rows && Array.isArray(fallbackResult.rows)) {
        const filteredRows = fallbackResult.rows.filter((item: any) => item.clientId === clientId)
        return {
          ...fallbackResult,
          rows: filteredRows,
          count: filteredRows.length,
        }
      }

      return { success: false, data: { rows: [], count: 0 } }
    }

    const result = await response.json()
    
    // Double vérification : filtrer aussi côté client au cas où le backend ne filtre pas correctement
    if (result?.rows && Array.isArray(result.rows)) {
      const filteredRows = result.rows.filter((item: any) => item.clientId === clientId)
      return {
        ...result,
        rows: filteredRows,
        count: filteredRows.length,
      }
    }

    console.log("[v0] API Response in action:", result)
    return result
  } catch (error: any) {
    console.error("Error fetching funds provision requests:", error)
    return { success: false, data: { rows: [], count: 0 } }
  }
}

export async function getFundsProvisionById(id: string): Promise<any> {
  try {
    const cookieToken = (await cookies()).get("token")?.value

    if (!cookieToken) {
      throw new Error("Token introuvable.")
    }

    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/mise-dpstion-fonds/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookieToken}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Erreur lors de la récupération des détails")
    }

    const result = await response.json()
    return result
  } catch (error: any) {
    console.error("Error fetching funds provision details:", error)
    return null
  }
}
