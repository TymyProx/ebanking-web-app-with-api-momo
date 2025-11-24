"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, useTransition, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  Download,
  FileText,
  Eye,
  EyeOff,
  Wallet,
  PiggyBank,
  DollarSign,
  CreditCard,
  Building,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Shield,
  Info,
  RefreshCw,
} from "lucide-react"
import { getAccounts } from "../actions"
import { toggleAccountStatus, getAccountDetails } from "./actions"
import { getUserTransactions } from "@/app/transfers/mes-virements/actions"

interface Account {
  id: string
  name: string
  number: string
  balance: number
  availableBalance: number
  currency: string
  type: string
  status: string
  iban: string
  openingDate: string
  branch: string
  interestRate?: number
  overdraftLimit?: number
}

interface Transaction {
  id: string
  accountId: string
  type: string
  description: string
  amount: number
  currency: string
  date: string
  status: "Exécuté" | "En attente" | "Rejeté"
  counterparty: string
  reference: string
  balanceAfter: number
}

export default function AccountDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const accountId = params.id as string
  const [showBalance, setShowBalance] = useState(true)
  const [account, setAccount] = useState<Account | null>(null)

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (typeof window !== "undefined") {
      const cacheKey = `transactions_${accountId}`
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        try {
          const cachedData = JSON.parse(cached)
          if (Date.now() - cachedData.timestamp < 60000) {
            return cachedData.transactions
          }
        } catch (e) {
          // Invalid cache, return empty array
        }
      }
    }
    return []
  })

  const [isLoadingAccount, setIsLoadingAccount] = useState(true)
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [displayLimit, setDisplayLimit] = useState(20)

  const displayedTransactions = useMemo(() => {
    return transactions.slice(0, displayLimit)
  }, [transactions, displayLimit])

  useEffect(() => {
    const loadData = async () => {
      // Load both account and transactions in parallel
      const [accountResult, transactionsResult] = await Promise.all([loadAccountData(), loadTransactionsData()])
    }

    const loadAccountData = async () => {
      try {
        const accountDetails = await getAccountDetails(accountId)

        if (accountDetails) {
          const iban = `${accountDetails.codeBanque || ""}${accountDetails.codeAgence || ""}${accountDetails.accountNumber || ""}${accountDetails.cleRib || ""}`

          const adaptedAccount: Account = {
            id: accountDetails.id || accountDetails.accountId,
            name: accountDetails.accountName || `Compte ${accountDetails.accountNumber}`,
            number: accountDetails.accountNumber,
            balance: Number.parseFloat(accountDetails.bookBalance || "0"),
            availableBalance: Number.parseFloat(accountDetails.availableBalance || "0"),
            currency: accountDetails.currency || "GNF",
            type: accountDetails.type,
            status: accountDetails.status,
            iban: iban,
            openingDate: accountDetails.createdAt || "2020-01-01",
            branch: accountDetails.codeAgence || "Agence Kaloum",
            overdraftLimit: accountDetails.currency === "GNF" ? 500000 : undefined,
          }
          setAccount(adaptedAccount)
        } else {
          const accountsData = await getAccounts()

          if (Array.isArray(accountsData)) {
            const foundAccount = accountsData.find((acc: any) => acc.id === accountId || acc.accountId === accountId)

            if (foundAccount) {
              const iban = `${foundAccount.codeBanque || ""}${foundAccount.codeAgence || ""}${foundAccount.accountNumber || ""}${foundAccount.cleRib || ""}`

              const adaptedAccount: Account = {
                id: foundAccount.id || foundAccount.accountId,
                name: foundAccount.accountName || `Compte ${foundAccount.accountNumber}`,
                number: foundAccount.accountNumber,
                balance: Number.parseFloat(foundAccount.bookBalance || "0"),
                availableBalance: Number.parseFloat(foundAccount.availableBalance || "0"),
                currency: foundAccount.currency || "GNF",
                type: foundAccount.type,
                status: foundAccount.status,
                iban: iban,
                openingDate: foundAccount.createdAt || "2020-01-01",
                branch: foundAccount.codeAgence || "Agence Kaloum",
                overdraftLimit: foundAccount.currency === "GNF" ? 500000 : undefined,
              }
              setAccount(adaptedAccount)
            }
          }
        }
      } catch (error) {
        // Error handled silently
      } finally {
        setIsLoadingAccount(false)
      }
    }

    const loadTransactionsData = async () => {
      try {
        const transactionsData = await getUserTransactions()

        console.log("[v0] All transactions data:", transactionsData)
        console.log("[v0] Looking for account:", account?.number || accountId)

        if (transactionsData.success && transactionsData.data && Array.isArray(transactionsData.data)) {
          console.log("[v0] Total transactions fetched:", transactionsData.data.length)

          if (transactionsData.data.length > 0) {
            console.log("[v0] Sample transaction structure:", transactionsData.data[0])
          }

          const accountNumber = account?.number || accountId
          const accountTransactions = transactionsData.data
            .filter((txn: any) => {
              const txnAccountNumber = txn.numCompte || txn.accountNumber || txn.accountId
              const matches = txnAccountNumber === accountNumber

              if (matches) {
                console.log("[v0] Transaction matched for account:", txn)
              }

              return matches
            })
            .slice(0, 100)
            .map((txn: any) => {
              const amount = Number.parseFloat(txn.amount || "0")
              const isCredit = txn.txnType === "CREDIT"

              return {
                id: txn.txnId || txn.id || txn.transactionId,
                accountId: txn.accountId || txn.numCompte || accountId,
                type: isCredit ? "Virement reçu" : "Virement émis",
                description: txn.description || txn.referenceOperation || "Transaction",
                amount: isCredit ? Math.abs(amount) : -Math.abs(amount),
                currency: txn.codeDevise || "GNF",
                date: txn.valueDate || txn.date || txn.createdAt || new Date().toISOString(),
                status: txn.status || "Exécuté",
                counterparty: txn.creditAccount || txn.beneficiaryId || txn.beneficiary || "Système",
                reference: txn.txnId || txn.referenceOperation || txn.reference || "REF-" + Date.now(),
                balanceAfter: 0,
              } as Transaction
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

          console.log("[v0] Filtered transactions for this account:", accountTransactions.length)
          setTransactions(accountTransactions)

          const cacheKey = `transactions_${accountId}`
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({
              transactions: accountTransactions,
              timestamp: Date.now(),
            }),
          )
        } else {
          console.log("[v0] No transaction data available")
          setTransactions([])
        }
      } catch (error) {
        console.log("[v0] Error loading transactions:", error)
        setTransactions([])
      } finally {
        setIsLoadingTransactions(false)
      }
    }

    loadData()
  }, [accountId])

  const handleRefreshTransactions = async () => {
    setIsLoadingTransactions(true)
    try {
      const transactionsData = await getUserTransactions()

      if (transactionsData.success && transactionsData.data && Array.isArray(transactionsData.data)) {
        const accountNumber = account?.number || accountId
        const accountTransactions = transactionsData.data
          .filter((txn: any) => {
            const txnAccountNumber = txn.numCompte || txn.accountNumber || txn.accountId
            return txnAccountNumber === accountNumber
          })
          .slice(0, 100)
          .map((txn: any) => {
            const amount = Number.parseFloat(txn.amount || "0")
            const isCredit = txn.txnType === "CREDIT"

            return {
              id: txn.txnId || txn.id || txn.transactionId,
              accountId: txn.accountId || txn.numCompte || accountId,
              type: isCredit ? "Virement reçu" : "Virement émis",
              description: txn.description || txn.referenceOperation || "Transaction",
              amount: isCredit ? Math.abs(amount) : -Math.abs(amount),
              currency: txn.codeDevise || "GNF",
              date: txn.valueDate || txn.date || txn.createdAt || new Date().toISOString(),
              status: txn.status || "Exécuté",
              counterparty: txn.creditAccount || txn.beneficiaryId || txn.beneficiary || "Système",
              reference: txn.txnId || txn.referenceOperation || txn.reference || "REF-" + Date.now(),
              balanceAfter: 0,
            } as Transaction
          })
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        setTransactions(accountTransactions)

        const cacheKey = `transactions_${accountId}`
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            transactions: accountTransactions,
            timestamp: Date.now(),
          }),
        )
      } else {
        setTransactions([])
      }
    } catch (error) {
      setTransactions([])
    } finally {
      setIsLoadingTransactions(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!account || account.status === newStatus) return

    const previousStatus = account.status

    startTransition(async () => {
      try {
        const result = await toggleAccountStatus(accountId, newStatus)

        if (result.success) {
          setAccount((prev) => (prev ? { ...prev, status: newStatus } : null))
        }
      } catch (error) {
        // No console.error or notification for status change error
      }
    })
  }

  if (isLoadingAccount) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-20" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Compte introuvable</h1>
          <p className="text-gray-600 mt-2">Le compte demandé n'existe pas ou n'est pas accessible.</p>
        </div>
        <Button onClick={() => router.push("/accounts/balance")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux comptes
        </Button>
      </div>
    )
  }

  const formatAmount = (amount: number, currency = "GNF") => {
    if (currency === "GNF") {
      return new Intl.NumberFormat("fr-FR").format(Math.abs(amount))
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(Math.abs(amount))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "Courant":
        return <Wallet className="h-6 w-6 text-blue-600" />
      case "Épargne":
        return <PiggyBank className="h-6 w-6 text-green-600" />
      case "Devise":
        return <DollarSign className="h-6 w-6 text-purple-600" />
      default:
        return <CreditCard className="h-6 w-6 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Actif":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Actif</Badge>
      case "Bloqué":
        return <Badge variant="destructive">Bloqué</Badge>
      case "Fermé":
        return <Badge variant="secondary">Fermé</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-8">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 rounded-2xl blur-3xl -z-10" />
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => router.back()} className="bg-white/80 backdrop-blur-sm">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-primary">Détails du Compte</h1>
          <p className="text-muted-foreground">
            {account.name} • {account.number}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Main balance card */}
        <Card className="lg:col-span-2 relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />

          <CardHeader className="relative">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
                  {getAccountIcon(account.type)}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{account.name}</h3>
                  <p className="text-sm text-muted-foreground font-mono">{account.number}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge
                  variant={account.status === "Actif" ? "default" : "secondary"}
                  className={account.status === "Actif" ? "bg-gradient-to-r from-primary to-secondary text-white" : ""}
                >
                  {account.status}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="relative space-y-6">
            {/* Balance display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Solde comptable</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBalance(!showBalance)}
                    className="h-6 w-6 p-0"
                  >
                    {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  {showBalance ? (
                    <>
                      {formatAmount(account.balance, account.currency)} {account.currency}
                    </>
                  ) : (
                    "••••••••"
                  )}
                </div>
              </div>
              <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-secondary/5 to-transparent">
                <p className="text-sm font-medium text-muted-foreground">Solde disponible</p>
                <div className="text-2xl font-bold text-primary">
                  {showBalance ? (
                    <>
                      {formatAmount(account.availableBalance, account.currency)} {account.currency}
                    </>
                  ) : (
                    "••••••••"
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Account details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30">
                  <Building className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Agence</p>
                    <p className="text-sm font-semibold">{account.branch}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30">
                  <Calendar className="h-5 w-5 text-secondary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Date d'ouverture</p>
                    <p className="text-sm font-semibold">{formatDate(account.openingDate)}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30">
                  <CreditCard className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">IBAN</p>
                    <p className="text-sm font-semibold font-mono">{account.iban}</p>
                  </div>
                </div>
                {account.interestRate && (
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30">
                    <TrendingUp className="h-5 w-5 text-secondary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Taux d'intérêt</p>
                      <p className="text-sm font-semibold">{account.interestRate}% par an</p>
                    </div>
                  </div>
                )}
                {account.overdraftLimit && (
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30">
                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Découvert autorisé</p>
                      <p className="text-sm font-semibold">
                        {formatAmount(account.overdraftLimit, account.currency)} {account.currency}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />

          <CardHeader className="relative">
            <CardTitle className="flex items-center">
              <div className="p-2 rounded-lg bg-primary mr-2">
                <Info className="w-5 h-5 text-white" />
              </div>
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent className="relative space-y-6">
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-white/50 backdrop-blur-sm">
                <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Type de compte</p>
                <p className="font-semibold">{account.type}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/50 backdrop-blur-sm">
                <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Devise</p>
                <p className="font-semibold">{account.currency}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/50 backdrop-blur-sm">
                <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Statut</p>
                <Badge
                  variant={account.status === "ACTIF" ? "default" : "secondary"}
                  className={account.status === "ACTIF" ? "bg-primary text-white" : ""}
                >
                  {account.status}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-semibold mb-3">Actions disponibles</p>
              <div className="space-y-2">
                {account.status === "ACTIF" && !!(account.number && String(account.number).trim()) && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start bg-white/50 hover:bg-primary/10 hover:border-primary/50 transition-all"
                      onClick={() => router.push(`/transfers/new?fromAccount=${accountId}`)}
                    >
                      <ArrowUpRight className="w-4 h-4 mr-2" />
                      Effectuer un virement
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start bg-white/50 hover:bg-primary/10 hover:border-primary/50 transition-all"
                      onClick={() => router.push(`/accounts/statements?accountId=${accountId}`)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger relevé
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start bg-white/50 hover:bg-primary/10 hover:border-primary/50 transition-all"
                      onClick={() => router.push(`/accounts/rib?accountId=${accountId}`)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Obtenir RIB
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="relative overflow-hidden border-2 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />

        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">Transactions du compte</CardTitle>
            <Button onClick={handleRefreshTransactions} disabled={isLoadingTransactions} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingTransactions ? "animate-spin" : ""}`} />
              {isLoadingTransactions ? "Actualisation..." : "Actualiser"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="relative">
          {isLoadingTransactions ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-xl bg-white/50">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 inline-block mb-4">
                <FileText className="h-12 w-12 text-primary" />
              </div>
              <p className="text-muted-foreground">Aucune transaction trouvée pour ce compte</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {displayedTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border-2 rounded-xl hover:border-primary/50 hover:shadow-md transition-all duration-300 bg-white/50 backdrop-blur-sm group"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          transaction.amount > 0
                            ? "bg-gradient-to-br from-primary/20 to-secondary/20"
                            : "bg-gradient-to-br from-destructive/20 to-destructive/10"
                        }`}
                      >
                        {transaction.amount > 0 ? (
                          <ArrowDownRight className="w-5 h-5 text-primary" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-destructive" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{transaction.type}</p>
                        <p className="text-sm text-muted-foreground">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.counterparty} • Réf: {transaction.reference}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${transaction.amount > 0 ? "text-primary" : "text-destructive"}`}
                      >
                        {transaction.amount > 0 ? "+" : "-"}
                        {formatAmount(Math.abs(transaction.amount), account?.currency || transaction.currency)}{" "}
                        {account?.currency || transaction.currency}
                      </p>
                      <p className="text-sm text-muted-foreground">{formatDateTime(transaction.date)}</p>
                      <Badge
                        variant={
                          transaction.status === "Exécuté"
                            ? "default"
                            : transaction.status === "En attente"
                              ? "secondary"
                              : "destructive"
                        }
                        className={
                          transaction.status === "Exécuté"
                            ? "bg-gradient-to-r from-primary to-secondary text-white"
                            : ""
                        }
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              {displayLimit < transactions.length && (
                <div className="mt-6 text-center">
                  <Button
                    variant="outline"
                    onClick={() => setDisplayLimit((prev) => prev + 20)}
                    className="bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20"
                  >
                    Afficher plus de transactions ({transactions.length - displayLimit} restantes)
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
