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
import { BookOpen, Clock, CheckCircle, AlertCircle, Send, Search, Loader2 } from "lucide-react"
import { submitCheckbookRequest, getCheckbookRequest, getCommandeById } from "../requests/actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getAccounts } from "../../accounts/actions"

export default function CheckbookRequestPage() {
  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [formData, setFormData] = useState<Record<string, any>>({
    talonCheque: false,
  })
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

  const loadCheckbookRequests = async () => {
    setIsLoadingCheckbookRequests(true)
    try {
      const result = await getCheckbookRequest()
      if (result && "rows" in result && result.rows && Array.isArray(result.rows)) {
        const transformedRequests = result.rows.map((item: any, index: number) => ({
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
        setCheckbookRequests(transformedRequests)
      } else {
        setCheckbookRequests([])
      }
    } catch (error) {
      console.error("Erreur lors du chargement des demandes:", error)
      setCheckbookRequests([])
    } finally {
      setIsLoadingCheckbookRequests(false)
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

  const handleCheckbookSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsCheckbookSubmitting(true)
    setCheckbookSubmitState(null)

    const formDataObj = new FormData(e.currentTarget)

    try {
      const result = await submitCheckbookRequest(null, formDataObj)

      if (result?.success) {
        setCheckbookSubmitState({
          success: true,
          reference: result.reference,
        })
        e.currentTarget.reset()
        setSelectedAccount("")
        setFormData({ talonCheque: false })
        loadCheckbookRequests()
      } else {
        setCheckbookSubmitState({
          success: false,
          error: result?.error || "Une erreur s'est produite lors de la soumission",
        })
      }
    } catch (error) {
      setCheckbookSubmitState({
        success: false,
        error: "Erreur lors de l'envoi de la demande",
      })
    } finally {
      setIsCheckbookSubmitting(false)
    }
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

  const filteredRequests = checkbookRequests.filter((request) => {
    const matchesSearch =
      request.typeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.account.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Approuvée":
      case "Disponible":
      case "Retiré":
        return "default"
      case "En cours":
      case "En cours de traitement":
        return "secondary"
      case "En attente":
      case "En attente de documents":
        return "outline"
      case "Disponible à l'agence":
        return "default"
      default:
        return "outline"
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 rounded-lg">
          <BookOpen className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Demande de Chéquier</h1>
          <p className="text-muted-foreground">Commander un nouveau carnet de chèques</p>
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
            <CardDescription>Remplissez le formulaire pour commander un chéquier</CardDescription>
          </CardHeader>
          <CardContent>
            {checkbookSubmitState?.success && (
              <Alert className="mb-4 bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Demande soumise avec succès ! Référence : <strong>{checkbookSubmitState.reference}</strong>
                </AlertDescription>
              </Alert>
            )}

            {checkbookSubmitState?.error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{checkbookSubmitState.error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleCheckbookSubmit} className="space-y-4">
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
                <Label htmlFor="nbrechequier">Nombre de chéquiers *</Label>
                <Input id="nbrechequier" name="nbrechequier" type="number" min="1" defaultValue="1" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nbrefeuille">Nombre de feuilles par chéquier *</Label>
                <Select name="nbrefeuille" defaultValue="25" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le nombre de feuilles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 feuilles</SelectItem>
                    <SelectItem value="25">25 feuilles</SelectItem>
                    <SelectItem value="50">50 feuilles</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="typeCheque">Type de chèque *</Label>
                <Select name="typeCheque" defaultValue="standard-barre" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le type de chèque" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard-barre">Chéquier standard (barré)</SelectItem>
                    <SelectItem value="standard-non-barre">Chéquier standard (non barré)</SelectItem>
                    <SelectItem value="certifie">Chèque certifié (chèque standard certifié)</SelectItem>
                    <SelectItem value="banque">Chèque de banque (format différent)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="talonCheque"
                  name="talonCheque"
                  checked={formData.talonCheque || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, talonCheque: checked })}
                />
                <Label htmlFor="talonCheque" className="cursor-pointer">
                  Avec talon de chèque
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="commentaire">Commentaire</Label>
                <Textarea id="commentaire" name="commentaire" placeholder="Informations supplémentaires..." rows={3} />
              </div>

              <Button type="submit" className="w-full" disabled={isCheckbookSubmitting || accounts.length === 0}>
                {isCheckbookSubmitting ? (
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
              Mes Demandes de Chéquier
            </CardTitle>
            <CardDescription>Historique de vos demandes de chéquier</CardDescription>
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

            {isLoadingCheckbookRequests ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p>Chargement des demandes...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune demande de chéquier trouvée</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredRequests.map((request) => (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <BookOpen className="w-4 h-4 text-blue-600" />
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
