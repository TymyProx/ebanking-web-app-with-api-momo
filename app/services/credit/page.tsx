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
import { CreditCard, Clock, CheckCircle, AlertCircle, Send, Search, Loader2 } from "lucide-react"
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

  const loadCreditRequests = async () => {
    setIsLoadingCreditRequests(true)
    try {
      const result = await getCreditRequest()
      if (result && "rows" in result && result.rows && Array.isArray(result.rows)) {
        const transformedRequests = result.rows.map((item: any, index: number) => ({
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
        setCreditRequests(transformedRequests)
      } else {
        setCreditRequests([])
      }
    } catch (error) {
      console.error("Erreur lors du chargement des demandes:", error)
      setCreditRequests([])
    } finally {
      setIsLoadingCreditRequests(false)
    }
  }

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

  const handleCreditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsCreditSubmitting(true)
    setCreditSubmitState(null)

    const formDataObj = new FormData(e.currentTarget)

    try {
      const result = await submitCreditRequest(null, formDataObj)

      if (result?.success) {
        setCreditSubmitState({
          success: true,
          reference: result.reference,
          referenceDemande: result.referenceDemande,
        })
        e.currentTarget.reset()
        setSelectedAccount("")
        setFormData({})
        loadCreditRequests()
      } else {
        setCreditSubmitState({
          success: false,
          error: result?.error || "Une erreur s'est produite lors de la soumission",
        })
      }
    } catch (error) {
      setCreditSubmitState({
        success: false,
        error: "Erreur lors de l'envoi de la demande",
      })
    } finally {
      setIsCreditSubmitting(false)
    }
  }

  const formatRequestDetails = (details: any) => {
    if (!details) return []

    return [
      { label: "Référence", value: details.referenceDemande || "Non attribuée" },
      { label: "Numéro de compte", value: details.numcompte || "Non spécifié" },
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

  const filteredRequests = creditRequests.filter((request) => {
    const matchesSearch =
      request.typeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.account.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Approuvée":
        return "default"
      case "En cours":
        return "secondary"
      case "En attente":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-100 rounded-lg">
          <CreditCard className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Demande de Crédit</h1>
          <p className="text-muted-foreground">Demande de crédit (personnel, immobilier, etc.)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulaire de demande */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Nouvelle Demande
            </CardTitle>
            <CardDescription>Remplissez le formulaire pour soumettre une demande de crédit</CardDescription>
          </CardHeader>
          <CardContent>
            {creditSubmitState?.success && (
              <Alert className="mb-4 bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Demande soumise avec succès ! Référence : <strong>{creditSubmitState.referenceDemande}</strong>
                </AlertDescription>
              </Alert>
            )}

            {creditSubmitState?.error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{creditSubmitState.error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleCreditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account">Compte *</Label>
                {isLoadingAccounts ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Chargement des comptes...
                  </div>
                ) : accounts.length > 0 ? (
                  <Select name="numcompte" value={selectedAccount} onValueChange={setSelectedAccount} required>
                    <SelectTrigger>
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
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Aucun compte courant actif disponible. Veuillez contacter votre agence.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="applicantName">Nom du demandeur *</Label>
                <Input id="applicantName" name="applicantName" type="text" placeholder="Nom complet" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="creditType">Type de crédit *</Label>
                <Select name="typedemande" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le type de crédit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Personnel">Crédit Personnel</SelectItem>
                    <SelectItem value="Immobilier">Crédit Immobilier</SelectItem>
                    <SelectItem value="Auto">Crédit Auto</SelectItem>
                    <SelectItem value="Consommation">Crédit à la Consommation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="creditAmount">Montant demandé (GNF) *</Label>
                <Input
                  id="creditAmount"
                  name="creditAmount"
                  type="number"
                  min="1"
                  placeholder="Ex: 50000000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="durationMonths">Durée (mois) *</Label>
                <Input id="durationMonths" name="durationMonths" type="number" min="1" placeholder="Ex: 24" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Objet du crédit *</Label>
                <Textarea
                  id="purpose"
                  name="purpose"
                  placeholder="Décrivez l'objet de votre demande de crédit..."
                  rows={3}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isCreditSubmitting || accounts.length === 0}>
                {isCreditSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
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

        {/* Liste des demandes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Mes Demandes de Crédit
            </CardTitle>
            <CardDescription>Historique de vos demandes de crédit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Rechercher par référence, compte..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isLoadingCreditRequests ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p>Chargement des demandes...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune demande de crédit trouvée</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredRequests.map((request) => (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 bg-purple-50 rounded-lg">
                            <CreditCard className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{request.typeName}</p>
                            <p className="text-xs text-muted-foreground truncate">Compte: {request.account}</p>
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(request.status)} className="text-xs whitespace-nowrap">
                          {request.status}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-xs text-muted-foreground mb-3">
                        <p>
                          Référence: <span className="font-medium text-foreground">{request.reference}</span>
                        </p>
                        <p>
                          Soumis le: <span className="font-medium text-foreground">{request.submittedAt}</span>
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-transparent"
                        onClick={() => handleViewDetails(request)}
                      >
                        Voir les détails
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de détails */}
      <Dialog open={isDetailsModalOpen} onOpenChange={closeDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la demande</DialogTitle>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">Chargement des détails...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {formatRequestDetails(selectedRequestDetails).map((field, index) => (
                  <div key={index} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{field.label}</Label>
                    <p className="text-sm font-medium">{field.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
