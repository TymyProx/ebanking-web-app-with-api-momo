"use client"
import { useEffect, useState } from "react"
import { BookOpen, CreditCard } from "lucide-react"
import {
  submitCreditRequest,
  getCheckbookRequest,
  getCreditRequest,
  getDemandeCreditById,
  getCommandeById,
} from "./actions"
import { useActionState } from "react"
import { getAccounts } from "../../accounts/actions"

const serviceTypes = [
  {
    id: "checkbook",
    name: "Demande de chéquier",
    icon: BookOpen,
    description: "Commander un nouveau carnet de chèques",
    category: "banking",
    processingTime: "3-5 jours ouvrables",
    cost: "Gratuit",
    requirements: ["Compte actif", "Pas de chèques impayés"],
  },
  {
    id: "credit",
    name: "Demande de crédit",
    icon: CreditCard,
    description: "Demande de crédit (personnel, immobilier, automobile, étudiant)",
    category: "credit",
    processingTime: "3-30 jours ouvrables",
    cost: "Gratuit",
    requirements: ["Revenus réguliers", "Garanties", "Dossier complet"],
  },
  // {
  //   id: "e-demande",
  //   name: "E-demande",
  //   icon: FileText,
  //   description: "Demande électronique pour divers services bancaires",
  //   category: "electronic",
  //   processingTime: "1-3 jours ouvrables",
  //   cost: "Gratuit",
  //   requirements: ["Compte actif", "Pièces justificatives"],
  // },
]

const accountsData = [
  {
    id: "acc_001",
    name: "Compte Courant Principal",
    number: "0001234567890",
    balance: 2500000,
    currency: "GNF",
    type: "Courant",
  },
  {
    id: "acc_002",
    name: "Compte Épargne",
    number: "0001234567891",
    balance: 5000000,
    currency: "GNF",
    type: "Epargne",
  },
  { id: "acc_003", name: "Compte USD", number: "0001234567892", balance: 1200, currency: "USD", type: "USD" },
]

const recentRequests = [
  {
    id: "REQ001",
    type: "Demande de chéquier",
    status: "En cours",
    submittedAt: "2024-01-15",
    expectedResponse: "2024-01-18",
    account: "Compte Courant Principal",
  },
  {
    id: "REQ002",
    type: "E-attestation bancaire",
    status: "Approuvée",
    submittedAt: "2024-01-10",
    completedAt: "2024-01-12",
    account: "Compte Courant Principal",
  },
  {
    id: "REQ003",
    type: "Crédit personnel",
    status: "En attente de documents",
    submittedAt: "2024-01-08",
    expectedResponse: "2024-01-22",
    account: "Compte Courant Principal",
  },
]

