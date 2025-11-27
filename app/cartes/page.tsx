"use client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"
import {
  CreditCard,
  Plus,
  Shield,
  ShieldOff,
  Settings,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Lock,
  Unlock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Wifi,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"

import {
  fetchAllCards,
  createCardRequest,
  toggleCardStatus,
  type Card as CardType,
  type NewCardRequest,
} from "../../actions/card"
import { importAesGcmKeyFromBase64, isEncryptedJson, decryptAesGcmFromJson } from "@/lib/crypto"
import { getAccounts } from "../accounts/actions"

type CardWithUI = CardType & {
  holder?: string
  dailyLimit?: number
  monthlyLimit?: number
  balance?: number
  lastTransaction?: string
  isNumberVisible?: boolean
}

type Account = {
  id: string
  accountId: string
  accountNumber: string
  accountName: string
  currency: string
  bookBalance: string
  availableBalance: string
  status: string
  type: string
}

export default function CardsPage() {
  const [cards, setCards] = useState<CardWithUI[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("ACTIF")

  const [accounts, setAccounts] = useState<Account[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState<boolean>(false)

  // New card request state
  const [showNewCardForm, setShowNewCardForm] = useState<boolean>(false)
  const [newCardData, setNewCardData] = useState<Pick<NewCardRequest, "typCard"> & { selectedAccount?: string }>({
    typCard: "",
    selectedAccount: "",
  })
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  // Card management state
  const [selectedCard, setSelectedCard] = useState<CardWithUI | null>(null)
  const [showLimitsDialog, setShowLimitsDialog] = useState<boolean>(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState<boolean>(false)
  const [showSecurityDialog, setShowSecurityDialog] = useState<boolean>(false)
  const [tempLimits, setTempLimits] = useState({ daily: 0, monthly: 0 })

  const [loadingCardId, setLoadingCardId] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [blockingCardId, setBlockingCardId] = useState<string | null>(null)

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    cardId: string
    currentStatus: string
    action: "block" | "unblock"
  }>({
    isOpen: false,
    cardId: "",
    currentStatus: "",
    action: "block",
  })

  // Carousel state
  const [currentCardIndex, setCurrentCardIndex] = useState(0)

  // Carousel navigation functions
  const nextCard = () => {
    const filteredCards = cards.filter((card) => {
      if (statusFilter === "all") return true
      return card.status?.toUpperCase() === statusFilter.toUpperCase()
    })
    setCurrentCardIndex((prev) => (prev + 1) % filteredCards.length)
  }

  const prevCard = () => {
    const filteredCards = cards.filter((card) => {
      if (statusFilter === "all") return true
      return card.status?.toUpperCase() === statusFilter.toUpperCase()
    })
    setCurrentCardIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length)
  }

  async function loadAccounts() {
    setLoadingAccounts(true)
    try {
      const accountsData = await getAccounts()
      setAccounts(accountsData || [])
    } catch (e: any) {
      console.error("[v0] Erreur lors du chargement des comptes:", e)
      setAccounts([])
    } finally {
      setLoadingAccounts(false)
    }
  }

  async function loadCards() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetchAllCards()
      const secureMode = (process.env.NEXT_PUBLIC_PORTAL_SECURE_MODE || "false").toLowerCase() === "true"
      const keyB64 = process.env.NEXT_PUBLIC_PORTAL_KEY_B64 || ""
      const logDebug = (process.env.NEXT_PUBLIC_LOG_LEVEL || "").toLowerCase() === "debug"
      let key: CryptoKey | null = null
      try {
        if (secureMode && keyB64) key = await importAesGcmKeyFromBase64(keyB64)
      } catch (_) {
        key = null
      }
      if (logDebug) console.log("[CARDS/UI] secure:", secureMode, "key:", !!key, "rows:", response.rows.length)

      const decryptedRows = key
        ? await Promise.all(
            response.rows.map(async (c: any) => {
              const out: any = { ...c }
              try {
                if (isEncryptedJson(out.numCard))
                  out.numCard = await decryptAesGcmFromJson(out.numCard, key as CryptoKey)
                if (isEncryptedJson(out.accountNumber))
                  out.accountNumber = await decryptAesGcmFromJson(out.accountNumber, key as CryptoKey)
                if (isEncryptedJson(out.typCard))
                  out.typCard = await decryptAesGcmFromJson(out.typCard, key as CryptoKey)
                if (isEncryptedJson(out.status)) out.status = await decryptAesGcmFromJson(out.status, key as CryptoKey)
                if (isEncryptedJson(out.dateEmission))
                  out.dateEmission = await decryptAesGcmFromJson(out.dateEmission, key as CryptoKey)
                if (isEncryptedJson(out.dateExpiration))
                  out.dateExpiration = await decryptAesGcmFromJson(out.dateExpiration, key as CryptoKey)
              } catch (_) {}
              if (logDebug)
                console.log("[CARDS/UI] row:", {
                  id: out.id,
                  clientId: out.clientId,
                  numType: typeof out.numCard,
                  accType: typeof out.accountNumber,
                })
              out.numCard = typeof out.numCard === "string" ? out.numCard : ""
              out.accountNumber = typeof out.accountNumber === "string" ? out.accountNumber : ""
              out.typCard = typeof out.typCard === "string" ? out.typCard : ""
              out.status = typeof out.status === "string" ? out.status : ""
              return out
            }),
          )
        : response.rows

      const enhancedCards = decryptedRows.map((card) => ({
        ...card,
        holder: "MAMADOU DIALLO", // Default holder name
        dailyLimit: 500000,
        monthlyLimit: 2000000,
        balance: 1250000,
        lastTransaction: "Achat chez Carrefour - 45,000 FCFA",
        isNumberVisible: false,
      }))
      if (logDebug) console.log("[CARDS/UI] final rows:", enhancedCards.length)
      setCards(enhancedCards)
      setTotal(response.count)
    } catch (e: any) {
      setError(e?.message ?? String(e))
      setCards([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  async function handleNewCardRequest() {
    if (!newCardData.selectedAccount) {
      setSubmitError("Veuillez sélectionner un compte")
      return
    }

    if (!newCardData.typCard.trim()) {
      setSubmitError("Veuillez sélectionner un type de carte")
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      const selectedAccount = accounts.find((acc) => acc.id === newCardData.selectedAccount)

      await createCardRequest({
        typCard: newCardData.typCard,
        clientId: "AUTO",
        accountNumber: selectedAccount?.accountNumber || "",
      })
      setSubmitSuccess("Demande de carte créée avec succès !")
      setNewCardData({ typCard: "", selectedAccount: "" })
      setShowNewCardForm(false)
      await loadCards()
    } catch (e: any) {
      setSubmitError(e?.message ?? "Erreur lors de la création de la demande")
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleCardStatus = async (cardId: string, currentStatus: string) => {
    setBlockingCardId(cardId)
    try {
      const result = await toggleCardStatus(cardId, currentStatus)

      if (result.success) {
        toast({
          title: "Succès",
          description: result.message,
        })
        // Refresh the cards list
        await loadCards()
      } else {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du statut",
        variant: "destructive",
      })
    } finally {
      setBlockingCardId(null)
      setConfirmDialog({ isOpen: false, cardId: "", currentStatus: "", action: "block" })
    }
  }

  const openConfirmDialog = (cardId: string, currentStatus: string) => {
    const action = currentStatus === "ACTIF" ? "block" : "unblock"
    setConfirmDialog({
      isOpen: true,
      cardId,
      currentStatus,
      action,
    })
  }

  const handleConfirm = () => {
    handleToggleCardStatus(confirmDialog.cardId, confirmDialog.currentStatus)
  }

  function getAvailableCardTypes(accountId: string) {
    const account = accounts.find((acc) => acc.id === accountId)
    if (!account) return []

    // Define card types based on account type and currency
    const allCardTypes = [
      {
        type: "DEBIT",
        name: "Carte de Débit",
        color: "bg-gradient-to-r from-green-500 to-green-700",
        advantages: ["Accès aux DAB", "Paiements en magasin", "Plafond quotidien flexible"],
        icon: <CreditCard className="w-8 h-8" />,
      },
      {
        type: "CREDIT",
        name: "Carte de Crédit",
        color: "bg-gradient-to-r from-blue-500 to-blue-700",
        advantages: ["Crédit renouvelable", "Paiements différés", "Assurance voyage"],
        icon: <DollarSign className="w-8 h-8" />,
      },
      {
        type: "PREPAID",
        name: "Carte Prépayée",
        color: "bg-gradient-to-r from-purple-500 to-purple-700",
        advantages: ["Contrôle des dépenses", "Rechargeable", "Idéale pour les jeunes"],
        icon: <Shield className="w-8 h-8" />,
      },
      {
        type: "GOLD",
        name: "Carte Gold",
        color: "bg-gradient-to-r from-yellow-400 to-yellow-600",
        advantages: ["Services premium", "Plafonds élevés", "Assistance 24h/7j"],
        icon: <CheckCircle className="w-8 h-8" />,
      },
      {
        type: "PLATINUM",
        name: "Carte Platinum",
        color: "bg-gradient-to-r from-gray-400 to-gray-600",
        advantages: ["Services VIP", "Plafonds illimités", "Conciergerie privée"],
        icon: <Settings className="w-8 h-8" />,
      },
    ]

    // Filter card types based on account type and status
    if (account.status !== "ACTIF") {
      return [] // No cards for inactive accounts
    }

    // Basic cards for all active accounts
    const availableTypes = allCardTypes.filter((cardType) => ["DEBIT", "PREPAID"].includes(cardType.type))

    // Credit cards only for current accounts with sufficient balance
    if (account.type === "CURRENT" && Number.parseFloat(account.availableBalance) >= 1000000) {
      availableTypes.push(allCardTypes.find((ct) => ct.type === "CREDIT")!)
    }

    // Premium cards for accounts with high balance
    if (Number.parseFloat(account.availableBalance) >= 5000000) {
      availableTypes.push(allCardTypes.find((ct) => ct.type === "GOLD")!)
    }

    if (Number.parseFloat(account.availableBalance) >= 10000000) {
      availableTypes.push(allCardTypes.find((ct) => ct.type === "PLATINUM")!)
    }

    return availableTypes
  }

  function toggleCardNumberVisibility(cardId: string) {
    setCards((prev) =>
      prev.map((card) => (card.id === cardId ? { ...card, isNumberVisible: !card.isNumberVisible } : card)),
    )
  }

  function getCardTypeColor(type: string) {
    if (!type || typeof type !== "string") {
      return "bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500"
    }

    switch (type.toUpperCase()) {
      case "GOLD":
        return "bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500"
      case "PLATINUM":
        return "bg-gradient-to-br from-slate-600 via-slate-500 to-gray-500"
      case "CREDIT":
        return "bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-500"
      case "DEBIT":
        return "bg-gradient-to-br from-emerald-600 via-green-500 to-teal-500"
      default:
        return "bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500"
    }
  }

  function getStatusBadge(status: string) {
    if (!status || typeof status !== "string") {
      return <Badge variant="secondary">Inconnu</Badge>
    }

    switch (status.toUpperCase()) {
      case "ACTIF":
      case "ACTIF":
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>
      case "BLOCKED":
      case "BLOQUE":
        return <Badge className="bg-red-100 text-red-800">Bloqué</Badge>
      case "EXPIRED":
      case "EXPIRE":
        return <Badge className="bg-gray-100 text-gray-800">Expiré</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  function formatCardNumber(number: string | number, isVisible: boolean) {
    if (!number) return "****"
    const numStr = String(number)
    if (isVisible) return numStr
    return numStr
      .replace(/(.{4})/g, "$1 ")
      .replace(/\d(?=\d{4})/g, "*")
      .trim()
  }

  function formatAmount(amount: number) {
    return new Intl.NumberFormat("fr-FR").format(amount)
  }

  useEffect(() => {
    if (submitSuccess) {
      const timer = setTimeout(() => {
        setSubmitSuccess(null)
      }, 8000)

      return () => clearTimeout(timer)
    }
  }, [submitSuccess])

  useEffect(() => {
    loadCards()
    loadAccounts()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mt-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-primary">Mes Cartes</h1>
          <p className="text-sm text-muted-foreground">Gérez vos cartes bancaires et leurs paramètres</p>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIF">Actif</SelectItem>
              <SelectItem value="BLOCKED">Bloqué</SelectItem>
              <SelectItem value="EXPIRED">Expiré</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={loadCards} disabled={loading || isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading || isRefreshing ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>

        {/* Success/Error Messages */}
        {submitSuccess && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{submitSuccess}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Cards Display */}
        <div className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-64 animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-full bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : cards.length > 0 ? (
            <div className="relative">
              {(() => {
                const filteredCards = cards.filter((card) => {
                  if (statusFilter === "all") return true
                  return card.status?.toUpperCase() === statusFilter.toUpperCase()
                })

                if (filteredCards.length === 0) {
                  const statusLabels: Record<string, string> = {
                    all: "",
                    ACTIF: "actives",
                    BLOCKED: "bloquées",
                    EXPIRED: "expirées",
                  }
                  const statusLabel = statusLabels[statusFilter] || ""

                  return (
                    <div className="col-span-full">
                      <Card className="p-12 text-center">
                        <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune carte {statusLabel}</h3>
                        <p className="text-gray-500">
                          {statusFilter === "all"
                            ? "Vous n'avez pas encore de carte."
                            : "Vous n'avez pas de carte avec ce statut."}
                        </p>
                      </Card>
                    </div>
                  )
                }

                const card = filteredCards[currentCardIndex]
                
                return (
                  <>
                    {/* Carousel Navigation */}
                    {filteredCards.length > 1 && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={prevCard}
                          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full shadow-lg bg-transparent"
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={nextCard}
                          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full shadow-lg bg-transparent"
                        >
                          <ChevronRight className="h-6 w-6" />
                        </Button>
                      </>
                    )}

                    {/* Centered Card Display */}
                    <div className="flex justify-center px-16">
                      <div className="w-full max-w-md">
                        <Card className="overflow-hidden shadow-2xl">
                          {/* Card Visual with realistic credit card design */}
                          <div className={`${getCardTypeColor(card.typCard)} p-8 text-white relative aspect-[1.586/1] flex flex-col justify-between`}>
                            {/* Top Section */}
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="text-xs opacity-90 uppercase tracking-wider font-semibold">
                                  BNG Bank
                                </div>
                                <div className="text-sm opacity-80">{card.typCard}</div>
                              </div>
                              {getStatusBadge(card.status)}
                            </div>

                            {/* EMV Chip and Contactless */}
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-10 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-md opacity-90 shadow-lg"></div>
                              <Wifi className="w-5 h-5 rotate-90 opacity-80" />
                            </div>

                            {/* Card Number */}
                            <div className="space-y-6">
                              <div className="flex items-center justify-between">
                                <div className="font-mono text-xl tracking-widest">
                                  {formatCardNumber(card.numCard, card.isNumberVisible || false)}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleCardNumberVisibility(card.id)}
                                  className="text-white hover:bg-white/20"
                                >
                                  {card.isNumberVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                              </div>

                              {/* Cardholder and Expiry */}
                              <div className="flex justify-between items-end">
                                <div>
                                  <div className="text-[10px] opacity-75 uppercase tracking-wide mb-1">
                                    Titulaire
                                  </div>
                                  <div className="font-semibold uppercase tracking-wide text-sm">
                                    {card.holder}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-[10px] opacity-75 uppercase tracking-wide mb-1">
                                    Expire
                                  </div>
                                  <div className="font-semibold text-sm">{card.dateExpiration}</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Card Info */}
                          <CardContent className="p-6 space-y-4">
                            {/* Card Actions */}
                            <div className="grid grid-cols-2 gap-3">
                              {card.status?.toUpperCase() === "ACTIF" ? (
                                <Button
                                  variant="destructive"
                                  onClick={() => openConfirmDialog(card.id, "BLOCKED")}
                                  disabled={blockingCardId === card.id}
                                  className="w-full"
                                >
                                  {blockingCardId === card.id ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Blocage...
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="w-4 h-4 mr-2" />
                                      Bloquer
                                    </>
                                  )}
                                </Button>
                              ) : card.status?.toUpperCase() === "BLOCKED" ? (
                                <Button
                                  variant="default"
                                  onClick={() => openConfirmDialog(card.id, "ACTIF")}
                                  disabled={blockingCardId === card.id}
                                  className="w-full bg-green-600 hover:bg-green-700"
                                >
                                  {blockingCardId === card.id ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Déblocage...
                                    </>
                                  ) : (
                                    <>
                                      <Unlock className="w-4 h-4 mr-2" />
                                      Débloquer
                                    </>
                                  )}
                                </Button>
                              ) : null}
                              <Button variant="outline" className="w-full bg-transparent">
                                <Settings className="w-4 h-4 mr-2" />
                                Paramètres
                              </Button>
                            </div>

                            {/* Card Details */}
                            {card.dailyLimit && (
                              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600">Limite quotidienne</span>
                                  <span className="font-semibold">{formatAmount(card.dailyLimit)} FCFA</span>
                                </div>
                                {card.monthlyLimit && (
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Limite mensuelle</span>
                                    <span className="font-semibold">{formatAmount(card.monthlyLimit)} FCFA</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Carousel Indicators */}
                        {filteredCards.length > 1 && (
                          <div className="flex justify-center gap-2 mt-6">
                            {filteredCards.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentCardIndex(index)}
                                className={`h-2 rounded-full transition-all ${
                                  index === currentCardIndex ? "w-8 bg-primary" : "w-2 bg-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune carte trouvée</h3>
              <p className="text-gray-500 mb-4">Vous n'avez pas encore de carte bancaire.</p>
              <Link href="/cartes/demande">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Demander une carte
                </Button>
              </Link>
            </Card>
          )}

        {/* New Card Request Dialog */}
        <Dialog open={showNewCardForm} onOpenChange={setShowNewCardForm}>
          <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Demande de nouvelle carte</DialogTitle>
              <DialogDescription>
                Sélectionnez d'abord le compte puis choisissez le type de carte
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-y-auto flex-1 pr-2">
              {submitError && (
                <Alert className="border-red-200 bg-red-50 mb-4">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{submitError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-6">
                <div>
                  <Label htmlFor="account-select">Sélectionner le compte *</Label>
                  <Select
                    value={newCardData.selectedAccount}
                    onValueChange={(value) =>
                      setNewCardData((prev) => ({ ...prev, selectedAccount: value, typCard: "" }))
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Choisissez le compte pour la carte" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingAccounts ? (
                        <SelectItem value="loading" disabled>
                          Chargement des comptes...
                        </SelectItem>
                      ) : accounts.length > 0 ? (
                        accounts
                          .filter((account) => account.status === "ACTIF") // Only active accounts
                          .map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{account.accountName}</span>
                                <span className="text-sm text-gray-500">
                                  {account.accountNumber} • {formatAmount(Number.parseFloat(account.availableBalance))}{" "}
                                  {account.currency}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                      ) : (
                        <SelectItem value="no-accounts" disabled>
                          Aucun compte disponible
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {newCardData.selectedAccount && (
                  <div>
                    <Label>Types de cartes disponibles pour ce compte</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {getAvailableCardTypes(newCardData.selectedAccount).map((cardType) => (
                        <Card
                          key={cardType.type}
                          className={`cursor-pointer transition-all hover:scale-105 border-2 ${
                            newCardData.typCard === cardType.type
                              ? "border-blue-500 ring-2 ring-blue-200"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => setNewCardData((prev) => ({ ...prev, typCard: cardType.type }))}
                        >
                          <div className={`${cardType.color} p-4 text-white`}>
                            <div className="flex items-center justify-between mb-2">
                              {cardType.icon}
                              {newCardData.typCard === cardType.type && <CheckCircle className="w-6 h-6 text-white" />}
                            </div>
                            <h3 className="font-bold text-lg">{cardType.name}</h3>
                          </div>
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-gray-700">Avantages :</h4>
                              <ul className="space-y-1">
                                {cardType.advantages.map((advantage, index) => (
                                  <li key={index} className="text-sm text-gray-600 flex items-center">
                                    <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                                    {advantage}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {getAvailableCardTypes(newCardData.selectedAccount).length === 0 && (
                      <Alert className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Aucun type de carte n'est disponible pour ce compte. Vérifiez le statut et le solde du compte.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t mt-4">
              <Button
                onClick={handleNewCardRequest}
                disabled={submitting || !newCardData.typCard || !newCardData.selectedAccount}
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Envoyer la demande
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowNewCardForm(false)
                  setNewCardData({ typCard: "", selectedAccount: "" })
                  setSubmitError(null)
                }}
                disabled={submitting}
                className="flex-1"
              >
                Annuler
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Total cartes</div>
                  <div className="text-2xl font-bold">{total}</div>
                </div>
                <CreditCard className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Cartes actives</div>
                  <div className="text-2xl font-bold text-green-600">
                    {cards.filter((c) => typeof c.status === "string" && c.status.toUpperCase() === "ACTIF").length}
                  </div>
                </div>
                <Shield className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Cartes bloquées</div>
                  <div className="text-2xl font-bold text-red-600">
                    {cards.filter((c) => typeof c.status === "string" && c.status.toUpperCase() === "BLOCKED").length}
                  </div>
                </div>
                <ShieldOff className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card></Card>
        </div>
      </div>

      <AlertDialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) => !open && setConfirmDialog({ ...confirmDialog, isOpen: false })}
      >
        <AlertDialogContent onInteractOutside={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === "block" ? "Bloquer la carte" : "Débloquer la carte"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === "block"
                ? "Êtes-vous sûr de vouloir bloquer cette carte ? Vous pourrez la débloquer plus tard."
                : "Êtes-vous sûr de vouloir débloquer cette carte ? Elle redeviendra active."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )\
}
