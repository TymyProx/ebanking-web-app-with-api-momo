"use client"

import type React from "react"

import { useState, useEffect, startTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Building2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  FileText,
  Clock,
  ChevronRight,
  Upload,
  User,
  MapPin,
  CreditCard,
  FileCheck,
  Image as ImageIcon,
} from "lucide-react"
import { createAccount } from "../actions"
import { saveClientAdditionalInfo } from "./actions"
import { useActionState } from "react"
import { useRouter } from "next/navigation"
import AuthService from "@/lib/auth-service"

const accountTypes = [
  {
    id: "COURANT_CHEQUE",
    name: "Compte courant chèque",
    description: "Pour vos opérations quotidiennes avec chéquier",
    currency: "GNF",
    minBalance: "50000",
    features: ["Carte bancaire incluse", "Chéquier", "Virements illimités", "Découvert autorisé"],
    // fees: "Gratuit les 6 premiers mois",
    icon: "💳",
  },
  {
    id: "EPARGNE_ORDINAIRE",
    name: "Compte épargne ordinaire",
    description: "Pour faire fructifier votre argent en toute sécurité",
    currency: "GNF",
    minBalance: "100000",
    features: ["Taux d'intérêt attractif", "Pas de frais de tenue", "Épargne programmée", "Objectifs d'épargne"],
    //fees: "Gratuit",
    icon: "🏦",
  },
  {
    id: "MINEUR",
    name: "Compte mineur",
    description: "Pour préparer l'avenir de vos enfants",
    currency: "GNF",
    minBalance: "25000",
    features: ["Pas de frais jusqu'à 18 ans", "Taux d'intérêt bonifié", "Épargne sécurisée", "Éducation financière"],
    // fees: "Gratuit",
    icon: "👦🏽",
  },
  {
    id: "WALLET",
    name: "Compte Wallet",
    description: "Compte mobile pour vos paiements digitaux",
    currency: "GNF",
    minBalance: "10000",
    features: ["Paiements mobiles", "Retraits sans carte", "Transactions instantanées", "Application mobile"],
    // fees: "Gratuit",
    icon: "📱",
  },
]

// Données des pays et villes
const countriesAndCities: Record<string, string[]> = {
  Guinée: ["Conakry", "Kankan", "Labé", "Nzérékoré", "Kindia", "Mamou", "Boké", "Faranah"],
  France: ["Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier"],
  Sénégal: ["Dakar", "Thiès", "Kaolack", "Saint-Louis", "Ziguinchor", "Diourbel", "Louga"],
  "Côte d'Ivoire": ["Abidjan", "Bouaké", "Daloa", "Yamoussoukro", "San-Pédro", "Korhogo"],
  Mali: ["Bamako", "Sikasso", "Mopti", "Koutiala", "Kayes", "Ségou", "Gao"],
}

