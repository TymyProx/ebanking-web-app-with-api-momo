"use client"

import { useState, useEffect, useTransition } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Download,
  FileText,
  Calendar,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  FileSpreadsheet,
  History,
  Mail,
  Wallet,
  PiggyBank,
  DollarSign,
} from "lucide-react"
import { generateStatement, sendStatementByEmail, getTransactionsByNumCompte } from "./actions"
import { useActionState } from "react"
import { getAccounts } from "../actions"

interface Account {
  id: string
  name: string
  number: string
  balance: number
  currency: string
  type: "Courant" | "Épargne" | "Devise"
  status: "Actif" | "Bloqué" | "Fermé" | "ACTIF"
  iban: string
}

interface StatementRequest {
  accountId: string
  startDate: string
  endDate: string
  format: "pdf" | "excel"
  includeImages: boolean
  language: "fr" | "en"
}

interface StatementHistory {
  id: string
  accountName: string
  period: string
  format: string
  generatedAt: string
  downloadCount: number
  fileSize: string
  status: "Généré" | "Expiré" | "En cours"
}

const predefinedPeriods = [
  {
    value: "lastMonth",
    label: "Dernier mois",
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  },
  {
    value: "thisMonth",
    label: "Ce mois",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  },
  { value: "custom", label: "Personnalisé" },
]

const statementHistory = [
  {
    id: "1",
    accountName: "Compte Courant",
    period: "01/01/2023 - 31/01/2023",
    format: "PDF",
    generatedAt: "01/02/2023",
    downloadCount: 5,
    fileSize: "2MB",
    status: "Généré",
  },
  {
    id: "2",
    accountName: "Compte Épargne",
    period: "01/02/2023 - 28/02/2023",
    format: "Excel",
    generatedAt: "01/03/2023",
    downloadCount: 3,
    fileSize: "1.5MB",
    status: "Expiré",
  },
]

