"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import { Wallet, PiggyBank, DollarSign, Eye, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react"
import type { CarouselApi } from "@/components/ui/carousel"

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
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)

  const activeAccounts = accounts.filter((account) => account.status === "ACTIF")

  useEffect(() => {
    if (!api) {
      return
    }

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap())

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
    })

    // Auto-play: change slide every 5 seconds
    const autoplay = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext()
      } else {
        api.scrollTo(0)
      }
    }, 5000)

    return () => clearInterval(autoplay)
  }, [api])

  const formatAmount = (amount: number | string, currency = "GNF") => {
    const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
    if (currency === "GNF") {
      return new Intl.NumberFormat("fr-FR").format(numAmount)
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

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 via-card to-secondary/5 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-xl">Mes Comptes</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-transparent"
              onClick={() => api?.scrollPrev()}
              disabled={!api?.canScrollPrev()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-transparent"
              onClick={() => api?.scrollNext()}
              disabled={!api?.canScrollNext()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Carousel setApi={setApi} className="w-full">
          <CarouselContent>
            {activeAccounts.map((account) => (
              <CarouselItem key={account.id}>
                <Link href={`/accounts/${account.id}`}>
                  <Card className="card-hover border-0 shadow-md bg-gradient-to-br from-primary/10 via-background to-secondary/10 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between gap-6">
                        {/* Left section: Account info and type */}
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-primary/10">{getAccountIcon(account.type)}</div>
                            <div>
                              <CardTitle className="text-lg font-heading font-semibold mb-1">
                                {account.accountName}
                              </CardTitle>
                              <Badge
                                variant="secondary"
                                className="bg-secondary/20 text-secondary-foreground border-secondary/30"
                              >
                                {getAccountTypeDisplay(account.type)}
                              </Badge>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Numéro de compte</p>
                            <p className="text-base font-mono font-semibold bg-muted/50 px-4 py-2 rounded-md inline-block">
                              {account.accountNumber}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 pt-2">
                            <TrendingUp className="h-4 w-4 text-secondary" />
                            <span className="text-sm text-secondary font-medium">{getAccountTrend()}</span>
                            <span className="text-xs text-muted-foreground">ce mois</span>
                          </div>
                        </div>

                        {/* Right section: Balances */}
                        <div className="flex-1 space-y-4 text-right">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Solde disponible</p>
                            <div className="text-4xl font-heading font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                              {formatAmount(account.availableBalance, account.currency)}
                            </div>
                            <div className="text-base font-semibold text-foreground mt-1">{account.currency}</div>
                          </div>

                          <div className="pt-2 border-t border-border/30">
                            <p className="text-xs text-muted-foreground/70 mb-1">Solde comptable</p>
                            <div className="text-base font-medium text-muted-foreground/60">
                              {formatAmount(account.bookBalance, account.currency)} {account.currency}
                            </div>
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

        {/* Dots indicator */}
        {count > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: count }).map((_, index) => (
              <button
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === current ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"
                }`}
                onClick={() => api?.scrollTo(index)}
                aria-label={`Aller au compte ${index + 1}`}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
