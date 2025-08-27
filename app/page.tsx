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
} from "lucide-react"
import { getTransactions } from "@/app/transfers/new/actions"

export default async function Dashboard() {
  const transactionsResult = await getTransactions()
  const transactions = transactionsResult?.data || []

  const accounts = [
    {
      id: "1",
      name: "Compte Courant",
      number: "0001-234567-89",
      balance: 2400000,
      currency: "GNF",
      type: "Courant",
      trend: "+2.5%",
    },
    {
      id: "2",
      name: "Compte Épargne",
      number: "0002-345678-90",
      balance: 850000,
      currency: "GNF",
      type: "Épargne",
      trend: "+1.2%",
    },
    {
      id: "3",
      name: "Compte USD",
      number: "0003-456789-01",
      balance: 1250,
      currency: "USD",
      type: "Devise",
      trend: "0%",
    },
  ]

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
        return <Wallet className="h-4 w-4 text-blue-600" />
      case "Épargne":
        return <PiggyBank className="h-4 w-4 text-green-600" />
      case "Devise":
        return <DollarSign className="h-4 w-4 text-purple-600" />
      default:
        return <Eye className="h-4 w-4 text-muted-foreground" />
    }
  }

  const formatTransaction = (transaction: any) => {
    const amount = Number.parseFloat(transaction.amount)
    const isCredit = transaction.txnType === "CREDIT"

    return {
      type: isCredit ? "Virement reçu" : "Virement émis",
      from: transaction.description || "Transaction",
      amount: `${isCredit ? "+" : "-"}${formatAmount(Math.abs(amount))} GNF`,
      date: new Date(transaction.valueDate).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      status: transaction.status || "Exécuté",
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600">Bienvenue sur votre espace Astra eBanking</p>
      </div>

      {/* Soldes des comptes - US005 avec liens cliquables */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.length > 0 ? (
          accounts.map((account) => (
            <Link key={account.id} href={`/accounts/${account.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    {getAccountIcon(account.type)}
                    <CardTitle className="text-sm font-medium">{account.name}</CardTitle>
                  </div>
                  <Badge variant="secondary">{account.type}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {/* ✅ Solde affiché selon US005 */}
                    <div className="text-2xl font-bold">
                      {formatAmount(account.balance, account.currency)} {account.currency}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">{account.number}</p>
                    <div className="flex items-center pt-1">
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-green-600 ml-1">{account.trend} ce mois</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Wallet className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun compte</h3>
                <p className="text-gray-600 text-center">Aucun compte n'est disponible pour le moment.</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Actions rapides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/transfers/new">
              <Button className="h-16 flex flex-col space-y-2 w-full">
                <Send className="h-6 w-6" />
                <span>Nouveau virement</span>
              </Button>
            </Link>
            <Link href="/payments/bills">
              <Button variant="outline" className="h-16 flex flex-col space-y-2 bg-transparent w-full">
                <Receipt className="h-6 w-6" />
                <span>Payer une facture</span>
              </Button>
            </Link>
            <Link href="/accounts/balance">
              <Button variant="outline" className="h-16 flex flex-col space-y-2 bg-transparent w-full">
                <Eye className="h-6 w-6" />
                <span>Consulter soldes</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dernières transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Dernières transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.length > 0 ? (
                transactions.slice(0, 3).map((transaction: any, index: number) => {
                  const formattedTransaction = formatTransaction(transaction)
                  return (
                    <div
                      key={transaction.txnId || index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {formattedTransaction.amount.startsWith("+") ? (
                            <ArrowDownRight className="w-4 h-4 text-green-600" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{formattedTransaction.type}</p>
                          <p className="text-xs text-gray-500">{formattedTransaction.from}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold text-sm ${
                            formattedTransaction.amount.startsWith("+") ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {formattedTransaction.amount}
                        </p>
                        <p className="text-xs text-gray-500">{formattedTransaction.date}</p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">Aucune transaction récente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alertes et notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Alertes & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-yellow-800">Virement programmé</p>
                  <p className="text-xs text-yellow-700">
                    Un virement de 150,000 GNF vers Fatoumata Diallo est programmé pour demain
                  </p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    14 Jan 2024
                  </Badge>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-blue-800">Nouveau service</p>
                  <p className="text-xs text-blue-700">Le service de paiement mobile est maintenant disponible</p>
                  <Button size="sm" variant="outline" className="mt-2 text-xs bg-transparent">
                    Découvrir
                  </Button>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <AlertCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-green-800">✅ Solde : 2,400,000 GNF</p>
                  <p className="text-xs text-green-700">Votre compte courant a été crédité avec succès</p>
                  <Badge variant="outline" className="mt-1 text-xs bg-green-100">
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