export default function NewAccountPage() {
  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState("")
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [hasExistingAccounts, setHasExistingAccounts] = useState<boolean | null>(null)
  const [hasClientInfo, setHasClientInfo] = useState<boolean | null>(null)
  const [createState, createAction, isCreating] = useActionState(createAccount, null)
  const [success, setSuccess] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<string>("")
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const router = useRouter()

  const selectedAccountType = accountTypes.find((type) => type.id === selectedType)

  useEffect(() => {
    async function checkExistingAccounts() {
      try {
        const user = AuthService.getCurrentUser()
        if (!user) {
          console.log("[v0] No user found")
          setHasExistingAccounts(false)
          return
        }

        const response = await fetch(`/api/accounts/check-existing`)
        if (response.ok) {
          const data = await response.json()
          setHasExistingAccounts(data.hasActiveAccounts)
          console.log("[v0] Has existing accounts:", data.hasActiveAccounts)
        } else {
          console.log("[v0] Error response from check-existing")
          setHasExistingAccounts(false)
        }
      } catch (error) {
        console.error("[v0] Error checking accounts:", error)
        setHasExistingAccounts(false)
      }
    }

    async function checkClientInfo() {
      try {
        const response = await fetch(`/api/client-info/check`)
        if (response.ok) {
          const data = await response.json()
          setHasClientInfo(data.hasClientInfo)
          console.log("[v0] Has client info:", data.hasClientInfo)
          console.log("[v0] Full response data:", data)
        } else {
          console.log("[v0] Error response from client-info/check:", response.status)
          setHasClientInfo(false)
        }
      } catch (error) {
        console.error("[v0] Error checking client info:", error)
        setHasClientInfo(false)
      }
    }

    checkExistingAccounts()
    checkClientInfo()
  }, [])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Mettre à jour les villes disponibles quand le pays change
  useEffect(() => {
    if (selectedCountry) {
      setAvailableCities(countriesAndCities[selectedCountry] || [])
      // Réinitialiser la ville si le pays change
      if (formData.country !== selectedCountry) {
        handleInputChange("city", "")
      }
    } else {
      setAvailableCities([])
    }
  }, [selectedCountry])

  // Synchroniser selectedCountry avec formData.country
  useEffect(() => {
    if (formData.country) {
      setSelectedCountry(formData.country)
    }
  }, [formData.country])

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

  const canProceedToStep3 =
    hasClientInfo !== null
      ? hasClientInfo
        ? // Le client a déjà des informations complémentaires enregistrées → seuls les champs de base sont requis
          selectedType === "MINEUR"
          ? formData.accountName &&
            formData.currency &&
            formData.accountPurpose &&
            formData.minorFirstName &&
            formData.minorLastName &&
            formData.minorDateOfBirth
          : formData.accountName && formData.currency && formData.accountPurpose
        : // Aucun enregistrement dans clientAdditionalInfo → on exige aussi les informations complémentaires
          selectedType === "MINEUR"
          ? formData.accountName &&
            formData.currency &&
            formData.accountPurpose &&
            formData.country &&
            formData.city &&
            formData.addressLine1 &&
            formData.idType &&
            formData.idNumber &&
            formData.idIssuingCountry &&
            formData.idIssueDate &&
            formData.idExpiryDate &&
            formData.minorFirstName &&
            formData.minorLastName &&
            formData.minorDateOfBirth
          : formData.accountName &&
            formData.currency &&
            formData.accountPurpose &&
            formData.country &&
            formData.city &&
            formData.addressLine1 &&
            formData.idType &&
            formData.idNumber &&
            formData.idIssuingCountry &&
            formData.idIssueDate &&
            formData.idExpiryDate
      : false

  const canSubmit = formData.terms && formData.dataProcessing

  useEffect(() => {
    if (createState?.success) {
      setSuccess(true)
      router.refresh()

      const timer = setTimeout(() => {
        setSuccess(false)
        setStep(1)
        setSelectedType("")
        setFormData({})
        window.location.reload()
      }, 10000)

      return () => clearTimeout(timer)
    }
  }, [createState, router])

  const shouldShowAdditionalFields = hasClientInfo === false

  // Log for debugging
  useEffect(() => {
    console.log("[v0] Should show additional fields:", shouldShowAdditionalFields, {
      hasExistingAccounts,
      hasClientInfo,
    })
  }, [shouldShowAdditionalFields, hasExistingAccounts, hasClientInfo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (hasClientInfo === false) {
      try {
        const user = AuthService.getCurrentUser()
        if (!user) {
          throw new Error("User not found")
        }

        const additionalInfoData: any = {
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
          // Documents généraux
          identityPhoto1Url: formData.identityPhoto1Url || "",
          identityPhoto2Url: formData.identityPhoto2Url || "",
          residenceCertificateUrl: formData.residenceCertificateUrl || "",
          utilityBillUrl: formData.utilityBillUrl || "",
          accountOpeningRequestUrl: formData.accountOpeningRequestUrl || "",
        }

        if (formData.accountType === "MINEUR") {
          additionalInfoData.minorFirstName = formData.minorFirstName
          additionalInfoData.minorLastName = formData.minorLastName
          additionalInfoData.minorDateOfBirth = formData.minorDateOfBirth
          additionalInfoData.minorBirthCertificateUrl = formData.minorBirthCertificateUrl || ""
          additionalInfoData.minorIdentityPhoto1Url = formData.minorIdentityPhoto1Url || ""
          additionalInfoData.minorIdentityPhoto2Url = formData.minorIdentityPhoto2Url || ""
          additionalInfoData.guardianIdentityPhoto1Url = formData.guardianIdentityPhoto1Url || ""
          additionalInfoData.guardianIdentityPhoto2Url = formData.guardianIdentityPhoto2Url || ""
          additionalInfoData.guardianUtilityBillUrl = formData.guardianUtilityBillUrl || ""
          additionalInfoData.guardianResidenceCertificateUrl = formData.guardianResidenceCertificateUrl || ""
        }

        const result = await saveClientAdditionalInfo(additionalInfoData)

        if (!result.success) {
          alert(result.error || "Erreur lors de l'enregistrement des informations")
          return
        }
      } catch (error) {
        console.error("Error saving client info:", error)
        alert("Erreur lors de l'enregistrement des informations")
        return
      }
    }

    const form = e.target as HTMLFormElement
    const formDataObj = new FormData(form)
    startTransition(async () => {
      await createAction(formDataObj)
    })
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
              <p className="text-green-800 text-sm">
                Un e-mail récapitulatif a été envoyé à votre adresse pour confirmer la prise en compte de votre demande.
              </p>
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
                  {/* <div className="pt-2 border-t border-gray-200 space-y-1">
                    <div className="text-xs">
                      <span className="text-muted-foreground">Frais: </span>
                      <span className="font-semibold text-primary">{type.fees}</span>
                    </div>
                  </div> */}
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
        <div className="space-y-6">
          {/* Section: Informations du Compte */}
          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Building2 className="w-5 h-5 text-primary" />
                <span>Informations du Compte</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Renseignez les détails de base de votre nouveau compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountName" className="text-sm font-medium">
                    Intitulé du Compte *
                  </Label>
                  <Input
                    id="accountName"
                    placeholder="Ex: Mon Compte Courant"
                    value={formData.accountName || ""}
                    onChange={(e) => handleInputChange("accountName", e.target.value)}
                    className="border-2 focus:border-primary h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-sm font-medium">
                    Devise *
                  </Label>
                  <Select value={formData.currency || ""} onValueChange={(value) => handleInputChange("currency", value)}>
                    <SelectTrigger className="border-2 focus:border-primary h-10">
                      <SelectValue placeholder="Sélectionnez une devise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GNF">GNF - Franc Guinéen</SelectItem>
                      <SelectItem value="USD">USD - Dollar US</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountPurpose" className="text-sm font-medium">
                    Objectif du Compte *
                  </Label>
                  <Select
                    value={formData.accountPurpose}
                    onValueChange={(value) => handleInputChange("accountPurpose", value)}
                  >
                    <SelectTrigger className="border-2 focus:border-primary h-10">
                      <SelectValue placeholder="Sélectionnez un objectif" />
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
            </CardContent>
          </Card>

          {/* Section: Informations du Mineur (si compte mineur et utilisateur existant) */}
          {(hasExistingAccounts || hasClientInfo) && selectedType === "MINEUR" && (
            <Card className="border-2 border-primary/20 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <User className="w-5 h-5 text-primary" />
                  <span>Informations du Mineur</span>
                </CardTitle>
                <CardDescription className="text-sm">
                  Renseignez les informations du titulaire mineur du compte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minorFirstName" className="text-sm font-medium">
                      Prénom du Mineur *
                    </Label>
                    <Input
                      id="minorFirstName"
                      placeholder="Ex: Amadou"
                      value={formData.minorFirstName || ""}
                      onChange={(e) => handleInputChange("minorFirstName", e.target.value)}
                      className="border-2 focus:border-primary h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minorLastName" className="text-sm font-medium">
                      Nom du Mineur *
                    </Label>
                    <Input
                      id="minorLastName"
                      placeholder="Ex: Diallo"
                      value={formData.minorLastName || ""}
                      onChange={(e) => handleInputChange("minorLastName", e.target.value)}
                      className="border-2 focus:border-primary h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minorDateOfBirth" className="text-sm font-medium">
                      Date de Naissance *
                    </Label>
                    <Input
                      id="minorDateOfBirth"
                      type="date"
                      value={formData.minorDateOfBirth || ""}
                      onChange={(e) => handleInputChange("minorDateOfBirth", e.target.value)}
                      className="border-2 focus:border-primary h-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


          {/* Section: Informations Personnelles */}
          {shouldShowAdditionalFields && (
            <>
              <Card className="border-2 border-primary/20 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span>Adresse et Localisation</span>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Renseignez votre adresse de résidence
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-sm font-medium">
                        Pays *
                      </Label>
                      <Select
                        value={formData.country || ""}
                        onValueChange={(value) => {
                          setSelectedCountry(value)
                          handleInputChange("country", value)
                        }}
                      >
                        <SelectTrigger className="border-2 focus:border-primary h-10">
                          <SelectValue placeholder="Sélectionnez un pays" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(countriesAndCities).map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium">
                        Ville *
                      </Label>
                      <Select
                        value={formData.city || ""}
                        onValueChange={(value) => handleInputChange("city", value)}
                        disabled={!selectedCountry || availableCities.length === 0}
                      >
                        <SelectTrigger className="border-2 focus:border-primary h-10">
                          <SelectValue placeholder={selectedCountry ? "Sélectionnez une ville" : "Sélectionnez d'abord un pays"} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode" className="text-sm font-medium">
                        Code Postal
                      </Label>
                      <Input
                        id="postalCode"
                        placeholder="Ex: BP 123"
                        value={formData.postalCode || ""}
                        onChange={(e) => handleInputChange("postalCode", e.target.value)}
                        className="border-2 focus:border-primary h-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="addressLine1" className="text-sm font-medium">
                        Adresse ligne 1 *
                      </Label>
                      <Input
                        id="addressLine1"
                        placeholder="Ex: 123 Avenue de la République"
                        value={formData.addressLine1 || ""}
                        onChange={(e) => handleInputChange("addressLine1", e.target.value)}
                        className="border-2 focus:border-primary h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressLine2" className="text-sm font-medium">
                        Adresse ligne 2
                      </Label>
                      <Input
                        id="addressLine2"
                        placeholder="Ex: Quartier Kaloum"
                        value={formData.addressLine2 || ""}
                        onChange={(e) => handleInputChange("addressLine2", e.target.value)}
                        className="border-2 focus:border-primary h-10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section: Pièce d'Identité */}
              <Card className="border-2 border-primary/20 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <span>Pièce d'Identité</span>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Informations et photos de votre pièce d'identité
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="idType" className="text-sm font-medium">
                        Type de Pièce *
                      </Label>
                      <Select
                        value={formData.idType || ""}
                        onValueChange={(value) => handleInputChange("idType", value)}
                      >
                        <SelectTrigger className="border-2 focus:border-primary h-10">
                          <SelectValue placeholder="Sélectionnez un type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CNI">Carte Nationale d'Identité</SelectItem>
                          <SelectItem value="PASSPORT">Passeport</SelectItem>
                          <SelectItem value="DRIVER_LICENSE">Permis de Conduire</SelectItem>
                          <SelectItem value="RESIDENCE_PERMIT">Titre de Séjour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="idNumber" className="text-sm font-medium">
                        Numéro de Pièce *
                      </Label>
                      <Input
                        id="idNumber"
                        placeholder="Ex: CNI123456789"
                        value={formData.idNumber || ""}
                        onChange={(e) => handleInputChange("idNumber", e.target.value)}
                        className="border-2 focus:border-primary h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="idIssuingCountry" className="text-sm font-medium">
                        Pays d'Émission *
                      </Label>
                      <Input
                        id="idIssuingCountry"
                        placeholder="Ex: Guinée"
                        value={formData.idIssuingCountry || ""}
                        onChange={(e) => handleInputChange("idIssuingCountry", e.target.value)}
                        className="border-2 focus:border-primary h-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="idIssueDate" className="text-sm font-medium">
                        Date d'Émission *
                      </Label>
                      <Input
                        id="idIssueDate"
                        type="date"
                        value={formData.idIssueDate || ""}
                        onChange={(e) => handleInputChange("idIssueDate", e.target.value)}
                        className="border-2 focus:border-primary h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="idExpiryDate" className="text-sm font-medium">
                        Date d'Expiration *
                      </Label>
                      <Input
                        id="idExpiryDate"
                        type="date"
                        value={formData.idExpiryDate || ""}
                        onChange={(e) => handleInputChange("idExpiryDate", e.target.value)}
                        className="border-2 focus:border-primary h-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="idFrontImage" className="text-sm font-medium flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Photo Recto de la Pièce
                      </Label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            id="idFrontImage"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFileUpload("idFrontImageUrl", file)
                            }}
                            className="border-2 focus:border-primary h-10"
                          />
                          <Upload className="w-5 h-5 text-muted-foreground" />
                        </div>
                        {formData.idFrontImageUrl && (
                          <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                            <img
                              src={formData.idFrontImageUrl || "/placeholder.svg"}
                              alt="Recto ID"
                              className="w-full max-w-xs h-auto object-contain rounded"
                            />
                            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Photo recto téléchargée
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="idBackImage" className="text-sm font-medium flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Photo Verso de la Pièce
                      </Label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            id="idBackImage"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFileUpload("idBackImageUrl", file)
                            }}
                            className="border-2 focus:border-primary h-10"
                          />
                          <Upload className="w-5 h-5 text-muted-foreground" />
                        </div>
                        {formData.idBackImageUrl && (
                          <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                            <img
                              src={formData.idBackImageUrl || "/placeholder.svg"}
                              alt="Verso ID"
                              className="w-full max-w-xs h-auto object-contain rounded"
                            />
                            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Photo verso téléchargée
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section: Documents Requis (Compte Courant/Épargne) */}
              {shouldShowAdditionalFields && (selectedType === "COURANT_CHEQUE" || selectedType === "EPARGNE_ORDINAIRE") && (
                <Card className="border-2 border-primary/20 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-lg">
                      <FileCheck className="w-5 h-5 text-primary" />
                      <span>Documents Requis</span>
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Téléchargez les documents nécessaires pour l'ouverture de votre compte
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="identityPhoto1" className="text-sm font-medium flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          1ère Photo d'Identité Récente *
                        </Label>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              id="identityPhoto1"
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleFileUpload("identityPhoto1Url", file)
                              }}
                              className="border-2 focus:border-primary h-10"
                            />
                            <Upload className="w-5 h-5 text-muted-foreground" />
                          </div>
                          {formData.identityPhoto1Url && (
                            <div className="p-2 bg-green-50 rounded border border-green-200">
                              <img
                                src={formData.identityPhoto1Url || "/placeholder.svg"}
                                alt="Photo identité 1"
                                className="w-full max-w-xs h-auto object-contain rounded"
                              />
                              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Photo téléchargée
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="identityPhoto2" className="text-sm font-medium flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          2ème Photo d'Identité Récente *
                        </Label>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              id="identityPhoto2"
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleFileUpload("identityPhoto2Url", file)
                              }}
                              className="border-2 focus:border-primary h-10"
                            />
                            <Upload className="w-5 h-5 text-muted-foreground" />
                          </div>
                          {formData.identityPhoto2Url && (
                            <div className="p-2 bg-green-50 rounded border border-green-200">
                              <img
                                src={formData.identityPhoto2Url || "/placeholder.svg"}
                                alt="Photo identité 2"
                                className="w-full max-w-xs h-auto object-contain rounded"
                              />
                              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Photo téléchargée
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="residenceCertificate" className="text-sm font-medium flex items-center gap-2">
                          <FileCheck className="w-4 h-4" />
                          Certificat de Résidence (moins de 3 mois) *
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="residenceCertificate"
                            type="file"
                            accept=".pdf,image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFileUpload("residenceCertificateUrl", file)
                            }}
                            className="border-2 focus:border-primary h-10"
                          />
                          <Upload className="w-5 h-5 text-muted-foreground" />
                        </div>
                        {formData.residenceCertificateUrl && (
                          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Document téléchargé
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="utilityBill" className="text-sm font-medium flex items-center gap-2">
                          <FileCheck className="w-4 h-4" />
                          Facture d'Eau ou d'Électricité *
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="utilityBill"
                            type="file"
                            accept=".pdf,image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFileUpload("utilityBillUrl", file)
                            }}
                            className="border-2 focus:border-primary h-10"
                          />
                          <Upload className="w-5 h-5 text-muted-foreground" />
                        </div>
                        {formData.utilityBillUrl && (
                          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Document téléchargé
                          </p>
                        )}
                      </div>
                    </div>

                    {selectedType === "COURANT_CHEQUE" && (
                      <div className="space-y-2">
                        <Label htmlFor="accountOpeningRequest" className="text-sm font-medium flex items-center gap-2">
                          <FileCheck className="w-4 h-4" />
                          Demande d'Ouverture (si entreprise non domiciliée à la BNG)
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="accountOpeningRequest"
                            type="file"
                            accept=".pdf,image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFileUpload("accountOpeningRequestUrl", file)
                            }}
                            className="border-2 focus:border-primary h-10"
                          />
                          <Upload className="w-5 h-5 text-muted-foreground" />
                        </div>
                        {formData.accountOpeningRequestUrl && (
                          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Document téléchargé
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Section: Informations du Mineur (si compte mineur et pas d'enregistrement) */}
          {shouldShowAdditionalFields && selectedType === "MINEUR" && (
            <>
              <Card className="border-2 border-primary/20 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <User className="w-5 h-5 text-primary" />
                    <span>Informations du Mineur</span>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Renseignez les informations du titulaire mineur du compte
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minorFirstName" className="text-sm font-medium">
                        Prénom du Mineur *
                      </Label>
                      <Input
                        id="minorFirstName"
                        placeholder="Ex: Amadou"
                        value={formData.minorFirstName || ""}
                        onChange={(e) => handleInputChange("minorFirstName", e.target.value)}
                        className="border-2 focus:border-primary h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minorLastName" className="text-sm font-medium">
                        Nom du Mineur *
                      </Label>
                      <Input
                        id="minorLastName"
                        placeholder="Ex: Diallo"
                        value={formData.minorLastName || ""}
                        onChange={(e) => handleInputChange("minorLastName", e.target.value)}
                        className="border-2 focus:border-primary h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minorDateOfBirth" className="text-sm font-medium">
                        Date de Naissance *
                      </Label>
                      <Input
                        id="minorDateOfBirth"
                        type="date"
                        value={formData.minorDateOfBirth || ""}
                        onChange={(e) => handleInputChange("minorDateOfBirth", e.target.value)}
                        className="border-2 focus:border-primary h-10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section: Documents du Mineur */}
              <Card className="border-2 border-primary/20 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <FileCheck className="w-5 h-5 text-primary" />
                    <span>Documents du Mineur</span>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Téléchargez les documents nécessaires pour le compte mineur
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="minorBirthCertificate" className="text-sm font-medium flex items-center gap-2">
                      <FileCheck className="w-4 h-4" />
                      Extrait de Naissance du Mineur *
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="minorBirthCertificate"
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload("minorBirthCertificateUrl", file)
                        }}
                        className="border-2 focus:border-primary h-10"
                      />
                      <Upload className="w-5 h-5 text-muted-foreground" />
                    </div>
                    {formData.minorBirthCertificateUrl && (
                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Document téléchargé
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minorIdentityPhoto1" className="text-sm font-medium flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        1ère Photo d'Identité du Mineur *
                      </Label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            id="minorIdentityPhoto1"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFileUpload("minorIdentityPhoto1Url", file)
                            }}
                            className="border-2 focus:border-primary h-10"
                          />
                          <Upload className="w-5 h-5 text-muted-foreground" />
                        </div>
                        {formData.minorIdentityPhoto1Url && (
                          <div className="p-2 bg-green-50 rounded border border-green-200">
                            <img
                              src={formData.minorIdentityPhoto1Url || "/placeholder.svg"}
                              alt="Photo mineur 1"
                              className="w-full max-w-xs h-auto object-contain rounded"
                            />
                            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Photo téléchargée
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="minorIdentityPhoto2" className="text-sm font-medium flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        2ème Photo d'Identité du Mineur *
                      </Label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            id="minorIdentityPhoto2"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFileUpload("minorIdentityPhoto2Url", file)
                            }}
                            className="border-2 focus:border-primary h-10"
                          />
                          <Upload className="w-5 h-5 text-muted-foreground" />
                        </div>
                        {formData.minorIdentityPhoto2Url && (
                          <div className="p-2 bg-green-50 rounded border border-green-200">
                            <img
                              src={formData.minorIdentityPhoto2Url || "/placeholder.svg"}
                              alt="Photo mineur 2"
                              className="w-full max-w-xs h-auto object-contain rounded"
                            />
                            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Photo téléchargée
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section: Documents du Tuteur */}
              <Card className="border-2 border-primary/20 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <User className="w-5 h-5 text-primary" />
                    <span>Documents du Tuteur</span>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Téléchargez les documents d'identité et de résidence du tuteur légal
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="guardianIdentityPhoto1" className="text-sm font-medium flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        1ère Photo d'Identité du Tuteur *
                      </Label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            id="guardianIdentityPhoto1"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFileUpload("guardianIdentityPhoto1Url", file)
                            }}
                            className="border-2 focus:border-primary h-10"
                          />
                          <Upload className="w-5 h-5 text-muted-foreground" />
                        </div>
                        {formData.guardianIdentityPhoto1Url && (
                          <div className="p-2 bg-green-50 rounded border border-green-200">
                            <img
                              src={formData.guardianIdentityPhoto1Url || "/placeholder.svg"}
                              alt="Photo tuteur 1"
                              className="w-full max-w-xs h-auto object-contain rounded"
                            />
                            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Photo téléchargée
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="guardianIdentityPhoto2" className="text-sm font-medium flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        2ème Photo d'Identité du Tuteur *
                      </Label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            id="guardianIdentityPhoto2"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFileUpload("guardianIdentityPhoto2Url", file)
                            }}
                            className="border-2 focus:border-primary h-10"
                          />
                          <Upload className="w-5 h-5 text-muted-foreground" />
                        </div>
                        {formData.guardianIdentityPhoto2Url && (
                          <div className="p-2 bg-green-50 rounded border border-green-200">
                            <img
                              src={formData.guardianIdentityPhoto2Url || "/placeholder.svg"}
                              alt="Photo tuteur 2"
                              className="w-full max-w-xs h-auto object-contain rounded"
                            />
                            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Photo téléchargée
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="guardianUtilityBill" className="text-sm font-medium flex items-center gap-2">
                        <FileCheck className="w-4 h-4" />
                        Facture d'Eau ou d'Électricité du Tuteur *
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="guardianUtilityBill"
                          type="file"
                          accept=".pdf,image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload("guardianUtilityBillUrl", file)
                          }}
                          className="border-2 focus:border-primary h-10"
                        />
                        <Upload className="w-5 h-5 text-muted-foreground" />
                      </div>
                      {formData.guardianUtilityBillUrl && (
                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Document téléchargé
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="guardianResidenceCertificate" className="text-sm font-medium flex items-center gap-2">
                        <FileCheck className="w-4 h-4" />
                        Certificat de Résidence du Tuteur *
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="guardianResidenceCertificate"
                          type="file"
                          accept=".pdf,image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload("guardianResidenceCertificateUrl", file)
                          }}
                          className="border-2 focus:border-primary h-10"
                        />
                        <Upload className="w-5 h-5 text-muted-foreground" />
                      </div>
                      {formData.guardianResidenceCertificateUrl && (
                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Document téléchargé
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <Button onClick={() => setStep(1)} variant="outline" size="default">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!canProceedToStep3}
              className="bg-primary hover:opacity-90 transition-opacity"
              size="default"
            >
              Continuer
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && selectedAccountType && (
        <div className="space-y-6">
          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span>Récapitulatif et Validation</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Vérifiez les informations avant de soumettre votre demande
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Récapitulatif des informations du compte */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Informations du Compte
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10">
                    <p className="text-xs text-muted-foreground mb-1">Type de Compte</p>
                    <p className="text-base font-semibold text-primary">{selectedAccountType.name}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10">
                    <p className="text-xs text-muted-foreground mb-1">Intitulé</p>
                    <p className="text-base font-semibold">{formData.accountName}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10">
                    <p className="text-xs text-muted-foreground mb-1">Devise</p>
                    <p className="text-base font-semibold">{formData.currency}</p>
                  </div>
                </div>
              </div>

              {/* Acceptation des conditions */}
              <div className="space-y-3 p-4 rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10">
                <h3 className="text-sm font-semibold text-primary mb-3">Acceptation des Conditions</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="terms"
                      checked={formData.terms || false}
                      onCheckedChange={(checked) => handleInputChange("terms", checked)}
                      className="mt-0.5"
                    />
                    <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer flex-1">
                      J'accepte les{" "}
                      <a href="#" className="text-primary hover:underline font-semibold">
                        conditions générales
                      </a>{" "}
                      d'ouverture de compte *
                    </Label>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="dataProcessing"
                      checked={formData.dataProcessing || false}
                      onCheckedChange={(checked) => handleInputChange("dataProcessing", checked)}
                      className="mt-0.5"
                    />
                    <Label htmlFor="dataProcessing" className="text-sm leading-relaxed cursor-pointer flex-1">
                      J'autorise le traitement de mes données personnelles conformément à la politique de confidentialité *
                    </Label>
                  </div>
                </div>
              </div>
            <form onSubmit={handleSubmit}>
              {/* Le backend générera automatiquement accountId et accountNumber */}
              <input type="hidden" name="customerId" value="CUSTOMER_ID_PLACEHOLDER" />
              <input type="hidden" name="accountName" value={formData.accountName || ""} />
              <input type="hidden" name="currency" value={formData.currency || selectedAccountType.currency} />
              <input type="hidden" name="bookBalance" value={formData.initialDeposit || "0"} />
              <input type="hidden" name="availableBalance" value={formData.initialDeposit || "0"} />
              <input type="hidden" name="accountType" value={selectedType} />
              {selectedType === "MINEUR" && (
                <>
                  <input type="hidden" name="minorFirstName" value={formData.minorFirstName || ""} />
                  <input type="hidden" name="minorLastName" value={formData.minorLastName || ""} />
                  <input type="hidden" name="minorDateOfBirth" value={formData.minorDateOfBirth || ""} />
                </>
              )}

              {/* Navigation et Soumission */}
              <div className="flex justify-between pt-4 border-t border-gray-200">
                <Button onClick={() => setStep(2)} variant="outline" size="default" type="button">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating || !canSubmit}
                  className="bg-primary hover:opacity-90 transition-opacity min-w-[140px]"
                  size="default"
                >
                  {isCreating ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Soumission...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Soumettre la Demande
                    </>
                  )}
                </Button>
              </div>
            </form>

              {createState?.error && (
                <Alert variant="destructive" className="py-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{createState.error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
