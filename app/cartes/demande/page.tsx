"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  MapPin,
  Building2,
  Phone,
  Shield,
  Clock,
  Wallet,
  PiggyBank,
  DollarSign,
} from "lucide-react"
import Link from "next/link"
import AuthService from "@/lib/auth-service"

interface Account {
  id: string
  name: string
  number: string
  balance: number
  currency: string
  type: "Courant" | "Épargne" | "Devise"
  status: "Actif" | "Bloqué" | "Fermé"
}

interface CardType {
  id: string
  name: string
  description: string
  features: string[]
  fees: string
  currency: string[]
  icon: string
}

interface Agency {
  id: string
  name: string
  address: string
  city: string
  phone: string
}

const cardTypes: CardType[] = [
  {
    id: "debit_classic",
    name: "Carte de Débit Classique",
    description: "Carte standard pour vos achats quotidiens",
    features: ["Paiements en magasin", "Retraits aux DAB", "Paiements en ligne", "Sans frais annuels"],
    fees: "Gratuite",
    currency: ["FCFA"],
    icon: "💳",
  },
  {
    id: "debit_gold",
    name: "Carte de Débit Gold",
    description: "Carte premium avec avantages exclusifs",
    features: ["Tous les avantages Classique", "Assurance voyage", "Plafonds élevés", "Service client prioritaire"],
    fees: "25,000 FCFA/an",
    currency: ["FCFA", "USD"],
    icon: "🏆",
  },
  {
    id: "credit_standard",
    name: "Carte de Crédit Standard",
    description: "Crédit renouvelable pour vos projets",
    features: ["Crédit jusqu'à 500,000 FCFA", "Remboursement flexible", "Taux préférentiel", "Assurance incluse"],
    fees: "50,000 FCFA/an",
    currency: ["FCFA"],
    icon: "💎",
  },
  {
    id: "prepaid",
    name: "Carte Prépayée",
    description: "Carte rechargeable pour un contrôle total",
    features: ["Rechargeable", "Contrôle des dépenses", "Idéale pour les jeunes", "Pas de découvert"],
    fees: "10,000 FCFA à l'émission",
    currency: ["FCFA", "USD"],
    icon: "🎯",
  },
]

const agencies: Agency[] = [
  {
    id: "abidjan_plateau",
    name: "Agence Plateau",
    address: "Avenue Houphouët-Boigny, Plateau",
    city: "Abidjan",
    phone: "+225 27 20 12 34 56",
  },
  {
    id: "abidjan_cocody",
    name: "Agence Cocody",
    address: "Boulevard de France, Cocody",
    city: "Abidjan",
    phone: "+225 27 22 44 55 66",
  },
  {
    id: "bouake",
    name: "Agence Bouaké",
    address: "Centre-ville de Bouaké",
    city: "Bouaké",
    phone: "+225 31 63 12 34",
  },
  {
    id: "yamoussoukro",
    name: "Agence Yamoussoukro",
    address: "Boulevard Mamadou Koulibaly",
    city: "Yamoussoukro",
    phone: "+225 30 64 12 34",
  },
]

