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
  Filter,
  Search,
  X,
} from "lucide-react"
import { generateStatement, sendStatementByEmail, getTransactionsByNumCompte } from "./actions"
import { useActionState } from "react"
import { getAccounts, getAccountById } from "../actions"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { normalizeAccountStatus } from "@/lib/status-utils"
import jsPDF from "jspdf"
import { generateStandardizedPDF, formatAmount, savePDF, type PDFContentOptions } from "@/lib/pdf-generator"
import * as XLSX from "xlsx" // Added import for Excel generation
import ExcelJS from "exceljs" // For better Excel formatting and images

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
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([]) // Kept for potential future use, but not used in the new generation logic
  const [generateState, generateAction, isGenerating] = useActionState(generateStatement, null)
  const [emailState, emailAction, isSending] = useActionState(sendStatementByEmail, null)
  const [isPending, startTransition] = useTransition()
  const [hasSearched, setHasSearched] = useState(false) // Track if user has initiated a search
  const [hasGeneratedStatement, setHasGeneratedStatement] = useState(false)
  
  // États pour les filtres de transactions
  const [allTransactions, setAllTransactions] = useState<any[]>([]) // Toutes les transactions (non filtrées)
  const [filterType, setFilterType] = useState<"all" | "debit" | "credit">("all")
  const [amount, setAmount] = useState<string>("")
  const [filterDate, setFilterDate] = useState<string>("")
  const [searchText, setSearchText] = useState<string>("")

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

          // Filtrer uniquement les comptes actifs en utilisant la normalisation
          const activeAccounts = adaptedAccounts.filter((account) => {
            const normalizedStatus = normalizeAccountStatus(account.status)
            return normalizedStatus === "Actif"
          })
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
        return
      }

      if (new Date(startDate) > new Date(endDate)) {
        return
      }

      setIsLoadingTransactions(true)
      setErrorMessage("")
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

        // Créer les dates de début et fin en s'assurant d'inclure toute la journée
        const start = new Date(startDate + "T00:00:00")
        const end = new Date(endDate + "T23:59:59")
        const effectiveStartDate = start

        console.log("[STATEMENTS] 🔍 Analyse des transactions...")
        console.log("[STATEMENTS] Compte sélectionné:", selectedAccount.number)
        console.log("[STATEMENTS] Total transactions du compte:", allTransactions.length)
        console.log("[STATEMENTS] Période recherchée:", { 
          startDate, 
          endDate,
          startDateParsed: start.toISOString(),
          endDateParsed: end.toISOString()
        })
        
        // Log des transactions avant filtrage
        if (allTransactions.length > 0) {
          console.log("[STATEMENTS] Exemple de transaction:", allTransactions[0])
          allTransactions.forEach((txn: any, idx: number) => {
            console.log(`[STATEMENTS] Transaction ${idx + 1}:`, {
              date: txn.valueDate,
              description: txn.description,
              amount: txn.montantOperation,
              txnType: txn.txnType
            })
          })
        }

        const filteredTxns = allTransactions.filter((txn: any) => {
          if (!txn.valueDate) {
            console.log("[STATEMENTS] ⚠️ Transaction sans valueDate ignorée:", txn)
            return false
          }
          const txnDate = new Date(txn.valueDate)
          const isInRange = txnDate >= effectiveStartDate && txnDate <= end
          
          if (!isInRange) {
            console.log("[STATEMENTS] ❌ Transaction hors période:", {
              txnDate: txnDate.toISOString(),
              start: effectiveStartDate.toISOString(),
              end: end.toISOString(),
              description: txn.description
            })
          }
          
          return isInRange
        })

        console.log("[STATEMENTS] Transactions dans la période:", filteredTxns.length)

        if (filteredTxns.length === 0) {
          if (allTransactions.length === 0) {
            setErrorMessage(`Aucune transaction trouvée pour le compte ${selectedAccount.number}. Ce compte n'a pas encore d'historique de transactions.`)
          } else {
            setErrorMessage(`Aucune transaction trouvée pour la période du ${new Date(startDate).toLocaleDateString('fr-FR')} au ${new Date(endDate).toLocaleDateString('fr-FR')}. Ce compte a ${allTransactions.length} transaction(s) au total. Essayez d'élargir la période de recherche.`)
          }
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
          let amount = Number.parseFloat(String(txn?.montantOperation ?? 0))
          
          // Détecter les mises à disposition des fonds
          const description = String(txn.description || "").toLowerCase()
          const isFundsProvision = 
            description.includes("mise à disposition") ||
            description.includes("mise a disposition") ||
            description.includes("disposition des fonds") ||
            txn.referenceOperation?.startsWith("RET-") ||
            txn.referenceOperation?.startsWith("MDF-") ||
            txn.fullNameBenef ||
            txn.numCni ||
            txn.agence
          
          // Pour les mises à disposition des fonds, forcer le type à DEBIT et le montant à négatif
          let txnType = txn.txnType || ""
          if (isFundsProvision) {
            txnType = "DEBIT"
            // Si le montant est positif, le rendre négatif pour un débit
            if (amount > 0) {
              amount = -amount
            }
          } else {
            // Pour les autres transactions, déterminer le type basé sur le signe du montant si txnType n'est pas défini
            if (!txnType) {
              txnType = amount < 0 ? "DEBIT" : "CREDIT"
            }
          }
          
          calculatedBalance += amount // Add transaction to get new balance

          const transactionData = {
            referenceOperation: txn.referenceOperation || "",
            montantOperation: amount, // Utiliser le montant corrigé
            description: txn.description || "",
            valueDate: txn.valueDate || "",
            dateEcriture: txn.dateEcriture || "",
            txnType: txnType,
            balanceOuverture: index === 0 ? openingBalance : undefined,
            balanceFermeture: index === sortedTransactions.length - 1 ? calculatedBalance : undefined,
            currentTransactionBalance: calculatedBalance, // Balance after this transaction
          }

          return transactionData
        })
        // </CHANGE>

        setAllTransactions(cleanedTransactions)
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
    const balanceFermeture = filteredTransactions[0]?.currentTransactionBalance || selectedAccount.balance
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

  // Appliquer les filtres quand ils changent
  useEffect(() => {
    if (allTransactions.length === 0) {
      return
    }

    let filtered = [...allTransactions]

    // Filtre par type (débit/crédit) - utiliser uniquement txnType
    if (filterType === "debit") {
      filtered = filtered.filter((txn) => {
        const txnType = String(txn.txnType || "").toUpperCase()
        // Un débit est uniquement si txnType === "DEBIT"
        return txnType === "DEBIT"
      })
    } else if (filterType === "credit") {
      filtered = filtered.filter((txn) => {
        const txnType = String(txn.txnType || "").toUpperCase()
        // Un crédit est uniquement si txnType === "CREDIT"
        return txnType === "CREDIT"
      })
    }

    // Filtre par montant
    if (amount) {
      const amountValue = Number.parseFloat(amount)
      if (!Number.isNaN(amountValue)) {
        filtered = filtered.filter((txn) => {
          const txnAmount = Math.abs(Number.parseFloat(String(txn.montantOperation ?? 0)))
          return txnAmount >= amountValue
        })
      }
    }

    // Filtre par date
    if (filterDate) {
      const filterDateObj = new Date(filterDate)
      filtered = filtered.filter((txn) => {
        if (!txn.valueDate) return false
        const txnDate = new Date(txn.valueDate)
        return (
          txnDate.getFullYear() === filterDateObj.getFullYear() &&
          txnDate.getMonth() === filterDateObj.getMonth() &&
          txnDate.getDate() === filterDateObj.getDate()
        )
      })
    }

    // Filtre par recherche texte (description ou référence)
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim()
      filtered = filtered.filter(
        (txn) =>
          (txn.description || "").toLowerCase().includes(searchLower) ||
          (txn.referenceOperation || "").toLowerCase().includes(searchLower),
      )
    }

    setFilteredTransactions(filtered)
    setTransactionCount(filtered.length)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, amount, filterDate, searchText, allTransactions])

  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilterType("all")
    setAmount("")
    setFilterDate("")
    setSearchText("")
  }

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
                          <SelectItem key={account.id} value={account.id}>
                            {account.name} - {account.number} ({formatAmount(account.balance, account.currency)} {account.currency})
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

                {selectedAccount && !startDate && !endDate && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800 mb-2 font-medium">
                      💡 Suggestions de périodes courantes :
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const today = new Date()
                          const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
                          const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
                          setStartDate(lastMonth.toISOString().split("T")[0])
                          setEndDate(lastMonthEnd.toISOString().split("T")[0])
                        }}
                      >
                        Mois dernier
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const today = new Date()
                          const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1)
                          setStartDate(threeMonthsAgo.toISOString().split("T")[0])
                          setEndDate(today.toISOString().split("T")[0])
                        }}
                      >
                        3 derniers mois
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const today = new Date()
                          const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1)
                          setStartDate(sixMonthsAgo.toISOString().split("T")[0])
                          setEndDate(today.toISOString().split("T")[0])
                        }}
                      >
                        6 derniers mois
                      </Button>
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

        {showDownloadLink && allTransactions.length > 0 && (
          <>
            {/* Section de filtres */}
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filtres de transactions
                  </div>
                  {(filterType !== "all" || amount || filterDate || searchText) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                      className="h-8 text-xs"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Réinitialiser
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Recherche texte */}
                  <div className="space-y-2">
                    <Label htmlFor="searchText" className="text-sm">
                      Recherche
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="searchText"
                        type="text"
                        placeholder="Description ou référence..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>

                  {/* Type de transaction */}
                  <div className="space-y-2">
                    <Label htmlFor="filterType" className="text-sm">
                      Type de transaction
                    </Label>
                    <Select value={filterType} onValueChange={(value: "all" | "debit" | "credit") => setFilterType(value)}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="credit">Crédits uniquement</SelectItem>
                        <SelectItem value="debit">Débits uniquement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Montant */}
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-sm">
                      Montant (minimum)
                    </Label>
                    <Input
                      id="amount"
                      type="text"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => {
                        const value = e.target.value
                        // Ne permet que les chiffres
                        if (value === "" || /^\d+$/.test(value)) {
                          setAmount(value)
                        }
                      }}
                      className="h-9"
                      inputMode="numeric"
                    />
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <Label htmlFor="filterDate" className="text-sm">
                      Date
                    </Label>
                    <Input
                      id="filterDate"
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>

                {/* Indicateur de résultats filtrés */}
                {(filterType !== "all" || amount || filterDate || searchText) && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      {filteredTransactions.length} transaction{filteredTransactions.length > 1 ? "s" : ""} trouvée{filteredTransactions.length > 1 ? "s" : ""} sur {allTransactions.length}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tableau des transactions */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <CreditCard className="w-4 h-4 mr-2" />
                Aperçu des transactions ({filteredTransactions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Aucune transaction ne correspond aux filtres sélectionnés</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetFilters}
                      className="mt-4"
                    >
                      Réinitialiser les filtres
                    </Button>
                  </div>
                ) : (
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
                  {filteredTransactions.map((txn, index) => {
                    // ✅ Utiliser directement txnType pour déterminer DEBIT ou CREDIT
                    const txnType = String(txn.txnType || "").toUpperCase()
                    const baseAmount = Number.parseFloat(String(txn.montantOperation || 0))
                    
                    // Déterminer si c'est un débit ou un crédit basé uniquement sur txnType
                    const isDebit = txnType === "DEBIT"
                    const isCredit = txnType === "CREDIT"
                    
                    // Montant avec signe : négatif pour DEBIT, positif pour CREDIT
                    const signedAmount = isDebit ? -Math.abs(baseAmount) : Math.abs(baseAmount)
                    
                    // Préfixer avec "+" pour les crédits
                    const amountPrefix = isCredit ? "+" : ""
                    
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">
                          {txn.valueDate ? new Date(txn.valueDate).toLocaleDateString("fr-FR") : "N/A"}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{txn.referenceOperation || "N/A"}</TableCell>
                        <TableCell className="max-w-[300px] whitespace-normal break-words">{txn.description || "N/A"}</TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            isDebit ? "text-red-600" : isCredit ? "text-green-600" : "text-gray-600"
                          }`}
                        >
                          {amountPrefix}{formatAmount(signedAmount)} GNF
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
                )}
            </CardContent>
          </Card>
          </>
        )}
      </div>
    </div>
  )
  //Debut Version1
  async function generatePDFStatement(
    transactions: any[],
    account: Account,
    startDate: string,
    endDate: string,
    openingBalance: number,
    closingBalance: number,
  ) {
    try {
      const pageWidth: number = 210
      const contentLeft: number = 15
      const contentRight: number = pageWidth - 15
      const contentWidth: number = contentRight - contentLeft
      
      // Couleurs locales pour le contenu
      const blackText: [number, number, number] = [15, 23, 42]
      const grayText: [number, number, number] = [100, 116, 139]
      const lightGray: [number, number, number] = [248, 250, 252]
      const borderGray: [number, number, number] = [226, 232, 240]
      const white: [number, number, number] = [255, 255, 255]
      const primaryGreen: [number, number, number] = [11, 132, 56]
      
      // Helpers
      const safe = (v: any) => (v === null || v === undefined ? "" : String(v))
      const fmtDate = (d: any) => (d ? new Date(d).toLocaleDateString("fr-FR") : "N/A")
      const money = (n: any) => formatAmount(Number(n ?? 0))
      
      const drawTopCards = (doc: jsPDF, yStart: number) => {
        // Helper pour limiter le texte à une ligne (défini ici où doc est disponible)
        const clamp1Line = (text: string, maxW: number) => {
          const lines = doc.splitTextToSize(text, maxW)
          return lines?.[0] ? String(lines[0]) : ""
        }
        // Totaux
        let totalDebit = 0
        let totalCredit = 0
        transactions.forEach((txn) => {
          const m = Number(txn?.montantOperation ?? 0)
          const txnType = String(txn?.txnType || "").toUpperCase()
          if (txnType === "DEBIT") {
            totalDebit += Math.abs(m)
          } else {
            totalCredit += Math.abs(m)
          }
        })
        // mêmes champs
        const leftData = [
          { label: "Devise", value: safe(account.currency) },
          {
            label: "Solde d'ouverture",
            value: `${money(openingBalance)} ${safe(account.currency)}`,
          },
          { label: "Solde de clôture", value: `${money(closingBalance)} ${safe(account.currency)}` },
          { label: "Total débit", value: `${money(totalDebit)} ${safe(account.currency)}` },
          { label: "Total crédit", value: `${money(totalCredit)} ${safe(account.currency)}` },
        ]
        const gap: number = 8
        const cardH: number = 46
        const cardW: number = (contentWidth - gap) / 2
        const leftX: number = contentLeft
        const rightX: number = contentLeft + cardW + gap
        const y: number = yStart
        // Card 1 (Résumé)
        doc.setFillColor(...white)
        doc.setDrawColor(...borderGray)
        doc.setLineWidth(0.7)
        // Utiliser rect avec coins arrondis manuels ou roundedRect sans opération
        doc.roundedRect(leftX, y, cardW, cardH, 5, 5)
        // grid text
        const innerX = leftX + 6
        let ty = y + 16
        doc.setFont("helvetica", "normal")
        doc.setFontSize(7.8)
        leftData.forEach((row, i) => {
          const labelW = 34
          const valueW = cardW - 12 - labelW
          doc.setTextColor(...grayText)
          doc.text(clamp1Line(row.label, labelW), innerX, ty)
          doc.setTextColor(...blackText)
          doc.text(clamp1Line(row.value, valueW), innerX + labelW, ty)
          ty += 5.1
        })
        // Card 2 (Banque + libellé)
        doc.setFillColor(...white)
        doc.setDrawColor(...borderGray)
        doc.setLineWidth(0.7)
        // Utiliser rect avec coins arrondis manuels ou roundedRect sans opération
        doc.roundedRect(rightX, y, cardW, cardH, 5, 5)
        doc.setTextColor(...blackText)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(10)
        doc.text("BANQUE NATIONALE DE GUINÉE", rightX + 6, y + 15)
        doc.setTextColor(...grayText)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(7.6)
        doc.text(
          doc.splitTextToSize("6ème Avenue Boulevard DIALLO Télly BP: 1781 Conakry", cardW - 12),
          rightX + 6,
          y + 20,
        )
        // ligne verte fine
        doc.setDrawColor(...primaryGreen)
        doc.setLineWidth(0.8)
        doc.line(rightX + 6, y + 25, rightX + cardW - 6, y + 25)

        doc.setTextColor(...blackText)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(12)
        const label = safe(account.designation || account.name || "-")
        doc.text(doc.splitTextToSize(label, cardW - 12), rightX + 6, y + 32)

        doc.setTextColor(...grayText)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.text(
          safe(account.number),
          rightX + 6,
          y + 38
        )

        return y + cardH + 14
      }
      const drawTransactions = (doc: jsPDF, yStart: number) => {
        let y = yStart
        // titre
        doc.setTextColor(...blackText)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(11)
        doc.text(`TRANSACTIONS (${transactions.length})`, contentLeft, y)
        // underline
        doc.setDrawColor(...primaryGreen)
        doc.setLineWidth(1.0)
        doc.line(contentLeft, y + 2.5, contentLeft + 70, y + 2.5)
        y += 10
        const tableX = contentLeft
        const col1 = 22 // Date Valeur
        const col2 = 38 // Description
        const col3 = 28 // Référence
        const col4 = 22 // Date Op.
        const col5 = 22 // Débit
        const col6 = 22 // Crédit
        const col7 = 33 // Solde
        const cols = [col1, col2, col3, col4, col5, col6, col7]
        const w = cols.reduce((a, b) => a + b, 0)
        const h = 9
        const headerRow = () => {
          doc.setFillColor(...white)
          doc.setDrawColor(...borderGray)
          doc.setLineWidth(0.4)
          doc.rect(tableX, y, w, h, "FD")
          // ligne verte en haut du header (style banque)
          doc.setDrawColor(...primaryGreen)
          doc.setLineWidth(1.2)
          doc.line(tableX, y, tableX + w, y)
          // séparateurs
          doc.setDrawColor(...borderGray)
          doc.setLineWidth(0.35)
          let cx = tableX
          for (let i = 0; i < cols.length - 1; i++) {
            cx += cols[i]
            doc.line(cx, y, cx, y + h)
          }
          doc.setTextColor(...blackText)
          doc.setFont("helvetica", "bold")
          doc.setFontSize(8.6)
          doc.text("Date Valeur", tableX + 2, y + 6)
          doc.text("Description", tableX + col1 + 2, y + 6)
          doc.text("Référence", tableX + col1 + col2 + 2, y + 6)
          doc.text("Date Op.", tableX + col1 + col2 + col3 + 2, y + 6)
          doc.text("Débit", tableX + col1 + col2 + col3 + col4 + 2, y + 6)
          doc.text("Crédit", tableX + col1 + col2 + col3 + col4 + col5 + 2, y + 6)
          doc.text("Solde", tableX + col1 + col2 + col3 + col4 + col5 + col6 + 2, y + 6)
          y += h
        }
        const ensurePage = () => {
          if (y > 260) {
            doc.addPage()
            y = 30 // Après le header compact
            headerRow()
            doc.setFont("helvetica", "normal")
            doc.setFontSize(8)
            doc.setTextColor(...blackText)
          }
        }
        headerRow()
        doc.setFont("helvetica", "normal")
        doc.setFontSize(8)
        doc.setTextColor(...blackText)

        let currentBalance = Number.parseFloat(String(openingBalance)) || 0

        transactions.forEach((txn: any, idx: number) => {
          ensurePage()
          // alternance
          if (idx % 2 === 1) {
            doc.setFillColor(...lightGray)
            doc.rect(tableX, y, w, h, "F")
          }
          doc.setDrawColor(...borderGray)
          doc.setLineWidth(0.25)
          doc.rect(tableX, y, w, h, "S")
          // séparateurs
          let cx = tableX
          for (let i = 0; i < cols.length - 1; i++) {
            cx += cols[i]
            doc.line(cx, y, cx, y + h)
          }
          const dateValeur = fmtDate(txn?.valueDate)
          const description = safe(txn?.description || "N/A")
          const reference = safe(txn?.referenceOperation || "N/A").substring(0, 18)
          const dateOp = fmtDate(txn?.dateEcriture)
          const m = Number(txn?.montantOperation ?? 0)
          const txnType = String(txn?.txnType || "").toUpperCase()
          const montant = money(Math.abs(m))

          // Add transaction amount to current balance
          // Pour DEBIT, le montant est négatif, pour CREDIT il est positif
          const amountToAdd = txnType === "DEBIT" ? -Math.abs(m) : Math.abs(m)
          currentBalance += amountToAdd
          const soldeText = money(Math.trunc(currentBalance))

          // Diviser la description en plusieurs lignes si nécessaire
          // Largeur disponible pour la description : col2 (38mm) moins les marges
          const descriptionWidth = col2 - 4 // Réserver 4mm pour les marges
          const descriptionLines = doc.splitTextToSize(description, descriptionWidth)
          const lineHeight = 4 // Hauteur de chaque ligne de texte
          const descriptionHeight = Math.max(h, descriptionLines.length * lineHeight + 2) // Au moins la hauteur de base, plus l'espace pour les lignes

          // Ajuster la hauteur de la ligne si la description nécessite plus d'espace
          const actualRowHeight = Math.max(h, descriptionHeight)

          // Redessiner le rectangle avec la nouvelle hauteur si nécessaire
          if (actualRowHeight > h) {
            // Effacer l'ancien rectangle
            doc.setFillColor(...white)
            doc.rect(tableX, y, w, h, "F")
            if (idx % 2 === 1) {
              doc.setFillColor(...lightGray)
              doc.rect(tableX, y, w, actualRowHeight, "F")
            }
            doc.setDrawColor(...borderGray)
            doc.setLineWidth(0.25)
            doc.rect(tableX, y, w, actualRowHeight, "S")
            // Redessiner les séparateurs verticaux
            let cx = tableX
            for (let i = 0; i < cols.length - 1; i++) {
              cx += cols[i]
              doc.line(cx, y, cx, y + actualRowHeight)
            }
          }

          doc.setTextColor(...blackText)
          // Afficher les autres colonnes centrées verticalement
          const verticalCenter = y + actualRowHeight / 2
          doc.text(dateValeur, tableX + col1 / 2, verticalCenter, { align: "center" })
          
          // Afficher la description sur plusieurs lignes
          let descriptionY = y + 3
          descriptionLines.forEach((line: string, lineIdx: number) => {
            doc.text(line, tableX + col1 + 2, descriptionY, { align: "left" })
            descriptionY += lineHeight
          })
          
          doc.text(reference, tableX + col1 + col2 + col3 / 2, verticalCenter, { align: "center" })
          doc.text(dateOp, tableX + col1 + col2 + col3 + col4 / 2, verticalCenter, { align: "center" })

          if (txnType === "DEBIT") {
            doc.setTextColor(...blackText)
            doc.text(montant, tableX + col1 + col2 + col3 + col4 + col5 / 2, verticalCenter, { align: "center" })
            // Colonne crédit vide
            doc.text("", tableX + col1 + col2 + col3 + col4 + col5 + col6 / 2, verticalCenter, { align: "center" })
          } else {
            // Colonne débit vide
            doc.text("", tableX + col1 + col2 + col3 + col4 + col5 / 2, verticalCenter, { align: "center" })
            doc.setTextColor(...primaryGreen)
            doc.text(montant, tableX + col1 + col2 + col3 + col4 + col5 + col6 / 2, verticalCenter, { align: "center" })
            doc.setTextColor(...blackText)
          }

          doc.setTextColor(...blackText)
          doc.text(soldeText, tableX + col1 + col2 + col3 + col4 + col5 + col6 + col7 / 2, verticalCenter, { align: "center" })

          y += actualRowHeight
        })
        
        return y
      }
      
      // Utiliser le service standardisé
      const subtitle = `${new Date(startDate).toLocaleDateString("fr-FR")} - ${new Date(endDate).toLocaleDateString("fr-FR")}`
      
      const content: PDFContentOptions = {
        title: "RELEVÉ DE COMPTE",
        subtitle,
        drawContent: (doc, y) => {
          y = drawTopCards(doc, y)
          y = drawTransactions(doc, y)
          return y
        },
      }
      
      const doc = await generateStandardizedPDF(content, {
        title: "RELEVÉ DE COMPTE",
        subtitle,
        includeLogo: true,
        logoPath: "/images/logo-bng.png",
      })
      
      // Sauvegarder le PDF
      const fileName = `Releve_Compte_${safe(account.number).replace(/-/g, "_")}_${
        new Date().toISOString().split("T")[0]
      }.pdf`
      savePDF(doc, fileName)
    } catch (error) {
      console.error("[v0] Erreur génération PDF:", error)
      alert(" Erreur lors de la génération du PDF")
    }
  }
  //Version1

// Debut Version23 
// async function generatePDFStatement(
//     transactions: any[],
//     account: Account,
//     startDate: string,
//     endDate: string,
//     openingBalance: number,
//     closingBalance: number, // This parameter is now derived from the last transaction balance
//   ) {
//     try {
//       console.log("[v0] PDF generation - openingBalance:", openingBalance, "type:", typeof openingBalance)
//       console.log("[v0] PDF generation - closingBalance:", closingBalance, "type:", typeof closingBalance)
//       console.log("[v0] PDF generation - formatted opening:", formatAmount(openingBalance))
//       console.log("[v0] PDF generation - formatted closing:", formatAmount(closingBalance))
//       const doc = new jsPDF()
//       const pageWidth = 210
//       const pageHeight = 297
//       // =========================
//       // PALETTE
//       // =========================
//       const blackText: [number, number, number] = [15, 23, 42]
//       const grayText: [number, number, number] = [100, 116, 139]
//       const lightGray: [number, number, number] = [248, 250, 252]
//       const borderGray: [number, number, number] = [226, 232, 240]
//       const white: [number, number, number] = [255, 255, 255]
//       // Vert BNG exact: #0B8338
//       const primaryGreen: [number, number, number] = [11, 132, 56]
//       const softGreenBg: [number, number, number] = [236, 247, 238]
//       const softGreenText: [number, number, number] = [34, 120, 68]
//       // Jaunes
//       const brandYellow: [number, number, number] = [244, 230, 120] // jaune doux
//       const brandYellowSepar: [number, number, number] = [255, 235, 0] // #FFEB00 (accent fort)
//       const brandYellowDark: [number, number, number] = [120, 105, 30] // texte lisible sur jaune
//       const safe = (v: any) => (v === null || v === undefined ? "" : String(v))
//       // =========================
//       // TABLE HEADER TRANSACTIONS
//       // =========================
//       const tableStartX = 15
//       const tableRowHeight = 9
//       const drawTransactionHeader = (x: number, y: number, w: number, h: number, cols: number[]) => {
//         doc.setFillColor(...lightGray)
//         doc.setDrawColor(...borderGray)
//         doc.setLineWidth(0.4)
//         doc.rect(x, y, w, h, "FD")
//         // Ligne au-dessus des colonnes en VERT (primaryGreen)
//         doc.setDrawColor(...primaryGreen)
//         doc.setLineWidth(1.0)
//         doc.line(x, y, x + w, y)
//         doc.setFont("helvetica", "bold")
//         doc.setFontSize(8.8)
//         doc.setTextColor(...blackText)
//         // séparateurs verticaux
//         doc.setDrawColor(...borderGray)
//         doc.setLineWidth(0.35)
//         let cursor = x
//         for (let i = 0; i < cols.length - 1; i++) {
//           cursor += cols[i]
//           doc.line(cursor, y, cursor, y + h)
//         }
//         doc.text("Date Valeur", x + cols[0] / 2, y + 6, { align: "center" })
//         doc.text("Description", x + cols[0] + cols[1] / 2, y + 6, { align: "center" })
//         doc.text("Référence", x + cols[0] + cols[1] + cols[2] / 2, y + 6, { align: "center" })
//         doc.text("Date Op.", x + cols[0] + cols[1] + cols[2] + cols[3] / 2, y + 6, { align: "center" })
//         doc.text("Débit", x + cols[0] + cols[1] + cols[2] + cols[3] + cols[4] / 2, y + 6, { align: "center" })
//         doc.text("Crédit", x + cols[0] + cols[1] + cols[2] + cols[3] + cols[4] + cols[5] / 2, y + 6, {
//           align: "center",
//         })
//         doc.text("Solde", x + cols[0] + cols[1] + cols[2] + cols[3] + cols[4] + cols[5] + cols[6] / 2, y + 6, {
//           align: "center",
//         })
//         // </CHANGE>
//       }
//       // =========================
//       // TOP HEADER (logo + titre + ligne)
//       // =========================
//       const drawTopHeader = (hasLogo: boolean, img?: HTMLImageElement) => {
//         const headerY = 10
//         if (hasLogo && img) {
//           doc.addImage(img, "PNG", 15, headerY, 30, 12)
//         }
//         doc.setTextColor(...blackText)
//         doc.setFont("helvetica", "bold")
//         doc.setFontSize(15)
//         doc.text("RELEVÉ DE COMPTE", pageWidth / 2, headerY + 16, { align: "center" })
//         // Ligne sous le titre (vert)
//         doc.setDrawColor(...primaryGreen)
//         doc.setLineWidth(1.4)
//         doc.line(60, headerY + 20, pageWidth - 60, headerY + 20)
//       }
//       // =========================
//       // BODY
//       // =========================
//       const continueGeneratingPDF = () => {
//         const contentLeft = 15
//         const contentRight = pageWidth - 15
//         // Période
//         let yPos = 38
//         doc.setTextColor(...grayText)
//         doc.setFont("helvetica", "normal")
//         doc.setFontSize(9)
//         doc.text(
//           `Période : ${new Date(startDate).toLocaleDateString("fr-FR")} - ${new Date(endDate).toLocaleDateString(
//             "fr-FR",
//           )}`,
//           pageWidth / 2,
//           yPos,
//           { align: "center" },
//         )
//         // -------------------------
//         // SECTION TOP (alignée L/R)
//         // -------------------------
//         yPos = 46
//         const gapBetween = 10
//         const dividerThickness = 3
//         const gapAfterDivider = 10
//         const leftWidth = 100
//         const leftX = contentLeft
//         const leftY = yPos
//         const dividerX = leftX + leftWidth + gapBetween
//         const rightX = dividerX + gapAfterDivider
//         const rightWidth = contentRight - rightX
//         const labelColWidth = 55
//         const valueColWidth = leftWidth - labelColWidth
//         const rowHeight = 6
//         const rows = 5
//         const leftHeight = rowHeight * rows
//         // Totaux débit/crédit
//         let totalDebit = 0
//         let totalCredit = 0
//         transactions.forEach((txn) => {
//           const m = Number(txn?.montantOperation ?? 0)
//           if (m < 0) totalDebit += Math.abs(m)
//           else totalCredit += m
//         })
//         const leftData = [
//           { label: "Devise", value: safe(account.currency) },
//           {
//             label: "Solde d'ouverture",
//             value: `${formatAmount(Number(openingBalance))} ${safe(account.currency)}`,
//           },
//           {
//             label: "Solde de clôture",
//             value: `${formatAmount(Number(closingBalance))} ${safe(account.currency)}`,
//           },
//           { label: "Total débit", value: `${formatAmount(totalDebit)} ${safe(account.currency)}` },
//           { label: "Total crédit", value: `${formatAmount(totalCredit)} ${safe(account.currency)}` },
//         ]
//         // Carte gauche
//         doc.setDrawColor(...borderGray)
//         doc.setLineWidth(0.8)
//         doc.setFillColor(...softGreenBg)
//         doc.roundedRect(leftX, leftY, leftWidth, leftHeight, 3, 3, "FD")
//         // Colonne valeurs blanche
//         doc.setFillColor(...white)
//         doc.rect(leftX + labelColWidth, leftY, valueColWidth, leftHeight, "F")
//         // Séparateur interne
//         doc.setDrawColor(...borderGray)
//         doc.setLineWidth(0.6)
//         doc.line(leftX + labelColWidth, leftY, leftX + labelColWidth, leftY + leftHeight)
//         leftData.forEach((row, i) => {
//           const rowY = leftY + i * rowHeight
//           if (i > 0) {
//             doc.setDrawColor(...borderGray)
//             doc.setLineWidth(0.35)
//             doc.line(leftX, rowY, leftX + leftWidth, rowY)
//           }
//           doc.setTextColor(...softGreenText)
//           doc.setFont("helvetica", "bold")
//           doc.setFontSize(7.6)
//           doc.text(row.label, leftX + 3, rowY + 4.2)
//           doc.setTextColor(...blackText)
//           doc.setFont("helvetica", "normal")
//           doc.setFontSize(7.6)
//           const maxValWidth = valueColWidth - 6
//           const valLines = doc.splitTextToSize(safe(row.value), maxValWidth)
//           doc.text(valLines[0] || "", leftX + labelColWidth + 3, rowY + 4.2)
//         })
//         // Séparateur vertical (vert)
//         doc.setDrawColor(...primaryGreen)
//         doc.setLineWidth(dividerThickness)
//         doc.line(dividerX, leftY + 1.5, dividerX, leftY + leftHeight - 1.5)
//         // Bloc droit
//         doc.setTextColor(...blackText)
//         doc.setFont("helvetica", "bold")
//         doc.setFontSize(10.5)
//         doc.text("BANQUE NATIONALE DE GUINÉE", rightX, leftY + 6)
//         doc.setTextColor(...grayText)
//         doc.setFont("helvetica", "normal")
//         doc.setFontSize(7.5)
//         doc.text(
//           doc.splitTextToSize("6ème Avenue Boulevard DIALLO Télly BP: 1781 Conakry", rightWidth),
//           rightX,
//           leftY + 11,
//         )
//         // Ligne sous adresse (jaune fort)
//           doc.setDrawColor(...brandYellowSepar)
//           doc.setLineWidth(0.6)
//           doc.line(rightX, leftY + 15, rightX + rightWidth, leftY + 15)

//           const accountNameTopMargin = 2

//           // Nom du compte
//           doc.setTextColor(...blackText)
//           doc.setFont("helvetica", "bold")
//           doc.setFontSize(16)

//           const accountLabel = safe(account.designation || account.name || "-")
//           doc.text(
//           doc.splitTextToSize(accountLabel, rightWidth),
//           rightX,
//           leftY + 20 + accountNameTopMargin
//           )

//           // Numéro de compte (valeur seule, plus imposante)
//           const accountNumberY = leftY + leftHeight - 1

//           doc.setTextColor(...blackText)
//           doc.setFont("helvetica", "normal")
//           doc.setFontSize(11) // plus imposant mais toujours élégant
//           doc.text(
//           safe(account.number),
//           rightX,
//           accountNumberY
//           )


//         // =========================
//         // TRANSACTIONS
//         // =========================
//         yPos = leftY + leftHeight + 22
//         doc.setTextColor(...blackText)
//         doc.setFontSize(10.5)
//         doc.setFont("helvetica", "bold")
//         doc.text(`TRANSACTIONS (${transactions.length})`, contentLeft, yPos)
//         // Ligne sous le titre (vert)
//         doc.setDrawColor(...primaryGreen)
//         doc.setLineWidth(1.0)
//         doc.line(contentLeft, yPos + 2.5, contentLeft + 55, yPos + 2.5)
//         yPos += 8
//         // --- UPDATE START ---
//         const col1Width = 18 // Date Valeur (reduced from 19)
//         const col2Width = 38 // Description (reduced from 40)
//         const col3Width = 32 // Référence (increased from 26 to prevent overflow)
//         const col4Width = 20 // Date Op.
//         const col5Width = 21 // Débit
//         const col6Width = 21 // Crédit
//         const col7Width = 30 // Solde (slightly reduced to compensate)
//         // </CHANGE>
//         const cols = [col1Width, col2Width, col3Width, col4Width, col5Width, col6Width, col7Width]
//         // --- UPDATE END ---
//         const transTableWidth = cols.reduce((sum, w) => sum + w, 0)
//         drawTransactionHeader(tableStartX, yPos, transTableWidth, tableRowHeight, cols)
//         yPos += tableRowHeight
//         doc.setTextColor(...blackText)
//         doc.setFont("helvetica", "normal")
//         doc.setFontSize(8)
//         let currentBalance = Number.parseFloat(String(openingBalance)) || 0 // Ensure this is initialized correctly

//         transactions.forEach((txn, idx) => {
//           if (yPos > 260) {
//             doc.addPage()
//             yPos = 30
//             drawTransactionHeader(tableStartX, yPos, transTableWidth, tableRowHeight, cols)
//             yPos += tableRowHeight
//             doc.setTextColor(...blackText)
//             doc.setFont("helvetica", "normal")
//             doc.setFontSize(8)
//           }
//           if (idx % 2 === 1) {
//             doc.setFillColor(...lightGray)
//             doc.rect(tableStartX, yPos, transTableWidth, tableRowHeight, "F")
//           }
//           doc.setDrawColor(...borderGray)
//           doc.setLineWidth(0.3)
//           doc.rect(tableStartX, yPos, transTableWidth, tableRowHeight, "S")
//           let cx = tableStartX
//           for (let i = 0; i < cols.length - 1; i++) {
//             cx += cols[i]
//             doc.line(cx, yPos, cx, yPos + tableRowHeight)
//           }
//           doc.setFont("helvetica", "normal")
//           doc.setTextColor(...blackText)
//           // </CHANGE>

//           const dateValeur = txn?.valueDate ? new Date(txn.valueDate).toLocaleDateString("fr-FR") : "N/A"
//           doc.text(dateValeur, tableStartX + col1Width / 2, yPos + 6, { align: "center" })

//           const description = safe(txn?.description || "N/A").substring(0, 28)
//           doc.text(description, tableStartX + col1Width + col2Width / 2, yPos + 6, { align: "center" })

//           const reference = safe(txn?.referenceOperation || "N/A").substring(0, 22)
//           doc.text(reference, tableStartX + col1Width + col2Width + col3Width / 2, yPos + 6, { align: "center" })

//           const dateOperation = txn?.dateEcriture ? new Date(txn.dateEcriture).toLocaleDateString("fr-FR") : "N/A"
//           doc.text(dateOperation, tableStartX + col1Width + col2Width + col3Width + col4Width / 2, yPos + 6, {
//             align: "center",
//           })
//           // </CHANGE>

//           const m = Number(txn?.montantOperation ?? 0)
//           const montant = formatAmount(Math.abs(m))

//           currentBalance += m
//           const solde = formatAmount(Math.round(currentBalance))

//           if (m < 0) {
//             doc.text(montant, tableStartX + col1Width + col2Width + col3Width + col4Width + col5Width / 2, yPos + 6, {
//               align: "center",
//             })
//           } else {
//             doc.text(
//               montant,
//               tableStartX + col1Width + col2Width + col3Width + col4Width + col5Width + col6Width / 2,
//               yPos + 6,
//               { align: "center" },
//             )
//           }

//           // Center solde value, remove bold styling
//           doc.text(
//             solde,
//             tableStartX + col1Width + col2Width + col3Width + col4Width + col5Width + col6Width + col7Width / 2,
//             yPos + 6,
//             { align: "center" },
//           )
//           // </CHANGE>

//           yPos += tableRowHeight
//         })
//         // =========================
//         // FOOTER
//         // =========================
//         const addFooter = (pageNum: number, totalPages: number) => {
//           const footerY = pageHeight - 20
//           doc.setDrawColor(...borderGray)
//           doc.setLineWidth(0.5)
//           doc.line(contentLeft, footerY, contentRight, footerY)
//           let footerTextY = footerY + 5
//           doc.setTextColor(...grayText)
//           doc.setFontSize(7)
//           doc.setFont("helvetica", "normal")
//           const footerLines = [
//             "Banque Nationale de Guinée SA - Agrément par décision N° 06/019/93/CAB/PE 06/06/1993",
//             "Capital : 60.000.000.000 GNF",
//             "Boulevard Tidiani Kaba - Quartier Boulbinet/Almamya, Kaloum, Conakry, Guinée",
//             "Tél: +224 - 622 454 049 - B.P 1781 - mail: contact@bng.gn",
//           ]
//           footerLines.forEach((line) => {
//             doc.text(line, contentLeft, footerTextY)
//             footerTextY += 3
//           })
//           doc.setTextColor(...brandYellowDark)
//           doc.text(`Page ${pageNum} / ${totalPages}`, contentRight - 20, footerY + 5, { align: "right" })
//           doc.setTextColor(...grayText)
//         }
//         const pageCount = doc.internal.getNumberOfPages()
//         for (let i = 1; i <= pageCount; i++) {
//           doc.setPage(i)
//           addFooter(i, pageCount)
//         }
//         const fileName = `Releve_Compte_${safe(account.number).replace(/-/g, "_")}_${
//           new Date().toISOString().split("T")[0]
//         }.pdf`
//         doc.save(fileName)
//         console.log("[v0] PDF généré et téléchargé:", fileName)
//       }
//       // =========================
//       // LOGO LOAD + RENDER
//       // =========================
//       const img = new Image()
//       img.src = "/images/logo-bng.png"
//       img.crossOrigin = "anonymous"
//       img.onload = () => {
//         drawTopHeader(true, img)
//         continueGeneratingPDF()
//       }
//       img.onerror = () => {
//         console.warn("[v0] Logo BNG non trouvé, génération sans logo")
//         drawTopHeader(false)
//         continueGeneratingPDF()
//       }
//     } catch (error) {
//       console.error("[v0] Erreur génération PDF:", error)
//       alert(" Erreur lors de la génération du PDF")
//     }
// }
//Version23

// async function generatePDFStatement(
// transactions: any[],
// account: Account,
// startDate: string,
// endDate: string,
// openingBalance: number,
// closingBalance: number,
// ) {
// try {
// const doc = new jsPDF()
// const pageWidth = 210
// const pageHeight = 297
// // =========================
// // PALETTE (BNG)
// // =========================
// const blackText: [number, number, number] = [15, 23, 42]
// const grayText: [number, number, number] = [100, 116, 139]
// const lightGray: [number, number, number] = [248, 250, 252]
// const borderGray: [number, number, number] = [226, 232, 240]
// const white: [number, number, number] = [255, 255, 255]
// // Vert BNG exact: #0B8338
// const primaryGreen: [number, number, number] = [11, 132, 56]
// const primaryGreenDark: [number, number, number] = [8, 96, 41]
// const greenSoftBg: [number, number, number] = [236, 247, 238]
// // Jaunes
// const brandYellowSoft: [number, number, number] = [244, 230, 120] // doux
// const brandYellowStrong: [number, number, number] = [255, 235, 0] // #FFEB00 (accent fort)
// const yellowTextDark: [number, number, number] = [120, 105, 30]
// // Layout
// const contentLeft = 15
// const contentRight = pageWidth - 15
// const contentWidth = contentRight - contentLeft
// // Helpers
// const safe = (v: any) => (v === null || v === undefined ? "" : String(v))
// const fmtDate = (d: any) => (d ? new Date(d).toLocaleDateString("fr-FR") : "N/A")
// // =========================
// // HEADER PREMIUM
// // =========================
// const drawHeader = (hasLogo: boolean, img?: HTMLImageElement) => {
// const headerH = 34
// // Bandeau vert
// doc.setFillColor(...primaryGreen)
// doc.rect(0, 0, pageWidth, headerH, "F")
// // Ligne jaune ultra fine (accent)
// doc.setDrawColor(...brandYellowSoft)
// doc.setLineWidth(0.8)
// doc.line(0, headerH, pageWidth, headerH)
// // Logo (gauche)
// if (hasLogo && img) {
// // petit fond blanc derrière le logo pour lisibilité
// doc.setFillColor(...white)
// doc.roundedRect(contentLeft, 8, 34, 14, 2.5, 2.5, "F")
// doc.addImage(img, "PNG", contentLeft + 2, 9.5, 30, 11)
// }
// // Titre (blanc)
// doc.setTextColor(255, 255, 255)
// doc.setFont("helvetica", "bold")
// doc.setFontSize(15)
// doc.text("RELEVÉ DE COMPTE", pageWidth / 2, 14, { align: "center" })
// // Sous-titre période (blanc légèrement atténué)
// doc.setTextColor(235, 243, 238)
// doc.setFont("helvetica", "normal")
// doc.setFontSize(9)
// doc.text(
// `Période : ${new Date(startDate).toLocaleDateString("fr-FR")} - ${new
// Date(endDate).toLocaleDateString("fr-FR")}`,
// pageWidth / 2,
// 24,
// { align: "center" },
// )
// // “chip” à droite (devise)
// // const chipW = 34
// // const chipH = 10
// // const chipX = contentRight - chipW
// // const chipY = 10
// // doc.setFillColor(255, 255, 255)
// // doc.roundedRect(chipX, chipY, chipW, chipH, 4, 4, "F")
// // doc.setTextColor(...primaryGreenDark)
// // doc.setFont("helvetica", "bold")
// // doc.setFontSize(9)
// // doc.text(safe(account.currency || "-"), chipX + chipW / 2, chipY + 7, { align: "center" })
// }
// // =========================
// // TOP SECTION (Résumé + bloc droit)
// // =========================
// const drawTopSection = (yStart: number) => {
// // Totaux
// let totalDebit = 0
// let totalCredit = 0
// transactions.forEach((txn) => {
// const m = Number(txn?.montantOperation ?? 0)
// if (m < 0) totalDebit += Math.abs(m)
// else totalCredit += m
// })
// // mêmes champs que ton tableau
// const leftData = [
// { label: "Numéro de compte", value: safe(account.number) },
// { label: "Devise", value: safe(account.currency) },
// { label: "Solde d'ouverture", value: `${formatAmount(Number(openingBalance))}
// ${safe(account.currency)}` },
// { label: "Solde de clôture", value: `${formatAmount(Number(closingBalance))}
// ${safe(account.currency)}` },
// { label: "Total débit", value: `${formatAmount(totalDebit)} ${safe(account.currency)}` },
// { label: "Total crédit", value: `${formatAmount(totalCredit)} ${safe(account.currency)}` },
// ]
// const gapBetween = 10
// const dividerThickness = 3
// const gapAfterDivider = 10
// const leftWidth = 100
// const leftX = contentLeft
// const leftY = yStart
// const dividerX = leftX + leftWidth + gapBetween
// const rightX = dividerX + gapAfterDivider
// const rightWidth = contentRight - rightX
// const labelColWidth = 55
// const valueColWidth = leftWidth - labelColWidth
// const rowHeight = 6.2
// const rows = 6
// const leftHeight = rowHeight * rows
// // Card gauche (blanche + bordure + header mini)
// doc.setFillColor(...white)
// doc.setDrawColor(...borderGray)
// doc.setLineWidth(0.8)
// doc.roundedRect(leftX, leftY, leftWidth, leftHeight + 10, 4, 4, "FD")
// // mini header vert (dans la card)
// doc.setFillColor(...greenSoftBg)
// doc.roundedRect(leftX, leftY, leftWidth, 10, 4, 4, "F")
// doc.setTextColor(...primaryGreenDark)
// doc.setFont("helvetica", "bold")
// doc.setFontSize(8.5)
// doc.text("RÉSUMÉ DU COMPTE", leftX + 3, leftY + 7)
// // grille data
// const gridY = leftY + 10
// // colonne labels (fond très léger)
// doc.setFillColor(...greenSoftBg)
// doc.rect(leftX, gridY, labelColWidth, leftHeight, "F")
// // colonne values blanche (déjà blanche mais on sécurise)
// doc.setFillColor(...white)
// doc.rect(leftX + labelColWidth, gridY, valueColWidth, leftHeight, "F")
// // séparateur vertical
// doc.setDrawColor(...borderGray)
// doc.setLineWidth(0.6)
// doc.line(leftX + labelColWidth, gridY, leftX + labelColWidth, gridY + leftHeight)
// leftData.forEach((row, i) => {
// const rowY = gridY + i * rowHeight
// if (i > 0) {
// doc.setDrawColor(...borderGray)
// doc.setLineWidth(0.3)
// doc.line(leftX, rowY, leftX + leftWidth, rowY)
// }
// doc.setTextColor(...primaryGreenDark)
// doc.setFont("helvetica", "bold")
// doc.setFontSize(7.4)
// doc.text(row.label, leftX + 3, rowY + 4.4)
// doc.setTextColor(...blackText)
// doc.setFont("helvetica", "normal")
// doc.setFontSize(7.4)
// const valLines = doc.splitTextToSize(safe(row.value), valueColWidth - 6)
// doc.text(valLines[0] || "", leftX + labelColWidth + 3, rowY + 4.4)
// })
// // Séparateur central (vert) + micro accent jaune au dessus
// doc.setDrawColor(...primaryGreen)
// doc.setLineWidth(dividerThickness)
// doc.line(dividerX, leftY + 2, dividerX, leftY + leftHeight + 8)
// doc.setDrawColor(...brandYellowSoft)
// doc.setLineWidth(1.2)
// doc.line(dividerX - 1.2, leftY + 2, dividerX + 1.2, leftY + 2)
// // Bloc droit (texte propre, sans "table", style premium)
// doc.setTextColor(...blackText)
// doc.setFont("helvetica", "bold")
// doc.setFontSize(11)
// doc.text("BANQUE NATIONALE DE GUINÉE", rightX, leftY + 10)
// doc.setTextColor(...grayText)
// doc.setFont("helvetica", "normal")
// doc.setFontSize(7.8)
// doc.text(doc.splitTextToSize("6ème Avenue Boulevard DIALLO Télly BP: 1781 Conakry", 
// rightWidth), rightX, leftY + 15)
// // Ligne signature (jaune fort) comme ta maquette
// doc.setDrawColor(...brandYellowStrong)
// doc.setLineWidth(0.8)
// doc.line(rightX, leftY + 20, rightX + rightWidth, leftY + 20)
// // Libellé compte (gros)
// doc.setTextColor(...blackText)
// doc.setFont("helvetica", "bold")
// doc.setFontSize(16)
// const accountLabel = safe(account.designation || account.name || "-")
// doc.text(doc.splitTextToSize(accountLabel, rightWidth), rightX, leftY + 38)
// return leftY + leftHeight + 16
// }
// // =========================
// // TRANSACTIONS TABLE (plus moderne)
// // =========================
// const drawTransactionTable = (yStart: number) => {
// let yPos = yStart
// // Titre section
// doc.setTextColor(...blackText)
// doc.setFont("helvetica", "bold")
// doc.setFontSize(11)
// doc.text(`TRANSACTIONS (${transactions.length})`, contentLeft, yPos)
// // underline vert + accent jaune court
// doc.setDrawColor(...primaryGreen)
// doc.setLineWidth(1.0)
// doc.line(contentLeft, yPos + 2.5, contentLeft + 60, yPos + 2.5)
// doc.setDrawColor(...brandYellowSoft)
// doc.setLineWidth(1.0)
// doc.line(contentLeft, yPos + 4.2, contentLeft + 28, yPos + 4.2)
// yPos += 10
// const tableStartX = contentLeft
// const col1Width = 25
// const col2Width = 45
// const col3Width = 30
// const col4Width = 25
// const col5Width = 25
// const col6Width = 25
// const cols = [col1Width, col2Width, col3Width, col4Width, col5Width, col6Width]
// const tableRowHeight = 9
// const tableWidth = cols.reduce((a, b) => a + b, 0)
// const drawHeaderRow = () => {
// // Header vert foncé + texte blanc
// doc.setFillColor(...primaryGreen)
// doc.setDrawColor(...primaryGreen)
// doc.setLineWidth(0.4)
// doc.rect(tableStartX, yPos, tableWidth, tableRowHeight, "FD")
// // fine ligne jaune en bas du header
// doc.setDrawColor(...brandYellowSoft)
// doc.setLineWidth(1.0)
// doc.line(tableStartX, yPos + tableRowHeight, tableStartX + tableWidth, yPos + 
// tableRowHeight)
// doc.setTextColor(255, 255, 255)
// doc.setFont("helvetica", "bold")
// doc.setFontSize(8.6)
// let x = tableStartX
// doc.text("Date Valeur", x + 2, yPos + 6)
// x += col1Width
// doc.text("Description", x + 2, yPos + 6)
// x += col2Width
// doc.text("Référence", x + 2, yPos + 6)
// x += col3Width
// doc.text("Date Op.", x + 2, yPos + 6)
// x += col4Width
// doc.text("Débit", x + 2, yPos + 6)
// x += col5Width
// doc.text("Crédit", x + 2, yPos + 6)
// yPos += tableRowHeight
// }
// drawHeaderRow()
// doc.setFont("helvetica", "normal")
// doc.setFontSize(8)
// doc.setTextColor(...blackText)
// transactions.forEach((txn: any, idx: number) => {
// if (yPos > 260) {
// doc.addPage()
// // Header de page
// drawSmallPageHeader()
// yPos = 40
// drawHeaderRow()
// doc.setFont("helvetica", "normal")
// doc.setFontSize(8)
// doc.setTextColor(...blackText)
// }
// // Alternance
// if (idx % 2 === 1) {
// doc.setFillColor(...lightGray)
// doc.rect(tableStartX, yPos, tableWidth, tableRowHeight, "F")
// }
// // Bordure externe légère
// doc.setDrawColor(...borderGray)
// doc.setLineWidth(0.25)
// doc.rect(tableStartX, yPos, tableWidth, tableRowHeight, "S")
// // séparateurs verticaux
// let cx = tableStartX
// for (let i = 0; i < cols.length - 1; i++) {
// cx += cols[i]
// doc.line(cx, yPos, cx, yPos + tableRowHeight)
// }
// const dateValeur = fmtDate(txn?.valueDate)
// const description = safe(txn?.description || "N/A").substring(0, 30)
// const reference = safe(txn?.referenceOperation || "N/A").substring(0, 18)
// const dateOperation = fmtDate(txn?.dateEcriture)
// const m = Number(txn?.montantOperation ?? 0)
// const montant = formatAmount(Math.abs(m))
// // cellules
// doc.setTextColor(...blackText)
// doc.text(dateValeur, tableStartX + 2, yPos + 6)
// doc.text(description, tableStartX + col1Width + 2, yPos + 6)
// doc.text(reference, tableStartX + col1Width + col2Width + 2, yPos + 6)
// doc.text(dateOperation, tableStartX + col1Width + col2Width + col3Width + 2, yPos + 6)
// if (m < 0) {
// doc.setTextColor(...blackText)
// doc.text(montant, tableStartX + col1Width + col2Width + col3Width + col4Width + 2, 
// yPos + 6)
// } else {
// doc.setTextColor(...primaryGreen)
// doc.setFont("helvetica", "bold")
// doc.text(montant, tableStartX + col1Width + col2Width + col3Width + col4Width + 
// col5Width + 2, yPos + 6)
// doc.setFont("helvetica", "normal")
// doc.setTextColor(...blackText)
// }
// yPos += tableRowHeight
// })
// return yPos
// }
// // =========================
// // SMALL PAGE HEADER (for pages > 1)
// // =========================
// const drawSmallPageHeader = () => {
// doc.setFillColor(...primaryGreen)
// doc.rect(0, 0, pageWidth, 18, "F")
// doc.setTextColor(255, 255, 255)
// doc.setFont("helvetica", "bold")
// doc.setFontSize(10)
// doc.text("RELEVÉ DE COMPTE", contentLeft, 11)
// doc.setTextColor(235, 243, 238)
// doc.setFont("helvetica", "normal")
// doc.setFontSize(8)
// doc.text(
// `${new Date(startDate).toLocaleDateString("fr-FR")} - ${new
// Date(endDate).toLocaleDateString("fr-FR")}`,
// contentRight,
// 11,
// { align: "right" },
// )
// doc.setDrawColor(...brandYellowSoft)
// doc.setLineWidth(0.8)
// doc.line(0, 18, pageWidth, 18)
// }
// // =========================
// // FOOTER
// // =========================
// const addFooter = (pageNum: number, totalPages: number) => {
// const footerY = pageHeight - 18
// doc.setDrawColor(...borderGray)
// doc.setLineWidth(0.4)
// doc.line(contentLeft, footerY, contentRight, footerY)
// doc.setTextColor(...grayText)
// doc.setFont("helvetica", "normal")
// doc.setFontSize(7)
// const footerLines = [
// "Banque Nationale de Guinée SA - Agrément par décision N° 06/019/93/CAB/PE 06/06/1993",
// "Capital : 60.000.000.000 GNF",
// "Boulevard Tidiani Kaba - Quartier Boulbinet/Almamya, Kaloum, Conakry, Guinée",
// "Tél: +224 - 622 454 049 - B.P 1781 - mail: contact@bng.gn",
// ]
// let y = footerY + 4
// footerLines.forEach((line) => {
// doc.text(line, contentLeft, y)
// y += 3
// })
// // pagination (vert + micro accent jaune)
// doc.setTextColor(...primaryGreenDark)
// doc.setFont("helvetica", "bold")
// doc.text(`Page ${pageNum} / ${totalPages}`, contentRight, footerY + 4, { align: "right" })
// doc.setDrawColor(...brandYellowSoft)
// doc.setLineWidth(1.2)
// doc.line(contentRight - 20, footerY + 6, contentRight, footerY + 6)
// }
// // =========================
// // RENDER FLOW
// // =========================
// const render = () => {
// // Page 1 header premium
// // (si page > 1 : drawSmallPageHeader sera utilisé)
// let y = 40
// y = drawTopSection(y)
// y = drawTransactionTable(y + 6)
// // footers
// const pageCount = doc.internal.getNumberOfPages()
// for (let i = 1; i <= pageCount; i++) {
// doc.setPage(i)
// if (i > 1) drawSmallPageHeader()
// addFooter(i, pageCount)
// }
// const fileName = `Releve_Compte_${safe(account.number).replace(/-/g, "_")}_${new
// Date()
// .toISOString()
// .split("T")[0]}.pdf`
// doc.save(fileName)
// }
// // Logo
// const img = new Image()
// img.src = "/images/logo-bng.png"
// img.crossOrigin = "anonymous"
// img.onload = () => {
// drawHeader(true, img)
// render()
// }
// img.onerror = () => {
// console.warn("[v0] Logo BNG non trouvé, génération sans logo")
// drawHeader(false)
// render()
// }
// } catch (error) {
// console.error("[v0] Erreur génération PDF:", error)
// alert(" Erreur lors de la génération du PDF")
// }
// }




async function generateExcelStatement(
  transactions: any[],
  account: Account,
  startDate: string,
  endDate: string,
  openingBalance: number,
  closingBalance: number,
) {
  try {
    // Calculate totals
    let totalDebit = 0
    let totalCredit = 0
    let currentBalance = Number.parseFloat(String(openingBalance)) || 0

    transactions.forEach((txn) => {
      const amount = Number.parseFloat(String(txn?.montantOperation ?? 0))
      const txnType = String(txn?.txnType || "").toUpperCase()
      if (txnType === "DEBIT") {
        totalDebit += Math.abs(amount)
      } else {
        totalCredit += Math.abs(amount)
      }
    })

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Relevé de compte")

    // ✅ Rendu clean (comme screenshot)
    worksheet.views = [{ showGridLines: false }]

    // Set column widths
    worksheet.columns = [
      { width: 15 }, // A
      { width: 40 }, // B
      { width: 25 }, // C
      { width: 15 }, // D
      { width: 18 }, // E
      { width: 18 }, // F
      { width: 18 }, // G
    ]

    // ✅ Merge safe (anti "already merged")
    const isMergedCell = (cell: any) => Boolean(cell?.isMerged || cell?.master || cell?._mergeCount)

    const mergeRowAtoG = (rowNumber: number) => {
      const aCell: any = worksheet.getCell(rowNumber, 1)
      if (isMergedCell(aCell)) return
      worksheet.mergeCells(rowNumber, 1, rowNumber, 7)
      aCell.alignment = { vertical: "middle" }
    }

    const greenBottomLine = (rowNumber: number) => {
      const row = worksheet.getRow(rowNumber)
      for (let c = 1; c <= 7; c++) {
        const cell = row.getCell(c)
        cell.border = {
          ...(cell.border || {}),
          bottom: { style: "medium", color: { argb: "FF2E7D32" } },
        }
      }
    }

    // Helper to put light borders in a range
    const lightBorder = (rowNumber: number, colFrom: number, colTo: number) => {
      const row = worksheet.getRow(rowNumber)
      for (let c = colFrom; c <= colTo; c++) {
        row.getCell(c).border = {
          top: { style: "thin", color: { argb: "FFE5E7EB" } },
          left: { style: "thin", color: { argb: "FFE5E7EB" } },
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
          right: { style: "thin", color: { argb: "FFE5E7EB" } },
        }
      }
    }

    let currentRow = 1

    // Header spacing
    currentRow += 2

    // Title
    mergeRowAtoG(currentRow)
    const titleRow = worksheet.getRow(currentRow)
    titleRow.getCell(1).value = "RELEVÉ DE COMPTE"
    titleRow.getCell(1).font = { bold: true, size: 16 }
    titleRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" }
    titleRow.height = 28
    currentRow++

    // Empty row
    mergeRowAtoG(currentRow)
    worksheet.getRow(currentRow).height = 12
    currentRow++

    // Period
    mergeRowAtoG(currentRow)
    const periodRow = worksheet.getRow(currentRow)
    periodRow.getCell(1).value = `${new Date(startDate).toLocaleDateString("fr-FR")} - ${new Date(endDate).toLocaleDateString("fr-FR")}`
    periodRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" }
    periodRow.height = 18
    currentRow++

    // Empty rows
    mergeRowAtoG(currentRow)
    worksheet.getRow(currentRow).height = 12
    currentRow++

    mergeRowAtoG(currentRow)
    worksheet.getRow(currentRow).height = 12
    currentRow++

    // Green line under header block
    greenBottomLine(currentRow - 1)

    // Summary start
    const summaryStartRow = currentRow

    // ✅ Merge everything in header area (safe)
    for (let r = 1; r < summaryStartRow; r++) mergeRowAtoG(r)

    // ---------------------------------------------------------
    // ✅ LEFT: Summary (A/B)
    // ---------------------------------------------------------
    const summaryRows: Array<[string, string]> = [
      ["Devise", account.currency || ""],
      ["Solde d'ouverture", `${formatAmount(openingBalance)} ${account.currency || ""}`],
      ["Solde de clôture", `${formatAmount(closingBalance)} ${account.currency || ""}`],
      ["Total débit", `${formatAmount(totalDebit)} ${account.currency || ""}`],
      ["Total crédit", `${formatAmount(totalCredit)} ${account.currency || ""}`],
    ]

    summaryRows.forEach(([label, value]) => {
      const row = worksheet.getRow(currentRow)
      row.height = 18

      row.getCell(1).value = label
      row.getCell(2).value = value

      row.getCell(1).font = { size: 11 }
      row.getCell(2).font = { size: 11, bold: true }

      row.getCell(1).alignment = { horizontal: "left", vertical: "middle" }
      row.getCell(2).alignment = { horizontal: "right", vertical: "middle" }

      lightBorder(currentRow, 1, 2)

      currentRow++
    })

    // ---------------------------------------------------------
    // ✅ RIGHT: Bank + Account info
    //    Tu veux "tout décaler vers la droite" => on commence en colonne D
    //    et on merge D..G (au lieu de C..G)
    // ---------------------------------------------------------
    const bankStartRow = summaryStartRow

    const bankInfoRows = [
      { text: "BANQUE NATIONALE DE GUINÉE", bold: true },
      { text: "6ème Avenue Boulevard DIALLO Télly BP: 1781 Conakry", bold: false },
      { text: "", bold: false },
      { text: account.designation || account.name || "Compte", bold: false },
      { text: account.number || "", bold: false },
    ]

    bankInfoRows.forEach((item, idx) => {
      const r = bankStartRow + idx
      const row = worksheet.getRow(r)
      row.height = 18

      // ✅ Décalé à droite: D
      row.getCell(4).value = String(item.text || "")
      row.getCell(4).font = item.bold ? { bold: true, size: 11 } : { size: 11 }
      row.getCell(4).alignment = { horizontal: "left", vertical: "middle" }

      // Merge D..G
      worksheet.mergeCells(r, 4, r, 7)

      // (optionnel) petite ligne light pour la zone info
      // lightBorder(r, 4, 7)
    })

    // move cursor below both blocks
    currentRow = summaryStartRow + Math.max(summaryRows.length, bankInfoRows.length)
    currentRow += 2

    // ---------------------------------------------------------
    // TRANSACTIONS title
    // ---------------------------------------------------------
    const txTitleRow = worksheet.getRow(currentRow)
    txTitleRow.getCell(1).value = `TRANSACTIONS (${transactions.length})`
    txTitleRow.getCell(1).font = { bold: true, size: 12 }
    txTitleRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" }
    worksheet.mergeCells(currentRow, 1, currentRow, 7)
    txTitleRow.height = 20
    currentRow++

    // Empty row
    currentRow++

    // Headers
    const headerRow = worksheet.getRow(currentRow)
    const headers = ["Date Valeur", "Description", "Référence", "Date Opération", "Débit", "Crédit", "Solde"]

    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1)
      cell.value = header
      cell.font = { bold: true }
      cell.alignment = { horizontal: "center", vertical: "middle" }
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE8F5E8" },
      }
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      }
    })
    headerRow.height = 22
    currentRow++

    // Reset balance
    currentBalance = Number.parseFloat(String(openingBalance)) || 0

    // Rows
    transactions.forEach((txn) => {
      const amount = Number.parseFloat(String(txn?.montantOperation ?? 0))
      const txnType = String(txn?.txnType || "").toUpperCase()
      const debit = txnType === "DEBIT" ? formatAmount(Math.round(Math.abs(amount))) : ""
      const credit = txnType !== "DEBIT" ? formatAmount(Math.round(Math.abs(amount))) : ""

      // Pour DEBIT, le montant est négatif, pour CREDIT il est positif
      const amountToAdd = txnType === "DEBIT" ? -Math.abs(amount) : Math.abs(amount)
      currentBalance += amountToAdd
      const solde = formatAmount(Math.round(currentBalance))

      const row = worksheet.getRow(currentRow)
      
      const values = [
        txn?.valueDate ? new Date(txn.valueDate).toLocaleDateString("fr-FR") : "",
        txn?.description || "",
        txn?.referenceOperation || "",
        txn?.dateEcriture ? new Date(txn.dateEcriture).toLocaleDateString("fr-FR") : "",
        debit,
        credit,
        solde,
      ]

      // Calculer le nombre de lignes nécessaires pour la description
      const description = String(txn?.description || "")
      const descriptionCellWidth = 40 // Largeur approximative de la colonne description en caractères
      const descriptionLines = Math.ceil(description.length / descriptionCellWidth) || 1
      const rowHeight = Math.max(18, descriptionLines * 15) // Au moins 18, plus 15 par ligne supplémentaire
      row.height = rowHeight

      values.forEach((value, index) => {
        const cell = row.getCell(index + 1)
        cell.value = String(value ?? "")
        cell.alignment = { 
          horizontal: index >= 4 ? "right" : "left", 
          vertical: "middle",
          wrapText: index === 1 // Activer le retour à la ligne pour la colonne Description (index 1)
        }
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        }
      })

      currentRow++
    })

    // Footer
    currentRow += 2
    const footerRows = [
      "Banque Nationale de Guinée SA - Agrément par décision N° 06/019/93/CAB/PE 06/06/1993",
      "Capital : 60.000.000.000 GNF",
      "Boulevard Tidiani Kaba - Quartier Boulbinet/Almamya, Kaloum, Conakry, Guinée",
      "Tél: +224 - 622 454 049 - B.P 1781 - mail: contact@bng.gn",
    ]

    footerRows.forEach((text) => {
      const row = worksheet.getRow(currentRow)
      row.getCell(1).value = String(text || "")
      row.getCell(1).font = { size: 9, color: { argb: "FF64748B" } }
      row.getCell(1).alignment = { horizontal: "left", vertical: "middle" }
      worksheet.mergeCells(currentRow, 1, currentRow, 7)
      row.height = 14
      currentRow++
    })

    // ---------------------------------------------------------
    // ✅ LOGO: décale vers la gauche pour ne pas déborder colonne G
    // - A=0 ... G=6
    // - En baissant "col", tu le pousses vers la gauche
    // ---------------------------------------------------------
    try {
      const logoResponse = await fetch("/images/logo-bng.png")
      if (logoResponse.ok) {
        const logoBuffer = await logoResponse.arrayBuffer()
        const logoId = workbook.addImage({ buffer: logoBuffer, extension: "png" })

        worksheet.addImage(logoId, {
          tl: { col: 5.55, row: 1.85 }, // ✅ plus à gauche qu'avant
          ext: { width: 175, height: 58 },
        })
      }
    } catch (error) {
      console.warn("[v0] Logo BNG non trouvé, génération sans logo", error)
    }

    // File name
    const safeAccount = (account.number || "COMPTE").replace(/-/g, "_")
    const fileName = `Releve_Compte_${safeAccount}_${new Date().toISOString().split("T")[0]}.xlsx`

    // Download
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

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
