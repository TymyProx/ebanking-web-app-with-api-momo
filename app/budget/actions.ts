"use server"

import { z } from "zod"

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

const budgetSettingsSchema = z.object({
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
})

export async function addExpense(prevState: any, formData: FormData) {
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

    // Simulation de vérification du budget
    const currentBudget = 2000000 // Budget mensuel simulé
    const currentExpenses = 1800000 // Dépenses actuelles simulées
    const newTotal = currentExpenses + validatedFields.amount

    // Simulation de l'enregistrement en base de données
    //console.log("Nouvelle dépense enregistrée:", validatedFields)

    // Calcul du pourcentage d'utilisation du budget
    const budgetUsagePercent = Math.round((newTotal / currentBudget) * 100)
    const categoryName = getCategoryName(validatedFields.category)
    const remainingBudget = currentBudget - newTotal

    // Messages de feedback selon l'état du budget
    let message = `✅ Votre budget a été mis à jour avec succès. Vous avez utilisé ${budgetUsagePercent}% de votre objectif mensuel.`
    let categoryMessage = `✅ Dépense ajoutée à la catégorie '${categoryName}'. Il vous reste ${formatAmount(Math.max(0, remainingBudget))} GNF pour ce mois.`

    if (newTotal > currentBudget) {
      const overBudgetPercent = Math.round(((newTotal - currentBudget) / currentBudget) * 100)
      message = `⚠️ Attention : vous avez dépassé votre budget mensuel de ${overBudgetPercent}%.`
      categoryMessage = `Dépense ajoutée à la catégorie '${categoryName}'. Vous êtes maintenant ${formatAmount(newTotal - currentBudget)} GNF au-dessus de votre budget.`
    } else if (budgetUsagePercent > 80) {
      message = `⚠️ Attention : vous approchez de votre limite budgétaire (${budgetUsagePercent}% utilisé).`
    }

    return {
      success: true,
      message,
      categoryMessage,
      budgetData: {
        totalExpenses: newTotal,
        budgetUsagePercent,
        remainingBudget,
        isOverBudget: newTotal > currentBudget,
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
      error: "❌ Erreur de saisie. Veuillez vérifier les champs indiqués.",
      success: false,
    }
  }
}

export async function updateBudgetSettings(formData: FormData) {
  try {
    // Simulation d'attente
    await new Promise((resolve) => setTimeout(resolve, 800))

    const validatedFields = budgetSettingsSchema.parse({
      monthlyIncome: formData.get("monthlyIncome"),
      monthlyBudget: formData.get("monthlyBudget"),
    })

    // Validation logique : le budget ne peut pas être supérieur au revenu
    if (validatedFields.monthlyBudget > validatedFields.monthlyIncome) {
      return {
        error: "L'objectif de dépense ne peut pas être supérieur au revenu mensuel.",
        success: false,
      }
    }

    // Simulation de vérification avec les dépenses actuelles
    const currentExpenses = 1800000 // Dépenses actuelles simulées
    if (validatedFields.monthlyBudget < currentExpenses) {
      return {
        error: "Votre objectif est déjà dépassé par vos dépenses actuelles.",
        success: false,
      }
    }

    // Simulation de la sauvegarde en base de données
    //console.log("Paramètres budgétaires mis à jour:", validatedFields)

    // Log d'audit
    //console.log(`[AUDIT] Paramètres budgétaires mis à jour - Client: USER123 à ${new Date().toISOString()}`)

    return {
      success: true,
      message: "✅ Votre budget a été mis à jour avec succès.",
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

export async function getBudgetData(period = "month") {
  try {
    // Simulation d'attente
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Simulation des données budgétaires
    const budgetData = {
      monthlyIncome: 2500000,
      monthlyBudget: 2000000,
      totalExpenses: 1800000,
      expensesByCategory: [
        { category: "logement", amount: 800000, budget: 900000 },
        { category: "alimentation", amount: 450000, budget: 400000 },
        { category: "transport", amount: 220000, budget: 250000 },
        { category: "sante", amount: 75000, budget: 100000 },
        { category: "loisirs", amount: 155000, budget: 200000 },
        { category: "autres", amount: 100000, budget: 150000 },
      ],
      monthlyTrend: [
        { month: "Jan", budget: 2000000, expenses: 1850000 },
        { month: "Fév", budget: 2000000, expenses: 1920000 },
        { month: "Mar", budget: 2000000, expenses: 1750000 },
        { month: "Avr", budget: 2000000, expenses: 2100000 },
        { month: "Mai", budget: 2000000, expenses: 1980000 },
        { month: "Juin", budget: 2000000, expenses: 1800000 },
      ],
    }

    // Calculs dérivés
    const budgetUsagePercent = Math.round((budgetData.totalExpenses / budgetData.monthlyBudget) * 100)
    const remainingBudget = budgetData.monthlyBudget - budgetData.totalExpenses
    const isOverBudget = budgetData.totalExpenses > budgetData.monthlyBudget
    const potentialSavings = budgetData.monthlyIncome - budgetData.totalExpenses

    return {
      success: true,
      data: {
        ...budgetData,
        budgetUsagePercent,
        remainingBudget,
        isOverBudget,
        potentialSavings,
      },
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des données budgétaires:", error)
    return {
      success: false,
      error: "Impossible de récupérer les données budgétaires.",
    }
  }
}

export async function exportExpenses(format: string, category?: string, period?: string) {
  try {
    // Simulation d'attente
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Simulation de génération du fichier
    const filename = `budget_report_${period}_${new Date().toISOString().split("T")[0]}.${format}`

    //console.log(`Génération du rapport budgétaire ${filename} pour la catégorie ${category || "toutes"}`)

    // Log d'audit
    //console.log(`[AUDIT] Export rapport budgétaire - Format: ${format} - Client: USER123 à ${new Date().toISOString()}`)

    return {
      success: true,
      filename,
      message: `Rapport budgétaire ${format.toUpperCase()} généré avec succès`,
    }
  } catch (error) {
    console.error("Erreur lors de l'export:", error)
    return {
      success: false,
      error: "Impossible de générer le rapport budgétaire",
    }
  }
}

// Fonction pour envoyer des alertes budgétaires
export async function sendBudgetAlert(alertType: "approaching" | "exceeded", data: any) {
  try {
    // Simulation d'attente
    await new Promise((resolve) => setTimeout(resolve, 300))

    let message = ""
    const channels = ["email", "push"]

    if (alertType === "approaching") {
      message = `⚠️ Vous approchez de votre limite budgétaire (${data.usagePercent}% utilisé). Il vous reste ${formatAmount(data.remainingBudget)} GNF pour ce mois.`
    } else if (alertType === "exceeded") {
      message = `🚨 Vous avez dépassé votre budget mensuel de ${data.overBudgetPercent}%. Dépenses actuelles : ${formatAmount(data.totalExpenses)} GNF sur ${formatAmount(data.monthlyBudget)} GNF.`
      channels.push("sms") // SMS pour les dépassements
    }

    // Simulation d'envoi des notifications
    //console.log(`[ALERT] ${alertType.toUpperCase()} - ${message}`)
    //console.log(`[CHANNELS] Envoyé via: ${channels.join(", ")}`)

    // Log d'audit
    //console.log(
    //   `[AUDIT] Alerte budgétaire envoyée - Type: ${alertType} - Client: USER123 à ${new Date().toISOString()}`,
    // )

    return {
      success: true,
      message: "Alerte budgétaire envoyée avec succès",
      channels,
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
    autres: "Autres",
  }
  return categories[categoryValue] || categoryValue
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount)
}
