"use server"

import { revalidatePath } from "next/cache"

interface CheckDepositFormData {
  checkNumber: string
  amount: string
  payerName: string
  bankName?: string
  depositAccount: string
  notes?: string
  checkImage?: File
}

interface CheckDepositState {
  success?: boolean
  error?: string
  message?: string
  depositId?: string
}

export async function submitCheckDeposit(
  prevState: CheckDepositState | null,
  formData: FormData,
): Promise<CheckDepositState> {
  try {
    // Extraction des données du formulaire
    const checkNumber = formData.get("checkNumber") as string
    const amount = formData.get("amount") as string
    const payerName = formData.get("payerName") as string
    const bankName = formData.get("bankName") as string
    const depositAccount = formData.get("depositAccount") as string
    const notes = formData.get("notes") as string
    const checkImage = formData.get("checkImage") as File

    // Validations
    if (!checkNumber || !amount || !payerName || !depositAccount) {
      return {
        success: false,
        error: "Tous les champs obligatoires doivent être renseignés",
      }
    }

    if (!checkImage || checkImage.size === 0) {
      return {
        success: false,
        error: "La photo du chèque est obligatoire",
      }
    }

    // Validation de l'image
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!allowedTypes.includes(checkImage.type)) {
      return {
        success: false,
        error: "Format d'image non supporté. Utilisez JPG, PNG ou WebP.",
      }
    }

    if (checkImage.size > maxSize) {
      return {
        success: false,
        error: "Image trop volumineuse. Maximum 5MB autorisé.",
      }
    }

    // Validation du montant
    const amountNum = Number.parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      return {
        success: false,
        error: "Le montant doit être un nombre positif",
      }
    }

    if (amountNum > 50000000) {
      // 50M GNF
      return {
        success: false,
        error: "Le montant ne peut pas dépasser 50,000,000 GNF",
      }
    }

    // Validation du numéro de chèque
    if (!/^\d{6,10}$/.test(checkNumber)) {
      return {
        success: false,
        error: "Le numéro de chèque doit contenir entre 6 et 10 chiffres",
      }
    }

    // Traitement de l'image (simulation)
    const imageBuffer = await checkImage.arrayBuffer()
    const imageId = generateImageId()

    // Simulation de la validation de l'image
    const imageValidation = await validateCheckImage(imageBuffer, {
      checkNumber,
      amount: amountNum,
      payerName,
    })

    if (!imageValidation.isValid) {
      return {
        success: false,
        error: imageValidation.error || "Image du chèque non valide",
      }
    }

    // Génération d'un ID de dépôt
    const depositId = `DEP_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    // Simulation de l'enregistrement en base de données
    const depositData = {
      id: depositId,
      checkNumber,
      amount: amountNum,
      payerName,
      bankName: bankName || "Non spécifiée",
      depositAccount,
      notes: notes || "",
      imageId,
      status: "pending",
      submittedAt: new Date().toISOString(),
      estimatedProcessingTime: "2-3 jours ouvrables",
    }

    // Simulation de l'enregistrement
    await saveCheckDeposit(depositData)

    // Simulation de l'envoi de notification
    await sendDepositNotification(depositData)

    // Nettoyage sécurisé de l'image temporaire
    await secureImageCleanup(imageId)

    // Revalidation de la page
    revalidatePath("/services/check-deposit")

    return {
      success: true,
      message: `Chèque déposé avec succès ! Référence: ${depositId}. Traitement estimé: 2-3 jours ouvrables.`,
      depositId,
    }
  } catch (error) {
    console.error("Erreur lors du dépôt de chèque:", error)
    return {
      success: false,
      error: "Une erreur technique est survenue. Veuillez réessayer.",
    }
  }
}

// Fonctions utilitaires

function generateImageId(): string {
  return `IMG_${Date.now()}_${Math.random().toString(36).substr(2, 8).toUpperCase()}`
}

async function validateCheckImage(
  imageBuffer: ArrayBuffer,
  checkData: { checkNumber: string; amount: number; payerName: string },
): Promise<{ isValid: boolean; error?: string }> {
  // Simulation de validation d'image
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Vérification de la taille du buffer
  if (imageBuffer.byteLength < 1000) {
    return { isValid: false, error: "Image corrompue ou trop petite" }
  }

  // Simulation de vérification des headers de fichier
  const uint8Array = new Uint8Array(imageBuffer.slice(0, 4))
  const header = Array.from(uint8Array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  // Vérification des signatures de fichiers
  const validHeaders = [
    "ffd8ff", // JPEG
    "89504e", // PNG
    "524946", // WebP (RIFF)
  ]

  const isValidFormat = validHeaders.some((validHeader) => header.startsWith(validHeader))
  if (!isValidFormat) {
    return { isValid: false, error: "Format de fichier non valide" }
  }

  // Simulation OCR basique (vérification de cohérence)
  const ocrResult = await simulateOCR(imageBuffer)
  if (ocrResult.confidence < 0.7) {
    return { isValid: false, error: "Image de qualité insuffisante. Veuillez reprendre la photo." }
  }

  return { isValid: true }
}

async function simulateOCR(imageBuffer: ArrayBuffer): Promise<{ confidence: number; extractedText?: string }> {
  // Simulation d'OCR
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Simulation basée sur la taille de l'image
  const confidence = Math.random() * 0.4 + 0.6 // Entre 0.6 et 1.0

  return {
    confidence,
    extractedText: "Texte extrait simulé du chèque",
  }
}

async function saveCheckDeposit(depositData: any): Promise<void> {
  // Simulation de sauvegarde en base de données
  await new Promise((resolve) => setTimeout(resolve, 800))

  //console.log("Dépôt de chèque enregistré:", {
    id: depositData.id,
    amount: depositData.amount,
    status: depositData.status,
  })
}

async function sendDepositNotification(depositData: any): Promise<void> {
  // Simulation d'envoi de notification
  await new Promise((resolve) => setTimeout(resolve, 300))

  //console.log("Notification envoyée pour le dépôt:", depositData.id)
}

async function secureImageCleanup(imageId: string): Promise<void> {
  // Simulation de nettoyage sécurisé
  await new Promise((resolve) => setTimeout(resolve, 200))

  //console.log("Nettoyage sécurisé de l'image:", imageId)
}

// Action pour récupérer l'historique des dépôts
export async function getCheckDeposits(): Promise<any[]> {
  // Simulation de récupération des données
  await new Promise((resolve) => setTimeout(resolve, 500))

  return [
    {
      id: "DEP_1704067200_ABC123",
      checkNumber: "1234567",
      amount: 500000,
      payerName: "Jean Dupont",
      bankName: "BCRG",
      status: "completed",
      submittedAt: "2024-01-01T10:00:00Z",
      processedAt: "2024-01-03T14:30:00Z",
      hasImage: true,
    },
    {
      id: "DEP_1704153600_DEF456",
      checkNumber: "7654321",
      amount: 1200000,
      payerName: "Marie Martin",
      bankName: "BICIGUI",
      status: "pending",
      submittedAt: "2024-01-02T15:30:00Z",
      hasImage: true,
    },
    {
      id: "DEP_1704240000_GHI789",
      checkNumber: "9876543",
      amount: 750000,
      payerName: "Pierre Durand",
      bankName: "SGBG",
      status: "rejected",
      submittedAt: "2024-01-03T09:15:00Z",
      rejectedAt: "2024-01-04T11:00:00Z",
      rejectionReason: "Signature non conforme",
      hasImage: true,
    },
  ]
}
