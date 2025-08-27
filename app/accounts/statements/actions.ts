"use server"

import { z } from "zod"

// Schéma de validation pour la génération de relevé
const generateStatementSchema = z.object({
  accountId: z.string().min(1, "Compte requis"),
  startDate: z.string().min(1, "Date de début requise"),
  endDate: z.string().min(1, "Date de fin requise"),
  format: z.enum(["pdf", "excel"], { required_error: "Format requis" }),
  includeImages: z.string().transform((val) => val === "true"),
  language: z.enum(["fr", "en"]).default("fr"),
})

// Schéma pour l'envoi par email
const emailStatementSchema = z.object({
  email: z.string().email("Email invalide"),
  statementId: z.string().min(1, "ID du relevé requis"),
})

// Génération du relevé
export async function generateStatement(prevState: any, formData: FormData) {
  try {
    // Validation des données
    const validatedData = generateStatementSchema.parse({
      accountId: formData.get("accountId"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      format: formData.get("format"),
      includeImages: formData.get("includeImages"),
      language: formData.get("language"),
    })

    const { accountId, startDate, endDate, format, includeImages, language } = validatedData

    const transactionsJson = formData.get("transactions") as string
    let realTransactions = []

    try {
      if (transactionsJson) {
        realTransactions = JSON.parse(transactionsJson)
      }
    } catch (error) {
      console.error("Erreur parsing transactions:", error)
    }

    // Vérification de la période
    const start = new Date(startDate)
    const end = new Date(endDate)
    const now = new Date()

    if (start > end) {
      return {
        success: false,
        error: "La date de début doit être antérieure à la date de fin",
      }
    }

    if (end > now) {
      return {
        success: false,
        error: "La date de fin ne peut pas être dans le futur",
      }
    }

    // Vérification de la limite de période (max 2 ans)
    const maxPeriod = 2 * 365 * 24 * 60 * 60 * 1000 // 2 ans en millisecondes
    if (end.getTime() - start.getTime() > maxPeriod) {
      return {
        success: false,
        error: "La période ne peut pas dépasser 2 ans",
      }
    }

    console.log(
      `[AUDIT] Génération relevé - Compte: ${accountId}, Période: ${startDate} à ${endDate}, Transactions: ${realTransactions.length}`,
    )

    // Simulation d'un délai de génération
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Vérification s'il y a des transactions
    if (realTransactions.length === 0) {
      return {
        success: false,
        error: "❌ Aucune transaction trouvée pour cette période.",
      }
    }

    // Simulation de la génération du fichier
    const statementId = `STMT_${Date.now()}_${accountId}`
    const fileName = `releve_${accountId}_${startDate}_${endDate}.${format}`

    const totalCredits = realTransactions
      .filter((txn: any) => txn.txnType === "CREDIT")
      .reduce((sum: number, txn: any) => sum + Math.abs(Number.parseFloat(txn.amount || "0")), 0)

    const totalDebits = realTransactions
      .filter((txn: any) => txn.txnType === "DEBIT")
      .reduce((sum: number, txn: any) => sum + Math.abs(Number.parseFloat(txn.amount || "0")), 0)

    // Simulation des données du relevé avec vraies transactions
    const statementData = {
      accountId,
      accountName: getAccountName(accountId),
      accountNumber: getAccountNumber(accountId),
      period: { start: startDate, end: endDate },
      format,
      language,
      includeImages,
      transactions: realTransactions,
      summary: {
        openingBalance: 1500000, // À calculer selon les vraies données
        closingBalance: 1500000 + totalCredits - totalDebits,
        totalCredits,
        totalDebits,
        transactionCount: realTransactions.length,
      },
      generatedAt: new Date().toISOString(),
      generatedBy: "USER123",
    }

    // Simulation de la génération du fichier selon le format
    let fileSize: string
    let downloadUrl: string

    if (format === "pdf") {
      // Génération PDF avec jsPDF ou similaire
      fileSize = "245 KB"
      downloadUrl = `/api/statements/download/${statementId}.pdf`

      console.log("Génération PDF:", {
        pages: Math.ceil(statementData.transactions.length / 20),
        includeImages,
        language,
      })
    } else {
      // Génération Excel avec ExcelJS ou similaire
      fileSize = "89 KB"
      downloadUrl = `/api/statements/download/${statementId}.xlsx`

      console.log("Génération Excel:", {
        sheets: ["Résumé", "Transactions", "Graphiques"],
        includeImages,
        language,
      })
    }

    // Sauvegarde des métadonnées du relevé
    await saveStatementMetadata({
      id: statementId,
      accountId,
      fileName,
      fileSize,
      format,
      period: `${startDate} à ${endDate}`,
      downloadUrl,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
    })

    // Log d'audit avec vraies données
    console.log(
      `[AUDIT] Relevé généré avec succès - ID: ${statementId}, Format: ${format.toUpperCase()}, Transactions: ${realTransactions.length}`,
    )

    return {
      success: true,
      message: "Relevé généré avec succès",
      statementId,
      fileName,
      fileSize: format === "pdf" ? "245 KB" : "89 KB",
      downloadUrl: `/api/statements/download/${statementId}.${format}`,
      format: format.toUpperCase(),
      period: `${new Date(startDate).toLocaleDateString("fr-FR")} au ${new Date(endDate).toLocaleDateString("fr-FR")}`,
      transactionCount: realTransactions.length,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Erreur lors de la génération du relevé:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Données invalides",
      }
    }

    return {
      success: false,
      error: "Erreur lors de la génération du relevé. Veuillez réessayer.",
    }
  }
}

