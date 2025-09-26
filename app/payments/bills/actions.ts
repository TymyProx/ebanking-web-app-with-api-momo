"use server"
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
import { z } from "zod"

// Schéma de validation unifié pour les paiements
const unifiedPaymentSchema = z.object({
  providerId: z.string().min(1, "Le fournisseur/commerçant est requis"),
  billNumber: z.string().min(3, "Le numéro de référence doit contenir au moins 3 caractères"),
  amount: z.string().refine((val) => Number.parseFloat(val) >= 1000, "Montant minimum: 1,000 GNF"),
  sourceAccount: z.string().min(1, "Le compte source est requis"),
  paymentMethod: z.enum(["account", "card", "mobile"]),
  customerName: z.string().optional(),
  merchantLocation: z.string().optional(),
  orderReference: z.string().optional(),
})

// Statuts des fournisseurs et commerçants
const providerStatus = {
  // Services publics
  edg: { status: "available", processingTime: 2000, type: "utility" },
  seg: { status: "available", processingTime: 1500, type: "utility" },
  orange: { status: "available", processingTime: 1000, type: "utility" },
  mtn: { status: "available", processingTime: 1000, type: "utility" },
  cellcom: { status: "maintenance", processingTime: 0, type: "utility" },
  guilab: { status: "available", processingTime: 2500, type: "utility" },

  // Commerçants
  espace: { status: "available", processingTime: 1500, type: "merchant" },
  leader_price: { status: "available", processingTime: 1500, type: "merchant" },
  restaurant_baobab: { status: "available", processingTime: 2000, type: "merchant" },
  kfc_guinea: { status: "available", processingTime: 1000, type: "merchant" },
  fashion_plaza: { status: "available", processingTime: 2500, type: "merchant" },
  pharmacie_centrale: { status: "available", processingTime: 1000, type: "merchant" },
  ecole_internationale: { status: "available", processingTime: 3000, type: "merchant" },
  total_energies: { status: "available", processingTime: 1500, type: "merchant" },
  agence_immobiliere: { status: "available", processingTime: 4000, type: "merchant" },
}

// Comptes pour validation du solde
const accounts = [
  { id: "1", balance: 2400000, currency: "GNF" },
  { id: "2", balance: 850000, currency: "GNF" },
]

// Frais par fournisseur/commerçant
const providerFees = {
  // Services publics
  edg: 1000,
  seg: 500,
  orange: 0,
  mtn: 0,
  cellcom: 0,
  guilab: 1500,

  // Commerçants
  espace: 0,
  leader_price: 0,
  restaurant_baobab: 500,
  kfc_guinea: 0,
  fashion_plaza: 1000,
  pharmacie_centrale: 0,
  ecole_internationale: 2500,
  total_energies: 0,
  agence_immobiliere: 5000,
}

// Action pour valider un numéro de facture/commande
export async function validateBillNumber(billNumber: string, providerId: string) {
  try {
    // Simulation d'un délai de validation
    await new Promise((resolve) => setTimeout(resolve, 1200))

    // Vérification du statut du fournisseur/commerçant
    const provider = providerStatus[providerId as keyof typeof providerStatus]
    if (!provider || provider.status !== "available") {
      return {
        success: false,
        message: "❌ Le service est temporairement indisponible",
      }
    }

    // Validation selon le type (utility vs merchant)
    if (provider.type === "utility") {
      return validateUtilityBill(billNumber, providerId)
    } else {
      return validateMerchantOrder(billNumber, providerId)
    }
  } catch (error) {
    console.error("Erreur lors de la validation:", error)
    return {
      success: false,
      message: "Erreur lors de la validation. Veuillez réessayer.",
    }
  }
}

