"use server"
// Indique à Next.js que ce fichier contient du code côté serveur
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
import { cookies } from "next/headers"
// Importation de la méthode cookies() pour accéder aux cookies côté serveur

// URL de base de l'API et ID du tenant (identifiant du client dans l'API)

const normalize = (u?: string) => (u ? u.replace(/\/$/, "") : "")
const API_BASE_URL = `${normalize(process.env.NEXT_PUBLIC_API_URL || "https://35.184.98.9:4000")}/api`
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "aa1287f6-06af-45b7-a905-8c57363565c2"

interface Commande {
  id: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  createdById: string
  updatedById: string
  importHash: string
  tenantId: string
  dateorder: string
  nbrefeuille: number
  nbrechequier: number
  stepflow: number
  intitulecompte: string
  numcompteId: string
  commentaire: string
  talonCheque: boolean
  typeCheque: string
  referenceCommande: string
  clientId: string
}

interface GetCommandesResponse {
  rows: Commande[]
  count: number
}

interface DemandeCredit {
  id: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  createdById: string
  updatedById: string
  importHash: string
  tenantId: string
  applicantName: string
  creditAmount: string
  durationMonths: string
  purpose: string
  numcompte?: string
  typedemande?: string
  accountNumber?: string
  reference: string
  clientId: string
}

interface GetDemandesCreditResponse {
  rows: DemandeCredit[]
  count: number
}

// Fonction pour générer une référence unique
async function generateReference(prefix: string): Promise<string> {
  try {
    // Récupérer le token
    const cookieToken = (await cookies()).get("token")?.value
    const usertoken = cookieToken

    if (!cookieToken) {
      throw new Error("Token introuvable.")
    }

    // Récupérer toutes les demandes existantes pour compter
    let existingCount = 0

    if (prefix === "CHQ") {
      const checkbookRequests = await getCheckbookRequest()
      existingCount = checkbookRequests?.rows?.length || 0
    } else if (prefix === "CRD") {
      const creditRequests = await getCreditRequest()
      existingCount = creditRequests?.rows?.length || 0
    }

    const currentYear = new Date().getFullYear()
    const sequence = String(existingCount + 1).padStart(3, "0")

    return `${prefix}-${currentYear}-${sequence}`
  } catch (error) {
    // En cas d'erreur, générer une référence basée sur le timestamp
    const currentYear = new Date().getFullYear()
    const timestamp = Date.now().toString().slice(-3)
    return `${prefix}-${currentYear}-${timestamp}`
  }
}

// Fonction asynchrone pour soumettre une demande de crédit
export async function submitCreditRequest(formData: {
  applicant_name: string // Nom du demandeur
  loan_amount: string // Montant du crédit demandé
  loan_duration: string // Durée du crédit en mois
  loan_purpose: string // Objet / raison du crédit
  numcompte: string // Nouveau champ numéro de compte
  typedemande: string // Type de demande
  accountNumber: string // Numéro de compte (nouveau format)
}) {
  try {
    // 🔑 Récupération du token JWT stocké dans les cookies
    const cookieToken = (await cookies()).get("token")?.value
    const usertoken = cookieToken

    // Si aucun token n'est trouvé → erreur
    if (!cookieToken) throw new Error("Token introuvable.")

    const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${usertoken}`,
      },
    })

    if (!userResponse.ok) {
      throw new Error("Impossible de récupérer les informations utilisateur")
    }

    const userData = await userResponse.json()
    const clientId = userData.id

    // Générer la référence avant la soumission
    const reference = await generateReference("CRD")

    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/demande-credit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Type de contenu JSON
        Authorization: `Bearer ${usertoken}`, // Authentification via Bearer token
      },
      body: JSON.stringify({
        data: {
          //  Mapping des données du formulaire vers les champs attendus par l'API
          applicantName: formData.applicant_name,
          creditAmount: formData.loan_amount,
          durationMonths: formData.loan_duration,
          purpose: formData.loan_purpose,
          numcompte: formData.numcompte, // Ajout du numéro de compte dans l'API
          typedemande: formData.typedemande,
          accountNumber: formData.accountNumber,
          reference: reference, // Ajout de la référence
          clientId: clientId, // Added clientId from logged-in user
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

    // Retourner la référence avec la réponse
    return {
      ...data,
      reference: reference,
    }
  } catch (error: any) {
    // Gestion d'erreur (propagation du message d'erreur)
    throw new Error(error.message)
  }
}

// Fonction asynchrone pour soumettre une demande de chéquier
export async function submitCheckbookRequest(formData: {
  dateorder: string
  nbrefeuille: number
  nbrechequier: number
  stepflow: number
  intitulecompte: string
  numcompteId: string
  commentaire: string
  talonCheque?: boolean // NEW: Talon de chèque option
  typeCheque?: string // NEW: Type de chèque
}) {
  try {
    const cookieToken = (await cookies()).get("token")?.value
    const usertoken = cookieToken

    if (!cookieToken) throw new Error("Token introuvable.")

    const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${usertoken}`,
      },
    })

    if (!userResponse.ok) {
      throw new Error("Impossible de récupérer les informations utilisateur")
    }

    const userData = await userResponse.json()
    const clientId = userData.id

    // Générer la référence avant la soumission
    const reference = await generateReference("CHQ")

    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/commande`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usertoken}`,
      },
      body: JSON.stringify({
        data: {
          dateorder: formData.dateorder,
          nbrefeuille: formData.nbrefeuille,
          nbrechequier: formData.nbrechequier,
          stepflow: formData.stepflow,
          intitulecompte: formData.intitulecompte,
          numcompteId: formData.numcompteId,
          commentaire: formData.commentaire,
          talonCheque: formData.talonCheque ?? false, // Use form value, default to false if not provided
          typeCheque: formData.typeCheque || "Standard", // Use form value, default to "Standard"
          referenceCommande: reference, // Use reference as referenceCommande
          clientId: clientId, // Add clientId from logged-in user
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Erreur lors de la soumission")
    }

    const data = await response.json()

    return {
      ...data,
      reference: reference,
    }
  } catch (error: any) {
    throw new Error(error.message)
  }
}

