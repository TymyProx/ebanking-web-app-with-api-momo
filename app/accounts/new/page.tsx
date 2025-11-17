"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Building2, CheckCircle, AlertCircle, ArrowLeft, FileText, Clock, ChevronRight, Upload, User } from 'lucide-react'
import { createAccount } from "../actions"
import { saveClientAdditionalInfo } from "./actions"
import { useActionState } from "react"
import { useRouter } from 'next/navigation'
import AuthService from "@/lib/auth-service"

const accountTypes = [
  {
    id: "COURANT",
    name: "Compte Courant",
    description: "Pour vos opérations quotidiennes",
    currency: "GNF",
    minBalance: "50000",
    features: ["Carte bancaire incluse", "Chéquier gratuit", "Virements illimités", "Découvert autorisé"],
    fees: "Gratuit les 6 premiers mois",
    icon: "💳",
  },
  {
    id: "EPARGNE",
    name: "Compte Épargne",
    description: "Pour faire fructifier votre argent",
    currency: "GNF",
    minBalance: "100000",
    features: ["Taux d'intérêt attractif", "Pas de frais de tenue", "Épargne programmée", "Objectifs d'épargne"],
    fees: "Gratuit",
    icon: "🏦",
  },
  {
    id: "DEVISE",
    name: "Compte Devises",
    description: "Pour vos opérations en devises étrangères",
    currency: "USD",
    minBalance: "100",
    features: ["Multi-devises", "Virements internationaux", "Change avantageux", "Carte internationale"],
    fees: "25,000 GNF/mois",
    icon: "💵",
  },
  {
    id: "TERME",
    name: "Compte à Terme",
    description: "Pour vos placements à long terme",
    currency: "GNF",
    minBalance: "500000",
    features: ["Taux d'intérêt élevé", "Durée flexible", "Renouvellement automatique", "Garantie capital"],
    fees: "Gratuit",
    icon: "📈",
  },
]

