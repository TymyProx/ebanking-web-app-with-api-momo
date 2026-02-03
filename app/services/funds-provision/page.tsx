"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  HandCoins,
  CheckCircle,
  AlertCircle,
  Shield,
  Clock,
  DollarSign,
  User,
  Calendar,
  CreditCard,
  Smartphone,
  BanknoteIcon,
} from "lucide-react"
import { createFundsProvision, validateFundsProvision } from "./actions"

interface FundsProvisionData {
  amount: number
  sourceAccount: string
  destinationAccount: string
  destinationName: string
  purpose: string
  recoveryMode: string
  provisionDate: string
  hasBlocking: boolean
  blockingEndDate: string
  description: string
}

export default function FundsProvisionPage() {
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState<FundsProvisionData>({
    amount: 0,
    sourceAccount: "",
    destinationAccount: "",
    destinationName: "",
    purpose: "",
    recoveryMode: "",
    provisionDate: new Date().toISOString().split("T")[0],
    hasBlocking: false,
    blockingEndDate: "",
    description: "",
  })
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [result, setResult] = useState<{ success: boolean; message: string; reference?: string } | null>(null)

  const handleInputChange = (field: keyof FundsProvisionData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation côté client
    if (formData.amount <= 0) {
      setResult({
        success: false,
        message: "Le montant doit être strictement supérieur à zéro.",
      })
      return
    }

    if (!formData.sourceAccount || !formData.destinationAccount) {
      setResult({
        success: false,
        message: "Veuillez sélectionner les comptes source et destination.",
      })
      return
    }

    if (formData.hasBlocking && formData.blockingEndDate <= formData.provisionDate) {
      setResult({
        success: false,
        message: "La date de fin de blocage doit être postérieure à la date de mise à disposition.",
      })
      return
    }

    setShowConfirmation(true)

    // Simuler l'envoi d'OTP
    startTransition(async () => {
      const otpResult = await validateFundsProvision(new FormData())
      // OTP envoyé automatiquement
    })
  }

  const handleConfirmProvision = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setResult({
        success: false,
        message: "Veuillez saisir un code OTP valide à 6 chiffres",
      })
      return
    }

    startTransition(async () => {
      try {
        const formDataToSend = new FormData()
        formDataToSend.append("amount", formData.amount.toString())
        formDataToSend.append("sourceAccount", formData.sourceAccount)
        formDataToSend.append("destinationAccount", formData.destinationAccount)
        formDataToSend.append("destinationName", formData.destinationName)
        formDataToSend.append("purpose", formData.purpose)
        formDataToSend.append("recoveryMode", formData.recoveryMode)
        formDataToSend.append("provisionDate", formData.provisionDate)
        formDataToSend.append("hasBlocking", formData.hasBlocking.toString())
        formDataToSend.append("blockingEndDate", formData.blockingEndDate)
        formDataToSend.append("description", formData.description)
        formDataToSend.append("otpCode", otpCode)

        const provisionResult = await createFundsProvision(formDataToSend)
        setResult(provisionResult)
        setShowConfirmation(false)

        if (provisionResult.success) {
          // Réinitialiser le formulaire
          setFormData({
            amount: 0,
            sourceAccount: "",
            destinationAccount: "",
            destinationName: "",
            purpose: "",
            recoveryMode: "",
            provisionDate: new Date().toISOString().split("T")[0],
            hasBlocking: false,
            blockingEndDate: "",
            description: "",
          })
          setOtpCode("")
        }
      } catch (error) {
        setResult({
          success: false,
          message: "Une erreur est survenue lors du traitement de la mise à disposition",
        })
        setShowConfirmation(false)
      }
    })
  }

  const getRecoveryModeIcon = (mode: string) => {
    switch (mode) {
      case "cash":
        return <BanknoteIcon className="h-4 w-4" />
      case "transfer":
        return <CreditCard className="h-4 w-4" />
      case "card":
        return <Smartphone className="h-4 w-4" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  const getRecoveryModeLabel = (mode: string) => {
    switch (mode) {
      case "cash":
        return "Espèces"
      case "transfer":
        return "Virement"
      case "card":
        return "Carte bancaire"
      default:
        return "Non défini"
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mise à Disposition de Fonds</h1>
        <p className="text-gray-600">
          Transférez temporairement des fonds vers un compte tiers avec suivi et traçabilité
        </p>
      </div>

      {result && (
        <Alert className={`mb-6 ${result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
          <div className="flex items-center">
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={`ml-2 ${result.success ? "text-green-800" : "text-red-800"}`}>
              {result.message}
              {result.reference && <div className="mt-2 font-mono text-sm">Référence : {result.reference}</div>}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HandCoins className="h-5 w-5 mr-2" />
                  Informations de la Mise à Disposition
                </CardTitle>
                <CardDescription>Définissez les paramètres du transfert temporaire de fonds</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Montant à transférer (GNF) *</Label>
                    <Input
                      id="amount"
                      type="text"
                      inputMode="numeric"
                      value={formData.amount || ""}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, "")
                        handleInputChange("amount", Number.parseFloat(cleaned) || 0)
                      }}
                      placeholder="0"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="provisionDate">Date de mise à disposition *</Label>
                    <Input
                      id="provisionDate"
                      type="date"
                      value={formData.provisionDate}
                      onChange={(e) => handleInputChange("provisionDate", e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sourceAccount">Compte source *</Label>
                    <Select onValueChange={(value) => handleInputChange("sourceAccount", value)} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez le compte débiteur" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GN001234567890123456">
                          GN001234567890123456 - Compte Principal (8,450,000 GNF)
                        </SelectItem>
                        <SelectItem value="GN001234567890123457">
                          GN001234567890123457 - Compte Opérations (12,200,000 GNF)
                        </SelectItem>
                        <SelectItem value="GN001234567890123458">
                          GN001234567890123458 - Compte Avances (3,800,000 GNF)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="destinationAccount">Compte destination *</Label>
                    <Input
                      id="destinationAccount"
                      value={formData.destinationAccount}
                      onChange={(e) => handleInputChange("destinationAccount", e.target.value)}
                      placeholder="GN001234567890123456"
                      pattern="GN\d{18}"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="destinationName">Nom du bénéficiaire *</Label>
                    <Input
                      id="destinationName"
                      value={formData.destinationName}
                      onChange={(e) => handleInputChange("destinationName", e.target.value)}
                      placeholder="Nom du client ou agent"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="recoveryMode">Mode de récupération *</Label>
                    <Select onValueChange={(value) => handleInputChange("recoveryMode", value)} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Comment récupérer les fonds" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">
                          <div className="flex items-center">
                            <BanknoteIcon className="h-4 w-4 mr-2" />
                            Espèces
                          </div>
                        </SelectItem>
                        <SelectItem value="transfer">
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Virement bancaire
                          </div>
                        </SelectItem>
                        <SelectItem value="card">
                          <div className="flex items-center">
                            <Smartphone className="h-4 w-4 mr-2" />
                            Carte bancaire
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="purpose">Objet du versement *</Label>
                  <Select onValueChange={(value) => handleInputChange("purpose", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Motif de la mise à disposition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="advance">Avance sur salaire</SelectItem>
                      <SelectItem value="field_operation">Opération terrain</SelectItem>
                      <SelectItem value="mission">Mission professionnelle</SelectItem>
                      <SelectItem value="emergency">Fonds d'urgence</SelectItem>
                      <SelectItem value="project">Financement projet</SelectItem>
                      <SelectItem value="other">Autre motif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description complémentaire</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Détails supplémentaires sur la mise à disposition..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Options de Blocage Temporaire
                </CardTitle>
                <CardDescription>Configurez une période de blocage des fonds (optionnel)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="hasBlocking"
                    checked={formData.hasBlocking}
                    onCheckedChange={(checked) => handleInputChange("hasBlocking", checked)}
                  />
                  <Label htmlFor="hasBlocking">Activer le blocage temporaire des fonds</Label>
                </div>

                {formData.hasBlocking && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg space-y-4">
                    <div className="flex items-center text-orange-800">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      <p className="font-medium">Blocage temporaire activé</p>
                    </div>
                    <div>
                      <Label htmlFor="blockingEndDate">Date de fin de blocage *</Label>
                      <Input
                        id="blockingEndDate"
                        type="date"
                        value={formData.blockingEndDate}
                        onChange={(e) => handleInputChange("blockingEndDate", e.target.value)}
                        min={formData.provisionDate}
                        required={formData.hasBlocking}
                      />
                      <p className="text-xs text-orange-600 mt-1">
                        Les fonds seront bloqués jusqu'à cette date et libérés automatiquement
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => window.history.back()}>
                Annuler
              </Button>
              <Button type="submit" disabled={isPending}>
                <Shield className="h-4 w-4 mr-2" />
                {isPending ? "Validation..." : "Valider la mise à disposition"}
              </Button>
            </div>
          </form>
        </div>

        {/* Sidebar récapitulatif */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                  <span className="text-sm">Montant</span>
                </div>
                <Badge variant="secondary">{formData.amount.toLocaleString()} GNF</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-blue-600" />
                  <span className="text-sm">Bénéficiaire</span>
                </div>
                <Badge variant="secondary">{formData.destinationName || "Non défini"}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-orange-600" />
                  <span className="text-sm">Date prévue</span>
                </div>
                <Badge variant="secondary">{formData.provisionDate || "Aujourd'hui"}</Badge>
              </div>

              {formData.recoveryMode && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getRecoveryModeIcon(formData.recoveryMode)}
                    <span className="text-sm ml-2">Récupération</span>
                  </div>
                  <Badge variant="secondary">{getRecoveryModeLabel(formData.recoveryMode)}</Badge>
                </div>
              )}

              {formData.hasBlocking && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-red-600" />
                    <span className="text-sm">Blocage jusqu'au</span>
                  </div>
                  <Badge variant="destructive">{formData.blockingEndDate || "Non défini"}</Badge>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Limites disponibles</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Plafond journalier</span>
                    <Badge variant="outline">15,000,000 GNF</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Utilisé aujourd'hui</span>
                    <Badge variant="outline">2,500,000 GNF</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Disponible</span>
                    <Badge variant="default">12,500,000 GNF</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sécurité & Traçabilité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm">
                <Shield className="h-4 w-4 mr-2 text-green-600" />
                <span>Signature électronique requise</span>
              </div>
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-2 text-blue-600" />
                <span>Suivi en temps réel</span>
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle className="h-4 w-4 mr-2 text-orange-600" />
                <span>Journalisation complète</span>
              </div>
              <div className="flex items-center text-sm">
                <AlertCircle className="h-4 w-4 mr-2 text-purple-600" />
                <span>Notification automatique</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog Confirmation OTP */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmation de Mise à Disposition</DialogTitle>
            <DialogDescription>Un code de confirmation a été envoyé à votre téléphone et email</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center text-blue-800">
                <HandCoins className="h-5 w-5 mr-2" />
                <div>
                  <p className="font-medium">Mise à disposition sécurisée</p>
                  <p className="text-sm">
                    Montant : {formData.amount.toLocaleString()} GNF pour {formData.destinationName}
                  </p>
                  {formData.hasBlocking && <p className="text-sm">Blocage jusqu'au {formData.blockingEndDate}</p>}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="otpCode">Code de confirmation (6 chiffres)</Label>
              <Input
                id="otpCode"
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="text-center text-lg tracking-widest"
              />
              <p className="text-xs text-gray-500 mt-1">Code valide pendant 5 minutes</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>
              Annuler
            </Button>
            <Button onClick={handleConfirmProvision} disabled={isPending || otpCode.length !== 6}>
              {isPending ? "Traitement..." : "Confirmer la mise à disposition"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
