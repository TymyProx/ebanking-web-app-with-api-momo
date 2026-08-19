"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight, Receipt } from "lucide-react"
import { getUserTransactions } from "@/app/transfers/mes-virements/actions"
import { getAccounts } from "@/app/accounts/actions"
import { getTabId } from "@/lib/client-tab-id"

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const tabId = getTabId()
    void Promise.all([getUserTransactions(tabId), getAccounts(tabId)])
      .then(([transactionsResult, accountsData]) => {
        setTransactions(transactionsResult?.data || [])
        setAccounts(accountsData || [])
      })
      .finally(() => setIsLoading(false))
  }, [])

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

  const formatTransaction = (transaction: any, accountList: any[]) => {
    const baseAmount = Number.parseFloat(transaction.montantOperation || "0")

    const account = accountList.find(
      (acc) =>
        acc.id === transaction.accountId ||
        acc.accountId === transaction.accountId ||
        acc.accountNumber === transaction.numCompte ||
        acc.accountNumber === transaction.accountId ||
        acc.numCompte === transaction.numCompte,
    )
    const currency = account?.currency || "GNF"

    const accountNumber = account?.accountNumber || account?.numCompte
    const isCreditAccount = accountNumber && transaction.creditAccount === accountNumber
    const isDebitAccount = accountNumber && transaction.numCompte === accountNumber

    let isDebit = false
    let isCredit = false

    if (isCreditAccount) {
      isCredit = true
      isDebit = false
    } else if (isDebitAccount) {
      isDebit = true
      isCredit = false
    } else {
      const txnType = (transaction.txnType || "").toUpperCase()
      isDebit = txnType === "DEBIT"
      isCredit = txnType === "CREDIT"
    }

    const signedAmount = isDebit ? -Math.abs(baseAmount) : Math.abs(baseAmount)

    return {
      type: isDebit ? "Virement émis" : "Virement reçu",
      from: transaction.description || "Transaction",
      amount: `${formatAmount(signedAmount, currency)} ${currency}`,
      date: new Date(transaction.valueDate || transaction.createdAt || new Date()).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      isDebit,
      isCredit,
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="font-heading text-lg">Dernières transactions</CardTitle>
        <Link
          href="/transfers/mes-virements"
          className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
        >
          Voir tout
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />
            ))
          ) : transactions.length > 0 ? (
            transactions.slice(0, 4).map((transaction: any, index: number) => {
              const formattedTransaction = formatTransaction(transaction, accounts)
              return (
                <div
                  key={transaction.txnId || index}
                  className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border border-border/50 hover:shadow-md transition-all duration-200 min-w-0"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 ${
                        formattedTransaction.isDebit
                          ? "bg-red-500/20 text-red-600"
                          : "bg-green-500/20 text-green-600"
                      }`}
                    >
                      {formattedTransaction.isDebit ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-xs">{formattedTransaction.type}</p>
                      <p className="text-xs text-muted-foreground">{formattedTransaction.from}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold text-xs ${
                        formattedTransaction.isDebit ? "text-red-600" : "text-green-600"
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
            <div className="text-center py-8 text-muted-foreground">
              <div className="p-3 rounded-full bg-muted/50 mx-auto mb-3 w-fit">
                <Receipt className="h-5 w-5" />
              </div>
              <p className="text-xs">Aucune transaction récente</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
