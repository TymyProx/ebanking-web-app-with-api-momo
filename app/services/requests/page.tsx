"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, CreditCard, AlertCircle, Download, Eye, MoreVertical } from "lucide-react"
import {
  submitCreditRequest,
  submitCheckbookRequest,
  getCheckbookRequest,
  getCreditRequest,
  getCommandeById,
} from "./actions"
import { useActionState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getAccounts } from "../../accounts/actions"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import jsPDF from "jspdf"

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

interface Request {
  id: string
  type: string
  status: string
  submittedAt: string
  expectedResponse?: string
  account: string
}

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

      const checkbookResult = await getCheckbookRequest()
      console.log("[v0] Résultat API chéquier:", checkbookResult)

      const creditResult = await getCreditRequest()
      console.log("[v0] Résultat API crédit:", creditResult)

      let allTransformedRequests: Request[] = []

      if (checkbookResult && checkbookResult.rows && Array.isArray(checkbookResult.rows)) {
        const checkbookData = checkbookResult.rows
        console.log("[v0] Données chéquier à traiter:", checkbookData)

        const checkbookRequests = checkbookData.map((request: any) => ({
          id: request.id,
          type: "Demande de chéquier",
          status: request.status || "En cours",
          submittedAt: request.dateorder || request.submitted_at,
          expectedResponse: request.expected_response,
          account: request.intitulecompte || request.account_name,
        }))

        allTransformedRequests = [...allTransformedRequests, ...checkbookRequests]
      }

      if (creditResult && creditResult.rows && Array.isArray(creditResult.rows)) {
        const creditData = creditResult.rows
        console.log("[v0] Données crédit à traiter:", creditData)

        const creditRequests = creditData.map((request: any) => ({
          id: request.id,
          type: "Demande de crédit",
          status: request.status || "En cours",
          submittedAt: request.createdAt || request.submitted_at,
          expectedResponse: request.expected_response,
          account: request.accountNumber || request.account_name,
        }))

        allTransformedRequests = [...allTransformedRequests, ...creditRequests]
      }

      setAllRequests(allTransformedRequests)
    } catch (error) {
      console.error("Erreur lors du chargement des demandes:", error)
      setAllRequests([])
    } finally {
      setIsLoadingAllRequests(false)
    }
  }

  useEffect(() => {
    const fetchAccounts = async () => {
      setIsLoadingAccounts(true)
      try {
        const accounts = await getAccounts()
        setAccounts(accounts || [])
      } catch (error) {
        console.error("Erreur lors du chargement des comptes:", error)
        setAccounts([])
      } finally {
        setIsLoadingAccounts(false)
      }
    }

    fetchAccounts()
  }, [])

  useEffect(() => {
    if (activeTab === "history") {
      loadAllRequests()
    }
  }, [activeTab])

  const handleServiceChange = (serviceId: string) => {
    setSelectedService(serviceId)
    setSelectedAccount("")
    setFormData({})
  }

  const handleAccountChange = (accountId: string) => {
    setSelectedAccount(accountId)
  }

  const handleFormChange = (key: string, value: any) => {
    setFormData((prevData) => ({ ...prevData, [key]: value }))
  }

  const handleSubmit = async () => {
    if (selectedService === "checkbook") {
      setIsCheckbookSubmitting(true)
      try {
        const response = await submitCheckbookRequest(formData)
        const reference = `REF-${Date.now()}`
        setCheckbookSubmitState({ success: true, reference })
      } catch (error) {
        setCheckbookSubmitState({ error: "Erreur lors de la soumission de la demande de chéquier" })
      } finally {
        setIsCheckbookSubmitting(false)
      }
    } else if (selectedService === "credit") {
      setIsCreditSubmitting(true)
      try {
        const response = await submitCreditRequest(formData)
        const reference = `REF-${Date.now()}`
        setCreditSubmitState({ success: true, reference })
      } catch (error) {
        setCreditSubmitState({ error: "Erreur lors de la soumission de la demande de crédit" })
      } finally {
        setIsCreditSubmitting(false)
      }
    }
  }

  const handleRequestDetails = async (requestId: string) => {
    setIsLoadingDetails(true)
    setIsDetailsModalOpen(true)
    try {
      const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || ""
      const requestDetails = await getCommandeById(TENANT_ID, requestId)
      setSelectedRequestDetails(requestDetails)
    } catch (error) {
      console.error("Erreur lors du chargement des détails de la demande:", error)
      setSelectedRequestDetails(null)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const generateRequestPDF = (request: any) => {
    const doc = new jsPDF()

    doc.setFontSize(20)
    doc.text("Détails de la Demande", 20, 20)

    doc.setFontSize(12)
    let yPosition = 40

    const addLine = (label: string, value: string) => {
      doc.text(`${label}: ${value}`, 20, yPosition)
      yPosition += 10
    }

    addLine("Type", request.type || "N/A")
    addLine("Référence", request.id || "N/A")
    addLine("Compte", request.account || "N/A")
    addLine("Statut", request.status || "N/A")
    addLine("Date de soumission", request.submittedAt || "N/A")

    if (request.expectedResponse) {
      addLine("Réponse attendue", request.expectedResponse)
    }

    return doc
  }

  const downloadRequestPDF = (request: any) => {
    try {
      const doc = generateRequestPDF(request)
      doc.save(`demande-${request.id}.pdf`)
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error)
      const fallbackContent = `
Détails de la Demande
=====================

Type: ${request.type || "N/A"}
Référence: ${request.id || "N/A"}
Compte: ${request.account || "N/A"}
Statut: ${request.status || "N/A"}
Date de soumission: ${request.submittedAt || "N/A"}
${request.expectedResponse ? `Réponse attendue: ${request.expectedResponse}` : ""}
      `
      const blob = new Blob([fallbackContent], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `demande-${request.id}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false)
    setSelectedRequestDetails(null)
  }

  return (
    <div className="p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="new">Nouvelle Demande</TabsTrigger>
          <TabsTrigger value="history">Mes demandes</TabsTrigger>
        </TabsList>
        <TabsContent value="new">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Sélectionnez un Service</CardTitle>
                  <CardDescription>Choisissez le type de service que vous souhaitez demander.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={selectedService} onValueChange={handleServiceChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un service" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Sélectionnez un Compte</CardTitle>
                  <CardDescription>
                    Choisissez le compte sur lequel vous souhaitez effectuer la demande.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={selectedAccount} onValueChange={handleAccountChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un compte" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>
            {selectedServiceData && (
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedServiceData.name}</CardTitle>
                    <CardDescription>{selectedServiceData.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                      {selectedServiceData.requirements.map((requirement, index) => (
                        <Checkbox key={index} id={`requirement-${index}`} label={requirement} />
                      ))}
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || isCreditSubmitting || isCheckbookSubmitting}
                      >
                        Soumettre
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="history">
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Filtrer les Demandes</CardTitle>
                <CardDescription>Filtrez les demandes par type ou recherchez par mot-clé.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="checkbook">Demande de chéquier</SelectItem>
                      <SelectItem value="credit">Demande de crédit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Liste des Demandes</CardTitle>
                <CardDescription>Historique de vos demandes de services.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAllRequests ? (
                  <div className="text-center py-8">Chargement des demandes...</div>
                ) : allRequests.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Aucune demande trouvée.</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {allRequests
                      .filter(
                        (request) =>
                          filterType === "all" ||
                          (filterType === "checkbook" && request.type === "Demande de chéquier") ||
                          (filterType === "credit" && request.type === "Demande de crédit"),
                      )
                      .filter(
                        (request) =>
                          request.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          request.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          request.account.toLowerCase().includes(searchTerm.toLowerCase()),
                      )
                      .map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-semibold">{request.type}</div>
                            <div className="text-sm text-muted-foreground">Compte: {request.account}</div>
                            <div className="text-sm text-muted-foreground">
                              Soumise le: {new Date(request.submittedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={request.status === "Approuvée" ? "secondary" : "default"}>
                              {request.status}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleRequestDetails(request.id)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Voir détails
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => downloadRequestPDF(request)}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Télécharger
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails de la Demande</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isLoadingDetails ? (
              <div className="text-center py-8">Chargement des détails...</div>
            ) : selectedRequestDetails ? (
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Intitulé du compte:</span> {selectedRequestDetails.intitulecompte}
                </div>
                <div>
                  <span className="font-semibold">Numéro de compte:</span> {selectedRequestDetails.numcompteId}
                </div>
                <div>
                  <span className="font-semibold">Date de commande:</span> {selectedRequestDetails.dateorder}
                </div>
                <div>
                  <span className="font-semibold">Nombre de chéquiers:</span> {selectedRequestDetails.nbrechequier}
                </div>
                <div>
                  <span className="font-semibold">Nombre de feuilles:</span> {selectedRequestDetails.nbrefeuille}
                </div>
                <div>
                  <span className="font-semibold">Commentaire:</span> {selectedRequestDetails.commentaire}
                </div>
                <div className="pt-4">
                  <Button onClick={() => downloadRequestPDF(selectedRequestDetails)} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger le PDF
                  </Button>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Impossible de charger les détails de la demande.</AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
