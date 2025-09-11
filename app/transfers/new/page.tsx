"use client"

import type React from "react"
import { useState, useTransition, useEffect } from "react"
import { addBeneficiary } from "../beneficiaries/actions"
import { executeTransfer } from "./actions" // Import de l'action executeTransfer
import { getAccounts } from "../../accounts/actions"
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
import BeneficiaryForm from "@/components/beneficiary-form"
import { useActionState } from "react"

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
  status?: string // Added status field to Account interface
}

type TransferType = "account-to-account" | "account-to-beneficiary"

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
  const [transferType, setTransferType] = useState<TransferType>("account-to-beneficiary")

  // États pour le virement
  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string>("")
  const [selectedCreditAccount, setSelectedCreditAccount] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [motif, setMotif] = useState<string>("")
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [isLoadingBeneficiaries, setIsLoadingBeneficiaries] = useState(true)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)

  const [transferValidationError, setTransferValidationError] = useState<string>("")
  const [transferSubmitted, setTransferSubmitted] = useState(false)

  // États pour le formulaire de bénéficiaire
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [transferState, transferAction, isTransferPending] = useActionState(executeTransfer, null)
  const [addBeneficiaryState, addBeneficiaryAction, isAddBeneficiaryPending] = useActionState(addBeneficiary, null)

  const [beneficiaryMessage, setBeneficiaryMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

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

  const handleTransferTypeChange = (type: TransferType) => {
    setTransferType(type)
    setSelectedBeneficiary("")
    setSelectedCreditAccount("")
    setTransferValidationError("")
    setTransferSubmitted(false)
  }

  const handleAddBeneficiary = (formData: FormData) => {
    startTransition(() => {
      addBeneficiaryAction(formData)
    })
  }

  // Gestionnaires d'événements pour le virement
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    setTransferSubmitted(true)
    setTransferValidationError("") // Réinitialiser les erreurs

    if (!selectedAccount) {
      setTransferValidationError("Veuillez sélectionner un compte débiteur")
      return
    }

    if (transferType === "account-to-beneficiary") {
      if (!selectedBeneficiary) {
        setTransferValidationError("Veuillez sélectionner un bénéficiaire")
        return
      }
    } else {
      if (!selectedCreditAccount) {
        setTransferValidationError("Veuillez sélectionner un compte créditeur")
        return
      }
      if (selectedAccount === selectedCreditAccount) {
        setTransferValidationError("Le compte débiteur et créditeur ne peuvent pas être identiques")
        return
      }
    }

    if (!amount || Number.parseFloat(amount) <= 0) {
      setTransferValidationError("Veuillez saisir un montant valide")
      return
    }
    if (!motif.trim()) {
      setTransferValidationError("Veuillez saisir le motif du virement")
      return
    }

    const formData = new FormData()
    formData.append("sourceAccount", selectedAccount)
    formData.append("transferType", transferType)

    if (transferType === "account-to-beneficiary") {
      formData.append("beneficiaryId", selectedBeneficiary)
    } else {
      formData.append("targetAccount", selectedCreditAccount)
    }

    formData.append("amount", amount)
    formData.append("purpose", motif)
    formData.append("transferDate", transferDate)

    startTransition(() => {
      transferAction(formData)
    })
  }

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setTransferValidationError("")
      setTransferSubmitted(false)
      setBeneficiaryMessage(null)
    }
  }

  const selectedAccountData = accounts.find((acc) => acc.id === selectedAccount)
  const selectedBeneficiaryData = beneficiaries.find((ben) => ben.id === selectedBeneficiary)
  const selectedCreditAccountData = accounts.find((acc) => acc.id === selectedCreditAccount)

  useEffect(() => {
    if (transferState?.success && transferSubmitted) {
      setTransferValidationError("")
      setSelectedAccount("")
      setSelectedBeneficiary("")
      setSelectedCreditAccount("")
      setAmount("")
      setMotif("")
      setTransferDate(new Date().toISOString().split("T")[0])
      setTransferSubmitted(false) // Réinitialiser l'état de soumission
    }
  }, [transferState?.success, transferSubmitted])

  const loadAccounts = async () => {
    try {
      console.log("[v0] Chargement des comptes...")
      setIsLoadingAccounts(true)
      const result = await getAccounts()
      console.log("[v0] Résultat getAccounts:", result)

      if (Array.isArray(result) && result.length > 0) {
        // Adapter les données API au format Account
        const adaptedAccounts = result.map((apiAccount: any) => ({
          id: apiAccount.id || apiAccount.accountId,
          name: apiAccount.accountName || apiAccount.name || `Compte ${apiAccount.accountNumber || apiAccount.number}`,
          number: apiAccount.accountNumber || apiAccount.number || apiAccount.id,
          balance: apiAccount.bookBalance || apiAccount.balance || 0,
          currency: apiAccount.currency || "GNF",
          status: apiAccount.status, // Added status field mapping
        }))
        const activeAccounts = adaptedAccounts.filter(
          (account: Account) =>
            (account.status === "ACTIVE" || account.status === "Actif") &&
            account.number &&
            String(account.number).trim() !== "",
        )
        console.log("[v0] Comptes actifs avec numéro valide:", activeAccounts)
        setAccounts(activeAccounts)
      } else {
        console.log("[v0] Aucun compte trouvé, utilisation des données de test")
        setAccounts([])
      }
    } catch (error) {
      console.error("[v0] Erreur lors du chargement des comptes:", error)
      setAccounts([])
    } finally {
      setIsLoadingAccounts(false)
    }
  }

  const loadBeneficiaries = async () => {
    try {
      console.log("[v0] Chargement des bénéficiaires...")
      setIsLoadingBeneficiaries(true)
      const result = await getBeneficiaries()
      console.log("[v0] Résultat getBeneficiaries:", result)

      if (Array.isArray(result) && result.length > 0) {
        // Adapter les données API au format Beneficiary
        const adaptedBeneficiaries = result.map((apiBeneficiary: any) => ({
          id: apiBeneficiary.id,
          name: apiBeneficiary.name,
          account: apiBeneficiary.accountNumber,
          bank: apiBeneficiary.bankName,
          type: apiBeneficiary.beneficiaryType || "BNG-BNG",
        }))
        console.log("[v0] Bénéficiaires adaptés:", adaptedBeneficiaries)
        setBeneficiaries(adaptedBeneficiaries)
      } else {
        console.log("[v0] Aucun bénéficiaire trouvé")
        setBeneficiaries([])
      }
    } catch (error) {
      console.error("[v0] Erreur lors du chargement des bénéficiaires:", error)
      setBeneficiaries([])
    } finally {
      setIsLoadingBeneficiaries(false)
    }
  }

  useEffect(() => {
    loadAccounts()
    loadBeneficiaries()
  }, [])

  useEffect(() => {
    if (addBeneficiaryState?.success) {
      setBeneficiaryMessage({
        type: "success",
        text: addBeneficiaryState.message || "Bénéficiaire ajouté avec succès !",
      })
      // Recharger la liste des bénéficiaires
      loadBeneficiaries()
    } else if (addBeneficiaryState?.error) {
      setBeneficiaryMessage({ type: "error", text: addBeneficiaryState.error })
    }
  }, [addBeneficiaryState])

  useEffect(() => {
    if (transferValidationError && transferSubmitted) {
      const timer = setTimeout(() => {
        setTransferValidationError("")
        setTransferSubmitted(false)
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [transferValidationError, transferSubmitted])

  useEffect(() => {
    if (transferState?.success) {
      const timer = setTimeout(() => {
        // Les messages de succès se réinitialiseront naturellement lors des prochaines interactions
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [transferState?.success])

  useEffect(() => {
    if (transferState?.error) {
      const timer = setTimeout(() => {
        // Les messages d'erreur se réinitialiseront naturellement lors des prochaines interactions
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [transferState?.error])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau virement</h1>
        <p className="text-gray-600">Effectuer un virement vers un bénéficiaire ou un autre compte</p>
      </div>

      {transferValidationError && transferSubmitted && !isDialogOpen && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{transferValidationError}</AlertDescription>
        </Alert>
      )}

      {transferState?.success && !isDialogOpen && (
        <Alert className="border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {transferState.message || "Virement effectué avec succès !"}
          </AlertDescription>
        </Alert>
      )}

      {transferState?.error && !isDialogOpen && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{transferState.error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleTransferSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ArrowRight className="h-5 w-5" />
                <span>Type de virement</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transferType">Sélectionner le type de virement *</Label>
                <Select value={transferType} onValueChange={handleTransferTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir le type de virement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="account-to-beneficiary">
                      <div className="flex flex-col">
                        <span className="font-medium">Compte vers bénéficiaire</span>
                        <span className="text-sm text-gray-500">Virement vers un bénéficiaire enregistré</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="account-to-account">
                      <div className="flex flex-col">
                        <span className="font-medium">Compte à compte</span>
                        <span className="text-sm text-gray-500">Virement entre vos comptes</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

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
                    <SelectValue placeholder={isLoadingAccounts ? "Chargement..." : "Choisir un compte"} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingAccounts ? (
                      <SelectItem value="loading" disabled>
                        Chargement des comptes...
                      </SelectItem>
                    ) : accounts.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        Aucun compte trouvé
                      </SelectItem>
                    ) : (
                      accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{account.name}</span>
                            <span className="text-sm text-gray-500">
                              {account.number} • {formatCurrency(account.balance, account.currency)}
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

          {transferType === "account-to-account" ? (
            /* Compte créditeur pour compte à compte */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Compte créditeur</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="creditAccount">Sélectionner le compte à créditer *</Label>
                  <Select value={selectedCreditAccount} onValueChange={setSelectedCreditAccount}>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingAccounts ? "Chargement..." : "Choisir un compte"} />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingAccounts ? (
                        <SelectItem value="loading" disabled>
                          Chargement des comptes...
                        </SelectItem>
                      ) : accounts.length === 0 ? (
                        <SelectItem value="empty" disabled>
                          Aucun compte trouvé
                        </SelectItem>
                      ) : (
                        accounts
                          .filter((account) => account.id !== selectedAccount) // Exclure le compte débiteur
                          .map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{account.name}</span>
                                <span className="text-sm text-gray-500">
                                  {account.number} • {formatCurrency(account.balance, account.currency)}
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
          ) : (
            /* Bénéficiaire pour compte vers bénéficiaire */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building className="h-5 w-5" />
                    <span>Bénéficiaire</span>
                  </div>
                  <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-transparent">
                        <Plus className="h-4 w-4" />
                        <span>Nouveau bénéficiaire</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Ajouter un bénéficiaire</DialogTitle>
                      </DialogHeader>

                      <BeneficiaryForm
                        successMessage={beneficiaryMessage?.type === "success" ? beneficiaryMessage.text : undefined}
                        errorMessage={beneficiaryMessage?.type === "error" ? beneficiaryMessage.text : undefined}
                        onMessageClear={() => {
                          setBeneficiaryMessage(null)
                        }}
                        onSubmit={handleAddBeneficiary}
                        onCancel={() => setIsDialogOpen(false)}
                        isPending={isAddBeneficiaryPending}
                      />
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
          )}

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
              disabled={
                isTransferPending ||
                !selectedAccount ||
                (transferType === "account-to-beneficiary" ? !selectedBeneficiary : !selectedCreditAccount) ||
                !amount ||
                !motif
              }
              className="flex items-center space-x-2"
            >
              <ArrowRight className="h-4 w-4" />
              <span>{isTransferPending ? "Traitement..." : "Effectuer le virement"}</span>
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
              <div>
                <h4 className="font-medium text-sm text-gray-600 mb-2">Type de virement</h4>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">
                    {transferType === "account-to-beneficiary" ? "Compte vers bénéficiaire" : "Compte à compte"}
                  </p>
                </div>
              </div>

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

              {transferType === "account-to-beneficiary" && selectedBeneficiaryData && (
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

              {transferType === "account-to-account" && selectedCreditAccountData && (
                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-2">Compte créditeur</h4>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">{selectedCreditAccountData.name}</p>
                    <p className="text-sm text-gray-600">{selectedCreditAccountData.number}</p>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(selectedCreditAccountData.balance, selectedCreditAccountData.currency)}
                    </p>
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
