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
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Clock, CheckCircle, Send, Search, MessageSquare } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createReclamation, getReclamations, getReclamationById, getClientByUserId } from "./actions"
import { getCurrentUser } from "@/app/user/actions"

const complainTypes = {
  Compte: [
    "Erreur de solde ou d'écritures",
    "Frais bancaires non justifiés",
    "Prélèvement non autorisé",
    "Clôture de compte non demandée",
    "Problème d'accès au compte",
    "Blocage de compte injustifié",
  ],
  Carte: [
    "Carte non reçue",
    "Carte bloquée ou avalée",
    "Retrait non abouti mais compte débité",
    "Paiement refusé malgré solde suffisant",
    "Opération frauduleuse / débit inconnu",
  ],
  Chéquier: [
    "Chéquier non reçu",
    "Délai trop long de livraison",
    "Erreur sur le nom du chéquier",
    "Opposition sur chèque non prise en compte",
  ],
  Crédit: [
    "Retard dans le traitement du dossier",
    "Montant du crédit incorrect",
    "Erreur sur l'échéancier",
    "Mauvais calcul des intérêts",
    "Problème de prélèvement des mensualités",
  ],
  Virement: [
    "Virement non exécuté",
    "Montant transféré erroné",
    "Retard de réception du virement",
    "Double débit sur un virement",
    "Mauvaise affectation du bénéficiaire",
  ],
  Technique: [
    "Erreur de connexion ou mot de passe",
    "Compte e-banking bloqué",
    "Problème d'accès à certaines fonctionnalités",
    "Application lente ou bug d'affichage",
  ],
  Agence: [
    "Mauvais accueil en agence",
    "Réclamation restée sans suite",
    "Délai de réponse trop long",
    "Mauvaise information communiquée",
  ],
  Autre: [
    "Problème de taux de change",
    "Erreur d'identification (CNI, documents, etc.)",
    "Réclamation générale non catégorisée",
  ],
}

