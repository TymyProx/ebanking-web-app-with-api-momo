"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Download,
  Printer,
  Mail,
  Copy,
  CreditCard,
  Building,
  MapPin,
  Phone,
  CheckCircle,
  Wallet,
  PiggyBank,
  DollarSign,
} from "lucide-react"
import { getAccounts } from "../../accounts/actions"

interface Account {
  id: string
  name: string
  number: string
  balance: number
  currency: string
  type: "Courant" | "Épargne" | "Devise"
  status: "Actif" | "Bloqué" | "Fermé"
  iban: string
  accountHolder: string
  bankName: string
  bankCode: string
  branchCode: string
  branchName: string
  swiftCode: string
}

const generatePDF = async (account: Account) => {
  const { jsPDF } = await import("jspdf")
  const { autoTable } = await import("jspdf-autotable")

  const doc = new jsPDF()

  const primaryColor = [41, 128, 185] // Bleu moderne
  const accentColor = [52, 152, 219] // Bleu clair
  const darkColor = [44, 62, 80] // Gris foncé
  const lightGray = [236, 240, 241] // Gris clair

  // En-tête moderne avec dégradé simulé
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 35, "F")

  doc.setFillColor(...accentColor)
  doc.rect(0, 30, 210, 5, "F")

  // Titre principal
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont("helvetica", "bold")
  doc.text("RELEVÉ D'IDENTITÉ BANCAIRE", 105, 20, { align: "center" })

  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text("Document officiel", 105, 28, { align: "center" })

  // Logo/Nom de la banque
  doc.setTextColor(...primaryColor)
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text(account.bankName.toUpperCase(), 20, 55)

  // Date de génération
  doc.setTextColor(...darkColor)
  doc.setFontSize(10)
  doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`, 150, 55)

  let yPos = 75

  const accountData = [
    ["Titulaire du compte", account.accountHolder],
    ["Numéro de compte", account.number],
    ["IBAN", account.iban],
    ["Type de compte", account.type],
    ["Devise", account.currency],
    ["Statut", account.status],
  ]

  // @ts-ignore - jsPDF autoTable types
  doc.autoTable({
    startY: yPos,
    head: [["Information", "Valeur"]],
    body: accountData,
    theme: "grid",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 12,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 11,
      cellPadding: 8,
    },
    alternateRowStyles: {
      fillColor: lightGray,
    },
    columnStyles: {
      0: { fontStyle: "bold", fillColor: [248, 249, 250] },
      1: { fontStyle: "normal" },
    },
    margin: { left: 20, right: 20 },
  })

  // @ts-ignore - Récupération de la position Y après le tableau
  yPos = doc.lastAutoTable.finalY + 20

  const bankingCodes = [
    ["Code banque", account.bankCode],
    ["Code agence", account.branchCode],
    ["Code SWIFT/BIC", account.swiftCode],
    ["RIB complet", `${account.bankCode} ${account.branchCode} ${account.number.replace(/-/g, "")}`],
  ]

  // @ts-ignore
  doc.autoTable({
    startY: yPos,
    head: [["Codes bancaires", "Valeur"]],
    body: bankingCodes,
    theme: "grid",
    headStyles: {
      fillColor: accentColor,
      textColor: [255, 255, 255],
      fontSize: 12,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 11,
      cellPadding: 8,
    },
    alternateRowStyles: {
      fillColor: lightGray,
    },
    columnStyles: {
      0: { fontStyle: "bold", fillColor: [248, 249, 250] },
      1: { fontStyle: "normal", fontFamily: "courier" },
    },
    margin: { left: 20, right: 20 },
  })

  // @ts-ignore
  yPos = doc.lastAutoTable.finalY + 20

  doc.setFillColor(...lightGray)
  doc.rect(20, yPos, 170, 35, "F")

  doc.setTextColor(...primaryColor)
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("INFORMATIONS DE L'AGENCE", 25, yPos + 10)

  doc.setTextColor(...darkColor)
  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.text(account.branchName, 25, yPos + 18)
  doc.text("Avenue de la République, Kaloum", 25, yPos + 24)
  doc.text("Conakry, République de Guinée", 25, yPos + 30)

  doc.setFont("helvetica", "bold")
  doc.text("Tél: +224 622 123 456", 120, yPos + 24)
  doc.text("Email: contact@bng.gn", 120, yPos + 30)

  yPos += 50

  doc.setDrawColor(...primaryColor)
  doc.setLineWidth(0.5)
  doc.line(20, yPos, 190, yPos)

  doc.setTextColor(...darkColor)
  doc.setFontSize(9)
  doc.setFont("helvetica", "italic")
  doc.text("Ce document est valable pour tous vos échanges bancaires et opérations financières.", 105, yPos + 8, {
    align: "center",
  })
  doc.text("Conservez-le précieusement et ne le communiquez qu'aux organismes autorisés.", 105, yPos + 14, {
    align: "center",
  })

  // Numéro de page et sécurité
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text("Page 1/1", 190, 285, { align: "right" })
  doc.text(`Réf: RIB-${account.number.replace(/-/g, "")}-${Date.now()}`, 20, 285)

  const fileName = `RIB_${account.number.replace(/-/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`
  doc.save(fileName)
}

export default function RIBPage() {
  const searchParams = useSearchParams()
  const preSelectedAccountId = searchParams.get("accountId")

  const [copied, setCopied] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<string>("")
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const accountsData = await getAccounts()
        console.log("[v0] Comptes récupérés pour RIB:", accountsData)

        if (Array.isArray(accountsData)) {
          const adaptedAccounts: Account[] = accountsData.map((acc: any) => ({
            id: acc.id || acc.accountId,
            name: acc.accountName || acc.name || `Compte ${acc.accountNumber}`,
            number: acc.accountNumber,
            balance: Number.parseFloat(acc.bookBalance || acc.balance || "0"),
            currency: acc.currency || "GNF",
            type: "Courant" as const,
            status: "Actif" as const,
            iban: `GN82 BNG 001 ${acc.accountNumber}`,
            accountHolder: "DIALLO Mamadou",
            bankName: "Banque Nationale de Guinée",
            bankCode: "BNG",
            branchCode: "001",
            branchName: "Agence Kaloum",
            swiftCode: "BNGNGNCX",
          }))
          setAccounts(adaptedAccounts)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des comptes:", error)
        setAccounts([
          {
            id: "1",
            name: "Compte Courant",
            number: "0001-234567-89",
            balance: 2400000,
            currency: "GNF",
            type: "Courant",
            status: "Actif",
            iban: "GN82 BNG 001 0001234567 89",
            accountHolder: "DIALLO Mamadou",
            bankName: "Banque Nationale de Guinée",
            bankCode: "BNG",
            branchCode: "001",
            branchName: "Agence Kaloum",
            swiftCode: "BNGNGNCX",
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    loadAccounts()
  }, [])

  useEffect(() => {
    if (preSelectedAccountId && accounts.find((acc) => acc.id === preSelectedAccountId)) {
      setSelectedAccountId(preSelectedAccountId)
    } else if (accounts.length > 0) {
      setSelectedAccountId(accounts[0].id)
    }
  }, [preSelectedAccountId, accounts])

  const selectedAccount = accounts.find((acc) => acc.id === selectedAccountId) || accounts[0]
  const preSelectedAccount = preSelectedAccountId ? accounts.find((acc) => acc.id === preSelectedAccountId) : null

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadPDF = async () => {
    if (!selectedAccount) return

    try {
      await generatePDF(selectedAccount)
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error)
      const pdfContent = `
        RELEVÉ D'IDENTITÉ BANCAIRE (RIB)
        
        ${selectedAccount.bankName.toUpperCase()}
        
        Titulaire du compte: ${selectedAccount.accountHolder}
        Numéro de compte: ${selectedAccount.number}
        IBAN: ${selectedAccount.iban}
        Code banque: ${selectedAccount.bankCode}
        Code agence: ${selectedAccount.branchCode}
        Code SWIFT: ${selectedAccount.swiftCode}
        
        Agence: ${selectedAccount.branchName}
        Type de compte: ${selectedAccount.type}
        Devise: ${selectedAccount.currency}
        Statut: ${selectedAccount.status}
        
        Date d'édition: ${new Date().toLocaleDateString("fr-FR")}
      `

      const blob = new Blob([pdfContent], { type: "text/plain" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `RIB_${selectedAccount.number.replace(/-/g, "_")}_${new Date().toISOString().split("T")[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    }
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-96" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!selectedAccount) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Aucun compte disponible</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relevé d'Identité Bancaire (RIB)</h1>
        <p className="text-gray-600">Consultez et téléchargez votre RIB</p>
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

      {accounts.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Sélection du compte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label htmlFor="account-select">Choisir le compte pour le RIB</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un compte" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center space-x-2">
                        {getAccountIcon(account.type)}
                        <span>
                          {account.name} - {account.number}
                        </span>
                        {preSelectedAccountId === account.id && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 ml-2">
                            Suggéré
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Informations bancaires
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg bg-gray-50">
                <div className="text-center mb-4">
                  <h2 className="text-lg font-bold text-blue-600">{selectedAccount.bankName.toUpperCase()}</h2>
                  <p className="text-sm text-gray-600">RELEVÉ D'IDENTITÉ BANCAIRE</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Titulaire du compte</p>
                    <p className="font-semibold">{selectedAccount.accountHolder}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Numéro de compte</p>
                    <p className="font-mono font-semibold">{selectedAccount.number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Code banque</p>
                    <p className="font-mono">{selectedAccount.bankCode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Code agence</p>
                    <p className="font-mono">{selectedAccount.branchCode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">RIB</p>
                    <p className="font-mono font-semibold">
                      {selectedAccount.bankCode} {selectedAccount.branchCode} {selectedAccount.number.replace(/-/g, "")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">IBAN</p>
                    <p className="font-mono font-semibold">{selectedAccount.iban}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Code SWIFT</p>
                      <p className="font-mono font-semibold">{selectedAccount.swiftCode}</p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className={
                          selectedAccount.status === "Actif" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                        }
                      >
                        Compte {selectedAccount.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Type de compte</p>
                      <p className="font-medium">{selectedAccount.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Devise</p>
                      <p className="font-medium">{selectedAccount.currency}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={downloadPDF}>
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger PDF
                </Button>
                <Button variant="outline">
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimer
                </Button>
                <Button variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  Envoyer par email
                </Button>
                <Button variant="outline" onClick={() => copyToClipboard(selectedAccount.iban)}>
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? "Copié !" : "Copier IBAN"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Informations agence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold">{selectedAccount.branchName}</p>
                <p className="text-sm text-gray-600">{selectedAccount.bankName}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm">Avenue de la République</p>
                    <p className="text-sm">Kaloum, Conakry</p>
                    <p className="text-sm">République de Guinée</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <p className="text-sm">+224 622 123 456</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500">Horaires d'ouverture</p>
                <p className="text-sm">Lun - Ven: 8h00 - 16h00</p>
                <p className="text-sm">Sam: 8h00 - 12h00</p>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Utilisation du RIB</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <p>Recevoir des virements</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <p>Domicilier votre salaire</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <p>Prélèvements automatiques</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <p>Virements internationaux</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                {getAccountIcon(selectedAccount.type)}
                <span className="ml-2">Compte sélectionné</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Nom du compte</p>
                  <p className="font-medium">{selectedAccount.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Numéro</p>
                  <p className="font-mono text-sm">{selectedAccount.number}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Solde actuel</p>
                  <p className="font-semibold text-green-600">
                    {formatAmount(selectedAccount.balance, selectedAccount.currency)} {selectedAccount.currency}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