export default function NewAccountPage() {
  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState("")
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [hasExistingAccounts, setHasExistingAccounts] = useState<boolean | null>(null)
  const [createState, createAction, isCreating] = useActionState(createAccount, null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const selectedAccountType = accountTypes.find((type) => type.id === selectedType)

  useEffect(() => {
    async function checkExistingAccounts() {
      try {
        const user = AuthService.getCurrentUser()
        if (!user) {
          setHasExistingAccounts(false)
          return
        }

        const response = await fetch(`/api/accounts/check-existing`)
        if (response.ok) {
          const data = await response.json()
          setHasExistingAccounts(data.hasActiveAccounts)
          console.log("[v0] Has existing accounts:", data.hasActiveAccounts)
        } else {
          setHasExistingAccounts(false)
        }
      } catch (error) {
        console.error("[v0] Error checking accounts:", error)
        setHasExistingAccounts(false)
      }
    }

    checkExistingAccounts()
  }, [])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = async (field: string, file: File) => {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload-id-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      console.log("[v0] Image uploaded successfully:", data.url)
      
      // Store the Blob URL in form data
      handleInputChange(field, data.url)
    } catch (error) {
      console.error("[v0] Error uploading image:", error)
      alert("Erreur lors du téléchargement de l'image")
    }
  }

  const formatAmount = (amount: string, currency: string) => {
    const num = Number.parseFloat(amount) || 0
    return new Intl.NumberFormat("fr-FR").format(num)
  }

  const canProceedToStep2 = selectedType !== ""
  const canProceedToStep3 = hasExistingAccounts !== null 
    ? (hasExistingAccounts 
      ? (formData.accountName && formData.currency && formData.accountPurpose)
      : (formData.accountName && formData.currency && formData.accountPurpose &&
         formData.country && formData.city && formData.addressLine1 && 
         formData.idType && formData.idNumber && formData.idIssuingCountry &&
         formData.idIssueDate && formData.idExpiryDate))
    : false
  const canSubmit = formData.terms && formData.dataProcessing

  useEffect(() => {
    if (createState?.success) {
      setSuccess(true)
      const timer = setTimeout(() => {
        setSuccess(false)
        setStep(1)
        setSelectedType("")
        setFormData({})
        router.refresh()
      }, 10000)

      return () => clearTimeout(timer)
    }
  }, [createState, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!hasExistingAccounts) {
      try {
        const user = AuthService.getCurrentUser()
        if (!user) {
          throw new Error("User not found")
        }

        const additionalInfoData = {
          clientId: user.id,
          country: formData.country,
          city: formData.city,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2 || "",
          postalCode: formData.postalCode || "",
          idType: formData.idType,
          idNumber: formData.idNumber,
          idIssuingCountry: formData.idIssuingCountry,
          idIssueDate: formData.idIssueDate,
          idExpiryDate: formData.idExpiryDate,
          idFrontImageUrl: formData.idFrontImageUrl || "",
          idBackImageUrl: formData.idBackImageUrl || "",
        }

        const result = await saveClientAdditionalInfo(additionalInfoData)
        
        if (!result.success) {
          alert(result.error || "Erreur lors de l'enregistrement des informations")
          return
        }
        
        console.log("[v0] Client additional info saved successfully")
      } catch (error) {
        console.error("[v0] Error saving client info:", error)
        alert("Erreur lors de l'enregistrement des informations")
        return
      }
    }

    const form = e.target as HTMLFormElement
    form.requestSubmit()
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <CardTitle className="text-green-900">Demande envoyée avec succès!</CardTitle>
                  <CardDescription className="text-green-700">
                    Votre demande d'ouverture de compte a été enregistrée
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-green-800 text-sm">Vous recevrez un e-mail dès que le statut de votre compte sera mis à jour.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-center space-x-2">
        <div>
          <h1 className="text-3xl font-bold text-primary">Demande d'Ouverture de Compte Bancaire</h1>
          <p className="text-sm text-muted-foreground">Choisissez le compte qui correspond à vos besoins</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all ${
                s <= step ? "bg-primary text-white shadow-lg" : "bg-gray-200 text-gray-500"
              }`}
            >
              {s < step ? <CheckCircle className="w-4 h-4" /> : s}
            </div>
            {s < 3 && (
              <div
                className={`flex-1 h-0.5 mx-1 rounded-full transition-all ${s < step ? "bg-primary" : "bg-gray-200"}`}
              />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Building2 className="w-5 h-5 text-primary" />
              <span>Choisissez votre type de compte</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {accountTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => {
                    setSelectedType(type.id)
                    handleInputChange("accountType", type.id)
                  }}
                  className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg ${
                    selectedType === type.id
                      ? "border-primary bg-gradient-to-br from-primary/5 to-secondary/5 shadow-md"
                      : "border-gray-200 hover:border-primary/50"
                  }`}
                >
                  {selectedType === type.id && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <h3 className="text-sm font-bold mb-1">{type.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{type.description}</p>
                  <div className="space-y-1 mb-2">
                    {type.features.slice(0, 2).map((feature, idx) => (
                      <div key={idx} className="flex items-center text-xs">
                        <CheckCircle className="w-3 h-3 text-primary mr-1 flex-shrink-0" />
                        <span className="line-clamp-1">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-gray-200 space-y-1">
                    <div className="text-xs">
                      <span className="text-muted-foreground">Frais: </span>
                      <span className="font-semibold text-primary">{type.fees}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2}
                className="bg-primary hover:opacity-90 transition-opacity h-9"
              >
                Continuer
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && selectedAccountType && (
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <FileText className="w-5 h-5 text-primary" />
              <span>Détails du compte {!hasExistingAccounts && "et informations personnelles"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="accountName" className="text-sm">
                  Intitulé du Compte *
                </Label>
                <Input
                  id="accountName"
                  placeholder="Ex: Mon Compte Courant"
                  value={formData.accountName || ""}
                  onChange={(e) => handleInputChange("accountName", e.target.value)}
                  className="border-2 focus:border-primary h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="currency" className="text-sm">
                  Devise *
                </Label>
                <Select value={formData.currency || ""} onValueChange={(value) => handleInputChange("currency", value)}>
                  <SelectTrigger className="border-2 focus:border-primary h-9 text-sm">
                    <SelectValue placeholder="Dévise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GNF">GNF</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="accountPurpose" className="text-sm">
                  Objectif du Compte *
                </Label>
                <Select
                  value={formData.accountPurpose}
                  onValueChange={(value) => handleInputChange("accountPurpose", value)}
                >
                  <SelectTrigger className="border-2 focus:border-primary h-9 text-sm">
                    <SelectValue placeholder="Objectif" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personnel</SelectItem>
                    <SelectItem value="business">Professionnel</SelectItem>
                    <SelectItem value="savings">Épargne</SelectItem>
                    <SelectItem value="investment">Investissement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!hasExistingAccounts && (
              <>
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-primary mb-3 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Informations Personnelles
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div className="space-y-1">
                      <Label htmlFor="country" className="text-sm">
                        Pays *
                      </Label>
                      <Input
                        id="country"
                        placeholder="Ex: Guinée"
                        value={formData.country || ""}
                        onChange={(e) => handleInputChange("country", e.target.value)}
                        className="border-2 focus:border-primary h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="city" className="text-sm">
                        Ville *
                      </Label>
                      <Input
                        id="city"
                        placeholder="Ex: Conakry"
                        value={formData.city || ""}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        className="border-2 focus:border-primary h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="postalCode" className="text-sm">
                        Code Postal
                      </Label>
                      <Input
                        id="postalCode"
                        placeholder="Ex: BP 123"
                        value={formData.postalCode || ""}
                        onChange={(e) => handleInputChange("postalCode", e.target.value)}
                        className="border-2 focus:border-primary h-9 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div className="space-y-1">
                      <Label htmlFor="addressLine1" className="text-sm">
                        Adresse ligne 1 *
                      </Label>
                      <Input
                        id="addressLine1"
                        placeholder="Ex: 123 Avenue de la République"
                        value={formData.addressLine1 || ""}
                        onChange={(e) => handleInputChange("addressLine1", e.target.value)}
                        className="border-2 focus:border-primary h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="addressLine2" className="text-sm">
                        Adresse ligne 2
                      </Label>
                      <Input
                        id="addressLine2"
                        placeholder="Ex: Quartier Kaloum"
                        value={formData.addressLine2 || ""}
                        onChange={(e) => handleInputChange("addressLine2", e.target.value)}
                        className="border-2 focus:border-primary h-9 text-sm"
                      />
                    </div>
                  </div>

                  <h4 className="text-sm font-semibold text-primary mb-3 mt-4">
                    Pièce d'Identité
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div className="space-y-1">
                      <Label htmlFor="idType" className="text-sm">
                        Type de Pièce *
                      </Label>
                      <Select
                        value={formData.idType || ""}
                        onValueChange={(value) => handleInputChange("idType", value)}
                      >
                        <SelectTrigger className="border-2 focus:border-primary h-9 text-sm">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CNI">Carte Nationale d'Identité</SelectItem>
                          <SelectItem value="PASSPORT">Passeport</SelectItem>
                          <SelectItem value="DRIVER_LICENSE">Permis de Conduire</SelectItem>
                          <SelectItem value="RESIDENCE_PERMIT">Titre de Séjour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="idNumber" className="text-sm">
                        Numéro de Pièce *
                      </Label>
                      <Input
                        id="idNumber"
                        placeholder="Ex: CNI123456789"
                        value={formData.idNumber || ""}
                        onChange={(e) => handleInputChange("idNumber", e.target.value)}
                        className="border-2 focus:border-primary h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="idIssuingCountry" className="text-sm">
                        Pays d'Émission *
                      </Label>
                      <Input
                        id="idIssuingCountry"
                        placeholder="Ex: Guinée"
                        value={formData.idIssuingCountry || ""}
                        onChange={(e) => handleInputChange("idIssuingCountry", e.target.value)}
                        className="border-2 focus:border-primary h-9 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div className="space-y-1">
                      <Label htmlFor="idIssueDate" className="text-sm">
                        Date d'Émission *
                      </Label>
                      <Input
                        id="idIssueDate"
                        type="date"
                        value={formData.idIssueDate || ""}
                        onChange={(e) => handleInputChange("idIssueDate", e.target.value)}
                        className="border-2 focus:border-primary h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="idExpiryDate" className="text-sm">
                        Date d'Expiration *
                      </Label>
                      <Input
                        id="idExpiryDate"
                        type="date"
                        value={formData.idExpiryDate || ""}
                        onChange={(e) => handleInputChange("idExpiryDate", e.target.value)}
                        className="border-2 focus:border-primary h-9 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="idFrontImage" className="text-sm">
                        Photo Recto de la Pièce
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="idFrontImage"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload("idFrontImageUrl", file)
                          }}
                          className="border-2 focus:border-primary h-9 text-sm"
                        />
                        <Upload className="w-4 h-4 text-muted-foreground" />
                      </div>
                      {formData.idFrontImageUrl && (
                        <div className="mt-2">
                          <img 
                            src={formData.idFrontImageUrl || "/placeholder.svg"} 
                            alt="Recto ID" 
                            className="w-32 h-20 object-cover rounded border"
                          />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="idBackImage" className="text-sm">
                        Photo Verso de la Pièce
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="idBackImage"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload("idBackImageUrl", file)
                          }}
                          className="border-2 focus:border-primary h-9 text-sm"
                        />
                        <Upload className="w-4 h-4 text-muted-foreground" />
                      </div>
                      {formData.idBackImageUrl && (
                        <div className="mt-2">
                          <img 
                            src={formData.idBackImageUrl || "/placeholder.svg"} 
                            alt="Verso ID" 
                            className="w-32 h-20 object-cover rounded border"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-between pt-2">
              <Button onClick={() => setStep(1)} variant="outline" size="sm">
                <ArrowLeft className="w-3 h-3 mr-1" />
                Retour
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!canProceedToStep3}
                className="bg-primary hover:opacity-90 transition-opacity"
                size="sm"
              >
                Continuer
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && selectedAccountType && (
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span>Récapitulatif et Validation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="p-2 rounded bg-gradient-to-br from-primary/5 to-secondary/5">
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="text-sm font-semibold">{selectedAccountType.name}</p>
              </div>
              <div className="p-2 rounded bg-gradient-to-br from-primary/5 to-secondary/5">
                <p className="text-sm text-muted-foreground">Nom</p>
                <p className="text-sm font-semibold">{formData.accountName}</p>
              </div>
              <div className="p-2 rounded bg-gradient-to-br from-primary/5 to-secondary/5">
                <p className="text-sm text-muted-foreground">Dévise</p>
                <p className="text-sm font-semibold">{formData.currency}</p>
              </div>
            </div>

            <div className="space-y-2 p-3 rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.terms || false}
                  onCheckedChange={(checked) => handleInputChange("terms", checked)}
                  className="mt-0.5"
                />
                <Label htmlFor="terms" className="text-xs leading-tight cursor-pointer">
                  J'accepte les{" "}
                  <a href="#" className="text-primary hover:underline font-semibold">
                    conditions générales
                  </a>
                </Label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="dataProcessing"
                  checked={formData.dataProcessing || false}
                  onCheckedChange={(checked) => handleInputChange("dataProcessing", checked)}
                  className="mt-0.5"
                />
                <Label htmlFor="dataProcessing" className="text-xs leading-tight cursor-pointer">
                  J'autorise le traitement de mes données personnelles
                </Label>
              </div>
            </div>
            <form action={createAction}>
              <input type="hidden" name="accountId" value={`ACC_${Date.now()}`} />
              <input type="hidden" name="customerId" value="CUSTOMER_ID_PLACEHOLDER" />
              <input type="hidden" name="accountNumber" value={`000${Date.now().toString().slice(-7)}`} />
              <input type="hidden" name="accountName" value={formData.accountName || ""} />
              <input type="hidden" name="currency" value={formData.currency || selectedAccountType.currency} />
              <input type="hidden" name="bookBalance" value={formData.initialDeposit || "0"} />
              <input type="hidden" name="availableBalance" value={formData.initialDeposit || "0"} />
              <input type="hidden" name="accountType" value={selectedType} />
              <div className="flex justify-between pt-2">
                <Button onClick={() => setStep(2)} variant="outline" size="sm" type="button">
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  Retour
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating || !canSubmit}
                  className="bg-primary hover:opacity-90 transition-opacity"
                  size="sm"
                  onClick={handleSubmit}
                >
                  {isCreating ? (
                    <>
                      <Clock className="w-3 h-3 mr-1 animate-spin" />
                      Soumission...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Soumettre
                    </>
                  )}
                </Button>
              </div>
            </form>

            {createState?.error && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-3 w-3" />
                <AlertDescription className="text-xs">{createState.error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
