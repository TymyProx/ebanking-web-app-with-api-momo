"use server"
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
import { z } from "zod"

const createBudgetSchema = z.object({
  fullName: z.string().min(1, "Le nom complet est requis"),
  account: z.string().min(1, "Le compte bancaire est requis"),
  email: z.string().email("Veuillez saisir une adresse email valide."),
  phone: z.string().min(10, "Le numéro de téléphone doit contenir au moins 10 chiffres"),
  monthlyIncome: z.string().transform((val) => {
    const num = Number.parseFloat(val)
    if (num <= 0) throw new Error("Le revenu mensuel doit être supérieur à 0.")
    return num
  }),
  monthlyBudget: z.string().transform((val) => {
    const num = Number.parseFloat(val)
    if (num <= 0) throw new Error("L'objectif de dépense doit être supérieur à 0.")
    return num
  }),
  savingsGoal: z.string().transform((val) => {
    const num = Number.parseFloat(val)
    if (num < 0) throw new Error("L'objectif d'épargne ne peut pas être négatif.")
    return num
  }),
})

const addExpenseSchema = z.object({
  fullName: z.string().min(1, "Le nom complet est requis"),
  account: z.string().min(1, "Le compte bancaire est requis"),
  email: z.string().email("Veuillez saisir une adresse email valide."),
  phone: z.string().min(10, "Le numéro de téléphone doit contenir au moins 10 chiffres"),
  category: z.string().min(1, "Choisissez une catégorie de dépense."),
  amount: z.string().transform((val) => {
    const num = Number.parseFloat(val)
    if (num <= 0) throw new Error("Le montant doit être supérieur à 0.")
    return num
  }),
  date: z.string().transform((val) => {
    const date = new Date(val)
    if (date > new Date()) throw new Error("La date de dépense ne peut pas être postérieure à aujourd'hui.")
    return date
  }),
  description: z.string().min(1, "La description est requise"),
})

