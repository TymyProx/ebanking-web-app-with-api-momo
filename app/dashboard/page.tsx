import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Send, Receipt, ArrowUpRight, ArrowDownRight, Users } from "lucide-react"
import { getUserTransactions } from "@/app/transfers/mes-virements/actions"
import { getAccounts } from "@/app/accounts/actions"
import { AccountsCarousel } from "@/components/accounts-carousel"
import { BankProductsCarousel } from "@/components/bank-products-carousel"
import { Suspense } from "react"

async function getCurrentUser() {
  try {
    const cookieModule = await import("next/headers")
    const cookies = cookieModule.cookies
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) return null

    const { config } = await import("@/lib/config")
    const normalize = (u?: string) => (u ? u.replace(/\/$/, "") : "")
    const API_BASE_URL = `${normalize(config.API_BASE_URL)}/api`

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    if (!response.ok) return null

    const userData = await response.json()
    return userData
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

async function RecentTransactions() {
  const transactionsResult = await getUserTransactions()
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

  const formatTransaction = (transaction: any, accounts: any[]) => {
    const amount = Number.parseFloat(transaction.montantOperation)
    const isCredit = amount >= 0

    const account = accounts.find((acc) => acc.id === transaction.accountId || acc.accountId === transaction.accountId)
    const currency = account?.currency || "GNF"

    return {
      type: isCredit ? "Virement reçu" : "Virement émis",
      from: transaction.description || "Transaction",
      amount: `${isCredit ? "+" : ""}${formatAmount(amount, currency)} ${currency}`,
      rawAmount: amount,
      date: new Date(transaction.valueDate).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      status: transaction.status || "Exécuté",
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-heading text-xl">Dernières transactions</CardTitle>
        <Link
          href="/transfers/mes-virements"
          className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
        >
          Voir tout
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.length > 0 ? (
            transactions.slice(0, 4).map((transaction: any, index: number) => {
              const formattedTransaction = formatTransaction(transaction, accounts)
              return (
                <div
                  key={transaction.txnId || index}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border border-border/50 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        formattedTransaction.rawAmount < 0
                          ? "bg-red-500/20 text-red-600"
                          : "bg-green-500/20 text-green-600"
                      }`}
                    >
                      {formattedTransaction.rawAmount < 0 ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{formattedTransaction.type}</p>
                      <p className="text-sm text-muted-foreground">{formattedTransaction.from}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold text-sm ${
                        formattedTransaction.rawAmount < 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {formattedTransaction.amount}
                    </p>
                    <p className="text-sm text-muted-foreground">{formattedTransaction.date}</p>
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
  )
}

async function AccountsSection() {
  const accounts = await getAccounts()
  return <AccountsCarousel accounts={accounts} />
}

function TransactionsLoading() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="h-6 w-48 bg-muted rounded-lg animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted/30 rounded-xl animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function AccountsLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-48 bg-gradient-to-br from-muted to-muted/50 rounded-xl animate-pulse" />
      ))}
    </div>
  )
}

export default async function Dashboard() {
  return (
    <div className="space-y-4 fade-in">
      <Suspense fallback={<AccountsLoading />}>
        <AccountsSection />
      </Suspense>

      <Card className="border-0 shadow-sm bg-muted/30">
        <CardContent className="pt-4 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link href="/transfers/new">
              <Button size="sm" className="h-14 flex flex-col space-y-1 w-full btn-primary group">
                <Send className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">Virement</span>
              </Button>
            </Link>
            <Link href="/transfers/beneficiaries">
              <Button
                size="sm"
                variant="outline"
                className="h-14 flex flex-col space-y-1 w-full hover:bg-secondary/10 hover:border-secondary group bg-transparent"
              >
                <Users className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">Gestion des bénéficiaires</span>
              </Button>
            </Link>
            <Link href="/accounts/balance">
              <Button
                size="sm"
                variant="outline"
                className="h-14 flex flex-col space-y-1 w-full hover:bg-accent/10 hover:border-accent group bg-transparent"
              >
                <Eye className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">Consultation de solde</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Suspense fallback={<TransactionsLoading />}>
          <RecentTransactions />
        </Suspense>

        <div>
          <div className="mb-2">
            <h2 className="text-lg font-heading font-semibold">Nos Produits</h2>
            <p className="text-sm text-muted-foreground">Découvrez nos offres exclusives</p>
          </div>
          <BankProductsCarousel />
        </div>
      </div>
    </div>
  )
}