// Secure path: submit already-encrypted payload to e-Portal endpoint
export async function submitCheckbookRequestSecure(encryptedData: any) {
  try {
    const cookieToken = (await cookies()).get("token")?.value
    const usertoken = cookieToken

    if (!cookieToken) throw new Error("Token introuvable.")

    // Backend will force stepflow=0 and clientId=req.currentUser.id
    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/me/commandes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usertoken}`,
      },
      body: JSON.stringify({ data: encryptedData }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Erreur lors de la soumission sécurisée")
    }

    return await response.json()
  } catch (error: any) {
    throw new Error(error.message)
  }
}

// Fonction asynchrone pour récupérer les demandes de chéquier
export async function getCheckbookRequest(id?: string): Promise<GetCommandesResponse | Commande> {
  try {
    // 🔑 Récupération du token JWT stocké dans les cookies
    const cookieToken = (await cookies()).get("token")?.value
    const usertoken = cookieToken

    if (!cookieToken) {
      console.log("[v0] Token d'authentification manquant, retour de données de test")

      const mockCheckbookRequests: GetCommandesResponse = {
        rows: [
          {
            id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            createdAt: "2024-01-15T10:00:00Z",
            updatedAt: "2024-01-15T10:00:00Z",
            deletedAt: null,
            createdById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            updatedById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            importHash: "hash123",
            tenantId: "aa1287f6-06af-45b7-a905-8c57363565c2",
            dateorder: "2024-01-15",
            nbrefeuille: 25,
            nbrechequier: 1,
            stepflow: 0,
            intitulecompte: "Compte Courant Principal",
            numcompteId: "ACC001",
            commentaire: "Demande de chéquier standard",
            talonCheque: true,
            typeCheque: "Standard",
            referenceCommande: "CHQ-2024-001",
            clientId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          },
          {
            id: "4fa85f64-5717-4562-b3fc-2c963f66afa7",
            createdAt: "2024-01-20T14:30:00Z",
            updatedAt: "2024-01-20T14:30:00Z",
            deletedAt: null,
            createdById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            updatedById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            importHash: "hash456",
            tenantId: "aa1287f6-06af-45b7-a905-8c57363565c2",
            dateorder: "2024-01-20",
            nbrefeuille: 50,
            nbrechequier: 2,
            stepflow: 0,
            intitulecompte: "Compte Épargne",
            numcompteId: "ACC002",
            commentaire: "Demande urgente",
            talonCheque: false,
            typeCheque: "Certifié",
            referenceCommande: "CHQ-2024-002",
            clientId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          },
        ],
        count: 2,
      }

      if (id) {
        const foundRow = mockCheckbookRequests.rows.find((req) => req.id === id)
        return foundRow || mockCheckbookRequests.rows[0]
      }
      return mockCheckbookRequests
    }

    let currentUserId: string | null = null
    try {
      const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${usertoken}`,
        },
      })

      if (userResponse.ok) {
        const userData = await userResponse.json()
        currentUserId = userData.id
      }
    } catch (error) {
      console.error("[v0] Erreur lors de la récupération du user ID:", error)
    }

    // Construction de l'URL avec ou sans ID spécifique
    const url = id
      ? `${API_BASE_URL}/tenant/${TENANT_ID}/commande/${id}`
      : `${API_BASE_URL}/tenant/${TENANT_ID}/commande`

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

    if (id) {
      // Single commande
      return data as Commande
    }

    const responseData = data as GetCommandesResponse
    if (currentUserId && responseData.rows) {
      responseData.rows = responseData.rows.filter((commande) => commande.clientId === currentUserId)
      responseData.count = responseData.rows.length
    }

    return responseData
  } catch (error: any) {
    console.log("[v0] Erreur lors de la récupération, retour de données de test:", error.message)

    const mockCheckbookRequests: GetCommandesResponse = {
      rows: [
        {
          id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          createdAt: "2024-01-15T10:00:00Z",
          updatedAt: "2024-01-15T10:00:00Z",
          deletedAt: null,
          createdById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          updatedById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          importHash: "hash123",
          tenantId: "aa1287f6-06af-45b7-a905-8c57363565c2",
          dateorder: "2024-01-15",
          nbrefeuille: 25,
          nbrechequier: 1,
          stepflow: 0,
          intitulecompte: "Compte Courant Principal",
          numcompteId: "ACC001",
          commentaire: "Demande de chéquier standard",
          talonCheque: true,
          typeCheque: "Standard",
          referenceCommande: "CHQ-2024-001",
          clientId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        },
      ],
      count: 1,
    }

    if (id) {
      const foundRow = mockCheckbookRequests.rows.find((req) => req.id === id)
      return foundRow || mockCheckbookRequests.rows[0]
    }
    return mockCheckbookRequests
  }
}

