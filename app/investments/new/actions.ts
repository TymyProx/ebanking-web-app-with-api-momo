"use server"
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
interface InvestmentData {
  investorName: string
  email: string
  investmentType: string
  amount: string
  duration: string
  customDuration?: string
  riskProfile: string
}

// Simulation d'une base de données des placements
const investments: Array<
  InvestmentData & {
    id: string
    reference: string
    status: string
    createdAt: Date
    estimatedReturn: number
  }
> = []

export async function submitInvestment(prevState: any, formData: FormData) {
  try {
    // Extraction des données du formulaire
    const investorName = formData.get("investorName") as string
    const email = formData.get("email") as string
    const investmentType = formData.get("investmentType") as string
    const amount = formData.get("amount") as string
    const duration = formData.get("duration") as string
    const customDuration = formData.get("customDuration") as string
    const riskProfile = formData.get("riskProfile") as string

    // Validation côté serveur
    const errors: string[] = []

    // Validation du nom (pas de caractères spéciaux)
    if (!investorName || !/^[a-zA-ZÀ-ÿ\s'-]+$/.test(investorName)) {
      errors.push("Le nom contient des caractères non autorisés.")
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      errors.push("Adresse email invalide.")
    }

    // Validation du type de placement
    const validTypes = ["actions", "obligations", "fonds_communs", "epargne_terme"]
    if (!investmentType || !validTypes.includes(investmentType)) {
      errors.push("Veuillez choisir un produit de placement.")
    }

    // Validation du montant
    const amountNum = Number.parseFloat(amount)
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      errors.push("Le montant doit être strictement supérieur à 0.")
    }

    if (amountNum < 100000) {
      errors.push("Le montant minimum est de 100,000 GNF.")
    }

    // Validation de la durée
    let finalDuration: number
    if (duration === "custom") {
      finalDuration = Number.parseInt(customDuration)
      if (!customDuration || isNaN(finalDuration) || finalDuration <= 0 || finalDuration > 120) {
        errors.push("Veuillez indiquer une durée d'investissement valide (1-120 mois).")
      }
    } else {
      finalDuration = Number.parseInt(duration)
      if (isNaN(finalDuration) || finalDuration <= 0) {
        errors.push("Veuillez indiquer une durée d'investissement valide.")
      }
    }

    // Validation du profil de risque
    const validProfiles = ["conservateur", "modere", "dynamique"]
    if (!riskProfile || !validProfiles.includes(riskProfile)) {
      errors.push("Veuillez sélectionner un profil de risque.")
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: true,
        message:
          "Des erreurs sont présentes dans le formulaire. Veuillez corriger les champs signalés : " + errors.join(" "),
      }
    }

    // Simulation d'un délai de traitement
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Calcul du rendement estimé
    const estimatedReturn = calculateReturn(amountNum, finalDuration, investmentType)

    // Génération de la référence
    const reference = `PLAC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(investments.length + 1).padStart(3, "0")}`

    // Enregistrement du placement
    const newInvestment = {
      investorName,
      email,
      investmentType,
      amount,
      duration: duration === "custom" ? customDuration : duration,
      riskProfile,
      id: Date.now().toString(),
      reference,
      status: "en_attente_validation",
      createdAt: new Date(),
      estimatedReturn,
    }

    investments.push(newInvestment)

    // Simulation d'envoi d'email de confirmation
    //console.log(`Email de confirmation envoyé à ${email} pour le placement ${reference}`)

    return {
      success: true,
      error: false,
      message: `Votre demande de placement a été enregistrée avec succès. Référence : ${reference}. Un conseiller peut vous contacter pour finaliser.`,
    }
  } catch (error) {
    console.error("Erreur lors du traitement du placement:", error)
    return {
      success: false,
      error: true,
      message: "Une erreur technique est survenue. Veuillez réessayer plus tard.",
    }
  }
}

export async function getInvestments() {
  // Simulation d'un délai de chargement
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return investments
}

export async function getInvestmentById(id: string) {
  return investments.find((inv) => inv.id === id)
}

function calculateReturn(amount: number, duration: number, investmentType: string): number {
  const rates = {
    actions: 0.08, // 8% annuel
    obligations: 0.05, // 5% annuel
    fonds_communs: 0.06, // 6% annuel
    epargne_terme: 0.04, // 4% annuel
  }

  const rate = rates[investmentType as keyof typeof rates] || 0.05
  const years = duration / 12
  const finalAmount = amount * Math.pow(1 + rate, years)
  return finalAmount - amount
}
