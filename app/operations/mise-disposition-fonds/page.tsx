"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HandCoins, Clock, CheckCircle, AlertCircle, Send, Search } from "lucide-react"
import { submitFundsProvisionRequest, getFundsProvisionRequests, getFundsProvisionById } from "./actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getAccounts } from "../../accounts/actions"
import { isAccountActive } from "@/lib/status-utils"
import { handleNumericChange, toNumber } from "@/lib/numeric-input"
import { OtpModal } from "@/components/otp-modal"

export default function FundsProvisionPage() {
  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [submitState, setSubmitState] = useState<{
    success?: boolean
    error?: string
    reference?: string
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requests, setRequests] = useState<any[]>([])
  const [isLoadingRequests, setIsLoadingRequests] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedRequestDetails, setSelectedRequestDetails] = useState<any>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)
  const [balanceError, setBalanceError] = useState<string>("")
  
  // États pour l'OTP
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<Record<string, any> | null>(null)

  useEffect(() => {
    loadAccounts()
    loadRequests()
  }, [])

  useEffect(() => {
    if (submitState?.success || submitState?.error) {
      const timer = setTimeout(() => {
        setSubmitState(null)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [submitState])

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

        // Filtrer uniquement les comptes actifs (avec fonction normalisée)
        const currentAccounts = adaptedAccounts.filter(
          (account: any) =>
            isAccountActive(account.status) &&
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

  const loadRequests = async () => {
    setIsLoadingRequests(true)
    try {
      const result = await getFundsProvisionRequests()
      console.log("[v0] Full API response:", result)
      console.log("[v0] result.rows:", result?.rows)

      if (result?.rows && Array.isArray(result.rows)) {
        const requestsData = result.rows
        console.log("[v0] Requests data found:", requestsData)

        const formattedRequests = requestsData.map((item: any) => ({
          id: item.id,
          reference: item.reference || "Référence non disponible",
          compteAdebiter: item.compteAdebiter || "Compte non spécifié",
          montant: item.montant || 0,
          fullNameBenef: item.fullNameBenef || "Non spécifié",
          numCni: item.numCni || "Non spécifié",
          agence: item.agence || "Non spécifié",
          statut: item.statut || "EN_ATTENTE",
          createdAt: item.createdAt || new Date().toISOString(),
        }))

        formattedRequests.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt).getTime()
          const dateB = new Date(b.createdAt).getTime()
          return dateB - dateA
        })

        setRequests(formattedRequests)
      } else {
        setRequests([])
      }
    } catch (error) {
      console.error("Erreur lors du chargement des demandes:", error)
      setRequests([])
    } finally {
      setIsLoadingRequests(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Vérifier le solde avant de soumettre
    if (selectedAccount && formData.montant) {
      const account = accounts.find((acc) => acc.number === selectedAccount)
      const montantNum = toNumber(formData.montant)
      if (account && montantNum > account.balance) {
        setSubmitState({
          success: false,
          error: `Le montant saisi dépasse le solde disponible (${account.balance.toLocaleString("fr-FR")} ${account.currency || "GNF"})`,
        })
        return
      }
    }
    
    // Sauvegarder les données du formulaire et ouvrir le modal OTP
    setPendingFormData({
      compteAdebiter: selectedAccount,
      montant: toNumber(formData.montant) || 0,
      fullNameBenef: formData.fullNameBenef || "",
      numCni: formData.numCni || "",
      agence: formData.agence || "",
      statut: "EN_ATTENTE",
    })
    setShowOtpModal(true)
  }

  const handleOtpVerified = async (payload: { otpId?: string | null; referenceId?: string }) => {
    if (!pendingFormData) return

    setIsSubmitting(true)
    setSubmitState(null)
    setShowOtpModal(false)

    try {
      const result = await submitFundsProvisionRequest({
        compteAdebiter: pendingFormData.compteAdebiter,
        montant: pendingFormData.montant,
        fullNameBenef: pendingFormData.fullNameBenef,
        numCni: pendingFormData.numCni,
        agence: pendingFormData.agence,
      })

      setSubmitState({
        success: true,
        reference: result.withdrawalCode || result.data?.reference || result.reference || "Demande enregistrée",
      })

      // Réinitialiser le formulaire
      setFormData({})
      setSelectedAccount("")
      setBalanceError("")
      setPendingFormData(null)

      // Recharger la liste des demandes
      await loadRequests()
    } catch (error: any) {
      console.error("Erreur lors de la soumission:", error)
      setSubmitState({
        success: false,
        error: error.message || "Une erreur est survenue lors de la soumission de la demande",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOtpCancel = () => {
    setShowOtpModal(false)
    setPendingFormData(null)
  }

  const handleViewDetails = async (request: any) => {
    setIsLoadingDetails(true)
    setIsDetailsModalOpen(true)

    try {
      const details = await getFundsProvisionById(request.id)
      setSelectedRequestDetails(details?.data || details)
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error)
      setSelectedRequestDetails(request)
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
      { label: "Référence", value: details.reference || "Non attribuée" },
      { label: "Compte à débiter", value: details.compteAdebiter || "Non spécifié" },
      { label: "Montant", value: `${Number(details.montant).toLocaleString("fr-FR")} GNF` },
      { label: "Nom complet du bénéficiaire", value: details.fullNameBenef || "Non spécifié" },
      { label: "Numéro CNI", value: details.numCni || "Non spécifié" },
      { label: "Agence de retrait", value: details.agence || "Non spécifié" },
      { label: "Statut", value: details.statut || "EN_ATTENTE" },
      {
        label: "Date de création",
        value: details.createdAt ? new Date(details.createdAt).toLocaleDateString("fr-FR") : "Non spécifiée",
      },
    ]
  }

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.compteAdebiter.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.fullNameBenef.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      EN_ATTENTE: { variant: "outline", icon: Clock },
      EN_COURS: { variant: "default", icon: Clock },
      DISPONIBLE: { variant: "secondary", icon: CheckCircle },
      RETIRE: { variant: "default", icon: CheckCircle },
      REJETE: { variant: "destructive", icon: AlertCircle },
    }

    const config = statusConfig[status] || { variant: "outline" as const, icon: Clock }
    const Icon = config.icon

    const statusLabels: Record<string, string> = {
      EN_ATTENTE: "En attente",
      EN_COURS: "En cours",
      DISPONIBLE: "Disponible",
      RETIRE: "Retiré",
      REJETE: "Rejeté",
    }

    return (
      <Badge variant={config.variant} className="flex items-center gap-1.5 font-medium">
        <Icon className="w-3.5 h-3.5" />
        {statusLabels[status] || status}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Mise à disposition des fonds</h1>
        <p className="text-gray-600 mt-2">Demandez la mise à disposition de fonds en agence</p>
      </div>

      <Tabs defaultValue="form" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form" className="flex items-center gap-2">
            <HandCoins className="w-4 h-4" />
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
                <HandCoins className="w-5 h-5" />
                Formulaire de demande de mise à disposition
              </CardTitle>
              <CardDescription>Remplissez les informations ci-dessous pour votre demande</CardDescription>
            </CardHeader>
            <CardContent>
              {submitState?.success && (
                <Alert className="mb-6 border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Votre demande a été soumise avec succès !<br />
                    <strong>Code de retrait:</strong> <span className="font-semibold text-lg">{submitState.reference}</span><br />
                    <span className="text-sm mt-2 block">Un email avec le récapitulatif PDF a été envoyé à votre adresse email.</span>
                    <span className="text-sm block">Le bénéficiaire doit se présenter à l'agence avec ce code de retrait et sa CNI.</span>
                  </AlertDescription>
                </Alert>
              )}

              {submitState?.error && (
                <Alert className="mb-6 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{submitState.error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="account">Compte à débiter</Label>
                  <Select 
                    value={selectedAccount} 
                    onValueChange={(value) => {
                      setSelectedAccount(value)
                      // Réinitialiser l'erreur de solde et vérifier à nouveau si un montant est saisi
                      setBalanceError("")
                      if (formData.montant) {
                        const account = accounts.find((acc) => acc.number === value)
                        const montantNum = toNumber(formData.montant)
                        if (account && montantNum > account.balance) {
                          setBalanceError(
                            `Le montant saisi (${montantNum.toLocaleString("fr-FR")} ${account.currency || "GNF"}) dépasse le solde disponible (${account.balance.toLocaleString("fr-FR")} ${account.currency || "GNF"})`
                          )
                        }
                      }
                    }} 
                    required
                  >
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
                  <Label htmlFor="montant">Montant (GNF)</Label>
                  <Input
                    id="montant"
                    type="text"
                    inputMode="numeric"
                    value={formData.montant || ""}
                    onChange={(e) => {
                      const montant = handleNumericChange(e.target.value)
                      setFormData({ ...formData, montant })
                      
                      // Vérifier le solde si un compte est sélectionné
                      if (selectedAccount && montant) {
                        const account = accounts.find((acc) => acc.number === selectedAccount)
                        const montantNum = toNumber(montant)
                        if (account && montantNum > account.balance) {
                          setBalanceError(
                            `Le montant saisi (${montantNum.toLocaleString("fr-FR")} ${account.currency || "GNF"}) dépasse le solde disponible (${account.balance.toLocaleString("fr-FR")} ${account.currency || "GNF"})`
                          )
                        } else {
                          setBalanceError("")
                        }
                      } else {
                        setBalanceError("")
                      }
                    }}
                    placeholder="Montant à mettre à disposition"
                    required
                  />
                  {balanceError && (
                    <p className="text-sm text-red-600 mt-1">{balanceError}</p>
                  )}
                  {selectedAccount && formData.montant && !balanceError && (
                    (() => {
                      const account = accounts.find((acc) => acc.number === selectedAccount)
                      if (account) {
                        const montantNum = toNumber(formData.montant)
                        const soldeRestant = account.balance - montantNum
                        return (
                          <p className="text-sm text-gray-600 mt-1">
                            Solde disponible: {account.balance.toLocaleString("fr-FR")} {account.currency || "GNF"} | 
                            Solde après opération: {soldeRestant.toLocaleString("fr-FR")} {account.currency || "GNF"}
                          </p>
                        )
                      }
                      return null
                    })()
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullNameBenef">Nom complet du bénéficiaire</Label>
                  <Input
                    id="fullNameBenef"
                    value={formData.fullNameBenef || ""}
                    onChange={(e) => setFormData({ ...formData, fullNameBenef: e.target.value })}
                    placeholder="Prénom(s) et nom(s)"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numCni">Numéro CNI du bénéficiaire</Label>
                  <Input
                    id="numCni"
                    type="text"
                    value={formData.numCni || ""}
                    onChange={(e) => {
                      // Accepter uniquement les caractères alphanumériques sans espaces
                      const cleaned = e.target.value.replace(/[^a-zA-Z0-9]/g, "")
                      setFormData({ ...formData, numCni: cleaned })
                    }}
                    placeholder="Numéro de carte nationale d'identité"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agence">Agence de retrait</Label>
                  <Select
                    value={formData.agence || ""}
                    onValueChange={(value) => setFormData({ ...formData, agence: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une agence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Agence Centrale">Agence Centrale</SelectItem>
                      <SelectItem value="Agence Kaloum">Agence Kaloum</SelectItem>
                      <SelectItem value="Agence Matam">Agence Matam</SelectItem>
                      <SelectItem value="Agence Ratoma">Agence Ratoma</SelectItem>
                      <SelectItem value="Agence Dixinn">Agence Dixinn</SelectItem>
                      <SelectItem value="Agence Labé">Agence Labé</SelectItem>
                      <SelectItem value="Agence Kankan">Agence Kankan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
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
              <CardTitle>Mes demandes de mise à disposition</CardTitle>
              <CardDescription>Consultez l'état de vos demandes de mise à disposition de fonds</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Rechercher par référence, compte, bénéficiaire..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {isLoadingRequests ? (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                  <p className="text-gray-600 mt-2">Chargement...</p>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-8">
                  <HandCoins className="w-12 h-12 mx-auto text-gray-300" />
                  <p className="text-gray-600 mt-2">Aucune demande de mise à disposition trouvée</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRequests.map((request) => (
                    <Card 
                      key={request.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onDoubleClick={() => handleViewDetails(request)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <HandCoins className="w-4 h-4 text-blue-600" />
                              <span className="font-semibold text-gray-900">{request.reference}</span>
                            </div>
                            <div className="text-sm text-gray-600 space-y-0.5">
                              <p>Bénéficiaire: {request.fullNameBenef}</p>
                              <p className="font-medium text-gray-900">
                                {Number(request.montant).toLocaleString("fr-FR")} GNF
                              </p>
                            </div>
                          </div>
                          <div>
                            {getStatusBadge(request.statut)}
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

      <Dialog open={isDetailsModalOpen} onOpenChange={closeDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HandCoins className="w-5 h-5" />
              Détails de la demande
            </DialogTitle>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-600 mt-2">Chargement des détails...</p>
            </div>
          ) : selectedRequestDetails ? (
            <div className="space-y-4">
              {formatRequestDetails(selectedRequestDetails).map((item, index) => (
                <div key={index} className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">{item.label}:</span>
                  <span className="font-medium text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-300" />
              <p className="text-gray-600 mt-2">Impossible de charger les détails</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal OTP */}
      <OtpModal
        open={showOtpModal}
        onOpenChange={setShowOtpModal}
        onVerified={handleOtpVerified}
        onCancel={handleOtpCancel}
        purpose="mise_disposition_fonds"
        title="Vérification OTP"
        description="Veuillez entrer le code de vérification que nous vous avons envoyé pour confirmer votre demande de mise à disposition des fonds."
        deliveryMethod="EMAIL"
        autoGenerate={true}
      />
    </div>
  )
}
