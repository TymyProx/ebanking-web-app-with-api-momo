"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  CreditCard,
  Plus,
  Shield,
  ShieldOff,
  Settings,
  AlertTriangle,
  Phone,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
} from "lucide-react"

import { fetchAllCards, createCardRequest, type Card as CardType, type NewCardRequest } from "../../actions/card"
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
      //console.log("[v0] Type de carte sélectionné:", newCardData.typCard)
      //console.log("[v0] Compte sélectionné:", newCardData.selectedAccount)

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
      //console.log("[v0] Erreur lors de la création:", e)
      setSubmitError(e?.message ?? "Erreur lors de la création de la demande")
    } finally {
      setSubmitting(false)
    }
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

  function formatCardNumber(number: string, isVisible: boolean) {
    if (!number) return "****"
    if (isVisible) return number
    return number
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
    <div className="mt-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">Mes Cartes</h1>
        <p className="text-sm text-muted-foreground">Gérez vos cartes bancaires et leurs paramètres</p>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3">
        <div className="flex gap-2">
          <Button onClick={() => setShowNewCardForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle carte
          </Button>
          <Button variant="outline" onClick={loadCards} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
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

      {/* Cards Grid */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Card key={card.id} className="overflow-hidden">
              {/* Card Visual */}
              <div className={`${getCardTypeColor(card.typCard)} p-6 text-white relative`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="text-sm opacity-90">{card.typCard}</div>
                  {getStatusBadge(card.status)}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-lg tracking-wider">
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

                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-xs opacity-75">Titulaire</div>
                      <div className="font-medium">{card.holder}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs opacity-75">Expire</div>
                      <div className="font-medium">{card.dateExpiration}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Info */}
              <CardContent className="p-4 space-y-4">
                {/* <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Plafond jour</div>
                    <div className="font-medium">{formatAmount(card.dailyLimit || 0)} GNF</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Plafond mois</div>
                    <div className="font-medium">{formatAmount(card.monthlyLimit || 0)} GNF</div>
                  </div>
                </div>

                <div className="text-sm">
                  <div className="text-gray-500">Dernière transaction</div>
                  <div className="font-medium">{card.lastTransaction}</div>
                </div> */}

                {/* Action Buttons */}
                {/* <div className="flex gap-2">
                  {card.status?.toUpperCase() === "ACTIF" ? (
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Lock className="w-4 h-4 mr-1" />
                      Bloquer
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Unlock className="w-4 h-4 mr-1" />
                      Débloquer
                    </Button>
                  )}

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedCard(card)}>
                        <Settings className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Gestion de la carte</DialogTitle>
                        <DialogDescription>
                          {card.typCard} - {formatCardNumber(card.numCard, false)}
                        </DialogDescription>
                      </DialogHeader>

                      <Tabs defaultValue="limits" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="limits">Plafonds</TabsTrigger>
                          <TabsTrigger value="security">Sécurité</TabsTrigger>
                          <TabsTrigger value="history">Historique</TabsTrigger>
                        </TabsList>

                        <TabsContent value="limits" className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="daily-limit">Plafond journalier (GNF)</Label>
                              <Input
                                id="daily-limit"
                                type="number"
                                defaultValue={card.dailyLimit}
                                onChange={(e) => setTempLimits((prev) => ({ ...prev, daily: Number(e.target.value) }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="monthly-limit">Plafond mensuel (GNF)</Label>
                              <Input
                                id="monthly-limit"
                                type="number"
                                defaultValue={card.monthlyLimit}
                                onChange={(e) =>
                                  setTempLimits((prev) => ({ ...prev, monthly: Number(e.target.value) }))
                                }
                              />
                            </div>
                          </div>
                          <Button className="w-full">
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier les plafonds
                          </Button>
                        </TabsContent>

                        <TabsContent value="security" className="space-y-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">Notifications SMS</div>
                                <div className="text-sm text-gray-500">Recevoir des SMS pour chaque transaction</div>
                              </div>
                              <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">Paiements en ligne</div>
                                <div className="text-sm text-gray-500">Autoriser les achats sur internet</div>
                              </div>
                              <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">Paiements à l'étranger</div>
                                <div className="text-sm text-gray-500">Autoriser les transactions hors Guinée</div>
                              </div>
                              <Switch />
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="history" className="space-y-4">
                          <div className="space-y-3">
                            {[
                              { date: "2024-01-15", description: "Achat Carrefour", amount: -45000, type: "debit" },
                              { date: "2024-01-14", description: "Retrait DAB", amount: -50000, type: "withdrawal" },
                              { date: "2024-01-13", description: "Virement reçu", amount: 200000, type: "credit" },
                            ].map((transaction, index) => (
                              <div key={index} className="flex items-center justify-between p-3 border rounded">
                                <div>
                                  <div className="font-medium">{transaction.description}</div>
                                  <div className="text-sm text-gray-500">{transaction.date}</div>
                                </div>
                                <div
                                  className={`font-medium ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}
                                >
                                  {transaction.amount > 0 ? "+" : ""}
                                  {formatAmount(Math.abs(transaction.amount))} GNF
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                </div> */}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune carte trouvée</h3>
          <p className="text-gray-500 mb-4">Vous n'avez pas encore de carte bancaire.</p>
          <Button onClick={() => setShowNewCardForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Demander une carte
          </Button>
        </Card>
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

      {/* Emergency Actions */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Actions d'urgence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 bg-transparent">
              <ShieldOff className="w-4 h-4 mr-2" />
              Opposition générale
            </Button>
            <Button variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50 bg-transparent">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Signaler une fraude
            </Button>
            <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent">
              <Phone className="w-4 h-4 mr-2" />
              Contacter le support
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  {cards.filter((c) => c.status?.toUpperCase() === "ACTIF").length}
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
                  {cards.filter((c) => c.status?.toUpperCase() === "BLOCKED").length}
                </div>
              </div>
              <ShieldOff className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Plafond total</div>
                <div className="text-2xl font-bold">
                  {formatAmount(cards.reduce((sum, card) => sum + (card.dailyLimit || 0), 0))}
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
