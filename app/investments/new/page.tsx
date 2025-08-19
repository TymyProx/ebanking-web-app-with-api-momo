"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TrendingUp, Shield, AlertTriangle, CheckCircle } from "lucide-react"
import { submitInvestment } from "./actions"
import { useActionState } from "react"

interface InvestmentFormData {
  investorName: string
  email: string
  investmentType: string
  amount: string
  duration: string
  riskProfile: string
}

const INVESTMENT_TYPES = [
  {
    value: "actions",
    label: "Actions",
    description: "Investissement en bourse avec potentiel de croissance élevé",
    risk: "Élevé",
  },
  { value: "obligations", label: "Obligations", description: "Titres de créance à revenu fixe", risk: "Modéré" },
  {
    value: "fonds_communs",
    label: "Fonds communs",
    description: "Portefeuille diversifié géré par des professionnels",
    risk: "Variable",
  },
  {
    value: "epargne_terme",
    label: "Épargne à terme",
    description: "Placement sécurisé avec taux garanti",
    risk: "Faible",
  },
]

const DURATION_OPTIONS = [
  { value: "6", label: "6 mois" },
  { value: "12", label: "1 an" },
  { value: "24", label: "2 ans" },
  { value: "36", label: "3 ans" },
  { value: "60", label: "5 ans" },
  { value: "custom", label: "Durée personnalisée" },
]

