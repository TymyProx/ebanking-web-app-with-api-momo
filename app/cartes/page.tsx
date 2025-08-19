"use client"

import { useState } from "react"
import { Card as UI_Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import {
  CreditCard,
  Lock,
  Unlock,
  Settings,
  Eye,
  EyeOff,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
} from "lucide-react"

interface Card {
  id: string
  number: string
  type: "visa" | "mastercard" | "amex"
  status: "active" | "blocked" | "expired" | "pending"
  expiryDate: string
  holder: string
  dailyLimit: number
  monthlyLimit: number
  balance: number
  lastTransaction: string
}

const mockCards: Card[] = [
  {
    id: "1",
    number: "4532 **** **** 1234",
    type: "visa",
    status: "active",
    expiryDate: "12/26",
    holder: "MAMADOU DIALLO",
    dailyLimit: 500000,
    monthlyLimit: 2000000,
    balance: 1250000,
    lastTransaction: "Achat chez Carrefour - 45,000 FCFA",
  },
  {
    id: "2",
    number: "5555 **** **** 9876",
    type: "mastercard",
    status: "blocked",
    expiryDate: "08/25",
    holder: "MAMADOU DIALLO",
    dailyLimit: 300000,
    monthlyLimit: 1500000,
    balance: 850000,
    lastTransaction: "Retrait DAB BNG Plateau - 50,000 FCFA",
  },
  {
    id: "3",
    number: "3782 **** **** 5678",
    type: "amex",
    status: "active",
    expiryDate: "03/27",
    holder: "MAMADOU DIALLO",
    dailyLimit: 1000000,
    monthlyLimit: 5000000,
    balance: 3200000,
    lastTransaction: "Paiement en ligne Amazon - 125,000 FCFA",
  },
]

const transactions = [
  { id: "1", cardId: "1", date: "2024-01-15", description: "Achat chez Carrefour", amount: -45000, type: "purchase" },
  { id: "2", cardId: "1", date: "2024-01-14", description: "Retrait DAB", amount: -100000, type: "withdrawal" },
  { id: "3", cardId: "2", date: "2024-01-13", description: "Paiement facture CIE", amount: -75000, type: "bill" },
  { id: "4", cardId: "3", date: "2024-01-12", description: "Achat en ligne Amazon", amount: -125000, type: "online" },
  { id: "5", cardId: "1", date: "2024-01-11", description: "Virement reçu", amount: 200000, type: "transfer" },
]

export default function CartesPage() {
  const [cards, setCards] = useState<Card[]>(mockCards)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [showCardNumber, setShowCardNumber] = useState<string | null>(null)
  const [newLimits, setNewLimits] = useState({ daily: 0, monthly: 0 })

  const getCardIcon = (type: string) => {
    switch (type) {
      case "visa":
        return (
          <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
            VISA
          </div>
        )
      case "mastercard":
        return (
          <div className="w-8 h-5 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">
            MC
          </div>
        )
      case "amex":
        return (
          <div className="w-8 h-5 bg-green-600 rounded text-white text-xs flex items-center justify-center font-bold">
            AMEX
          </div>
        )
      default:
        return <CreditCard className="w-5 h-5" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        )
      case "blocked":
        return (
          <Badge variant="destructive">
            <Lock className="w-3 h-3 mr-1" />
            Bloquée
          </Badge>
        )
      case "expired":
        return (
          <Badge variant="secondary">
            <X className="w-3 h-3 mr-1" />
            Expirée
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleBlockCard = (cardId: string) => {
    setCards(cards.map((card) => (card.id === cardId ? { ...card, status: "blocked" as const } : card)))
    toast({
      title: "Carte bloquée",
      description: "Votre carte a été bloquée avec succès.",
    })
  }

  const handleUnblockCard = (cardId: string) => {
    setCards(cards.map((card) => (card.id === cardId ? { ...card, status: "active" as const } : card)))
    toast({
      title: "Carte débloquée",
      description: "Votre carte a été débloquée avec succès.",
    })
  }

  const handleUpdateLimits = (cardId: string) => {
    setCards(
      cards.map((card) =>
        card.id === cardId
          ? {
              ...card,
              dailyLimit: newLimits.daily,
              monthlyLimit: newLimits.monthly,
            }
          : card,
      ),
    )
    toast({
      title: "Plafonds mis à jour",
      description: "Les nouveaux plafonds ont été appliqués à votre carte.",
    })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA"
  }

  const toggleCardNumberVisibility = (cardId: string) => {
    setShowCardNumber(showCardNumber === cardId ? null : cardId)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes Cartes</h1>
          <p className="text-gray-600">Gérez vos cartes bancaires et leurs paramètres</p>
        </div>
        <Button>
          <CreditCard className="w-4 h-4 mr-2" />
          Demander une nouvelle carte
        </Button>
      </div>

      <Tabs defaultValue="cards" className="space-y-6">
        <TabsList>
          <TabsTrigger value="cards">Mes Cartes</TabsTrigger>
          <TabsTrigger value="transactions">Historique</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <UI_Card key={card.id} className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    {getCardIcon(card.type)}
                    {getStatusBadge(card.status)}
                  </div>
                  <CardTitle className="text-lg">
                    <div className="flex items-center space-x-2">
                      <span>
                        {showCardNumber === card.id
                          ? card.number.replace("****", card.id === "1" ? "4532" : card.id === "2" ? "5555" : "3782")
                          : card.number}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => toggleCardNumberVisibility(card.id)}>
                        {showCardNumber === card.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    <div className="space-y-1">
                      <p>{card.holder}</p>
                      <p>Expire: {card.expiryDate}</p>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Solde disponible:</span>
                      <span className="font-medium">{formatAmount(card.balance)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Plafond journalier:</span>
                      <span className="font-medium">{formatAmount(card.dailyLimit)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Dernière transaction:</span>
                    </div>
                    <p className="text-xs text-gray-500">{card.lastTransaction}</p>
                  </div>

                  <div className="flex space-x-2">
                    {card.status === "active" ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                            <Lock className="w-4 h-4 mr-1" />
                            Bloquer
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Bloquer la carte</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir bloquer cette carte ? Vous pourrez la débloquer à tout moment.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleBlockCard(card.id)}>Bloquer</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : card.status === "blocked" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                        onClick={() => handleUnblockCard(card.id)}
                      >
                        <Unlock className="w-4 h-4 mr-1" />
                        Débloquer
                      </Button>
                    ) : null}

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => {
                            setSelectedCard(card)
                            setNewLimits({ daily: card.dailyLimit, monthly: card.monthlyLimit })
                          }}
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Modifier
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Modifier les plafonds</DialogTitle>
                          <DialogDescription>Ajustez les plafonds de dépense pour cette carte</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="daily-limit">Plafond journalier (FCFA)</Label>
                            <Input
                              id="daily-limit"
                              type="number"
                              value={newLimits.daily}
                              onChange={(e) =>
                                setNewLimits({ ...newLimits, daily: Number.parseInt(e.target.value) || 0 })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="monthly-limit">Plafond mensuel (FCFA)</Label>
                            <Input
                              id="monthly-limit"
                              type="number"
                              value={newLimits.monthly}
                              onChange={(e) =>
                                setNewLimits({ ...newLimits, monthly: Number.parseInt(e.target.value) || 0 })
                              }
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={() => selectedCard && handleUpdateLimits(selectedCard.id)}>
                            Sauvegarder
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </UI_Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <UI_Card>
            <CardHeader>
              <CardTitle>Historique des transactions</CardTitle>
              <CardDescription>Toutes vos transactions récentes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => {
                  const card = cards.find((c) => c.id === transaction.cardId)
                  return (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {card && getCardIcon(card.type)}
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-gray-600">
                            {card?.number} • {transaction.date}
                          </p>
                        </div>
                      </div>
                      <div className={`font-medium ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                        {transaction.amount > 0 ? "+" : ""}
                        {formatAmount(Math.abs(transaction.amount))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </UI_Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <UI_Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Sécurité
                </CardTitle>
                <CardDescription>Paramètres de sécurité pour vos cartes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notifications SMS</p>
                    <p className="text-sm text-gray-600">Recevoir un SMS pour chaque transaction</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Activé
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Paiements en ligne</p>
                    <p className="text-sm text-gray-600">Autoriser les achats sur internet</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Activé
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Paiements à l'étranger</p>
                    <p className="text-sm text-gray-600">Autoriser les transactions hors Côte d'Ivoire</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Désactivé
                  </Button>
                </div>
              </CardContent>
            </UI_Card>

            <UI_Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Actions d'urgence
                </CardTitle>
                <CardDescription>En cas de perte ou de vol</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Lock className="w-4 h-4 mr-2" />
                      Faire opposition sur toutes les cartes
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Opposition sur toutes les cartes</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action bloquera immédiatement toutes vos cartes. Vous devrez contacter votre agence pour
                        les débloquer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction>Confirmer l'opposition</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button variant="outline" className="w-full bg-transparent">
                  Signaler une transaction frauduleuse
                </Button>
                <Button variant="outline" className="w-full bg-transparent">
                  Contacter le service client
                </Button>
              </CardContent>
            </UI_Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
