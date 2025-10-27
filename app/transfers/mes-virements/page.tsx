"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowUpRight, ArrowDownRight, Receipt, Calendar, Clock, Hash, FileText, CreditCard } from "lucide-react"
import { useState, useEffect } from "react"
import { getTransactions } from "@/app/transfers/new/actions"
import { getAccounts } from "@/app/accounts/actions"

export default function MesVirementsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const transactionsResult = await getTransactions()
        const accountsData = await getAccounts()
        setTransactions(transactionsResult?.data || [])
        setAccounts(accountsData || [])
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

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
    const amount = Number.parseFloat(transaction.amount)
    const isCredit = transaction.txnType === "CREDIT"

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
      time: new Date(transaction.valueDate).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: transaction.status || "Exécuté",
      isCredit,
      currency,
      rawAmount: Math.abs(amount),
      account,
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "exécuté":
      case "completed":
        return (
          <Badge variant="default" className="bg-secondary text-secondary-foreground">
            Exécuté
          </Badge>
        )
      case "en attente":
      case "pending":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
            En attente
          </Badge>
        )
      case "échoué":
      case "failed":
        return <Badge variant="destructive">Échoué</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleTransactionClick = (transaction: any) => {
    setSelectedTransaction(transaction)
    setIsModalOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-6 fade-in">
        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Mes virements
          </h1>
          <p className="text-muted-foreground text-lg">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Mes virements
        </h1>
        <p className="text-muted-foreground text-lg">Historique complet de vos transactions</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Toutes les transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.length > 0 ? (
              transactions.map((transaction: any, index: number) => {
                const formattedTransaction = formatTransaction(transaction, accounts)
                return (
                  <div
                    key={transaction.txnId || index}
                    onClick={() => handleTransactionClick(transaction)}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border border-border/50 hover:shadow-md transition-all duration-200 hover:scale-[1.01] cursor-pointer"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                          formattedTransaction.isCredit
                            ? "bg-secondary/20 text-secondary"
                            : "bg-destructive/20 text-destructive"
                        }`}
                      >
                        {formattedTransaction.isCredit ? (
                          <ArrowDownRight className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{formattedTransaction.type}</p>
                        <p className="text-xs text-muted-foreground truncate">{formattedTransaction.from}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {formattedTransaction.date} à {formattedTransaction.time}
                          </p>
                          {getStatusBadge(formattedTransaction.status)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p
                        className={`font-semibold text-sm ${
                          formattedTransaction.isCredit ? "text-secondary" : "text-destructive"
                        }`}
                      >
                        {formattedTransaction.amount}
                      </p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <div className="p-4 rounded-full bg-muted/50 mx-auto mb-4 w-fit">
                  <Receipt className="h-8 w-8" />
                </div>
                <p className="text-base font-medium mb-2">Aucune transaction</p>
                <p className="text-sm">Vos virements apparaîtront ici</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-heading">Détails de la transaction</DialogTitle>
            <DialogDescription>Informations complètes sur cette transaction</DialogDescription>
          </DialogHeader>

          {selectedTransaction &&
            (() => {
              const formatted = formatTransaction(selectedTransaction, accounts)
              return (
                <div className="space-y-6 mt-4">
                  {/* Amount and Type */}
                  <div className="text-center p-6 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border border-border/50">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                        formatted.isCredit ? "bg-secondary/20 text-secondary" : "bg-destructive/20 text-destructive"
                      }`}
                    >
                      {formatted.isCredit ? (
                        <ArrowDownRight className="w-8 h-8" />
                      ) : (
                        <ArrowUpRight className="w-8 h-8" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{formatted.type}</p>
                    <p className={`text-3xl font-bold ${formatted.isCredit ? "text-secondary" : "text-destructive"}`}>
                      {formatted.amount}
                    </p>
                    <div className="mt-4">{getStatusBadge(formatted.status)}</div>
                  </div>

                  {/* Transaction Details */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                      <Hash className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Référence</p>
                        <p className="text-sm font-mono">{selectedTransaction.txnId || "N/A"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                      <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Date</p>
                        <p className="text-sm">{formatted.date}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                      <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Heure</p>
                        <p className="text-sm">{formatted.time}</p>
                      </div>
                    </div>

                    {formatted.account && (
                      <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                        <CreditCard className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-muted-foreground">Compte</p>
                          <p className="text-sm font-medium">{formatted.account.accountName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{formatted.account.accountNumber}</p>
                        </div>
                      </div>
                    )}

                    {selectedTransaction.description && (
                      <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                        <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-muted-foreground">Description</p>
                          <p className="text-sm">{selectedTransaction.description}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
