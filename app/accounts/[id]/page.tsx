"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
} from "lucide-react"

interface Account {
  id: string
  name: string
  number: string
  balance: number
  availableBalance: number
  currency: string
  type: "Courant" | "Épargne" | "Devise"
  status: "Actif" | "Bloqué" | "Fermé"
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

  // Données des comptes (simulées)
  const accountsData: Account[] = [
    {
      id: "1",
      name: "Compte Courant",
      number: "0001-234567-89",
      balance: 2400000,
      availableBalance: 2350000,
      currency: "GNF",
      type: "Courant",
      status: "Actif",
      iban: "GN82 BNG 001 0001234567 89",
      openingDate: "2020-03-15",
      branch: "Agence Kaloum",
      overdraftLimit: 500000,
    },
    {
      id: "2",
      name: "Compte Épargne",
      number: "0002-345678-90",
      balance: 850000,
      availableBalance: 850000,
      currency: "GNF",
      type: "Épargne",
      status: "Actif",
      iban: "GN82 BNG 001 0002345678 90",
      openingDate: "2021-06-10",
      branch: "Agence Kaloum",
      interestRate: 3.5,
    },
    {
      id: "3",
      name: "Compte USD",
      number: "0003-456789-01",
      balance: 1250,
      availableBalance: 1250,
      currency: "USD",
      type: "Devise",
      status: "Actif",
      iban: "GN82 BNG 001 0003456789 01",
      openingDate: "2022-01-20",
      branch: "Agence Kaloum",
    },
  ]

  // Données des transactions (simulées)
  const transactionsData: Transaction[] = [
    {
      id: "1",
      accountId: "1",
      type: "Virement reçu",
      description: "Salaire mensuel",
      amount: 1500000,
      currency: "GNF",
      date: "2024-01-15T10:30:00",
      status: "Exécuté",
      counterparty: "Entreprise ABC SARL",
      reference: "SAL-2024-001",
      balanceAfter: 2400000,
    },
    {
      id: "2",
      accountId: "1",
      type: "Paiement facture",
      description: "Facture électricité",
      amount: -45000,
      currency: "GNF",
      date: "2024-01-12T14:15:00",
      status: "Exécuté",
      counterparty: "EDG - Électricité de Guinée",
      reference: "ELEC-2024-001",
      balanceAfter: 900000,
    },
    {
      id: "3",
      accountId: "1",
      type: "Virement émis",
      description: "Virement vers Mamadou Sow",
      amount: -250000,
      currency: "GNF",
      date: "2024-01-10T09:45:00",
      status: "Exécuté",
      counterparty: "DIALLO Mamadou",
      reference: "VIR-2024-003",
      balanceAfter: 945000,
    },
    {
      id: "4",
      accountId: "1",
      type: "Retrait DAB",
      description: "Retrait distributeur Kaloum",
      amount: -50000,
      currency: "GNF",
      date: "2024-01-08T16:20:00",
      status: "Exécuté",
      counterparty: "DAB BNG Kaloum",
      reference: "DAB-2024-012",
      balanceAfter: 1195000,
    },
    {
      id: "5",
      accountId: "2",
      type: "Virement reçu",
      description: "Épargne mensuelle",
      amount: 200000,
      currency: "GNF",
      date: "2024-01-01T08:00:00",
      status: "Exécuté",
      counterparty: "Virement automatique",
      reference: "EPA-2024-001",
      balanceAfter: 850000,
    },
  ]

  const account = accountsData.find((acc) => acc.id === accountId)
  const accountTransactions = transactionsData.filter((txn) => txn.accountId === accountId)

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Compte introuvable</h1>
          <p className="text-gray-600 mt-2">Le compte demandé n'existe pas ou n'est pas accessible.</p>
        </div>
        <Button onClick={() => router.push("/")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au tableau de bord
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
              {getStatusBadge(account.status)}
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
                      {formatAmount(account.availableBalance, account.currency)} {account.currency}
                    </>
                  ) : (
                    "••••••••"
                  )}
                </div>
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
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historique des transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Dernières transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {accountTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucune transaction récente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {accountTransactions.map((transaction) => (
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
                      {transaction.amount > 0 ? "+" : ""}
                      {formatAmount(transaction.amount, transaction.currency)} {transaction.currency}
                    </p>
                    <p className="text-sm text-gray-500">{formatDateTime(transaction.date)}</p>
                    <p className="text-xs text-gray-400">
                      Solde: {formatAmount(transaction.balanceAfter, transaction.currency)} {transaction.currency}
                    </p>
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
