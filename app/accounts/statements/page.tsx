"use client"

import { useState, useEffect, useTransition } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Download,
  Calendar,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  Mail,
  Wallet,
  PiggyBank,
  DollarSign,
  FileText,
  FileSpreadsheet,
} from "lucide-react"
import { generateStatement, sendStatementByEmail, getTransactionsByNumCompte } from "./actions"
import { useActionState } from "react"
import { getAccounts, getAccountById } from "../actions"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import jsPDF from "jspdf"
import * as XLSX from "xlsx" // Added import for Excel generation

interface Account {
  id: string
  name: string
  number: string
  balance: number
  currency: string
  type: "Courant" | "Épargne" | "Devise"
  status: "Actif" | "Bloqué" | "Fermé" | "ACTIF"
  iban: string
  designation?: string
  accountTypeLabel?: string
  branch?: string
}

interface StatementRequest {
  accountId: string
  startDate: string
  endDate: string
  format: "pdf" | "excel"
  includeImages: boolean
  language: "fr" | "en"
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

export default function StatementsPage() {
  const searchParams = useSearchParams()
  const preSelectedAccountId = searchParams.get("accountId")

  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [format, setFormat] = useState<"pdf" | "excel">("pdf") // Changed state
  const [includeImages, setIncludeImages] = useState(false)
  const [language, setLanguage] = useState<"fr" | "en">("fr")
  const [emailAddress, setEmailAddress] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState("custom") // Removed predefined periods, only keep custom period with date fields
  const [displayLimit, setDisplayLimit] = useState(50) // Limit initial display
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([])
  const [transactionCount, setTransactionCount] = useState(0)
  const [showDownloadLink, setShowDownloadLink] = useState(false)
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [sixMonthsWarning, setSixMonthsWarning] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([]) // Kept for potential future use, but not used in the new generation logic
  const [generateState, generateAction, isGenerating] = useActionState(generateStatement, null)
  const [emailState, emailAction, isSending] = useActionState(sendStatementByEmail, null)
  const [isPending, startTransition] = useTransition()
  const [hasSearched, setHasSearched] = useState(false) // Track if user has initiated a search
  const [hasGeneratedStatement, setHasGeneratedStatement] = useState(false)

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
            designation: acc.designation,
            accountTypeLabel: acc.accountTypeLabel,
            branch: acc.branch,
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
    const loadTransactionsPreview = async () => {
      if (!selectedAccount || !startDate || !endDate) {
        setFilteredTransactions([])
        setTransactionCount(0)
        setShowDownloadLink(false)
        setHasGeneratedStatement(false)
        setSixMonthsWarning(false)
        return
      }

      if (new Date(startDate) > new Date(endDate)) {
        return
      }

      setIsLoadingTransactions(true)
      setErrorMessage("")
      setSixMonthsWarning(false)
      setShowDownloadLink(false)
      setHasGeneratedStatement(false)

      try {
        const result = await getTransactionsByNumCompte(selectedAccount.number)

        if (!result.success) {
          setErrorMessage(result.error || "Impossible de récupérer les transactions")
          setIsLoadingTransactions(false)
          return
        }

        const allTransactions = result.data

        const start = new Date(startDate)
        const end = new Date(endDate)
        const sixMonthsBeforeEnd = new Date(end)
        sixMonthsBeforeEnd.setMonth(sixMonthsBeforeEnd.getMonth() - 6)

        const exceedsSixMonths = start < sixMonthsBeforeEnd
        const effectiveStartDate = exceedsSixMonths ? sixMonthsBeforeEnd : start

        const filteredTxns = allTransactions.filter((txn: any) => {
          if (!txn.valueDate) return false
          const txnDate = new Date(txn.valueDate)
          return txnDate >= effectiveStartDate && txnDate <= end
        })

        if (filteredTxns.length === 0) {
          setErrorMessage("Aucune transaction trouvée pour cette période.")
          setIsLoadingTransactions(false)
          return
        }

        const accountDetails = await getAccountById(selectedAccount.id)
        if (!accountDetails.data) {
          setErrorMessage("Impossible de récupérer les informations du compte")
          setIsLoadingTransactions(false)
          return
        }

        const closingBalance = Number.parseFloat(accountDetails.data.bookBalance || "0")
        const transactionsSum = filteredTxns.reduce((sum: number, txn: any) => {
          return sum + Number.parseFloat(txn.montantOperation || "0")
        }, 0)
        // Since transactions are sorted by date descending (most recent first),
        // we need to calculate backwards from the current balance
        const openingBalance = closingBalance - transactionsSum

        const sortedTransactions = filteredTxns.sort((a: any, b: any) => {
          const dateA = new Date(a.valueDate || 0).getTime()
          const dateB = new Date(b.valueDate || 0).getTime()
          return dateB - dateA
        })

        // The first row should show the closing balance (current account balance)
        let calculatedBalance = openingBalance

        const cleanedTransactions = sortedTransactions.map((txn: any, index: number) => {
          const amount = Number.parseFloat(String(txn?.montantOperation ?? 0))
          calculatedBalance += amount // Add transaction to get new balance

          const transactionData = {
            referenceOperation: txn.referenceOperation || "",
            montantOperation: txn.montantOperation || 0,
            description: txn.description || "",
            valueDate: txn.valueDate || "",
            dateEcriture: txn.dateEcriture || "",
            txnType: txn.txnType || "",
            balanceOuverture: index === 0 ? openingBalance : undefined,
            balanceFermeture: index === sortedTransactions.length - 1 ? calculatedBalance : undefined,
            currentTransactionBalance: calculatedBalance, // Balance after this transaction
          }

          return transactionData
        })
        // </CHANGE>

        setFilteredTransactions(cleanedTransactions)
        setTransactionCount(cleanedTransactions.length)
        setShowDownloadLink(true)

        if (exceedsSixMonths) {
          setSixMonthsWarning(true)
        }
      } catch (error) {
        console.error("[v0] Erreur lors de la récupération des transactions:", error)
        setErrorMessage("Erreur lors de la récupération des transactions")
      } finally {
        setIsLoadingTransactions(false)
      }
    }

    loadTransactionsPreview()
  }, [selectedAccount, startDate, endDate])

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

  const handleGenerateStatement = () => {
    if (!selectedAccount || !startDate || !endDate || filteredTransactions.length === 0) return

    setErrorMessage("") // Clear previous errors

    const balanceOuverture = filteredTransactions[0]?.balanceOuverture || selectedAccount.balance
    const balanceFermeture =
      filteredTransactions[filteredTransactions.length - 1]?.currentTransactionBalance || selectedAccount.balance
    // </CHANGE>

    // Call the appropriate generation function based on the selected format
    if (format === "pdf") {
      generatePDFStatement(
        filteredTransactions,
        selectedAccount,
        startDate,
        endDate,
        balanceOuverture,
        balanceFermeture,
      )
    } else if (format === "excel") {
      generateExcelStatement(
        filteredTransactions,
        selectedAccount,
        startDate,
        endDate,
        balanceOuverture,
        balanceFermeture,
      )
    }

    setHasGeneratedStatement(true)
  }

  const handleDownloadPDF = () => {
    if (!selectedAccount || filteredTransactions.length === 0) return

    const balanceOuverture = filteredTransactions[0]?.balanceOuverture || selectedAccount.balance
    const balanceFermeture =
      filteredTransactions[filteredTransactions.length - 1]?.currentTransactionBalance || selectedAccount.balance

    generatePDFStatement(filteredTransactions, selectedAccount, startDate, endDate, balanceOuverture, balanceFermeture)
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
        return <DollarSign className="w-4 h-4" />
      default:
        return <CreditCard className="w-4 h-4" />
    }
  }

  // --- UPDATE START ---
  const formatAmount = (amount: number, currency = "GNF") => {
    if (currency === "GNF") {
      return new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 0, // Changed to 0
        maximumFractionDigits: 0, // Changed to 0
      })
        .format(Math.round(amount)) // Added Math.round
        .replace(/\s/g, " ")
    }
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0, // Changed to 0
      maximumFractionDigits: 0, // Changed to 0
    }).format(Math.round(amount)) // Added Math.round
  }
  // --- UPDATE END ---

  const isFormValid = selectedAccount && startDate && endDate && new Date(startDate) <= new Date(endDate)

  // Trouver le compte pré-sélectionné pour afficher un message
  const preSelectedAccount = preSelectedAccountId ? accounts.find((acc) => acc.id === preSelectedAccountId) : null

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-2 mb-6">
          <h1 className="text-3xl font-bold text-primary">Relevé de Compte</h1>
          <p className="text-sm text-muted-foreground">
            Consultez et téléchargez vos relevés de compte pour la période de votre choix
          </p>
        </div>

        {errorMessage && !isLoadingTransactions && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <p className="text-red-800 font-medium">{errorMessage}</p>
            </div>
          </div>
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
                    <Select
                      value={selectedAccount?.id || ""}
                      onValueChange={(id) => setSelectedAccount(accounts.find((acc) => acc.id === id) || null)}
                    >
                      <SelectTrigger className="w-full h-auto py-2">
                        <SelectValue placeholder="Sélectionnez un compte">
                          {selectedAccount && (
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                {getAccountIcon(selectedAccount.type)}
                                <div className="text-left">
                                  <div className="font-medium text-sm">{selectedAccount.name}</div>
                                  <div className="text-xs text-muted-foreground font-mono">
                                    {selectedAccount.number}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <div className="font-bold text-sm">
                                  {formatAmount(selectedAccount.balance, selectedAccount.currency)}{" "}
                                  {selectedAccount.currency}
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
                </div>

                {startDate && endDate && (
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Période sélectionnée : du {new Date(startDate).toLocaleDateString("fr-FR")} au{" "}
                      {new Date(endDate).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                )}

                {/* Format selection */}
                <div className="space-y-2">
                  <Label className="text-sm">Format du fichier</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Card
                      className={`cursor-pointer transition-all ${
                        format === "pdf"
                          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => setFormat("pdf")}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${format === "pdf" ? "bg-red-100" : "bg-gray-100"}`}>
                            <FileText className={`w-5 h-5 ${format === "pdf" ? "text-red-600" : "text-gray-600"}`} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">PDF</p>
                            <p className="text-xs text-muted-foreground">Format standard</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card
                      className={`cursor-pointer transition-all ${
                        format === "excel"
                          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => setFormat("excel")}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${format === "excel" ? "bg-green-100" : "bg-gray-100"}`}>
                            <FileSpreadsheet
                              className={`w-5 h-5 ${format === "excel" ? "text-green-600" : "text-gray-600"}`}
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Excel</p>
                            <p className="text-xs text-muted-foreground">Format tableur</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>

            {sixMonthsWarning && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <p className="text-amber-800 text-sm leading-relaxed">
                    Les transactions de plus de <span className="font-medium">6 mois</span> ne sont pas affichées dans
                    l’aperçu et ne figureront pas sur le relevé. Pour les consulter, veuillez vous rendre dans votre
                    agence.
                  </p>
                </div>
              </div>
            )}

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
                    disabled={
                      !isFormValid || isLoadingTransactions || filteredTransactions.length === 0 || isGenerating
                    }
                    className="flex-1 h-9"
                  >
                    {isLoadingTransactions ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Recherche en cours...
                      </>
                    ) : isGenerating ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Génération en cours...
                      </>
                    ) : hasGeneratedStatement ? (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger {format === "pdf" ? "PDF" : "Excel"}
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger {format === "pdf" ? "PDF" : "Excel"}
                      </>
                    )}
                  </Button>
                </div>

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
        </Tabs>

        {showDownloadLink && filteredTransactions.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <CreditCard className="w-4 h-4 mr-2" />
                Aperçu des transactions ({filteredTransactions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((txn, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">
                        {txn.valueDate ? new Date(txn.valueDate).toLocaleDateString("fr-FR") : "N/A"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{txn.referenceOperation || "N/A"}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{txn.description || "N/A"}</TableCell>
                      <TableCell
                        className={`text-right font-semibold ${
                          txn.montantOperation >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatAmount(txn.montantOperation)} GNF
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
  async function generatePDFStatement(
    transactions: any[],
    account: Account,
    startDate: string,
    endDate: string,
    openingBalance: number,
    closingBalance: number,
  ) {
    try {
      const doc = new jsPDF()
      const pageWidth = 210
      const pageHeight = 297
      // =========================
      // PALETTE (BNG)
      // =========================
      const blackText: [number, number, number] = [15, 23, 42]
      const grayText: [number, number, number] = [100, 116, 139]
      const lightGray: [number, number, number] = [248, 250, 252]
      const borderGray: [number, number, number] = [226, 232, 240]
      const white: [number, number, number] = [255, 255, 255]
      // Vert BNG exact: #0B8338
      const primaryGreen: [number, number, number] = [11, 132, 56]
      const primaryGreenDark: [number, number, number] = [8, 96, 41]
      const greenSoftBg: [number, number, number] = [236, 247, 238]
      // Jaunes
      const brandYellowSoft: [number, number, number] = [244, 230, 120] // doux
      const brandYellowStrong: [number, number, number] = [255, 235, 0] // #FFEB00 (accent fort)
      const yellowTextDark: [number, number, number] = [120, 105, 30]
      // Layout
      const contentLeft = 15
      const contentRight = pageWidth - 15
      const contentWidth = contentRight - contentLeft
      // Helpers
      const safe = (v: any) => (v === null || v === undefined ? "" : String(v))
      const fmtDate = (d: any) => (d ? new Date(d).toLocaleDateString("fr-FR") : "N/A")
      // =========================
      // HEADER PREMIUM
      // =========================
      const drawHeader = (hasLogo: boolean, img?: HTMLImageElement) => {
        const headerH = 34
        // Bandeau vert
        doc.setFillColor(...primaryGreen)
        doc.rect(0, 0, pageWidth, headerH, "F")
        // Ligne jaune ultra fine (accent)
        doc.setDrawColor(...brandYellowSoft)
        doc.setLineWidth(0.8)
        doc.line(0, headerH, pageWidth, headerH)
        // Logo (gauche)
        if (hasLogo && img) {
          // petit fond blanc derrière le logo pour lisibilité
          doc.setFillColor(...white)
          doc.roundedRect(contentLeft, 8, 34, 14, 2.5, 2.5, "F")
          doc.addImage(img, "PNG", contentLeft + 2, 9.5, 30, 11)
        }
        // Titre (blanc)
        doc.setTextColor(255, 255, 255)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(15)
        doc.text("RELEVÉ DE COMPTE", pageWidth / 2, 14, { align: "center" })
        // Sous-titre période (blanc légèrement atténué)
        doc.setTextColor(235, 243, 238)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.text(
          `Période : ${new Date(startDate).toLocaleDateString("fr-FR")} - ${new Date(endDate).toLocaleDateString("fr-FR")}`,
          pageWidth / 2,
          24,
          { align: "center" },
        )
      }
      // =========================
      // TOP SECTION (Résumé + bloc droit)
      // =========================
      const drawTopSection = (yStart: number) => {
        // Totaux
        let totalDebit = 0
        let totalCredit = 0
        transactions.forEach((txn) => {
          const m = Number(txn?.montantOperation ?? 0)
          if (m < 0) totalDebit += Math.abs(m)
          else totalCredit += m
        })
        // même champs que ton tableau
        const leftData = [
          { label: "Devise", value: safe(account.currency) },
          { label: "Solde d'ouverture", value: `${formatAmount(Number(openingBalance))} ${safe(account.currency)}` },
          { label: "Solde de clôture", value: `${formatAmount(Number(closingBalance))} ${safe(account.currency)}` },
          { label: "Total débit", value: `${formatAmount(totalDebit)} ${safe(account.currency)}` },
          { label: "Total crédit", value: `${formatAmount(totalCredit)} ${safe(account.currency)}` },
        ]
        const gapBetween = 10
        const dividerThickness = 3
        const gapAfterDivider = 10
        const leftWidth = 100
        const leftX = contentLeft
        const leftY = yStart
        const dividerX = leftX + leftWidth + gapBetween
        const rightX = dividerX + gapAfterDivider
        const rightWidth = contentRight - rightX
        const labelColWidth = 55
        const valueColWidth = leftWidth - labelColWidth
        const rowHeight = 6.2
        const rows = 5
        const leftHeight = rowHeight * rows
        // Card gauche (blanche + bordure + header mini)
        doc.setFillColor(...white)
        doc.setDrawColor(...borderGray)
        doc.setLineWidth(0.8)
        doc.roundedRect(leftX, leftY, leftWidth, leftHeight + 10, 4, 4, "FD")
        // mini header vert (dans la card)
        doc.setFillColor(...greenSoftBg)
        doc.roundedRect(leftX, leftY, leftWidth, 10, 4, 4, "F")
        doc.setTextColor(...primaryGreenDark)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(8.5)
        doc.text("RÉSUMÉ DU COMPTE", leftX + 3, leftY + 7)
        // grille data
        const gridY = leftY + 10
        // colonne labels (fond très léger)
        doc.setFillColor(...greenSoftBg)
        doc.rect(leftX, gridY, labelColWidth, leftHeight, "F")
        // colonne values blanche (déjà blanche mais on sécurise)
        doc.setFillColor(...white)
        doc.rect(leftX + labelColWidth, gridY, valueColWidth, leftHeight, "F")
        // séparateur vertical
        doc.setDrawColor(...borderGray)
        doc.setLineWidth(0.6)
        doc.line(leftX + labelColWidth, gridY, leftX + labelColWidth, gridY + leftHeight)
        leftData.forEach((row, i) => {
          const rowY = gridY + i * rowHeight
          if (i > 0) {
            doc.setDrawColor(...borderGray)
            doc.setLineWidth(0.3)
            doc.line(leftX, rowY, leftX + leftWidth, rowY)
          }
          doc.setTextColor(...primaryGreenDark)
          doc.setFont("helvetica", "bold")
          doc.setFontSize(7.4)
          doc.text(row.label, leftX + 3, rowY + 4.4)
          doc.setTextColor(...blackText)
          doc.setFont("helvetica", "normal")
          doc.setFontSize(7.4)
          const valLines = doc.splitTextToSize(safe(row.value), valueColWidth - 6)
          doc.text(valLines[0] || "", leftX + labelColWidth + 3, rowY + 4.4)
        })
        // Séparateur central (vert) + micro accent jaune au dessus
        doc.setDrawColor(...primaryGreen)
        doc.setLineWidth(dividerThickness)
        doc.line(dividerX, leftY + 2, dividerX, leftY + leftHeight + 8)
        doc.setDrawColor(...brandYellowSoft)
        doc.setLineWidth(1.2)
        doc.line(dividerX - 1.2, leftY + 2, dividerX + 1.2, leftY + 2)
        // Bloc droit (texte propre, sans "table", style premium)
        doc.setTextColor(...blackText)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(11)
        doc.text("BANQUE NATIONALE DE GUINÉE", rightX, leftY + 10)
        doc.setTextColor(...grayText)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(7.8)
        doc.text(
          doc.splitTextToSize("6ème Avenue Boulevard DIALLO Télly BP: 1781 Conakry", rightWidth),
          rightX,
          leftY + 15,
        )
        // Ligne signature (jaune fort) comme ta maquette
        doc.setDrawColor(...brandYellowStrong)
        doc.setLineWidth(0.8)
        doc.line(rightX, leftY + 20, rightX + rightWidth, leftY + 20)
        // Libellé compte (gros)
        doc.setTextColor(...blackText)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(16)
        const accountLabel = safe(account.designation || account.name || "-")
        doc.text(doc.splitTextToSize(accountLabel, rightWidth), rightX, leftY + 38)
        // N° de compte (plus discret)
        doc.setTextColor(...grayText)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.text(`N° de compte : ${safe(account.number)}`, rightX, leftY + 45)
        return leftY + leftHeight + 16
      }
      // =========================
      // TRANSACTIONS TABLE (plus moderne)
      // =========================
      const drawTransactionTable = (yStart: number) => {
        let yPos = yStart
        // Titre section
        doc.setTextColor(...blackText)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(11)
        doc.text(`TRANSACTIONS (${transactions.length})`, contentLeft, yPos)
        // underline vert + accent jaune court
        doc.setDrawColor(...primaryGreen)
        doc.setLineWidth(1.0)
        doc.line(contentLeft, yPos + 2.5, contentLeft + 60, yPos + 2.5)
        doc.setDrawColor(...brandYellowSoft)
        doc.setLineWidth(1.0)
        doc.line(contentLeft, yPos + 4.2, contentLeft + 28, yPos + 4.2)
        yPos += 10
        const tableStartX = contentLeft
        const col1Width = 22 // Date Valeur
        const col2Width = 38 // Description
        const col3Width = 28 // Référence
        const col4Width = 22 // Date Op.
        const col5Width = 22 // Débit
        const col6Width = 22 // Crédit
        const col7Width = 30 // Solde (new)
        const cols = [col1Width, col2Width, col3Width, col4Width, col5Width, col6Width, col7Width]
        const tableRowHeight = 9
        const tableWidth = cols.reduce((a, b) => a + b, 0)
        const drawHeaderRow = () => {
          // Header vert foncé + texte blanc
          doc.setFillColor(...primaryGreen)
          doc.setDrawColor(...primaryGreen)
          doc.setLineWidth(0.4)
          doc.rect(tableStartX, yPos, tableWidth, tableRowHeight, "FD")
          // fine ligne jaune en bas du header
          doc.setDrawColor(...brandYellowSoft)
          doc.setLineWidth(1.0)
          doc.line(tableStartX, yPos + tableRowHeight, tableStartX + tableWidth, yPos + tableRowHeight)
          doc.setTextColor(255, 255, 255)
          doc.setFont("helvetica", "bold")
          doc.setFontSize(8.6)
          let x = tableStartX
          doc.text("Date Valeur", x + 2, yPos + 6)
          x += col1Width
          doc.text("Description", x + 2, yPos + 6)
          x += col2Width
          doc.text("Référence", x + 2, yPos + 6)
          x += col3Width
          doc.text("Date Op.", x + 2, yPos + 6)
          x += col4Width
          doc.text("Débit", x + 2, yPos + 6)
          x += col5Width
          doc.text("Crédit", x + 2, yPos + 6)
          x += col6Width
          doc.text("Solde", x + 2, yPos + 6)
          yPos += tableRowHeight
        }
        drawHeaderRow()
        doc.setFont("helvetica", "normal")
        doc.setFontSize(8)
        doc.setTextColor(...blackText)
        let currentBalance = Number(openingBalance)
        transactions.forEach((txn: any, idx: number) => {
          if (yPos > 260) {
            doc.addPage()
            // Header de page
            drawSmallPageHeader()
            yPos = 40
            drawHeaderRow()
            doc.setFont("helvetica", "normal")
            doc.setFontSize(8)
            doc.setTextColor(...blackText)
          }
          // Alternance
          if (idx % 2 === 1) {
            doc.setFillColor(...lightGray)
            doc.rect(tableStartX, yPos, tableWidth, tableRowHeight, "F")
          }
          // Bordure externe légère
          doc.setDrawColor(...borderGray)
          doc.setLineWidth(0.25)
          doc.rect(tableStartX, yPos, tableWidth, tableRowHeight, "S")
          // séparateurs verticaux
          let cx = tableStartX
          for (let i = 0; i < cols.length - 1; i++) {
            cx += cols[i]
            doc.line(cx, yPos, cx, yPos + tableRowHeight)
          }
          const dateValeur = fmtDate(txn?.valueDate)
          const description = safe(txn?.description || "N/A").substring(0, 26)
          const reference = safe(txn?.referenceOperation || "N/A").substring(0, 16)
          const dateOperation = fmtDate(txn?.dateEcriture)
          const m = Number(txn?.montantOperation ?? 0)
          const montant = formatAmount(Math.abs(m))
          currentBalance += m
          const balanceDisplay = formatAmount(Math.trunc(currentBalance))
          // cellules
          doc.setTextColor(...blackText)
          doc.text(dateValeur, tableStartX + 2, yPos + 6)
          doc.text(description, tableStartX + col1Width + 2, yPos + 6)
          doc.text(reference, tableStartX + col1Width + col2Width + 2, yPos + 6)
          doc.text(dateOperation, tableStartX + col1Width + col2Width + col3Width + 2, yPos + 6)
          if (m < 0) {
            doc.setTextColor(...blackText)
            doc.text(montant, tableStartX + col1Width + col2Width + col3Width + col4Width + 2, yPos + 6)
          } else {
            doc.setTextColor(...primaryGreen)
            doc.setFont("helvetica", "bold")
            doc.text(montant, tableStartX + col1Width + col2Width + col3Width + col4Width + col5Width + 2, yPos + 6)
            doc.setFont("helvetica", "normal")
          }
          doc.setTextColor(...blackText)
          doc.setFont("helvetica", "bold")
          doc.text(
            balanceDisplay,
            tableStartX + col1Width + col2Width + col3Width + col4Width + col5Width + col6Width + 2,
            yPos + 6,
          )
          doc.setFont("helvetica", "normal")
          doc.setTextColor(...blackText)
          yPos += tableRowHeight
        })
        return yPos
      }
      // =========================
      // SMALL PAGE HEADER (for pages > 1)
      // =========================
      const drawSmallPageHeader = () => {
        doc.setFillColor(...primaryGreen)
        doc.rect(0, 0, pageWidth, 18, "F")
        doc.setTextColor(255, 255, 255)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(10)
        doc.text("RELEVÉ DE COMPTE", contentLeft, 11)
        doc.setTextColor(235, 243, 238)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(8)
        doc.text(
          `${new Date(startDate).toLocaleDateString("fr-FR")} - ${new Date(endDate).toLocaleDateString("fr-FR")}`,
          contentRight,
          11,
          { align: "right" },
        )
        doc.setDrawColor(...brandYellowSoft)
        doc.setLineWidth(0.8)
        doc.line(0, 18, pageWidth, 18)
      }
      // =========================
      // FOOTER
      // =========================
      const addFooter = (pageNum: number, totalPages: number) => {
        const footerY = pageHeight - 18
        doc.setDrawColor(...borderGray)
        doc.setLineWidth(0.4)
        doc.line(contentLeft, footerY, contentRight, footerY)
        doc.setTextColor(...grayText)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(7)
        const footerLines = [
          "Banque Nationale de Guinée SA - Agrément par décision N° 06/019/93/CAB/PE 06/06/1993",
          "Capital : 60.000.000.000 GNF",
          "Boulevard Tidiani Kaba - Quartier Boulbinet/Almamya, Kaloum, Conakry, Guinée",
          "Tél: +224 - 622 454 049 - B.P 1781 - mail: contact@bng.gn",
        ]
        let y = footerY + 4
        footerLines.forEach((line) => {
          doc.text(line, contentLeft, y)
          y += 3
        })
        // pagination (vert + micro accent jaune)
        doc.setTextColor(...primaryGreenDark)
        doc.setFont("helvetica", "bold")
        doc.text(`Page ${pageNum} / ${totalPages}`, contentRight, footerY + 4, { align: "right" })
        doc.setDrawColor(...brandYellowSoft)
        doc.setLineWidth(1.2)
        doc.line(contentRight - 20, footerY + 6, contentRight, footerY + 6)
      }
      // =========================
      // RENDER FLOW
      // =========================
      const render = () => {
        // Page 1 header premium
        // (si page > 1 : drawSmallPageHeader sera utilisé)
        let y = 40
        y = drawTopSection(y)
        y = drawTransactionTable(y + 6)
        // footers
        const pageCount = doc.internal.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i)
          if (i > 1) drawSmallPageHeader()
          addFooter(i, pageCount)
        }
        const fileName = `Releve_Compte_${safe(account.number).replace(/-/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`
        doc.save(fileName)
        console.log("[v0] PDF généré et téléchargé:", fileName)
      }
      // Logo
      const img = new Image()
      img.src = "/images/logo-bng.png"
      img.crossOrigin = "anonymous"
      img.onload = () => {
        drawHeader(true, img)
        render()
      }
      img.onerror = () => {
        console.warn("[v0] Logo BNG non trouvé, génération sans logo")
        drawHeader(false)
        render()
      }
    } catch (error) {
      console.error("[v0] Erreur génération PDF:", error)
      alert(" Erreur lors de la génération du PDF")
    }
  }

  async function generateExcelStatement(
    transactions: any[],
    account: Account,
    startDate: string,
    endDate: string,
    openingBalance: number,
    closingBalance: number, // This parameter is now derived from the last transaction balance
  ) {
    try {
      // Calculate totals
      let totalDebit = 0
      let totalCredit = 0
      let currentBalance = Number.parseFloat(String(openingBalance)) || 0

      transactions.forEach((txn) => {
        const amount = Number.parseFloat(String(txn?.montantOperation ?? 0))
        if (amount < 0) {
          totalDebit += Math.abs(amount)
        } else {
          totalCredit += amount
        }
      })

      // Create Excel workbook
      const workbook = XLSX.utils.book_new()

      // Header information
      const headerData = [
        ["RELEVÉ DE COMPTE"],
        [],
        ["Devise", account.currency],
        ["Solde d'ouverture", `${formatAmount(Number(openingBalance))} ${account.currency}`],
        ["Solde de clôture", `${formatAmount(closingBalance)} ${account.currency}`], // Use the closing balance passed to the function
        ["Total débit", `${formatAmount(totalDebit)} ${account.currency}`],
        ["Total crédit", `${formatAmount(totalCredit)} ${account.currency}`],
        [
          "Période",
          `${new Date(startDate).toLocaleDateString("fr-FR")} - ${new Date(endDate).toLocaleDateString("fr-FR")}`,
        ],
        [],
        [],
      ]

      // Transaction headers
      const transactionHeaders = [
        "Date Valeur",
        "Description",
        "Référence",
        "Date Opération",
        "Débit",
        "Crédit",
        "Solde", // Added Solde column
      ]

      // Reset balance for calculation
      currentBalance = Number.parseFloat(String(openingBalance)) || 0

      // Transaction rows
      const transactionRows = transactions.map((txn) => {
        const amount = Number.parseFloat(String(txn?.montantOperation ?? 0))
        const debit = amount < 0 ? formatAmount(Math.round(Math.abs(amount))) : ""
        const credit = amount >= 0 ? formatAmount(Math.round(amount)) : ""

        // --- UPDATE START ---
        currentBalance += amount
        const solde = formatAmount(Math.round(currentBalance))
        // --- UPDATE END ---

        return [
          txn?.valueDate ? new Date(txn.valueDate).toLocaleDateString("fr-FR") : "",
          txn?.description || "",
          txn?.referenceOperation || "",
          txn?.dateEcriture ? new Date(txn.dateEcriture).toLocaleDateString("fr-FR") : "",
          debit,
          credit,
          solde, // Add Solde value
        ]
      })

      // Combine all data
      const worksheetData = [...headerData, transactionHeaders, ...transactionRows]

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

      // Set column widths
      // --- UPDATE START ---
      worksheet["!cols"] = [
        { wch: 15 }, // Date Valeur
        { wch: 40 }, // Description
        { wch: 25 }, // Référence (increased from 20 to match PDF)
        { wch: 15 }, // Date Opération
        { wch: 15 }, // Débit
        { wch: 15 }, // Crédit
        { wch: 15 }, // Solde
      ]
      // </CHANGE>
      // --- UPDATE END ---

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Relevé de compte")

      // Generate file name
      const fileName = `Releve_Compte_${account.number.replace(/-/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`

      // Download file
      XLSX.writeFile(workbook, fileName)
      console.log("[v0] Excel généré et téléchargé:", fileName)
    } catch (error) {
      console.error("[v0] Erreur génération Excel:", error)
      alert("❌ Erreur lors de la génération du relevé Excel")
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
