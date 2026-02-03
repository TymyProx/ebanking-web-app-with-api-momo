"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Receipt,
  Zap,
  Droplets,
  Phone,
  Wifi,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  CreditCard,
  Search,
  History,
  Store,
  Car,
  Utensils,
  Shirt,
  Heart,
  GraduationCap,
  Home,
  MapPin,
  Clock,
  Star,
} from "lucide-react"
import { payBill, validateBillNumber } from "./actions"
import { useActionState } from "react"

interface Provider {
  id: string
  name: string
  category:
    | "Électricité"
    | "Eau"
    | "Télécom"
    | "Internet"
    | "Supermarché"
    | "Restaurant"
    | "Vêtements"
    | "Pharmacie"
    | "École"
    | "Carburant"
    | "Immobilier"
  type: "utility" | "merchant"
  icon: any
  color: string
  status: "available" | "maintenance" | "unavailable"
  fee: number
  minAmount: number
  maxAmount: number
  description: string
  paymentMethods: string[]
  location?: string
  rating?: number
  merchantCode?: string
  businessHours?: string
}

interface PaymentData {
  providerId: string
  billNumber: string
  customerName: string
  amount: string
  sourceAccount: string
  paymentMethod: string
  merchantLocation?: string
  orderReference?: string
}

export default function UnifiedPaymentPage() {
  const [step, setStep] = useState<"selection" | "details" | "confirmation" | "success">("selection")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<"all" | "utility" | "merchant">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [paymentData, setPaymentData] = useState<PaymentData>({
    providerId: "",
    billNumber: "",
    customerName: "",
    amount: "",
    sourceAccount: "",
    paymentMethod: "account",
  })
  const [billValidation, setBillValidation] = useState<any>(null)
  const [paymentResult, setPaymentResult] = useState<any>(null)
  const [merchantResults, setMerchantResults] = useState<Provider[]>([])

  // États pour les actions serveur
  const [paymentState, paymentAction, isPaymentPending] = useActionState(payBill, null)

  // Fournisseurs et commerçants unifiés
  const providers: Provider[] = [
    // Services publics
    {
      id: "edg",
      name: "EDG",
      category: "Électricité",
      type: "utility",
      icon: Zap,
      color: "text-yellow-600",
      status: "available",
      fee: 1000,
      minAmount: 5000,
      maxAmount: 1000000,
      description: "Électricité de Guinée - Factures d'électricité",
      paymentMethods: ["account", "card"],
    },
    {
      id: "seg",
      name: "SEG",
      category: "Eau",
      type: "utility",
      icon: Droplets,
      color: "text-blue-600",
      status: "available",
      fee: 500,
      minAmount: 2000,
      maxAmount: 500000,
      description: "Société des Eaux de Guinée - Factures d'eau",
      paymentMethods: ["account", "card"],
    },
    {
      id: "orange",
      name: "Orange",
      category: "Télécom",
      type: "utility",
      icon: Phone,
      color: "text-orange-600",
      status: "available",
      fee: 0,
      minAmount: 1000,
      maxAmount: 200000,
      description: "Orange Guinée - Recharge et factures mobile",
      paymentMethods: ["account", "card", "mobile"],
    },
    {
      id: "mtn",
      name: "MTN",
      category: "Télécom",
      type: "utility",
      icon: Phone,
      color: "text-yellow-500",
      status: "available",
      fee: 0,
      minAmount: 1000,
      maxAmount: 200000,
      description: "MTN Guinée - Recharge et factures mobile",
      paymentMethods: ["account", "card", "mobile"],
    },
    {
      id: "guilab",
      name: "Guilab",
      category: "Internet",
      type: "utility",
      icon: Wifi,
      color: "text-purple-600",
      status: "available",
      fee: 1500,
      minAmount: 10000,
      maxAmount: 300000,
      description: "Internet haut débit - Factures internet",
      paymentMethods: ["account", "card"],
    },

    // Commerçants - Supermarchés
    {
      id: "espace",
      name: "Espace",
      category: "Supermarché",
      type: "merchant",
      icon: ShoppingCart,
      color: "text-indigo-600",
      status: "available",
      fee: 0,
      minAmount: 1000,
      maxAmount: 2000000,
      description: "Supermarché Espace - Courses et produits divers",
      paymentMethods: ["account", "card"],
      location: "Kaloum, Conakry",
      rating: 4.5,
      merchantCode: "ESP001",
      businessHours: "7h00 - 22h00",
    },
    {
      id: "leader_price",
      name: "Leader Price",
      category: "Supermarché",
      type: "merchant",
      icon: ShoppingCart,
      color: "text-green-600",
      status: "available",
      fee: 0,
      minAmount: 1000,
      maxAmount: 1500000,
      description: "Leader Price - Supermarché discount",
      paymentMethods: ["account", "card"],
      location: "Ratoma, Conakry",
      rating: 4.2,
      merchantCode: "LDP001",
      businessHours: "8h00 - 21h00",
    },

    // Commerçants - Restaurants
    {
      id: "restaurant_baobab",
      name: "Restaurant Baobab",
      category: "Restaurant",
      type: "merchant",
      icon: Utensils,
      color: "text-red-600",
      status: "available",
      fee: 500,
      minAmount: 5000,
      maxAmount: 500000,
      description: "Restaurant Baobab - Cuisine locale et internationale",
      paymentMethods: ["account", "card"],
      location: "Almamya, Conakry",
      rating: 4.7,
      merchantCode: "RBB001",
      businessHours: "11h00 - 23h00",
    },
    {
      id: "kfc_guinea",
      name: "KFC Guinée",
      category: "Restaurant",
      type: "merchant",
      icon: Utensils,
      color: "text-red-500",
      status: "available",
      fee: 0,
      minAmount: 2000,
      maxAmount: 200000,
      description: "KFC Guinée - Fast food international",
      paymentMethods: ["account", "card", "mobile"],
      location: "Kipé, Conakry",
      rating: 4.3,
      merchantCode: "KFC001",
      businessHours: "10h00 - 22h00",
    },

    // Commerçants - Vêtements
    {
      id: "fashion_plaza",
      name: "Fashion Plaza",
      category: "Vêtements",
      type: "merchant",
      icon: Shirt,
      color: "text-pink-600",
      status: "available",
      fee: 1000,
      minAmount: 10000,
      maxAmount: 1000000,
      description: "Fashion Plaza - Vêtements et accessoires de mode",
      paymentMethods: ["account", "card"],
      location: "Madina, Conakry",
      rating: 4.1,
      merchantCode: "FPZ001",
      businessHours: "9h00 - 20h00",
    },

    // Commerçants - Pharmacies
    {
      id: "pharmacie_centrale",
      name: "Pharmacie Centrale",
      category: "Pharmacie",
      type: "merchant",
      icon: Heart,
      color: "text-green-500",
      status: "available",
      fee: 0,
      minAmount: 1000,
      maxAmount: 500000,
      description: "Pharmacie Centrale - Médicaments et produits de santé",
      paymentMethods: ["account", "card"],
      location: "Centre-ville, Conakry",
      rating: 4.6,
      merchantCode: "PHC001",
      businessHours: "24h/24",
    },

    // Commerçants - Écoles
    {
      id: "ecole_internationale",
      name: "École Internationale",
      category: "École",
      type: "merchant",
      icon: GraduationCap,
      color: "text-blue-700",
      status: "available",
      fee: 2500,
      minAmount: 50000,
      maxAmount: 5000000,
      description: "École Internationale de Conakry - Frais de scolarité",
      paymentMethods: ["account", "card"],
      location: "Kipé, Conakry",
      rating: 4.8,
      merchantCode: "EIC001",
      businessHours: "7h30 - 17h00",
    },

    // Commerçants - Carburant
    {
      id: "total_energies",
      name: "Total Energies",
      category: "Carburant",
      type: "merchant",
      icon: Car,
      color: "text-red-700",
      status: "available",
      fee: 0,
      minAmount: 5000,
      maxAmount: 1000000,
      description: "Total Energies - Station-service",
      paymentMethods: ["account", "card"],
      location: "Autoroute Fidel Castro",
      rating: 4.4,
      merchantCode: "TOT001",
      businessHours: "24h/24",
    },

    // Commerçants - Immobilier
    {
      id: "agence_immobiliere",
      name: "Agence Immobilière BTP",
      category: "Immobilier",
      type: "merchant",
      icon: Home,
      color: "text-gray-700",
      status: "available",
      fee: 5000,
      minAmount: 100000,
      maxAmount: 50000000,
      description: "Agence Immobilière BTP - Loyers et ventes",
      paymentMethods: ["account", "card"],
      location: "Almamya, Conakry",
      rating: 4.0,
      merchantCode: "AIB001",
      businessHours: "8h00 - 18h00",
    },
  ]

  // Comptes disponibles
  const accounts = [
    { id: "1", name: "Compte Courant", number: "0001-234567-89", balance: 2400000, currency: "GNF", status: "ACTIF" },
    { id: "2", name: "Compte Épargne", number: "0002-345678-90", balance: 850000, currency: "GNF", status: "ACTIF" },
  ].filter(
    (account) =>
      (account.status === "ACTIF" || account.status === "Actif") &&
      account.number &&
      String(account.number).trim() !== "",
  )

  // Paiements récents unifiés
  const recentPayments = [
    {
      id: "1",
      provider: "EDG",
      type: "utility",
      amount: "45,000 GNF",
      date: "12 Jan",
      status: "Payé",
      reference: "F20240112001",
    },
    {
      id: "2",
      provider: "Restaurant Baobab",
      type: "merchant",
      amount: "85,000 GNF",
      date: "11 Jan",
      status: "Payé",
      reference: "M20240111001",
    },
    {
      id: "3",
      provider: "Orange",
      type: "utility",
      amount: "25,000 GNF",
      date: "10 Jan",
      status: "Payé",
      reference: "F20240110002",
    },
    {
      id: "4",
      provider: "Espace",
      type: "merchant",
      amount: "125,000 GNF",
      date: "09 Jan",
      status: "Payé",
      reference: "M20240109001",
    },
    {
      id: "5",
      provider: "SEG",
      type: "utility",
      amount: "18,000 GNF",
      date: "08 Jan",
      status: "Payé",
      reference: "F20240108003",
    },
  ]

  const filteredProviders = providers.filter((provider) => {
    const matchesCategory = selectedCategory === "all" || provider.category === selectedCategory
    const matchesType = selectedType === "all" || provider.type === selectedType
    const matchesSearch =
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (provider.location && provider.location.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesCategory && matchesType && matchesSearch
  })

  const selectedProvider = providers.find((p) => p.id === paymentData.providerId)
  const selectedAccount = accounts.find((a) => a.id === paymentData.sourceAccount)
  const paymentAmount = Number.parseFloat(paymentData.amount) || 0
  const totalAmount = paymentAmount + (selectedProvider?.fee || 0)

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(Math.trunc(amount))
  }

  const validatePayment = async (billNumber: string, providerId: string) => {
    if (!billNumber || billNumber.length < 3) {
      setBillValidation(null)
      return
    }

    try {
      const result = await validateBillNumber(billNumber, providerId)
      setBillValidation(result)
      if (result.success && result.data) {
        setPaymentData((prev) => ({
          ...prev,
          customerName: result.data.customerName,
          amount: result.data.amount?.toString() || prev.amount,
          merchantLocation: result.data.location,
          orderReference: result.data.orderReference,
        }))
      }
    } catch (error) {
      setBillValidation({
        success: false,
        message: "Erreur lors de la validation",
      })
    }
  }

  const handleProviderSelect = (providerId: string) => {
    setPaymentData((prev) => ({ ...prev, providerId }))
    setStep("details")
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const formData = new FormData()
    Object.entries(paymentData).forEach(([key, value]) => {
      if (value) formData.append(key, value)
    })

    const result = await paymentAction(formData)
    if (result?.success) {
      setPaymentResult(result)
      setStep("success")
    }
  }

  const resetForm = () => {
    setStep("selection")
    setPaymentData({
      providerId: "",
      billNumber: "",
      customerName: "",
      amount: "",
      sourceAccount: "",
      paymentMethod: "account",
    })
    setBillValidation(null)
    setPaymentResult(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-100 text-green-800">Disponible</Badge>
      case "maintenance":
        return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>
      case "unavailable":
        return <Badge className="bg-red-100 text-red-800">Indisponible</Badge>
      default:
        return <Badge variant="outline">Inconnu</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "utility":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Service Public
          </Badge>
        )
      case "merchant":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            Commerçant
          </Badge>
        )
      default:
        return <Badge variant="outline">Autre</Badge>
    }
  }

  const categories = [
    "Électricité",
    "Eau",
    "Télécom",
    "Internet",
    "Supermarché",
    "Restaurant",
    "Vêtements",
    "Pharmacie",
    "École",
    "Carburant",
    "Immobilier",
  ]

  // Étape 1: Sélection du fournisseur/commerçant
  if (step === "selection") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paiements & Achats</h1>
          <p className="text-gray-600">Payez vos factures et réglez vos achats en ligne</p>
        </div>

        <Tabs defaultValue="providers" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="providers">Fournisseurs & Commerçants</TabsTrigger>
            <TabsTrigger value="recent">Paiements récents</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-4">
            {/* Filtres et recherche */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Rechercher un fournisseur ou commerçant..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        <SelectItem value="utility">Services publics</SelectItem>
                        <SelectItem value="merchant">Commerçants</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes catégories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm text-gray-600">Services publics</p>
                      <p className="font-semibold">{providers.filter((p) => p.type === "utility").length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2">
                    <Store className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Commerçants</p>
                      <p className="font-semibold">{providers.filter((p) => p.type === "merchant").length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Disponibles</p>
                      <p className="font-semibold">{providers.filter((p) => p.status === "available").length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2">
                    <Receipt className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Ce mois</p>
                      <p className="font-semibold">{recentPayments.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Grille des fournisseurs et commerçants */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProviders.map((provider) => (
                <Card
                  key={provider.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    provider.status !== "available" ? "opacity-60" : ""
                  }`}
                  onClick={() => provider.status === "available" && handleProviderSelect(provider.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center`}>
                          <provider.icon className={`w-6 h-6 ${provider.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{provider.name}</h3>
                          <p className="text-sm text-gray-500">{provider.category}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        {getStatusBadge(provider.status)}
                        {getTypeBadge(provider.type)}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{provider.description}</p>

                    {/* Informations spécifiques aux commerçants */}
                    {provider.type === "merchant" && (
                      <div className="space-y-2 mb-3">
                        {provider.location && (
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            <span>{provider.location}</span>
                          </div>
                        )}
                        {provider.rating && (
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span>{provider.rating}/5</span>
                          </div>
                        )}
                        {provider.businessHours && (
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{provider.businessHours}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2 text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Frais:</span>
                        <span className="font-medium">
                          {provider.fee === 0 ? "Gratuit" : `${formatAmount(provider.fee)} GNF`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Montant min/max:</span>
                        <span className="font-medium">
                          {formatAmount(provider.minAmount)} - {formatAmount(provider.maxAmount)} GNF
                        </span>
                      </div>
                    </div>

                    {provider.status === "maintenance" && (
                      <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                        ⚠️ Service temporairement indisponible
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredProviders.length === 0 && (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun fournisseur ou commerçant trouvé</p>
                <p className="text-sm text-gray-400">Essayez de modifier vos critères de recherche</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="w-5 h-5 mr-2" />
                  Paiements récents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            payment.type === "utility" ? "bg-blue-100" : "bg-purple-100"
                          }`}
                        >
                          {payment.type === "utility" ? (
                            <Receipt className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Store className="w-4 h-4 text-purple-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{payment.provider}</p>
                          <div className="flex items-center space-x-2">
                            <p className="text-xs text-gray-500">Réf: {payment.reference}</p>
                            {getTypeBadge(payment.type)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">{payment.amount}</p>
                        <p className="text-xs text-gray-500">{payment.date}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // Étape 2: Saisie des détails
  if (step === "details") {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => setStep("selection")} size="sm">
            ← Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Paiement {selectedProvider?.name}</h1>
            <p className="text-gray-600">
              {selectedProvider?.type === "utility"
                ? "Saisissez les informations de votre facture"
                : "Saisissez les informations de votre achat"}
            </p>
          </div>
        </div>

        {/* Messages d'erreur */}
        {paymentState?.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>❌ {paymentState.error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handlePaymentSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {selectedProvider && <selectedProvider.icon className={`w-5 h-5 mr-2 ${selectedProvider.color}`} />}
                    Informations de paiement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Numéro de facture/commande */}
                  <div className="space-y-2">
                    <Label htmlFor="billNumber">
                      {selectedProvider?.type === "utility"
                        ? selectedProvider?.category === "Télécom"
                          ? "Numéro de téléphone"
                          : "Numéro de facture/client"
                        : "Numéro de commande/facture"}{" "}
                      *
                    </Label>
                    <Input
                      id="billNumber"
                      value={paymentData.billNumber}
                      onChange={(e) => {
                        const value = e.target.value
                        setPaymentData((prev) => ({ ...prev, billNumber: value }))
                        validatePayment(value, paymentData.providerId)
                      }}
                      placeholder={
                        selectedProvider?.type === "utility"
                          ? selectedProvider?.category === "Télécom"
                            ? "622123456"
                            : "Entrez votre numéro de client"
                          : "Numéro de commande ou référence d'achat"
                      }
                      required
                    />
                    {billValidation && (
                      <div
                        className={`flex items-center space-x-2 text-sm ${
                          billValidation.success ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {billValidation.success ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                        <span>{billValidation.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Nom du client/bénéficiaire */}
                  {paymentData.customerName && (
                    <div className="space-y-2">
                      <Label>{selectedProvider?.type === "utility" ? "Nom du client" : "Bénéficiaire"}</Label>
                      <Input value={paymentData.customerName} readOnly className="bg-gray-50" />
                    </div>
                  )}

                  {/* Localisation pour les commerçants */}
                  {selectedProvider?.type === "merchant" && paymentData.merchantLocation && (
                    <div className="space-y-2">
                      <Label>Localisation</Label>
                      <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{paymentData.merchantLocation}</span>
                      </div>
                    </div>
                  )}

                  {/* Montant */}
                  <div className="space-y-2">
                    <Label htmlFor="amount">
                      Montant (GNF) *
                      {selectedProvider && (
                        <span className="text-sm text-gray-500 ml-2">
                          Min: {formatAmount(selectedProvider.minAmount)} - Max:{" "}
                          {formatAmount(selectedProvider.maxAmount)}
                        </span>
                      )}
                    </Label>
                    <Input
                      id="amount"
                      type="text"
                      inputMode="numeric"
                      value={paymentData.amount}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, "")
                        setPaymentData((prev) => ({ ...prev, amount: cleaned }))
                      }}
                      placeholder="0"
                      className="text-right font-mono"
                      min={selectedProvider?.minAmount}
                      max={selectedProvider?.maxAmount}
                      required
                    />
                    {selectedProvider && paymentAmount > 0 && (
                      <div className="text-sm text-gray-600">
                        Frais: {selectedProvider.fee === 0 ? "Gratuit" : `${formatAmount(selectedProvider.fee)} GNF`}
                      </div>
                    )}
                  </div>

                  {/* Compte à débiter */}
                  <div className="space-y-2">
                    <Label>Compte à débiter *</Label>
                    <Select
                      value={paymentData.sourceAccount}
                      onValueChange={(value) => setPaymentData((prev) => ({ ...prev, sourceAccount: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez votre compte" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{account.name}</span>
                              <span className="text-sm text-gray-500">
                                {account.number} • Solde: {formatAmount(account.balance)} {account.currency}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedAccount && totalAmount > selectedAccount.balance && (
                      <p className="text-sm text-red-600">❌ Solde insuffisant</p>
                    )}
                  </div>

                  {/* Mode de paiement */}
                  <div className="space-y-2">
                    <Label>Mode de paiement</Label>
                    <Select
                      value={paymentData.paymentMethod}
                      onValueChange={(value) => setPaymentData((prev) => ({ ...prev, paymentMethod: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="account">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-4 h-4" />
                            <span>Compte bancaire</span>
                          </div>
                        </SelectItem>
                        {selectedProvider?.paymentMethods.includes("card") && (
                          <SelectItem value="card">
                            <div className="flex items-center space-x-2">
                              <CreditCard className="w-4 h-4" />
                              <span>Carte bancaire</span>
                            </div>
                          </SelectItem>
                        )}
                        {selectedProvider?.paymentMethods.includes("mobile") && (
                          <SelectItem value="mobile">
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4" />
                              <span>Mobile Money</span>
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={
                      !paymentData.billNumber ||
                      !paymentData.amount ||
                      !paymentData.sourceAccount ||
                      (selectedAccount && totalAmount > selectedAccount.balance) ||
                      (billValidation && !billValidation.success) ||
                      isPaymentPending
                    }
                  >
                    {isPaymentPending
                      ? "Traitement..."
                      : selectedProvider?.type === "utility"
                        ? "Payer la facture"
                        : "Effectuer le paiement"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Récapitulatif */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Récapitulatif</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedProvider && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <selectedProvider.icon className={`w-6 h-6 ${selectedProvider.color}`} />
                      <div className="flex-1">
                        <p className="font-semibold">{selectedProvider.name}</p>
                        <p className="text-sm text-gray-500">{selectedProvider.category}</p>
                        {selectedProvider.type === "merchant" && selectedProvider.location && (
                          <p className="text-xs text-gray-400">{selectedProvider.location}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        {getStatusBadge(selectedProvider.status)}
                        {getTypeBadge(selectedProvider.type)}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Montant:</span>
                      <span className="font-medium">
                        {paymentAmount > 0 ? `${formatAmount(paymentAmount)} GNF` : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Frais:</span>
                      <span className="font-medium">
                        {selectedProvider?.fee === 0
                          ? "Gratuit"
                          : selectedProvider
                            ? `${formatAmount(selectedProvider.fee)} GNF`
                            : "-"}
                      </span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-semibold">
                      <span>Total à débiter:</span>
                      <span>{totalAmount > 0 ? `${formatAmount(totalAmount)} GNF` : "-"}</span>
                    </div>
                  </div>

                  {selectedProvider && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong>{" "}
                        {selectedProvider.type === "utility"
                          ? "Le paiement sera traité immédiatement. Vous recevrez une confirmation par SMS."
                          : "Le paiement sera transmis au commerçant. Conservez votre référence."}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    )
  }

  // Étape 3: Succès
  if (step === "success") {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Paiement réussi</h1>
          <p className="text-gray-600">
            {selectedProvider?.type === "utility"
              ? "Votre facture a été payée avec succès"
              : "Votre paiement a été effectué avec succès"}
          </p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-green-600">
              ✅ Paiement réussi. Référence :{" "}
              {paymentResult?.reference || (selectedProvider?.type === "utility" ? "F20250721XXX" : "M20250721XXX")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">
                    {selectedProvider?.type === "utility" ? "Fournisseur" : "Commerçant"}
                  </p>
                  <p className="font-semibold">{selectedProvider?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Montant payé</p>
                  <p className="font-semibold">{formatAmount(totalAmount)} GNF</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Numéro de référence</p>
                  <p className="font-mono font-semibold">{paymentResult?.reference}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date et heure</p>
                  <p className="font-medium">{new Date().toLocaleString("fr-FR")}</p>
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                {selectedProvider?.type === "utility"
                  ? "Un SMS de confirmation a été envoyé. Conservez cette référence pour vos archives."
                  : "Le commerçant a été notifié de votre paiement. Conservez cette référence."}
              </p>

              <div className="flex space-x-4">
                <Button variant="outline" className="flex-1 bg-transparent">
                  Télécharger le reçu
                </Button>
                <Button onClick={resetForm} className="flex-1">
                  Nouveau paiement
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
