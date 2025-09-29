"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, useTransition } from "react"
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
import { getTransactions } from "../../transfers/new/actions"
import { toggleAccountStatus } from "./actions"
import { useNotifications } from "@/contexts/notification-context"

interface Account {
  id: string
  name: string
  number: string
  balance: number
  availableBalance: number
  currency: string
  type: string //"Courant" | "Épargne" | "Devise"
  status: string //"Actif" | "Bloqué" | "Fermé"
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
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoadingAccount, setIsLoadingAccount] = useState(true)
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
  const [isPending, startTransition] = useTransition()
  const { addNotification } = useNotifications()

  useEffect(() => {
    const loadAccount = async () => {
      try {
        const accountsData = await getAccounts()
        //console.log("[v0] Comptes récupérés:", accountsData)

        if (Array.isArray(accountsData)) {
          const foundAccount = accountsData.find((acc: any) => acc.id === accountId || acc.accountId === accountId)

          if (foundAccount) {
            const adaptedAccount: Account = {
              id: foundAccount.id || foundAccount.accountId,
              name: foundAccount.accountName || foundAccount.name || `Compte ${foundAccount.accountNumber}`,
              number: foundAccount.accountNumber,
              balance: Number.parseFloat(foundAccount.bookBalance || foundAccount.balance || "0"),
              availableBalance: Number.parseFloat(foundAccount.availableBalance || foundAccount.balance || "0"),
              currency: foundAccount.currency || "GNF",
              type: foundAccount.type, //"Courant" as const,
              status: foundAccount.status, //|| "Actif" as const,
              iban: `GN82BNG001${foundAccount.accountNumber}`,
              openingDate: foundAccount.createdAt || "2020-01-01",
              branch: "Agence Kaloum",
              overdraftLimit: foundAccount.currency === "GNF" ? 500000 : undefined,
            }
            setAccount(adaptedAccount)
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement du compte:", error)
      } finally {
        setIsLoadingAccount(false)
      }
    }

    loadAccount()
  }, [accountId])

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const transactionsData = await getTransactions()

        if (transactionsData.data && Array.isArray(transactionsData.data)) {
          // Filtrer les transactions pour ce compte spécifique
          const accountTransactions = transactionsData.data
            .filter((txn: any) => txn.accountId === accountId)
            .map((txn: any) => {
              const amount = Number.parseFloat(txn.amount || "0")
              const isCredit = txn.txnType === "CREDIT"
              const isDebit = txn.txnType === "DEBIT"

              let displayStatus: "Exécuté" | "En attente" | "Rejeté"
              if (txn.status === "COMPLETED") {
                displayStatus = "Exécuté"
              } else if (txn.status === "PENDING") {
                displayStatus = "En attente"
              } else {
                displayStatus = "Rejeté"
              }

              return {
                id: txn.txnId || txn.id,
                accountId: txn.accountId,
                type: isCredit ? "Virement reçu" : "Virement émis",
                description: txn.description || "Transaction",
                amount: isCredit ? Math.abs(amount) : -Math.abs(amount),
                currency: account?.currency || "GNF",
                date: txn.valueDate || new Date().toISOString(),
                status: displayStatus,
                counterparty: txn.beneficiaryId || "Système",
                reference: txn.txnId || "REF-" + Date.now(),
                balanceAfter: 0, // Calculé dynamiquement si nécessaire
              } as Transaction
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Trier par date décroissante

          setTransactions(accountTransactions)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des transactions:", error)
      } finally {
        setIsLoadingTransactions(false)
      }
    }

    if (account) {
      loadTransactions()
    }
  }, [accountId, account])

  const handleRefreshTransactions = async () => {
    setIsLoadingTransactions(true)
    try {
      const transactionsData = await getTransactions()
      if (transactionsData.data && Array.isArray(transactionsData.data)) {
        const accountTransactions = transactionsData.data
          .filter((txn: any) => txn.accountId === accountId)
          .map((txn: any) => {
            const amount = Number.parseFloat(txn.amount || "0")
            const isCredit = txn.txnType === "CREDIT"

            let displayStatus: "Exécuté" | "En attente" | "Rejeté"
            if (txn.status === "COMPLETED") {
              displayStatus = "Exécuté"
            } else if (txn.status === "PENDING") {
              displayStatus = "En attente"
            } else {
              displayStatus = "Rejeté"
            }

            return {
              id: txn.txnId || txn.id,
              accountId: txn.accountId,
              type: isCredit ? "Virement reçu" : "Virement émis",
              description: txn.description || "Transaction",
              amount: isCredit ? Math.abs(amount) : -Math.abs(amount),
              currency: account?.currency || "GNF",
              date: txn.valueDate || new Date().toISOString(),
              status: displayStatus,
              counterparty: txn.beneficiaryId || "Système",
              reference: txn.txnId || "REF-" + Date.now(),
              balanceAfter: 0,
            } as Transaction
          })
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        setTransactions(accountTransactions)
      }
    } catch (error) {
      console.error("Erreur lors du rechargement des transactions:", error)
    } finally {
      setIsLoadingTransactions(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!account || account.status === newStatus) return

    const previousStatus = account.status

    startTransition(async () => {
      try {
        //console.log("[v0] Changement de statut:", { accountId, previousStatus, newStatus })

        const result = await toggleAccountStatus(accountId, newStatus)

        if (result.success) {
          // Update local account state
          setAccount((prev) => (prev ? { ...prev, status: newStatus } : null))

          // Add notification to the context
          // addNotification({
          //   type: "account_status",
          //   title: "Changement de statut de compte",
          //   message: `Le statut de votre compte ${account.name} (${account.number}) a été modifié de "${previousStatus}" vers "${newStatus}".`,
          //   timestamp: new Date(),
          //   isRead: false,
          // })

          //console.log("[v0] Statut mis à jour avec succès")
        }
      } catch (error) {
        //console.error("[v0] Erreur lors du changement de statut:", error)
        // addNotification({
        //   type: "error",
        //   title: "Erreur",
        //   message: "Impossible de modifier le statut du compte. Veuillez réessayer.",
        //   timestamp: new Date(),
        //   isRead: false,
        // })
      }
    })
  }

  const hasPendingTransactions = transactions.some((transaction) => transaction.status === "En attente")

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
    <div className="space-y-6">
      {/* En-tête avec navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Détails du compte</h1>
            <p className="text-gray-600">
              {account.name} • {account.number}
            </p>
          </div>
        </div>
      </div>

      {/* Informations principales du compte */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Soldes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getAccountIcon(account.type)}
                <div>
                  <h3 className="text-lg font-semibold">{account.name}</h3>
                  <p className="text-sm text-gray-500 font-mono">{account.number}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">{getStatusBadge(account.status)}</div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Soldes avec option masquer/afficher */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600">Solde comptable</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBalance(!showBalance)}
                    className="h-6 w-6 p-0"
                  >
                    {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {showBalance ? (
                    <>
                      {formatAmount(account.balance, account.currency)} {account.currency}
                    </>
                  ) : (
                    "••••••••"
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Solde disponible</p>
                <div className="text-2xl font-semibold text-green-600">
                  {showBalance ? (
                    <>
                      {hasPendingTransactions && <span className="text-orange-500 mr-1">*</span>}
                      {formatAmount(account.availableBalance, account.currency)} {account.currency}
                    </>
                  ) : (
                    "••••••••"
                  )}
                </div>
                {hasPendingTransactions && showBalance && (
                  <p className="text-xs text-orange-600">* Transactions en attente affectant le solde</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Informations détaillées */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Agence</p>
                    <p className="text-sm font-medium">{account.branch}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Date d'ouverture</p>
                    <p className="text-sm font-medium">{formatDate(account.openingDate)}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">IBAN</p>
                    <p className="text-sm font-medium font-mono">{account.iban}</p>
                  </div>
                </div>
                {account.interestRate && (
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Taux d'intérêt</p>
                      <p className="text-sm font-medium">{account.interestRate}% par an</p>
                    </div>
                  </div>
                )}
                {account.overdraftLimit && (
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Découvert autorisé</p>
                      <p className="text-sm font-medium">
                        {formatAmount(account.overdraftLimit, account.currency)} {account.currency}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations complémentaires */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="w-5 h-5 mr-2" />
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase">Type de compte</p>
                <p className="font-medium">{account.type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Devise</p>
                <p className="font-medium">{account.currency}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Statut</p>
                {getStatusBadge(account.status)}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium">Actions disponibles</p>
              <div className="space-y-2">
                {account.status === "ACTIF" && !!(account.number && String(account.number).trim()) && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start bg-transparent"
                      onClick={() => router.push(`/transfers/new?fromAccount=${accountId}`)}
                    >
                      <ArrowUpRight className="w-4 h-4 mr-2" />
                      Effectuer un virement
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start bg-transparent"
                      onClick={() => router.push(`/accounts/statements?accountId=${accountId}`)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger relevé
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start bg-transparent"
                      onClick={() => router.push(`/services/rib?accountId=${accountId}`)}
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

      {/* Historique des transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transactions du compte</CardTitle>
            <Button onClick={handleRefreshTransactions} disabled={isLoadingTransactions} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingTransactions ? "animate-spin" : ""}`} />
              {isLoadingTransactions ? "Actualisation..." : "Actualiser"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingTransactions ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
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
            <div className="text-center py-8">
              <p className="text-gray-500">Aucune transaction trouvée pour ce compte</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      {transaction.amount > 0 ? (
                        <ArrowDownRight className="w-5 h-5 text-green-600" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.type}</p>
                      <p className="text-sm text-gray-600">{transaction.description}</p>
                      <p className="text-xs text-gray-500">
                        {transaction.counterparty} • Réf: {transaction.reference}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-semibold ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {transaction.status === "En attente" && <span className="text-orange-500">*</span>}
                      {transaction.amount > 0 ? "+" : "-"}
                      {formatAmount(Math.abs(transaction.amount), account?.currency || transaction.currency)}{" "}
                      {account?.currency || transaction.currency}
                    </p>
                    <p className="text-sm text-gray-500">{formatDateTime(transaction.date)}</p>
                    <Badge
                      variant={
                        transaction.status === "Exécuté"
                          ? "default"
                          : transaction.status === "En attente"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
