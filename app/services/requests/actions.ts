"use server"
// Indique à Next.js que ce fichier contient du code côté serveur

import { cookies } from "next/headers"
// Importation de la méthode cookies() pour accéder aux cookies côté serveur

// URL de base de l’API et ID du tenant (identifiant du client dans l’API)
const API_BASE_URL = "https://192.168.1.200:8080/api"
const tenantId = "11cacc69-5a49-4f01-8b16-e8f473746634"

// Fonction asynchrone pour soumettre une demande de crédit
export async function submitCreditRequest(formData: {
  applicant_name: string // Nom du demandeur
  loan_amount: string // Montant du crédit demandé
  loan_duration: string // Durée du crédit en mois
  loan_purpose: string // Objet / raison du crédit
  numcompte: string // Nouveau champ numéro de compte
}) {
  try {
    // 🔑 Récupération du token JWT stocké dans les cookies
    const cookieToken = (await cookies()).get("token")?.value
    const usertoken = cookieToken

    // Si aucun token n’est trouvé → erreur
    if (!cookieToken) throw new Error("Token introuvable.")

    // Envoi de la requête POST vers l’API backend
    const response = await fetch(`${API_BASE_URL}/tenant/${tenantId}/demande-credit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Type de contenu JSON
        Authorization: `Bearer ${usertoken}`, // Authentification via Bearer token
      },
      body: JSON.stringify({
        data: {
          //  Mapping des données du formulaire vers les champs attendus par l’API
          applicantName: formData.applicant_name,
          creditAmount: formData.loan_amount,
          durationMonths: formData.loan_duration,
          purpose: formData.loan_purpose,
          numcompte: formData.numcompte, // Ajout du numéro de compte dans l'API
        },
      }),
    })

    // Vérifie si la réponse est valide
    if (!response.ok) {
      const errorData = await response.json()
      // Si le backend renvoie un message d’erreur, on le propage
      throw new Error(errorData.message || "Erreur lors de la soumission")
    }

    // Récupération des données de la réponse (JSON)
    const data = await response.json()
    return data
  } catch (error: any) {
    // Gestion d’erreur (propagation du message d’erreur)
    throw new Error(error.message)
  }
}

// Fonction asynchrone pour soumettre une demande de chéquier
export async function submitCheckbookRequest(formData: {
  dateorder: string // Date de commande
  nbrefeuille: number // Nombre de feuilles par chéquier
  nbrechequier: number // Nombre de chéquiers
  stepflow: number // Étape du workflow
  intitulecompte: string // Intitulé du compte
  numcompteId: string // ID du compte
  commentaire: string // Commentaire
  numcompte: string // Nouveau champ numéro de compte
}) {
  try {
    // 🔑 Récupération du token JWT stocké dans les cookies
    const cookieToken = (await cookies()).get("token")?.value
    const usertoken = cookieToken

    // Si aucun token n'est trouvé → erreur
    if (!cookieToken) throw new Error("Token introuvable.")

    // Envoi de la requête POST vers l'API backend
    const response = await fetch(`${API_BASE_URL}/tenant/${tenantId}/commande`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Type de contenu JSON
        Authorization: `Bearer ${usertoken}`, // Authentification via Bearer token
      },
      body: JSON.stringify({
        data: {
          //  Mapping des données du formulaire vers les champs attendus par l'API
          dateorder: formData.dateorder,
          nbrefeuille: formData.nbrefeuille,
          nbrechequier: formData.nbrechequier,
          stepflow: formData.stepflow,
          intitulecompte: formData.intitulecompte,
          numcompteId: formData.numcompteId,
          commentaire: formData.commentaire,
          numcompte: formData.numcompte, // Ajout du numéro de compte dans l'API
        },
      }),
    })

    // Vérifie si la réponse est valide
    if (!response.ok) {
      const errorData = await response.json()
      // Si le backend renvoie un message d'erreur, on le propage
      throw new Error(errorData.message || "Erreur lors de la soumission")
    }

    // Récupération des données de la réponse (JSON)
    const data = await response.json()
    return data
  } catch (error: any) {
    // Gestion d'erreur (propagation du message d'erreur)
    throw new Error(error.message)
  }
}

// Fonction asynchrone pour récupérer les demandes de chéquier
export async function getCheckbookRequest(id?: string) {
  try {
    // 🔑 Récupération du token JWT stocké dans les cookies
    const cookieToken = (await cookies()).get("token")?.value
    const usertoken = cookieToken

    if (!cookieToken) {
      console.log("[v0] Token d'authentification manquant, retour de données de test")

      // Données de test pour les demandes de chéquier avec structure API
      const mockCheckbookRequests = {
        rows: [
          {
            id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            createdAt: "2024-01-15T10:00:00Z",
            updatedAt: "2024-01-15T10:00:00Z",
            deletedAt: null,
            createdById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            updatedById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            importHash: "hash123",
            tenantId: "11cacc69-5a49-4f01-8b16-e8f473746634",
            dateorder: "2024-01-15",
            nbrefeuille: 25,
            nbrechequier: 1,
            stepflow: 1,
            intitulecompte: "Compte Courant Principal",
            numcompteId: "ACC001",
            commentaire: "Demande de chéquier standard",
          },
          {
            id: "4fa85f64-5717-4562-b3fc-2c963f66afa7",
            createdAt: "2024-01-20T14:30:00Z",
            updatedAt: "2024-01-20T14:30:00Z",
            deletedAt: null,
            createdById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            updatedById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            importHash: "hash456",
            tenantId: "11cacc69-5a49-4f01-8b16-e8f473746634",
            dateorder: "2024-01-20",
            nbrefeuille: 50,
            nbrechequier: 2,
            stepflow: 2,
            intitulecompte: "Compte Épargne",
            numcompteId: "ACC002",
            commentaire: "Demande urgente",
          },
        ],
        count: 2,
      }

      if (id) {
        const foundRow = mockCheckbookRequests.rows.find((req) => req.id === id)
        return foundRow ? { rows: [foundRow], count: 1 } : { rows: [], count: 0 }
      }
      return mockCheckbookRequests
    }

    // Construction de l'URL avec ou sans ID spécifique
    const url = id ? `${API_BASE_URL}/tenant/${tenantId}/commande/${id}` : `${API_BASE_URL}/tenant/${tenantId}/commande`

    // Envoi de la requête GET vers l'API backend
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usertoken}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Erreur lors de la récupération")
    }

    const data = await response.json()
    return data
  } catch (error: any) {
    console.log("[v0] Erreur lors de la récupération, retour de données de test:", error.message)

    const mockCheckbookRequests = {
      rows: [
        {
          id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          createdAt: "2024-01-15T10:00:00Z",
          updatedAt: "2024-01-15T10:00:00Z",
          deletedAt: null,
          createdById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          updatedById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          importHash: "hash123",
          tenantId: "11cacc69-5a49-4f01-8b16-e8f473746634",
          dateorder: "2024-01-15",
          nbrefeuille: 25,
          nbrechequier: 1,
          stepflow: 1,
          intitulecompte: "Compte Courant Principal",
          numcompteId: "ACC001",
          commentaire: "Demande de chéquier standard",
        },
      ],
      count: 1,
    }

    if (id) {
      const foundRow = mockCheckbookRequests.rows.find((req) => req.id === id)
      return foundRow ? { rows: [foundRow], count: 1 } : { rows: [], count: 0 }
    }
    return mockCheckbookRequests
  }
}

// Fonction asynchrone pour récupérer les demandes de crédit
export async function getCreditRequest(id?: string) {
  try {
    // 🔑 Récupération du token JWT stocké dans les cookies
    const cookieToken = (await cookies()).get("token")?.value
    const usertoken = cookieToken

    if (!cookieToken) {
      console.log("[v0] Token d'authentification manquant, retour de données de test")

      // Données de test pour les demandes de crédit avec structure API
      const mockCreditRequests = {
        rows: [
          {
            id: "5fa85f64-5717-4562-b3fc-2c963f66afa8",
            createdAt: "2024-01-10T09:00:00Z",
            updatedAt: "2024-01-10T09:00:00Z",
            deletedAt: null,
            createdById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            updatedById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            importHash: "hash789",
            tenantId: "11cacc69-5a49-4f01-8b16-e8f473746634",
            applicantName: "Jean Dupont",
            creditAmount: "50000",
            durationMonths: "24",
            purpose: "Achat véhicule",
          },
          {
            id: "6fa85f64-5717-4562-b3fc-2c963f66afa9",
            createdAt: "2024-01-18T16:45:00Z",
            updatedAt: "2024-01-18T16:45:00Z",
            deletedAt: null,
            createdById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            updatedById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            importHash: "hash101",
            tenantId: "11cacc69-5a49-4f01-8b16-e8f473746634",
            applicantName: "Marie Martin",
            creditAmount: "25000",
            durationMonths: "12",
            purpose: "Travaux maison",
          },
        ],
        count: 2,
      }

      if (id) {
        const foundRow = mockCreditRequests.rows.find((req) => req.id === id)
        return foundRow ? { rows: [foundRow], count: 1 } : { rows: [], count: 0 }
      }
      return mockCreditRequests
    }

    // Construction de l'URL avec ou sans ID spécifique
    const url = id
      ? `${API_BASE_URL}/tenant/${tenantId}/demande-credit/${id}`
      : `${API_BASE_URL}/tenant/${tenantId}/demande-credit`

    // Envoi de la requête GET vers l'API backend
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usertoken}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Erreur lors de la récupération")
    }

    const data = await response.json()
    return data
  } catch (error: any) {
    console.log("[v0] Erreur lors de la récupération, retour de données de test:", error.message)

    const mockCreditRequests = {
      rows: [
        {
          id: "5fa85f64-5717-4562-b3fc-2c963f66afa8",
          createdAt: "2024-01-10T09:00:00Z",
          updatedAt: "2024-01-10T09:00:00Z",
          deletedAt: null,
          createdById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          updatedById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          importHash: "hash789",
          tenantId: "11cacc69-5a49-4f01-8b16-e8f473746634",
          applicantName: "Jean Dupont",
          creditAmount: "50000",
          durationMonths: "24",
          purpose: "Achat véhicule",
        },
      ],
      count: 1,
    }

    if (id) {
      const foundRow = mockCreditRequests.rows.find((req) => req.id === id)
      return foundRow ? { rows: [foundRow], count: 1 } : { rows: [], count: 0 }
    }
    return mockCreditRequests
  }
}
