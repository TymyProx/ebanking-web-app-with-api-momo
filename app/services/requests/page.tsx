"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BookOpen,
  CreditCard,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Eye,
  Shield,
  Plus,
  Search,
} from "lucide-react"
import {
  submitCreditRequest,
  submitCheckbookRequest,
  getCheckbookRequest,
  getCreditRequest,
  getDemandeCreditById,
  getCommandeById,
} from "./actions"
import { useActionState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getAccounts } from "../../accounts/actions"

const serviceTypes = [
  {
    id: "checkbook",
    name: "Demande de chéquier",
    icon: BookOpen,
    description: "Commander un nouveau carnet de chèques",
    category: "banking",
    //processingTime: "3-5 jours ouvrables",
    requirements: ["Compte actif", "Pas de chèques impayés"],
  },
  {
    id: "credit",
    name: "Demande de crédit",
    icon: CreditCard,
    description: "Demande de crédit (personnel, immobilier,...etc)",
    category: "credit",
    //processingTime: "3-30 jours ouvrables",
    requirements: ["Revenus réguliers", "Garanties", "Dossier complet"],
  },
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
                ? "En cours de traitement"
                : item.stepflow === 2
                  ? "En cours de traitement"
                  : item.stepflow === 3
                    ? "Disponible à l’agence"
                    : item.stepflow === 4
                      ? "Disponible"
                      : item.stepflow === 5
                        ? "Retiré"
                        : "En attente",
          submittedAt: item.dateorder || item.createdAt?.split("T")[0] || new Date().toISOString().split("T")[0],
          expectedResponse: item.dateorder
            ? new Date(new Date(item.dateorder).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
            : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          account: item.numcompteId || "Compte non spécifié",
          reference: item.referenceCommande || "Référence non disponible",
          details: {
            nbrechequier: item.nbrechequier || 0,
            nbrefeuille: item.nbrefeuille || 0,
            commentaire: item.commentaire || "",
            numcompteId: item.numcompteId || "",
            typeCheque: item.typeCheque,
            talonCheque: item.talonCheque,
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
          account: item.numcompte || item.accountNumber || "Compte non spécifié",
          reference: item.reference || "Référence non disponible",
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

      const checkbookRequests = allTransformedRequests
        .filter((req) => req.type === "checkbook")
        .sort((a, b) => {
          const refA = a.reference || ""
          const refB = b.reference || ""
          return refB.localeCompare(refA)
        })

      const creditRequests = allTransformedRequests
        .filter((req) => req.type === "credit")
        .sort((a, b) => {
          const refA = a.reference || ""
          const refB = b.reference || ""
          return refB.localeCompare(refA)
        })

      // Concaténer : chéquier d'abord, crédit ensuite
      allTransformedRequests = [...checkbookRequests, ...creditRequests]
      console.log("[v0] Demandes triées par type puis par référence (décroissant):", allTransformedRequests)

      setAllRequests(allTransformedRequests)
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
        console.log("[v0] Détails crédit bruts:", details)
        if (details && !details.applicant_name) {
          details = {
            ...details,
            ...request.details,
            reference: request.reference,
            numcompte: request.account,
          }
        }
      } else if (request.type === "checkbook") {
        details = await getCommandeById(TENANT_ID, request.id)
        console.log("[v0] Détails chéquier bruts:", details)
      }

      console.log("[v0] Détails récupérés après traitement:", details)
      setSelectedRequestDetails(details)
    } catch (error) {
      console.error("[v0] Erreur lors du chargement des détails:", error)
      setSelectedRequestDetails({
        ...request.details,
        reference: request.reference,
        numcompte: request.account,
        id: request.id,
      })
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false)
    setSelectedRequestDetails(null)
  }

  // Affichage des modals

  const formatRequestDetails = (details: any, type: string) => {
    if (!details) return []

    console.log("[v0] Formatage des détails pour type:", type, "données:", details)

    const commonFields = [
      {
        label: "Référence",
        value:
          type === "checkbook" ? details.referenceCommande || "Non attribuée" : details.reference || "Non attribuée",
      },
      { label: "Numéro de compte", value: details.numcompte || details.numcompteId || "Non spécifié" },
      { label: "Intitulé du compte", value: details.intitulecompte || "Non spécifié" },
    ]

    if (type === "credit") {
      return [
        ...commonFields,
        { label: "Nom du demandeur", value: details.applicant_name || details.applicantName || "Non spécifié" },
        { label: "Type de crédit", value: details.credit_type || details.creditType || "Non spécifié" },
        {
          label: "Montant du crédit",
          value:
            details.loan_amount || details.creditAmount
              ? `${new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "GNF",
                  minimumFractionDigits: 0,
                }).format(Number(details.loan_amount || details.creditAmount))}`
              : "Non spécifié",
        },
        { label: "Durée (mois)", value: details.loan_duration || details.durationMonths || "Non spécifié" },
        { label: "Objet du crédit", value: details.loan_purpose || details.purpose || "Non spécifié" },
        { label: "Téléphone", value: details.contact_phone || "Non spécifié" },
        { label: "Commentaire", value: details.commentaire || "Aucun commentaire" },
      ]
    }

    if (type === "checkbook") {
      return [
        ...commonFields,
        {
          label: "Date de commande",
          value: details.dateorder ? new Date(details.dateorder).toLocaleDateString("fr-FR") : "Non spécifiée",
        },
        { label: "Nombre de feuilles", value: details.nbrefeuille || "Non spécifié" },
        { label: "Nombre de chéquiers", value: details.nbrechequier || "Non spécifié" },
        { label: "Type de chèque", value: details.typeCheque || "Non spécifié" },
        { label: "Avec talon de chèque", value: details.talonCheque ? "Oui" : "Non" },
        { label: "Intitulé du compte", value: details.intitulecompte || "Non spécifié" },
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
          number: apiAccount.accountNumber || apiAccount.number,
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
      console.error("[v0] Erreur lors du chargement des comptes:", error)
      setAccounts([])
    } finally {
      setIsLoadingAccounts(false)
    }
  }

  const filteredRequests = allRequests.filter((request) => {
    const matchesSearch =
      request.typeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.account.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterType === "all" || request.type === filterType

    return matchesSearch && matchesFilter
  })

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case "checkbook":
        return <BookOpen className="w-4 h-4 text-blue-600" />

      case "credit":
        return <CreditCard className="w-4 h-4 text-purple-600" />

      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const loadRequestsByType = async (type: string) => {
    console.log(`[v0] Chargement des demandes de type: ${type}`)
    setIsLoadingAllRequests(true)
    try {
      let result
      if (type === "checkbook") {
        result = await getCheckbookRequest()
      } else if (type === "credit") {
        result = await getCreditRequest()
      } else {
        // Pour les autres types, on charge toutes les demandes
        await loadAllRequests()
        return
      }

      if (result && result.success && result.data) {
        const transformedRequests = Array.isArray(result.data)
          ? result.data.map((item: any, index: number) => {
              if (type === "checkbook") {
                return {
                  id: item.id || `CHQ${String(index + 1).padStart(3, "0")}`,
                  type: "checkbook",
                  typeName: "Demande de chéquier",
                  status:
                    item.stepflow === 0
                      ? "En attente"
                      : item.stepflow === 1
                        ? "En cours de traitement"
                        : item.stepflow === 2
                          ? "En cours de traitement"
                          : item.stepflow === 3
                            ? "Disponible à l’agence"
                            : item.stepflow === 4
                              ? "Disponible"
                              : item.stepflow === 5
                                ? "Retiré"
                                : "En attente",
                  submittedAt: item.dateorder || new Date().toISOString().split("T")[0],
                  expectedResponse: item.dateorder
                    ? new Date(new Date(item.dateorder).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
                    : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                  account: item.numcompteId || "Compte non spécifié",
                  reference: item.referenceCommande || "Référence non disponible",
                  details: {
                    nbrechequier: item.nbrechequier || 0,
                    nbrefeuille: item.nbrefeuille || 0,
                    commentaire: item.commentaire || "",
                  },
                }
              } else {
                return {
                  id: item.id || `CRD${String(index + 1).padStart(3, "0")}`,
                  type: "credit",
                  typeName: "Crédit",
                  status: "En cours",
                  submittedAt: item.createdAt ? item.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
                  expectedResponse: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                  account: item.numcompte || item.accountNumber || "Compte non spécifié",
                  reference: item.reference || "Référence non disponible",
                  details: {
                    applicantName: item.applicantName || "",
                    creditAmount: item.creditAmount || "",
                    durationMonths: item.durationMonths || "",
                    purpose: item.purpose || "",
                  },
                }
              }
            })
          : []
        setAllRequests(transformedRequests)
      } else {
        setAllRequests([])
      }
    } catch (error) {
      console.error(`[v0] Erreur lors du chargement des demandes ${type}:`, error)
      setAllRequests([])
    } finally {
      setIsLoadingAllRequests(false)
    }
  }

  const selectedHistoryRequestData = recentRequests.find((r) => r.id === selectedHistoryRequest)

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const getServiceIdFromRequestType = (requestType: string): string => {
    const typeMapping: Record<string, string> = {
      "Demande de chéquier": "checkbook",
      Crédit: "credit",
    }
    return typeMapping[requestType] || ""
  }

  const getAccountIdFromName = (accountName: string): string => {
    const account = accountsData.find((acc) => acc.name === accountName)
    return account?.id || ""
  }

  const handleHistoryRequestChange = (requestId: string) => {
    setSelectedHistoryRequest(requestId)
    if (requestId) {
      const request = recentRequests.find((r) => r.id === requestId)
      if (request) {
        const serviceId = getServiceIdFromRequestType(request.type)
        const accountId = getAccountIdFromName(request.account)
        setSelectedService(serviceId)
        setSelectedAccount(accountId)
        setFormData({})
      }
    } else {
      setSelectedService("")
      setSelectedAccount("")
      setFormData({})
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "En attente":
        return <Badge className="bg-gray-100 text-gray-800">En attente</Badge>
      case "En cours de traitement":
        return <Badge className="bg-blue-100 text-blue-800">En cours de traitement</Badge>
      case "Disponible à l’agence":
      case "Disponible":
        return <Badge className="bg-yellow-100 text-yellow-800">Disponible</Badge>
      case "Retiré":
        return <Badge className="bg-green-100 text-green-800">Retiré</Badge>
      case "Rejetée":
        return <Badge className="bg-red-100 text-red-800">Rejetée</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR").format(amount)
  }

  // Fonction pour gérer la soumission du formulaire de crédit
  const handleCreditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("[v0] FormData au moment de la soumission:", formData)
    console.log("[v0] Vérification des champs:")
    console.log("[v0] applicant_name:", formData.applicant_name)
    console.log("[v0] loan_amount:", formData.loan_amount)
    console.log("[v0] loan_duration:", formData.loan_duration)
    console.log("[v0] loan_purpose:", formData.loan_purpose)
    console.log("[v0] credit_type:", formData.credit_type)
    console.log("[v0] monthly_income:", formData.monthly_income)
    console.log("[v0] employment_type:", formData.employment_type)
    console.log("[v0] contact_phone:", formData.contact_phone)
    console.log("[v0] contact_email:", formData.contact_email)
    console.log("[v0] terms:", formData.terms)
    console.log("[v0] numcompte:", formData.numcompte)
    console.log("[v0] accountId:", formData.accountId)

    // Vérifier que tous les champs requis sont remplis
    if (
      !formData.applicant_name ||
      !formData.loan_amount ||
      !formData.loan_duration ||
      !formData.loan_purpose ||
      !formData.credit_type ||
      !formData.monthly_income ||
      !formData.employment_type ||
      !formData.contact_phone ||
      !formData.contact_email ||
      !formData.terms ||
      !formData.numcompte ||
      !formData.accountId
    ) {
      console.log("[v0] Validation échouée - champs manquants")
      setCreditSubmitState({ error: "Veuillez remplir tous les champs obligatoires" })
      return
    }

    setIsCreditSubmitting(true)
    setCreditSubmitState(null)

    try {
      const creditData = {
        applicant_name: formData.applicant_name,
        loan_amount: formData.loan_amount,
        loan_duration: formData.loan_duration,
        loan_purpose: formData.loan_purpose,
        numcompte: formData.numcompte,
        typedemande: formData.credit_type || "credit",
        accountNumber: formData.numcompte,
      }

      console.log("[v0] Données envoyées à l'API:", creditData)
      const result = await submitCreditRequest(creditData)
      setCreditSubmitState({
        success: true,
        reference: result.reference || "CRD-" + new Date().getFullYear() + "-" + String(Date.now()).slice(-3),
      })
      // Réinitialiser le formulaire après succès
      setFormData({})
      // Recharger les demandes
      if (activeTab === "history") {
        loadAllRequests()
      }
    } catch (error: any) {
      console.log("[v0] Erreur lors de la soumission:", error.message)
      setCreditSubmitState({ error: error.message || "Une erreur s'est produite lors de la soumission" })
    } finally {
      setIsCreditSubmitting(false)
    }
  }

  const handleCheckbookSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Vérifier que tous les champs requis sont remplis
    if (
      !formData.nbrechequier ||
      !formData.nbrefeuille ||
      !formData.intitulecompte ||
      !formData.numcompte ||
      !formData.terms
    ) {
      setCheckbookSubmitState({ error: "Veuillez remplir tous les champs obligatoires" })
      return
    }

    setIsCheckbookSubmitting(true)
    setCheckbookSubmitState(null)

    try {
      const checkbookData = {
        dateorder: formData.dateorder || new Date().toISOString().split("T")[0],
        nbrefeuille: Number.parseInt(formData.nbrefeuille) || 0,
        nbrechequier: Number.parseInt(formData.nbrechequier) || 0,
        stepflow: 0,
        intitulecompte: formData.intitulecompte,
        numcompteId: formData.numcompte,
        commentaire: formData.commentaire || "",
        typeCheque: formData.typeCheque || "Standard",
        talonCheque: formData.talonCheque === true,
      }

      const result = await submitCheckbookRequest(checkbookData)
      setCheckbookSubmitState({
        success: true,
        reference: result.reference || "CHQ-" + new Date().getFullYear() + "-" + String(Date.now()).slice(-3),
      })
      // Réinitialiser le formulaire après succès
      setFormData({})
      // Recharger les demandes
      if (activeTab === "history") {
        loadAllRequests()
      }
    } catch (error: any) {
      setCheckbookSubmitState({ error: error.message || "Une erreur s'est produite lors de la soumission" })
    } finally {
      setIsCheckbookSubmitting(false)
    }
  }

  const [eDemandeSubmitState, setEDemandeSubmitState] = useState<{
    success?: boolean
    error?: string
    reference?: string
  } | null>(null)
  const [isEDemandeSubmitting, setIsEDemandeSubmitting] = useState(false)

  const handleEDemandeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Vérifier que tous les champs requis sont remplis
    if (
      !formData.demande_type ||
      !formData.objet_demande ||
      !formData.numcompte_edemande ||
      !formData.motif_demande ||
      !formData.contact_edemande ||
      !formData.edemande_terms
    ) {
      setEDemandeSubmitState({ error: "Veuillez remplir tous les champs obligatoires" })
      return
    }

    setIsEDemandeSubmitting(true)
    setEDemandeSubmitState(null)

    try {
      const eDemandeData = {
        demande_type: formData.demande_type,
        objet_demande: formData.objet_demande,
        numcompte_edemande: formData.numcompte_edemande,
        motif_demande: formData.motif_demande,
        date_besoin: formData.date_besoin || new Date().toISOString().split("T")[0],
        contact_edemande: formData.contact_edemande,
      }

      // Simuler la soumission de la demande (à remplacer par l'appel API réel)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setEDemandeSubmitState({ success: true, reference: "EDM-" + Date.now() })
      // Réinitialiser le formulaire après succès
      setFormData({})
    } catch (error: any) {
      setEDemandeSubmitState({ error: error.message || "Une erreur s'est produite lors de la soumission" })
    } finally {
      setIsEDemandeSubmitting(false)
    }
  }

  const renderServiceForm = () => {
    if (!selectedServiceData) return null

    switch (selectedService) {
      // COMMANDE CHEQUIER PAGE
      case "checkbook":
        return (
          <form onSubmit={handleCheckbookSubmit} className="space-y-4">
            {/* Ligne 1: Compte et Numéro de compte */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="intitulecompte">Sélectionner un compte *</Label>
                <Select
                  value={formData.numcompteId || ""}
                  onValueChange={(value) => {
                    const selectedAccount = accounts.find((acc) => acc.id === value)
                    if (selectedAccount) {
                      handleInputChange("accountId", selectedAccount.id)
                      handleInputChange("intitulecompte", selectedAccount.name)
                      handleInputChange("numcompte", selectedAccount.number)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingAccounts ? "Chargement..." : "Choisir un compte"} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingAccounts ? (
                      <SelectItem value="loading" disabled>
                        Chargement des comptes...
                      </SelectItem>
                    ) : accounts.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        Aucun compte courant trouvé
                      </SelectItem>
                    ) : (
                      accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{account.name}</span>
                            <span className="text-sm text-gray-500">
                              {account.number} •{" "}
                              {new Intl.NumberFormat("fr-FR", {
                                style: "currency",
                                currency: account.currency === "GNF" ? "GNF" : account.currency,
                                minimumFractionDigits: account.currency === "GNF" ? 0 : 2,
                              }).format(account.balance)}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numcompte">Numéro de compte *</Label>
                <Input
                  id="numcompte"
                  name="numcompte"
                  type="text"
                  value={formData.numcompte || ""}
                  onChange={(e) => handleInputChange("numcompte", e.target.value)}
                  placeholder="Ex: 000123456789"
                  required
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>

            {/* Ligne 2: Date commande et Nombre de chéquiers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateorder">Date de commande *</Label>
                <Input
                  id="dateorder"
                  name="dateorder"
                  type="date"
                  value={formData.dateorder || new Date().toISOString().split("T")[0]}
                  onChange={(e) => handleInputChange("dateorder", e.target.value)}
                  required
                  className="w-40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nbrechequier">Nombre de chéquiers *</Label>
                <Input
                  id="nbrechequier"
                  name="nbrechequier"
                  type="number"
                  min="1"
                  max="2"
                  value={formData.nbrechequier || ""}
                  onChange={(e) => {
                    const value = Number.parseInt(e.target.value)
                    if (value >= 1 && value <= 2) {
                      handleInputChange("nbrechequier", value.toString())
                    }
                  }}
                  placeholder="Ex: 2"
                  required
                  className="w-40"
                />
              </div>
            </div>

            {/* Ligne 3: Nombre de feuillets et Type de chèque */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nbrefeuille">Nombre de feuillets par chéquier *</Label>
                <Select
                  value={formData.nbrefeuille || ""}
                  onValueChange={(value) => handleInputChange("nbrefeuille", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir le nombre de feuillets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 feuillets</SelectItem>
                    <SelectItem value="50">50 feuillets</SelectItem>
                    <SelectItem value="100">100 feuillets</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="typeCheque">Type de chèque *</Label>
                <Select
                  value={formData.typeCheque || ""}
                  onValueChange={(value) => handleInputChange("typeCheque", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir le type de chèque" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard barré">Standard barré</SelectItem>
                    <SelectItem value="Standard non barré">Standard non barré</SelectItem>
                    <SelectItem value="Certifié barré">Certifié barré</SelectItem>
                    <SelectItem value="Certifié non barré">Certifié non barré</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Le reste du code reste inchangé */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="talonCheque"
                checked={formData.talonCheque || false}
                onCheckedChange={(checked) => handleInputChange("talonCheque", checked)}
              />
              <Label htmlFor="talonCheque" className="text-sm font-normal">
                Chèque à Talon
              </Label>
            </div>

            <div>
              <Label htmlFor="commentaire">Commentaire</Label>
              <Textarea
                id="commentaire"
                name="commentaire"
                value={formData.commentaire || ""}
                onChange={(e) => handleInputChange("commentaire", e.target.value)}
                placeholder="Commentaire optionnel..."
                rows={3}
              />
            </div>

            {checkbookSubmitState?.success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ✅ Votre demande de chéquier a été soumise avec succès ! Référence: {checkbookSubmitState.reference}
                </AlertDescription>
              </Alert>
            )}

            {checkbookSubmitState?.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>❌ {checkbookSubmitState.error}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="checkbook_terms"
                checked={formData.terms || false}
                onCheckedChange={(checked) => handleInputChange("terms", checked)}
              />
              <Label htmlFor="checkbook_terms" className="text-sm">
                J'accepte les{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  conditions générales
                </a>{" "}
                et autorise le traitement de ma demande
              </Label>
            </div>
          </form>
        )

      // DEMANDE CREDIT PAGE
      case "credit":
        return (
          <form onSubmit={handleCreditSubmit} className="space-y-4">
            {/* Sélectionner un compte et Numéro de compte sur la même ligne sans décalage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="intitulecompte">Sélectionner un compte *</Label>
                <Select
                  value={formData.accountId || ""}
                  onValueChange={(value) => {
                    const selectedAccount = accounts.find((acc) => acc.id === value)
                    if (selectedAccount) {
                      handleInputChange("accountId", selectedAccount.id)
                      handleInputChange("intitulecompte", selectedAccount.name)
                      handleInputChange("numcompte", selectedAccount.number)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingAccounts ? "Chargement..." : "Choisir un compte"} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingAccounts ? (
                      <SelectItem value="loading" disabled>
                        Chargement des comptes...
                      </SelectItem>
                    ) : accounts.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        Aucun compte courant trouvé
                      </SelectItem>
                    ) : (
                      accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{account.name}</span>
                            <span className="text-sm text-gray-500">
                              {account.number} •{" "}
                              {new Intl.NumberFormat("fr-FR", {
                                style: "currency",
                                currency: account.currency === "GNF" ? "GNF" : account.currency,
                                minimumFractionDigits: account.currency === "GNF" ? 0 : 2,
                              }).format(account.balance)}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="numcompte_credit">Numéro de compte *</Label>
                <Input
                  id="numcompte_credit"
                  name="numcompte_credit"
                  type="text"
                  value={formData.numcompte || ""}
                  onChange={(e) => handleInputChange("numcompte", e.target.value)}
                  placeholder="Ex: 000123456789"
                  required
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>

            {/* Type de crédit seul sur sa ligne avec largeur réduite */}
            <div className="max-w-md">
              <Label htmlFor="credit_type">Type de crédit *</Label>
              <Select onValueChange={(value) => handleInputChange("credit_type", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le type de crédit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Personnel">Crédit personnel</SelectItem>
                  <SelectItem value="Immobilier">Crédit immobilier</SelectItem>
                  <SelectItem value="Etudiant">Crédit étudiant</SelectItem>
                  <SelectItem value="Automobile">Crédit automobile</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Montant du crédit et Durée (inchangés) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="loan_amount">Montant du crédit (GNF) *</Label>
                <Input
                  id="loan_amount"
                  type="number"
                  placeholder="Ex: 10000000"
                  value={formData.loan_amount || ""}
                  onChange={(e) => handleInputChange("loan_amount", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="loan_duration">Durée (mois) *</Label>
                <Select onValueChange={(value) => handleInputChange("loan_duration", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Durée" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12 mois</SelectItem>
                    <SelectItem value="24">24 mois</SelectItem>
                    <SelectItem value="36">36 mois</SelectItem>
                    <SelectItem value="48">48 mois</SelectItem>
                    <SelectItem value="60">60 mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Objet du crédit seul sur sa ligne avec largeur réduite */}
            <div className="max-w-md">
              <Label htmlFor="loan_purpose">Objet du crédit *</Label>
              <Select onValueChange={(value) => handleInputChange("loan_purpose", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez l'objet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Consommation">Consommation</SelectItem>
                  <SelectItem value="Équipement">Équipement</SelectItem>
                  <SelectItem value="Rénovation">Rénovation</SelectItem>
                  <SelectItem value="Éducation">Éducation</SelectItem>
                  <SelectItem value="Santé">Santé</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Revenus mensuels et Type d'emploi (inchangés) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthly_income">Revenus mensuels (GNF) *</Label>
                <Input
                  id="monthly_income"
                  type="number"
                  placeholder="Ex: 2000000"
                  value={formData.monthly_income || ""}
                  onChange={(e) => handleInputChange("monthly_income", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="employment_type">Type d'emploi *</Label>
                <Select onValueChange={(value) => handleInputChange("employment_type", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Type d'emploi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Salarié">Salarié</SelectItem>
                    <SelectItem value="Fonctionnaire">Fonctionnaire</SelectItem>
                    <SelectItem value="Indépendant">Indépendant</SelectItem>
                    <SelectItem value="Chef dentreprise">Chef d'entreprise</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Nom du demandeur réduit */}
            <div className="max-w-md">
              <Label htmlFor="applicant_name">Nom du demandeur *</Label>
              <Input
                id="applicant_name"
                placeholder="Nom du demandeur"
                value={formData.applicant_name || ""}
                onChange={(e) => handleInputChange("applicant_name", e.target.value)}
                required
              />
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h4 className="font-medium">Informations de contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_phone">Téléphone *</Label>
                  <Input
                    id="contact_phone"
                    placeholder="+224 6XX XXX XXX"
                    value={formData.contact_phone || ""}
                    onChange={(e) => handleInputChange("contact_phone", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="contact_email">Email *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.contact_email || ""}
                    onChange={(e) => handleInputChange("contact_email", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Feedback Messages */}
            {creditSubmitState?.success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ✅ Votre demande de crédit a été envoyée avec succès. Référence: {creditSubmitState.reference}.{" "}
                  {/* Réponse sous {selectedServiceData?.processingTime}. */}
                </AlertDescription>
              </Alert>
            )}

            {creditSubmitState?.error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  ❌ Une erreur est survenue: {creditSubmitState.error}. Veuillez réessayer.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-start space-x-2">
              <Checkbox
                id="credit_terms"
                checked={formData.terms || false}
                onCheckedChange={(checked) => handleInputChange("terms", checked)}
              />
              <Label htmlFor="credit_terms" className="text-sm">
                J'accepte les{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  conditions générales
                </a>{" "}
                et autorise le traitement de ma demande
              </Label>
            </div>
          </form>
        )

      // E-DEMANDE PAGE
      case "e-demande":
        return (
          <form onSubmit={handleEDemandeSubmit} className="space-y-4">
            <div>
              <Label htmlFor="demande_type">Type de demande *</Label>
              <Select onValueChange={(value) => handleInputChange("demande_type", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le type de demande" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attestation">Attestation bancaire</SelectItem>
                  <SelectItem value="releve">Relevé de compte</SelectItem>
                  <SelectItem value="certificat">Certificat de non-endettement</SelectItem>
                  <SelectItem value="autre">Autre demande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="objet_demande">Objet de la demande *</Label>
              <Input
                id="objet_demande"
                name="objet_demande"
                type="text"
                value={formData.objet_demande || ""}
                onChange={(e) => handleInputChange("objet_demande", e.target.value)}
                placeholder="Ex: Attestation pour visa"
                required
              />
            </div>

            <div>
              <Label htmlFor="numcompte_edemande">Numéro de compte *</Label>
              <Input
                id="numcompte_edemande"
                name="numcompte_edemande"
                type="text"
                value={formData.numcompte_edemande || ""}
                onChange={(e) => handleInputChange("numcompte_edemande", e.target.value)}
                placeholder="Ex: 123456789"
                required
              />
            </div>

            <div>
              <Label htmlFor="motif_demande">Motif de la demande *</Label>
              <textarea
                id="motif_demande"
                name="motif_demande"
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={4}
                value={formData.motif_demande || ""}
                onChange={(e) => handleInputChange("motif_demande", e.target.value)}
                placeholder="Expliquez le motif de votre demande..."
                required
              />
            </div>

            <div>
              <Label htmlFor="date_besoin">Date de besoin</Label>
              <Input
                id="date_besoin"
                name="date_besoin"
                type="date"
                value={formData.date_besoin || ""}
                onChange={(e) => handleInputChange("date_besoin", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="contact_edemande">Téléphone de contact *</Label>
              <Input
                id="contact_edemande"
                name="contact_edemande"
                type="tel"
                value={formData.contact_edemande || ""}
                onChange={(e) => handleInputChange("contact_edemande", e.target.value)}
                placeholder="+224 6XX XXX XXX"
                required
              />
            </div>

            {eDemandeSubmitState?.success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ✅ Votre e-demande a été envoyée avec succès. Référence: {eDemandeSubmitState.reference}.{" "}
                  {/* Réponse sous {selectedServiceData?.processingTime}. */}
                </AlertDescription>
              </Alert>
            )}

            {eDemandeSubmitState?.error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  ❌ Une erreur est survenue: {eDemandeSubmitState.error}. Veuillez réessayer.
                </AlertDescription>
              </Alert>
            )}
          </form>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          E-Services
        </h1>
        <p className="text-muted-foreground text-lg">Faites vos demandes de services en ligne</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new">Nouvelle demande</TabsTrigger>
          <TabsTrigger value="history">Mes demandes</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-6">
          {/* Service Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Nouvelle demande</span>
              </CardTitle>
              <CardDescription>Sélectionnez le type de service que vous souhaitez demander</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {serviceTypes.map((service) => {
                  const Icon = service.icon
                  return (
                    <div
                      key={service.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedService === service.id
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedService(service.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{service.name}</h3>
                          <p className="text-xs text-gray-500 mt-1">{service.description}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Service Details & Form */}
          {selectedServiceData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <selectedServiceData.icon className="w-5 h-5" />
                  <span>{selectedServiceData.name}</span>
                </CardTitle>
                <CardDescription>{selectedServiceData.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Service Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  {/*
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Délai de traitement</p>
                      <p className="text-xs text-gray-600">{selectedServiceData.processingTime}</p>
                    </div>
                  </div>
                  */}
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Sécurisé</p>
                      <p className="text-xs text-gray-600">Traitement confidentiel</p>
                    </div>
                  </div>
                </div>

                {/* Dynamic Form */}
                {renderServiceForm()}

                {/* Submit Button */}
                {selectedService === "checkbook" ? (
                  <Button
                    type="button"
                    onClick={handleCheckbookSubmit}
                    disabled={isCheckbookSubmitting || !formData.terms}
                    className="w-full"
                  >
                    {isCheckbookSubmitting ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Envoyer la demande
                      </>
                    )}
                  </Button>
                ) : selectedService === "credit" ? (
                  <Button
                    type="button"
                    onClick={handleCreditSubmit}
                    disabled={isCreditSubmitting || !formData.terms}
                    className="w-full"
                  >
                    {isCreditSubmitting ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Envoyer la demande
                      </>
                    )}
                  </Button>
                ) : (
                  <form action={submitAction}>
                    <input type="hidden" name="serviceType" value={selectedService} />
                    <input type="hidden" name="accountId" value={selectedAccount} />
                    <input type="hidden" name="formData" value={JSON.stringify(formData)} />

                    <Button type="submit" disabled={isSubmitting || !formData.terms} className="w-full">
                      {isSubmitting ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Envoyer la demande
                        </>
                      )}
                    </Button>
                  </form>
                )}

                {/* Feedback Messages */}
                {submitState?.success && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      ✅ Votre demande a été envoyée avec succès. Référence: {submitState.reference}.{" "}
                      {/*Réponse sous{" "}
                      {selectedServiceData?.processingTime}.*/}
                    </AlertDescription>
                  </Alert>
                )}

                {submitState?.error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      ❌ Une erreur est survenue: {submitState.error}. Veuillez réessayer.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Mes demandes</h2>
              <p className="text-gray-600">Consultez et gérez vos demandes de services</p>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Rechercher une demande..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filtrer par type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les demandes</SelectItem>
                    <SelectItem value="checkbook">Demande de chéquier</SelectItem>
                    <SelectItem value="credit">Demande de crédit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => loadRequestsByType("all")}
            >
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold">{allRequests.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => loadRequestsByType("checkbook")}
            >
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Chéquier</p>
                    <p className="text-2xl font-bold">{allRequests.filter((r) => r.type === "checkbook").length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => loadRequestsByType("credit")}
            >
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <CreditCard className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Crédit</p>
                    <p className="text-2xl font-bold">{allRequests.filter((r) => r.type === "credit").length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Mes demandes ({filteredRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAllRequests ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Chargement des demandes...</p>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune demande trouvée</p>
                  <p className="text-sm text-gray-400">Créez votre première demande dans l'onglet "Nouvelle demande"</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          {getRequestTypeIcon(request.type)}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900">{request.typeName}</h3>
                            {getStatusBadge(request.status)}
                          </div>

                          <div className="text-sm text-gray-600 space-y-1">
                            <p className="font-mono">Réf: {request.reference}</p>
                            <p className="font-medium">{request.account}</p>
                          </div>
                        </div>

                        <div className="text-right text-sm text-gray-500">
                          <p>Soumise le</p>
                          <p className="font-medium">{new Date(request.submittedAt).toLocaleDateString("fr-FR")}</p>
                          {/*
                          {request.expectedResponse && (
                            <p className="text-xs">
                              Réponse attendue: {new Date(request.expectedResponse).toLocaleDateString("fr-FR")}
                            </p>
                          )}
                          */}
                          {request.completedAt && (
                            <p className="text-xs text-green-600">
                              Complétée le: {new Date(request.completedAt).toLocaleDateString("fr-FR")}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(request)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Détails de la demande
            </DialogTitle>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
              <p className="text-gray-600">Chargement des détails...</p>
            </div>
          ) : selectedRequestDetails ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formatRequestDetails(
                  selectedRequestDetails,
                  allRequests.find((r) => r.id === selectedRequestDetails.id)?.type || "unknown",
                ).map((field, index) => (
                  <div key={index} className="space-y-1">
                    <label className="text-sm font-medium text-gray-600">{field.label}</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">{field.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={closeDetailsModal}>
                  Fermer
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucun détail disponible</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
