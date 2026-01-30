"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Wallet, PiggyBank, DollarSign, Eye, EyeOff } from "lucide-react"
import { isAccountActive } from "@/lib/status-utils"

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
  accounts: Account[]
}

export function AccountsCarousel({ accounts }: AccountsCarouselProps) {
  const [current, setCurrent] = useState(0)
  const [showBalances, setShowBalances] = useState(false)
  const [isFading, setIsFading] = useState(false)

  // Filtrer uniquement les comptes actifs avec la fonction normalisée
  const activeAccounts = accounts.filter((account) => isAccountActive(account.status))
  const count = activeAccounts.length

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

  if (activeAccounts.length === 0) {
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
      </CardContent>
    </Card>
  )
}
