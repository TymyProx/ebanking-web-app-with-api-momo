"use server"
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
// Simulation des opérations en attente
export async function getPendingOperations() {
  try {
    // Simulation d'un délai de récupération
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Simulation d'une erreur de connexion (1% de chance)
    if (Math.random() < 0.01) {
      throw new Error("Erreur de connexion au système de gestion des opérations")
    }

    // Données simulées des opérations en attente
    const operations = [
      {
        id: "OP001",
        type: "transfer",
        description: "Virement vers compte épargne",
        amount: 500000,
        currency: "GNF",
        recipient: "Mamadou Diallo",
        status: "processing",
        createdAt: "2024-01-13T09:15:00Z",
        estimatedCompletion: "2024-01-13T16:00:00Z",
        canCancel: false,
        canRetry: false,
      },
      {
        id: "OP002",
        type: "payment",
        description: "Paiement facture EDG",
        amount: 150,
        currency: "USD",
        recipient: "Électricité de Guinée",
        status: "failed",
        createdAt: "2024-01-12T14:30:00Z",
        failureReason: "Solde insuffisant sur le compte USD",
        canCancel: false,
        canRetry: true,
      },
      {
        id: "OP003",
        type: "withdrawal",
        description: "Retrait DAB - Montant important",
        amount: 1000000,
        currency: "GNF",
        status: "approval_required",
        createdAt: "2024-01-13T11:45:00Z",
        estimatedCompletion: "2024-01-14T10:00:00Z",
        canCancel: true,
        canRetry: false,
      },
      {
        id: "OP004",
        type: "deposit",
        description: "Dépôt de chèque",
        amount: 750000,
        currency: "GNF",
        recipient: "Banque Nationale de Guinée",
        status: "pending",
        createdAt: "2024-01-13T08:20:00Z",
        estimatedCompletion: "2024-01-15T12:00:00Z",
        canCancel: true,
        canRetry: false,
      },
      {
        id: "OP005",
        type: "transfer",
        description: "Virement international",
        amount: 200,
        currency: "EUR",
        recipient: "Marie Dubois - France",
        status: "pending",
        createdAt: "2024-01-12T16:10:00Z",
        estimatedCompletion: "2024-01-16T10:00:00Z",
        canCancel: true,
        canRetry: false,
      },
    ]

    // Log d'audit
    //console.log(`[AUDIT] Consultation opérations en attente - Client: USER123 à ${new Date().toISOString()}`)

    return {
      success: true,
      message: "Opérations récupérées avec succès",
      data: operations,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des opérations:", error)

    return {
      success: false,
      error: "Erreur de connexion. Opérations non disponibles.",
      timestamp: new Date().toISOString(),
    }
  }
}

// Annuler une opération
export async function cancelOperation(operationId: string) {
  try {
    // Simulation d'un délai de traitement
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Simulation d'une erreur (2% de chance)
    if (Math.random() < 0.02) {
      throw new Error("Impossible d'annuler l'opération")
    }

    // Log d'audit
    //console.log(`[AUDIT] Annulation opération ${operationId} - Client: USER123 à ${new Date().toISOString()}`)

    return {
      success: true,
      message: `Opération ${operationId} annulée avec succès`,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Erreur lors de l'annulation:", error)

    return {
      success: false,
      error: "Impossible d'annuler l'opération. Veuillez réessayer.",
      timestamp: new Date().toISOString(),
    }
  }
}

// Relancer une opération échouée
export async function retryOperation(operationId: string) {
  try {
    // Simulation d'un délai de traitement
    await new Promise((resolve) => setTimeout(resolve, 1200))

    // Simulation d'une erreur (3% de chance)
    if (Math.random() < 0.03) {
      throw new Error("Impossible de relancer l'opération")
    }

    // Log d'audit
    //console.log(`[AUDIT] Relance opération ${operationId} - Client: USER123 à ${new Date().toISOString()}`)

    return {
      success: true,
      message: `Opération ${operationId} relancée avec succès`,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Erreur lors de la relance:", error)

    return {
      success: false,
      error: "Impossible de relancer l'opération. Vérifiez les conditions.",
      timestamp: new Date().toISOString(),
    }
  }
}

// Obtenir les détails d'une opération
export async function getOperationDetails(operationId: string) {
  try {
    // Simulation d'un délai de récupération
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Simulation des détails d'une opération
    const operationDetails = {
      id: operationId,
      type: "transfer",
      description: "Virement vers compte épargne",
      amount: 500000,
      currency: "GNF",
      recipient: "Mamadou Diallo",
      recipientAccount: "0002-345678-90",
      status: "processing",
      createdAt: "2024-01-13T09:15:00Z",
      estimatedCompletion: "2024-01-13T16:00:00Z",
      steps: [
        {
          step: "Validation initiale",
          status: "completed",
          timestamp: "2024-01-13T09:15:30Z",
          description: "Vérification des informations de base",
        },
        {
          step: "Vérification des fonds",
          status: "completed",
          timestamp: "2024-01-13T09:16:00Z",
          description: "Confirmation de la disponibilité des fonds",
        },
        {
          step: "Traitement bancaire",
          status: "in_progress",
          timestamp: "2024-01-13T09:16:30Z",
          description: "Traitement par le système bancaire central",
        },
        {
          step: "Finalisation",
          status: "pending",
          description: "Confirmation finale et notification",
        },
      ],
      canCancel: false,
      canRetry: false,
    }

    return {
      success: true,
      data: operationDetails,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des détails:", error)

    return {
      success: false,
      error: "Impossible de récupérer les détails de l'opération",
      timestamp: new Date().toISOString(),
    }
  }
}