export default function ServiceRequestsPage() {
  const [selectedService, setSelectedService] = useState<string>("")
  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [activeTab, setActiveTab] = useState("new")
  const [submitState, submitAction, isSubmitting] = useActionState(submitCreditRequest, null)
  const [selectedHistoryRequest, setSelectedHistoryRequest] = useState<string>("")
  const [creditSubmitState, setCreditSubmitState] = useState<{
    success?: boolean
    error?: string
    reference?: string
  } | null>(null)
  const [isCreditSubmitting, setIsCreditSubmitting] = useState(false)
  const [checkbookSubmitState, setCheckbookSubmitState] = useState<{
    success?: boolean
    error?: string
    reference?: string
  } | null>(null)
  const [isCheckbookSubmitting, setIsCheckbookSubmitting] = useState(false)
  const [checkbookRequests, setCheckbookRequests] = useState<any[]>([])
  const [isLoadingCheckbookRequests, setIsLoadingCheckbookRequests] = useState(false)
  const [selectedCheckbookRequest, setSelectedCheckbookRequest] = useState<any>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [allRequests, setAllRequests] = useState<any[]>([])
  const [isLoadingAllRequests, setIsLoadingAllRequests] = useState(false)

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedRequestDetails, setSelectedRequestDetails] = useState<any>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)

  const selectedServiceData = serviceTypes.find((s) => s.id === selectedService)

  const loadCheckbookRequests = async () => {
    setIsLoadingCheckbookRequests(true)
    try {
      const requests = await getCheckbookRequest()
      setCheckbookRequests(requests || [])
    } catch (error) {
      console.error("Erreur lors du chargement des demandes de chéquier:", error)
      setCheckbookRequests([])
    } finally {
      setIsLoadingCheckbookRequests(false)
    }
  }

  const loadSpecificCheckbookRequest = async (id: string) => {
    try {
      const request = await getCheckbookRequest(id)
      setSelectedCheckbookRequest(request)
    } catch (error) {
      console.error("Erreur lors du chargement de la demande:", error)
      setSelectedCheckbookRequest(null)
    }
  }

  const loadAllRequests = async () => {
    setIsLoadingAllRequests(true)
    try {
      console.log("[v0] Chargement des demandes depuis la base de données...")

      // Récupération des demandes de chéquier
      const checkbookResult = await getCheckbookRequest()
      console.log("[v0] Résultat API chéquier:", checkbookResult)

      // Récupération des demandes de crédit
      const creditResult = await getCreditRequest()
      console.log("[v0] Résultat API crédit:", creditResult)

      let allTransformedRequests: any[] = []

      if (checkbookResult && checkbookResult.rows && Array.isArray(checkbookResult.rows)) {
        const checkbookData = checkbookResult.rows
        console.log("[v0] Données chéquier à traiter:", checkbookData)

        const checkbookRequests = checkbookData.map((item: any, index: number) => ({
          id: item.id || `CHQ${String(index + 1).padStart(3, "0")}`,
          type: "checkbook",
          typeName: "Demande de chéquier",
          status:
            item.stepflow === 0
              ? "En attente"
              : item.stepflow === 1
                ? "En cours"
                : item.stepflow === 2
                  ? "Approuvé"
                  : item.status || "En attente",
          submittedAt: item.dateorder || item.createdAt?.split("T")[0] || new Date().toISOString().split("T")[0],
          expectedResponse: item.dateorder
            ? new Date(new Date(item.dateorder).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
            : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          account: item.intitulecompte || "Compte non spécifié",
          reference: `CHQ-${new Date().getFullYear()}-${String(index + 1).padStart(3, "0")}`,
          details: {
            nbrechequier: item.nbrechequier || 0,
            nbrefeuille: item.nbrefeuille || 0,
            commentaire: item.commentaire || "",
            numcompteId: item.numcompteId || "",
          },
        }))
        allTransformedRequests = [...allTransformedRequests, ...checkbookRequests]
        console.log("[v0] Demandes de chéquier transformées:", checkbookRequests)
      } else {
        console.log("[v0] Aucune donnée de chéquier trouvée ou structure incorrecte")
      }

      if (creditResult && creditResult.rows && Array.isArray(creditResult.rows)) {
        const creditData = creditResult.rows
        console.log("[v0] Données crédit à traiter:", creditData)

        const creditRequests = creditData.map((item: any, index: number) => ({
          id: item.id || `CRD${String(index + 1).padStart(3, "0")}`,
          type: "credit",
          typeName: "Demande de crédit",
          status: item.status || "En attente",
          submittedAt: item.createdAt ? item.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
          expectedResponse: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          account: "Compte courant",
          reference: `CRD-${new Date().getFullYear()}-${String(index + 1).padStart(3, "0")}`,
          details: {
            applicantName: item.applicantName || "",
            creditAmount: item.creditAmount || "",
            durationMonths: item.durationMonths || "",
            purpose: item.purpose || "",
          },
        }))
        allTransformedRequests = [...allTransformedRequests, ...creditRequests]
        console.log("[v0] Demandes de crédit transformées:", creditRequests)
      } else {
        console.log("[v0] Aucune donnée de crédit trouvée ou structure incorrecte")
      }

      console.log("[v0] Toutes les demandes transformées:", allTransformedRequests)
      console.log("[v0] Nombre total de demandes:", allTransformedRequests.length)

      setAllRequests(allTransformedRequests)

      const stats = {
        total: allTransformedRequests.length,
        checkbook: allTransformedRequests.filter((req) => req.type === "checkbook").length,
        credit: allTransformedRequests.filter((req) => req.type === "credit").length,
        card: allTransformedRequests.filter((req) => req.type === "card").length,
        account: allTransformedRequests.filter((req) => req.type === "account").length,
      }
      console.log("[v0] Statistiques calculées:", stats)
    } catch (error) {
      console.error("[v0] Erreur lors du chargement des demandes:", error)
      setAllRequests([])
    } finally {
      setIsLoadingAllRequests(false)
    }
  }

  const handleViewDetails = async (request: any) => {
    setIsLoadingDetails(true)
    setIsDetailsModalOpen(true)

    try {
      console.log("[v0] Chargement des détails pour la demande:", request.id, "type:", request.type)

      let details = null
      const TENANT_ID = "aa1287f6-06af-45b7-a905-8c57363565c2"

      if (request.type === "credit") {
        details = await getDemandeCreditById(TENANT_ID, request.id)
      } else if (request.type === "checkbook") {
        details = await getCommandeById(TENANT_ID, request.id)
      }

      console.log("[v0] Détails récupérés:", details)
      setSelectedRequestDetails(details)
    } catch (error) {
      console.error("[v0] Erreur lors du chargement des détails:", error)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false)
    setSelectedRequestDetails(null)
  }

  const formatRequestDetails = (details: any, type: string) => {
    if (!details) return []

    const commonFields = [{ label: "Numéro de compte", value: details.accountNumber || details.numcompteId }]

    if (type === "credit") {
      return [
        ...commonFields,
        { label: "Nom du demandeur", value: details.applicantName },
        { label: "Montant du crédit", value: `${details.creditAmount} €` },
        { label: "Durée (mois)", value: details.durationMonths },
        { label: "Objet du crédit", value: details.purpose },
      ]
    } else if (type === "checkbook") {
      return [
        ...commonFields,
        { label: "Date de commande", value: new Date(details.dateorder).toLocaleDateString("fr-FR") },
        { label: "Nombre de feuilles", value: details.nbrefeuille },
        { label: "Nombre de chéquiers", value: details.nbrechequier },
        { label: "Intitulé du compte", value: details.intitulecompte },
        { label: "Commentaire", value: details.commentaire || "Aucun commentaire" },
      ]
    }

    return commonFields
  }

  useEffect(() => {
    console.log("[v0] useEffect déclenché, activeTab:", activeTab)
    if (activeTab === "history") {
      console.log("[v0] Chargement des demandes pour l'onglet historique")
      loadAllRequests()
    }
  }, [activeTab])

  useEffect(() => {
    if (activeTab === "history") {
      loadCheckbookRequests()
    }
  }, [activeTab])

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      console.log("[v0] Chargement des comptes...")
      setIsLoadingAccounts(true)
      const result = await getAccounts()
      console.log("[v0] Résultat getAccounts:", result)

      if (Array.isArray(result) && result.length > 0) {
        // Adapter les données API au format Account
        const adaptedAccounts = result.map((apiAccount: any) => ({
          id: apiAccount.id || apiAccount.accountId,
          name: apiAccount.accountName || apiAccount.name || `Compte ${apiAccount.accountNumber || apiAccount.number}`,
          number: apiAccount.accountNumber || apiAccount.number, //|| apiAccount.id,
          balance: apiAccount.bookBalance || apiAccount.balance || 0,
          currency: apiAccount.currency || "GNF",
          status: apiAccount.status,
          type: apiAccount.accountType || apiAccount.type,
        }))

        // Filtrer pour ne garder que les comptes courants actifs
        const currentAccounts = adaptedAccounts.filter(
          (account: any) =>
            (account.status === "ACTIF" || account.status === "Actif") &&
            (account.type === "Courant" || account.type === "Courant") &&
            account.number &&
            String(account.number).trim() !== "",
        )
        console.log("[v0] Comptes courants actifs:", currentAccounts)
        setAccounts(currentAccounts)
      } else {
        console.log("[v0] Aucun compte trouvé")
        setAccounts([])
      }
    } catch (error) {
      console.error("[v0] Erreur lors du chargement des comptes", error)
    } finally {
      setIsLoadingAccounts(false)
    }
  }
}