// Validation spécifique aux services publics
function validateUtilityBill(billNumber: string, providerId: string) {
  if (providerId === "edg" || providerId === "seg") {
    // Validation numéro de compteur (format: 12345678)
    if (!/^\d{8}$/.test(billNumber)) {
      return {
        success: false,
        message: "Format invalide. Le numéro de compteur doit contenir 8 chiffres",
      }
    }

    return {
      success: true,
      message: "✅ Facture trouvée",
      data: {
        customerName: "DIALLO Mamadou",
        address: "Quartier Almamya, Conakry",
        amount: Math.floor(Math.random() * 100000) + 20000,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      },
    }
  }

  if (providerId === "orange" || providerId === "mtn") {
    // Validation numéro de téléphone (format: 6XXXXXXXX)
    if (!/^6\d{8}$/.test(billNumber)) {
      return {
        success: false,
        message: "Format invalide. Le numéro doit commencer par 6 et contenir 9 chiffres",
      }
    }

    return {
      success: true,
      message: "✅ Numéro valide",
      data: {
        customerName: "Propriétaire du +224 " + billNumber,
        amount: null,
      },
    }
  }

  if (providerId === "guilab") {
    // Validation numéro client internet
    if (!/^GL\d{6}$/.test(billNumber)) {
      return {
        success: false,
        message: "Format invalide. Le numéro client doit être au format GL123456",
      }
    }

    return {
      success: true,
      message: "✅ Client trouvé",
      data: {
        customerName: "DIALLO Mamadou",
        amount: 45000,
      },
    }
  }

  return {
    success: true,
    message: "✅ Facture validée",
    data: {
      customerName: "Client validé",
      amount: null,
    },
  }
}

// Validation spécifique aux commerçants
function validateMerchantOrder(billNumber: string, providerId: string) {
  // Formats spécifiques par commerçant
  const merchantFormats = {
    espace: /^ESP\d{8}$/,
    leader_price: /^LDP\d{8}$/,
    restaurant_baobab: /^RBB\d{6}$/,
    kfc_guinea: /^KFC\d{6}$/,
    fashion_plaza: /^FPZ\d{7}$/,
    pharmacie_centrale: /^PHC\d{6}$/,
    ecole_internationale: /^EIC\d{8}$/,
    total_energies: /^TOT\d{6}$/,
    agence_immobiliere: /^AIB\d{8}$/,
  }

  const format = merchantFormats[providerId as keyof typeof merchantFormats]
  if (format && !format.test(billNumber)) {
    return {
      success: false,
      message: `Format invalide. Vérifiez le numéro de commande/facture`,
    }
  }

  // Simulation de données commerçant
  const merchantData = {
    espace: {
      customerName: "DIALLO Mamadou",
      amount: Math.floor(Math.random() * 500000) + 50000,
      location: "Kaloum, Conakry",
      orderReference: billNumber,
    },
    leader_price: {
      customerName: "DIALLO Mamadou",
      amount: Math.floor(Math.random() * 300000) + 30000,
      location: "Ratoma, Conakry",
      orderReference: billNumber,
    },
    restaurant_baobab: {
      customerName: "Table réservée",
      amount: Math.floor(Math.random() * 150000) + 25000,
      location: "Almamya, Conakry",
      orderReference: billNumber,
    },
    kfc_guinea: {
      customerName: "Commande à emporter",
      amount: Math.floor(Math.random() * 50000) + 15000,
      location: "Kipé, Conakry",
      orderReference: billNumber,
    },
    fashion_plaza: {
      customerName: "DIALLO Mamadou",
      amount: Math.floor(Math.random() * 800000) + 100000,
      location: "Madina, Conakry",
      orderReference: billNumber,
    },
    pharmacie_centrale: {
      customerName: "DIALLO Mamadou",
      amount: Math.floor(Math.random() * 200000) + 10000,
      location: "Centre-ville, Conakry",
      orderReference: billNumber,
    },
    ecole_internationale: {
      customerName: "DIALLO Mamadou Jr.",
      amount: Math.floor(Math.random() * 2000000) + 500000,
      location: "Kipé, Conakry",
      orderReference: billNumber,
    },
    total_energies: {
      customerName: "Plein d'essence",
      amount: Math.floor(Math.random() * 300000) + 50000,
      location: "Autoroute Fidel Castro",
      orderReference: billNumber,
    },
    agence_immobiliere: {
      customerName: "DIALLO Mamadou",
      amount: Math.floor(Math.random() * 10000000) + 1000000,
      location: "Almamya, Conakry",
      orderReference: billNumber,
    },
  }

  const data = merchantData[providerId as keyof typeof merchantData]
  if (!data) {
    return {
      success: false,
      message: "Commerçant non reconnu",
    }
  }

  return {
    success: true,
    message: "✅ Commande/facture trouvée",
    data,
  }
}

