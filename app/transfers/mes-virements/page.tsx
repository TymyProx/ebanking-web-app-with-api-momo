"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpRight, ArrowDownRight, Receipt, Calendar, Clock, Hash, FileText, CreditCard } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { getEpayments } from "@/app/transfers/new/actions"
import { getUserTransactions } from "./actions"
import { getAccounts } from "@/app/accounts/actions"
import { importAesGcmKeyFromBase64, isEncryptedJson, decryptAesGcmFromJson } from "@/lib/crypto"

export default function MesVirementsPage() {
  const [epayments, setEpayments] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [displayCount, setDisplayCount] = useState(20)
  const [activeTab, setActiveTab] = useState("virements")

  useEffect(() => {
    const loadData = async () => {
      // Essayer de charger depuis le cache
      const cachedEpayments = sessionStorage.getItem("mes-virements-epayments")
      const cachedTransactions = sessionStorage.getItem("mes-virements-all-transactions")
      const cachedAccounts = sessionStorage.getItem("mes-virements-accounts")

      if (cachedEpayments && cachedTransactions && cachedAccounts) {
        try {
          setEpayments(JSON.parse(cachedEpayments))
          setTransactions(JSON.parse(cachedTransactions))
          setAccounts(JSON.parse(cachedAccounts))
          setLoading(false)
        } catch (e) {}
      }

      try {
        const [ep, txnResult, accountsData] = await Promise.all([getEpayments(), getUserTransactions(), getAccounts()])

        const secureMode = (process.env.NEXT_PUBLIC_PORTAL_SECURE_MODE || "false").toLowerCase() === "true"
        const keyB64 = process.env.NEXT_PUBLIC_PORTAL_KEY_B64 || ""
        let key: CryptoKey | null = null
        try {
          if (secureMode && keyB64) key = await importAesGcmKeyFromBase64(keyB64)
        } catch (_) {
          key = null
        }

        // Déchiffrer les epayments
        const rows = ep?.rows || []
        const decryptedEpayments = key
          ? await Promise.all(
              rows.map(async (t: any) => {
                const out = { ...t }
                const asEnc = (v: any) => {
                  if (!v) return null
                  if (isEncryptedJson(v)) return v
                  if (typeof v === "string") {
                    try {
                      const p = JSON.parse(v)
                      return isEncryptedJson(p) ? p : null
                    } catch {
                      return null
                    }
                  }
                  return null
                }
                try {
                  const dEnc = asEnc(out.description) || asEnc(out.description_json)
                  if (dEnc) out.description = await decryptAesGcmFromJson(dEnc, key as CryptoKey)
                  const cEnc = asEnc(out.commentnotes) || asEnc(out.commentnotes_json)
                  if (cEnc) out.commentnotes = await decryptAesGcmFromJson(cEnc, key as CryptoKey)
                  const ncEnc = asEnc(out.nomClient) || asEnc(out.nomClient_json)
                  if (ncEnc) out.nomClient = await decryptAesGcmFromJson(ncEnc, key as CryptoKey)
                  const nbEnc = asEnc(out.nomBeneficiaire) || asEnc(out.nomBeneficiaire_json)
                  if (nbEnc) out.nomBeneficiaire = await decryptAesGcmFromJson(nbEnc, key as CryptoKey)
                  const rcEnc = asEnc(out.ribClient) || asEnc(out.ribClient_json)
                  if (rcEnc) out.ribClient = await decryptAesGcmFromJson(rcEnc, key as CryptoKey)
                  const rbEnc = asEnc(out.ribBeneficiaire) || asEnc(out.ribBeneficiaire_json)
                  if (rbEnc) out.ribBeneficiaire = await decryptAesGcmFromJson(rbEnc, key as CryptoKey)
                  const moEnc = asEnc(out.montantOperation_json)
                  if (moEnc) out.montantOperation = await decryptAesGcmFromJson(moEnc, key as CryptoKey)
                } catch (_) {}
                out.description = typeof out.description === "string" ? out.description : ""
                return out
              }),
            )
          : rows

        setEpayments(decryptedEpayments)
        setTransactions(txnResult.success ? txnResult.data : [])
        setAccounts(accountsData || [])

        try {
          sessionStorage.setItem("mes-virements-epayments", JSON.stringify(decryptedEpayments))
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
    const items = activeTab === "virements" ? epayments : transactions
    return items.slice(0, displayCount)
  }, [activeTab, epayments, transactions, displayCount])

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

  const formatEpayment = (ep: any, accounts: any[]) => {
    const safeText = (v: any) => (typeof v === "string" ? v : "")
    const amountStr = (ep.montantOperation ?? ep.amount ?? "0").toString()
    const amount = Number.parseFloat(amountStr)
    const isCredit = false
    const account = accounts.find((acc) => acc.id === ep.accountId || acc.accountId === ep.accountId)
    const currency = account?.currency || "GNF"
    const when = ep.dateExecution || ep.dateOrdre || ep.createdAt || new Date().toISOString()
    return {
      type: "Virement émis",
      from: safeText(ep.description) || safeText(ep.referenceOperation) || "Virement",
      amount: `-${formatAmount(Math.abs(amount), currency)} ${currency}`,
      date: new Date(when).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }),
      time: new Date(when).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      status: safeText(ep.status) || "PENDING",
      isCredit,
      currency,
      rawAmount: Math.abs(amount),
      account,
    }
  }

  const formatTransaction = (txn: any, accounts: any[]) => {
    const amount = Number.parseFloat(txn.amount || "0")
    const isCredit = txn.txnType === "CREDIT"
    const account = accounts.find((acc) => acc.accountNumber === txn.numCompte || acc.accountId === txn.accountId)
    const currency = account?.currency || "GNF"
    const when = txn.valueDate || txn.createdAt || new Date().toISOString()
    return {
      type: isCredit ? "Virement reçu" : "Virement émis",
      from: txn.description || txn.referenceOperation || "Transaction",
      amount: `${isCredit ? "+" : "-"}${formatAmount(Math.abs(amount), currency)} ${currency}`,
      date: new Date(when).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }),
      time: new Date(when).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      status: txn.status || "COMPLETED",
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

  const handleTransactionClick = (item: any) => {
    setSelectedTransaction(item)
    setIsModalOpen(true)
  }

  const handleLoadMore = () => {
    const totalItems = activeTab === "virements" ? epayments.length : transactions.length
    setDisplayCount((prev) => Math.min(prev + 20, totalItems))
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="virements">Virements ({epayments.length})</TabsTrigger>
          <TabsTrigger value="transactions">Toutes les transactions ({transactions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="virements" className="mt-0">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="font-heading text-xl">
                Historique des virements
                {epayments.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({Math.min(displayCount, epayments.length)} sur {epayments.length})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {displayedItems.length > 0 ? (
                  <>
                    {displayedItems.map((item: any, index: number) => {
                      const formatted = formatEpayment(item, accounts)
                      return (
                        <div
                          key={item.id || index}
                          onClick={() => handleTransactionClick(item)}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border border-border/50 hover:shadow-md transition-all duration-200 hover:scale-[1.01] cursor-pointer"
                        >
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-destructive/20 text-destructive">
                              <ArrowUpRight className="w-5 h-5" />
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
                            <p className="font-semibold text-sm text-destructive">{formatted.amount}</p>
                          </div>
                        </div>
                      )
                    })}

                    {displayCount < epayments.length && (
                      <div className="flex justify-center pt-4">
                        <Button onClick={handleLoadMore} variant="outline" className="w-full max-w-xs bg-transparent">
                          Afficher plus ({epayments.length - displayCount} restants)
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <div className="p-4 rounded-full bg-muted/50 mx-auto mb-4 w-fit">
                      <Receipt className="h-8 w-8" />
                    </div>
                    <p className="text-base font-medium mb-2">Aucun virement</p>
                    <p className="text-sm">Vos virements apparaîtront ici</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="mt-0">
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
                                formatted.isCredit
                                  ? "bg-secondary/20 text-secondary"
                                  : "bg-destructive/20 text-destructive"
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
                                formatted.isCredit ? "text-secondary" : "text-destructive"
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
        </TabsContent>
      </Tabs>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-heading">Détails de la transaction</DialogTitle>
            <DialogDescription>Informations complètes sur cette transaction</DialogDescription>
          </DialogHeader>

          {selectedTransaction &&
            (() => {
              // Déterminer si c'est un virement (epayment) ou une transaction standard
              const isEpayment = !selectedTransaction.txnId && selectedTransaction.id
              const formatted = isEpayment
                ? formatEpayment(selectedTransaction, accounts)
                : formatTransaction(selectedTransaction, accounts)

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
                        <p
                          className={`text-2xl font-bold ${formatted.isCredit ? "text-secondary" : "text-destructive"}`}
                        >
                          {formatted.amount}
                        </p>
                      </div>
                      <div className="ml-auto">{getStatusBadge(formatted.status)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                        <Hash className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-muted-foreground">Référence</p>
                          <p className="text-sm font-mono truncate">
                            {selectedTransaction.txnId ||
                              selectedTransaction.referenceOperation ||
                              selectedTransaction.id ||
                              "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                        <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-muted-foreground">Date</p>
                          <p className="text-sm">{formatted.date}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                        <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-muted-foreground">Heure</p>
                          <p className="text-sm">{formatted.time}</p>
                        </div>
                      </div>

                      {selectedTransaction.codeOperation && (
                        <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                          <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-muted-foreground">Code opération</p>
                            <p className="text-sm">{selectedTransaction.codeOperation}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {formatted.account && (
                        <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                          <CreditCard className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-muted-foreground">Compte</p>
                            <p className="text-sm font-medium truncate">{formatted.account.accountName}</p>
                            <p className="text-xs text-muted-foreground font-mono truncate">
                              {formatted.account.accountNumber}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedTransaction.creditAccount && (
                        <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                          <CreditCard className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-muted-foreground">Compte créditeur</p>
                            <p className="text-sm font-mono truncate">{selectedTransaction.creditAccount}</p>
                          </div>
                        </div>
                      )}

                      {selectedTransaction.codeDevise && (
                        <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                          <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-muted-foreground">Devise</p>
                            <p className="text-sm">{selectedTransaction.codeDevise}</p>
                          </div>
                        </div>
                      )}

                      {selectedTransaction.referenceOperation && (
                        <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                          <Hash className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-muted-foreground">Réf. opération</p>
                            <p className="text-sm font-mono truncate">{selectedTransaction.referenceOperation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {formatted.from && (
                    <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                      <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground">Description</p>
                        <p className="text-sm">{formatted.from}</p>
                      </div>
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
