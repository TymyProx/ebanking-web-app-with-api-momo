"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Building2, CreditCard, CheckCircle, AlertCircle, ArrowLeft, FileText, Shield, Clock } from "lucide-react"
import Link from "next/link"
import { createAccount } from "../actions"
import { useActionState } from "react"

const accountTypes = [
  {
    id: "current",
    name: "Compte Courant",
    description: "Pour vos opérations quotidiennes",
    currency: "GNF",
    minBalance: "50000",
    features: ["Carte bancaire incluse", "Chéquier gratuit", "Virements illimités", "Découvert autorisé"],
    fees: "Gratuit les 6 premiers mois",
  },
  {
    id: "savings",
    name: "Compte Épargne",
    description: "Pour faire fructifier votre argent",
    currency: "GNF",
    minBalance: "100000",
    features: ["Taux d'intérêt attractif", "Pas de frais de tenue", "Épargne programmée", "Objectifs d'épargne"],
    fees: "Gratuit",
  },
  {
    id: "foreign",
    name: "Compte Devises",
    description: "Pour vos opérations en devises étrangères",
    currency: "USD",
    minBalance: "100",
    features: ["Multi-devises", "Virements internationaux", "Change avantageux", "Carte internationale"],
    fees: "25,000 GNF/mois",
  },
  {
    id: "business",
    name: "Compte Professionnel",
    description: "Pour votre activité professionnelle",
    currency: "GNF",
    minBalance: "200000",
    features: ["Services entreprise", "Terminal de paiement", "Crédits professionnels", "Conseiller dédié"],
    fees: "50,000 GNF/mois",
  },
]