export async function createPersonalBudget(prevState: any, formData: FormData) {
  try {
    // Simulation d'attente
    await new Promise((resolve) => setTimeout(resolve, 1200))

    const validatedFields = createBudgetSchema.parse({
      fullName: formData.get("fullName"),
      account: formData.get("account"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      monthlyIncome: formData.get("monthlyIncome"),
      monthlyBudget: formData.get("monthlyBudget"),
      savingsGoal: formData.get("savingsGoal"),
    })

    // Validation du format IBAN (simulation)
    const accountRegex = /^\d{4}-\d{6}-\d{2}$/
    if (!accountRegex.test(validatedFields.account)) {
      return {
        error: "Le format du numéro de compte n'est pas valide (format attendu: 0000-000000-00)",
        success: false,
      }
    }

    // Validation du téléphone (format guinéen)
    const phoneRegex = /^\+224\s?\d{3}\s?\d{3}\s?\d{3}$/
    if (!phoneRegex.test(formData.get("phone") as string)) {
      return {
        error: "Le format du numéro de téléphone n'est pas valide (format attendu: +224 123 456 789)",
        success: false,
      }
    }

    // Validation logique métier
    if (validatedFields.monthlyBudget > validatedFields.monthlyIncome) {
      return {
        error: "L'objectif de dépense ne peut pas être supérieur au revenu mensuel.",
        success: false,
      }
    }

    if (validatedFields.savingsGoal > validatedFields.monthlyIncome) {
      return {
        error: "L'objectif d'épargne ne peut pas être supérieur au revenu mensuel.",
        success: false,
      }
    }

    if (validatedFields.monthlyBudget + validatedFields.savingsGoal > validatedFields.monthlyIncome) {
      return {
        error: "La somme du budget et de l'objectif d'épargne dépasse vos revenus mensuels.",
        success: false,
      }
    }

    // Simulation de l'enregistrement en base de données
    //console.log("Budget personnel créé:", validatedFields)

    // Calcul des recommandations budgétaires
    const budgetRecommendations = generateBudgetRecommendations(validatedFields)

    // Log d'audit
    //console.log(`[AUDIT] Budget personnel créé - Client: ${validatedFields.fullName} à ${new Date().toISOString()}`)

    return {
      success: true,
      message: "✅ Votre budget personnel a été configuré avec succès !",
      data: validatedFields,
      recommendations: budgetRecommendations,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return {
        error: firstError.message,
        success: false,
      }
    }

    return {
      error: "❌ Erreur lors de la configuration du budget. Veuillez réessayer.",
      success: false,
    }
  }
}

export async function addBudgetExpense(prevState: any, formData: FormData) {
  try {
    // Simulation d'attente
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const validatedFields = addExpenseSchema.parse({
      fullName: formData.get("fullName"),
      account: formData.get("account"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      category: formData.get("category"),
      amount: formData.get("amount"),
      date: formData.get("date"),
      description: formData.get("description"),
    })

    // Validation du format IBAN
    const accountRegex = /^\d{4}-\d{6}-\d{2}$/
    if (!accountRegex.test(validatedFields.account)) {
      return {
        error: "Le format du numéro de compte n'est pas valide (format attendu: 0000-000000-00)",
        success: false,
      }
    }

    // Validation du téléphone
    const phoneRegex = /^\+224\s?\d{3}\s?\d{3}\s?\d{3}$/
    if (!phoneRegex.test(formData.get("phone") as string)) {
      return {
        error: "Le format du numéro de téléphone n'est pas valide (format attendu: +224 123 456 789)",
        success: false,
      }
    }

    // Simulation de récupération du budget actuel
    const currentBudget = await getCurrentBudgetData()

    // Calcul de l'impact sur le budget
    const categoryBudget = getCategoryBudget(validatedFields.category, currentBudget.monthlyBudget)
    const currentCategoryExpenses = getCurrentCategoryExpenses(validatedFields.category)
    const newCategoryTotal = currentCategoryExpenses + validatedFields.amount
    const categoryUsagePercent = Math.round((newCategoryTotal / categoryBudget) * 100)

    // Calcul du budget global
    const newTotalExpenses = currentBudget.totalExpenses + validatedFields.amount
    const globalUsagePercent = Math.round((newTotalExpenses / currentBudget.monthlyBudget) * 100)

    // Simulation de l'enregistrement
    //console.log("Nouvelle dépense budgétaire enregistrée:", validatedFields)

    // Génération des messages de feedback
    const categoryName = getCategoryName(validatedFields.category)
    let message = ""
    let categoryMessage = ""

    if (globalUsagePercent > 100) {
      const overBudgetAmount = newTotalExpenses - currentBudget.monthlyBudget
      message = `⚠️ Attention : vous avez dépassé votre budget mensuel de ${Math.round((overBudgetAmount / currentBudget.monthlyBudget) * 100)}%.`
    } else if (globalUsagePercent > 85) {
      const remainingBudget = currentBudget.monthlyBudget - newTotalExpenses
      message = `⚠️ Attention : vous approchez de votre limite budgétaire (${globalUsagePercent}% utilisé). Il vous reste ${formatAmount(remainingBudget)} GNF pour ce mois.`
    } else {
      const remainingBudget = currentBudget.monthlyBudget - newTotalExpenses
      message = `✅ Votre budget a été mis à jour avec succès. Vous avez utilisé ${globalUsagePercent}% de votre objectif mensuel.`
    }

    if (categoryUsagePercent > 100) {
      categoryMessage = `⚠️ Vous avez dépassé votre budget ${categoryName} de ${categoryUsagePercent - 100}%.`
    } else {
      const remainingCategoryBudget = categoryBudget - newCategoryTotal
      categoryMessage = `✅ Dépense ajoutée à la catégorie '${categoryName}'. Il vous reste ${formatAmount(remainingCategoryBudget)} GNF pour ce mois.`
    }

    // Déclenchement d'alertes si nécessaire
    if (globalUsagePercent > 85 || categoryUsagePercent > 100) {
      await sendBudgetAlert({
        type: globalUsagePercent > 100 ? "exceeded" : "approaching",
        globalUsage: globalUsagePercent,
        categoryUsage: categoryUsagePercent,
        category: validatedFields.category,
        amount: validatedFields.amount,
      })
    }

    // Log d'audit
    //console.log(
    //   `[AUDIT] Dépense ajoutée - Catégorie: ${validatedFields.category} - Montant: ${validatedFields.amount} GNF - Client: ${validatedFields.fullName}`,
    // )

    return {
      success: true,
      message,
      categoryMessage,
      budgetData: {
        totalExpenses: newTotalExpenses,
        globalUsagePercent,
        categoryUsagePercent,
        isOverBudget: globalUsagePercent > 100,
      },
      data: validatedFields,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return {
        error: firstError.message,
        success: false,
      }
    }

    return {
      error: "❌ Erreur lors de l'ajout de la dépense. Veuillez vérifier les informations saisies.",
      success: false,
    }
  }
}

export async function updateBudgetSettings(formData: FormData) {
  try {
    // Simulation d'attente
    await new Promise((resolve) => setTimeout(resolve, 800))

    const validatedFields = createBudgetSchema.parse({
      fullName: formData.get("fullName"),
      account: formData.get("account"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      monthlyIncome: formData.get("monthlyIncome"),
      monthlyBudget: formData.get("monthlyBudget"),
      savingsGoal: formData.get("savingsGoal"),
    })

    // Validation logique
    if (validatedFields.monthlyBudget > validatedFields.monthlyIncome) {
      return {
        error: "L'objectif de dépense ne peut pas être supérieur au revenu mensuel.",
        success: false,
      }
    }

    // Vérification avec les dépenses actuelles
    const currentExpenses = await getCurrentTotalExpenses()
    if (validatedFields.monthlyBudget < currentExpenses) {
      return {
        error: "Votre objectif est déjà dépassé par vos dépenses actuelles.",
        success: false,
      }
    }

    // Simulation de la mise à jour
    //console.log("Paramètres budgétaires mis à jour:", validatedFields)

    // Log d'audit
    //console.log(
    //   `[AUDIT] Paramètres budgétaires mis à jour - Client: ${validatedFields.fullName} à ${new Date().toISOString()}`,
    // )

    return {
      success: true,
      message: "✅ Vos paramètres budgétaires ont été mis à jour avec succès.",
      data: validatedFields,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return {
        error: firstError.message,
        success: false,
      }
    }

    return {
      error: "❌ Erreur lors de la mise à jour des paramètres budgétaires.",
      success: false,
    }
  }
}

export async function getBudgetAnalytics(period = "month") {
  try {
    // Simulation d'attente
    await new Promise((resolve) => setTimeout(resolve, 600))

    // Simulation des analytics budgétaires
    const analytics = {
      period,
      totalIncome: 3000000,
      totalBudget: 2400000,
      totalExpenses: 2100000,
      totalSavings: 450000,
      budgetUtilization: 87.5,
      savingsRate: 15,
      categoryBreakdown: [
        { category: "logement", spent: 900000, budget: 900000, variance: 0 },
        { category: "alimentation", spent: 480000, budget: 450000, variance: 30000 },
        { category: "transport", spent: 320000, budget: 360000, variance: -40000 },
        { category: "sante", spent: 120000, budget: 192000, variance: -72000 },
        { category: "loisirs", spent: 180000, budget: 240000, variance: -60000 },
        { category: "autres", spent: 100000, budget: 120000, variance: -20000 },
      ],
      trends: {
        expenseGrowth: 2.5,
        savingsGrowth: 8.3,
        budgetAdherence: 87.5,
      },
      alerts: [
        {
          type: "warning",
          category: "alimentation",
          message: "Budget Alimentation dépassé de 7%",
          severity: "medium",
        },
      ],
    }

    return {
      success: true,
      data: analytics,
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des analytics:", error)
    return {
      success: false,
      error: "Impossible de récupérer les données d'analyse budgétaire.",
    }
  }
}

export async function exportBudgetReport(format: string, period: string) {
  try {
    // Simulation d'attente
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Validation du format
    const validFormats = ["pdf", "csv", "excel"]
    if (!validFormats.includes(format.toLowerCase())) {
      return {
        success: false,
        error: "Format d'export non supporté. Formats disponibles: PDF, CSV, Excel",
      }
    }

    // Simulation de génération du rapport
    const filename = `budget_personnel_${period}_${new Date().toISOString().split("T")[0]}.${format}`

    // Simulation du contenu du rapport
    const reportData = {
      period,
      generatedAt: new Date().toISOString(),
      summary: {
        totalIncome: 3000000,
        totalBudget: 2400000,
        totalExpenses: 2100000,
        totalSavings: 450000,
        budgetUtilization: 87.5,
        savingsRate: 15,
      },
      categoryDetails: [
        { category: "Logement", spent: 900000, budget: 900000, variance: 0, status: "On track" },
        { category: "Alimentation", spent: 480000, budget: 450000, variance: 30000, status: "Over budget" },
        { category: "Transport", spent: 320000, budget: 360000, variance: -40000, status: "Under budget" },
        { category: "Santé", spent: 120000, budget: 192000, variance: -72000, status: "Under budget" },
        { category: "Loisirs", spent: 180000, budget: 240000, variance: -60000, status: "Under budget" },
        { category: "Autres", spent: 100000, budget: 120000, variance: -20000, status: "Under budget" },
      ],
      recommendations: [
        "Excellente gestion globale du budget avec 87.5% d'utilisation",
        "Attention au budget Alimentation qui dépasse de 7%",
        "Opportunité d'augmenter l'épargne avec les économies réalisées sur Transport et Santé",
        "Maintenir la discipline budgétaire pour atteindre les objectifs d'épargne",
      ],
    }

    //console.log(`Génération du rapport budgétaire ${filename}`)
    //console.log("Données du rapport:", reportData)

    // Log d'audit
    //console.log(
    //   `[AUDIT] Export rapport budgétaire - Format: ${format} - Période: ${period} - Client: USER123 à ${new Date().toISOString()}`,
    // )

    return {
      success: true,
      filename,
      message: `Rapport budgétaire ${format.toUpperCase()} généré avec succès`,
      data: reportData,
    }
  } catch (error) {
    console.error("Erreur lors de l'export du rapport:", error)
    return {
      success: false,
      error: "Impossible de générer le rapport budgétaire",
    }
  }
}

// Fonction pour envoyer des alertes budgétaires
export async function sendBudgetAlert(alertData: any) {
  try {
    // Simulation d'attente
    await new Promise((resolve) => setTimeout(resolve, 400))

    let message = ""
    const channels = ["email", "push"]

    if (alertData.type === "approaching") {
      message = `⚠️ Vous approchez de votre limite budgétaire (${alertData.globalUsage}% utilisé).`
      if (alertData.categoryUsage > 100) {
        message += ` La catégorie ${getCategoryName(alertData.category)} a dépassé son budget.`
      }
    } else if (alertData.type === "exceeded") {
      message = `🚨 Vous avez dépassé votre budget mensuel. Dépenses actuelles : ${alertData.globalUsage}% du budget alloué.`
      channels.push("sms") // SMS pour les dépassements critiques
    }

    // Simulation d'envoi des notifications
    //console.log(`[ALERT] ${alertData.type.toUpperCase()} - ${message}`)
    //console.log(`[CHANNELS] Envoyé via: ${channels.join(", ")}`)

    // Log d'audit
    //console.log(
    //   `[AUDIT] Alerte budgétaire envoyée - Type: ${alertData.type} - Usage: ${alertData.globalUsage}% - Client: USER123 à ${new Date().toISOString()}`,
    // )

    return {
      success: true,
      message: "Alerte budgétaire envoyée avec succès",
      channels,
      alertData,
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'alerte budgétaire:", error)
    return {
      success: false,
      error: "Impossible d'envoyer l'alerte budgétaire",
    }
  }
}

// Fonctions utilitaires
async function getCurrentBudgetData() {
  // Simulation de récupération des données budgétaires actuelles
  return {
    monthlyIncome: 3000000,
    monthlyBudget: 2400000,
    totalExpenses: 2100000,
    savingsGoal: 600000,
    totalSavings: 450000,
  }
}

function getCategoryBudget(category: string, totalBudget: number): number {
  // Calcul du budget par catégorie basé sur les pourcentages recommandés
  const categoryPercentages: Record<string, number> = {
    logement: 0.375, // 37.5% (900k sur 2400k)
    alimentation: 0.1875, // 18.75% (450k sur 2400k)
    transport: 0.15, // 15% (360k sur 2400k)
    sante: 0.08, // 8% (192k sur 2400k)
    loisirs: 0.1, // 10% (240k sur 2400k)
    education: 0.05, // 5%
    abonnements: 0.05, // 5%
    shopping: 0.07, // 7%
    epargne: 0.25, // 25% (600k sur 2400k)
    autres: 0.05, // 5% (120k sur 2400k)
  }

  return Math.round(totalBudget * (categoryPercentages[category] || 0.05))
}

function getCurrentCategoryExpenses(category: string): number {
  // Simulation des dépenses actuelles par catégorie
  const currentExpenses: Record<string, number> = {
    logement: 900000,
    alimentation: 450000,
    transport: 295000,
    sante: 120000,
    loisirs: 180000,
    education: 50000,
    abonnements: 85000,
    shopping: 70000,
    epargne: 450000,
    autres: 100000,
  }

  return currentExpenses[category] || 0
}

async function getCurrentTotalExpenses(): Promise<number> {
  // Simulation de récupération du total des dépenses actuelles
  return 2100000
}

function generateBudgetRecommendations(budgetData: any) {
  const recommendations = []

  const savingsRate = (budgetData.savingsGoal / budgetData.monthlyIncome) * 100
  const budgetRate = (budgetData.monthlyBudget / budgetData.monthlyIncome) * 100

  if (savingsRate < 10) {
    recommendations.push("Considérez augmenter votre objectif d'épargne à au moins 10% de vos revenus")
  } else if (savingsRate >= 20) {
    recommendations.push("Excellent objectif d'épargne ! Vous êtes sur la voie de la sécurité financière")
  }

  if (budgetRate > 85) {
    recommendations.push("Votre budget de dépenses est élevé. Essayez de réduire certaines catégories non essentielles")
  }

  recommendations.push("Suivez régulièrement vos dépenses pour rester dans vos objectifs")
  recommendations.push("Utilisez la catégorisation automatique pour un suivi plus précis")

  return recommendations
}

function getCategoryName(categoryValue: string): string {
  const categories: Record<string, string> = {
    logement: "Logement",
    alimentation: "Alimentation",
    transport: "Transport",
    sante: "Santé",
    loisirs: "Loisirs",
    education: "Éducation",
    abonnements: "Abonnements",
    shopping: "Shopping",
    epargne: "Épargne",
    autres: "Autres",
  }
  return categories[categoryValue] || categoryValue
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount)
}
