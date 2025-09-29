import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Eye,
  Send,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Calendar,
  AlertCircle,
  Wallet,
  PiggyBank,
  DollarSign,
  TrendingUp,
} from "lucide-react"
import { getTransactions } from "@/app/transfers/new/actions"
import { getAccounts } from "@/app/accounts/actions"

export default async function Dashboard() {
  const transactionsResult = await getTransactions()
  const transactions = transactionsResult?.data || []

  const accounts = await getAccounts()

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

  const formatTransaction = (transaction: any, accounts: any[]) => {
    const amount = Number.parseFloat(transaction.amount)
    const isCredit = transaction.txnType === "CREDIT"

    // Find the account to get its currency
    const account = accounts.find((acc) => acc.id === transaction.accountId || acc.accountId === transaction.accountId)
    const currency = account?.currency || "GNF"

    return {
      type: isCredit ? "Virement reçu" : "Virement émis",
      from: transaction.description || "Transaction",
      amount: `${isCredit ? "+" : "-"}${formatAmount(Math.abs(amount), currency)} ${currency}`,
      date: new Date(transaction.valueDate).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      status: transaction.status || "Exécuté",
    }
  }

  return (
    <div className="space-y-8 fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Tableau de bord
        </h1>
        <p className="text-muted-foreground text-lg">Bienvenue sur votre espace Astra eBanking</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.length > 0 ? (
          accounts
            .filter((account: any) => account.status === "ACTIF")
            .map((account: any) => (
              <Link key={account.id} href={`/accounts/${account.id}`}>
                <Card className="card-hover border-0 shadow-md bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
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

      <Card className="border-0 shadow-lg bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center font-heading text-xl">
            <div className="p-2 rounded-lg bg-primary/10 mr-3">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            Actions rapides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/transfers/new">
              <Button className="h-20 flex flex-col space-y-3 w-full btn-primary group">
                <Send className="h-6 w-6 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Nouveau virement</span>
              </Button>
            </Link>
            <Link href="/payments/bills">
              <Button
                variant="outline"
                className="h-20 flex flex-col space-y-3 w-full border-2 hover:bg-secondary/10 hover:border-secondary group bg-transparent"
              >
                <Receipt className="h-6 w-6 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Payer une facture</span>
              </Button>
            </Link>
            <Link href="/accounts/balance">
              <Button
                variant="outline"
                className="h-20 flex flex-col space-y-3 w-full border-2 hover:bg-accent/10 hover:border-accent group bg-transparent"
              >
                <Eye className="h-6 w-6 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Consulter soldes</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Dernières transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.length > 0 ? (
                transactions.slice(0, 3).map((transaction: any, index: number) => {
                  const formattedTransaction = formatTransaction(transaction, accounts)
                  return (
                    <div
                      key={transaction.txnId || index}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border border-border/50 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            formattedTransaction.amount.startsWith("+")
                              ? "bg-secondary/20 text-secondary"
                              : "bg-destructive/20 text-destructive"
                          }`}
                        >
                          {formattedTransaction.amount.startsWith("+") ? (
                            <ArrowDownRight className="w-5 h-5" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{formattedTransaction.type}</p>
                          <p className="text-xs text-muted-foreground">{formattedTransaction.from}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold text-sm ${
                            formattedTransaction.amount.startsWith("+") ? "text-secondary" : "text-destructive"
                          }`}
                        >
                          {formattedTransaction.amount}
                        </p>
                        <p className="text-xs text-muted-foreground">{formattedTransaction.date}</p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="p-4 rounded-full bg-muted/50 mx-auto mb-4 w-fit">
                    <Receipt className="h-6 w-6" />
                  </div>
                  <p className="text-sm">Aucune transaction récente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center font-heading text-xl">
              <div className="p-2 rounded-lg bg-accent/10 mr-3">
                <AlertCircle className="h-5 w-5 text-accent" />
              </div>
              Alertes & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-accent/10 to-accent/5 rounded-xl border border-accent/20">
                <div className="p-2 rounded-lg bg-accent/20">
                  <AlertCircle className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-accent-foreground">Virement programmé</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Un virement de 150,000 GNF vers Fatoumata Diallo est programmé pour demain
                  </p>
                  <Badge variant="outline" className="mt-2 text-xs bg-accent/10 border-accent/30">
                    <Calendar className="w-3 h-3 mr-1" />
                    14 Jan 2024
                  </Badge>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                <div className="p-2 rounded-lg bg-primary/20">
                  <AlertCircle className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Nouveau service</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Le service de paiement mobile est maintenant disponible
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 text-xs border-primary/30 hover:bg-primary/10 bg-transparent"
                  >
                    Découvrir
                  </Button>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-secondary/10 to-secondary/5 rounded-xl border border-secondary/20">
                <div className="p-2 rounded-lg bg-secondary/20">
                  <AlertCircle className="w-4 h-4 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-secondary">✅ Solde : 2,400,000 GNF</p>
                  <p className="text-xs text-muted-foreground mt-1">Votre compte courant a été crédité avec succès</p>
                  <Badge variant="outline" className="mt-2 text-xs bg-secondary/10 border-secondary/30">
                    Mis à jour
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
