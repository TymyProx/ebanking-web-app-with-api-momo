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
import { AlertCircle, CheckCircle, Send, Eye, Plus, Search, FileText, MessageSquare, Upload } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const complainTypes = {
  Compte: [],
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

const typesRequiringAttachments = ["Carte", "Virement"]

export default function ComplainPage() {
  const [activeTab, setActiveTab] = useState("new")
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [selectedType, setSelectedType] = useState<string>("")
  const [availableObjects, setAvailableObjects] = useState<string[]>([])
  const [showAttachmentField, setShowAttachmentField] = useState(false)
  const [submitState, setSubmitState] = useState<{
    success?: boolean
    error?: string
    reference?: string
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // États pour la liste des réclamations
  const [complains, setComplains] = useState<any[]>([])
  const [isLoadingComplains, setIsLoadingComplains] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedComplainDetails, setSelectedComplainDetails] = useState<any>(null)

  // Gérer le changement de type de réclamation
  const handleTypeChange = (type: string) => {
    setSelectedType(type)
    setAvailableObjects(complainTypes[type as keyof typeof complainTypes] || [])
    setShowAttachmentField(typesRequiringAttachments.includes(type))
    handleInputChange("complainType", type)
    handleInputChange("complainObject", "") // Réinitialiser l'objet
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation des champs requis
    if (
      !formData.complainType ||
      !formData.complainObject ||
      !formData.complainDate ||
      !formData.description ||
      !formData.phone ||
      !formData.email ||
      !formData.terms
    ) {
      setSubmitState({ error: "Veuillez remplir tous les champs obligatoires" })
      return
    }

    setIsSubmitting(true)
    setSubmitState(null)

    try {
      // Simuler l'envoi de la réclamation (à remplacer par l'appel API réel)
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const reference = `REC-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`
      setSubmitState({ success: true, reference })

      // Réinitialiser le formulaire
      setFormData({})
      setSelectedType("")
      setAvailableObjects([])
      setShowAttachmentField(false)

      // Recharger les réclamations si on est dans l'onglet historique
      if (activeTab === "history") {
        loadComplains()
      }
    } catch (error: any) {
      setSubmitState({ error: error.message || "Une erreur s'est produite lors de la soumission" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const loadComplains = async () => {
    setIsLoadingComplains(true)
    try {
      // Simuler le chargement des réclamations (à remplacer par l'appel API réel)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Données de test
      const mockComplains = [
        {
          id: "REC001",
          type: "Carte",
          typeName: "Réclamation Carte",
          object: "Carte non reçue",
          status: "En cours",
          submittedAt: "2025-01-15",
          description: "Je n'ai pas reçu ma carte bancaire commandée il y a 2 semaines",
          phone: "+224 622 123 456",
          email: "user@example.com",
        },
        {
          id: "REC002",
          type: "Virement",
          typeName: "Réclamation Virement",
          object: "Virement non exécuté",
          status: "Résolue",
          submittedAt: "2025-01-10",
          description: "Mon virement de 500000 GNF n'a pas été exécuté",
          phone: "+224 622 123 456",
          email: "user@example.com",
        },
      ]

      setComplains(mockComplains)
    } catch (error) {
      console.error("Erreur lors du chargement des réclamations:", error)
      setComplains([])
    } finally {
      setIsLoadingComplains(false)
    }
  }

  const handleViewDetails = (complain: any) => {
    setSelectedComplainDetails(complain)
    setIsDetailsModalOpen(true)
  }

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false)
    setSelectedComplainDetails(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "En cours":
        return <Badge className="bg-blue-100 text-blue-800">En cours</Badge>
      case "Résolue":
        return <Badge className="bg-green-100 text-green-800">Résolue</Badge>
      case "Rejetée":
        return <Badge className="bg-red-100 text-red-800">Rejetée</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filteredComplains = complains.filter((complain) => {
    const matchesSearch =
      complain.typeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complain.object.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complain.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterType === "all" || complain.type === filterType

    return matchesSearch && matchesFilter
  })

  useEffect(() => {
    if (activeTab === "history") {
      loadComplains()
    }
  }, [activeTab])

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Réclamations
        </h1>
        <p className="text-muted-foreground text-lg">Déposez et suivez vos réclamations en ligne</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new">Nouvelle réclamation</TabsTrigger>
          <TabsTrigger value="history">Mes réclamations</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Nouvelle réclamation</span>
              </CardTitle>
              <CardDescription>Remplissez le formulaire pour déposer une réclamation</CardDescription>
            </CardHeader>
            <CardContent>
             <form onSubmit={handleSubmit} className="space-y-4">
  {/* Type de réclamation et Objet sur la même ligne */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Type de réclamation */}
    <div className="space-y-2">
      <Label htmlFor="complainType">Type de réclamation *</Label>
      <Select value={selectedType} onValueChange={handleTypeChange}>
        <SelectTrigger className="w-90">
          <SelectValue placeholder="Sélectionnez le type de réclamation" />
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

    {/* Objet de la réclamation (dépendant du type) */}
    {selectedType && (
      <div className="space-y-2">
        <Label htmlFor="complainObject">Objet de la réclamation *</Label>
        <Select
          value={formData.complainObject || ""}
          onValueChange={(value) => handleInputChange("complainObject", value)}
        >
          <SelectTrigger className="w-80">
            <SelectValue placeholder="Sélectionnez l'objet de la réclamation" />
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
    )}
  </div>

  {/* Date de réclamation et Pièces jointes sur la même ligne */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Date de la réclamation */}
    <div className="space-y-2 ml-4">
      <Label htmlFor="complainDate">Date de la réclamation *</Label>
      <Input
        id="complainDate"
        type="date"
        value={formData.complainDate || ""}
        onChange={(e) => handleInputChange("complainDate", e.target.value)}
        max={new Date().toISOString().split("T")[0]}
        required
        className="w-40"
      />
    </div>

    {/* Champ de pièces jointes (conditionnel) */}
    {showAttachmentField && (
      <div className="space-y-2">
        <Label htmlFor="attachments">Pièces jointes</Label>
        <div className="flex items-center space-x-2">
          <Input
            id="attachments"
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={(e) => handleInputChange("attachments", e.target.files)}
            className="w-80"
          />
          <Upload className="w-5 h-5 text-gray-400" />
        </div>
        <p className="text-xs text-gray-500">
            images (JPG, PNG) et PDF. Taille max: 5 Mo par fichier.
        </p>
      </div>
    )}
  </div>

  {/* Description détaillée */}
  <div className="space-y-2 max-w-3xl">
    <Label htmlFor="description">Description détaillée *</Label>
    <Textarea
      id="description"
      value={formData.description || ""}
      onChange={(e) => handleInputChange("description", e.target.value)}
      placeholder="Décrivez votre réclamation en détail..."
      rows={5}
      required
      className="w-full"
    />
  </div>

  {/* Téléphone et Email sur la même ligne */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label htmlFor="phone">Téléphone *</Label>
      <Input
        id="phone"
        type="tel"
        value={formData.phone || ""}
        onChange={(e) => handleInputChange("phone", e.target.value)}
        placeholder="+224 6XX XXX XXX"
        required
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="email">Email *</Label>
      <Input
        id="email"
        type="email"
        value={formData.email || ""}
        onChange={(e) => handleInputChange("email", e.target.value)}
        placeholder="votre@email.com"
        required
      />
    </div>
  </div>

  {/* Messages de feedback */}
  {submitState?.success && (
    <Alert className="border-green-200 bg-green-50">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">
        Votre réclamation a été soumise avec succès. Référence: {submitState.reference}
      </AlertDescription>
    </Alert>
  )}

  {submitState?.error && (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{submitState.error}</AlertDescription>
    </Alert>
  )}

  {/* Conditions générales */}
  <div className="flex items-start space-x-2">
    <Checkbox
      id="terms"
      checked={formData.terms || false}
      onCheckedChange={(checked) => handleInputChange("terms", checked)}
    />
    <Label htmlFor="terms" className="text-sm">
      J'accepte les{" "}
      <a href="#" className="text-blue-600 hover:underline">
        conditions générales
      </a>{" "}
      et autorise le traitement de ma réclamation
    </Label>
  </div>

  {/* Bouton de soumission */}
  <Button type="submit" disabled={isSubmitting || !formData.terms} className="w-full">
    {isSubmitting ? (
      <>
        <MessageSquare className="w-4 h-4 mr-2 animate-spin" />
        Envoi en cours...
      </>
    ) : (
      <>
        <Send className="w-4 h-4 mr-2" />
        Envoyer la réclamation
      </>
    )}
  </Button>
</form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Mes réclamations</h2>
              <p className="text-gray-600">Consultez et suivez vos réclamations</p>
            </div>
          </div>

          {/* Barre de recherche et filtre */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Rechercher une réclamation..."
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
            </CardContent>
          </Card>

          {/* Liste des réclamations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Mes réclamations ({filteredComplains.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingComplains ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Chargement des réclamations...</p>
                </div>
              ) : filteredComplains.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune réclamation trouvée</p>
                  <p className="text-sm text-gray-400">
                    Créez votre première réclamation dans l'onglet "Nouvelle réclamation"
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredComplains.map((complain) => (
                    <div
                      key={complain.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-blue-600" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900">{complain.typeName}</h3>
                            {getStatusBadge(complain.status)}
                          </div>

                          <div className="text-sm text-gray-600 space-y-1">
                            <p className="font-mono">Réf: {complain.id}</p>
                            <p className="font-medium">{complain.object}</p>
                          </div>
                        </div>

                        <div className="text-right text-sm text-gray-500">
                          <p>Soumise le</p>
                          <p className="font-medium">{new Date(complain.submittedAt).toLocaleDateString("fr-FR")}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(complain)}>
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

      {/* Modal de détails */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Détails de la réclamation
            </DialogTitle>
          </DialogHeader>

          {selectedComplainDetails ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">Référence</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">{selectedComplainDetails.id}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">Type</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">{selectedComplainDetails.type}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">Objet</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
                    {selectedComplainDetails.object}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">Date de soumission</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
                    {new Date(selectedComplainDetails.submittedAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
                    {selectedComplainDetails.description}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">Téléphone</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">{selectedComplainDetails.phone}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">{selectedComplainDetails.email}</p>
                </div>
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
