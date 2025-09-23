"use server"

import { revalidatePath } from "next/cache"

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

  //console.log("[v0] Server action - Changement de statut:", { accountId, newStatus })

  try {
    const statusMessages = {
      ACTIVE: "activé",
      BLOCKED: "bloqué",
      SUSPENDED: "suspendu",
      CLOSED: "fermé",
      PENDING: "mis en attente",
    }

    const message = `Le statut de votre compte ${accountId} a été modifié vers "${statusMessages[newStatus as keyof typeof statusMessages] || newStatus.toLowerCase()}".`

    //console.log("[v0] Notification de changement de statut créée:", {
    //   type: "account_status",
    //   title: "Changement de statut de compte",
    //   message,
    //   account: accountId,
    //   newStatus,
    // })

    revalidatePath(`/accounts/${accountId}`)

    return {
      success: true,
      message: `Statut du compte mis à jour: ${newStatus}`,
      notification: {
        type: "account_status",
        title: "Changement de statut de compte",
        message,
      },
    }
  } catch (error) {
    console.error("[v0] Erreur lors de la création de la notification:", error)
    return {
      success: false,
      message: "Erreur lors de la mise à jour du statut",
    }
  }
}