export default function StatementsPage() {
  const searchParams = useSearchParams()
  const preSelectedAccountId = searchParams.get("accountId")

  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [format, setFormat] = useState<"pdf" | "excel">("pdf")
  const [includeImages, setIncludeImages] = useState(false)
  const [language, setLanguage] = useState<"fr" | "en">("fr")
  const [emailAddress, setEmailAddress] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("")
  const [displayLimit, setDisplayLimit] = useState(50) // Limit initial display
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([])
  const [transactionCount, setTransactionCount] = useState(0)
  const [showDownloadLink, setShowDownloadLink] = useState(false)
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>("")

  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([]) // Kept for potential future use, but not used in the new generation logic

  // États pour les actions serveur
  const [generateState, generateAction, isGenerating] = useActionState(generateStatement, null)
  const [emailState, emailAction, isSending] = useActionState(sendStatementByEmail, null)

  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const accountsData = await getAccounts()
        //console.log("[v0] Comptes récupérés pour relevés:", accountsData)

        if (Array.isArray(accountsData)) {
          const adaptedAccounts: Account[] = accountsData.map((acc: any) => ({
            id: acc.id || acc.accountId,
            name: acc.accountName || acc.name || `Compte ${acc.accountNumber}`,
            number: acc.accountNumber,
            balance: Number.parseFloat(acc.bookBalance || acc.balance || "0"),
            currency: acc.currency || "GNF",
            type: acc.type,
            status: acc.status,
            iban: `GN82BNG001${acc.accountNumber}`,
          }))

          const activeAccounts = adaptedAccounts.filter(
            (account) => account.status === "Actif" || account.status === "ACTIF",
          )
          setAccounts(activeAccounts)
        }
      } catch (error) {
        // console.error("Erreur lors du chargement des comptes:", error)
        // Fallback vers des données de test en cas d'erreur
        setAccounts([
          {
            id: "1",
            name: "Compte Courant",
            number: "0001-234567-89",
            balance: 2400000,
            currency: "GNF",
            type: "Courant",
            status: "Actif",
            iban: "GN82BNG0010001234567",
          },
        ])
      } finally {
        setIsLoadingAccounts(false)
      }
    }

    loadAccounts()
  }, [])

  useEffect(() => {
    const loadTransactions = async () => {
      if (!selectedAccount) return

      try {
        const transactionsData = await getTransactionsByNumCompte(selectedAccount)

        if (!transactionsData.success) {
          alert(`❌ ${transactionsData.error || "Impossible de récupérer les transactions"}`)
          return
        }

        const allTransactions = transactionsData.data

        console.log("[v0] Total transactions reçues:", allTransactions.length)

        // Filter by valueDate
        const filteredTransactions = allTransactions.filter((txn: any) => {
          if (!txn.valueDate) return false

          const txnDate = new Date(txn.valueDate)
          const start = new Date(startDate)
          const end = new Date(endDate)

          const isInRange = txnDate >= start && txnDate <= end

          return isInRange
        })

        console.log("[v0] Transactions après filtre par valueDate:", filteredTransactions.length)

        // if (filteredTransactions.length === 0) {
        //   alert("❌ Aucune transaction trouvée pour cette période.")
        //   return
        // }

        // Extract only the 4 required fields
        const cleanedTransactions = filteredTransactions.map((txn: any) => ({
          referenceOperation: txn.referenceOperation || "",
          montantOperation: txn.montantOperation || 0,
          description: txn.description || "",
          valueDate: txn.valueDate || "",
        }))

        console.log("[v0] Transactions nettoyées (4 champs):", cleanedTransactions.length)

        setTransactions(cleanedTransactions)
      } catch (error) {
        console.error("[v0] Erreur lors de la récupération des transactions:", error)
        alert("❌ Erreur lors de la récupération des transactions")
      }
    }

    loadTransactions()
  }, [selectedAccount])

  // Pré-sélectionner le compte si fourni dans l'URL
  useEffect(() => {
    // User must now manually select an account before generating statements
    // if (preSelectedAccountId && accounts.find((acc) => acc.id === preSelectedAccountId)) {
    //   setSelectedAccount(preSelectedAccountId)
    // }
  }, [preSelectedAccountId, accounts])

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value)
    const period = predefinedPeriods.find((p) => p.value === value)
    if (period && value !== "custom") {
      setStartDate(period.startDate ?? "")
      setEndDate(period.endDate ?? "")
    } else if (value === "custom") {
      setStartDate("")
      setEndDate("")
    }
  }
  const handleGenerateStatement = async () => {
    if (!selectedAccount || !startDate || !endDate) {
      return
    }

    setIsLoadingTransactions(true)
    setShowDownloadLink(false)
    setFilteredTransactions([])
    setTransactionCount(0)
    setErrorMessage("")

    const selectedAccountData = accounts.find((acc) => acc.id === selectedAccount)
    if (!selectedAccountData) {
      setIsLoadingTransactions(false)
      return
    }

    const accountNumber = selectedAccountData.number

    console.log("[v0] === GÉNÉRATION DU RELEVÉ ===")
    console.log("[v0] numCompte utilisé:", accountNumber)
    console.log("[v0] Date début:", startDate)
    console.log("[v0] Date fin:", endDate)

    try {
      const result = await getTransactionsByNumCompte(accountNumber)

      if (!result.success) {
        setErrorMessage(result.error || "Impossible de récupérer les transactions")
        setIsLoadingTransactions(false)
        return
      }

      const allTransactions = result.data

      console.log("[v0] Total transactions reçues:", allTransactions.length)

      const filteredTxns = allTransactions.filter((txn: any) => {
        if (!txn.valueDate) return false

        const txnDate = new Date(txn.valueDate)
        const start = new Date(startDate)
        const end = new Date(endDate)

        const isInRange = txnDate >= start && txnDate <= end

        return isInRange
      })

      console.log("[v0] Transactions après filtre par valueDate:", filteredTxns.length)

      if (filteredTxns.length === 0) {
        setErrorMessage("Aucune transaction trouvée pour cette période.")
        setIsLoadingTransactions(false)
        return
      }

      const firstTxn = filteredTxns[0]
      const lastTxn = filteredTxns[filteredTxns.length - 1]

      const balanceOuverture = firstTxn?.balanceOuverture || selectedAccountData.balance
      const balanceFermeture = lastTxn?.balanceFermeture || selectedAccountData.balance

      const cleanedTransactions = filteredTxns.map((txn: any) => ({
        referenceOperation: txn.referenceOperation || "",
        montantOperation: txn.montantOperation || 0,
        description: txn.description || "",
        valueDate: txn.valueDate || "",
        dateEcriture: txn.dateEcriture || "",
        ...(txn === firstTxn && { balanceOuverture }),
        ...(txn === lastTxn && { balanceFermeture }),
      }))

      console.log("[v0] Transactions nettoyées (4 champs):", cleanedTransactions.length)

      setFilteredTransactions(cleanedTransactions)
      setTransactionCount(cleanedTransactions.length)
      setShowDownloadLink(true)
    } catch (error) {
      console.error("[v0] Erreur lors de la récupération des transactions:", error)
      setErrorMessage("Erreur lors de la récupération des transactions")
    } finally {
      setIsLoadingTransactions(false)
    }
  }

  const handleDownloadPDF = () => {
    const selectedAccountData = accounts.find((acc) => acc.id === selectedAccount)
    if (!selectedAccountData || filteredTransactions.length === 0) return

    const balanceOuverture = filteredTransactions[0]?.balanceOuverture || selectedAccountData.balance
    const balanceFermeture =
      filteredTransactions[filteredTransactions.length - 1]?.balanceFermeture || selectedAccountData.balance

    generateAndDownloadPDFWithTransactions(
      selectedAccountData,
      filteredTransactions,
      balanceOuverture,
      balanceFermeture,
    )
  }

  const handleSendByEmail = async () => {
    if (!emailAddress || !generateState?.success) {
      return
    }

    const formData = new FormData()
    formData.append("email", emailAddress)
    formData.append("statementId", generateState.statementId ?? "")

    startTransition(() => {
      emailAction(formData)
    })
  }

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

  const formatAmount = (amount: number, currency = "GNF") => {
    if (currency === "GNF") {
      return new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
        .format(amount)
        .replace(/\s/g, " ")
    }
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const isFormValid = selectedAccount && startDate && endDate && new Date(startDate) <= new Date(endDate)

  // Trouver le compte pré-sélectionné pour afficher un message
  const preSelectedAccount = preSelectedAccountId ? accounts.find((acc) => acc.id === preSelectedAccountId) : null

  const selectedAccountData = accounts.find((acc) => acc.id === selectedAccount)

  return (
    <div className="mt-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-primary">Relevé de comptes</h1>
        <p className="text-sm text-muted-foreground">Générez et téléchargez vos relevés de compte</p>
        {preSelectedAccountId && accounts.find((acc) => acc.id === preSelectedAccountId) && (
          <div>
            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Compte pré-sélectionné : {accounts.find((acc) => acc.id === preSelectedAccountId)?.name} (
                {accounts.find((acc) => acc.id === preSelectedAccountId)?.number})
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>

      {showDownloadLink && transactionCount > 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 flex items-center justify-between">
            <span>{transactionCount} transaction(s) trouvée(s) pour cette période.</span>
            <Button
              variant="link"
              className="p-0 h-auto text-green-700 underline font-semibold"
              onClick={handleDownloadPDF}
            >
              <Download className="w-4 h-4 mr-1" />
              Télécharger le relevé
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!isLoadingTransactions && errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {generateState?.success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ✅ Relevé généré avec succès ! ({generateState.transactionCount} transactions)
            <Button
              variant="link"
              className="p-0 h-auto text-green-700 underline ml-2"
              onClick={() => {
                // Note: The logic to actually download here is removed as generation happens directly in handleGenerateStatement
              }}
            >
              Télécharger maintenant
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {generateState?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>❌ {generateState.error}</AlertDescription>
        </Alert>
      )}

      {emailState?.success && (
        <Alert className="border-blue-200 bg-blue-50">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">✅ Relevé envoyé par email à {emailAddress}</AlertDescription>
        </Alert>
      )}

      {isGenerating && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Clock className="h-4 w-4 text-yellow-600 animate-pulse" />
          <AlertDescription className="text-yellow-800">
            ⏳ Téléchargement du relevé en cours... Veuillez patienter.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="generate" className="space-y-3">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Générer un relevé</TabsTrigger>
          <TabsTrigger value="history">Historique des relevés</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-3">
          {/* Sélection du compte */}
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="flex items-center text-base">
                <CreditCard className="w-4 h-4 mr-2" />
                Sélection du compte
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 pb-3">
              {isLoadingAccounts ? (
                <div className="text-center py-2">
                  <Clock className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-gray-500">Chargement des comptes...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger className="w-full h-auto py-2">
                      <SelectValue placeholder="Sélectionnez un compte">
                        {selectedAccountData && (
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              {getAccountIcon(selectedAccountData.type)}
                              <div className="text-left">
                                <div className="font-medium text-sm">{selectedAccountData.name}</div>
                                <div className="text-xs text-muted-foreground font-mono">
                                  {selectedAccountData.number}
                                </div>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="font-bold text-sm">
                                {formatAmount(selectedAccountData.balance, selectedAccountData.currency)}{" "}
                                {selectedAccountData.currency}
                              </div>
                            </div>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px]">
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id} className="h-auto py-2">
                          <div className="flex items-center justify-between w-full gap-4">
                            <div className="flex items-center gap-2 flex-1">
                              {getAccountIcon(account.type)}
                              <div className="text-left">
                                <div className="font-medium flex items-center gap-1.5 text-sm">
                                  {account.name}
                                  {preSelectedAccountId === account.id && (
                                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                      Suggéré
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">{account.number}</div>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="font-bold text-sm">
                                {formatAmount(account.balance, account.currency)} {account.currency}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuration du relevé */}
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="flex items-center text-base">
                <Calendar className="w-4 h-4 mr-2" />
                Détails du relevé
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2 pb-3">
              {/* Sélection de période */}
              <div className="space-y-2">
                <Label className="text-sm">Période du relevé</Label>
                <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Choisir une période" />
                  </SelectTrigger>
                  <SelectContent>
                    {predefinedPeriods.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedPeriod === "custom" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="startDate" className="text-sm">
                        Date de début
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        max={endDate || undefined}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate" className="text-sm">
                        Date de fin
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || undefined}
                        max={new Date().toISOString().split("T")[0]}
                        className="h-9"
                      />
                    </div>
                  </div>
                )}

                {startDate && endDate && (
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Période sélectionnée : du {new Date(startDate).toLocaleDateString("fr-FR")} au{" "}
                      {new Date(endDate).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                )}
              </div>

              {/* Options de format */}
              {/* <div className="space-y-2">
                <Label className="text-sm">Format du fichier</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className={`p-2 border rounded-lg cursor-pointer transition-all ${
                      format === "pdf"
                        ? "border-red-500 bg-red-50 ring-2 ring-red-200"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setFormat("pdf")}
                  >
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-medium text-sm">PDF</p>
                        <p className="text-xs text-gray-500">Format standard</p>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`p-2 border rounded-lg cursor-pointer transition-all ${
                      format === "excel"
                        ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setFormat("excel")}
                  >
                    <div className="flex items-center space-x-2">
                      <FileSpreadsheet className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-sm">Excel</p>
                        <p className="text-xs text-gray-500">Format tableur</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div> */}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="flex items-center text-base">
                <Download className="w-4 h-4 mr-2" />
                Téléchargement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2 pb-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleGenerateStatement}
                  disabled={!isFormValid || isLoadingTransactions}
                  className="flex-1 h-9"
                >
                  {isLoadingTransactions ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Recherche en cours...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                     Demander relevé
                    </>
                  )}
                </Button>
              </div>

              {/* Envoi par email */}
              {generateState?.success && (
                <div className="border-t pt-3 space-y-2">
                  <Label htmlFor="email" className="text-sm">
                    Envoyer par email (optionnel)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      className="flex-1 h-9"
                    />
                    <Button
                      onClick={handleSendByEmail}
                      disabled={!emailAddress || isSending || isPending}
                      variant="outline"
                      className="h-9 bg-transparent"
                    >
                      {isSending || isPending ? (
                        <Clock className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {!isFormValid && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Veuillez sélectionner un compte et une période valide pour continuer.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-3">
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="flex items-center text-base">
                <History className="w-4 h-4 mr-2" />
                Historique des relevés générés
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 pb-3">
              {statementHistory.length === 0 ? (
                <div className="text-center py-4">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Aucun relevé généré récemment</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {statementHistory.map((statement) => (
                    <div
                      key={statement.id}
                      className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          {statement.format === "PDF" ? (
                            <FileText className="w-4 h-4 text-red-600" />
                          ) : (
                            <FileSpreadsheet className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{statement.accountName}</p>
                          <p className="text-xs text-gray-500">{statement.period}</p>
                          <p className="text-xs text-gray-400">
                            Généré le {statement.generatedAt} • {statement.fileSize}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            statement.status === "Généré"
                              ? "default"
                              : statement.status === "Expiré"
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {statement.status}
                        </Badge>
                        <div className="text-right text-xs">
                          <p className="text-gray-600">{statement.downloadCount} téléchargements</p>
                        </div>
                        {statement.status === "Généré" && (
                          <Button size="sm" variant="outline" className="h-7 w-7 p-0 bg-transparent">
                            <Download className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )

  function generateAndDownloadPDFWithTransactions(
    account: Account,
    transactions: any[],
    balanceOuverture: number,
    balanceFermeture: number,
  ) {
    try {
      const { jsPDF } = require("jspdf")
      const doc = new jsPDF()

      const pageWidth = 210
      const pageHeight = 297

      // Couleurs
      const blackText: [number, number, number] = [0, 0, 0]
      const grayText: [number, number, number] = [100, 100, 100]

      // Charger le logo BNG
      let yPos = 15

      // Logo BNG (même position que dans le RIB)
      const img = new Image()
      img.src = "/images/logo-bng.png"
      img.crossOrigin = "anonymous"

      img.onload = () => {
        doc.addImage(img, "PNG", 15, yPos, 35, 12)
        continueGeneratingPDF()
      }

      img.onerror = () => {
        console.warn("[v0] Logo BNG non trouvé, génération sans logo")
        continueGeneratingPDF()
      }

      const continueGeneratingPDF = () => {
        yPos = 40

        // TITRE DE LA BANQUE (même style que RIB)
        doc.setTextColor(...blackText)
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("BANQUE NATIONALE DE GUINÉE", 15, yPos)

        yPos += 5
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.text("6ème Avenue Boulevard DIALLO Telly BP: 1781 Conakry", 15, yPos)

        yPos += 12

        // DÉPARTEMENT
        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.text("DEPARTEMENT DES OPERATIONS", 15, yPos)

        yPos += 12

        // TITRE DU DOCUMENT
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.text("RELEVÉ DE COMPTE", 15, yPos)

        yPos += 8

        // PÉRIODE
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.text(
          `Période: ${new Date(startDate).toLocaleDateString("fr-FR")} au ${new Date(endDate).toLocaleDateString(
            "fr-FR",
          )}`,
          15,
          yPos,
        )

        yPos += 10

        // INFORMATIONS DU COMPTE
        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.text(`COMPTE: ${account.name.toUpperCase()}`, 15, yPos)

        yPos += 6

        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.text(`Numéro de compte: ${account.number}`, 15, yPos)

        yPos += 4
        doc.text(`IBAN: ${account.iban}`, 15, yPos)

        yPos += 10

        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.text("SOLDE D'OUVERTURE:", 15, yPos)

        doc.setFont("helvetica", "normal")
        doc.text(`${formatAmount(balanceOuverture)} ${account.currency}`, 70, yPos)

        yPos += 10

        // TABLEAU DES TRANSACTIONS (SANS GRILLES)
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.text(`TRANSACTIONS (${transactions.length})`, 15, yPos)

        yPos += 8

        const tableStartX = 15
        const col1Width = 25 // Date Valeur
        const col2Width = 50 // Description
        const col3Width = 35 // Reference
        const col4Width = 30 // Date Operation (dateEcriture)
        const col5Width = 30 // Montant
        const rowHeight = 9

        // EN-TÊTES SANS CADRE
        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.text("Date Valeur", tableStartX + 2, yPos + 6)
        doc.text("Description", tableStartX + col1Width + 2, yPos + 6)
        doc.text("Référence", tableStartX + col1Width + col2Width + 2, yPos + 6)
        doc.text("Date Opération", tableStartX + col1Width + col2Width + col3Width + 2, yPos + 6)
        doc.text("Montant", tableStartX + col1Width + col2Width + col3Width + col4Width + 2, yPos + 6)

        yPos += rowHeight

        doc.setFont("helvetica", "normal")
        doc.setFontSize(8)

        transactions.forEach((txn) => {
          if (yPos > 260) {
            doc.addPage()
            yPos = 30

            // Réécrire les entêtes sur la nouvelle page
            doc.setFontSize(9)
            doc.setFont("helvetica", "bold")
            doc.text("Date Valeur", tableStartX + 2, yPos + 6)
            doc.text("Description", tableStartX + col1Width + 2, yPos + 6)
            doc.text("Référence", tableStartX + col1Width + col2Width + 2, yPos + 6)
            doc.text("Date Opération", tableStartX + col1Width + col2Width + col3Width + 2, yPos + 6)
            doc.text("Montant", tableStartX + col1Width + col2Width + col3Width + col4Width + 2, yPos + 6)

            yPos += rowHeight
            doc.setFont("helvetica", "normal")
            doc.setFontSize(8)
          }

          // Date Valeur
          const dateValeur = txn.valueDate ? new Date(txn.valueDate).toLocaleDateString("fr-FR") : "N/A"
          doc.text(dateValeur, tableStartX + 2, yPos + 6)

          // Description (tronquée)
          const description = (txn.description || "N/A").substring(0, 30)
          doc.text(description, tableStartX + col1Width + 2, yPos + 6)

          // Reference (tronquée)
          const reference = (txn.referenceOperation || "N/A").substring(0, 20)
          doc.text(reference, tableStartX + col1Width + col2Width + 2, yPos + 6)

          // Date Operation (dateEcriture)
          const dateOperation = txn.dateEcriture ? new Date(txn.dateEcriture).toLocaleDateString("fr-FR") : "N/A"
          doc.text(dateOperation, tableStartX + col1Width + col2Width + col3Width + 2, yPos + 6)

          // Montant
          const montant = formatAmount(txn.montantOperation)
          doc.text(`${montant}`, tableStartX + col1Width + col2Width + col3Width + col4Width + 2, yPos + 6)

          yPos += rowHeight
        })

        yPos += 10

        // SOLDE DE FERMETURE
        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.text("SOLDE DE FERMETURE:", 15, yPos)

        doc.setFont("helvetica", "normal")
        doc.text(`${formatAmount(balanceFermeture)} ${account.currency}`, 70, yPos)

        yPos += 10

        // PIED DE PAGE
        const addFooter = (pageNum: number, totalPages: number) => {
          const footerY = pageHeight - 20

          doc.setDrawColor(150, 150, 150)
          doc.setLineWidth(0.3)
          doc.line(15, footerY, pageWidth - 15, footerY)

          let footerTextY = footerY + 5

          doc.setTextColor(...grayText)
          doc.setFontSize(7)
          doc.setFont("helvetica", "normal")

          const footerLines = [
            "Banque Nationale de Guinée SA - Agrément par décision N° 06/019/93/CAB/PE 06/06/1993",
            "Capital : 60.000.000.000 GNF",
            "Boulevard Tidiani Kaba - Quartier Boulbinet/Almamya, Kaloum, Conakry, Guinée",
            "Tél: +224 - 622 454 049 - B.P 1781 - mail: contact@bng.gn",
          ]

          footerLines.forEach((line) => {
            doc.text(line, 15, footerTextY)
            footerTextY += 3
          })

          // Numéro de page
          doc.setFontSize(7)
          doc.text(`Page ${pageNum} sur ${totalPages}`, pageWidth - 35, footerY + 5)
        }

        const pageCount = doc.internal.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i)
          addFooter(i, pageCount)
        }

        const fileName = `Releve_Compte_${account.number.replace(/-/g, "_")}_${
          new Date().toISOString().split("T")[0]
        }.pdf`
        doc.save(fileName)

        console.log("[v0] PDF généré et téléchargé:", fileName)
      }

      // Si l'image ne se charge pas après 2 secondes, générer sans logo
      setTimeout(() => {
        if (yPos === 15) {
          continueGeneratingPDF()
        }
      }, 2000)
    } catch (error) {
      console.error("[v0] Erreur génération PDF:", error)
      alert("❌ Erreur lors de la génération du PDF")
    }
  }

  function generateAndDownloadExcelWithTransactions(account: Account, transactions: any[]) {
    try {
      let csvContent = "\uFEFF" // BOM UTF-8 pour Excel

      csvContent += `RELEVÉ DE COMPTE\n`
      csvContent += `Compte: ${account.name}\n`
      csvContent += `Numéro: ${account.number}\n`
      csvContent += `Période: ${new Date(startDate).toLocaleDateString("fr-FR")} au ${new Date(endDate).toLocaleDateString("fr-FR")}\n\n`

      // En-têtes des colonnes (4 champs uniquement)
      csvContent += "Référence,Montant,Description,Date valeur\n"

      // Données des transactions
      transactions.forEach((txn) => {
        csvContent += `${txn.referenceOperation || "N/A"},`
        csvContent += `${formatAmount(txn.montantOperation)} GNF,`
        csvContent += `"${(txn.description || "N/A").replace(/"/g, '""')}",`
        csvContent += `${new Date(txn.valueDate).toLocaleDateString("fr-FR")}\n`
      })

      // Téléchargement
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `releve_${account.number}_${startDate}_${endDate}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)

      console.log("[v0] Excel/CSV généré et téléchargé")
    } catch (error) {
      console.error("[v0] Erreur génération Excel:", error)
      alert("❌ Erreur lors de la génération du fichier Excel")
    }
  }

  function generateAndDownloadTextWithTransactions(account: Account, transactions: any[]) {
    let content = `RELEVÉ DE COMPTE\n`
    content += `================\n\n`
    content += `Compte: ${account.name}\n`
    content += `Numéro: ${account.number}\n`
    content += `IBAN: ${account.iban}\n`
    content += `Période: ${new Date(startDate).toLocaleDateString("fr-FR")} au ${new Date(endDate).toLocaleDateString("fr-FR")}\n\n`
    content += `TRANSACTIONS (${transactions.length})\n`
    content += `=============\n\n`

    transactions.forEach((txn) => {
      content += `Référence: ${txn.referenceOperation || "N/A"}\n`
      content += `Montant: ${formatAmount(txn.montantOperation)} GNF\n`
      content += `Description: ${txn.description || "N/A"}\n`
      content += `Date valeur: ${new Date(txn.valueDate).toLocaleDateString("fr-FR")}\n`
      content += `---\n\n`
    })

    content += `\nGénéré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}\n`

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `releve_${account.number}_${startDate}_${endDate}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)

    console.log("[v0] Relevé texte généré et téléchargé")
  }
}
