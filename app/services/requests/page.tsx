"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { BookOpen, CreditCard, FileText } from "lucide-react"
import {
  submitCreditRequest,
  submitCheckbookRequest,
  submitCheckbookRequestSecure,
  getCheckbookRequest,
  getCreditRequest,
  getDemandeCreditById,
  getCommandeById,
} from "./actions"
import { useActionState } from "react"
import { getAccounts } from "../../accounts/actions"
import { buildCommandeSecurePayload } from "@/lib/secure-payload"
import { importAesGcmKeyFromBase64, isEncryptedJson, decryptAesGcmFromJson } from "@/lib/crypto"

const serviceTypes = [
  {
    id: "checkbook",
    name: "Demande de chéquier",
    icon: BookOpen,
    description: "Commander un nouveau carnet de chèques",
    category: "banking",
    // processingTime: "3-5 jours ouvrables",
    //cost: "Gratuit",
    requirements: ["Compte actif", "Pas de chèques impayés"],
  },
  {
    id: "credit",
    name: "Demande de crédit",
    icon: CreditCard,
    description: "Demande de crédit (personnel, immobilier, automobile, étudiant)",
    category: "credit",
    //processingTime: "3-30 jours ouvrables",
    //cost: "Gratuit",
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

  useEffect(() => {
    if (checkbookSubmitState) {
      const timer = setTimeout(() => {
        setCheckbookSubmitState(null)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [checkbookSubmitState])

  useEffect(() => {
    if (creditSubmitState) {
      const timer = setTimeout(() => {
        setCreditSubmitState(null)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [creditSubmitState])

  useEffect(() => {
    // The original submitAction is for a different, non-credit/checkbook flow.
    // If it needs auto-dismissal, this logic can be adapted.
    // For now, assuming it's less critical or handled elsewhere.
    // If it does need dismissal, it might look like:
    // if (submitState) {
    //   const timer = setTimeout(() => {
    //     // This would require a way to reset submitState, perhaps via another state setter
    //     // For example, if you had: const [genericSubmitState, setGenericSubmitState] = useState(null);
    //     // And then used setGenericSubmitState(null);
    //   }, 4000);
    //   return () => clearTimeout(timer);
    // }
  }, [submitState]) // Dependency on submitState

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

      const checkbookResult: any = await getCheckbookRequest()
      console.log("[v0] Résultat API chéquier:", checkbookResult)

      const creditResult: any = await getCreditRequest()
      console.log("[v0] Résultat API crédit:", creditResult)

      let allTransformedRequests: any[] = []

      if (checkbookResult?.rows && Array.isArray(checkbookResult.rows)) {
        const checkbookData = checkbookResult.rows
        console.log("[v0] Données chéquier à traiter:", checkbookData)

        const secureMode = (process.env.NEXT_PUBLIC_PORTAL_SECURE_MODE || "false").toLowerCase() === "true"
        const keyB64 = process.env.NEXT_PUBLIC_PORTAL_KEY_B64 || ""
        const key = secureMode && keyB64 ? await importAesGcmKeyFromBase64(keyB64) : null

        const checkbookRequests = await Promise.all(
          checkbookData.map(async (item: any, index: number) => {
            let account = item.intitulecompte || "Compte non spécifié"
            let numcompteId = item.numcompteId || ""
            let commentaire = item.commentaire || ""

            try {
              if (secureMode && key && isEncryptedJson(item.intitulecompte_json)) {
                account = await decryptAesGcmFromJson(item.intitulecompte_json, key)
              }
              if (secureMode && key && isEncryptedJson(item.numcompteId_json)) {
                numcompteId = await decryptAesGcmFromJson(item.numcompteId_json, key)
              }
              if (secureMode && key && isEncryptedJson(item.commentaire_json)) {
                commentaire = await decryptAesGcmFromJson(item.commentaire_json, key)
              }
            } catch (_) {}

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
              submittedAt: item.dateorder || item.createdAt?.split("T")[0] || new Date().toISOString().split("T")[0],
              expectedResponse: item.dateorder
                ? new Date(new Date(item.dateorder).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
                : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              account,
              reference: item.reference || `CHQ-${new Date().getFullYear()}-${String(index + 1).padStart(3, "0")}`,
              details: {
                nbrechequier: item.nbrechequier || 0,
                nbrefeuille: item.nbrefeuille || 0,
                commentaire,
                numcompteId,
                typeCheque: item.typeCheque,
                talonCheque: item.talonCheque,
              },
            }
          }),
        )
        allTransformedRequests = [...allTransformedRequests, ...checkbookRequests]
        console.log("[v0] Demandes de chéquier transformées:", checkbookRequests)
      } else {
        console.log("[v0] Aucune donnée de chéquier trouvée ou structure incorrecte")
      }

      if (creditResult?.rows && Array.isArray(creditResult.rows)) {
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
          reference: item.reference || `CRD-${new Date().getFullYear()}-${String(index + 1).padStart(3, "0")}`,
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

    const commonFields = [
      { label: "Référence", value: details.reference || "Non attribuée" },
      { label: "Numéro de compte", value: details.accountNumber || details.numcompteId || "Non spécifié" },
    ]

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
        { label: "Type de chèque", value: details.typeCheque || "Non spécifié" },
        { label: "Avec talon de chèque", value: details.talonCheque ? "Oui" : "Non" },
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
      let result: any
      if (type === "checkbook") {
        result = await getCheckbookRequest()
      } else if (type === "credit") {
        result = await getCreditRequest()
      } else {
        // Pour les autres types, on charge toutes les demandes
        await loadAllRequests()
        return
      }

      if (result?.rows && Array.isArray(result.rows)) {
        const transformedRequests = result.rows.map((item: any, index: number) => {
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
              account: item.intitulecompte || "Compte non spécifié",
              reference: item.reference || `CHQ-${new Date().getFullYear()}-${String(index + 1).padStart(3, "0")}`,
              details: {
                nbrechequier: item.nbrechequier || 0,
                nbrefeuille: item.nbrefeuille || 0,
                commentaire: item.commentaire || "",
              },
            }
          } else {
            // type === "credit"
            return {
              id: item.id || `CRD${String(index + 1).padStart(3, "0")}`,
              type: "credit",
              typeName: "Crédit",
              status: "En cours",
              submittedAt: item.createdAt ? item.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
              expectedResponse: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              account: "Compte courant",
              reference: item.reference || `CRD-${new Date().getFullYear()}-${String(index + 1).padStart(3, "0")}`,
              details: {
                applicantName: item.applicantName || "",
                creditAmount: item.creditAmount || "",
                durationMonths: item.durationMonths || "",
                purpose: item.purpose || "",
              },
            }
          }
        })
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
      window.scrollTo({ top: 0, behavior: "smooth" })
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
      window.scrollTo({ top: 0, behavior: "smooth" })
      // Réinitialiser le formulaire après succès
      setFormData({})
      // Recharger les demandes
      if (activeTab === "history") {
        loadAllRequests()
      }
    } catch (error: any) {
      console.log("[v0] Erreur lors de la soumission:", error.message)
      setCreditSubmitState({ error: error.message || "Une erreur s'est produite lors de la soumission" })
      window.scrollTo({ top: 0, behavior: "smooth" })
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
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    setIsCheckbookSubmitting(true)
    setCheckbookSubmitState(null)

    try {
      const secureMode = (process.env.NEXT_PUBLIC_PORTAL_SECURE_MODE || "false").toLowerCase() === "true"

      const basePayload = {
        dateorder: formData.dateorder || new Date().toISOString().split("T")[0],
        nbrefeuille: Number.parseInt(formData.nbrefeuille) || 0,
        nbrechequier: Number.parseInt(formData.nbrechequier) || 0,
        intitulecompte: formData.intitulecompte,
        numcompteId: formData.numcompte,
        commentaire: formData.commentaire || "",
        typeCheque: formData.typeCheque || "Standard",
        talonCheque: formData.talonCheque === true,
      }

      let result: any
      if (secureMode) {
        const keyB64 = process.env.NEXT_PUBLIC_PORTAL_KEY_B64 || ""
        const keyId = process.env.NEXT_PUBLIC_PORTAL_KEY_ID || "k1-mobile-v1"
        const reference = `CHQ-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`
        const secureData = await buildCommandeSecurePayload(
          { ...basePayload, referenceCommande: reference },
          keyB64,
          keyId,
        )
        result = await submitCheckbookRequestSecure(secureData)
      } else {
        const nonSecure = { ...basePayload, stepflow: 0 }
        result = await submitCheckbookRequest(nonSecure as any)
      }
      setCheckbookSubmitState({
        success: true,
        reference: result.reference || "CHQ-" + new Date().getFullYear() + "-" + String(Date.now()).slice(-3),
      })
      window.scrollTo({ top: 0, behavior: "smooth" })
      // Réinitialiser le formulaire après succès
      setFormData({})
      // Recharger les demandes
      if (activeTab === "history") {
        loadAllRequests()
      }
    } catch (error: any) {
      setCheckbookSubmitState({ error: error.message || "Une erreur s'est produite lors de la soumission" })
      window.scrollTo({ top: 0, behavior: "smooth" })
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
    if (!formData.demande_type || !formData.objet_demande || !formData.terms) {
      setEDemandeSubmitState({ error: "Veuillez remplir tous les champs obligatoires" })
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    setIsEDemandeSubmitting(true)
    setEDemandeSubmitState(null)

    try {
      const eDemandeData = {
        demande_type: formData.demande_type,
        objet_demande: formData.objet_demande,
        terms: formData.terms,
        // Add other necessary fields here
      }

      console.log("[v0] Données envoyées à l'API:", eDemandeData)
      const result = await submitCreditRequest(eDemandeData)
      setEDemandeSubmitState({
        success: true,
        reference: result.reference || "EDM-" + new Date().getFullYear() + "-" + String(Date.now()).slice(-3),
      })
      window.scrollTo({ top: 0, behavior: "smooth" })
      // Réinitialiser le formulaire après succès
      setFormData({})
      // Recharger les demandes
      if (activeTab === "history") {
        loadAllRequests()
      }
    } catch (error: any) {
      setEDemandeSubmitState({ error: error.message || "Une erreur s'est produite lors de la soumission" })
      window.scrollTo({ top: 0, behavior: "smooth" })
    } finally {
      setIsEDemandeSubmitting(false)
    }
  }
}
