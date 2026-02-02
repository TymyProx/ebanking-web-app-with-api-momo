"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Calendar,
  Clock,
  Hash,
  FileText,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { getUserTransactions } from "./actions"
import { getAccounts } from "@/app/accounts/actions"

export default function MesVirementsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState<"tous" | "emis" | "recu">("tous")
  const itemsPerPage = 10

  // États des filtres
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    minAmount: "",
    maxAmount: "",
    status: "all", // all, completed, pending, failed
  })

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

  // Fonction pour appliquer les filtres
  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      const amount = Math.abs(Number.parseFloat(txn.montantOperation || "0"))
      const txnType = (txn.txnType || "").toUpperCase()
      const isDebit = txnType === "DEBIT"
      const when = new Date(txn.valueDate || txn.createdAt || new Date())
      const status = (txn.status || "COMPLETED").toLowerCase()

      // Filtre par onglet (type de virement)
      if (activeTab === "emis" && !isDebit) return false
      if (activeTab === "recu" && isDebit) return false

      // Filtre par date
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom)
        if (when < fromDate) return false
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo)
        toDate.setHours(23, 59, 59, 999) // Fin de journée
        if (when > toDate) return false
      }

      // Filtre par montant
      if (filters.minAmount && amount < Number.parseFloat(filters.minAmount)) return false
      if (filters.maxAmount && amount > Number.parseFloat(filters.maxAmount)) return false

      // Filtre par statut
      if (filters.status !== "all") {
        if (filters.status === "completed" && !["exécuté", "completed"].includes(status)) return false
        if (filters.status === "pending" && !["en attente", "pending"].includes(status)) return false
        if (filters.status === "failed" && !["échoué", "failed"].includes(status)) return false
      }

      return true
    })
  }, [transactions, filters, activeTab])

  // Statistiques par type
  const stats = useMemo(() => {
    const tous = transactions.length
    const emis = transactions.filter(t => (t.txnType || "").toUpperCase() === "DEBIT")
    const recu = transactions.filter(t => (t.txnType || "").toUpperCase() === "CREDIT")
    
    const totalEmis = emis.reduce((sum, t) => sum + Math.abs(Number.parseFloat(t.montantOperation || "0")), 0)
    const totalRecu = recu.reduce((sum, t) => sum + Math.abs(Number.parseFloat(t.montantOperation || "0")), 0)

    return {
      tous: { count: tous, total: totalEmis + totalRecu },
      emis: { count: emis.length, total: totalEmis },
      recu: { count: recu.length, total: totalRecu },
    }
  }, [transactions])

  const displayedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredTransactions.slice(startIndex, endIndex)
  }, [filteredTransactions, currentPage])

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)

  const handleResetFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      minAmount: "",
      maxAmount: "",
      status: "all",
    })
    setCurrentPage(1)
  }

  const hasActiveFilters = 
    filters.dateFrom || 
    filters.dateTo || 
    filters.minAmount || 
    filters.maxAmount || 
    filters.status !== "all"

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
    const baseAmount = Number.parseFloat(txn.montantOperation || "0")
    
    // Find the account this transaction belongs to
    const account = accounts.find(
      (acc) =>
        acc.accountNumber === txn.numCompte ||
        acc.accountId === txn.accountId ||
        acc.accountNumber === txn.accountId ||
        acc.id === txn.accountId ||
        acc.numCompte === txn.numCompte
    )
    const currency = account?.currency || "GNF"
    
    // ✅ Use reliable classification based on account relationships
    const accountNumber = account?.accountNumber || account?.numCompte
    const isCreditAccount = accountNumber && txn.creditAccount === accountNumber
    const isDebitAccount = accountNumber && txn.numCompte === accountNumber
    
    let isDebit = false
    let isCredit = false
    
    if (isCreditAccount) {
      // Account is receiving money → CREDIT
      isCredit = true
      isDebit = false
    } else if (isDebitAccount) {
      // Account is sending money → DEBIT
      isDebit = true
      isCredit = false
    } else {
      // Fallback to txnType field
      const txnType = (txn.txnType || "").toUpperCase()
      isDebit = txnType === "DEBIT"
      isCredit = txnType === "CREDIT"
    }
    
    // Montant avec signe : négatif pour DEBIT, positif pour CREDIT
    const signedAmount = isDebit ? -Math.abs(baseAmount) : Math.abs(baseAmount)
    
    const when = txn.valueDate || txn.createdAt || new Date().toISOString()
    return {
      type: isDebit ? "Virement émis" : "Virement reçu",
      from: txn.description || txn.referenceOperation || "Transaction",
      amount: `${formatAmount(signedAmount, currency)} ${currency}`,
      date: new Date(when).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }),
      time: new Date(when).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      status: txn.status || "COMPLETED",
      isCredit: isCredit,
      currency,
      rawAmount: signedAmount,
      account,
      isNegative: isDebit,
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

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
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
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-primary">Mes virements</h1>
          <p className="text-sm text-muted-foreground">Historique complet de vos transactions</p>
        </div>
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant={hasActiveFilters ? "default" : "outline"}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtres
          {hasActiveFilters && <span className="ml-1 bg-white text-primary rounded-full px-2 py-0.5 text-xs">•</span>}
        </Button>
      </div>

      {/* Panneau de filtres */}
      {showFilters && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-lg">Filtrer les transactions</CardTitle>
              {hasActiveFilters && (
                <Button onClick={handleResetFilters} variant="ghost" size="sm" className="gap-2">
                  <X className="h-4 w-4" />
                  Réinitialiser
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {/* Filtre par date */}
              <div className="space-y-2">
                <Label htmlFor="dateFrom" className="text-sm font-medium">
                  Date de début
                </Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => {
                    setFilters({ ...filters, dateFrom: e.target.value })
                    setCurrentPage(1)
                  }}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateTo" className="text-sm font-medium">
                  Date de fin
                </Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => {
                    setFilters({ ...filters, dateTo: e.target.value })
                    setCurrentPage(1)
                  }}
                  className="h-10"
                />
              </div>

              {/* Filtre par montant */}
              <div className="space-y-2">
                <Label htmlFor="minAmount" className="text-sm font-medium">
                  Montant minimum (GNF)
                </Label>
                <Input
                  id="minAmount"
                  type="number"
                  placeholder="0"
                  value={filters.minAmount}
                  onChange={(e) => {
                    setFilters({ ...filters, minAmount: e.target.value })
                    setCurrentPage(1)
                  }}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxAmount" className="text-sm font-medium">
                  Montant maximum (GNF)
                </Label>
                <Input
                  id="maxAmount"
                  type="number"
                  placeholder="0"
                  value={filters.maxAmount}
                  onChange={(e) => {
                    setFilters({ ...filters, maxAmount: e.target.value })
                    setCurrentPage(1)
                  }}
                  className="h-10"
                />
              </div>

              {/* Filtre par statut */}
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">
                  Statut
                </Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => {
                    setFilters({ ...filters, status: value })
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger id="status" className="h-10">
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="completed">Exécuté</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="failed">Échoué</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onglets de catégories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tous les virements */}
        <button
          onClick={() => {
            setActiveTab("tous")
            setCurrentPage(1)
          }}
          className={`relative group p-4 rounded-xl border-2 transition-all duration-300 text-left ${
            activeTab === "tous"
              ? "border-primary bg-primary/5 shadow-lg shadow-primary/20"
              : "border-border bg-card hover:border-primary/50 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Tous les virements</h3>
                <p className="text-xl font-bold text-primary">{stats.tous.count}</p>
              </div>
            </div>
            {activeTab === "tous" && (
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
            )}
          </div>
          {activeTab === "tous" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 rounded-b-xl"></div>
          )}
        </button>

        {/* Virements émis */}
        <button
          onClick={() => {
            setActiveTab("emis")
            setCurrentPage(1)
          }}
          className={`relative group p-4 rounded-xl border-2 transition-all duration-300 text-left ${
            activeTab === "emis"
              ? "border-red-500 bg-red-50/50 dark:bg-red-950/20 shadow-lg shadow-red-500/20"
              : "border-border bg-card hover:border-red-500/50 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/10 to-red-500/5">
                <ArrowUpRight className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Virements émis</h3>
                <p className="text-xl font-bold text-red-600">{stats.emis.count}</p>
              </div>
            </div>
            {activeTab === "emis" && (
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
            )}
          </div>
          {activeTab === "emis" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500/0 via-red-500 to-red-500/0 rounded-b-xl"></div>
          )}
        </button>

        {/* Virements reçus */}
        <button
          onClick={() => {
            setActiveTab("recu")
            setCurrentPage(1)
          }}
          className={`relative group p-4 rounded-xl border-2 transition-all duration-300 text-left ${
            activeTab === "recu"
              ? "border-green-500 bg-green-50/50 dark:bg-green-950/20 shadow-lg shadow-green-500/20"
              : "border-border bg-card hover:border-green-500/50 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5">
                <ArrowDownRight className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Virements reçus</h3>
                <p className="text-xl font-bold text-green-600">{stats.recu.count}</p>
              </div>
            </div>
            {activeTab === "recu" && (
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            )}
          </div>
          {activeTab === "recu" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500/0 via-green-500 to-green-500/0 rounded-b-xl"></div>
          )}
        </button>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="font-heading text-xl">
            {activeTab === "tous" ? "Tous les virements" : activeTab === "emis" ? "Virements émis" : "Virements reçus"}
            {filteredTransactions.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({filteredTransactions.length} {hasActiveFilters && `résultat(s)`})
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
                      onDoubleClick={() => handleTransactionClick(item)}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border border-border/50 hover:shadow-md transition-all duration-200 hover:scale-[1.01] cursor-pointer"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                            formatted.isCredit ? "bg-secondary/20 text-primary" : "bg-destructive/20 text-destructive"
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

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                      className="bg-transparent"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Précédent
                    </Button>
                    <span className="text-sm text-muted-foreground px-4">
                      Page {currentPage} sur {totalPages}
                    </span>
                    <Button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                      className="bg-transparent"
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4 ml-1" />
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
