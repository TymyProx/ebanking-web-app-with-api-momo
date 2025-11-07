"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CreditCard, CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { getAccounts } from "@/app/accounts/actions"
import { createCardRequest } from "@/actions/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Account {
  id: string
  name: string
  accountNumber: string
  balance: number
  currency: string
  status: string
}

const cardTypes = [
  { value: "DEBIT", label: "Carte de débit", description: "Pour vos achats quotidiens" },
  { value: "CREDIT", label: "Carte de crédit", description: "Avec facilité de paiement" },
  { value: "PREPAID", label: "Carte prépayée", description: "Contrôlez vos dépenses" },
  { value: "VIRTUAL", label: "Carte virtuelle", description: "Pour les achats en ligne" },
]

export default function DemandeCartePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    accountId: "",
    cardType: "",
    deliveryAddress: "",
    reason: "",
  })

  useEffect(() => {
    async function loadAccounts() {
      try {
        setLoadingAccounts(true)
        const accountsData = await getAccounts()
        const activeAccounts = accountsData.filter((acc: any) => acc.status === "ACTIF")
        setAccounts(activeAccounts)
      } catch (err) {
        console.error("Error loading accounts:", err)
        setError("Erreur lors du chargement des comptes")
      } finally {
        setLoadingAccounts(false)
      }
    }

    loadAccounts()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.accountId || !formData.cardType) {
      setError("Veuillez remplir tous les champs obligatoires")
      return
    }

    setLoading(true)
    setError(null)

    try {
      await createCardRequest({
        accountId: formData.accountId,
        cardType: formData.cardType,
        deliveryAddress: formData.deliveryAddress,
        reason: formData.reason,
      })

      setSuccess(true)
      setTimeout(() => {
        router.push("/cartes")
      }, 2000)
    } catch (err: any) {
      console.error("Error creating card request:", err)
      setError(err.message || "Erreur lors de la création de la demande")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <CardTitle className="text-green-900">Demande envoyée avec succès!</CardTitle>
                  <CardDescription className="text-green-700">
                    Votre demande de carte bancaire a été enregistrée
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-green-800 mb-4">Vous serez redirigé vers vos cartes dans quelques instants...</p>
              <Button onClick={() => router.push("/cartes")} className="w-full">
                Voir mes cartes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Demande de carte bancaire</h1>
            <p className="text-muted-foreground text-lg">Remplissez le formulaire pour demander une nouvelle carte</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Formulaire de demande
            </CardTitle>
            <CardDescription>Toutes les informations sont requises pour traiter votre demande</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account Selection */}
              <div className="space-y-2">
                <Label htmlFor="accountId">
                  Compte à associer <span className="text-red-500">*</span>
                </Label>
                {loadingAccounts ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Chargement des comptes...</span>
                  </div>
                ) : accounts.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Aucun compte actif trouvé. Veuillez ouvrir un compte avant de demander une carte.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Select
                    value={formData.accountId}
                    onValueChange={(value) => setFormData({ ...formData, accountId: value })}
                  >
                    <SelectTrigger id="accountId">
                      <SelectValue placeholder="Sélectionnez un compte" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} - {account.accountNumber} ({account.balance.toLocaleString()}{" "}
                          {account.currency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Card Type Selection */}
              <div className="space-y-3">
                <Label>
                  Type de carte <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {cardTypes.map((type) => (
                    <div
                      key={type.value}
                      onClick={() => setFormData({ ...formData, cardType: type.value })}
                      className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-primary/50 ${
                        formData.cardType === type.value ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <CreditCard
                          className={`h-5 w-5 mt-0.5 ${
                            formData.cardType === type.value ? "text-primary" : "text-muted-foreground"
                          }`}
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold">{type.label}</h4>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-2">
                <Label htmlFor="deliveryAddress">Adresse de livraison</Label>
                <Textarea
                  id="deliveryAddress"
                  placeholder="Entrez l'adresse de livraison de la carte"
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">Si vide, nous utiliserons votre adresse enregistrée</p>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">Motif de la demande</Label>
                <Textarea
                  id="reason"
                  placeholder="Précisez la raison de votre demande (optionnel)"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button type="submit" className="flex-1" disabled={loading || loadingAccounts || accounts.length === 0}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    "Envoyer la demande"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
