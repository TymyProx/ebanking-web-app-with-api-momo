... existing code ...

// <CHANGE> Ajout de la fonction getCheckbookRequest pour récupérer les demandes de chéquier
export async function getCheckbookRequest(id?: string) {
  const cookieToken = (await cookies()).get("token")?.value
  const usertoken = cookieToken

  try {
    // Construire l'URL avec ou sans ID spécifique
    const url = id 
      ? `${API_BASE_URL}/tenant/${tenantId}/commande/${id}`
      : `${API_BASE_URL}/tenant/${tenantId}/commande`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usertoken}`,
      },
      cache: "no-store", // Toujours récupérer des données fraîches
    })

    if (!response.ok) {
      console.error(`Erreur API: ${response.status} ${response.statusText}`)
      return id ? null : [] // Retour selon si on cherche un élément ou une liste
    }

    const data = await response.json()
    
    // Gestion du format de réponse
    if (id) {
      return data // Retourne l'objet directement pour un ID spécifique
    } else {
      // Pour une liste, extraire les rows comme dans getBeneficiaries
      if (Array.isArray(data.rows)) {
        return data.rows
      }
      return data.rows ? [data.rows] : []
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des demandes de chéquier:", error)
    return id ? null : []
  }
}
</typescript>
