"use client"

import type React from "react"

import { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Plus,
} from "lucide-react"
import { createAccount, getAccounts } from "../actions"

interface Account {
  id: string
  name: string
  number: string
  balance: number
  availableBalance: number
  currency: string
  type: "Courant" | "Épargne" | "Devise"
  status: string,//"Actif" | "Bloqué" | "Fermé"
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

  const [isNewAccountDialogOpen, setIsNewAccountDialogOpen] = useState(false)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [createAccountState, setCreateAccountState] = useState<any>(null)

  useEffect(() => {
    const loadBalances = () => {
      startTransition(async () => {
        try {
          const result = await getAccounts()
          console.log("[v0] Résultat de getAccounts:", result)

          if (Array.isArray(result) && result.length > 0) {
            const adaptedAccounts: Account[] = result.map((account: any) => ({
              id: account.id || account.accountId,
              name: account.accountName || account.name || `Compte ${account.accountNumber}`,
              number: account.accountNumber,
              balance: Number.parseFloat(account.bookBalance || account.balance || "0"),
              availableBalance: Number.parseFloat(account.availableBalance || account.balance || "0"),
              currency: account.currency || "GNF",
              type: account.type,
              status: account.status,
              lastUpdate: new Date(account.createdAt || Date.now()).toLocaleDateString("fr-FR"),
              trend: "stable" as const,
              trendPercentage: 0,
              iban: account.accountNumber || "",
            }))

            setAccounts(adaptedAccounts)
            setBalanceState({ success: true, message: "Comptes chargés avec succès" })
          } else {
            setAccounts([])
            setBalanceState({ success: false, error: "Aucun compte trouvé" })
          }
          setIsLoaded(true)
        } catch (error) {
          console.error("Erreur lors du chargement des soldes:", error)
          setAccounts([])
          setBalanceState({ success: false, error: "Erreur lors du chargement" })
          setIsLoaded(true)
        }
      })
    }
    loadBalances()
  }, [])

  useEffect(() => {
    if (createAccountState?.success) {
      const timer = setTimeout(() => {
        setCreateAccountState(null)
      }, 8000) // 8 secondes

      return () => clearTimeout(timer)
    }
  }, [createAccountState?.success])

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const result = await getAccounts()
        setLastRefresh(new Date())

        if (Array.isArray(result) && result.length > 0) {
          const adaptedAccounts: Account[] = result.map((account: any) => ({
            id: account.id || account.accountId,
            name: account.accountName || account.name || `Compte ${account.accountNumber}`,
            number: account.accountNumber,
            balance: Number.parseFloat(account.bookBalance || account.balance || "0"),
            availableBalance: Number.parseFloat(account.availableBalance || account.balance || "0"),
            currency: account.currency || "GNF",
            type: account.type,
            status: account.status,
            lastUpdate: new Date(account.createdAt || Date.now()).toLocaleDateString("fr-FR"),
            trend: "stable" as const,
            trendPercentage: 0,
            iban: account.accountNumber || "",
          }))

          setAccounts(adaptedAccounts)
          setRefreshState({ success: true, message: "Comptes actualisés" })
        } else {
          setRefreshState({ success: false, error: "Aucun compte trouvé" })
        }
      } catch (error) {
        console.error("Erreur lors du rafraîchissement:", error)
        setRefreshState({ success: false, error: "Erreur lors du rafraîchissement" })
      }
    })
  }

  const handleCreateAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsCreatingAccount(true)

    const formData = new FormData(event.currentTarget)
    const form = event.currentTarget

    try {
      const result = await createAccount(null, formData)
      setCreateAccountState(result)

      if (result?.success) {
        const refreshedAccounts = await getAccounts()
        if (Array.isArray(refreshedAccounts)) {
          const adaptedAccounts: Account[] = refreshedAccounts.map((account: any) => ({
            id: account.id || account.accountId,
            name: account.accountName || account.name || `Compte ${account.accountNumber}`,
            number: account.accountNumber,
            balance: Number.parseFloat(account.bookBalance || account.balance || "0"),
            availableBalance: Number.parseFloat(account.availableBalance || account.balance || "0"),
            currency: account.currency || "GNF",
            type: account.type,
            status: account.status,
            lastUpdate: new Date(account.createdAt || Date.now()).toLocaleDateString("fr-FR"),
            trend: "stable" as const,
            trendPercentage: 0,
            iban: account.accountNumber || "",
          }))
          setAccounts(adaptedAccounts)
        }
        if (form) {
          form.reset()
        }
      }
    } catch (error) {
      console.error("Erreur lors de la création du compte:", error)
    } finally {
      setIsCreatingAccount(false)
    }
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
          <Dialog open={isNewAccountDialogOpen} onOpenChange={setIsNewAccountDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Ouvrir un nouveau compte
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Demande d'ouverture de compte</DialogTitle>
                <DialogDescription>
                  Remplissez les informations ci-dessous pour ouvrir un nouveau compte bancaire.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateAccount} className="space-y-4">
                {createAccountState?.success && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Votre demande d'ouverture de compte a été prise en compte
                    </AlertDescription>
                  </Alert>
                )}

                {createAccountState?.error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Erreur lors de la création du compte: {createAccountState.error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountName">Nom du compte</Label>
                    <Input id="accountName" name="accountName" placeholder="Ex: Compte Épargne" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountType">Type de compte</Label>
                    <Select name="accountType" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Courant">Compte Courant</SelectItem>
                        <SelectItem value="Épargne">Compte Épargne</SelectItem>
                        <SelectItem value="Devise">Compte Devise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Devise</Label>
                    <Select name="currency" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner la devise" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GNF">Franc Guinéen (GNF)</SelectItem>
                        <SelectItem value="USD">Dollar US (USD)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="initialDeposit">Dépôt initial (optionnel)</Label>
                    <Input id="initialDeposit" name="initialDeposit" type="number" placeholder="0" min="0" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">Objectif du compte</Label>
                  <Select name="purpose" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner l'objectif" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personnel">Usage personnel</SelectItem>
                      <SelectItem value="professionnel">Usage professionnel</SelectItem>
                      <SelectItem value="epargne">Épargne</SelectItem>
                      <SelectItem value="investissement">Investissement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsNewAccountDialogOpen(false)}
                    disabled={isCreatingAccount}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isCreatingAccount}>
                    {isCreatingAccount ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Création...
                      </>
                    ) : (
                      "Créer le compte"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Button onClick={handleRefresh} disabled={isPending} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? "animate-spin" : ""}`} />
            {isPending ? "Actualisation..." : "Actualiser"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowBalance(!showBalance)}>
            {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

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
          {(accounts || []).map((account) => (
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

      {isLoaded && (accounts?.length === 0 || !accounts) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun compte trouvé</h3>
            <p className="text-gray-600 text-center">Aucun compte n'est disponible pour le moment.</p>
          </CardContent>
        </Card>
      )}

      {isLoaded && accounts && accounts.length > 0 && (
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