export default function DemandeCartePage() {
  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [selectedCardType, setSelectedCardType] = useState<string>("")
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("")
  const [selectedAgency, setSelectedAgency] = useState<string>("")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [comments, setComments] = useState("")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ success?: boolean; error?: string } | null>(null)

  // Données des comptes (simulées - en réalité, récupérées via API)
  const accounts: Account[] = [
    {
      id: "1",
      name: "Compte Courant",
      number: "0001-234567-89",
      balance: 2400000,
      currency: "FCFA",
      type: "Courant",
      status: "Actif",
    },
    {
      id: "2",
      name: "Compte Épargne",
      number: "0002-345678-90",
      balance: 850000,
      currency: "FCFA",
      type: "Épargne",
      status: "Actif",
    },
    {
      id: "3",
      name: "Compte USD",
      number: "0003-456789-01",
      balance: 1250,
      currency: "USD",
      type: "Devise",
      status: "Actif",
    },
  ]

  // Récupérer les informations utilisateur au chargement
  useEffect(() => {
    const user = AuthService.getCurrentUser()
    if (user) {
      setPhone(user.phoneNumber || "")
      setEmail(user.email || "")
    }
  }, [])

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "Courant":
        return <Wallet className="h-4 w-4" />
      case "Épargne":
        return <PiggyBank className="h-4 w-4" />
      case "Devise":
        return <DollarSign className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const formatAmount = (amount: number, currency = "FCFA") => {
    if (currency === "FCFA") {
      return new Intl.NumberFormat("fr-FR").format(amount)
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      const requestData = {
        accountId: selectedAccount,
        cardType: selectedCardType,
        deliveryMethod,
        deliveryAddress: deliveryMethod === "delivery" ? deliveryAddress : "",
        pickupAgency: deliveryMethod === "pickup" ? selectedAgency : "",
        phone,
        email,
        comments,
      }

      const response = await fetch("/api/cartes/demande", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AuthService.getToken()}`,
        },
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        const result = await response.json()
        setSubmitResult({ success: true })
        // Réinitialiser le formulaire
        setSelectedAccount("")
        setSelectedCardType("")
        setDeliveryMethod("")
        setSelectedAgency("")
        setDeliveryAddress("")
        setComments("")
        setAcceptTerms(false)
      } else {
        const error = await response.json()
        setSubmitResult({ error: error.message || "Erreur lors de la soumission" })
      }
    } catch (error) {
      console.error("Erreur lors de la demande de carte:", error)
      setSubmitResult({ error: "Erreur de connexion. Veuillez réessayer." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCard = cardTypes.find((card) => card.id === selectedCardType)
  const selectedAccountData = accounts.find((acc) => acc.id === selectedAccount)
  const isFormValid =
    selectedAccount &&
    selectedCardType &&
    deliveryMethod &&
    (deliveryMethod === "pickup" ? selectedAgency : deliveryAddress) &&
    phone &&
    email &&
    acceptTerms

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-4 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/cartes">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux cartes
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Demande de Carte Bancaire</h1>
          <p className="text-gray-600">Commandez votre nouvelle carte bancaire en quelques clics</p>
        </div>
      </div>

      {/* Messages de feedback */}
      {submitResult?.success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ✅ Votre demande d'ouverture de compte a été prise en compte ! Vous recevrez une confirmation par email et
            SMS.
          </AlertDescription>
        </Alert>
      )}

      {submitResult?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>❌ {submitResult.error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sélection du compte */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wallet className="w-5 h-5 mr-2" />
              Compte à associer
            </CardTitle>
            <CardDescription>Choisissez le compte qui sera lié à votre carte</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {accounts
                .filter((acc) => acc.status === "Actif")
                .map((account) => (
                  <div
                    key={account.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedAccount === account.id
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedAccount(account.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getAccountIcon(account.type)}
                        <span className="font-medium text-sm">{account.name}</span>
                      </div>
                      <Badge variant="outline">{account.type}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 font-mono mb-1">{account.number}</p>
                    <p className="text-lg font-bold">
                      {formatAmount(account.balance, account.currency)} {account.currency}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Sélection du type de carte */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Type de carte
            </CardTitle>
            <CardDescription>Choisissez le type de carte qui correspond à vos besoins</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cardTypes.map((card) => (
                <div
                  key={card.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedCardType === card.id
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedCardType(card.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{card.icon}</span>
                      <div>
                        <h3 className="font-semibold">{card.name}</h3>
                        <p className="text-sm text-gray-600">{card.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Frais:</span>
                      <span className="font-medium text-green-600">{card.fees}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Devises:</span>
                      <span className="font-medium">{card.currency.join(", ")}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {card.features.map((feature, index) => (
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

        {/* Mode de livraison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Mode de livraison
            </CardTitle>
            <CardDescription>Choisissez comment vous souhaitez recevoir votre carte</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={deliveryMethod}
              onValueChange={(value: "delivery" | "pickup") => setDeliveryMethod(value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="delivery" id="delivery" />
                <Label htmlFor="delivery" className="flex items-center space-x-2 cursor-pointer">
                  <MapPin className="w-4 h-4" />
                  <span>Livraison à domicile (gratuite)</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pickup" id="pickup" />
                <Label htmlFor="pickup" className="flex items-center space-x-2 cursor-pointer">
                  <Building2 className="w-4 h-4" />
                  <span>Retrait en agence</span>
                </Label>
              </div>
            </RadioGroup>

            {deliveryMethod === "delivery" && (
              <div className="mt-4">
                <Label htmlFor="address">Adresse de livraison *</Label>
                <Textarea
                  id="address"
                  placeholder="Entrez votre adresse complète de livraison..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  La livraison se fait sous 5-7 jours ouvrables. Un SMS vous sera envoyé avant la livraison.
                </p>
              </div>
            )}

            {deliveryMethod === "pickup" && (
              <div className="mt-4">
                <Label htmlFor="agency">Agence de retrait *</Label>
                <Select value={selectedAgency} onValueChange={setSelectedAgency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une agence" />
                  </SelectTrigger>
                  <SelectContent>
                    {agencies.map((agency) => (
                      <SelectItem key={agency.id} value={agency.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{agency.name}</span>
                          <span className="text-xs text-gray-500">
                            {agency.address}, {agency.city}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedAgency && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    {(() => {
                      const agency = agencies.find((a) => a.id === selectedAgency)
                      return agency ? (
                        <div className="text-sm">
                          <p className="font-medium">{agency.name}</p>
                          <p className="text-gray-600">
                            {agency.address}, {agency.city}
                          </p>
                          <p className="text-gray-600">📞 {agency.phone}</p>
                        </div>
                      ) : null
                    })()}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informations de contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="w-5 h-5 mr-2" />
              Informations de contact
            </CardTitle>
            <CardDescription>Vérifiez et complétez vos informations de contact</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Numéro de téléphone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+225 XX XX XX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Adresse email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commentaires additionnels */}
        <Card>
          <CardHeader>
            <CardTitle>Commentaires additionnels</CardTitle>
            <CardDescription>Informations supplémentaires ou demandes spéciales (optionnel)</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Ajoutez des commentaires ou des instructions spéciales..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Récapitulatif et validation */}
        {selectedCard && selectedAccountData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Récapitulatif de votre demande
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Compte sélectionné:</p>
                  <p className="font-medium">
                    {selectedAccountData.name} ({selectedAccountData.number})
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type de carte:</p>
                  <p className="font-medium">{selectedCard.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mode de livraison:</p>
                  <p className="font-medium">
                    {deliveryMethod === "delivery" ? "Livraison à domicile" : "Retrait en agence"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Frais:</p>
                  <p className="font-medium text-green-600">{selectedCard.fees}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm">
                  J'accepte les{" "}
                  <a href="#" className="text-blue-600 hover:underline">
                    conditions générales
                  </a>{" "}
                  d'émission de carte bancaire et je confirme l'exactitude des informations fournies
                </Label>
              </div>

              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <strong>Délai de traitement :</strong> Votre carte sera disponible sous 5-7 jours ouvrables. Vous
                  recevrez une notification par SMS et email dès qu'elle sera prête.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Bouton de soumission */}
        <div className="flex justify-end">
          <Button type="submit" disabled={!isFormValid || isSubmitting} className="w-full md:w-auto">
            {isSubmitting ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Soumission en cours...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Soumettre la demande
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