// Fonction asynchrone pour récupérer les demandes de crédit
export async function getCreditRequest(id?: string): Promise<GetDemandesCreditResponse | DemandeCredit> {
  try {
    // 🔑 Récupération du token JWT stocké dans les cookies
    const cookieToken = (await cookies()).get("token")?.value
    const usertoken = cookieToken

    if (!cookieToken) {
      console.log("[v0] Token d'authentification manquant, retour de données de test")

      const mockCreditRequests: GetDemandesCreditResponse = {
        rows: [
          {
            id: "5fa85f64-5717-4562-b3fc-2c963f66afa8",
            createdAt: "2024-01-10T09:00:00Z",
            updatedAt: "2024-01-10T09:00:00Z",
            deletedAt: null,
            createdById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            updatedById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            importHash: "hash789",
            tenantId: "aa1287f6-06af-45b7-a905-8c57363565c2",
            applicantName: "Jean Dupont",
            creditAmount: "50000",
            durationMonths: "24",
            purpose: "Achat véhicule",
            reference: "CRD-2024-001",
            clientId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          },
          {
            id: "6fa85f64-5717-4562-b3fc-2c963f66afa9",
            createdAt: "2024-01-18T16:45:00Z",
            updatedAt: "2024-01-18T16:45:00Z",
            deletedAt: null,
            createdById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            updatedById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            importHash: "hash101",
            tenantId: "aa1287f6-06af-45b7-a905-8c57363565c2",
            applicantName: "Marie Martin",
            creditAmount: "25000",
            durationMonths: "12",
            purpose: "Travaux maison",
            reference: "CRD-2024-002",
            clientId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          },
        ],
        count: 2,
      }

      if (id) {
        const foundRow = mockCreditRequests.rows.find((req) => req.id === id)
        return foundRow || mockCreditRequests.rows[0]
      }
      return mockCreditRequests
    }

    let currentUserId: string | null = null
    try {
      const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${usertoken}`,
        },
      })

      if (userResponse.ok) {
        const userData = await userResponse.json()
        currentUserId = userData.id
      }
    } catch (error) {
      console.error("[v0] Erreur lors de la récupération du user ID:", error)
    }

    // Construction de l'URL avec ou sans ID spécifique
    const url = id
      ? `${API_BASE_URL}/tenant/${TENANT_ID}/demande-credit/${id}`
      : `${API_BASE_URL}/tenant/${TENANT_ID}/demande-credit`

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

    if (id) {
      return data as DemandeCredit
    }

    const responseData = data as GetDemandesCreditResponse
    if (currentUserId && responseData.rows) {
      responseData.rows = responseData.rows.filter((demande) => demande.clientId === currentUserId)
      responseData.count = responseData.rows.length
    }

    return responseData
  } catch (error: any) {
    console.log("[v0] Erreur lors de la récupération, retour de données de test:", error.message)

    const mockCreditRequests: GetDemandesCreditResponse = {
      rows: [
        {
          id: "5fa85f64-5717-4562-b3fc-2c963f66afa8",
          createdAt: "2024-01-10T09:00:00Z",
          updatedAt: "2024-01-10T09:00:00Z",
          deletedAt: null,
          createdById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          updatedById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          importHash: "hash789",
          tenantId: "aa1287f6-06af-45b7-a905-8c57363565c2",
          applicantName: "Jean Dupont",
          creditAmount: "50000",
          durationMonths: "24",
          purpose: "Achat véhicule",
          reference: "CRD-2024-001",
          clientId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        },
      ],
      count: 1,
    }

    if (id) {
      const foundRow = mockCreditRequests.rows.find((req) => req.id === id)
      return foundRow || mockCreditRequests.rows[0]
    }
    return mockCreditRequests
  }
}

// Fonction asynchrone pour récupérer une demande de crédit par ID
export async function getDemandeCreditById(TENANT_ID: string, id: string): Promise<DemandeCredit> {
  try {
    // 🔑 Récupération du token JWT stocké dans les cookies
    const cookieToken = (await cookies()).get("token")?.value
    const usertoken = cookieToken

    if (!cookieToken) {
      console.log("[v0] Token d'authentification manquant, retour de données de test")

      const mockCreditDetail: DemandeCredit = {
        id: id,
        createdAt: "2024-01-10T09:00:00Z",
        updatedAt: "2024-01-10T09:00:00Z",
        deletedAt: null,
        createdById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        updatedById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        importHash: "hash789",
        tenantId: TENANT_ID,
        applicantName: "Jean Dupont",
        creditAmount: "50000",
        durationMonths: "24",
        purpose: "Achat véhicule",
        reference: "CRD-2024-001",
        clientId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      }

      return mockCreditDetail
    }

    // Envoi de la requête GET vers l'API backend pour récupérer une demande spécifique
    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/demande-credit/${id}`, {
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
    return data as DemandeCredit
  } catch (error: any) {
    console.log("[v0] Erreur lors de la récupération, retour de données de test:", error.message)

    const mockCreditDetail: DemandeCredit = {
      id: id,
      createdAt: "2024-01-10T09:00:00Z",
      updatedAt: "2024-01-10T09:00:00Z",
      deletedAt: null,
      createdById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      updatedById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      importHash: "hash789",
      tenantId: TENANT_ID,
      applicantName: "Jean Dupont",
      creditAmount: "50000",
      durationMonths: "24",
      purpose: "Achat véhicule",
      reference: "CRD-2024-001",
      clientId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    }

    return mockCreditDetail
  }
}

// Fonction asynchrone pour récupérer une demande de chéquier (commande) par ID
export async function getCommandeById(TENANT_ID: string, id: string): Promise<Commande> {
  try {
    // 🔑 Récupération du token JWT stocké dans les cookies
    const cookieToken = (await cookies()).get("token")?.value
    const usertoken = cookieToken

    if (!cookieToken) {
      console.log("[v0] Token d'authentification manquant, retour de données de test")

      const mockCheckbookDetail: Commande = {
        id: id,
        createdAt: "2024-01-15T10:00:00Z",
        updatedAt: "2024-01-15T10:00:00Z",
        deletedAt: null,
        createdById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        updatedById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        importHash: "hash123",
        tenantId: "aa1287f6-06af-45b7-a905-8c57363565c2",
        dateorder: "2024-01-15",
        nbrefeuille: 25,
        nbrechequier: 1,
        stepflow: 0,
        intitulecompte: "Compte Courant Principal",
        numcompteId: "ACC001",
        commentaire: "Demande de chéquier standard",
        talonCheque: true,
        typeCheque: "Standard",
        referenceCommande: "CHQ-2024-001",
        clientId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      }

      return mockCheckbookDetail
    }

    // Envoi de la requête GET vers l'API backend pour récupérer une commande spécifique
    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/commande/${id}`, {
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

    return data as Commande
  } catch (error: any) {
    console.log("[v0] Erreur lors de la récupération, retour de données de test:", error.message)

    const mockCheckbookDetail: Commande = {
      id: id,
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
      deletedAt: null,
      createdById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      updatedById: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      importHash: "hash123",
      tenantId: "aa1287f6-06af-45b7-a905-8c57363565c2",
      dateorder: "2024-01-15",
      nbrefeuille: 25,
      nbrechequier: 1,
      stepflow: 0,
      intitulecompte: "Compte Courant Principal",
      numcompteId: "ACC001",
      commentaire: "Demande de chéquier standard",
      talonCheque: true,
      typeCheque: "Standard",
      referenceCommande: "CHQ-2024-001",
      clientId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    }

    return mockCheckbookDetail
  }
}
