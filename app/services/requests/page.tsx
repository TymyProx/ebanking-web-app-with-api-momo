"use client"

import type React from "react"

import { useState } from "react"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  BookOpen,
  CreditCard,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Eye,
  Download,
  Banknote,
  Shield,
  Briefcase,
  Plus,
} from "lucide-react"
import { submitCreditRequest, submitCheckbookRequest } from "./actions"
import { useActionState } from "react"

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
    id: "certificate",
    name: "E-attestation bancaire",
    icon: FileText,
    description: "Attestation de compte ou de revenus",
    category: "documents",
    processingTime: "24-48 heures",
    cost: "5,000 GNF",
    requirements: ["Compte ouvert depuis 3 mois", "Justificatifs à jour"],
  },
  {
    id: "credit",
    name: "Crédit",
    icon: CreditCard,
    description: "Demande de crédit (personnel, immobilier, automobile, étudiant)",
    category: "credit",
    processingTime: "3-30 jours ouvrables",
    cost: "Gratuit",
    requirements: ["Revenus réguliers", "Garanties", "Dossier complet"],
  },
  {
    id: "business_account",
    name: "Compte professionnel",
    icon: Briefcase,
    description: "Ouverture de compte entreprise",
    category: "business",
    processingTime: "7-14 jours ouvrables",
    cost: "25,000 GNF",
    requirements: ["RCCM", "Statuts", "Pièces dirigeants"],
  },
  {
    id: "card_request",
    name: "Demande de carte",
    icon: CreditCard,
    description: "Nouvelle carte bancaire ou remplacement",
    category: "banking",
    processingTime: "7-10 jours ouvrables",
    cost: "15,000 GNF",
    requirements: ["Compte actif", "Pièce d'identité"],
  },
]

