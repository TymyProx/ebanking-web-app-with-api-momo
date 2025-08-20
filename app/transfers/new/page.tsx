"use client"

import type React from "react"
import { useState, useTransition, useActionState, useEffect } from "react"
import { executeTransfer } from "./actions"
import { getBeneficiaries } from "../beneficiaries/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowRight, Plus, User, Building, Check, AlertCircle } from "lucide-react"

// Types
interface Beneficiary {
  id: string
  name: string
  account: string
  bank: string
  type: "BNG-BNG" | "BNG-CONFRERE" | "International"
}

interface Account {
  id: string
  name: string
  number: string
  balance: number
  currency: string
}

// Données simulées
const mockAccounts: Account[] = [
  {
    id: "1",
    name: "Compte Courant Principal",
    number: "BNG-2024-001234-01",
    balance: 2500000,
    currency: "GNF",
  },
  {
    id: "2",
    name: "Compte Épargne",
    number: "BNG-2024-001234-02",
    balance: 5000000,
    currency: "GNF",
  },
  {
    id: "3",
    name: "Compte USD",
    number: "BNG-2024-001234-03",
    balance: 1500,
    currency: "USD",
  },
]

const mockBeneficiaries: Beneficiary[] = [
  {
    id: "1",
    name: "Mamadou Diallo",
    account: "BNG-2024-005678-01",
    bank: "Banque Nationale de Guinée",
    type: "BNG-BNG",
  },
  {
    id: "2",
    name: "Aissatou Barry",
    account: "UBA-2024-123456-01",
    bank: "United Bank for Africa",
    type: "BNG-CONFRERE",
  },
  {
    id: "3",
    name: "Ibrahim Camara",
    account: "FR76 1234 5678 9012 3456 789",
    bank: "BNP Paribas",
    type: "International",
  },
]

const banks = {
  "BNG-BNG": ["Banque Nationale de Guinée"],
  "BNG-CONFRERE": [
    "United Bank for Africa (UBA)",
    "Ecobank Guinée",
    "Société Générale Guinée",
    "BICIGUI",
    "Banque Islamique de Guinée",
  ],
  International: ["BNP Paribas", "Société Générale", "Crédit Agricole", "HSBC", "Standard Chartered"],
}

const countries = [
  "France",
  "Sénégal",
  "Mali",
  "Côte d'Ivoire",
  "Burkina Faso",
  "Niger",
  "Mauritanie",
  "Gambie",
  "Sierra Leone",
  "Liberia",
]

