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
import { normalizeAccountStatus } from "@/lib/status-utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { isAccountActive } from "@/lib/status-utils"

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

  const [current, setCurrent] = useState(0)
  const [isFading, setIsFading] = useState(false)

  const filterAccountsByStatus = (accountsList: Account[], status: string) => {
    if (status === "ALL") {
      return accountsList
    }
    return accountsList.filter((account) => {
      // Utiliser la fonction de normalisation pour comparer les statuts
      const normalizedAccountStatus = normalizeAccountStatus(account.status)
      const normalizedFilterStatus = normalizeAccountStatus(status)
      return normalizedAccountStatus === normalizedFilterStatus
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

  // Filtrer uniquement les comptes actifs
  const activeFilteredAccounts = filteredAccounts.filter((account) => isAccountActive(account.status))
  const count = activeFilteredAccounts.length

  useEffect(() => {
    if (count <= 1) return

    // Auto-play: change slide every 5 seconds with fade effect
    const autoplay = setInterval(() => {
      setIsFading(true)
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % count)
        setIsFading(false)
      }, 300) // Half of transition duration
    }, 5000)

    return () => clearInterval(autoplay)
  }, [count])

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
      case "CURRENT":
      case "Courant":
        return <Wallet className="h-5 w-5 text-primary" />
      case "SAVINGS":
      case "Épargne":
        return <PiggyBank className="h-5 w-5 text-secondary" />
      case "Devise":
        return <DollarSign className="h-5 w-5 text-accent" />
      default:
        return <Eye className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getAccountTypeDisplay = (type: string) => {
    switch (type) {
      case "CURRENT":
        return "Courant"
      case "SAVINGS":
        return "Épargne"
      default:
        return type
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
      ) : activeFilteredAccounts.length > 0 ? (
        <div className="w-full">
          <Card className="border-0 shadow-none bg-transparent">
            <CardContent className="p-0">
              <div className="relative w-full">
                {activeFilteredAccounts[current] && (
                  <Link href={`/accounts/${activeFilteredAccounts[current].id}`}>
                    <Card
                      className="card-hover border-0 shadow-md bg-gradient-to-br from-primary/10 via-background to-secondary/10 backdrop-blur-sm transition-opacity duration-500 ease-in-out"
                      style={{ opacity: isFading ? 0 : 1 }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between gap-4">
                          {/* Left section: Account info and type */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="p-3 rounded-lg bg-primary/10">
                                {getAccountIcon(activeFilteredAccounts[current].type)}
                              </div>
                              <div>
                                <CardTitle className="text-lg font-heading font-semibold mb-0.5">
                                  {activeFilteredAccounts[current].name}
                                </CardTitle>
                                <Badge
                                  variant="secondary"
                                  className="bg-secondary/20 text-secondary-foreground border-secondary/30 text-xs"
                                >
                                  {getAccountTypeDisplay(activeFilteredAccounts[current].type)}
                                </Badge>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Numéro de compte</p>
                              <p className="text-sm font-mono font-semibold bg-muted/50 px-4 py-2 rounded-md inline-block">
                                {activeFilteredAccounts[current].number}
                              </p>
                            </div>
                          </div>

                          {/* Right section: Balances */}
                          <div className="flex-1 space-y-3 text-right">
                            <div className="flex items-center justify-end gap-2 mb-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setShowBalance(!showBalance)
                                      }}
                                      className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                                      aria-label={showBalance ? "Masquer les soldes" : "Afficher les soldes"}
                                    >
                                      {showBalance ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                      ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="left">
                                    <p>{showBalance ? "Masquer le solde" : "Voir le solde"}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Solde disponible</p>
                              <div className="text-3xl font-heading font-bold text-foreground">
                                {showBalance
                                  ? formatAmount(
                                      activeFilteredAccounts[current].availableBalance,
                                      activeFilteredAccounts[current].currency,
                                    )
                                  : "••••••••"}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {showBalance ? activeFilteredAccounts[current].currency : "•••"}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-border/50">
                              <p className="text-xs text-muted-foreground mb-1">Solde comptable</p>
                              <div className="text-xl font-heading font-semibold text-muted-foreground">
                                {showBalance
                                  ? `${formatAmount(
                                      activeFilteredAccounts[current].balance,
                                      activeFilteredAccounts[current].currency,
                                    )} ${activeFilteredAccounts[current].currency}`
                                  : "••••••••"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )}
              </div>

              {/* Dots indicator */}
              {count > 1 && (
                <div className="flex justify-center gap-2 mt-2">
                  {Array.from({ length: count }).map((_, index) => (
                    <button
                      key={index}
                      className={`h-2 rounded-full transition-all ${
                        index === current ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"
                      }`}
                      onClick={() => {
                        setIsFading(true)
                        setTimeout(() => {
                          setCurrent(index)
                          setIsFading(false)
                        }, 300)
                      }}
                      aria-label={`Aller au compte ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-2 border-dashed border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-muted/50 mb-4">
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-heading font-semibold mb-2">Aucun compte</h3>
            <p className="text-muted-foreground text-center">Aucun compte n'est disponible pour le moment.</p>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
