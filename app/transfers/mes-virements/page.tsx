"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowUpRight, ArrowDownRight, Receipt, Calendar, Clock, Hash, FileText, CreditCard } from "lucide-react"
import { useState, useEffect } from "react"
import { getEpayments } from "@/app/transfers/new/actions"
import { getAccounts } from "@/app/accounts/actions"
import { importAesGcmKeyFromBase64, isEncryptedJson, decryptAesGcmFromJson } from "@/lib/crypto"

export default function MesVirementsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const ep = await getEpayments()
        const accountsData = await getAccounts()
        const secureMode = (process.env.NEXT_PUBLIC_PORTAL_SECURE_MODE || "false").toLowerCase() === "true"
        const keyB64 = process.env.NEXT_PUBLIC_PORTAL_KEY_B64 || ""
        let key: CryptoKey | null = null
        try {
          if (secureMode && keyB64) key = await importAesGcmKeyFromBase64(keyB64)
        } catch (_) {
          key = null
        }

        const rows = ep?.rows || []
        const decrypted = key
          ? await Promise.all(
              rows.map(async (t: any) => {
                const out = { ...t }
                const asEnc = (v: any) => {
                  if (!v) return null
                  if (isEncryptedJson(v)) return v
                  if (typeof v === 'string') { try { const p = JSON.parse(v); return isEncryptedJson(p) ? p : null } catch { return null } }
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
                out.description = typeof out.description === 'string' ? out.description : ''
                return out
              }),
            )
          : rows

        setTransactions(decrypted)
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

  const formatTransaction = (ep: any, accounts: any[]) => {
    const safeText = (v: any) => (typeof v === 'string' ? v : '')
    const amountStr = (ep.montantOperation ?? ep.amount ?? "0").toString()
    const amount = Number.parseFloat(amountStr)
    const isCredit = false // Mes virements: sorties
    const account = accounts.find((acc) => acc.id === ep.accountId || acc.accountId === ep.accountId)
    const currency = account?.currency || "GNF"
    const when = ep.dateExecution || ep.dateOrdre || ep.createdAt || new Date().toISOString()
    return {
      type: isCredit ? "Virement reçu" : "Virement émis",
      from: safeText(ep.description) || safeText(ep.referenceOperation) || "Virement",
      amount: `${isCredit ? "+" : "-"}${formatAmount(Math.abs(amount), currency)} ${currency}`,
      date: new Date(when).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }),
      time: new Date(when).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      status: safeText(ep.status) || "PENDING",
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
                        <p className="text-xs text-muted-foreground">{formatted.type}</p>
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
                    {/* Left Column */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                        <Hash className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-muted-foreground">Référence</p>
                          <p className="text-sm font-mono truncate">{typeof selectedTransaction.txnId === 'string' ? selectedTransaction.txnId : (typeof selectedTransaction.referenceOperation === 'string' ? selectedTransaction.referenceOperation : 'N/A')}</p>
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

                    {/* Right Column */}
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

                      {(typeof selectedTransaction.creditAccount === 'string' && selectedTransaction.creditAccount) && (
                        <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                          <CreditCard className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-muted-foreground">Compte créditeur</p>
                            <p className="text-sm font-mono truncate">{typeof selectedTransaction.creditAccount === 'string' ? selectedTransaction.creditAccount : ''}</p>
                          </div>
                        </div>
                      )}

                      {(typeof selectedTransaction.codeDevise === 'string' && selectedTransaction.codeDevise) && (
                        <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                          <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-muted-foreground">Devise</p>
                            <p className="text-sm">{typeof selectedTransaction.codeDevise === 'string' ? selectedTransaction.codeDevise : ''}</p>
                          </div>
                        </div>
                      )}

                      {(typeof selectedTransaction.referenceOperation === 'string' && selectedTransaction.referenceOperation) && (
                        <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                          <Hash className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-muted-foreground">Réf. opération</p>
                            <p className="text-sm font-mono truncate">{typeof selectedTransaction.referenceOperation === 'string' ? selectedTransaction.referenceOperation : ''}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {(() => {
                    const desc = (formatted as any).from
                    return !!desc
                  })() && (
                    <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                      <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground">Description</p>
                        <p className="text-sm">{(formatted as any).from}</p>
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