export default function ReclamationPage() {
  const [activeTab, setActiveTab] = useState("form")
  const [formData, setFormData] = useState<Record<string, any>>({
    complainDate: new Date().toISOString().split("T")[0],
  })
  const [selectedType, setSelectedType] = useState<string>("")
  const [availableObjects, setAvailableObjects] = useState<string[]>([])
  const [submitState, setSubmitState] = useState<{
    success?: boolean
    error?: string
    reference?: string
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // États pour la liste des réclamations
  const [reclamations, setReclamations] = useState<any[]>([])
  const [isLoadingReclamations, setIsLoadingReclamations] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedReclamationDetails, setSelectedReclamationDetails] = useState<any>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  // Charger les informations de l'utilisateur au montage du composant
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        // 1. Récupérer l'utilisateur connecté pour obtenir son ID (userid)
        const user = await getCurrentUser()
        console.log("[Reclamation] Utilisateur chargé:", {
          id: user?.id,
          email: user?.email,
        })
        
        if (!user || !user.id) {
          console.warn("[Reclamation] Aucun utilisateur trouvé ou ID manquant")
          return
        }

        // 2. Récupérer le client depuis la table client en filtrant sur userid
        const clientData = await getClientByUserId(user.id)
        
        if (clientData) {
          // Utiliser l'email du client en priorité, sinon celui de l'utilisateur
          const email = clientData.email || user.email || ""
          
          // Pour le téléphone, essayer d'abord le client, puis l'utilisateur
          const clientPhone = clientData.telephone || clientData.phoneNumber || ""
          const userPhone = user.phoneNumber || user.phone || ""
          const phone = clientPhone || userPhone || ""
          
          console.log("[Reclamation] Données client récupérées:", {
            clientEmail: clientData.email,
            clientPhone: clientPhone,
            userEmail: user.email,
            userPhone: userPhone,
            finalEmail: email,
            finalPhone: phone,
          })
          
          setFormData((prev) => ({
            ...prev,
            email: email,
            phone: phone,
          }))
          
          console.log("[Reclamation] formData mis à jour avec données client (table client):", { email, phone })
        } else {
          console.warn("[Reclamation] Aucun client trouvé avec userid:", user.id, "- Utilisation des données utilisateur")
          // Fallback sur les données de l'utilisateur si le client n'est pas trouvé
          const email = user.email || ""
          const phone = user.phoneNumber || user.phone || ""
          setFormData((prev) => ({
            ...prev,
            email: email,
            phone: phone,
          }))
          console.log("[Reclamation] formData mis à jour avec données utilisateur (fallback):", { email, phone })
        }
      } catch (error) {
        console.error("Erreur lors du chargement des informations utilisateur:", error)
      }
    }

    loadUserInfo()
  }, [])

  useEffect(() => {
    if (submitState?.success || submitState?.error) {
      const timer = setTimeout(() => {
        setSubmitState(null)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [submitState])

  useEffect(() => {
    if (activeTab === "list") {
      loadReclamations()
    }
  }, [activeTab])

  // Gérer le changement de type de réclamation
  const handleTypeChange = (type: string) => {
    setSelectedType(type)
    setAvailableObjects(complainTypes[type as keyof typeof complainTypes] || [])
    setFormData((prev) => ({ ...prev, complainType: type, complainObject: "" }))
  }

  const loadReclamations = async () => {
    setIsLoadingReclamations(true)
    try {
      const response = await getReclamations()

      const mappedReclamations = response.rows.map((reclamation) => ({
        id: reclamation.id,
        claimId: reclamation.claimId,
        type: reclamation.motifRecl.split(" - ")[0] || "Autre",
        typeName: `Réclamation ${reclamation.motifRecl.split(" - ")[0] || "Autre"}`,
        object: reclamation.motifRecl,
        status: reclamation.status,
        submittedAt: reclamation.dateRecl,
        description: reclamation.description,
        phone: reclamation.telephone,
        email: reclamation.email,
        createdAt: reclamation.createdAt,
        updatedAt: reclamation.updatedAt,
      }))

      setReclamations(mappedReclamations)
    } catch (error) {
      console.error("Erreur lors du chargement des réclamations:", error)
      setReclamations([])
    } finally {
      setIsLoadingReclamations(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Récupérer les valeurs depuis formData et les champs du formulaire
    // Pour les champs en lecture seule, on récupère depuis formData
    // Pour les autres champs, on peut aussi vérifier directement depuis les éléments du DOM si nécessaire
    const phone = String(formData.phone || "").trim()
    const email = String(formData.email || "").trim()
    const description = String(formData.description || "").trim()
    const complainType = String(formData.complainType || selectedType || "").trim()
    const complainDate = String(formData.complainDate || new Date().toISOString().split("T")[0]).trim()

    console.log("[Reclamation] Validation - formData complet:", formData)
    console.log("[Reclamation] Validation - valeurs extraites:", {
      complainType,
      complainDate,
      description: description.substring(0, 50) + (description.length > 50 ? "..." : ""),
      phone,
      email,
      terms: formData.terms,
      complainObject: formData.complainObject,
      availableObjectsLength: availableObjects.length,
      selectedType,
    })

    // Validation détaillée avec messages spécifiques
    const missingFields: string[] = []
    
    if (!complainType) missingFields.push("Type de réclamation")
    if (!complainDate) missingFields.push("Date")
    if (!description) missingFields.push("Description")
    if (!phone) missingFields.push("Téléphone")
    if (!email) missingFields.push("Email")
    if (!formData.terms) missingFields.push("Acceptation des conditions")

    if (missingFields.length > 0) {
      console.error("[Reclamation] Champs manquants:", missingFields)
      setSubmitState({ error: `Veuillez remplir tous les champs obligatoires. Manquants: ${missingFields.join(", ")}` })
      return
    }

    if (availableObjects.length > 0 && !formData.complainObject) {
      setSubmitState({ error: "Veuillez sélectionner un motif de réclamation" })
      return
    }

    setIsSubmitting(true)
    setSubmitState(null)

    try {
      // S'assurer que les valeurs sont bien présentes
      const submissionData = {
        complainType: complainType,
        complainObject: formData.complainObject || complainType,
        description: description,
        complainDate: complainDate,
        phone: phone,
        email: email,
      }

      console.log("[Reclamation] Soumission avec données:", {
        ...submissionData,
        description: submissionData.description.substring(0, 50) + "...",
      })

      const result = await createReclamation(submissionData)

      setSubmitState({ success: true, reference: result.reference })

      // Réinitialiser le formulaire
      setFormData({})
      setSelectedType("")
      setAvailableObjects([])

      // Recharger les réclamations
      await loadReclamations()
    } catch (error: any) {
      setSubmitState({ error: error.message || "Une erreur s'est produite lors de la soumission" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewDetails = async (reclamation: any) => {
    setIsLoadingDetails(true)
    setIsDetailsModalOpen(true)

    try {
      const details = await getReclamationById(reclamation.id)
      setSelectedReclamationDetails(details)
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error)
      setSelectedReclamationDetails(reclamation)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false)
    setSelectedReclamationDetails(null)
  }

  const formatRequestDetails = (details: any) => {
    if (!details) return []

    return [
      { label: "Référence", value: details.claimId || "Non attribuée" },
      { label: "Type de réclamation", value: details.motifRecl?.split(" - ")[0] || details.type || "Non spécifié" },
      { label: "Motif", value: details.motifRecl || "Non spécifié" },
      {
        label: "Date de réclamation",
        value: details.dateRecl ? new Date(details.dateRecl).toLocaleDateString("fr-FR") : "Non spécifiée",
      },
      { label: "Statut", value: details.status || "En cours" },
      { label: "Email", value: details.email || "Non spécifié" },
      { label: "Téléphone", value: details.telephone || "Non spécifié" },
      { label: "Description", value: details.description || "Aucune description" },
      {
        label: "Créée le",
        value: details.createdAt ? new Date(details.createdAt).toLocaleDateString("fr-FR") : "Non spécifiée",
      },
      {
        label: "Dernière mise à jour",
        value: details.updatedAt ? new Date(details.updatedAt).toLocaleDateString("fr-FR") : "Non spécifiée",
      },
    ]
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      "En cours": { variant: "default", icon: Clock },
      Résolue: { variant: "secondary", icon: CheckCircle },
      Rejetée: { variant: "destructive", icon: AlertCircle },
      "En attente": { variant: "outline", icon: Clock },
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

  const filteredReclamations = reclamations.filter((reclamation) => {
    const matchesSearch =
      reclamation.typeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reclamation.object.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reclamation.claimId.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterType === "all" || reclamation.type === filterType

    return matchesSearch && matchesFilter
  })

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Réclamations</h1>
        <p className="text-gray-600 mt-2">Déposez et suivez vos réclamations en ligne</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Nouvelle réclamation
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Mes réclamations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Formulaire de réclamation
              </CardTitle>
              <CardDescription>Remplissez les informations ci-dessous pour déposer une réclamation</CardDescription>
            </CardHeader>
            <CardContent>
              {submitState?.success && (
                <Alert className="mb-6 border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Votre réclamation a été soumise avec succès !<br />
                    Référence: <span className="font-semibold">{submitState.reference}</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="complainType">Type de réclamation *</Label>
                    <Select value={selectedType} onValueChange={handleTypeChange} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez le type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(complainTypes).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="complainObject">Motif de la réclamation {availableObjects.length > 0 && "*"}</Label>
                    <Select
                      value={formData.complainObject || ""}
                      onValueChange={(value) => setFormData({ ...formData, complainObject: value })}
                      disabled={!selectedType || availableObjects.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !selectedType
                              ? "Sélectionnez d'abord un type"
                              : availableObjects.length === 0
                                ? "Aucun motif disponible"
                                : "Sélectionnez le motif"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableObjects.map((object) => (
                          <SelectItem key={object} value={object}>
                            {object}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Champs cachés pour garantir l'envoi des valeurs en lecture seule */}
                <input
                  type="hidden"
                  name="complainDate"
                  value={formData.complainDate || ""}
                />
                <input
                  type="hidden"
                  name="phone"
                  value={formData.phone || ""}
                />
                <input
                  type="hidden"
                  name="email"
                  value={formData.email || ""}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="text"
                      inputMode="numeric"
                      value={formData.phone || ""}
                      placeholder="624123456"
                      required
                      readOnly={true}
                      className="bg-gray-50 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email || ""}
                      placeholder="votre@email.com"
                      required
                      readOnly={true}
                      className="bg-gray-50 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description détaillée *</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Décrivez votre réclamation en détail..."
                    rows={5}
                    required
                  />
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.terms || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, terms: checked })}
                  />
                  <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
                    J'accepte les conditions générales et autorise le traitement de ma réclamation *
                  </Label>
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
                      Soumettre la réclamation
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
              <CardTitle>Mes réclamations</CardTitle>
              <CardDescription>Consultez l'état de vos réclamations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Rechercher par référence, type..."
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
                    <SelectItem value="all">Tous les types</SelectItem>
                    {Object.keys(complainTypes).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isLoadingReclamations ? (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                  <p className="text-gray-600 mt-2">Chargement...</p>
                </div>
              ) : filteredReclamations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 mx-auto text-gray-300" />
                  <p className="text-gray-600 mt-2">Aucune réclamation trouvée</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReclamations.map((reclamation) => (
                    <Card 
                      key={reclamation.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onDoubleClick={() => handleViewDetails(reclamation)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-blue-600" />
                              <span className="font-semibold text-gray-900">{reclamation.claimId}</span>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p className="font-medium">{reclamation.object}</p>
                              <p>Date de soumission: {new Date(reclamation.submittedAt).toLocaleDateString("fr-FR")}</p>
                            </div>
                          </div>
                          <div>
                            {getStatusBadge(reclamation.status)}
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
            <DialogTitle>Détails de la réclamation</DialogTitle>
          </DialogHeader>
          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <Clock className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : selectedReclamationDetails ? (
            <div className="space-y-4">
              {formatRequestDetails(selectedReclamationDetails).map((field, index) => (
                <div key={index} className="grid grid-cols-2 gap-2 py-2 border-b">
                  <span className="font-medium text-gray-700">{field.label}</span>
                  <span className="text-gray-900">{field.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">Aucun détail disponible</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
