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

  return {
    success: true,
    message: `Statut du compte mis à jour: ${newStatus}`,
  }
}