const accounts = [
  { id: "acc_001", name: "Compte Courant Principal", number: "0001234567890", balance: 2500000, currency: "GNF" },
  { id: "acc_002", name: "Compte Épargne", number: "0001234567891", balance: 5000000, currency: "GNF" },
  { id: "acc_003", name: "Compte USD", number: "0001234567892", balance: 1200, currency: "USD" },
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

  const selectedServiceData = serviceTypes.find((s) => s.id === selectedService)
  const selectedHistoryRequestData = recentRequests.find((r) => r.id === selectedHistoryRequest)

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const getServiceIdFromRequestType = (requestType: string): string => {
    const typeMapping: Record<string, string> = {
      "Demande de chéquier": "checkbook",
      "E-attestation bancaire": "certificate",
      Crédit: "credit",
      "Compte professionnel": "business_account",
      "Demande de carte": "card_request",
    }
    return typeMapping[requestType] || ""
  }

  const getAccountIdFromName = (accountName: string): string => {
    const account = accounts.find((acc) => acc.name === accountName)
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
      case "En cours":
        return <Badge className="bg-yellow-100 text-yellow-800">En cours</Badge>
      case "Approuvée":
        return <Badge className="bg-green-100 text-green-800">Approuvée</Badge>
      case "En attente de documents":
        return <Badge className="bg-orange-100 text-orange-800">En attente</Badge>
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

    // Vérifier que tous les champs requis sont remplis
    if (!formData.applicant_name || !formData.loan_amount || !formData.loan_duration || !formData.loan_purpose) {
      setCreditSubmitState({ error: "Veuillez remplir tous les champs obligatoires" })
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
      }

      const result = await submitCreditRequest(creditData)
      setCreditSubmitState({ success: true, reference: result.referenceId || "REF-" + Date.now() })
      // Réinitialiser le formulaire après succès
      setFormData({})
    } catch (error: any) {
      setCreditSubmitState({ error: error.message || "Une erreur s'est produite lors de la soumission" })
    } finally {
      setIsCreditSubmitting(false)
    }
  }

  const handleCheckbookSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Vérifier que tous les champs requis sont remplis
    if (!formData.nbrechequier || !formData.nbrefeuille || !formData.intitulecompte) {
      setCheckbookSubmitState({ error: "Veuillez remplir tous les champs obligatoires" })
      return
    }

    setIsCheckbookSubmitting(true)
    setCheckbookSubmitState(null)

    try {
      const checkbookData = {
        dateorder: formData.dateorder || new Date().toISOString().split("T")[0],
        nbrefeuille: Number.parseInt(formData.nbrefeuille) || 0,
        nbrechequier: Number.parseInt(formData.nbrechequier) || 0,
        stepflow: 0,
        intitulecompte: formData.intitulecompte,
        numcompteId: selectedAccount,
        commentaire: formData.commentaire || "",
      }

      const result = await submitCheckbookRequest(checkbookData)
      setCheckbookSubmitState({ success: true, reference: result.referenceId || "REF-" + Date.now() })
      // Réinitialiser le formulaire après succès
      setFormData({})
    } catch (error: any) {
      setCheckbookSubmitState({ error: error.message || "Une erreur s'est produite lors de la soumission" })
    } finally {
      setIsCheckbookSubmitting(false)
    }
  }

  const renderServiceForm = () => {
    if (!selectedServiceData) return null

    switch (selectedService) {
      // COMMANDES CHEQUIER PAGE
      case "checkbook":
        return (
          <form onSubmit={handleCheckbookSubmit} className="space-y-4">
            <div>
              <Label htmlFor="dateorder">Date de commande *</Label>
              <Input
                id="dateorder"
                name="dateorder"
                type="date"
                value={formData.dateorder || new Date().toISOString().split("T")[0]}
                onChange={(e) => handleInputChange("dateorder", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="nbrechequier">Nombre de chéquiers *</Label>
              <Input
                id="nbrechequier"
                name="nbrechequier"
                type="number"
                min="1"
                max="10"
                value={formData.nbrechequier || ""}
                onChange={(e) => handleInputChange("nbrechequier", e.target.value)}
                placeholder="Ex: 2"
                required
              />
            </div>

            <div>
              <Label htmlFor="nbrefeuille">Nombre de feuilles par chéquier *</Label>
              <Input
                id="nbrefeuille"
                name="nbrefeuille"
                type="number"
                min="25"
                max="100"
                step="25"
                value={formData.nbrefeuille || ""}
                onChange={(e) => handleInputChange("nbrefeuille", e.target.value)}
                placeholder="Ex: 50"
                required
              />
            </div>

            <div>
              <Label htmlFor="commentaire">Commentaire</Label>
              <Textarea
                id="commentaire"
                name="commentaire"
                value={formData.commentaire || ""}
                onChange={(e) => handleInputChange("commentaire", e.target.value)}
                placeholder="Commentaire optionnel..."
                rows={3}
              />
            </div>

            {checkbookSubmitState?.success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ✅ Votre demande de chéquier a été soumise avec succès ! Référence: {checkbookSubmitState.reference}
                </AlertDescription>
              </Alert>
            )}

            {checkbookSubmitState?.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>❌ {checkbookSubmitState.error}</AlertDescription>
              </Alert>
            )}
          </form>
        )

      case "certificate":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="certificate_type">Type d'attestation *</Label>
              <Select onValueChange={(value) => handleInputChange("certificate_type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="account">Attestation de compte</SelectItem>
                  <SelectItem value="balance">Attestation de solde</SelectItem>
                  <SelectItem value="income">Attestation de revenus</SelectItem>
                  <SelectItem value="domiciliation">Attestation de domiciliation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="purpose">Motif de la demande *</Label>
              <Select onValueChange={(value) => handleInputChange("purpose", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le motif" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visa">Demande de visa</SelectItem>
                  <SelectItem value="loan">Demande de prêt</SelectItem>
                  <SelectItem value="employment">Dossier d'emploi</SelectItem>
                  <SelectItem value="rental">Location immobilière</SelectItem>
                  <SelectItem value="business">Création d'entreprise</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.purpose === "other" && (
              <div>
                <Label htmlFor="purpose_details">Précisez le motif *</Label>
                <Input
                  id="purpose_details"
                  placeholder="Décrivez le motif de votre demande"
                  value={formData.purpose_details || ""}
                  onChange={(e) => handleInputChange("purpose_details", e.target.value)}
                />
              </div>
            )}

            <div>
              <Label htmlFor="language">Langue du document *</Label>
              <Select onValueChange={(value) => handleInputChange("language", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez la langue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">Anglais</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="recipient">Destinataire *</Label>
              <Input
                id="recipient"
                placeholder="Nom de l'organisme ou personne destinataire"
                value={formData.recipient || ""}
                onChange={(e) => handleInputChange("recipient", e.target.value)}
              />
            </div>
          </div>
        )

      case "credit":
        return (
          <form onSubmit={handleCreditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="credit_type">Type de crédit *</Label>
              <Select onValueChange={(value) => handleInputChange("credit_type", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le type de crédit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Crédit personnel</SelectItem>
                  <SelectItem value="mortgage">Crédit immobilier</SelectItem>
                  <SelectItem value="student">Crédit étudiant</SelectItem>
                  <SelectItem value="auto">Crédit automobile</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="loan_amount">Montant du crédit (GNF) *</Label>
                <Input
                  id="loan_amount"
                  type="number"
                  placeholder="Ex: 10000000"
                  value={formData.loan_amount || ""}
                  onChange={(e) => handleInputChange("loan_amount", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="loan_duration">Durée (mois) *</Label>
                <Select onValueChange={(value) => handleInputChange("loan_duration", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Durée" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12 mois</SelectItem>
                    <SelectItem value="24">24 mois</SelectItem>
                    <SelectItem value="36">36 mois</SelectItem>
                    <SelectItem value="48">48 mois</SelectItem>
                    <SelectItem value="60">60 mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="loan_purpose">Objet du crédit *</Label>
              <Select onValueChange={(value) => handleInputChange("loan_purpose", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez l'objet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consumption">Consommation</SelectItem>
                  <SelectItem value="equipment">Équipement</SelectItem>
                  <SelectItem value="renovation">Rénovation</SelectItem>
                  <SelectItem value="education">Éducation</SelectItem>
                  <SelectItem value="health">Santé</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthly_income">Revenus mensuels (GNF) *</Label>
                <Input
                  id="monthly_income"
                  type="number"
                  placeholder="Ex: 2000000"
                  value={formData.monthly_income || ""}
                  onChange={(e) => handleInputChange("monthly_income", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="employment_type">Type d'emploi *</Label>
                <Select onValueChange={(value) => handleInputChange("employment_type", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Type d'emploi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Salarié</SelectItem>
                    <SelectItem value="civil_servant">Fonctionnaire</SelectItem>
                    <SelectItem value="self_employed">Indépendant</SelectItem>
                    <SelectItem value="business_owner">Chef d'entreprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="applicant_name">Nom du demandeur *</Label>
              <Input
                id="applicant_name"
                placeholder="Nom du demandeur"
                value={formData.applicant_name || ""}
                onChange={(e) => handleInputChange("applicant_name", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="guarantor_name">Nom du garant *</Label>
              <Input
                id="guarantor_name"
                placeholder="Nom complet du garant"
                value={formData.guarantor_name || ""}
                onChange={(e) => handleInputChange("guarantor_name", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="guarantor_phone">Téléphone du garant *</Label>
              <Input
                id="guarantor_phone"
                placeholder="Ex: +224 6XX XXX XXX"
                value={formData.guarantor_phone || ""}
                onChange={(e) => handleInputChange("guarantor_phone", e.target.value)}
                required
              />
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h4 className="font-medium">Informations de contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_phone">Téléphone *</Label>
                  <Input
                    id="contact_phone"
                    placeholder="+224 6XX XXX XXX"
                    value={formData.contact_phone || ""}
                    onChange={(e) => handleInputChange("contact_phone", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="contact_email">Email *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.contact_email || ""}
                    onChange={(e) => handleInputChange("contact_email", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={formData.terms || false}
                onCheckedChange={(checked) => handleInputChange("terms", checked)}
                required
              />
              <Label htmlFor="terms" className="text-sm">
                J'accepte les{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  conditions générales
                </a>{" "}
                et autorise le traitement de ma demande
              </Label>
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={isCreditSubmitting || !formData.terms} className="w-full">
              {isCreditSubmitting ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer la demande
                </>
              )}
            </Button>

            {/* Feedback Messages */}
            {creditSubmitState?.success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ✅ Votre demande de crédit a été envoyée avec succès. Référence: {creditSubmitState.reference}.
                  Réponse sous {selectedServiceData?.processingTime}.
                </AlertDescription>
              </Alert>
            )}

            {creditSubmitState?.error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  ❌ Une erreur est survenue: {creditSubmitState.error}. Veuillez réessayer.
                </AlertDescription>
              </Alert>
            )}
          </form>
        )

      case "card_request":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="card_type">Type de carte *</Label>
              <Select onValueChange={(value) => handleInputChange("card_type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">Carte de débit</SelectItem>
                  <SelectItem value="credit">Carte de crédit</SelectItem>
                  <SelectItem value="prepaid">Carte prépayée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="card_category">Catégorie *</Label>
              <Select onValueChange={(value) => handleInputChange("card_category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez la catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">Classic</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="request_reason">Motif de la demande *</Label>
              <Select onValueChange={(value) => handleInputChange("request_reason", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le motif" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Nouvelle carte</SelectItem>
                  <SelectItem value="replacement">Remplacement (perte/vol)</SelectItem>
                  <SelectItem value="damaged">Carte endommagée</SelectItem>
                  <SelectItem value="expired">Carte expirée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.request_reason === "replacement" && (
              <div>
                <Label htmlFor="incident_details">Détails de l'incident *</Label>
                <Textarea
                  id="incident_details"
                  placeholder="Décrivez les circonstances (perte, vol, etc.)"
                  value={formData.incident_details || ""}
                  onChange={(e) => handleInputChange("incident_details", e.target.value)}
                />
              </div>
            )}

            <div>
              <Label htmlFor="delivery_method">Mode de livraison *</Label>
              <RadioGroup
                value={formData.delivery_method}
                onValueChange={(value) => handleInputChange("delivery_method", value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="branch" id="branch" />
                  <Label htmlFor="branch">Retrait en agence</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="courier" id="courier" />
                  <Label htmlFor="courier">Livraison par coursier (+15,000 GNF)</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )

      default:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="details">Détails de la demande *</Label>
              <Textarea
                id="details"
                placeholder="Décrivez votre demande en détail"
                value={formData.details || ""}
                onChange={(e) => handleInputChange("details", e.target.value)}
              />
            </div>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">E-Services</h1>
        <p className="text-gray-600">Faites vos demandes de services en ligne</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new">Nouvelle demande</TabsTrigger>
          <TabsTrigger value="history">Mes demandes</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-6">
          {/* Service Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Nouvelle demande</span>
              </CardTitle>
              <CardDescription>Sélectionnez le type de service que vous souhaitez demander</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {serviceTypes.map((service) => {
                  const Icon = service.icon
                  return (
                    <div
                      key={service.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedService === service.id
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedService(service.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{service.name}</h3>
                          <p className="text-xs text-gray-500 mt-1">{service.description}</p>
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="outline" className="text-xs">
                              {service.processingTime}
                            </Badge>
                            <span className="text-xs font-medium text-green-600">{service.cost}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Service Details & Form */}
          {selectedServiceData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <selectedServiceData.icon className="w-5 h-5" />
                  <span>{selectedServiceData.name}</span>
                </CardTitle>
                <CardDescription>{selectedServiceData.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Service Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Délai de traitement</p>
                      <p className="text-xs text-gray-600">{selectedServiceData.processingTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Banknote className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Coût</p>
                      <p className="text-xs text-gray-600">{selectedServiceData.cost}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Sécurisé</p>
                      <p className="text-xs text-gray-600">Traitement confidentiel</p>
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <h4 className="font-medium mb-2">Prérequis</h4>
                  <ul className="space-y-1">
                    {selectedServiceData.requirements.map((req, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Account Selection */}
                <div>
                  <Label htmlFor="account">Intitulé du compte *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                    {accounts.map((account) => (
                      <div
                        key={account.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedAccount === account.id
                            ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => {
                          setSelectedAccount(account.id)
                          handleInputChange("intitulecompte", account.name)
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <CreditCard className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-sm">{account.name}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">***{account.number.slice(-4)}</p>
                        <p className="text-sm font-bold mt-1">
                          {formatAmount(account.balance, account.currency)} {account.currency}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dynamic Form */}
                {renderServiceForm()}

                {/* Terms and Conditions */}
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
                    et autorise le traitement de ma demande
                  </Label>
                </div>

                {/* Submit Button */}
                {selectedService === "checkbook" ? (
                  <Button
                    type="button"
                    onClick={handleCheckbookSubmit}
                    disabled={isCheckbookSubmitting || !formData.terms}
                    className="w-full"
                  >
                    {isCheckbookSubmitting ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Envoyer la demande
                      </>
                    )}
                  </Button>
                ) : (
                  <form action={submitAction}>
                    <input type="hidden" name="serviceType" value={selectedService} />
                    <input type="hidden" name="accountId" value={selectedAccount} />
                    <input type="hidden" name="formData" value={JSON.stringify(formData)} />

                    <Button type="submit" disabled={isSubmitting || !formData.terms} className="w-full">
                      {isSubmitting ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Envoyer la demande
                        </>
                      )}
                    </Button>
                  </form>
                )}

                {/* Feedback Messages */}
                {submitState?.success && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      ✅ Votre demande a été envoyée avec succès. Référence: {submitState.reference}. Réponse sous{" "}
                      {selectedServiceData?.processingTime}.
                    </AlertDescription>
                  </Alert>
                )}

                {submitState?.error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      ❌ Une erreur est survenue: {submitState.error}. Veuillez réessayer.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Mes demandes</span>
                </CardTitle>
                <div className="flex items-center space-x-3">
                  {getStatusBadge(selectedHistoryRequestData?.status || "")}
                  <div className="flex space-x-1">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                    {selectedHistoryRequestData?.status === "Approuvée" && (
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <CardDescription>
                <div className="space-y-1">
                  <p>Compte: {selectedHistoryRequestData?.account}</p>
                  <p className="text-xs">
                    Demandé le {selectedHistoryRequestData?.submittedAt}
                    {selectedHistoryRequestData?.expectedResponse &&
                      ` • Réponse attendue le ${selectedHistoryRequestData?.expectedResponse}`}
                    {selectedHistoryRequestData?.completedAt &&
                      ` • Complété le ${selectedHistoryRequestData?.completedAt}`}
                  </p>
                  <p className="text-xs font-medium">Référence: {selectedHistoryRequestData?.id}</p>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Service Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Délai de traitement</p>
                    <p className="text-xs text-gray-600">{selectedServiceData?.processingTime}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Banknote className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Coût</p>
                    <p className="text-xs text-gray-600">{selectedServiceData?.cost}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Sécurisé</p>
                    <p className="text-xs text-gray-600">Traitement confidentiel</p>
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div>
                <h4 className="font-medium mb-2">Prérequis</h4>
                <ul className="space-y-1">
                  {selectedServiceData?.requirements.map((req, index) => (
                    <li key={index} className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Account Selection - Read Only */}
              <div>
                <Label>Intitulé du compte</Label>
                <div className="mt-2">
                  {accounts
                    .filter((account) => account.name === selectedHistoryRequestData?.account)
                    .map((account) => (
                      <div key={account.id} className="p-3 border-2 border-blue-500 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-sm">{account.name}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">***{account.number.slice(-4)}</p>
                        <p className="text-sm font-bold mt-1">
                          {formatAmount(account.balance, account.currency)} {account.currency}
                        </p>
                      </div>
                    ))}
                </div>
              </div>

              {/* Dynamic Form - Read Only */}
              {renderServiceForm()}

              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  📋 Cette demande a été soumise et est en cours de traitement. Les informations affichées sont en
                  lecture seule.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
