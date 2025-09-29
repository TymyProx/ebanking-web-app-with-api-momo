"use client"
import { useEffect, useState } from "react"
import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { BookOpen, CreditCard, AlertCircle, Download, Eye, MoreVertical, CheckCircle2 } from "lucide-react"
import {
  submitCreditRequest,
  submitCheckbookRequest,
  getCheckbookRequest,
  getCreditRequest,
  getCommandeById,
} from "./actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getAccounts } from "../../accounts/actions"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import jsPDF from "jspdf"

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
  const [formData, setFormData] = useState<Record<string, any>>({
    terms: false,
  })
  const [activeTab, setActiveTab] = useState("new")

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

  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [allRequests, setAllRequests] = useState<any[]>([])
  const [isLoadingAllRequests, setIsLoadingAllRequests] = useState(false)

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedRequestDetails, setSelectedRequestDetails] = useState<any>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)

  const loadAllRequests = async () => {
    setIsLoadingAllRequests(true)
    try {
      const checkbookResult = await getCheckbookRequest()
      const creditResult = await getCreditRequest()

      let allTransformedRequests: Request[] = []

      if (checkbookResult && checkbookResult.rows && Array.isArray(checkbookResult.rows)) {
        const checkbookData = checkbookResult.rows
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
    setFormData({ terms: false })
    setCreditSubmitState(null)
    setCheckbookSubmitState(null)
  }

  const handleFormChange = (key: string, value: any) => {
    setFormData((prevData) => ({ ...prevData, [key]: value }))
  }

  const handleCreditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreditSubmitting(true)
    setCreditSubmitState(null)

    try {
      const response = await submitCreditRequest({
        applicant_name: formData.applicant_name,
        loan_amount: formData.loan_amount,
        loan_duration: formData.loan_duration,
        loan_purpose: formData.loan_purpose,
        numcompte: formData.numcompte,
        typedemande: formData.typedemande || "credit",
        accountNumber: formData.numcompte,
      })

      const reference = `REF-${Date.now()}`
      setCreditSubmitState({ success: true, reference })
      setFormData({ terms: false })
    } catch (error: any) {
      setCreditSubmitState({ error: error.message || "Erreur lors de la soumission de la demande de crédit" })
    } finally {
      setIsCreditSubmitting(false)
    }
  }

  const handleCheckbookSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCheckbookSubmitting(true)
    setCheckbookSubmitState(null)

    try {
      const selectedAccount = accounts.find((acc) => acc.id === formData.account_id)

      const response = await submitCheckbookRequest({
        dateorder: new Date().toISOString().split("T")[0],
        nbrefeuille: Number.parseInt(formData.nbrefeuille) || 25,
        nbrechequier: Number.parseInt(formData.nbrechequier) || 1,
        stepflow: 1,
        intitulecompte: selectedAccount?.name || "",
        numcompteId: formData.account_id,
        commentaire: formData.commentaire || "",
      })

      const reference = `REF-${Date.now()}`
      setCheckbookSubmitState({ success: true, reference })
      setFormData({ terms: false })
    } catch (error: any) {
      setCheckbookSubmitState({ error: error.message || "Erreur lors de la soumission de la demande de chéquier" })
    } finally {
      setIsCheckbookSubmitting(false)
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
    }
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Demandes de Services</h1>
        <p className="text-muted-foreground">Gérez vos demandes de chéquier et de crédit</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="new">Nouvelle Demande</TabsTrigger>
          <TabsTrigger value="history">Mes demandes</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-6">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Type de demande</CardTitle>
                <CardDescription>Sélectionnez le type de service que vous souhaitez demander</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedService} onValueChange={handleServiceChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un type de demande" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checkbook">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span>Demande de chéquier</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="credit">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Demande de crédit</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedService === "checkbook" && (
              <Card>
                <CardHeader>
                  <CardTitle>Demande de chéquier</CardTitle>
                  <CardDescription>Remplissez le formulaire pour commander un nouveau chéquier</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCheckbookSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="account_id">Compte</Label>
                      <Select
                        value={formData.account_id || ""}
                        onValueChange={(value) => handleFormChange("account_id", value)}
                      >
                        <SelectTrigger id="account_id">
                          <SelectValue placeholder="Sélectionnez un compte" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name} - {account.number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nbrechequier">Nombre de chéquiers</Label>
                      <Select
                        value={formData.nbrechequier || ""}
                        onValueChange={(value) => handleFormChange("nbrechequier", value)}
                      >
                        <SelectTrigger id="nbrechequier">
                          <SelectValue placeholder="Sélectionnez le nombre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 chéquier</SelectItem>
                          <SelectItem value="2">2 chéquiers</SelectItem>
                          <SelectItem value="3">3 chéquiers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nbrefeuille">Nombre de feuilles par chéquier</Label>
                      <Select
                        value={formData.nbrefeuille || ""}
                        onValueChange={(value) => handleFormChange("nbrefeuille", value)}
                      >
                        <SelectTrigger id="nbrefeuille">
                          <SelectValue placeholder="Sélectionnez le nombre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25 feuilles</SelectItem>
                          <SelectItem value="50">50 feuilles</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="commentaire">Commentaire (optionnel)</Label>
                      <Textarea
                        id="commentaire"
                        placeholder="Ajoutez un commentaire..."
                        value={formData.commentaire || ""}
                        onChange={(e) => handleFormChange("commentaire", e.target.value)}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="terms_checkbook"
                        checked={formData.terms || false}
                        onCheckedChange={(checked) => handleFormChange("terms", checked)}
                      />
                      <Label htmlFor="terms_checkbook" className="text-sm">
                        J'accepte les conditions générales
                      </Label>
                    </div>

                    {checkbookSubmitState?.success && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          Votre demande de chéquier a été envoyée avec succès. Référence:{" "}
                          {checkbookSubmitState.reference}
                        </AlertDescription>
                      </Alert>
                    )}

                    {checkbookSubmitState?.error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{checkbookSubmitState.error}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isCheckbookSubmitting || !formData.account_id || !formData.terms}
                    >
                      {isCheckbookSubmitting ? "Envoi en cours..." : "Envoyer la demande"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {selectedService === "credit" && (
              <Card>
                <CardHeader>
                  <CardTitle>Demande de crédit</CardTitle>
                  <CardDescription>Remplissez le formulaire pour faire une demande de crédit</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreditSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="numcompte">Numéro de compte</Label>
                      <Select
                        value={formData.numcompte || ""}
                        onValueChange={(value) => handleFormChange("numcompte", value)}
                      >
                        <SelectTrigger id="numcompte">
                          <SelectValue placeholder="Sélectionnez un compte" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.number}>
                              {account.name} - {account.number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="applicant_name">Nom du demandeur</Label>
                      <Input
                        id="applicant_name"
                        placeholder="Votre nom complet"
                        value={formData.applicant_name || ""}
                        onChange={(e) => handleFormChange("applicant_name", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="loan_amount">Montant du crédit (GNF)</Label>
                      <Input
                        id="loan_amount"
                        type="number"
                        placeholder="Ex: 50000000"
                        value={formData.loan_amount || ""}
                        onChange={(e) => handleFormChange("loan_amount", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="loan_duration">Durée (mois)</Label>
                      <Input
                        id="loan_duration"
                        type="number"
                        placeholder="Ex: 24"
                        value={formData.loan_duration || ""}
                        onChange={(e) => handleFormChange("loan_duration", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="loan_purpose">Objet du crédit</Label>
                      <Textarea
                        id="loan_purpose"
                        placeholder="Décrivez l'objet de votre demande de crédit..."
                        value={formData.loan_purpose || ""}
                        onChange={(e) => handleFormChange("loan_purpose", e.target.value)}
                        required
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="terms_credit"
                        checked={formData.terms || false}
                        onCheckedChange={(checked) => handleFormChange("terms", checked)}
                      />
                      <Label htmlFor="terms_credit" className="text-sm">
                        J'accepte les conditions générales
                      </Label>
                    </div>

                    {creditSubmitState?.success && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          Votre demande de crédit a été envoyée avec succès. Référence: {creditSubmitState.reference}
                        </AlertDescription>
                      </Alert>
                    )}

                    {creditSubmitState?.error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{creditSubmitState.error}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isCreditSubmitting || !formData.numcompte || !formData.terms}
                    >
                      {isCreditSubmitting ? "Envoi en cours..." : "Envoyer la demande"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Filtrer les demandes</CardTitle>
                <CardDescription>Recherchez et filtrez vos demandes</CardDescription>
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
                <CardTitle>Liste des demandes</CardTitle>
                <CardDescription>Historique de vos demandes de services</CardDescription>
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
            <DialogTitle>Détails de la demande</DialogTitle>
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
