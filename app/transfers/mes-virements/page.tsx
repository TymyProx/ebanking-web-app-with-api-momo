"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowUpRight, ArrowDownRight, Receipt, Calendar, Clock, Hash, FileText, CreditCard } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { getUserTransactions } from "./actions"
import { getAccounts } from "@/app/accounts/actions"

export default function MesVirementsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [displayCount, setDisplayCount] = useState(20)

  useEffect(() => {
    const loadData = async () => {
      const cachedTransactions = sessionStorage.getItem("mes-virements-all-transactions")
      const cachedAccounts = sessionStorage.getItem("mes-virements-accounts")

      if (cachedTransactions && cachedAccounts) {
        try {
          setTransactions(JSON.parse(cachedTransactions))
          setAccounts(JSON.parse(cachedAccounts))
          setLoading(false)
        } catch (e) {}
      }

      try {
        const [txnResult, accountsData] = await Promise.all([getUserTransactions(), getAccounts()])

        setTransactions(txnResult.success ? txnResult.data : [])
        setAccounts(accountsData || [])

        try {
          sessionStorage.setItem("mes-virements-all-transactions", JSON.stringify(txnResult.data))
          sessionStorage.setItem("mes-virements-accounts", JSON.stringify(accountsData || []))
        } catch (e) {}
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const displayedItems = useMemo(() => {
    return transactions.slice(0, displayCount)
  }, [transactions, displayCount])

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

  const formatTransaction = (txn: any, accounts: any[]) => {
    const amount = Number.parseFloat(txn.montantOperation || "0")
    const isNegative = amount < 0
    const account = accounts.find((acc) => acc.accountNumber === txn.numCompte || acc.accountId === txn.accountId)
    const currency = account?.currency || "GNF"
    const when = txn.valueDate || txn.createdAt || new Date().toISOString()
    return {
      type: isNegative ? "Virement émis" : "Virement reçu",
      from: txn.description || txn.referenceOperation || "Transaction",
      amount: `${formatAmount(Math.abs(amount), currency)} ${currency}`,
      date: new Date(when).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }),
      time: new Date(when).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      status: txn.status || "COMPLETED",
      isCredit: !isNegative,
      currency,
      rawAmount: Math.abs(amount),
      account,
      isNegative,
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

  const handleTransactionClick = (item: any) => {
    setSelectedTransaction(item)
    setIsModalOpen(true)
  }

  const handleLoadMore = () => {
    setDisplayCount((prev) => Math.min(prev + 20, transactions.length))
  }

  if (loading) {
    return (
      <div className="space-y-6 fade-in">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-primary">Mes virements</h1>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">Mes virements</h1>
        <p className="text-sm text-muted-foreground">Historique complet de vos transactions</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="font-heading text-xl">
            Toutes les transactions
            {transactions.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({Math.min(displayCount, transactions.length)} sur {transactions.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {displayedItems.length > 0 ? (
              <>
                {displayedItems.map((item: any, index: number) => {
                  const formatted = formatTransaction(item, accounts)
                  return (
                    <div
                      key={item.txnId || index}
                      onClick={() => handleTransactionClick(item)}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border border-border/50 hover:shadow-md transition-all duration-200 hover:scale-[1.01] cursor-pointer"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                            formatted.isCredit ? "bg-secondary/20 text-secondary" : "bg-destructive/20 text-destructive"
                          }`}
                        >
                          {formatted.isCredit ? (
                            <ArrowDownRight className="w-5 h-5" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{formatted.type}</p>
                          <p className="text-xs text-muted-foreground truncate">{formatted.from}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-muted-foreground">
                              {formatted.date} à {formatted.time}
                            </p>
                            {getStatusBadge(formatted.status)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p
                          className={`font-semibold text-sm ${
                            formatted.isNegative ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {formatted.amount}
                        </p>
                      </div>
                    </div>
                  )
                })}

                {displayCount < transactions.length && (
                  <div className="flex justify-center pt-4">
                    <Button onClick={handleLoadMore} variant="outline" className="w-full max-w-xs bg-transparent">
                      Afficher plus ({transactions.length - displayCount} restants)
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <div className="p-4 rounded-full bg-muted/50 mx-auto mb-4 w-fit">
                  <Receipt className="h-8 w-8" />
                </div>
                <p className="text-base font-medium mb-2">Aucune transaction</p>
                <p className="text-sm">Vos transactions apparaîtront ici</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-heading">Détails de la transaction</DialogTitle>
            <DialogDescription>Informations complètes sur cette transaction</DialogDescription>
          </DialogHeader>

          {selectedTransaction &&
            (() => {
              const formatted = formatTransaction(selectedTransaction, accounts)

              return (
                <div className="space-y-4 mt-4">
                  <div className="text-center p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border border-border/50">
                    <div className="flex items-center justify-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                          formatted.isCredit ? "bg-secondary/20 text-secondary" : "bg-destructive/20 text-destructive"
                        }`}
                      >
                        {formatted.isCredit ? (
                          <ArrowDownRight className="w-6 h-6" />
                        ) : (
                          <ArrowUpRight className="w-6 h-6" />
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-muted-foreground">{formatted.type}</p>
                        <p className={`text-2xl font-bold ${formatted.isNegative ? "text-red-600" : "text-green-600"}`}>
                          {formatted.amount}
                        </p>
                      </div>
                      <div className="ml-auto">{getStatusBadge(formatted.status)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border/30">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Date</p>
                          <p className="text-sm font-medium">{formatted.date}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border/30">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Heure</p>
                          <p className="text-sm font-medium">{formatted.time}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border/30">
                        <Hash className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Référence</p>
                          <p className="text-sm font-medium font-mono">
                            {selectedTransaction.txnId || selectedTransaction.referenceOperation || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border/30">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Type</p>
                          <p className="text-sm font-medium">{selectedTransaction.txnType || "N/A"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border/30">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Compte</p>
                          <p className="text-sm font-medium font-mono">
                            {selectedTransaction.numCompte || formatted.account?.accountNumber || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border/30">
                        <Receipt className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Statut</p>
                          <div className="mt-1">{getStatusBadge(formatted.status)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-lg border border-border/30">
                    <p className="text-xs text-muted-foreground mb-2">Description</p>
                    <p className="text-sm">{formatted.from}</p>
                  </div>

                  {selectedTransaction.commentnotes && (
                    <div className="p-4 bg-muted/30 rounded-lg border border-border/30">
                      <p className="text-xs text-muted-foreground mb-2">Notes</p>
                      <p className="text-sm">{selectedTransaction.commentnotes}</p>
                    </div>
                  )}
                </div>
              )
            })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
