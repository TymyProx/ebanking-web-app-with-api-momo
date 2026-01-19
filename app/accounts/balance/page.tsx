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
import { createAccount, getAccounts } from "../actions"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

interface Account {
  id: string
  name: string
  number: string
  balance: number
  availableBalance: number
  currency: string
  type: "Courant" | "Épargne" | "Devise"
  status: string // "Actif" | "Bloqué" | "Fermé" | "En attente"
  lastUpdate: string
  trend: "up" | "down" | "stable"
  trendPercentage: number
  iban: string
}

export default function BalancesPage() {
  const [showBalance, setShowBalance] = useState(true)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [balanceState, setBalanceState] = useState<any>(null)
  const [refreshState, setRefreshState] = useState<any>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const [statusFilter, setStatusFilter] = useState<string>("ACTIF")

  const [isNewAccountDialogOpen, setIsNewAccountDialogOpen] = useState(false)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [createAccountState, setCreateAccountState] = useState<any>(null)

  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)

  const filterAccountsByStatus = (accountsList: Account[], status: string) => {
    if (status === "ALL") {
      return accountsList
    }
    return accountsList.filter((account) => {
      // Normalize status values for comparison
      const accountStatus = account.status?.toUpperCase()
      if (status === "ACTIF") {
        return accountStatus === "ACTIF" || accountStatus === "ACTIF"
      }
      if (status === "BLOCKED") {
        return accountStatus === "BLOCKED" || accountStatus === "BLOQUÉ"
      }
      if (status === "CLOSED") {
        return accountStatus === "CLOSED" || accountStatus === "FERMÉ"
      }
      if (status === "PENDING") {
        return accountStatus === "PENDING" || accountStatus === "EN ATTENTE"
      }
      return accountStatus === status
    })
  }

  useEffect(() => {
    const loadBalances = () => {
      startTransition(async () => {
        try {
          const result = await getAccounts()
          //console.log("[v0] Résultat de getAccounts:", result)

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
            const filtered = filterAccountsByStatus(adaptedAccounts, statusFilter)
            setFilteredAccounts(filtered)
            setBalanceState({ success: true, message: "Comptes chargés avec succès" })
          } else {
            setAccounts([])
            setFilteredAccounts([])
            setBalanceState({ success: true, message: "Aucun compte disponible" })
          }
          setIsLoaded(true)
        } catch (error) {
          console.error("Erreur lors du chargement des soldes:", error)
          setAccounts([])
          setFilteredAccounts([])
          setBalanceState({ success: false, error: "Erreur de connexion. Données non disponibles." })
          setIsLoaded(true)
        }
      })
    }
    loadBalances()
  }, [])

  useEffect(() => {
    const filtered = filterAccountsByStatus(accounts, statusFilter)
    setFilteredAccounts(filtered)
  }, [accounts, statusFilter])

  useEffect(() => {
    if (createAccountState?.success) {
      const timer = setTimeout(() => {
        setCreateAccountState(null)
      }, 8000) // 8 secondes

      return () => clearTimeout(timer)
    }
  }, [createAccountState?.success])

  useEffect(() => {
    if (refreshState?.success) {
      const timer = setTimeout(() => {
        setRefreshState(null)
      }, 5000) // 5 secondes

      return () => clearTimeout(timer)
    }
  }, [refreshState?.success])

  useEffect(() => {
    if (!api) {
      return
    }

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap())

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])

  useEffect(() => {
    if (!api || !filteredAccounts || filteredAccounts.length <= 1) {
      return
    }

    const autoScroll = setInterval(() => {
      api.scrollNext()
    }, 5000) // Défilement automatique toutes les 5 secondes

    return () => clearInterval(autoScroll)
  }, [api, filteredAccounts])

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
          const filtered = filterAccountsByStatus(adaptedAccounts, statusFilter)
          setFilteredAccounts(filtered)
          setRefreshState({ success: true, message: "Comptes actualisés" })
        } else {
          setRefreshState({ success: true, message: "Aucun compte disponible" })
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
          const filtered = filterAccountsByStatus(adaptedAccounts, statusFilter)
          setFilteredAccounts(filtered)
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
      return new Intl.NumberFormat("fr-FR").format(Math.trunc(amount))
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
    return filteredAccounts
      .filter((account) => account.currency === currency)
      .reduce((total, account) => total + account.balance, 0)
  }

  const getStatusDisplayText = (status: string) => {
    switch (status) {
      case "ALL":
        return "Tous les statuts"
      case "ACTIF":
        return "Actifs"
      case "BLOCKED":
        return "Bloqués"
      case "CLOSED":
        return "Fermés"
      case "PENDING":
        return "En attente"
      default:
        return status
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">Mes Soldes</h1>
        <p className="text-sm text-muted-foreground">Gérez tous vos comptes en un seul endroit</p>
      </div>
      <div className="flex items-center justify-end gap-3">
        {/* <Dialog open={isNewAccountDialogOpen} onOpenChange={setIsNewAccountDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Compte
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            
            <DialogHeader>
              <DialogTitle>Demande d'ouverture de compte</DialogTitle>
              <DialogDescription>
                Remplissez les informations ci-dessous pour la demande d'ouverture d'un nouveau compte bancaire.
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
                    "Envoyer la demande d'ouverture"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-white/80 backdrop-blur-sm">
            <SelectValue placeholder="Filtrer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous</SelectItem>
            <SelectItem value="ACTIF">Actifs</SelectItem>
            <SelectItem value="PENDING">En attente</SelectItem>
          </SelectContent>
        </Select> */}
        <Button
          onClick={handleRefresh}
          disabled={isPending}
          variant="outline"
          size="icon"
          className="bg-white/80 backdrop-blur-sm"
        >
          <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowBalance(!showBalance)}
          className="bg-white/80 backdrop-blur-sm"
        >
          {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>

      {balanceState?.success && (
        <Alert className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 backdrop-blur-sm">
          <CheckCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-foreground">
            Soldes mis à jour • {lastRefresh.toLocaleTimeString("fr-FR")}
          </AlertDescription>
        </Alert>
      )}

      {balanceState?.error && (
        <Alert variant="destructive" className="backdrop-blur-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{balanceState.error}</AlertDescription>
        </Alert>
      )}

      {refreshState?.success && (
        <Alert className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 backdrop-blur-sm">
          <CheckCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-foreground">
            Actualisé à {lastRefresh.toLocaleTimeString("fr-FR")}
          </AlertDescription>
        </Alert>
      )}

      {refreshState?.error && (
        <Alert variant="destructive" className="backdrop-blur-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Impossible d'actualiser les soldes</AlertDescription>
        </Alert>
      )}

      {!isLoaded ? (
        <div className="max-w-2xl mx-auto">
          <Card className="overflow-hidden">
            <CardHeader className="space-y-0 pb-1">
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
        </div>
      ) : (
        <div className="w-full px-2">
          <Carousel
            setApi={setApi}
            className="w-full"
            opts={{
              align: "center",
              loop: true,
              skipSnaps: false,
              dragFree: false,
            }}
          >
            <CarouselContent className="w-full">
              {(filteredAccounts || []).map((account) => (
                <CarouselItem key={account.id} className="pl-2 basis-full">
                  <Link href={`/accounts/${account.id}`} className="block">
                    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-white via-white to-gray-50/80 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/80">
                      {/* Animated gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      {/* Decorative elements */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 -translate-y-1/2 translate-x-1/2" />
                      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-secondary/10 to-primary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 translate-y-1/2 -translate-x-1/2" />

                      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-4 pt-6 px-6">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative p-3 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 group-hover:from-primary/20 group-hover:via-primary/10 group-hover:to-secondary/20 transition-all duration-300 shadow-sm group-hover:shadow-md">
                              {getAccountIcon(account.type)}
                            </div>
                          </div>
                          <div>
                            <CardTitle className="text-base font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                              {account.name}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{account.number}</p>
                          </div>
                        </div>
                        <Badge
                          variant={account.status === "Actif" ? "default" : "secondary"}
                          className={`shadow-sm ${
                            account.status === "Actif"
                              ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 hover:from-green-600 hover:to-emerald-700"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {account.status}
                        </Badge>
                      </CardHeader>

                      <CardContent className="relative space-y-6 px-6 pb-6">
                        {/* Main balance display */}
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Solde disponible
                            </p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-primary group-hover:via-primary group-hover:to-secondary transition-all duration-500">
                                {showBalance
                                  ? formatAmount(account.availableBalance, account.currency)
                                  : "••••••••"}
                              </span>
                              {showBalance && (
                                <span className="text-lg font-semibold text-muted-foreground">
                                  {account.currency}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-border/50">
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">Solde comptable</p>
                              <p className="text-sm font-semibold text-muted-foreground">
                                {showBalance
                                  ? `${formatAmount(account.balance, account.currency)} ${account.currency}`
                                  : "••••••••"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Bottom info grid */}
                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
                          <div className="space-y-1">
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                              Type
                            </p>
                            <div className="text-sm font-semibold text-foreground">{account.type}</div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                              Dernière MAJ
                            </p>
                            <div className="text-sm font-semibold text-foreground">{account.lastUpdate}</div>
                          </div>
                          <div className="flex items-end justify-end">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 text-primary group-hover:text-secondary transition-all duration-300 cursor-pointer">
                              <span className="text-xs font-semibold">Détails</span>
                              <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {filteredAccounts && filteredAccounts.length > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {filteredAccounts.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={cn(
                    "h-3 rounded-full transition-all duration-300 cursor-pointer",
                    "hover:scale-110 hover:opacity-100",
                    index === current
                      ? "w-10 bg-gradient-to-r from-primary to-secondary shadow-lg"
                      : "w-3 bg-muted-foreground/30 hover:bg-muted-foreground/50",
                  )}
                  onClick={() => {
                    api?.scrollTo(index)
                  }}
                  aria-label={`Aller au compte ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {isLoaded && (filteredAccounts?.length === 0 || !filteredAccounts) && (
        <Card className="border-2 border-dashed border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 mb-4">
              <Wallet className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {statusFilter === "ALL"
                ? "Aucun compte trouvé"
                : `Aucun compte ${getStatusDisplayText(statusFilter).toLowerCase()}`}
            </h3>
            <p className="text-muted-foreground text-center max-w-sm">
              {statusFilter === "ALL"
                ? "Commencez par créer votre premier compte bancaire"
                : `Aucun compte avec le statut "${getStatusDisplayText(statusFilter).toLowerCase()}"`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
