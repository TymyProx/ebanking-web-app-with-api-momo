"use client"

import { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  RefreshCw,
  Wallet,
  PiggyBank,
  DollarSign,
  Eye,
  EyeOff,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { getAccountBalances, refreshBalances } from "./actions"

interface Account {
  id: string
  name: string
  number: string
  balance: number
  availableBalance: number
  currency: string
  type: "Courant" | "Épargne" | "Devise"
  status: "Actif" | "Bloqué" | "Fermé"
  lastUpdate: string
  trend: "up" | "down" | "stable"
  trendPercentage: number
  iban: string
}

export default function BalancesPage() {
  const [showBalance, setShowBalance] = useState(true)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [balanceState, setBalanceState] = useState<any>(null)
  const [refreshState, setRefreshState] = useState<any>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Données des comptes par défaut (simulées)
  const defaultAccounts: Account[] = [
    {
      id: "1",
      name: "Compte Courant",
      number: "0001-234567-89",
      balance: 2400000,
      availableBalance: 2350000,
      currency: "GNF",
      type: "Courant",
      status: "Actif",
      lastUpdate: "13 Jan 2024 14:30",
      trend: "up",
      trendPercentage: 2.5,
      iban: "GN82 BNG 001 0001234567 89",
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
      lastUpdate: "13 Jan 2024 14:30",
      trend: "up",
      trendPercentage: 1.2,
      iban: "GN82 BNG 001 0002345678 90",
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
      lastUpdate: "13 Jan 2024 14:30",
      trend: "stable",
      trendPercentage: 0,
      iban: "GN82 BNG 001 0003456789 01",
    },
  ]

  // Charger les soldes au montage du composant
  useEffect(() => {
    const loadBalances = () => {
      startTransition(async () => {
        try {
          const formData = new FormData()
          const result = await getAccountBalances(null, formData)
          setBalanceState(result)

          if (result.success) {
            // Utiliser les données par défaut pour la simulation
            setAccounts(defaultAccounts)
          } else {
            // En cas d'erreur, utiliser quand même les données par défaut
            setAccounts(defaultAccounts)
          }
          setIsLoaded(true)
        } catch (error) {
          console.error("Erreur lors du chargement des soldes:", error)
          // En cas d'erreur, utiliser les données par défaut
          setAccounts(defaultAccounts)
          setIsLoaded(true)
        }
      })
    }
    loadBalances()
  }, [])

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const formData = new FormData()
        const result = await refreshBalances(null, formData)
        setRefreshState(result)
        setLastRefresh(new Date())

        if (result.success) {
          // Simuler une mise à jour des données
          setAccounts(defaultAccounts)
        }
      } catch (error) {
        console.error("Erreur lors du rafraîchissement:", error)
      }
    })
  }

  const formatAmount = (amount: number, currency = "GNF") => {
    if (currency === "GNF") {
      return new Intl.NumberFormat("fr-FR").format(amount)
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "Courant":
        return <Wallet className="h-5 w-5 text-blue-600" />
      case "Épargne":
        return <PiggyBank className="h-5 w-5 text-green-600" />
      case "Devise":
        return <DollarSign className="h-5 w-5 text-purple-600" />
      default:
        return <Eye className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getTrendIcon = (trend: string, percentage: number) => {
    if (trend === "up") {
      return <TrendingUp className="h-4 w-4 text-green-600" />
    } else if (trend === "down") {
      return <TrendingDown className="h-4 w-4 text-red-600" />
    }
    return <ArrowUpRight className="h-4 w-4 text-gray-400" />
  }

  const getTrendColor = (trend: string) => {
    if (trend === "up") return "text-green-600"
    if (trend === "down") return "text-red-600"
    return "text-gray-500"
  }

  const getTotalBalance = (currency: string) => {
    return accounts
      .filter((account) => account.currency === currency)
      .reduce((total, account) => total + account.balance, 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes comptes</h1>
          <p className="text-gray-600">Vue d'ensemble de tous vos comptes</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleRefresh} disabled={isPending} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? "animate-spin" : ""}`} />
            {isPending ? "Actualisation..." : "Actualiser"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowBalance(!showBalance)}>
            {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Messages de feedback */}
      {balanceState?.success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ✅ Soldes mis à jour avec succès. Dernière actualisation : {lastRefresh.toLocaleTimeString("fr-FR")}
          </AlertDescription>
        </Alert>
      )}

      {balanceState?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>❌ Erreur de connexion. Données non disponibles. Veuillez réessayer.</AlertDescription>
        </Alert>
      )}

      {refreshState?.success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ✅ Soldes actualisés avec succès à {lastRefresh.toLocaleTimeString("fr-FR")}
          </AlertDescription>
        </Alert>
      )}

      {refreshState?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>❌ Impossible d'actualiser les soldes. Vérifiez votre connexion.</AlertDescription>
        </Alert>
      )}

      {!isLoaded ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <Link key={account.id} href={`/accounts/${account.id}`}>
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    {getAccountIcon(account.type)}
                    <CardTitle className="text-sm font-medium">{account.name}</CardTitle>
                  </div>
                  <Badge variant={account.status === "Actif" ? "default" : "secondary"} className="text-xs">
                    {account.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Solde principal */}
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-gray-900">
                        {showBalance
                          ? `${formatAmount(account.balance, account.currency)} ${account.currency}`
                          : "••••••••"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Disponible:{" "}
                        {showBalance
                          ? `${formatAmount(account.availableBalance, account.currency)} ${account.currency}`
                          : "••••••••"}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">{account.number}</p>
                    </div>

                    {/* Évolution */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(account.trend, account.trendPercentage)}
                        <span className={`text-xs font-medium ${getTrendColor(account.trend)}`}>
                          {account.trendPercentage !== 0 && (
                            <>
                              {account.trend === "up" ? "+" : account.trend === "down" ? "-" : ""}
                              {account.trendPercentage}% ce mois
                            </>
                          )}
                          {account.trendPercentage === 0 && "Stable"}
                        </span>
                      </div>
                      <div className="text-xs text-blue-600 font-medium">Voir détails →</div>
                    </div>

                    {/* Informations supplémentaires */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Type:</span>
                        <div className="mt-1">{account.type}</div>
                      </div>
                      <div>
                        <span className="font-medium">Dernière MAJ:</span>
                        <div className="mt-1">{account.lastUpdate}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {isLoaded && accounts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun compte trouvé</h3>
            <p className="text-gray-600 text-center">Aucun compte n'est disponible pour le moment.</p>
          </CardContent>
        </Card>
      )}

      {/* Résumé global */}
      {isLoaded && accounts.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <TrendingUp className="h-5 w-5 mr-2" />
              Résumé global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">{accounts.length}</div>
                <div className="text-sm text-blue-700">Comptes actifs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">
                  {showBalance ? `${formatAmount(getTotalBalance("GNF"))} GNF` : "••••••••"}
                </div>
                <div className="text-sm text-blue-700">Total GNF</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">
                  {showBalance ? formatAmount(getTotalBalance("USD"), "USD") : "••••••••"}
                </div>
                <div className="text-sm text-blue-700">Total USD</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
