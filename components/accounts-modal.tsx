"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Wallet, PiggyBank, DollarSign, Eye, TrendingUp } from "lucide-react"

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

interface AccountsModalProps {
  accounts: Account[]
}

export function AccountsModal({ accounts }: AccountsModalProps) {
  const [open, setOpen] = useState(false)

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

  const activeAccounts = accounts.filter((account) => account.status === "ACTIF")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="w-full md:w-auto bg-transparent">
          <Wallet className="h-5 w-5 mr-2" />
          Voir tous mes comptes ({activeAccounts.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading">Mes comptes</DialogTitle>
          <DialogDescription>
            Vous avez {activeAccounts.length} compte{activeAccounts.length > 1 ? "s" : ""} actif
            {activeAccounts.length > 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAccounts.length > 0 ? (
              activeAccounts.map((account) => (
                <Link key={account.id} href={`/accounts/${account.id}`} onClick={() => setOpen(false)}>
                  <Card className="card-hover border-0 shadow-md bg-gradient-to-br from-card to-card/50 backdrop-blur-sm h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-primary/10">{getAccountIcon(account.type)}</div>
                        <CardTitle className="text-base font-heading font-semibold">{account.accountName}</CardTitle>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-secondary/20 text-secondary-foreground border-secondary/30"
                      >
                        {getAccountTypeDisplay(account.type)}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Solde disponible</p>
                          <div className="text-2xl font-heading font-bold text-foreground">
                            {formatAmount(account.availableBalance, account.currency)} {account.currency}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Solde comptable</p>
                          <div className="text-lg font-heading font-semibold text-muted-foreground">
                            {formatAmount(account.bookBalance, account.currency)} {account.currency}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">
                        {account.accountNumber}
                      </p>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-4 w-4 text-secondary" />
                          <span className="text-sm text-secondary font-medium">{getAccountTrend()}</span>
                          <span className="text-xs text-muted-foreground">ce mois</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full">
                <Card className="border-dashed border-2 border-muted">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="p-4 rounded-full bg-muted/50 mb-4">
                      <Wallet className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-heading font-semibold mb-2">Aucun compte</h3>
                    <p className="text-muted-foreground text-center">Aucun compte n'est disponible pour le moment.</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