// Envoi du relevé par email
export async function sendStatementByEmail(prevState: any, formData: FormData) {
  try {
    const validatedData = emailStatementSchema.parse({
      email: formData.get("email"),
      statementId: formData.get("statementId"),
    })

    const { email, statementId } = validatedData

    // Simulation d'un délai d'envoi
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Simulation d'une erreur d'envoi (3% de chance)
    if (Math.random() < 0.03) {
      throw new Error("Erreur lors de l'envoi de l'email")
    }

    // Récupération des métadonnées du relevé
    const statementMetadata = await getStatementMetadata(statementId)

    if (!statementMetadata) {
      return {
        success: false,
        error: "Relevé introuvable",
      }
    }

    // Simulation de l'envoi d'email
    console.log(`Envoi email à ${email}:`, {
      subject: `Relevé de compte - ${statementMetadata.period}`,
      attachmentName: statementMetadata.fileName,
      attachmentSize: statementMetadata.fileSize,
    })

    // Log d'audit
    console.log(`[AUDIT] Relevé envoyé par email - ID: ${statementId}, Destinataire: ${email}`)

    return {
      success: true,
      message: `Relevé envoyé avec succès à ${email}`,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi par email:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Email invalide",
      }
    }

    return {
      success: false,
      error: "Erreur lors de l'envoi de l'email. Veuillez réessayer.",
    }
  }
}

// Récupération de l'historique des relevés
export async function getStatementHistory(prevState: any, formData: FormData) {
  try {
    const accountId = formData.get("accountId") as string
    const limit = Number.parseInt(formData.get("limit") as string) || 10

    // Simulation d'un délai de récupération
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Simulation des données d'historique
    const history = [
      {
        id: "STMT_1704967800_1",
        accountName: "Compte Courant",
        period: "Décembre 2023",
        format: "PDF",
        generatedAt: "15 Jan 2024 10:30",
        downloadCount: 3,
        fileSize: "245 KB",
        status: "Généré",
        expiresAt: "15 Fév 2024",
      },
      {
        id: "STMT_1704708600_2",
        accountName: "Compte Épargne",
        period: "Novembre 2023",
        format: "Excel",
        generatedAt: "12 Jan 2024 14:15",
        downloadCount: 1,
        fileSize: "89 KB",
        status: "Généré",
        expiresAt: "12 Fév 2024",
      },
    ]

    return {
      success: true,
      data: history.slice(0, limit),
      total: history.length,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error)

    return {
      success: false,
      error: "Erreur lors de la récupération de l'historique",
      timestamp: new Date().toISOString(),
    }
  }
}

// Fonctions utilitaires
async function generateTransactionData(accountId: string, startDate: string, endDate: string) {
  // Simulation de la génération des données de transaction
  const transactions = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

  // Génération de 1-3 transactions par jour en moyenne
  const transactionCount = Math.floor(daysDiff * (Math.random() * 2 + 1))

  for (let i = 0; i < Math.min(transactionCount, 100); i++) {
    const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))

    transactions.push({
      id: `TXN_${Date.now()}_${i}`,
      date: randomDate.toISOString(),
      description: getRandomTransactionDescription(),
      amount: getRandomAmount(),
      balance: 2000000 + Math.random() * 1000000,
      type: Math.random() > 0.6 ? "CREDIT" : "DEBIT",
      reference: `REF${Date.now()}${i}`,
    })
  }

  return transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

function getRandomTransactionDescription(): string {
  const descriptions = [
    "Virement reçu - Aissatou Bah",
    "Paiement facture EDG",
    "Retrait DAB Kaloum",
    "Virement émis - Mamadou Sow",
    "Dépôt espèces",
    "Paiement Orange Money",
    "Achat Espace Supermarché",
    "Frais de tenue de compte",
    "Intérêts créditeurs",
    "Virement salaire",
  ]
  return descriptions[Math.floor(Math.random() * descriptions.length)]
}

function getRandomAmount(): number {
  return Math.floor(Math.random() * 500000) + 10000
}

function getAccountName(accountId: string): string {
  const names = {
    "1": "Compte Courant",
    "2": "Compte Épargne",
    "3": "Compte USD",
  }
  return names[accountId as keyof typeof names] || "Compte Inconnu"
}

function getAccountNumber(accountId: string): string {
  const numbers = {
    "1": "0001-234567-89",
    "2": "0002-345678-90",
    "3": "0003-456789-01",
  }
  return numbers[accountId as keyof typeof numbers] || "0000-000000-00"
}

async function saveStatementMetadata(metadata: any) {
  // Simulation de la sauvegarde en base de données
  console.log("Sauvegarde métadonnées relevé:", metadata)
  return true
}

async function getStatementMetadata(statementId: string) {
  // Simulation de la récupération des métadonnées
  return {
    id: statementId,
    fileName: `releve_${statementId}.pdf`,
    fileSize: "245 KB",
    period: "Décembre 2023",
    format: "PDF",
  }
}
