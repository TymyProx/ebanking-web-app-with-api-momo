"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Wallet, PiggyBank, DollarSign, Eye, EyeOff } from "lucide-react"
import { getAccountStatusBadge, isAccountActive, isAccountPending } from "@/lib/status-utils"
// Utiliser les variables d'environnement directement côté client
const getApiBaseUrl = (): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://35.184.98.9:4000"
  const normalize = (u?: string) => (u ? u.replace(/\/$/, "") : "")
  const cleanBaseUrl = normalize(apiUrl).replace(/\/api$/, "")
  return `${cleanBaseUrl}/api`
}

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || "aa1287f6-06af-45b7-a905-8c57363565c2"

interface Account {
  id: string
  accountName: string
  accountNumber: string
  type: string
  currency: string
  availableBalance: number | string
  bookBalance: number | string
  status: string
}

interface AccountsCarouselProps {
  accounts?: Account[] // Optionnel maintenant car on charge côté client
}

export function AccountsCarousel({ accounts: initialAccounts = [] }: AccountsCarouselProps) {
  const [current, setCurrent] = useState(0)
  const [showBalances, setShowBalances] = useState(false)
  const [isFading, setIsFading] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts)
  const [isLoading, setIsLoading] = useState(false)
  const [hasTriedFetch, setHasTriedFetch] = useState(false)

  // Fonction pour charger les comptes depuis l'API
  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoading(true)
      setHasTriedFetch(true)
      
      // Récupérer le token depuis localStorage (priorité) ou cookies (fallback)
      let token: string | null = null
      if (typeof window !== "undefined") {
        token = localStorage.getItem("token")
        if (!token) {
          // Fallback sur les cookies
          token = document.cookie
            .split("; ")
            .find((row) => row.startsWith("token="))
            ?.split("=")[1] || null
        }
      }

      if (!token) {
        console.warn("[AccountsCarousel] Aucun token trouvé, utilisation des comptes initiaux")
        // Garder les comptes initiaux si disponibles
        if (initialAccounts.length > 0) {
          console.log(`[AccountsCarousel] Utilisation de ${initialAccounts.length} comptes initiaux`)
          setAccounts(initialAccounts)
        } else {
          setAccounts([])
        }
        return
      }

      const API_BASE_URL = getApiBaseUrl()
      console.log("[AccountsCarousel] Chargement des comptes depuis:", `${API_BASE_URL}/tenant/${TENANT_ID}/compte`)

      // Récupérer l'ID de l'utilisateur
      let currentUserId: string | null = null
      try {
        const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (userResponse.ok) {
          const userData = await userResponse.json()
          currentUserId = userData.id
          console.log("[AccountsCarousel] User ID récupéré:", currentUserId)
        } else {
          console.warn("[AccountsCarousel] Erreur lors de la récupération de l'utilisateur:", userResponse.status)
        }
      } catch (error) {
        console.error("[AccountsCarousel] Erreur lors de la récupération de l'utilisateur:", error)
      }

      // Récupérer les comptes
      const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/compte`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[AccountsCarousel] Erreur API:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        // En cas d'erreur, garder les comptes initiaux si disponibles
        if (initialAccounts.length > 0) {
          setAccounts(initialAccounts)
        } else {
          setAccounts([])
        }
        return
      }

      const responseData = await response.json()
      console.log("[AccountsCarousel] Données reçues:", responseData)

      let fetchedAccounts: Account[] = []

      if (responseData.rows && Array.isArray(responseData.rows)) {
        fetchedAccounts = responseData.rows
      } else if (responseData.data) {
        if (Array.isArray(responseData.data)) {
          fetchedAccounts = responseData.data
        } else if (typeof responseData.data === "object") {
          fetchedAccounts = [responseData.data]
        }
      } else if (Array.isArray(responseData)) {
        fetchedAccounts = responseData
      }

      console.log("[AccountsCarousel] Comptes bruts récupérés:", fetchedAccounts.length)

      // Filtrer par clientId si disponible
      if (currentUserId) {
        const beforeFilter = fetchedAccounts.length
        fetchedAccounts = fetchedAccounts.filter((account: any) => account.clientId === currentUserId)
        console.log(`[AccountsCarousel] Filtrage par clientId: ${beforeFilter} -> ${fetchedAccounts.length}`)
      }

      // Adapter les données au format attendu
      const adaptedAccounts: Account[] = fetchedAccounts.map((account: any) => ({
        id: account.id || account.accountId,
        accountName: account.accountName || account.name || `Compte ${account.accountNumber || ""}`,
        accountNumber: account.accountNumber || account.number || "",
        type: account.type || "",
        currency: account.currency || "GNF",
        availableBalance: account.availableBalance || 0,
        bookBalance: account.bookBalance || 0,
        status: account.status || "",
      }))

      console.log("[AccountsCarousel] Comptes adaptés:", adaptedAccounts.length)
      
      // Utiliser les comptes récupérés seulement s'il y en a, sinon garder les initiaux
      if (adaptedAccounts.length > 0) {
        setAccounts(adaptedAccounts)
      } else if (initialAccounts.length > 0) {
        console.log("[AccountsCarousel] Aucun compte récupéré, utilisation des comptes initiaux")
        setAccounts(initialAccounts)
      } else {
        setAccounts([])
      }
    } catch (error) {
      console.error("[AccountsCarousel] Erreur lors du chargement des comptes:", error)
      // En cas d'erreur, garder les comptes initiaux si disponibles
      if (initialAccounts.length > 0) {
        console.log(`[AccountsCarousel] Erreur, utilisation de ${initialAccounts.length} comptes initiaux`)
        setAccounts(initialAccounts)
      } else {
        setAccounts([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [initialAccounts])

  // Charger les comptes au montage et toutes les 30 secondes
  useEffect(() => {
    fetchAccounts()

    // Rafraîchir automatiquement toutes les 30 secondes
    const interval = setInterval(() => {
      fetchAccounts()
    }, 30000) // 30 secondes

    return () => clearInterval(interval)
  }, [fetchAccounts])

  // Filtrer uniquement les comptes actifs avec la fonction normalisée
  const activeAccounts = accounts.filter((account) => {
    const isActive = isAccountActive(account.status)
    if (!isActive) {
      console.log(`[AccountsCarousel] Compte filtré (non actif):`, {
        id: account.id,
        name: account.accountName,
        status: account.status,
        normalized: account.status,
      })
    }
    return isActive
  })

  const pendingAccounts = accounts.filter((account) => isAccountPending(account.status))
  const count = activeAccounts.length
  
  console.log(`[AccountsCarousel] Comptes actifs: ${count} sur ${accounts.length} total`)

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

  const formatAmount = (amount: number | string, currency = "GNF") => {
    const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
    if (currency === "GNF") {
      return new Intl.NumberFormat("fr-FR").format(Math.trunc(numAmount))
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(numAmount)
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

  const getAccountTrend = () => {
    return "+2.5%" // Placeholder - could be calculated from transaction history
  }

  if (isLoading && activeAccounts.length === 0 && accounts.length === 0) {
    return (
      <Card className="border-0 shadow-none bg-transparent">
        <CardContent className="p-0">
          <div className="h-48 bg-gradient-to-br from-muted to-muted/50 rounded-xl animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  if (activeAccounts.length === 0) {
    // Afficher un message plus informatif si on a des comptes mais qu'ils ne sont pas actifs
    if (accounts.length > 0) {
      console.warn(
        `[AccountsCarousel] ${accounts.length} comptes trouvés mais aucun n'est actif. Statuts:`,
        accounts.map((a) => ({ name: a.accountName, status: a.status })),
      )
    }
    return (
      <Card className="border-dashed border-2 border-muted">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="p-4 rounded-full bg-muted/50 mb-4">
            <Wallet className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-heading font-semibold mb-2">Aucun compte disponible</h3>
          <p className="text-muted-foreground text-center">
            {pendingAccounts.length > 0
              ? `${pendingAccounts.length} demande(s) en attente de validation.`
              : accounts.length > 0
                ? `${accounts.length} compte(s) trouvé(s) mais aucun n'est actif.`
              : "Aucun compte n'est disponible pour le moment."}
          </p>
          {pendingAccounts.length > 0 && (
            <div className="mt-4 w-full max-w-md space-y-2">
              {pendingAccounts.slice(0, 3).map((a) => {
                const s = getAccountStatusBadge(a.status)
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border bg-white/50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{a.accountName}</div>
                      <div className="truncate text-xs text-muted-foreground font-mono">{a.accountNumber}</div>
                    </div>
                    <Badge variant={s.variant} className={`${s.className} text-xs`}>
                      {s.label}
                    </Badge>
                  </div>
                )
              })}
              {pendingAccounts.length > 3 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{pendingAccounts.length - 3} autre(s) demande(s)
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const currentAccount = activeAccounts[current]

  if (!currentAccount) {
    return (
      <Card className="border-dashed border-2 border-muted">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="p-4 rounded-full bg-muted/50 mb-4">
            <Wallet className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-heading font-semibold mb-2">Aucun compte</h3>
          <p className="text-muted-foreground text-center">Aucun compte n'est disponible pour le moment.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardContent className="p-0">
        <div className="relative w-full">
          <Link href={`/accounts/${currentAccount.id}`}>
            <Card
              className="card-hover border-0 shadow-md bg-gradient-to-br from-primary/10 via-background to-secondary/10 backdrop-blur-sm transition-opacity duration-500 ease-in-out"
              style={{ opacity: isFading ? 0 : 1 }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  {/* Left section: Account info and type */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-3 rounded-lg bg-primary/10">{getAccountIcon(currentAccount.type)}</div>
                      <div>
                        <CardTitle className="text-lg font-heading font-semibold mb-0.5">
                          {currentAccount.accountName}
                        </CardTitle>
                        <Badge
                          variant="secondary"
                          className="bg-secondary/20 text-secondary-foreground border-secondary/30 text-xs"
                        >
                          {getAccountTypeDisplay(currentAccount.type)}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Numéro de compte</p>
                      <p className="text-sm font-mono font-semibold bg-muted/50 px-4 py-2 rounded-md inline-block">
                        {currentAccount.accountNumber}
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
                                setShowBalances(!showBalances)
                              }}
                              className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                              aria-label={showBalances ? "Masquer les soldes" : "Afficher les soldes"}
                            >
                              {showBalances ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p>{showBalances ? "Masquer le solde" : "Voir le solde"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Solde disponible</p>
                      <div className="text-3xl font-heading font-bold text-foreground">
                        {showBalances
                          ? formatAmount(currentAccount.availableBalance, currentAccount.currency)
                          : "••••••••"}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {showBalances ? currentAccount.currency : "•••"}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">Solde comptable</p>
                      <div className="text-xl font-heading font-semibold text-muted-foreground">
                        {showBalances
                          ? `${formatAmount(currentAccount.bookBalance, currentAccount.currency)} ${currentAccount.currency}`
                          : "••••••••"}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
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

        {pendingAccounts.length > 0 && (
          <div className="mt-3 text-center text-xs text-muted-foreground">
            {pendingAccounts.length} demande(s) en attente de validation
          </div>
        )}
      </CardContent>
    </Card>
  )
}
