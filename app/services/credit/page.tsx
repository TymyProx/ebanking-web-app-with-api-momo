"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Clock, CheckCircle, AlertCircle, Send, Search } from "lucide-react"
import { submitCreditRequest, getCreditRequest, getDemandeCreditById } from "../requests/actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getAccounts } from "../../accounts/actions"

export default function CreditRequestPage() {
  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [creditSubmitState, setCreditSubmitState] = useState<{
    success?: boolean
    error?: string
    reference?: string
    referenceDemande?: string
  } | null>(null)
  const [isCreditSubmitting, setIsCreditSubmitting] = useState(false)
  const [creditRequests, setCreditRequests] = useState<any[]>([])
  const [isLoadingCreditRequests, setIsLoadingCreditRequests] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedRequestDetails, setSelectedRequestDetails] = useState<any>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)

  useEffect(() => {
    loadAccounts()
    loadCreditRequests()
  }, [])

  useEffect(() => {
    if (creditSubmitState?.success || creditSubmitState?.error) {
      const timer = setTimeout(() => {
        setCreditSubmitState(null)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [creditSubmitState])

  const loadAccounts = async () => {
    try {
      setIsLoadingAccounts(true)
      const result = await getAccounts()

      if (Array.isArray(result) && result.length > 0) {
        const adaptedAccounts = result.map((apiAccount: any) => ({
          id: apiAccount.id || apiAccount.accountId,
          name: apiAccount.accountName || apiAccount.name || `Compte ${apiAccount.accountNumber || apiAccount.number}`,
          number: apiAccount.accountNumber || apiAccount.number,
          balance: apiAccount.bookBalance || apiAccount.balance || 0,
          currency: apiAccount.currency || "GNF",
          status: apiAccount.status,
          type: apiAccount.accountType || apiAccount.type,
        }))

        const currentAccounts = adaptedAccounts.filter(
          (account: any) =>
            (account.status === "ACTIF" || account.status === "Actif") &&
            (account.type === "Courant" || account.type === "Courant") &&
            account.number &&
            String(account.number).trim() !== "",
        )
        setAccounts(currentAccounts)
      } else {
        setAccounts([])
      }
    } catch (error) {
      console.error("Erreur lors du chargement des comptes:", error)
      setAccounts([])
    } finally {
      setIsLoadingAccounts(false)
    }
  }

  const loadCreditRequests = async () => {
    setIsLoadingCreditRequests(true)
    try {
      const result = await getCreditRequest()
      const creditData = (result as any)?.rows || []

      const creditRequests = creditData.map((item: any, index: number) => ({
        id: item.id || `CRD${String(index + 1).padStart(3, "0")}`,
        type: "credit",
        typeName: "Demande de crédit",
        status: item.status || "En attente",
        submittedAt: item.createdAt ? item.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
        expectedResponse: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        account: item.numcompte || item.accountNumber || "Compte non spécifié",
        reference: item.referenceDemande || "Référence non disponible",
        details: {
          applicantName: item.applicantName || "",
          creditAmount: item.creditAmount || "",
          durationMonths: item.durationMonths || "",
          purpose: item.purpose || "",
        },
      }))

      creditRequests.sort((a, b) => {
        const dateA = new Date(a.submittedAt).getTime()
        const dateB = new Date(b.submittedAt).getTime()
        return dateB - dateA
      })

      setCreditRequests(creditRequests)
    } catch (error) {
      console.error("Erreur lors du chargement des demandes de crédit:", error)
      setCreditRequests([])
    } finally {
      setIsLoadingCreditRequests(false)
    }
  }

  const handleSubmitCredit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreditSubmitting(true)

    try {
      const result = await submitCreditRequest({
        applicant_name: formData.applicant_name || "",
        loan_amount: formData.loan_amount || "",
        loan_duration: formData.loan_duration || "",
        loan_purpose: formData.loan_purpose || "",
        numcompte: selectedAccount,
        typedemande: formData.typedemande || "",
        accountNumber: selectedAccount,
      })

      setCreditSubmitState({
        success: true,
        referenceDemande: result.referenceDemande,
      })

      setFormData({})
      setSelectedAccount("")
      loadCreditRequests()
    } catch (error: any) {
      setCreditSubmitState({
        success: false,
        error: error.message || "Erreur lors de la soumission",
      })
    } finally {
      setIsCreditSubmitting(false)
    }
  }

  const handleViewDetails = async (request: any) => {
    setIsLoadingDetails(true)
    setIsDetailsModalOpen(true)

    try {
      const TENANT_ID = "aa1287f6-06af-45b7-a905-8c57363565c2"
      const details = await getDemandeCreditById(TENANT_ID, request.id)
      if (details && !details.applicantName) {
        setSelectedRequestDetails({
          ...details,
          ...request.details,
          reference: request.reference,
          numcompte: request.account,
        })
      } else {
        setSelectedRequestDetails(details)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error)
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

  const formatRequestDetails = (details: any) => {
    if (!details) return []

    return [
      { label: "Référence", value: details.referenceDemande || "Non attribuée" },
      { label: "Numéro de compte", value: details.numcompte || details.numcompteId || "Non spécifié" },
      { label: "Intitulé du compte", value: details.intitulecompte || "Non spécifié" },
      { label: "Nom du demandeur", value: details.applicant_name || details.applicantName || "Non spécifié" },
      { label: "Type de crédit", value: details.credit_type || details.typedemande || "Non spécifié" },
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
    ]
  }

  const filteredRequests = creditRequests.filter((request) => {
    const matchesSearch =
      request.typeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.account.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      "En attente": { variant: "outline", icon: Clock },
      "En cours": { variant: "default", icon: Clock },
      Approuvé: { variant: "secondary", icon: CheckCircle },
      Rejeté: { variant: "destructive", icon: AlertCircle },
    }

    const config = statusConfig[status] || { variant: "outline" as const, icon: Clock }
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1.5 font-medium">
        <Icon className="w-3.5 h-3.5" />
        {status}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Demande de crédit</h1>
        <p className="text-gray-600 mt-2">Effectuez une demande de crédit personnel, immobilier ou autre</p>
      </div>

      <Tabs defaultValue="form" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Nouvelle demande
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Mes demandes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Formulaire de demande de crédit
              </CardTitle>
              <CardDescription>
                Remplissez les informations ci-dessous pour effectuer une demande de crédit
              </CardDescription>
            </CardHeader>
            <CardContent>
              {creditSubmitState?.success && (
                <Alert className="mb-6 border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Votre demande de crédit a été soumise avec succès !<br />
                    Référence: <span className="font-semibold">{creditSubmitState.referenceDemande}</span>
                  </AlertDescription>
                </Alert>
              )}

              {creditSubmitState?.error && (
                <Alert className="mb-6 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{creditSubmitState.error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmitCredit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="account">Compte</Label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un compte" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingAccounts ? (
                        <SelectItem value="loading" disabled>
                          Chargement...
                        </SelectItem>
                      ) : accounts.length === 0 ? (
                        <SelectItem value="no-accounts" disabled>
                          Aucun compte disponible
                        </SelectItem>
                      ) : (
                        accounts.map((account) => (
                          <SelectItem key={account.id} value={account.number}>
                            {account.name} - {account.number}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="applicant_name">Nom du demandeur</Label>
                  <Input
                    id="applicant_name"
                    value={formData.applicant_name || ""}
                    onChange={(e) => setFormData({ ...formData, applicant_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="typedemande">Type de crédit</Label>
                  <Select
                    value={formData.typedemande || ""}
                    onValueChange={(value) => setFormData({ ...formData, typedemande: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Personnel">Crédit personnel</SelectItem>
                      <SelectItem value="Immobilier">Crédit immobilier</SelectItem>
                      <SelectItem value="Automobile">Crédit automobile</SelectItem>
                      <SelectItem value="Consommation">Crédit à la consommation</SelectItem>
                      <SelectItem value="Professionnel">Crédit professionnel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="loan_amount">Montant demandé (GNF)</Label>
                    <Input
                      id="loan_amount"
                      type="number"
                      min="0"
                      value={formData.loan_amount || ""}
                      onChange={(e) => setFormData({ ...formData, loan_amount: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loan_duration">Durée (en mois)</Label>
                    <Input
                      id="loan_duration"
                      type="number"
                      min="1"
                      value={formData.loan_duration || ""}
                      onChange={(e) => setFormData({ ...formData, loan_duration: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loan_purpose">Objet du crédit</Label>
                  <Textarea
                    id="loan_purpose"
                    placeholder="Décrivez l'utilisation prévue du crédit..."
                    value={formData.loan_purpose || ""}
                    onChange={(e) => setFormData({ ...formData, loan_purpose: e.target.value })}
                    rows={4}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isCreditSubmitting}>
                  {isCreditSubmitting ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Soumission en cours...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Soumettre la demande
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Mes demandes de crédit</CardTitle>
              <CardDescription>Consultez l'état de vos demandes de crédit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Rechercher par référence, compte..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {isLoadingCreditRequests ? (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                  <p className="text-gray-600 mt-2">Chargement...</p>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 mx-auto text-gray-300" />
                  <p className="text-gray-600 mt-2">Aucune demande de crédit trouvée</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRequests.map((request) => (
                    <Card key={request.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-purple-600" />
                              <span className="font-semibold text-gray-900">{request.reference}</span>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>Compte: {request.account}</p>
                              <p>Date de soumission: {new Date(request.submittedAt).toLocaleDateString("fr-FR")}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(request.status)}
                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(request)}>
                              Détails
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la demande</DialogTitle>
          </DialogHeader>
          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <Clock className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : selectedRequestDetails ? (
            <div className="space-y-4">
              {formatRequestDetails(selectedRequestDetails).map((field, index) => (
                <div key={index} className="grid grid-cols-2 gap-2 py-2 border-b">
                  <span className="font-medium text-gray-700">{field.label}</span>
                  <span className="text-gray-900">{field.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-4">Aucun détail disponible</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
