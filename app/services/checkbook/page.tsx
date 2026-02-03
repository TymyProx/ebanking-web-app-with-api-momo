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
import { BookOpen, Clock, CheckCircle, AlertCircle, Send, Search } from "lucide-react"
import { submitCheckbookRequest, getCheckbookRequest, getCommandeById } from "../requests/actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getAccounts } from "../../accounts/actions"
import { isAccountActive } from "@/lib/status-utils"

export default function CheckbookRequestPage() {
  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [checkbookSubmitState, setCheckbookSubmitState] = useState<{
    success?: boolean
    error?: string
    reference?: string
  } | null>(null)
  const [isCheckbookSubmitting, setIsCheckbookSubmitting] = useState(false)
  const [checkbookRequests, setCheckbookRequests] = useState<any[]>([])
  const [isLoadingCheckbookRequests, setIsLoadingCheckbookRequests] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedRequestDetails, setSelectedRequestDetails] = useState<any>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)

  useEffect(() => {
    loadAccounts()
    loadCheckbookRequests()
  }, [])

  useEffect(() => {
    if (checkbookSubmitState?.success || checkbookSubmitState?.error) {
      const timer = setTimeout(() => {
        setCheckbookSubmitState(null)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [checkbookSubmitState])

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

        // Filtrer uniquement les comptes courants actifs (avec fonction normalisée)
        const currentAccounts = adaptedAccounts.filter(
          (account: any) => {
            const accountType = String(account.type || "").toUpperCase()
            const isCurrent = accountType === "COURANT" || accountType === "CURRENT" || accountType.includes("CURRENT")
            const hasValidNumber = account.number && String(account.number).trim() !== ""
            
            console.log("[CHECKBOOK] Compte analysé:", {
              name: account.name,
              type: account.type,
              status: account.status,
              isActive: isAccountActive(account.status),
              isCurrent,
              hasValidNumber,
              willBeIncluded: isAccountActive(account.status) && isCurrent && hasValidNumber
            })
            
            return isAccountActive(account.status) && isCurrent && hasValidNumber
          }
        )
        
        console.log("[CHECKBOOK] Comptes filtrés pour chéquier:", currentAccounts.length)
        console.log("[CHECKBOOK] Liste des comptes:", currentAccounts)
        
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

  const loadCheckbookRequests = async () => {
    setIsLoadingCheckbookRequests(true)
    try {
      const result = await getCheckbookRequest()
      const checkbookData = (result as any)?.rows || []

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
                  ? "Disponible à l'agence"
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
      
      checkbookRequests.sort((a, b) => {
        const dateA = new Date(a.submittedAt).getTime()
        const dateB = new Date(b.submittedAt).getTime()
        return dateB - dateA
      })

      setCheckbookRequests(checkbookRequests)
    } catch (error) {
      console.error("Erreur lors du chargement des demandes de chéquier:", error)
      setCheckbookRequests([])
    } finally {
      setIsLoadingCheckbookRequests(false)
    }
  }

  const handleSubmitCheckbook = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCheckbookSubmitting(true)

    try {
      const result = await submitCheckbookRequest({
        dateorder: formData.dateorder || new Date().toISOString().split("T")[0],
        nbrefeuille: Number(formData.nbrefeuille) || 25,
        nbrechequier: Number(formData.nbrechequier) || 1,
        stepflow: 0,
        intitulecompte: formData.intitulecompte || "",
        numcompteId: selectedAccount,
        commentaire: formData.commentaire || "",
        talonCheque: formData.talonCheque === true,
        typeCheque: formData.typeCheque || "Standard",
      })

      setCheckbookSubmitState({
        success: true,
        reference: result.reference,
      })

      setFormData({})
      setSelectedAccount("")
      loadCheckbookRequests()
    } catch (error: any) {
      setCheckbookSubmitState({
        success: false,
        error: error.message || "Erreur lors de la soumission",
      })
    } finally {
      setIsCheckbookSubmitting(false)
    }
  }

  const handleViewDetails = async (request: any) => {
    setIsLoadingDetails(true)
    setIsDetailsModalOpen(true)

    try {
      const TENANT_ID = "aa1287f6-06af-45b7-a905-8c57363565c2"
      const details = await getCommandeById(TENANT_ID, request.id)
      setSelectedRequestDetails(details)
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
      { label: "Référence", value: details.referenceCommande || "Non attribuée" },
      { label: "Numéro de compte", value: details.numcompte || details.numcompteId || "Non spécifié" },
      { label: "Intitulé du compte", value: details.intitulecompte || "Non spécifié" },
      {
        label: "Date de commande",
        value: details.dateorder ? new Date(details.dateorder).toLocaleDateString("fr-FR") : "Non spécifiée",
      },
      { label: "Nombre de feuilles", value: details.nbrefeuille || "Non spécifié" },
      { label: "Nombre de chéquiers", value: details.nbrechequier || "Non spécifié" },
      { label: "Type de chèque", value: details.typeCheque || "Non spécifié" },
      { label: "Avec talon de chèque", value: details.talonCheque ? "Oui" : "Non" },
      { label: "Commentaire", value: details.commentaire || "Aucun commentaire" },
    ]
  }

  const filteredRequests = checkbookRequests.filter((request) => {
    const matchesSearch =
      request.typeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.account.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      "En attente": { variant: "outline", icon: Clock },
      "En cours de traitement": { variant: "default", icon: Clock },
      "Disponible à l'agence": { variant: "secondary", icon: CheckCircle },
      Disponible: { variant: "secondary", icon: CheckCircle },
      Retiré: { variant: "default", icon: CheckCircle },
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
        <h1 className="text-3xl font-bold text-primary">Demande de chéquier</h1>
        <p className="text-gray-600 mt-2">Commandez un nouveau carnet de chèques pour votre compte</p>
      </div>

      <Tabs defaultValue="form" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
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
                <BookOpen className="w-5 h-5" />
                Formulaire de demande de chéquier
              </CardTitle>
              <CardDescription>Remplissez les informations ci-dessous pour commander un chéquier</CardDescription>
            </CardHeader>
            <CardContent>
              {checkbookSubmitState?.success && (
                <Alert className="mb-6 border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Votre demande de chéquier a été soumise avec succès !<br />
                    Référence: <span className="font-semibold">{checkbookSubmitState.reference}</span>
                  </AlertDescription>
                </Alert>
              )}

              {checkbookSubmitState?.error && (
                <Alert className="mb-6 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{checkbookSubmitState.error}</AlertDescription>
                </Alert>
              )}

              {!isLoadingAccounts && accounts.length === 0 && (
                <Alert className="mb-6 border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <strong>Aucun compte courant actif trouvé.</strong>
                    <br />
                    Pour commander un chéquier, vous devez avoir un compte courant actif. Veuillez contacter votre agence ou ouvrir un compte courant.
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmitCheckbook} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="account">Compte</Label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount} required disabled={accounts.length === 0}>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingAccounts ? "Chargement..." : accounts.length === 0 ? "Aucun compte disponible" : "Sélectionnez un compte"} />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingAccounts ? (
                        <SelectItem value="loading" disabled>
                          Chargement...
                        </SelectItem>
                      ) : accounts.length === 0 ? (
                        <SelectItem value="no-accounts" disabled>
                          Aucun compte courant actif disponible
                        </SelectItem>
                      ) : (
                        accounts.map((account) => (
                          <SelectItem key={account.id} value={account.number}>
                            {account.name} - {account.number} ({Math.trunc(account.balance ?? 0).toLocaleString()} {account.currency})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nbrechequier">Nombre de chéquiers</Label>
                    <Input
                      id="nbrechequier"
                      type="number"
                      min="1"
                      value={formData.nbrechequier || ""}
                      onChange={(e) => setFormData({ ...formData, nbrechequier: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nbrefeuille">Nombre de feuilles par chéquier</Label>
                    <Select
                      value={formData.nbrefeuille || ""}
                      onValueChange={(value) => setFormData({ ...formData, nbrefeuille: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25 feuilles</SelectItem>
                        <SelectItem value="50">50 feuilles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="typeCheque">Type de chèque</Label>
                  <Select
                    value={formData.typeCheque || "Standard"}
                    onValueChange={(value) => setFormData({ ...formData, typeCheque: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Standard - Barré">Chéquier standard - Barré</SelectItem>
                      <SelectItem value="Standard - Non barré">Chéquier standard - Non barré</SelectItem>
                      <SelectItem value="Certifié">Chèques certifiés (chèque standard certifié)</SelectItem>
                      <SelectItem value="Banque">Chèques de banque (format différent)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="talonCheque"
                    checked={formData.talonCheque === true}
                    onCheckedChange={(checked) => setFormData({ ...formData, talonCheque: checked === true })}
                  />
                  <Label htmlFor="talonCheque" className="text-sm font-normal cursor-pointer">
                    Avec talon de chèque
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commentaire">Commentaires (optionnel)</Label>
                  <Textarea
                    id="commentaire"
                    placeholder="Ajoutez des informations supplémentaires..."
                    value={formData.commentaire || ""}
                    onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isCheckbookSubmitting}>
                  {isCheckbookSubmitting ? (
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
              <CardTitle>Mes demandes de chéquier</CardTitle>
              <CardDescription>Consultez l'état de vos demandes de chéquier</CardDescription>
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

              {isLoadingCheckbookRequests ? (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                  <p className="text-gray-600 mt-2">Chargement...</p>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 mx-auto text-gray-300" />
                  <p className="text-gray-600 mt-2">Aucune demande de chéquier trouvée</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRequests.map((request) => (
                    <Card
                      key={request.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onDoubleClick={() => handleViewDetails(request)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-blue-600" />
                              <span className="font-semibold text-gray-900">{request.reference}</span>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>Compte: {request.account}</p>
                              <p>Date de soumission: {new Date(request.submittedAt).toLocaleDateString("fr-FR")}</p>
                            </div>
                          </div>
                          <div>
                            {getStatusBadge(request.status)}
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