export default function NewAccountPage() {
  const [selectedType, setSelectedType] = useState("")
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [createState, createAction, isCreating] = useActionState(createAccount, null)

  const selectedAccountType = accountTypes.find((type) => type.id === selectedType)

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const formatAmount = (amount: string, currency: string) => {
    const num = Number.parseFloat(amount) || 0
    return new Intl.NumberFormat("fr-FR").format(num)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-4 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/accounts">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle Demande d'Ouverture de Compte</h1>
          <p className="text-gray-600">Choisissez le type de compte qui correspond à vos besoins</p>
        </div>
      </div>

      {/* Sélection du Type de Compte */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="w-5 h-5" />
            <span>Type de Compte</span>
          </CardTitle>
          <CardDescription>Sélectionnez le type de compte que vous souhaitez ouvrir</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accountTypes.map((type) => (
              <div
                key={type.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedType === type.id
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedType(type.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{type.name}</h3>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                  <Badge variant="outline">{type.currency}</Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Solde minimum:</span>
                    <span className="font-medium">
                      {formatAmount(type.minBalance, type.currency)} {type.currency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Frais:</span>
                    <span className="font-medium text-green-600">{type.fees}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  {type.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Formulaire de Demande */}
      {selectedAccountType && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Informations du Compte</span>
            </CardTitle>
            <CardDescription>
              Remplissez les informations pour votre {selectedAccountType.name.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Informations du Compte */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="accountName">Nom du Compte *</Label>
                <Input
                  id="accountName"
                  placeholder="Ex: Mon Compte Courant"
                  value={formData.accountName || ""}
                  onChange={(e) => handleInputChange("accountName", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="currency">Devise *</Label>
                <Select
                  value={formData.currency || selectedAccountType.currency}
                  onValueChange={(value) => handleInputChange("currency", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez la devise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GNF">Franc Guinéen (GNF)</SelectItem>
                    <SelectItem value="USD">Dollar Américain (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="initialDeposit">Dépôt Initial</Label>
                <Input
                  id="initialDeposit"
                  type="number"
                  placeholder={`Minimum: ${selectedAccountType.minBalance}`}
                  value={formData.initialDeposit || ""}
                  onChange={(e) => handleInputChange("initialDeposit", e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum requis: {formatAmount(selectedAccountType.minBalance, selectedAccountType.currency)}{" "}
                  {selectedAccountType.currency}
                </p>
              </div>
              <div>
                <Label htmlFor="accountPurpose">Objectif du Compte</Label>
                <Select onValueChange={(value) => handleInputChange("accountPurpose", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez l'objectif" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Usage personnel</SelectItem>
                    <SelectItem value="business">Usage professionnel</SelectItem>
                    <SelectItem value="savings">Épargne</SelectItem>
                    <SelectItem value="investment">Investissement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Services Additionnels */}
            <div>
              <Label className="text-base font-medium">Services Additionnels</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="bankCard"
                    checked={formData.bankCard || false}
                    onCheckedChange={(checked) => handleInputChange("bankCard", checked)}
                  />
                  <div>
                    <Label htmlFor="bankCard" className="font-medium">
                      Carte bancaire
                    </Label>
                    <p className="text-xs text-gray-500">Carte de débit gratuite</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="checkbook"
                    checked={formData.checkbook || false}
                    onCheckedChange={(checked) => handleInputChange("checkbook", checked)}
                  />
                  <div>
                    <Label htmlFor="checkbook" className="font-medium">
                      Chéquier
                    </Label>
                    <p className="text-xs text-gray-500">Carnet de 25 chèques</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="mobileBanking"
                    checked={formData.mobileBanking || true}
                    onCheckedChange={(checked) => handleInputChange("mobileBanking", checked)}
                  />
                  <div>
                    <Label htmlFor="mobileBanking" className="font-medium">
                      Banque mobile
                    </Label>
                    <p className="text-xs text-gray-500">Accès à l'application mobile</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="smsAlerts"
                    checked={formData.smsAlerts || false}
                    onCheckedChange={(checked) => handleInputChange("smsAlerts", checked)}
                  />
                  <div>
                    <Label htmlFor="smsAlerts" className="font-medium">
                      Alertes SMS
                    </Label>
                    <p className="text-xs text-gray-500">Notifications par SMS</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Commentaires */}
            <div>
              <Label htmlFor="comments">Commentaires Additionnels</Label>
              <Textarea
                id="comments"
                placeholder="Informations supplémentaires ou demandes spéciales..."
                value={formData.comments || ""}
                onChange={(e) => handleInputChange("comments", e.target.value)}
              />
            </div>

            {/* Conditions */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Conditions et Engagements</span>
              </div>

              <div className="space-y-3">
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
                    d'ouverture de compte
                  </Label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="dataProcessing"
                    checked={formData.dataProcessing || false}
                    onCheckedChange={(checked) => handleInputChange("dataProcessing", checked)}
                  />
                  <Label htmlFor="dataProcessing" className="text-sm">
                    J'autorise le traitement de mes données personnelles conformément à la{" "}
                    <a href="#" className="text-blue-600 hover:underline">
                      politique de confidentialité
                    </a>
                  </Label>
                </div>
              </div>
            </div>

            {/* Informations Importantes */}
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <strong>Délai de traitement :</strong> Votre demande sera traitée sous 3-5 jours ouvrables. Vous
                recevrez une notification par SMS et email une fois votre compte activé.
              </AlertDescription>
            </Alert>

            {/* Bouton de Soumission */}
            <form action={createAction}>
              <input type="hidden" name="accountId" value={`ACC_${Date.now()}`} />
              <input type="hidden" name="customerId" value="CUSTOMER_ID_PLACEHOLDER" />
              <input type="hidden" name="accountNumber" value={`000${Date.now().toString().slice(-7)}`} />
              <input type="hidden" name="accountName" value={formData.accountName || ""} />
              <input type="hidden" name="currency" value={formData.currency || selectedAccountType.currency} />
              <input type="hidden" name="bookBalance" value={formData.initialDeposit || "0"} />
              <input type="hidden" name="availableBalance" value={formData.initialDeposit || "0"} />

              <Button
                type="submit"
                disabled={isCreating || !formData.terms || !formData.dataProcessing || !formData.accountName}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Soumission en cours...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Soumettre la Demande d'Ouverture
                  </>
                )}
              </Button>
            </form>

            {/* Messages de Feedback */}
            {createState?.success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">✅ {createState.message}</AlertDescription>
              </Alert>
            )}

            {createState?.error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">❌ {createState.error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
