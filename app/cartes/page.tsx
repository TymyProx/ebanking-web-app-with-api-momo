"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  CreditCard,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Settings,
  RefreshCw,
  Plus,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Wifi,
  DollarSign,
  Shield,
  AlertTriangle,
  Clock,
  ShieldOff,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { toggleCardStatus } from "@/actions/card"

import { fetchAllCards, createCardRequest, type Card as CardType, type NewCardRequest } from "../../actions/card"
import { importAesGcmKeyFromBase64, isEncryptedJson, decryptAesGcmFromJson } from "@/lib/crypto"
import { getAccounts } from "../accounts/actions"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

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
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0)

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

  const toast = useToast()

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
    setLoadingCardId(cardId)
    try {
      const result = await toggleCardStatus(cardId, currentStatus)

      if (result.success) {
        toast.toast({
          title: "Succès",
          description: result.message,
        })
        // Refresh the cards list
        await loadCards()
      } else {
        toast.toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast.toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du statut",
        variant: "destructive",
      })
    } finally {
      setLoadingCardId(null)
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
      return "bg-gradient-to-r from-gray-500 to-gray-700"
    }

    switch (type.toUpperCase()) {
      case "GOLD":
        return "bg-gradient-to-r from-yellow-400 to-yellow-600"
      case "PLATINUM":
        return "bg-gradient-to-r from-gray-400 to-gray-600"
      case "CREDIT":
        return "bg-gradient-to-r from-blue-500 to-blue-700"
      case "DEBIT":
        return "bg-gradient-to-r from-green-500 to-green-700"
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-700"
    }
  }

  function getStatusBadge(status: string) {
    if (!status || typeof status !== "string") {
      return <Badge variant="secondary">Inconnu</Badge>
    }

    switch (status.toUpperCase()) {
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
    <div className="flex min-h-screen flex-col">
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
              <SelectItem value="all">Tous</SelectItem>
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

        {loading || isRefreshing ? (
          <div className="flex justify-center items-center py-12">
            <Card className="w-full max-w-md h-64 animate-pulse">
              <CardContent className="p-6">
                <div className="h-full bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
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
                  <div className="flex justify-center py-12">
                    <Card className="w-full max-w-md p-12 text-center">
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

              const currentCard = filteredCards[currentCardIndex]
              const gradients = [
                "bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500",
                "bg-gradient-to-br from-blue-600 via-blue-500 to-teal-500",
                "bg-gradient-to-br from-orange-600 via-red-500 to-pink-600",
                "bg-gradient-to-br from-green-600 via-emerald-500 to-teal-500",
                "bg-gradient-to-br from-indigo-600 via-purple-500 to-pink-500",
              ]
              const cardGradient = gradients[currentCardIndex % gradients.length]

              return (
                <div className="space-y-6">
                  {/* Carousel Container */}
                  <div className="flex justify-center items-center gap-4">
                    {/* Previous Button */}
                    {filteredCards.length > 1 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setCurrentCardIndex((prev) => (prev === 0 ? filteredCards.length - 1 : prev - 1))
                        }
                        className="shrink-0"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                    )}

                    {/* Card Display */}
                    <div className="w-full max-w-md">
                      <Card className="overflow-hidden shadow-2xl">
                        {/* Realistic Card Design with Gradient */}
                        <div
                          className={`${cardGradient} p-8 text-white relative min-h-[240px] flex flex-col justify-between`}
                        >
                          {/* Card Type and Status */}
                          <div className="flex justify-between items-start">
                            <div className="text-sm font-medium opacity-90 uppercase tracking-wide">
                              {currentCard.typCard}
                            </div>
                            {getStatusBadge(currentCard.status)}
                          </div>

                          {/* EMV Chip and Contactless */}
                          <div className="flex items-center gap-4 my-4">
                            <div className="w-12 h-10 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-md shadow-lg flex items-center justify-center">
                              <div className="grid grid-cols-3 gap-[2px]">
                                {[...Array(9)].map((_, i) => (
                                  <div key={i} className="w-1 h-1 bg-yellow-900/30 rounded-full" />
                                ))}
                              </div>
                            </div>
                            <Wifi className="w-6 h-6 rotate-90 opacity-90" />
                          </div>

                          {/* Card Number */}
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <div className="font-mono text-xl tracking-[0.3em] font-light">
                                {formatCardNumber(currentCard.numCard, currentCard.isNumberVisible || false)}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleCardNumberVisibility(currentCard.id)}
                                className="text-white hover:bg-white/20 shrink-0"
                              >
                                {currentCard.isNumberVisible ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </Button>
                            </div>

                            {/* Holder and Expiry */}
                            <div className="flex justify-between items-end">
                              <div>
                                <div className="text-[10px] uppercase opacity-75 tracking-wider mb-1">Titulaire</div>
                                <div className="font-medium uppercase tracking-wide text-sm">{currentCard.holder}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-[10px] uppercase opacity-75 tracking-wider mb-1">Expire</div>
                                <div className="font-medium tracking-wider text-sm">{currentCard.dateExpiration}</div>
                              </div>
                            </div>
                          </div>

                          {/* Decorative Pattern */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
                          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
                        </div>

                        {/* Card Actions */}
                        <CardContent className="p-4 space-y-4 bg-white">
                          <div className="flex gap-2">
                            {currentCard.status?.toUpperCase() === "ACTIF" ? (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openConfirmDialog(currentCard.id, currentCard.status)}
                                disabled={loadingCardId === currentCard.id}
                                className="flex-1"
                              >
                                {loadingCardId === currentCard.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Lock className="mr-2 h-4 w-4" />
                                    Bloquer
                                  </>
                                )}
                              </Button>
                            ) : currentCard.status?.toUpperCase() === "BLOCKED" ||
                              currentCard.status?.toUpperCase() === "BLOQUE" ? (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => openConfirmDialog(currentCard.id, currentCard.status)}
                                disabled={loadingCardId === currentCard.id}
                                className="flex-1"
                              >
                                {loadingCardId === currentCard.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Unlock className="mr-2 h-4 w-4" />
                                    Débloquer
                                  </>
                                )}
                              </Button>
                            ) : null}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setSelectedCard(currentCard)}>
                                  <Settings className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Gestion de la carte</DialogTitle>
                                  <DialogDescription>
                                    {currentCard.typCard} - {formatCardNumber(currentCard.numCard, false)}
                                  </DialogDescription>
                                </DialogHeader>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Next Button */}
                    {filteredCards.length > 1 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setCurrentCardIndex((prev) => (prev === filteredCards.length - 1 ? 0 : prev + 1))
                        }
                        className="shrink-0"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    )}
                  </div>

                  {/* Pagination Dots */}
                  {filteredCards.length > 1 && (
                    <div className="flex justify-center gap-2">
                      {filteredCards.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentCardIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentCardIndex ? "bg-primary w-8" : "bg-gray-300 hover:bg-gray-400"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        ) : (
          <div className="flex justify-center py-12">
            <Card className="w-full max-w-md p-12 text-center">
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
          </div>
        )}

        {/* New Card Request Dialog */}
        <Dialog open={showNewCardForm} onOpenChange={setShowNewCardForm}>
          <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Demande de nouvelle carte</DialogTitle>
              <DialogDescription>Sélectionnez d'abord le compte puis choisissez le type de carte</DialogDescription>
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
  )
}
