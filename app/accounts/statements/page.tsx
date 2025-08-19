"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Download,
  FileText,
  Calendar,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  FileSpreadsheet,
  History,
  Printer,
  Mail,
  Settings,
  Eye,
  Wallet,
  PiggyBank,
  DollarSign,
} from "lucide-react"
import { generateStatement, sendStatementByEmail } from "./actions"
import { useActionState } from "react"

interface Account {
  id: string
  name: string
  number: string
  balance: number
  currency: string
  type: "Courant" | "Épargne" | "Devise"
  status: "Actif" | "Bloqué" | "Fermé"
  iban: string
}

interface StatementRequest {
  accountId: string
  startDate: string
  endDate: string
  format: "pdf" | "excel"
  includeImages: boolean
  language: "fr" | "en"
}

interface StatementHistory {
  id: string
  accountName: string
  period: string
  format: string
  generatedAt: string
  downloadCount: number
  fileSize: string
  status: "Généré" | "Expiré" | "En cours"
}

export default function StatementsPage() {
  const searchParams = useSearchParams()
  const preSelectedAccountId = searchParams.get("accountId")

  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [format, setFormat] = useState<"pdf" | "excel">("pdf")
  const [includeImages, setIncludeImages] = useState(false)
  const [language, setLanguage] = useState<"fr" | "en">("fr")
  const [emailAddress, setEmailAddress] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("")

  // États pour les actions serveur
  const [generateState, generateAction, isGenerating] = useActionState(generateStatement, null)
  const [emailState, emailAction, isSending] = useActionState(sendStatementByEmail, null)

  // Données des comptes (simulées)
  const accounts: Account[] = [
    {
      id: "1",
      name: "Compte Courant",
      number: "0001-234567-89",
      balance: 2400000,
      currency: "GNF",
      type: "Courant",
      status: "Actif",
      iban: "GN82 BNG 001 0001234567 89",
    },
    {
      id: "2",
      name: "Compte Épargne",
      number: "0002-345678-90",
      balance: 850000,
      currency: "GNF",
      type: "Épargne",
      status: "Actif",
      iban: "GN82 BNG 001 0002345678 90",
    },
    {
      id: "3",
      name: "Compte USD",
      number: "0003-456789-01",
      balance: 1250,
      currency: "USD",
      type: "Devise",
      status: "Actif",
      iban: "GN82 BNG 001 0003456789 01",
    },
  ]

  // Historique des relevés (simulé)
  const statementHistory: StatementHistory[] = [
    {
      id: "1",
      accountName: "Compte Courant",
      period: "Décembre 2023",
      format: "PDF",
      generatedAt: "15 Jan 2024 10:30",
      downloadCount: 3,
      fileSize: "245 KB",
      status: "Généré",
    },
    {
      id: "2",
      accountName: "Compte Épargne",
      period: "Novembre 2023",
      format: "Excel",
      generatedAt: "12 Jan 2024 14:15",
      downloadCount: 1,
      fileSize: "89 KB",
      status: "Généré",
    },
    {
      id: "3",
      accountName: "Compte Courant",
      period: "Octobre 2023",
      format: "PDF",
      generatedAt: "08 Jan 2024 09:45",
      downloadCount: 0,
      fileSize: "312 KB",
      status: "Expiré",
    },
  ]

  // Périodes prédéfinies
  const predefinedPeriods = [
    { value: "current_month", label: "Mois en cours", startDate: "2024-01-01", endDate: "2024-01-31" },
    { value: "last_month", label: "Mois dernier", startDate: "2023-12-01", endDate: "2023-12-31" },
    { value: "last_3_months", label: "3 derniers mois", startDate: "2023-10-01", endDate: "2023-12-31" },
    { value: "last_6_months", label: "6 derniers mois", startDate: "2023-07-01", endDate: "2023-12-31" },
    { value: "last_year", label: "Année dernière", startDate: "2023-01-01", endDate: "2023-12-31" },
    { value: "custom", label: "Période personnalisée", startDate: "", endDate: "" },
  ]

  // Pré-sélectionner le compte si fourni dans l'URL
  useEffect(() => {
    if (preSelectedAccountId && accounts.find((acc) => acc.id === preSelectedAccountId)) {
      setSelectedAccount(preSelectedAccountId)
    }
  }, [preSelectedAccountId])

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value)
    const period = predefinedPeriods.find((p) => p.value === value)
    if (period && value !== "custom") {
      setStartDate(period.startDate)
      setEndDate(period.endDate)
    } else if (value === "custom") {
      setStartDate("")
      setEndDate("")
    }
  }

  const handleGenerateStatement = async () => {
    if (!selectedAccount || !startDate || !endDate) {
      return
    }

    const formData = new FormData()
    formData.append("accountId", selectedAccount)
    formData.append("startDate", startDate)
    formData.append("endDate", endDate)
    formData.append("format", format)
    formData.append("includeImages", includeImages.toString())
    formData.append("language", language)

    await generateAction(formData)
  }

  const handleSendByEmail = async () => {
    if (!emailAddress || !generateState?.success) {
      return
    }

    const formData = new FormData()
    formData.append("email", emailAddress)
    formData.append("statementId", generateState.statementId)

    await emailAction(formData)
  }

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "Courant":
        return <Wallet className="h-4 w-4" />
      case "Épargne":
        return <PiggyBank className="h-4 w-4" />
      case "Devise":
        return <DollarSign className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const formatAmount = (amount: number, currency = "GNF") => {
    if (currency === "GNF") {
      return new Intl.NumberFormat("fr-FR").format(amount)
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  const isFormValid = selectedAccount && startDate && endDate && new Date(startDate) <= new Date(endDate)

  // Trouver le compte pré-sélectionné pour afficher un message
  const preSelectedAccount = preSelectedAccountId ? accounts.find((acc) => acc.id === preSelectedAccountId) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Télécharger relevé</h1>
          <p className="text-gray-600">Générez et téléchargez vos relevés de compte</p>
          {preSelectedAccount && (
            <div className="mt-2">
              <Alert className="border-blue-200 bg-blue-50">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Compte pré-sélectionné : {preSelectedAccount.name} ({preSelectedAccount.number})
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <History className="w-4 h-4 mr-2" />
            Historique
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Paramètres
          </Button>
        </div>
      </div>

      {/* Messages de feedback */}
      {generateState?.success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ✅ Relevé généré avec succès !
            <Button
              variant="link"
              className="p-0 h-auto text-green-700 underline ml-2"
              onClick={() => window.open(generateState.downloadUrl, "_blank")}
            >
              Télécharger maintenant
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {generateState?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>❌ {generateState.error}</AlertDescription>
        </Alert>
      )}

      {emailState?.success && (
        <Alert className="border-blue-200 bg-blue-50">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">✅ Relevé envoyé par email à {emailAddress}</AlertDescription>
        </Alert>
      )}

      {isGenerating && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Clock className="h-4 w-4 text-yellow-600 animate-pulse" />
          <AlertDescription className="text-yellow-800">
            ⏳ Téléchargement du relevé en cours... Veuillez patienter.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Générer un relevé</TabsTrigger>
          <TabsTrigger value="history">Historique des relevés</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          {/* Sélection du compte */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Sélection du compte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedAccount === account.id
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                        : "border-gray-200 hover:border-gray-300"
                    } ${preSelectedAccountId === account.id && !selectedAccount ? "border-blue-300 bg-blue-25" : ""}`}
                    onClick={() => setSelectedAccount(account.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getAccountIcon(account.type)}
                        <span className="font-medium text-sm">{account.name}</span>
                        {preSelectedAccountId === account.id && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                            Suggéré
                          </Badge>
                        )}
                      </div>
                      <Badge variant={account.status === "Actif" ? "default" : "secondary"}>{account.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 font-mono mb-1">{account.number}</p>
                    <p className="text-lg font-bold">
                      {formatAmount(account.balance, account.currency)} {account.currency}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Configuration du relevé */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Configuration du relevé
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sélection de période */}
              <div className="space-y-4">
                <Label>Période du relevé</Label>
                <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une période" />
                  </SelectTrigger>
                  <SelectContent>
                    {predefinedPeriods.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedPeriod === "custom" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Date de début</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        max={endDate || undefined}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">Date de fin</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || undefined}
                        max={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                  </div>
                )}

                {startDate && endDate && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Période sélectionnée : du {new Date(startDate).toLocaleDateString("fr-FR")} au{" "}
                      {new Date(endDate).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                )}
              </div>

              {/* Options de format */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label>Format du fichier</Label>
                  <div className="space-y-3">
                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        format === "pdf"
                          ? "border-red-500 bg-red-50 ring-2 ring-red-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setFormat("pdf")}
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-6 h-6 text-red-600" />
                        <div>
                          <p className="font-medium">PDF</p>
                          <p className="text-sm text-gray-500">Format standard, idéal pour l'impression</p>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        format === "excel"
                          ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setFormat("excel")}
                    >
                      <div className="flex items-center space-x-3">
                        <FileSpreadsheet className="w-6 h-6 text-green-600" />
                        <div>
                          <p className="font-medium">Excel</p>
                          <p className="text-sm text-gray-500">Format tableur, idéal pour l'analyse</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Options avancées</Label>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeImages"
                        checked={includeImages}
                        onCheckedChange={(checked) => setIncludeImages(checked as boolean)}
                      />
                      <Label htmlFor="includeImages" className="text-sm">
                        Inclure les images des chèques
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language">Langue du relevé</Label>
                      <Select value={language} onValueChange={(value: "fr" | "en") => setLanguage(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="w-5 h-5 mr-2" />
                Téléchargement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleGenerateStatement} disabled={!isFormValid || isGenerating} className="flex-1">
                  {isGenerating ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Générer et télécharger
                    </>
                  )}
                </Button>

                <Button variant="outline" disabled={!isFormValid}>
                  <Eye className="w-4 h-4 mr-2" />
                  Aperçu
                </Button>

                <Button variant="outline" disabled={!isFormValid}>
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimer
                </Button>
              </div>

              {/* Envoi par email */}
              {generateState?.success && (
                <div className="border-t pt-4 space-y-3">
                  <Label htmlFor="email">Envoyer par email (optionnel)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleSendByEmail} disabled={!emailAddress || isSending} variant="outline">
                      {isSending ? <Clock className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {!isFormValid && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Veuillez sélectionner un compte et une période valide pour continuer.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="w-5 h-5 mr-2" />
                Historique des relevés générés
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statementHistory.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun relevé généré récemment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {statementHistory.map((statement) => (
                    <div
                      key={statement.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {statement.format === "PDF" ? (
                            <FileText className="w-5 h-5 text-red-600" />
                          ) : (
                            <FileSpreadsheet className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{statement.accountName}</p>
                          <p className="text-sm text-gray-500">{statement.period}</p>
                          <p className="text-xs text-gray-400">
                            Généré le {statement.generatedAt} • {statement.fileSize}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge
                          variant={
                            statement.status === "Généré"
                              ? "default"
                              : statement.status === "Expiré"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {statement.status}
                        </Badge>
                        <div className="text-right text-sm">
                          <p className="text-gray-600">{statement.downloadCount} téléchargements</p>
                        </div>
                        {statement.status === "Généré" && (
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
