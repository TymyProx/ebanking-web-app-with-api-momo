"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Building2,
  FileText,
  ChevronRight,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { getAccounts } from "@/app/accounts/actions"
import { createCardRequest } from "@/app/cartes/actions"
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
  const [step, setStep] = useState(1)
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
        const activeAccounts = accountsData
          .filter((acc: any) => acc.status === "ACTIF")
          .map((acc: any) => ({
            id: acc.id || acc.accountId,
            name: acc.accountName || acc.name || `Compte ${acc.accountNumber}`,
            accountNumber: acc.accountNumber || acc.number,
            balance: acc.bookBalance || acc.balance || 0,
            currency: acc.currency || "GNF",
            status: acc.status,
          }))
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
      const selectedAccount = accounts.find((acc) => acc.id === formData.accountId)

      await createCardRequest({
        typCard: formData.cardType,
        accountNumber: selectedAccount?.accountNumber || "",
        clientId: "", // This will be overridden by the action
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

  const canProceedToStep2 = formData.cardType !== ""
  const canProceedToStep3 = formData.accountId !== ""

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
    <div className="mt-6 space-y-6">
      <div className="flex items-center space-x-2">
        <div>
          <h1 className="text-3xl font-bold text-primary">Demande de Carte Bancaire</h1>
          <p className="text-sm text-muted-foreground">Remplissez le formulaire en 3 étapes simples</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all ${
                s <= step ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
            {s < 3 && (
              <div
                className={`flex-1 h-0.5 mx-1 rounded-full transition-all ${
                  s < step ? "bg-primary text-white" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {step === 1 && (
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <CreditCard className="w-5 h-5 text-primary" />
              <span>Choisissez le type de carte</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cardTypes.map((type) => (
                <div
                  key={type.value}
                  onClick={() => setFormData({ ...formData, cardType: type.value })}
                  className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-lg ${
                    formData.cardType === type.value
                      ? "border-primary bg-gradient-to-br from-primary/5 to-secondary/5 shadow-md"
                      : "border-gray-200 hover:border-primary/50"
                  }`}
                >
                  {formData.cardType === type.value && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <CreditCard
                      className={`h-6 w-6 mt-0.5 ${
                        formData.cardType === type.value ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-base mb-1">{type.label}</h4>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!canProceedToStep2}>
                Continuer
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Building2 className="w-5 h-5 text-primary" />
              <span>Sélectionnez le compte</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountId" className="text-sm">
                Compte à associer <span className="text-red-500">*</span>
              </Label>
              {loadingAccounts ? (
                <div className="flex items-center gap-2 text-muted-foreground p-4 border-2 rounded-lg">
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
                  <SelectTrigger id="accountId" className="border-2 focus:border-primary h-10">
                    <SelectValue placeholder="Sélectionnez un compte" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} - {account.accountNumber} ({Math.trunc(account.balance ?? 0).toLocaleString()}{" "}
                        {account.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex justify-between pt-2">
              <Button onClick={() => setStep(1)} variant="outline" size="sm">
                <ArrowLeft className="w-3 h-3 mr-1" />
                Retour
              </Button>
              <Button onClick={() => setStep(3)} disabled={!canProceedToStep3 || loadingAccounts}>
                Continuer
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <FileText className="w-5 h-5 text-primary" />
              <span>Informations complémentaires</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryAddress" className="text-sm">
                  Adresse de livraison
                </Label>
                <Textarea
                  id="deliveryAddress"
                  placeholder="Entrez l'adresse de livraison de la carte"
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                  rows={2}
                  className="border-2 focus:border-primary text-sm"
                />
                <p className="text-sm text-muted-foreground">Si vide, nous utiliserons votre adresse enregistrée</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason" className="text-sm">
                  Motif de la demande
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Précisez la raison de votre demande (optionnel)"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={2}
                  className="border-2 focus:border-primary text-sm"
                />
              </div>

              <div className="flex justify-between pt-2">
                <Button type="button" onClick={() => setStep(2)} variant="outline" size="sm" disabled={loading}>
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  Retour
                </Button>
                <Button type="submit" size="sm" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Envoyer la demande
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
