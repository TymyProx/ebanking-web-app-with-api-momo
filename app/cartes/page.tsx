"use client"

import { cn } from "@/lib/utils"

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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CreditCard, Plus, Eye, EyeOff, Lock, Unlock, AlertCircle, ChevronLeft, Wifi, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { fetchAllCards, blockCard, unblockCard } from "./actions"
import { safeString } from "@/lib/safe-render"
import { getAccounts, createCardRequest } from "@/lib/api" // Added imports for getAccounts and createCardRequest

type CardWithVisibility = {
  id: string
  numCard: string
  typCard: string
  status: string
  dateExpiration: string
  holder?: string
  isNumberVisible?: boolean
  accountNumber: string
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
  const [cards, setCards] = useState<CardWithVisibility[]>([])
  const [filteredCards, setFilteredCards] = useState<CardWithVisibility[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("ACTIF")
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0)
  const [isFading, setIsFading] = useState<boolean>(false)

  const [accounts, setAccounts] = useState<Account[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState<boolean>(false)

  const [showNewCardForm, setShowNewCardForm] = useState<boolean>(false)
  const [newCardData, setNewCardData] = useState<{ typCard: string; selectedAccount?: string }>({
    typCard: "",
    selectedAccount: "",
  })
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const [selectedCard, setSelectedCard] = useState<CardWithVisibility | null>(null)
  const [showLimitsDialog, setShowLimitsDialog] = useState<boolean>(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState<boolean>(false)
  const [showSecurityDialog, setShowSecurityDialog] = useState<boolean>(false)
  const [tempLimits, setTempLimits] = useState({ daily: 0, monthly: 0 })

  const [loadingCardId, setLoadingCardId] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  const [isFlipped, setIsFlipped] = useState(false)

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

  useEffect(() => {
    async function loadCards() {
      try {
        setIsLoading(true)
        const response = await fetchAllCards()
        const cards = response.rows

        const mappedCards: CardWithVisibility[] = cards.map((card: any, index: number) => ({
          id: card.id || `card-${index}`,
          numCard: safeString(card.numCard) || "",
          typCard: safeString(card.typCard) || "DEBIT",
          status: safeString(card.status) || "EN_ATTENTE",
          dateExpiration: card.dateExpiration
            ? new Date(card.dateExpiration).toLocaleDateString("fr-FR", { month: "2-digit", year: "2-digit" })
            : "--/--",
          holder: card.titulaire_name || "CLIENT NAME",
          isNumberVisible: false,
          accountNumber: card.accountNumber,
        }))

        setCards(mappedCards)
        setTotal(response.count)

        const initialFiltered = mappedCards.filter((card) => {
          if (statusFilter === "all") return true
          return card.status?.toUpperCase() === statusFilter.toUpperCase()
        })
        setFilteredCards(initialFiltered)
      } catch (e: any) {
        setError(e?.message ?? String(e))
        setCards([])
        setFilteredCards([])
        setTotal(0)
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }

    loadCards()
  }, [])

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
      await fetchAllCards()
    } catch (e: any) {
      setSubmitError(e?.message ?? "Erreur lors de la création de la demande")
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleCardStatus = async (cardId: string, currentStatus: string) => {
    setLoadingCardId(cardId)
    try {
      const result = await (currentStatus === "ACTIF" ? blockCard : unblockCard)(cardId)

      if (result.success) {
        toast({
          title: "Succès",
          description: result.message,
        })
        await fetchAllCards()
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
        icon: <Plus className="w-8 h-8" />,
      },
      {
        type: "PREPAID",
        name: "Carte Prépayée",
        color: "bg-gradient-to-r from-purple-500 to-purple-700",
        advantages: ["Contrôle des dépenses", "Rechargeable", "Idéale pour les jeunes"],
        icon: <Eye className="w-8 h-8" />,
      },
      {
        type: "GOLD",
        name: "Carte Gold",
        color: "bg-gradient-to-r from-yellow-400 to-yellow-600",
        advantages: ["Services premium", "Plafonds élevés", "Assistance 24h/7j"],
        icon: <EyeOff className="w-8 h-8" />,
      },
      {
        type: "PLATINUM",
        name: "Carte Platinum",
        color: "bg-gradient-to-r from-gray-400 to-gray-600",
        advantages: ["Services VIP", "Plafonds illimités", "Conciergerie privée"],
        icon: <Lock className="w-8 h-8" />,
      },
    ]

    if (account.status !== "ACTIF") {
      return []
    }

    const availableTypes = allCardTypes.filter((cardType) => ["DEBIT", "PREPAID"].includes(cardType.type))

    if (account.type === "CURRENT" && Number.parseFloat(account.availableBalance) >= 1000000) {
      availableTypes.push(allCardTypes.find((ct) => ct.type === "CREDIT")!)
    }

    if (Number.parseFloat(account.availableBalance) >= 5000000) {
      availableTypes.push(allCardTypes.find((ct) => ct.type === "GOLD")!)
    }

    if (Number.parseFloat(account.availableBalance) >= 10000000) {
      availableTypes.push(allCardTypes.find((ct) => ct.type === "PLATINUM")!)
    }

    return availableTypes
  }

  function toggleCardNumberVisibility(cardId: string) {
    console.log("[v0] Toggling card number visibility for card:", cardId)
    setCards((prev) =>
      prev.map((card) => (card.id === cardId ? { ...card, isNumberVisible: !card.isNumberVisible } : card)),
    )
    setFilteredCards((prev) =>
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
    const safeStatus = safeString(status)
    if (!safeStatus || typeof safeStatus !== "string") {
      return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">Inconnu</span> // Placeholder for Badge component
    }

    switch (safeStatus.toUpperCase()) {
      case "ACTIF":
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Actif</span>
      case "BLOCKED":
      case "BLOQUE":
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded">Bloqué</span>
      case "EXPIRED":
      case "EXPIRE":
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">Expiré</span>
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">{safeStatus}</span>
    }
  }

  const formatCardNumber = (num: string, visible: boolean): string => {
    const safeNum = safeString(num)
    if (!safeNum || safeNum === "AUTO" || safeNum === "" || safeNum === "[Données chiffrées]")
      return "•••• •••• •••• ••••"

    if (visible) {
      const chunks = safeNum.match(/.{1,4}/g) || []
      return chunks.join(" ")
    }

    const last4 = safeNum.slice(-4)
    return `•••• •••• •••• ${last4}`
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount)
  }

  const toggleFlip = () => {
    console.log("[v0] Toggling card flip")
    setIsFlipped(!isFlipped)
  }

  const changeCard = (newIndex: number) => {
    console.log("[v0] Changing card to index:", newIndex)
    setIsFading(true)
    setTimeout(() => {
      setCurrentCardIndex(newIndex)
      setIsFading(false)
    }, 300)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchAllCards()
  }

  useEffect(() => {
    const initialFiltered = cards.filter((card) => {
      if (statusFilter === "all") return true
      return card.status?.toUpperCase() === statusFilter.toUpperCase()
    })
    setFilteredCards(initialFiltered)
    if (initialFiltered.length > 0) {
      setCurrentCardIndex(0)
    } else {
      setCurrentCardIndex(-1)
    }
  }, [statusFilter, cards])

  useEffect(() => {
    if (submitSuccess) {
      const timer = setTimeout(() => {
        setSubmitSuccess(null)
      }, 8000)

      return () => clearTimeout(timer)
    }
  }, [submitSuccess])

  useEffect(() => {
    loadAccounts()
  }, [])

  const currentCard = filteredCards[currentCardIndex]

  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col space-y-6">
        <div className="mt-6 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-primary">Mes Cartes</h1>
            <p className="text-sm text-muted-foreground">Gérez vos cartes bancaires et leurs paramètres</p>
          </div>

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

            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              size="sm"
              variant="outline"
              className="gap-2 bg-transparent"
            >
              <Loader2 className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              Actualiser
            </Button>
          </div>

          {submitSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <Unlock className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{submitSuccess}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Card className="w-full max-w-md h-64 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-full bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            </div>
          ) : filteredCards.length > 0 ? (
            <div className="relative">
              <div className="flex justify-center items-center gap-4">
                {filteredCards.length > 1 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          changeCard(currentCardIndex === 0 ? filteredCards.length - 1 : currentCardIndex - 1)
                        }}
                        className="shrink-0"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Carte précédente</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                <div className="w-full max-w-md perspective-1000 overflow-hidden">
                  <div
                    className={`relative w-full transform-style-3d cursor-pointer hover:scale-105 transition-all duration-300`}
                    onClick={toggleFlip}
                    style={{
                      transformStyle: "preserve-3d",
                      transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                      transition: "transform 0.6s ease-in-out",
                      opacity: isFading ? 0 : 1,
                    }}
                  >
                    <Card
                      className="overflow-hidden shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-shadow duration-300 backface-hidden"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <div
                        className={`${getCardTypeColor(currentCard.typCard)} p-8 text-white relative min-h-[240px] flex flex-col justify-between`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="text-sm font-medium opacity-90 uppercase tracking-wide">
                            {safeString(currentCard.typCard)}
                          </div>
                          {getStatusBadge(currentCard.status)}
                        </div>

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

                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <div className="font-mono text-xl tracking-[0.3em] font-light">
                              {formatCardNumber(safeString(currentCard.numCard), currentCard.isNumberVisible || false)}
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    console.log("[v0] Eye button clicked")
                                    e.stopPropagation()
                                    e.preventDefault()
                                    toggleCardNumberVisibility(currentCard.id)
                                  }}
                                  className="text-white hover:bg-white/20 shrink-0"
                                >
                                  {currentCard.isNumberVisible ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{currentCard.isNumberVisible ? "Masquer le numéro" : "Afficher le numéro"}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>

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

                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-transparent opacity-0 hover:opacity-10 transition-opacity duration-500 pointer-events-none" />
                      </div>
                    </Card>

                    <Card
                      className="overflow-hidden shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-shadow duration-300 absolute top-0 left-0 w-full backface-hidden"
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                    >
                      <div
                        className={`${getCardTypeColor(currentCard.typCard)} p-8 text-white relative min-h-[240px] flex flex-col justify-between`}
                      >
                        <div className="w-full h-12 bg-black/80 -mx-8 mb-6" />

                        <div className="bg-white/90 p-4 rounded space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600 uppercase">CVV</span>
                            <span className="font-mono text-lg text-gray-900">***</span>
                          </div>
                          <div className="text-[10px] text-gray-500">
                            Code de sécurité à 3 chiffres au dos de votre carte
                          </div>
                        </div>

                        <div className="space-y-2 text-xs opacity-90">
                          <p>Service Client: +226 25 XX XX XX</p>
                          <p>En cas de perte ou vol, appelez immédiatement</p>
                          <p className="text-[10px] opacity-75">Cette carte est la propriété de la BNG</p>
                        </div>

                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-transparent opacity-0 hover:opacity-10 transition-opacity duration-500 pointer-events-none" />
                      </div>
                    </Card>
                  </div>
                </div>

                {filteredCards.length > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    {filteredCards.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          changeCard(index)
                        }}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          index === currentCardIndex ? "w-8 bg-primary" : "w-2 bg-gray-300 hover:bg-gray-400"
                        }`}
                        aria-label={`Aller à la carte ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <Card className="max-w-md mx-auto">
                <CardContent className="space-y-4 pt-6 pb-6">
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
                      <Button variant="outline" size="sm" onClick={() => setSelectedCard(currentCard)}>
                        <Plus className="w-4 h-4" />
                      </Button>

                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Gestion de la carte</DialogTitle>
                          <DialogDescription>
                            {currentCard.typCard} - {formatCardNumber(currentCard.numCard, false)}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="p-4 flex justify-center items-center h-40">
                          <p className="text-muted-foreground">Options de gestion avancées à venir...</p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex justify-center py-12">
              <Card className="w-full max-w-md p-12 text-center">
                <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune carte trouvée</h3>
                <p className="text-gray-500 mb-4">Vous n'avez pas de carte {statusFilter.toLowerCase()}.</p>
              </Card>
            </div>
          )}

          <Dialog open={showNewCardForm} onOpenChange={setShowNewCardForm}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Demande de nouvelle carte</DialogTitle>
                <DialogDescription>Sélectionnez d'abord le compte puis choisissez le type de carte</DialogDescription>
              </DialogHeader>

              <div className="overflow-y-auto flex-1 pr-2">
                {submitError && (
                  <Alert className="border-red-200 bg-red-50 mb-4">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">{submitError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-6">
                  <div>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="account-select" className="block text-sm font-medium text-gray-700">
                          Sélectionner le compte *
                        </label>
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
                                .filter((account) => account.status === "ACTIF")
                                .map((account) => (
                                  <SelectItem key={account.id} value={account.id}>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{account.accountName}</span>
                                      <span className="text-sm text-gray-500">
                                        {account.accountNumber} •{" "}
                                        {formatAmount(Number.parseFloat(account.availableBalance))} {account.currency}
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
                          <label className="block text-sm font-medium text-gray-700">
                            Types de cartes disponibles pour ce compte
                          </label>
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
                                    {newCardData.typCard === cardType.type && <Unlock className="w-6 h-6 text-white" />}
                                  </div>
                                  <h3 className="font-bold text-lg">{cardType.name}</h3>
                                </div>
                                <CardContent className="p-4">
                                  <div className="space-y-2">
                                    <h4 className="font-medium text-sm text-gray-700">Avantages :</h4>
                                    <ul className="space-y-1">
                                      {cardType.advantages.map((advantage, index) => (
                                        <li key={index} className="text-sm text-gray-600 flex items-center">
                                          <Unlock className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
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
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                Aucun type de carte n'est disponible pour ce compte. Vérifiez le statut et le solde du
                                compte.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <DialogFooter className="flex gap-2 pt-4 border-t mt-4">
                    <Button
                      onClick={handleNewCardRequest}
                      disabled={submitting || !newCardData.typCard || !newCardData.selectedAccount}
                      className="flex-1"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
                  </DialogFooter>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
    </TooltipProvider>
  )
}