// Action pour rechercher des commerçants
export async function searchMerchants(query: string, category?: string) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Simulation de recherche de commerçants
    const merchants = [
      { id: "espace", name: "Espace", category: "Supermarché", location: "Kaloum" },
      { id: "restaurant_baobab", name: "Restaurant Baobab", category: "Restaurant", location: "Almamya" },
      { id: "fashion_plaza", name: "Fashion Plaza", category: "Vêtements", location: "Madina" },
    ]

    const filtered = merchants.filter((merchant) => {
      const matchesQuery =
        merchant.name.toLowerCase().includes(query.toLowerCase()) ||
        merchant.location.toLowerCase().includes(query.toLowerCase())
      const matchesCategory = !category || merchant.category === category
      return matchesQuery && matchesCategory
    })

    return {
      success: true,
      data: filtered,
    }
  } catch (error) {
    return {
      success: false,
      error: "Erreur lors de la recherche",
    }
  }
}

// Action principale pour effectuer un paiement unifié
export async function payBill(prevState: any, formData: FormData) {
  try {
    const data = {
      providerId: formData.get("providerId") as string,
      billNumber: formData.get("billNumber") as string,
      amount: formData.get("amount") as string,
      sourceAccount: formData.get("sourceAccount") as string,
      paymentMethod: formData.get("paymentMethod") as string,
      customerName: formData.get("customerName") as string,
      merchantLocation: formData.get("merchantLocation") as string,
      orderReference: formData.get("orderReference") as string,
    }

    // Validation des données
    const validatedData = unifiedPaymentSchema.parse(data)

    // Vérification du statut du fournisseur/commerçant
    const provider = providerStatus[validatedData.providerId as keyof typeof providerStatus]
    if (!provider || provider.status !== "available") {
      return {
        success: false,
        error: "❌ Le service est temporairement indisponible",
      }
    }

    // Récupération des informations du compte
    const sourceAccount = accounts.find((acc) => acc.id === validatedData.sourceAccount)
    if (!sourceAccount) {
      return {
        success: false,
        error: "Compte source introuvable",
      }
    }

    const paymentAmount = Number.parseFloat(validatedData.amount)
    const fee = providerFees[validatedData.providerId as keyof typeof providerFees] || 0
    const totalAmount = paymentAmount + fee

    // Vérification du solde suffisant
    if (totalAmount > sourceAccount.balance) {
      return {
        success: false,
        error: "❌ Solde insuffisant pour effectuer ce paiement",
      }
    }

    // Simulation du délai de traitement
    await new Promise((resolve) => setTimeout(resolve, provider.processingTime))

    // Simulation d'une erreur de paiement (2% de chance)
    if (Math.random() < 0.02) {
      throw new Error(`Erreur de connexion avec ${provider.type === "utility" ? "le fournisseur" : "le commerçant"}`)
    }

    // Génération d'une référence de paiement unique
    const prefix = provider.type === "utility" ? "F" : "M"
    const reference = `${prefix}${new Date().toISOString().slice(0, 10).replace(/-/g, "")}${Math.floor(
      Math.random() * 1000,
    )
      .toString()
      .padStart(3, "0")}`

    // Simulation du traitement du paiement
    //console.log("Paiement unifié traité:", {
    //   reference,
    //   provider: validatedData.providerId,
    //   type: provider.type,
    //   billNumber: validatedData.billNumber,
    //   amount: paymentAmount,
    //   fee,
    //   total: totalAmount,
    //   account: validatedData.sourceAccount,
    //   method: validatedData.paymentMethod,
    // })

    // Log d'audit
    //console.log(
    //   `[AUDIT] Paiement ${provider.type} - Réf: ${reference}, Fournisseur: ${validatedData.providerId}, Montant: ${paymentAmount} GNF à ${new Date().toISOString()}`,
    // )

    // Simulation des notifications
    if (provider.type === "utility") {
      //console.log(
      //   `[SMS] Paiement facture ${validatedData.providerId} de ${paymentAmount} GNF effectué. Réf: ${reference}`,
      // )
      //console.log(`[API] Notification fournisseur ${validatedData.providerId} - Paiement reçu: ${reference}`)
    } else {
      //console.log(
      //   `[SMS] Paiement commerçant ${validatedData.providerId} de ${paymentAmount} GNF effectué. Réf: ${reference}`,
      // )
      //console.log(`[API] Notification commerçant ${validatedData.providerId} - Paiement reçu: ${reference}`)
    }

    return {
      success: true,
      message: `✅ Paiement réussi. Référence : ${reference}`,
      reference,
      amount: paymentAmount,
      fee,
      total: totalAmount,
      provider: validatedData.providerId,
      type: provider.type,
      processedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Erreur lors du paiement:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      }
    }

    return {
      success: false,
      error: "❌ Erreur lors du traitement du paiement. Veuillez réessayer.",
    }
  }
}

