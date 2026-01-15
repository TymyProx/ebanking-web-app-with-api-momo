"use client"

import type React from "react"
import { useState, useTransition, useEffect, useRef } from "react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowRight, Plus, User, Building, Check, AlertCircle } from "lucide-react"
import { useActionState } from "react"
import Link from "next/link"
import { OtpModal } from "@/components/otp-modal"

// Types
interface Beneficiary {
  id: string
  name: string
  account: string
  bank: string
  type: "BNG-BNG" | "BNG-CONFRERE" | "International"
  workflowStatus?: string
  status?: number
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

  // États pour la validation en temps réel du montant
  const [amountError, setAmountError] = useState<string>("")
  const [isAmountValid, setIsAmountValid] = useState(true)

  // États pour l'OTP
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpReferenceId, setOtpReferenceId] = useState<string | null>(null)
  const [pendingTransferData, setPendingTransferData] = useState<FormData | null>(null)

  // Refs pour le scroll automatique vers les messages
  const successMessageRef = useRef<HTMLDivElement>(null)
  const errorMessageRef = useRef<HTMLDivElement>(null)
  const validationErrorMessageRef = useRef<HTMLDivElement>(null)

  // États pour contrôler l'affichage des messages
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [showErrorMessage, setShowErrorMessage] = useState(false)

  // Fonctions utilitaires
  const toText = (val: any): string => (typeof val === "string" ? val : val ? JSON.stringify(val) : "")
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency === "GNF" ? "GNF" : currency,
      minimumFractionDigits: currency === "GNF" ? 0 : 2,
    }).format(Math.trunc(amount))
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

  const handleDebitAccountChange = (accountId: string) => {
    setSelectedAccount(accountId)
    // Reset credit account selection when debit account changes to ensure currency compatibility
    if (transferType === "account-to-account") {
      setSelectedCreditAccount("")
    }
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
      const debitAccount = accounts.find((acc) => acc.id === selectedAccount)
      const creditAccount = accounts.find((acc) => acc.id === selectedCreditAccount)
      if (debitAccount && creditAccount && debitAccount.currency !== creditAccount.currency) {
        setTransferValidationError(
          "Les virements compte à compte ne peuvent être effectués qu'entre des comptes de même devise",
        )
        return
      }
    }

    if (!amount || Number.parseFloat(amount) <= 0) {
      setTransferValidationError("Veuillez saisir un montant valide")
      return
    }

    const debitAccount = accounts.find((acc) => acc.id === selectedAccount)
    if (debitAccount && Number.parseFloat(amount) > debitAccount.balance) {
      setTransferValidationError(
        `Le montant saisi (${formatCurrency(Number.parseFloat(amount), debitAccount.currency)}) dépasse le solde disponible (${formatCurrency(debitAccount.balance, debitAccount.currency)})`,
      )
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

    // Au lieu d'exécuter directement le virement, on ouvre le modal OTP
    // Générer un référence unique pour ce virement
    const referenceId = `TRANSFER-${Date.now()}-${selectedAccount.substring(0, 8)}`
    setOtpReferenceId(referenceId)
    setPendingTransferData(formData)
    setShowOtpModal(true)
  }

  // Fonction appelée après validation OTP
  const handleOtpVerified = () => {
    if (pendingTransferData) {
      startTransition(() => {
        transferAction(pendingTransferData)
      })
      // Réinitialiser les données en attente
      setPendingTransferData(null)
      setOtpReferenceId(null)
    }
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
      setIsLoadingAccounts(true)
      const result = await getAccounts()

      if (Array.isArray(result) && result.length > 0) {
        const adaptedAccounts = result.map((apiAccount: any) => ({
          id: apiAccount.id || apiAccount.accountId,
          name: apiAccount.accountName || apiAccount.name || `Compte ${apiAccount.accountNumber || apiAccount.number}`,
          number: apiAccount.accountNumber || apiAccount.number || apiAccount.id,
          balance: apiAccount.availableBalance || apiAccount.balance || 0,
          currency: apiAccount.currency || "GNF",
          status: apiAccount.status,
        }))
        const activeAccounts = adaptedAccounts.filter(
          (account: Account) =>
            (account.status === "ACTIF" || account.status === "Actif") &&
            account.number &&
            String(account.number).trim() !== "",
        )
        setAccounts(activeAccounts)
      } else {
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
      setIsLoadingBeneficiaries(true)
      const result = await getBeneficiaries()

      // No need for client-side decryption, data is already decrypted

      if (Array.isArray(result) && result.length > 0) {
        const adaptedBeneficiaries = result.map((apiBeneficiary: any) => ({
          id: apiBeneficiary.id,
          name: apiBeneficiary.name,
          account: apiBeneficiary.accountNumber,
          bank: apiBeneficiary.bankName,
          type: apiBeneficiary.type,
          workflowStatus: apiBeneficiary.workflowStatus,
          status: apiBeneficiary.status,
        }))

        const activeBeneficiaries = adaptedBeneficiaries.filter((beneficiary: any) => {
          const workflow = (beneficiary.workflowStatus || "").toLowerCase()
          const statusValue = Number(beneficiary.status)
          const normalizedStatus = Number.isNaN(statusValue) ? 0 : statusValue

          const isStatusActive = normalizedStatus === 0 || normalizedStatus === 1
          const isWorkflowActive = workflow === "" || workflow === "disponible"

          return isStatusActive && isWorkflowActive
        })
        setBeneficiaries(activeBeneficiaries)
      } else {
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
        text: "Bénéficiaire enregistré. Il sera disponible après vérification et validation.",
      })
      // Recharger la liste des bénéficiaires
      loadBeneficiaries()
    } else if (addBeneficiaryState?.error) {
      setBeneficiaryMessage({ type: "error", text: addBeneficiaryState.error })
    }
  }, [addBeneficiaryState])

  useEffect(() => {
    if (transferValidationError && transferSubmitted) {
      // Scroll vers le message
      validationErrorMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })

      const timer = setTimeout(() => {
        setTransferValidationError("")
        setTransferSubmitted(false)
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [transferValidationError, transferSubmitted])

  useEffect(() => {
    if (transferState?.success) {
      setShowSuccessMessage(true)
      // Scroll vers le message
      successMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })

      const timer = setTimeout(() => {
        setShowSuccessMessage(false)
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [transferState?.success])

  useEffect(() => {
    if (transferState?.error) {
      setShowErrorMessage(true)
      // Scroll vers le message
      errorMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })

      const timer = setTimeout(() => {
        setShowErrorMessage(false)
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [transferState?.error])

  // Fonction de validation en temps réel du montant
  const validateAmount = (value: string) => {
    if (!value || Number.parseFloat(value) <= 0) {
      setAmountError("")
      setIsAmountValid(false)
      return false
    }

    const debitAccount = accounts.find((acc) => acc.id === selectedAccount)
    if (!debitAccount) {
      setAmountError("")
      setIsAmountValid(false)
      return false
    }

    const amountValue = Number.parseFloat(value)
    if (amountValue > debitAccount.balance) {
      setAmountError(
        `Le montant saisi (${formatCurrency(amountValue, debitAccount.currency)}) dépasse le solde disponible (${formatCurrency(debitAccount.balance, debitAccount.currency)})`,
      )
      setIsAmountValid(false)
      return false
    }

    setAmountError("")
    setIsAmountValid(true)
    return true
  }

  // Gestionnaire de changement du montant avec validation en temps réel
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAmount(value)
    validateAmount(value)
  }

  // Révalider le montant lorsque le compte change
  useEffect(() => {
    if (amount && selectedAccount) {
      validateAmount(amount)
    }
  }, [selectedAccount])

  return (
    <div className="mt-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">Effectuer un virement</h1>
        <p className="text-sm text-muted-foreground">Effectuer un virement vers un bénéficiaire ou un autre compte</p>
      </div>

      {transferValidationError && transferSubmitted && !isDialogOpen && (
        <Alert ref={validationErrorMessageRef} variant="destructive" className="border-l-4 border-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{transferValidationError}</AlertDescription>
        </Alert>
      )}

      {transferState?.success && !isDialogOpen && showSuccessMessage && (
        <Alert ref={successMessageRef} className="border-l-4 border-green-500 bg-green-50/50 dark:bg-green-950/20">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-400">
            {toText(transferState.message) || "Virement effectué avec succès !"}
          </AlertDescription>
        </Alert>
      )}

      {transferState?.error && !isDialogOpen && showErrorMessage && (
        <Alert ref={errorMessageRef} variant="destructive" className="border-l-4 border-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{toText(transferState.error)}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleTransferSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-2 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-background via-background to-primary/5">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center space-x-3 text-xl">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ArrowRight className="h-5 w-5 text-primary" />
                </div>
                <span>Type de virement</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="transferType" className="text-base font-semibold">
                  Sélectionner le type de virement *
                </Label>
                <Select value={transferType} onValueChange={handleTransferTypeChange}>
                  <SelectTrigger className="h-auto py-3 border-2 hover:border-primary/50 focus:border-primary transition-all duration-200 bg-gradient-to-r from-background to-muted/20">
                    <SelectValue placeholder="Choisir le type de virement" />
                  </SelectTrigger>
                  <SelectContent className="border-2">
                    <SelectItem value="account-to-beneficiary" className="py-4 cursor-pointer hover:bg-primary/5">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-950">
                          <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-base">Compte vers bénéficiaire</span>
                          <span className="text-sm text-muted-foreground">
                            Virement vers un bénéficiaire enregistré
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="account-to-account" className="py-4 cursor-pointer hover:bg-primary/5">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 rounded-md bg-green-100 dark:bg-green-950">
                          <ArrowRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-base">Compte à compte</span>
                          <span className="text-sm text-muted-foreground">Virement entre vos comptes</span>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-background via-background to-blue-500/5">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center space-x-3 text-xl">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span>Compte débiteur</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="account" className="text-base font-semibold">
                  Sélectionner le compte à débiter *
                </Label>
                <Select value={selectedAccount} onValueChange={handleDebitAccountChange}>
                  <SelectTrigger className="h-auto py-3 border-2 hover:border-blue-500/50 focus:border-blue-500 transition-all duration-200 bg-gradient-to-r from-background to-blue-500/10">
                    <SelectValue placeholder={isLoadingAccounts ? "Chargement..." : "Choisir un compte"} />
                  </SelectTrigger>
                  <SelectContent className="border-2">
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
                        <SelectItem
                          key={account.id}
                          value={account.id}
                          className="py-4 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20"
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col">
                              <span className="font-semibold text-base">{account.name}</span>
                              <span className="text-sm text-muted-foreground">{account.number}</span>
                            </div>
                            <span className="font-bold text-blue-600 dark:text-blue-400 ml-4">
                              {formatCurrency(account.balance, account.currency)}
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
            /* Modernized credit account card */
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-background via-background to-green-500/5">
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center space-x-3 text-xl">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950">
                    <Building className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span>Compte créditeur</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="creditAccount" className="text-base font-semibold">
                    Sélectionner le compte à créditer *
                  </Label>
                  <Select value={selectedCreditAccount} onValueChange={setSelectedCreditAccount}>
                    <SelectTrigger className="h-auto py-3 border-2 hover:border-green-500/50 focus:border-green-500 transition-all duration-200 bg-gradient-to-r from-background to-green-500/10">
                      <SelectValue placeholder={isLoadingAccounts ? "Chargement..." : "Choisir un compte"} />
                    </SelectTrigger>
                    <SelectContent className="border-2">
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
                          .filter((account) => {
                            const debitAccount = accounts.find((acc) => acc.id === selectedAccount)
                            return (
                              account.id !== selectedAccount &&
                              (!debitAccount || account.currency === debitAccount.currency)
                            )
                          })
                          .map((account) => (
                            <SelectItem
                              key={account.id}
                              value={account.id}
                              className="py-4 cursor-pointer hover:bg-green-50 dark:hover:bg-green-950/20"
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-base">{account.name}</span>
                                  <span className="text-sm text-muted-foreground">{account.number}</span>
                                </div>
                                <span className="font-bold text-green-600 dark:text-green-400 ml-4">
                                  {formatCurrency(account.balance, account.currency)}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedAccountData && transferType === "account-to-account" && (
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                        💡 Seuls les comptes en {selectedAccountData.currency} sont disponibles pour ce virement
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Modernized beneficiary card */
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-background via-background to-purple-500/5">
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-xl">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950">
                      <Building className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span>Bénéficiaire</span>
                  </div>
                  <Link href="/transfers/beneficiaries">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2 border-2 hover:border-primary hover:bg-primary/5 transition-all duration-200 bg-transparent"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Nouveau</span>
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="beneficiary" className="text-base font-semibold">
                    Sélectionner le bénéficiaire *
                  </Label>
                  <Select value={selectedBeneficiary} onValueChange={setSelectedBeneficiary}>
                    <SelectTrigger className="h-auto py-3 border-2 hover:border-purple-500/50 focus:border-purple-500 transition-all duration-200 bg-gradient-to-r from-background to-purple-500/10">
                      <SelectValue placeholder={isLoadingBeneficiaries ? "Chargement..." : "Choisir un bénéficiaire"} />
                    </SelectTrigger>
                    <SelectContent className="border-2">
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
                          <SelectItem
                            key={beneficiary.id}
                            value={beneficiary.id}
                            className="py-4 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/20"
                          >
                            <div className="flex items-start space-x-3">
                              <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-950">
                                <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-base">{beneficiary.name}</span>
                                <span className="text-sm text-muted-foreground">{beneficiary.account}</span>
                                <span className="text-sm text-muted-foreground">{beneficiary.bank}</span>
                              </div>
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

          <Card className="border-2 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-background via-background to-orange-500/5">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center space-x-3 text-xl">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950">
                  <ArrowRight className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <span>Détails du virement</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <Label htmlFor="amount" className="text-base font-semibold">
                  Montant *
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  min="1"
                  required
                  className={`h-12 text-lg border-2 transition-all duration-200 ${
                    amountError
                      ? "border-destructive focus:border-destructive hover:border-destructive"
                      : "hover:border-orange-500/50 focus:border-orange-500"
                  }`}
                />
                {amountError && (
                  <Alert variant="destructive" className="border-l-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{amountError}</AlertDescription>
                  </Alert>
                )}
                {selectedAccountData && (
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <p className="text-sm font-medium">
                      💰 Solde disponible:{" "}
                      <span className="text-primary">
                        {formatCurrency(selectedAccountData.balance, selectedAccountData.currency)}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="motif" className="text-base font-semibold">
                  Motif du virement *
                </Label>
                <Textarea
                  id="motif"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  placeholder="Indiquez le motif du virement..."
                  rows={3}
                  required
                  className="border-2 hover:border-orange-500/50 focus:border-orange-500 transition-all duration-200 resize-none"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="transferDate" className="text-base font-semibold">
                  Date d'exécution *
                </Label>
                <Input
                  id="transferDate"
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                  className="h-12 border-2 hover:border-orange-500/50 focus:border-orange-500 transition-all duration-200"
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
                !motif ||
                !isAmountValid
              }
              className="h-12 px-8 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight className="h-5 w-5 mr-2" />
              <span>{isTransferPending ? "Traitement en cours..." : "Effectuer le virement"}</span>
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-6 border-2 bg-gradient-to-br from-background via-background to-primary/10 shadow-lg">
            <CardHeader className="space-y-1 border-b bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle className="text-xl">📋 Résumé du virement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Type de virement</h4>
                <div className="p-3 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg border">
                  <p className="font-semibold">
                    {transferType === "account-to-beneficiary" ? "Compte vers bénéficiaire" : "Compte à compte"}
                  </p>
                </div>
              </div>

              {selectedAccountData && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Compte à débiter</h4>
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="font-semibold">{selectedAccountData.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedAccountData.number}</p>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">
                      {formatCurrency(selectedAccountData.balance, selectedAccountData.currency)}
                    </p>
                  </div>
                </div>
              )}

              {transferType === "account-to-beneficiary" && selectedBeneficiaryData && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Bénéficiaire</h4>
                  <div className="p-3 bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="font-semibold">{selectedBeneficiaryData.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedBeneficiaryData.account}</p>
                    <p className="text-sm text-muted-foreground">{selectedBeneficiaryData.bank}</p>
                    <Badge variant="outline" className="mt-2 border-purple-300 dark:border-purple-700">
                      {selectedBeneficiaryData.type}
                    </Badge>
                  </div>
                </div>
              )}

              {transferType === "account-to-account" && selectedCreditAccountData && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Compte à créditer</h4>
                  <div className="p-3 bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="font-semibold">{selectedCreditAccountData.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedCreditAccountData.number}</p>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-1">
                      {formatCurrency(selectedCreditAccountData.balance, selectedCreditAccountData.currency)}
                    </p>
                  </div>
                </div>
              )}

              {amount && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Montant</h4>
                  <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border-2 border-primary/20">
                    <p className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                      {formatCurrency(Number.parseFloat(amount), selectedAccountData?.currency || "GNF")}
                    </p>
                  </div>
                </div>
              )}

              {motif && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Motif</h4>
                  <div className="p-3 bg-muted/50 rounded-lg border">
                    <p className="text-sm">{motif}</p>
                  </div>
                </div>
              )}

              {transferDate && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Date d'exécution</h4>
                  <div className="p-3 bg-muted/50 rounded-lg border">
                    <p className="text-sm font-medium">
                      {new Date(transferDate).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Modal OTP */}
      <OtpModal
        open={showOtpModal}
        onOpenChange={setShowOtpModal}
        onVerified={handleOtpVerified}
        purpose="TRANSFER"
        referenceId={otpReferenceId || undefined}
        title="Confirmer le virement"
        description={`Entrez le code OTP pour confirmer le virement de ${amount ? formatCurrency(Number.parseFloat(amount), selectedAccountData?.currency || "GNF") : "0 GNF"}`}
        deliveryMethod="EMAIL"
        autoGenerate={true}
      />
    </div>
  )
}