export default function NewInvestmentPage() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(submitInvestment, null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [customDuration, setCustomDuration] = useState("")
  const [formData, setFormData] = useState<InvestmentFormData>({
    investorName: "Jean Dupont", // Pré-rempli depuis le profil
    email: "jean.dupont@example.com", // Pré-rempli depuis le profil
    investmentType: "",
    amount: "",
    duration: "",
    riskProfile: "",
  })

  const selectedInvestmentType = INVESTMENT_TYPES.find((type) => type.value === formData.investmentType)
  const calculatedReturn =
    formData.amount && formData.duration
      ? calculateEstimatedReturn(
          Number.parseFloat(formData.amount),
          Number.parseInt(formData.duration),
          formData.investmentType,
        )
      : null

  const handleInputChange = (field: keyof InvestmentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setShowConfirmation(true)
  }

  const handleConfirmSubmit = () => {
    const form = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      form.append(key, value)
    })
    if (formData.duration === "custom") {
      form.append("customDuration", customDuration)
    }

    setShowConfirmation(false)
    formAction(form)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nouveau Placement</h1>
          <p className="text-gray-600 mt-2">Investissez dans des produits financiers adaptés à votre profil</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Sécurisé
        </Badge>
      </div>

      {state?.success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{state.message}</AlertDescription>
        </Alert>
      )}

      {state?.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Informations du Placement
              </CardTitle>
              <CardDescription>Remplissez les informations de votre investissement</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="investorName">Nom de l'investisseur</Label>
                    <Input
                      id="investorName"
                      value={formData.investorName}
                      onChange={(e) => handleInputChange("investorName", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Adresse email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="investmentType">Type de placement</Label>
                  <Select
                    value={formData.investmentType}
                    onValueChange={(value) => handleInputChange("investmentType", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un produit de placement" />
                    </SelectTrigger>
                    <SelectContent>
                      {INVESTMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex flex-col">
                            <span>{type.label}</span>
                            <span className="text-xs text-gray-500">{type.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedInvestmentType && (
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant={
                          selectedInvestmentType.risk === "Élevé"
                            ? "destructive"
                            : selectedInvestmentType.risk === "Modéré"
                              ? "default"
                              : "secondary"
                        }
                      >
                        Risque: {selectedInvestmentType.risk}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Montant à investir (GNF)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="100000"
                      step="1000"
                      value={formData.amount}
                      onChange={(e) => handleInputChange("amount", e.target.value)}
                      placeholder="Montant minimum: 100,000 GNF"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Durée d'investissement</Label>
                    <Select
                      value={formData.duration}
                      onValueChange={(value) => handleInputChange("duration", value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisissez la durée" />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.duration === "custom" && (
                  <div className="space-y-2">
                    <Label htmlFor="customDuration">Durée personnalisée (en mois)</Label>
                    <Input
                      id="customDuration"
                      type="number"
                      min="1"
                      max="120"
                      value={customDuration}
                      onChange={(e) => setCustomDuration(e.target.value)}
                      placeholder="Nombre de mois (1-120)"
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="riskProfile">Profil de risque</Label>
                  <Select
                    value={formData.riskProfile}
                    onValueChange={(value) => handleInputChange("riskProfile", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre profil de risque" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservateur">Conservateur - Préservation du capital</SelectItem>
                      <SelectItem value="modere">Modéré - Équilibre risque/rendement</SelectItem>
                      <SelectItem value="dynamique">Dynamique - Croissance du capital</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={isPending || !isFormValid(formData, customDuration)}>
                  {isPending ? "Traitement..." : "Continuer vers la confirmation"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estimation du Rendement</CardTitle>
            </CardHeader>
            <CardContent>
              {calculatedReturn ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {calculatedReturn.totalReturn.toLocaleString("fr-FR")} GNF
                    </div>
                    <div className="text-sm text-gray-500">Rendement estimé</div>
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Capital initial:</span>
                      <span>{Number.parseFloat(formData.amount).toLocaleString("fr-FR")} GNF</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Durée:</span>
                      <span>{formData.duration === "custom" ? customDuration : formData.duration} mois</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taux estimé:</span>
                      <span>{calculatedReturn.rate}% annuel</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total à l'échéance:</span>
                      <span>{calculatedReturn.finalAmount.toLocaleString("fr-FR")} GNF</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Remplissez le formulaire pour voir l'estimation</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Information Importante</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500" />
                <p>Les performances passées ne préjugent pas des performances futures.</p>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 text-blue-500" />
                <p>Vos investissements sont protégés selon la réglementation bancaire guinéenne.</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                <p>Un conseiller peut vous contacter pour personnaliser votre stratégie.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de confirmation */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirmation du Placement</DialogTitle>
            <DialogDescription>
              Veuillez vérifier les détails de votre investissement avant de confirmer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Investisseur:</span>
                  <p>{formData.investorName}</p>
                </div>
                <div>
                  <span className="font-medium">Email:</span>
                  <p>{formData.email}</p>
                </div>
                <div>
                  <span className="font-medium">Type de placement:</span>
                  <p>{selectedInvestmentType?.label}</p>
                </div>
                <div>
                  <span className="font-medium">Montant:</span>
                  <p>{Number.parseFloat(formData.amount || "0").toLocaleString("fr-FR")} GNF</p>
                </div>
                <div>
                  <span className="font-medium">Durée:</span>
                  <p>
                    {formData.duration === "custom"
                      ? `${customDuration} mois`
                      : DURATION_OPTIONS.find((d) => d.value === formData.duration)?.label}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Profil de risque:</span>
                  <p className="capitalize">{formData.riskProfile}</p>
                </div>
              </div>

              {calculatedReturn && (
                <div className="border-t pt-3 mt-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      Rendement estimé: {calculatedReturn.totalReturn.toLocaleString("fr-FR")} GNF
                    </div>
                    <div className="text-sm text-gray-500">
                      Total à l'échéance: {calculatedReturn.finalAmount.toLocaleString("fr-FR")} GNF
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                En confirmant, vous acceptez les conditions générales des placements financiers. Cette opération
                nécessitera une validation par OTP ou signature électronique.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>
              Modifier
            </Button>
            <Button onClick={handleConfirmSubmit} disabled={isPending}>
              {isPending ? "Confirmation..." : "Confirmer le placement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function calculateEstimatedReturn(amount: number, duration: number, investmentType: string) {
  const rates = {
    actions: 0.08, // 8% annuel
    obligations: 0.05, // 5% annuel
    fonds_communs: 0.06, // 6% annuel
    epargne_terme: 0.04, // 4% annuel
  }

  const rate = rates[investmentType as keyof typeof rates] || 0.05
  const years = duration / 12
  const finalAmount = amount * Math.pow(1 + rate, years)
  const totalReturn = finalAmount - amount

  return {
    rate: (rate * 100).toFixed(1),
    finalAmount,
    totalReturn,
  }
}

function isFormValid(formData: InvestmentFormData, customDuration: string): boolean {
  const { investorName, email, investmentType, amount, duration, riskProfile } = formData

  if (!investorName || !email || !investmentType || !amount || !duration || !riskProfile) {
    return false
  }

  if (duration === "custom" && (!customDuration || Number.parseInt(customDuration) <= 0)) {
    return false
  }

  if (Number.parseFloat(amount) < 100000) {
    return false
  }

  return true
}