// Action pour obtenir l'historique unifié des paiements
export async function getUnifiedPaymentHistory(limit = 10) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Simulation de l'historique unifié
    const payments = [
      {
        id: "1",
        reference: "F20240112001",
        provider: "EDG",
        providerName: "Électricité de Guinée",
        type: "utility",
        category: "Électricité",
        amount: 45000,
        fee: 1000,
        total: 46000,
        billNumber: "12345678",
        date: "2024-01-12T14:30:00Z",
        status: "COMPLETED",
      },
      {
        id: "2",
        reference: "M20240111001",
        provider: "restaurant_baobab",
        providerName: "Restaurant Baobab",
        type: "merchant",
        category: "Restaurant",
        amount: 85000,
        fee: 500,
        total: 85500,
        billNumber: "RBB123456",
        location: "Almamya, Conakry",
        date: "2024-01-11T19:45:00Z",
        status: "COMPLETED",
      },
      {
        id: "3",
        reference: "F20240110002",
        provider: "Orange",
        providerName: "Orange Guinée",
        type: "utility",
        category: "Télécom",
        amount: 25000,
        fee: 0,
        total: 25000,
        billNumber: "622123456",
        date: "2024-01-10T09:15:00Z",
        status: "COMPLETED",
      },
      {
        id: "4",
        reference: "M20240109001",
        provider: "espace",
        providerName: "Supermarché Espace",
        type: "merchant",
        category: "Supermarché",
        amount: 125000,
        fee: 0,
        total: 125000,
        billNumber: "ESP12345678",
        location: "Kaloum, Conakry",
        date: "2024-01-09T16:20:00Z",
        status: "COMPLETED",
      },
      {
        id: "5",
        reference: "F20240108003",
        provider: "SEG",
        providerName: "Société des Eaux de Guinée",
        type: "utility",
        category: "Eau",
        amount: 18000,
        fee: 500,
        total: 18500,
        billNumber: "87654321",
        date: "2024-01-08T16:45:00Z",
        status: "COMPLETED",
      },
    ]

    return {
      success: true,
      data: payments.slice(0, limit),
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error)
    return {
      success: false,
      error: "Impossible de récupérer l'historique des paiements",
    }
  }
}

// Action pour obtenir les statistiques de paiement
export async function getPaymentStats() {
  try {
    await new Promise((resolve) => setTimeout(resolve, 500))

    return {
      success: true,
      data: {
        totalPayments: 156,
        totalAmount: 2450000,
        utilityPayments: 89,
        merchantPayments: 67,
        averageAmount: 15705,
        mostUsedProvider: "EDG",
        monthlyGrowth: 12.5,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: "Impossible de récupérer les statistiques",
    }
  }
}

// Action pour obtenir les promotions actives
export async function getActivePromotions() {
  try {
    await new Promise((resolve) => setTimeout(resolve, 400))

    const promotions = [
      {
        id: "promo1",
        provider: "orange",
        title: "Recharge Orange +20%",
        description: "Recevez 20% de bonus sur toute recharge Orange",
        validUntil: "2024-02-15",
        minAmount: 10000,
      },
      {
        id: "promo2",
        provider: "espace",
        title: "Cashback 5% Espace",
        description: "5% de cashback sur vos achats au Supermarché Espace",
        validUntil: "2024-01-31",
        minAmount: 50000,
      },
    ]

    return {
      success: true,
      data: promotions,
    }
  } catch (error) {
    return {
      success: false,
      error: "Impossible de récupérer les promotions",
    }
  }
}
