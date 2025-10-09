"use server"
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
interface ComplaintFormData {
  fullName: string
  accountNumber: string
  email: string
  phone: string
  complaintType: string
  priority: string
  description: string
  transactionDate?: string
  transactionAmount?: string
  transactionReference?: string
}

interface ComplaintState {
  success?: boolean
  error?: string
  reference?: string
}

// Validation functions
function validateAccountNumber(accountNumber: string): boolean {
  // Format IBAN Guinée : GN + 15 chiffres
  const ibanPattern = /^GN\d{15}$/
  // Format interne : 10-15 chiffres
  const internalPattern = /^\d{10,15}$/

  return ibanPattern.test(accountNumber) || internalPattern.test(accountNumber)
}

function validateEmail(email: string): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailPattern.test(email)
}

function validatePhone(phone: string): boolean {
  // Supprime tous les caractères non numériques
  const cleanPhone = phone.replace(/\D/g, "")
  return cleanPhone.length >= 8 && cleanPhone.length <= 15
}

function validateTransactionDate(dateString: string): boolean {
  const date = new Date(dateString)
  const today = new Date()
  today.setHours(23, 59, 59, 999) // Fin de journée

  return date <= today
}

function generateComplaintReference(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")

  // Génère un numéro séquentiel (simulé)
  const sequence = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")

  return `RCLM-${year}${month}${day}-${sequence}`
}

export async function submitComplaint(prevState: ComplaintState | null, formData: FormData): Promise<ComplaintState> {
  try {
    // Extraction des données du formulaire
    const data: ComplaintFormData = {
      fullName: formData.get("fullName") as string,
      accountNumber: formData.get("accountNumber") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      complaintType: formData.get("complaintType") as string,
      priority: formData.get("priority") as string,
      description: formData.get("description") as string,
      transactionDate: (formData.get("transactionDate") as string) || undefined,
      transactionAmount: (formData.get("transactionAmount") as string) || undefined,
      transactionReference: (formData.get("transactionReference") as string) || undefined,
    }

    // Validations obligatoires
    if (!data.fullName?.trim()) {
      return { error: "Le nom complet est obligatoire." }
    }

    if (!validateAccountNumber(data.accountNumber)) {
      return { error: "Le numéro de compte saisi est incorrect." }
    }

    if (!validateEmail(data.email)) {
      return { error: "Merci de saisir une adresse e-mail valide." }
    }

    if (!validatePhone(data.phone)) {
      return { error: "Le numéro de téléphone doit contenir entre 8 et 15 chiffres." }
    }

    if (!data.description?.trim() || data.description.trim().length < 20) {
      return { error: "Veuillez décrire précisément votre réclamation (minimum 20 caractères)." }
    }

    // Validations optionnelles pour la transaction
    if (data.transactionDate && !validateTransactionDate(data.transactionDate)) {
      return { error: "La date de la transaction ne peut pas être dans le futur." }
    }

    if (data.transactionAmount) {
      const amount = Number.parseFloat(data.transactionAmount)
      if (isNaN(amount) || amount <= 0) {
        return { error: "Le montant de la transaction doit être supérieur à zéro." }
      }
    }

    // Génération du numéro de référence
    const reference = generateComplaintReference()

    // Simulation de l'enregistrement en base de données
    const complaint = {
      id: reference,
      ...data,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Simulation d'un délai de traitement
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Log pour le développement (à remplacer par une vraie sauvegarde)
    //console.log("Nouvelle réclamation enregistrée:", complaint)

    // Simulation d'envoi d'email de confirmation
    //console.log(`Email de confirmation envoyé à ${data.email}`)

    // Simulation de notification au back-office
    //console.log(`Notification back-office pour réclamation ${reference}`)

    return {
      success: true,
      reference: reference,
    }
  } catch (error) {
    console.error("Erreur lors de la soumission de la réclamation:", error)
    return {
      error: "Une erreur technique est survenue. Veuillez réessayer plus tard.",
    }
  }
}
