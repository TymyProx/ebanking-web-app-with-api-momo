"use server"

export async function getAccountDetails(accountId: string) {
  // Simulation d'un appel API
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Ici, vous feriez un appel à votre API backend
  // const response = await fetch(`/api/accounts/${accountId}`)
  // return response.json()

  return {
    success: true,
    message: "Détails du compte récupérés avec succès",
  }
}

export async function toggleAccountStatus(accountId: string, newStatus: string) {
  // Simulation d'un appel API
  await new Promise((resolve) => setTimeout(resolve, 500))

  try {
    // Créer une notification pour le changement de statut
    await createAccountStatusNotification({
      accountId,
      newStatus,
      previousStatus: "ACTIVE", // Dans une vraie app, on récupérerait l'ancien statut
    })
  } catch (error) {
    console.error("Erreur lors de la création de la notification:", error)
  }

  return {
    success: true,
    message: `Statut du compte mis à jour: ${newStatus}`,
  }
}

async function createAccountStatusNotification({
  accountId,
  newStatus,
  previousStatus,
}: {
  accountId: string
  newStatus: string
  previousStatus: string
}) {
  const statusMessages = {
    ACTIVE: "activé",
    INACTIVE: "désactivé",
    SUSPENDED: "suspendu",
    PENDING: "mis en attente",
    BLOCKED: "bloqué",
  }

  const message = `Le statut de votre compte ${accountId} a été modifié de "${previousStatus}" vers "${newStatus}". Votre compte est maintenant ${statusMessages[newStatus as keyof typeof statusMessages] || newStatus.toLowerCase()}.`

  // Simuler l'ajout de la notification (dans une vraie app, cela serait géré côté client)
  console.log("[v0] Notification de changement de statut créée:", {
    type: "account_status",
    title: "Changement de statut de compte",
    message,
    account: accountId,
    channels: ["email", "sms", "push"],
  })

  return {
    success: true,
    notificationId: Date.now(),
    message: "Notification de changement de statut créée",
  }
}