export default function NewTransferPage() {
  // États pour le virement
  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [motif, setMotif] = useState<string>("")
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [isLoadingBeneficiaries, setIsLoadingBeneficiaries] = useState(true)

  // États pour le formulaire de bénéficiaire
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [beneficiaryForm, setBeneficiaryForm] = useState({
    name: "",
    type: "" as "BNG-BNG" | "BNG-CONFRERE" | "International" | "",
    account: "",
    bank: "",
    swiftCode: "",
    country: "",
  })

  const [isPending, startTransition] = useTransition()
  const [transferState, transferAction] = useActionState(executeTransfer, null)

  const [beneficiaryState, setBeneficiaryState] = useState<{
    success?: boolean
    error?: string
  } | null>(null)

  // Fonctions utilitaires
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency === "GNF" ? "GNF" : currency,
      minimumFractionDigits: currency === "GNF" ? 0 : 2,
    }).format(amount)
  }

  const validateRIB = (account: string, type: string): boolean => {
    switch (type) {
      case "BNG-BNG":
        return /^BNG-\d{4}-\d{6}-\d{2}$/.test(account)
      case "BNG-CONFRERE":
        return /^[A-Z]{3}-\d{4}-\d{6}-\d{2}$/.test(account)
      case "International":
        return /^[A-Z]{2}\d{2}[\s\d]{15,34}$/.test(account.replace(/\s/g, ""))
      default:
        return false
    }
  }

  // Gestionnaires d'événements pour le virement
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedAccount || !selectedBeneficiary || !amount || !motif) {
      return
    }

    const formData = new FormData()
    formData.append("sourceAccount", selectedAccount)
    formData.append("beneficiaryId", selectedBeneficiary)
    formData.append("amount", amount)
    formData.append("purpose", motif)
    formData.append("transferDate", transferDate)

    startTransition(() => {
      transferAction(formData)
    })
  }

  // Gestionnaires d'événements pour le bénéficiaire
  const handleBeneficiarySubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!beneficiaryForm.name || !beneficiaryForm.type || !beneficiaryForm.account || !beneficiaryForm.bank) {
      setBeneficiaryState({ error: "Tous les champs obligatoires doivent être remplis" })
      return
    }

    if (!validateRIB(beneficiaryForm.account, beneficiaryForm.type)) {
      setBeneficiaryState({ error: "Format de compte invalide" })
      return
    }

    if (beneficiaryForm.type === "International" && !beneficiaryForm.swiftCode) {
      setBeneficiaryState({ error: "Le code SWIFT est obligatoire pour les virements internationaux" })
      return
    }

    startTransition(async () => {
      try {
        // Simulation d'un délai de traitement
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // Simulation d'une erreur aléatoire (3% de chance)
        if (Math.random() < 0.03) {
          throw new Error("Erreur lors de l'ajout du bénéficiaire")
        }

        // Ajouter le nouveau bénéficiaire
        const newBeneficiary: Beneficiary = {
          id: Date.now().toString(),
          name: beneficiaryForm.name,
          account: beneficiaryForm.account,
          bank: beneficiaryForm.bank,
          type: beneficiaryForm.type as "BNG-BNG" | "BNG-CONFRERE" | "International",
        }

        setBeneficiaries((prev) => [...prev, newBeneficiary])
        setSelectedBeneficiary(newBeneficiary.id)

        setBeneficiaryState({ success: true })

        // Reset du formulaire et fermeture du dialog
        setTimeout(() => {
          setBeneficiaryForm({
            name: "",
            type: "",
            account: "",
            bank: "",
            swiftCode: "",
            country: "",
          })
          setBeneficiaryState(null)
          setIsDialogOpen(false)
        }, 2000)
      } catch (error) {
        setBeneficiaryState({
          error: error instanceof Error ? error.message : "Erreur lors de l'ajout",
        })
      }
    })
  }

  const selectedAccountData = mockAccounts.find((acc) => acc.id === selectedAccount)
  const selectedBeneficiaryData = beneficiaries.find((ben) => ben.id === selectedBeneficiary)

  useEffect(() => {
    const loadBeneficiaries = async () => {
      try {
        setIsLoadingBeneficiaries(true)
        const result = await getBeneficiaries()

        if (result.success && result.data) {
          // Adapter le format des données API au format attendu par l'interface
          const adaptedBeneficiaries: Beneficiary[] = result.data.map((beneficiary: any) => ({
            id: beneficiary.id || beneficiary.beneficiaryId,
            name: beneficiary.name,
            account: beneficiary.accountNumber,
            bank: beneficiary.bankCode || beneficiary.bank || "Banque inconnue",
            type: "BNG-BNG" as const, // Par défaut, peut être adapté selon vos besoins
          }))
          setBeneficiaries(adaptedBeneficiaries)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des bénéficiaires:", error)
        // En cas d'erreur, utiliser les données de test
        setBeneficiaries(mockBeneficiaries)
      } finally {
        setIsLoadingBeneficiaries(false)
      }
    }

    loadBeneficiaries()
  }, [])

  useEffect(() => {
    if (transferState?.success) {
      setSelectedAccount("")
      setSelectedBeneficiary("")
      setAmount("")
      setMotif("")
      setTransferDate(new Date().toISOString().split("T")[0])
    }
  }, [transferState?.success])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau virement</h1>
        <p className="text-gray-600">Effectuer un virement vers un bénéficiaire</p>
      </div>

      {/* Messages de feedback pour le virement */}
      {transferState?.success && (
        <Alert className="border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {transferState.message || "Virement effectué avec succès !"}
          </AlertDescription>
        </Alert>
      )}

      {transferState?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{transferState.error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleTransferSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Compte débiteur */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Compte débiteur</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account">Sélectionner le compte à débiter *</Label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un compte" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{account.name}</span>
                          <span className="text-sm text-gray-500">
                            {account.number} • {formatCurrency(account.balance, account.currency)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Bénéficiaire */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Bénéficiaire</span>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-transparent">
                      <Plus className="h-4 w-4" />
                      <span>Nouveau bénéficiaire</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Ajouter un bénéficiaire</DialogTitle>
                    </DialogHeader>

                    {/* Messages de feedback pour le bénéficiaire */}
                    {beneficiaryState?.success && (
                      <Alert className="border-green-200 bg-green-50">
                        <Check className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          Bénéficiaire ajouté avec succès !
                        </AlertDescription>
                      </Alert>
                    )}

                    {beneficiaryState?.error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{beneficiaryState.error}</AlertDescription>
                      </Alert>
                    )}

                    <form onSubmit={handleBeneficiarySubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="beneficiary-name">Nom complet *</Label>
                        <Input
                          id="beneficiary-name"
                          value={beneficiaryForm.name}
                          onChange={(e) => setBeneficiaryForm((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Nom et prénom du bénéficiaire"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="beneficiary-type">Type de virement *</Label>
                        <Select
                          value={beneficiaryForm.type}
                          onValueChange={(value) =>
                            setBeneficiaryForm((prev) => ({
                              ...prev,
                              type: value as "BNG-BNG" | "BNG-CONFRERE" | "International",
                              account: "",
                              bank: "",
                              swiftCode: "",
                              country: "",
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner le type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BNG-BNG">BNG vers BNG</SelectItem>
                            <SelectItem value="BNG-CONFRERE">BNG vers Confrère</SelectItem>
                            <SelectItem value="International">International</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {beneficiaryForm.type && (
                        <div className="space-y-2">
                          <Label htmlFor="beneficiary-account">
                            {beneficiaryForm.type === "International" ? "IBAN *" : "Numéro de compte *"}
                          </Label>
                          <Input
                            id="beneficiary-account"
                            value={beneficiaryForm.account}
                            onChange={(e) => setBeneficiaryForm((prev) => ({ ...prev, account: e.target.value }))}
                            placeholder={
                              beneficiaryForm.type === "BNG-BNG"
                                ? "BNG-2024-123456-01"
                                : beneficiaryForm.type === "BNG-CONFRERE"
                                  ? "UBA-2024-123456-01"
                                  : "FR76 1234 5678 9012 3456 789"
                            }
                            required
                          />
                        </div>
                      )}

                      {beneficiaryForm.type && (
                        <div className="space-y-2">
                          <Label htmlFor="beneficiary-bank">Banque *</Label>
                          <Select
                            value={beneficiaryForm.bank}
                            onValueChange={(value) => setBeneficiaryForm((prev) => ({ ...prev, bank: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner la banque" />
                            </SelectTrigger>
                            <SelectContent>
                              {banks[beneficiaryForm.type]?.map((bank) => (
                                <SelectItem key={bank} value={bank}>
                                  {bank}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {beneficiaryForm.type === "International" && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="swift-code">Code SWIFT *</Label>
                            <Input
                              id="swift-code"
                              value={beneficiaryForm.swiftCode}
                              onChange={(e) => setBeneficiaryForm((prev) => ({ ...prev, swiftCode: e.target.value }))}
                              placeholder="BNPAFRPP"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="country">Pays</Label>
                            <Select
                              value={beneficiaryForm.country}
                              onValueChange={(value) => setBeneficiaryForm((prev) => ({ ...prev, country: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner le pays" />
                              </SelectTrigger>
                              <SelectContent>
                                {countries.map((country) => (
                                  <SelectItem key={country} value={country}>
                                    {country}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                          disabled={isPending}
                        >
                          Annuler
                        </Button>
                        <Button type="submit" disabled={isPending}>
                          {isPending ? "Ajout..." : "Ajouter"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="beneficiary">Sélectionner le bénéficiaire *</Label>
                <Select value={selectedBeneficiary} onValueChange={setSelectedBeneficiary}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingBeneficiaries ? "Chargement..." : "Choisir un bénéficiaire"} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingBeneficiaries ? (
                      <SelectItem value="loading" disabled>
                        Chargement des bénéficiaires...
                      </SelectItem>
                    ) : beneficiaries.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        Aucun bénéficiaire trouvé
                      </SelectItem>
                    ) : (
                      beneficiaries.map((beneficiary) => (
                        <SelectItem key={beneficiary.id} value={beneficiary.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{beneficiary.name}</span>
                            <span className="text-sm text-gray-500">
                              {beneficiary.account} • {beneficiary.bank}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Détails du virement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ArrowRight className="h-5 w-5" />
                <span>Détails du virement</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Montant *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min="1"
                  required
                />
                {selectedAccountData && (
                  <p className="text-sm text-gray-500">
                    Solde disponible: {formatCurrency(selectedAccountData.balance, selectedAccountData.currency)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="motif">Motif du virement *</Label>
                <Textarea
                  id="motif"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  placeholder="Indiquez le motif du virement..."
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transferDate">Date d'exécution *</Label>
                <Input
                  id="transferDate"
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPending || !selectedAccount || !selectedBeneficiary || !amount || !motif}
              className="flex items-center space-x-2"
            >
              <ArrowRight className="h-4 w-4" />
              <span>{isPending ? "Traitement..." : "Effectuer le virement"}</span>
            </Button>
          </div>
        </div>

        {/* Résumé */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Résumé du virement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedAccountData && (
                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-2">Compte débiteur</h4>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">{selectedAccountData.name}</p>
                    <p className="text-sm text-gray-600">{selectedAccountData.number}</p>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(selectedAccountData.balance, selectedAccountData.currency)}
                    </p>
                  </div>
                </div>
              )}

              {selectedBeneficiaryData && (
                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-2">Bénéficiaire</h4>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">{selectedBeneficiaryData.name}</p>
                    <p className="text-sm text-gray-600">{selectedBeneficiaryData.account}</p>
                    <p className="text-sm text-gray-600">{selectedBeneficiaryData.bank}</p>
                    <Badge variant="outline" className="mt-2">
                      {selectedBeneficiaryData.type}
                    </Badge>
                  </div>
                </div>
              )}

              {amount && (
                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-2">Montant</h4>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-lg font-bold text-blue-900">
                      {formatCurrency(Number.parseFloat(amount), selectedAccountData?.currency || "GNF")}
                    </p>
                  </div>
                </div>
              )}

              {motif && (
                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-2">Motif</h4>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">{motif}</p>
                  </div>
                </div>
              )}

              {transferDate && (
                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-2">Date d'exécution</h4>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">{transferDate}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
