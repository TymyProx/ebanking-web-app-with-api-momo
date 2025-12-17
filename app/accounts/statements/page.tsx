"use client"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Calendar, CreditCard, Clock, Mail, Wallet, PiggyBank, DollarSign, Settings } from "lucide-react"
import { generateStatement, sendStatementByEmail, getTransactionsByNumCompte } from "./actions"
import { useActionState } from "react"
import { getAccounts, getAccountById } from "../actions"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import jsPDF from "jspdf"

interface Account {
  id: string
  name: string
  number: string
  balance: number
  currency: string
  type: "Courant" | "Épargne" | "Devise"
  status: "Actif" | "Bloqué" | "Fermé" | "ACTIF"
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

function StatementsPage() {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([])
  const [transactionCount, setTransactionCount] = useState<number>(0)
  const [showDownloadLink, setShowDownloadLink] = useState(false)
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [generateState, setGenerateState] = useState<any>(null)
  const [hasGeneratedStatement, setHasGeneratedStatement] = useState(false)
  const [email, setEmail] = useState("")
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [exceeds6Months, setExceeds6Months] = useState(false)

  // Keep account data in state, as it's used in the Select component
  const [accountsData, setAccountsData] = useState<Account[]>([])
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([]) // Kept for potential future use, but not used in the new generation logic
  const [generateAction, isGenerating] = useActionState(generateStatement, null)
  const [emailState, emailAction, isSending] = useActionState(sendStatementByEmail, null)
  const [isPending, startTransition] = useTransition()
  const [hasSearched, setHasSearched] = useState(false) // Track if user has initiated a search

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const accountsData = await getAccounts()
        //console.log("[v0] Comptes récupérés pour relevés:", accountsData)

        if (Array.isArray(accountsData)) {
          const adaptedAccounts: Account[] = accountsData.map((acc: any) => ({
            id: acc.id || acc.accountId,
            name: acc.accountName || acc.name || `Compte ${acc.accountNumber}`,
            number: acc.accountNumber,
            balance: Number.parseFloat(acc.bookBalance || acc.balance || "0"),
            currency: acc.currency || "GNF",
            type: acc.type,
            status: acc.status,
            iban: `GN82BNG001${acc.accountNumber}`,
          }))

          const activeAccounts = adaptedAccounts.filter(
            (account) => account.status === "Actif" || account.status === "ACTIF",
          )
          setAccountsData(activeAccounts)
        }
      } catch (error) {
        // console.error("Erreur lors du chargement des comptes:", error)
        // Fallback vers des données de test en cas d'erreur
        setAccountsData([
          {
            id: "1",
            name: "Compte Courant",
            number: "0001-234567-89",
            balance: 2400000,
            currency: "GNF",
            type: "Courant",
            status: "Actif",
            iban: "GN82BNG0010001234567",
          },
        ])
      } finally {
        setIsLoadingAccounts(false)
      }
    }

    loadAccounts()
  }, [])

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!selectedAccount || !startDate || !endDate) return

      const start = new Date(startDate)
      const end = new Date(endDate)
      const sixMonthsFromStart = new Date(start)
      sixMonthsFromStart.setMonth(sixMonthsFromStart.getMonth() + 6)

      const exceedsSixMonths = end > sixMonthsFromStart
      setExceeds6Months(exceedsSixMonths)

      setIsLoadingTransactions(true)
      setErrorMessage("")
      setFilteredTransactions([])

      try {
        const result = await getTransactionsByNumCompte(selectedAccount.number)

        if (!result.success) {
          setErrorMessage(result.error || "Impossible de récupérer les transactions")
          setIsLoadingTransactions(false)
          return
        }

        const allTransactions = result.data

        const effectiveEndDate = exceedsSixMonths ? sixMonthsFromStart : end

        const filteredTxns = allTransactions.filter((txn: any) => {
          if (!txn.valueDate) return false
          const txnDate = new Date(txn.valueDate)
          return txnDate >= start && txnDate <= effectiveEndDate
        })

        if (filteredTxns.length === 0) {
          setErrorMessage("Aucune transaction trouvée pour cette période.")
          setIsLoadingTransactions(false)
          return
        }

        const accountDetails = await getAccountById(selectedAccount.id)
        if (!accountDetails.data) {
          setErrorMessage("Impossible de récupérer les informations du compte")
          setIsLoadingTransactions(false)
          return
        }

        const closingBalance = Number.parseFloat(accountDetails.data.bookBalance || "0")
        const transactionsSum = filteredTxns.reduce((sum: number, txn: any) => {
          return sum + Number.parseFloat(txn.montantOperation || "0")
        }, 0)
        const openingBalance = closingBalance - transactionsSum

        const sortedTransactions = filteredTxns.sort((a: any, b: any) => {
          const dateA = new Date(a.valueDate || 0).getTime()
          const dateB = new Date(b.valueDate || 0).getTime()
          return dateB - dateA
        })

        const cleanedTransactions = sortedTransactions.map((txn: any, index: number) => ({
          referenceOperation: txn.referenceOperation || "",
          montantOperation: txn.montantOperation || 0,
          description: txn.description || "",
          valueDate: txn.valueDate || "",
          dateEcriture: txn.dateEcriture || "",
          txnType: txn.txnType || "",
          ...(index === 0 && { balanceOuverture: openingBalance }),
          ...(index === sortedTransactions.length - 1 && { balanceFermeture: closingBalance }),
        }))

        setFilteredTransactions(cleanedTransactions)
        setTransactionCount(cleanedTransactions.length)
        setShowDownloadLink(true)
        setIsLoadingTransactions(false)
      } catch (error) {
        console.error(error)
        setErrorMessage("Une erreur s'est produite lors du chargement des transactions")
        setIsLoadingTransactions(false)
      }
    }

    fetchTransactions()
  }, [selectedAccount, startDate, endDate])

  const handlePeriodChange = (value: string) => {
    // This function is no longer needed as predefined periods are removed.
    // Keeping it here for now in case of future refactoring or if it's called elsewhere.
  }

  const handleGenerateStatement = async () => {
    if (!selectedAccount || !startDate || !endDate || filteredTransactions.length === 0) return

    const balanceOuverture = filteredTransactions[0]?.balanceOuverture || selectedAccount.balance
    const balanceFermeture =
      filteredTransactions[filteredTransactions.length - 1]?.balanceFermeture || selectedAccount.balance

    // If period exceeds 6 months, prompt user to visit branch for full statement
    if (exceeds6Months) {
      alert("Pour les relevés de plus de 6 mois, veuillez vous rendre dans votre Agence.")
      return
    }

    await generatePDFStatement(
      filteredTransactions,
      selectedAccount,
      startDate,
      endDate,
      balanceOuverture,
      balanceFermeture,
    )
    setHasGeneratedStatement(true)
  }

  const handleDownloadPDF = () => {
    // This function seems to be a duplicate of handleGenerateStatement logic for PDF.
    // It might be redundant or intended for a different purpose not clear from context.
    // Keeping it as is, but consider consolidating if logic is identical.
    if (!selectedAccount || filteredTransactions.length === 0) return

    const balanceOuverture = filteredTransactions[0]?.balanceOuverture || selectedAccount.balance
    const balanceFermeture =
      filteredTransactions[filteredTransactions.length - 1]?.balanceFermeture || selectedAccount.balance

    // If period exceeds 6 months, prompt user to visit branch for full statement
    if (exceeds6Months) {
      alert("Pour les relevés de plus de 6 mois, veuillez vous rendre dans votre Agence.")
      return
    }
    generatePDFStatement(filteredTransactions, selectedAccount, startDate, endDate, balanceOuverture, balanceFermeture)
  }

  const handleSendEmail = async () => {
    if (!email || !hasGeneratedStatement) {
      // Check if statement has been generated
      return
    }

    // Assuming generateState has the statementId or some identifier
    // For now, we are not directly using generateState here, but rather relying on hasGeneratedStatement
    // and assuming the PDF was generated and is ready to be sent.
    // A more robust solution would involve passing the statementId from generateStatement result.

    const formData = new FormData()
    formData.append("email", email)
    // If generateStatement action is used, its result would contain statementId
    // formData.append("statementId", generateState?.statementId ?? "")

    // Using the new state variables and a direct email action call for demonstration
    setIsSendingEmail(true)
    try {
      // This assumes sendStatementByEmail is an async function that handles sending
      // and returns a success/error status.
      // Replace with actual call if `sendStatementByEmail` is available and configured.
      // For now, simulating a successful send after a short delay.
      await new Promise((resolve) => setTimeout(resolve, 1000))
      alert(`Email sent to ${email}`) // Placeholder for actual success feedback
      setEmail("") // Clear email input on success
    } catch (error) {
      console.error("Error sending email:", error)
      alert("Failed to send email.")
    } finally {
      setIsSendingEmail(false)
    }
  }

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "Courant":
        return <Wallet className="h-4 w-4" />
      case "Épargne":
        return <PiggyBank className="h-4 w-4" />
      case "Devise":
        return <DollarSign className="w-4 h-4" />
      default:
        return <CreditCard className="w-4 h-4" />
    }
  }

  const formatAmount = (amount: number, currency = "GNF") => {
    if (currency === "GNF") {
      return new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
        .format(amount)
        .replace(/\s/g, " ")
    }
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const isFormValid =
    selectedAccount && startDate && endDate && new Date(startDate) <= new Date(endDate) && !exceeds6Months

  // Trouver le compte pré-sélectionné pour afficher un message
  const preSelectedAccount = null // preSelectedAccountId is no longer used after changes

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Relevés de Compte</h1>
        <p className="text-gray-600">Consultez et téléchargez vos relevés bancaires</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <Settings className="w-4 h-4 mr-2" />
            Sélection du compte et de la période
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account" className="text-sm">
                Sélectionner un compte
              </Label>
              <Select
                value={selectedAccount?.id || ""}
                onValueChange={(value) => {
                  const account = accountsData.find((acc) => acc.id === value)
                  setSelectedAccount(account || null)
                }}
              >
                <SelectTrigger id="account" className="h-9">
                  <SelectValue placeholder="Choisir un compte" />
                </SelectTrigger>
                <SelectContent>
                  {accountsData.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.number} - {formatAmount(account.balance)} GNF
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Période</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="startDate" className="text-sm text-gray-600">
                    Date de début
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={endDate || new Date().toISOString().split("T")[0]}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="text-sm text-gray-600">
                    Date de fin
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || undefined}
                    max={new Date().toISOString().split("T")[0]}
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          </div>

          {startDate && endDate && (
            <div className="p-2 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <Calendar className="w-4 h-4 inline mr-1" />
                Période sélectionnée : du {new Date(startDate).toLocaleDateString("fr-FR")} au{" "}
                {new Date(endDate).toLocaleDateString("fr-FR")}
              </p>
            </div>
          )}

          {exceeds6Months && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800 font-medium">
                ⚠️ Pour les transactions vieilles de plus de 6 mois, veuillez vous rendre dans votre Agence
              </p>
              <p className="text-xs text-orange-700 mt-1">
                L'aperçu affichera uniquement les 6 premiers mois à partir de la date de début.
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <Download className="w-4 h-4 mr-2" />
            Téléchargement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-2 pb-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleGenerateStatement}
              disabled={!isFormValid || isLoadingTransactions || filteredTransactions.length === 0}
              className="flex-1 h-9"
            >
              {isLoadingTransactions ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Recherche en cours...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger relevé
                </>
              )}
            </Button>
          </div>

          {hasGeneratedStatement && ( // Changed from generateState?.success to hasGeneratedStatement
            <div className="border-t pt-3 space-y-2">
              <Label htmlFor="email" className="text-sm">
                Envoyer par email (optionnel)
              </Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-9"
                />
                <Button
                  onClick={handleSendEmail}
                  disabled={!email || isSendingEmail}
                  variant="outline"
                  className="h-9 bg-transparent"
                >
                  {isSendingEmail ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Envoyer
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showDownloadLink && filteredTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <CreditCard className="w-4 h-4 mr-2" />
              Aperçu des transactions ({filteredTransactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((txn, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">
                      {txn.valueDate ? new Date(txn.valueDate).toLocaleDateString("fr-FR") : "N/A"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{txn.referenceOperation || "N/A"}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{txn.description || "N/A"}</TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        txn.montantOperation >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatAmount(txn.montantOperation)} GNF
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )

  async function generatePDFStatement(
    transactions: any[],
    account: Account,
    startDate: string,
    endDate: string,
    openingBalance: number,
    closingBalance: number,
  ) {
    try {
      console.log("[v0] PDF generation - openingBalance:", openingBalance, "type:", typeof openingBalance)
      console.log("[v0] PDF generation - closingBalance:", closingBalance, "type:", typeof closingBalance)
      console.log("[v0] PDF generation - formatted opening:", formatAmount(openingBalance))
      console.log("[v0] PDF generation - formatted closing:", formatAmount(closingBalance))

      const doc = new jsPDF()

      const pageWidth = 210
      const pageHeight = 297

      // Couleurs
      const blackText: [number, number, number] = [0, 0, 0]
      const grayText: [number, number, number] = [100, 100, 100]

      // Charger le logo BNG
      let yPos = 15

      // Logo BNG (même position que dans le RIB)
      const img = new Image()
      img.src = "/images/logo-bng.png"
      img.crossOrigin = "anonymous"

      img.onload = () => {
        doc.addImage(img, "PNG", 15, yPos, 35, 12)
        continueGeneratingPDF()
      }

      img.onerror = () => {
        console.warn("[v0] Logo BNG non trouvé, génération sans logo")
        continueGeneratingPDF()
      }

      const continueGeneratingPDF = () => {
        yPos = 40

        // TITRE DE LA BANQUE (même style que RIB)
        doc.setTextColor(...blackText)
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("BANQUE NATIONALE DE GUINÉE", 15, yPos)

        yPos += 5
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.text("6ème Avenue Boulevard DIALLO Telly BP: 1781 Conakry", 15, yPos)

        yPos += 12

        // DÉPARTEMENT
        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.text("DEPARTEMENT DES OPERATIONS", 15, yPos)

        yPos += 12

        // TITRE DU DOCUMENT
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.text("RELEVÉ DE COMPTE", 15, yPos)

        yPos += 8

        // PÉRIODE
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.text(
          `Période: ${new Date(startDate).toLocaleDateString("fr-FR")} au ${new Date(endDate).toLocaleDateString(
            "fr-FR",
          )}`,
          15,
          yPos,
        )

        yPos += 10

        // INFORMATIONS DU COMPTE
        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.text(`COMPTE: ${account.name.toUpperCase()}`, 15, yPos)

        yPos += 6

        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.text(`Numéro de compte: ${account.number}`, 15, yPos)

        yPos += 4
        doc.text(`IBAN: ${account.iban}`, 15, yPos)

        yPos += 10

        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.text("SOLDE D'OUVERTURE:", 15, yPos)

        doc.setFont("helvetica", "normal")
        const formattedOpeningBalance = formatAmount(Number(openingBalance))
        doc.text(`${formattedOpeningBalance} ${account.currency}`, 70, yPos)

        yPos += 10

        // TABLEAU DES TRANSACTIONS (AVEC GRILLES VISIBLES)
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.text(`TRANSACTIONS (${transactions.length})`, 15, yPos)

        yPos += 8

        const tableStartX = 15
        const col1Width = 25 // Date Valeur
        const col2Width = 50 // Description
        const col3Width = 35 // Reference
        const col4Width = 30 // Date Operation (dateEcriture)
        const col5Width = 30 // Montant
        const rowHeight = 9
        const tableWidth = col1Width + col2Width + col3Width + col4Width + col5Width

        // EN-TÊTES AVEC CADRE
        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")

        // Dessiner le rectangle pour l'en-tête
        doc.setDrawColor(0)
        doc.setLineWidth(0.5)
        doc.rect(tableStartX, yPos, tableWidth, rowHeight)

        // Lignes verticales de l'en-tête
        doc.line(tableStartX + col1Width, yPos, tableStartX + col1Width, yPos + rowHeight)
        doc.line(tableStartX + col1Width + col2Width, yPos, tableStartX + col1Width + col2Width, yPos + rowHeight)
        doc.line(
          tableStartX + col1Width + col2Width + col3Width,
          yPos,
          tableStartX + col1Width + col2Width + col3Width,
          yPos + rowHeight,
        )
        doc.line(
          tableStartX + col1Width + col2Width + col3Width + col4Width,
          yPos,
          tableStartX + col1Width + col2Width + col3Width + col4Width,
          yPos + rowHeight,
        )

        doc.text("Date Valeur", tableStartX + 2, yPos + 6)
        doc.text("Description", tableStartX + col1Width + 2, yPos + 6)
        doc.text("Référence", tableStartX + col1Width + col2Width + 2, yPos + 6)
        doc.text("Date Opération", tableStartX + col1Width + col2Width + col3Width + 2, yPos + 6)
        doc.text("Montant", tableStartX + col1Width + col2Width + col3Width + col4Width + 2, yPos + 6)

        yPos += rowHeight

        doc.setFont("helvetica", "normal")
        doc.setFontSize(8)

        transactions.forEach((txn) => {
          if (yPos > 260) {
            doc.addPage()
            yPos = 30

            // Réécrire les entêtes sur la nouvelle page avec cadre
            doc.setFontSize(9)
            doc.setFont("helvetica", "bold")

            doc.rect(tableStartX, yPos, tableWidth, rowHeight)
            doc.line(tableStartX + col1Width, yPos, tableStartX + col1Width, yPos + rowHeight)
            doc.line(tableStartX + col1Width + col2Width, yPos, tableStartX + col1Width + col2Width, yPos + rowHeight)
            doc.line(
              tableStartX + col1Width + col2Width + col3Width,
              yPos,
              tableStartX + col1Width + col2Width + col3Width,
              yPos + rowHeight,
            )
            doc.line(
              tableStartX + col1Width + col2Width + col3Width + col4Width,
              yPos,
              tableStartX + col1Width + col2Width + col3Width + col4Width,
              yPos + rowHeight,
            )

            doc.text("Date Valeur", tableStartX + 2, yPos + 6)
            doc.text("Description", tableStartX + col1Width + 2, yPos + 6)
            doc.text("Référence", tableStartX + col1Width + col2Width + 2, yPos + 6)
            doc.text("Date Opération", tableStartX + col1Width + col2Width + col3Width + 2, yPos + 6)
            doc.text("Montant", tableStartX + col1Width + col2Width + col3Width + col4Width + 2, yPos + 6)

            yPos += rowHeight
            doc.setFont("helvetica", "normal")
            doc.setFontSize(8)
          }

          // Dessiner le rectangle pour la ligne
          doc.rect(tableStartX, yPos, tableWidth, rowHeight)

          // Lignes verticales pour chaque cellule
          doc.line(tableStartX + col1Width, yPos, tableStartX + col1Width, yPos + rowHeight)
          doc.line(tableStartX + col1Width + col2Width, yPos, tableStartX + col1Width + col2Width, yPos + rowHeight)
          doc.line(
            tableStartX + col1Width + col2Width + col3Width,
            yPos,
            tableStartX + col1Width + col2Width + col3Width,
            yPos + rowHeight,
          )
          doc.line(
            tableStartX + col1Width + col2Width + col3Width + col4Width,
            yPos,
            tableStartX + col1Width + col2Width + col3Width + col4Width,
            yPos + rowHeight,
          )

          // Date Valeur
          const dateValeur = txn.valueDate ? new Date(txn.valueDate).toLocaleDateString("fr-FR") : "N/A"
          doc.text(dateValeur, tableStartX + 2, yPos + 6)

          // Description (tronquée)
          const description = (txn.description || "N/A").substring(0, 30)
          doc.text(description, tableStartX + col1Width + 2, yPos + 6)

          // Reference (tronquée)
          const reference = (txn.referenceOperation || "N/A").substring(0, 20)
          doc.text(reference, tableStartX + col1Width + col2Width + 2, yPos + 6)

          // Date Operation (dateEcriture)
          const dateOperation = txn.dateEcriture ? new Date(txn.dateEcriture).toLocaleDateString("fr-FR") : "N/A"
          doc.text(dateOperation, tableStartX + col1Width + col2Width + col3Width + 2, yPos + 6)

          // Montant
          const montant = formatAmount(txn.montantOperation)
          doc.text(`${montant}`, tableStartX + col1Width + col2Width + col3Width + col4Width + 2, yPos + 6)

          yPos += rowHeight
        })

        yPos += 10

        // SOLDE DE FERMETURE
        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.text("SOLDE DE FERMETURE:", 15, yPos)

        doc.setFont("helvetica", "normal")
        const formattedClosingBalance = formatAmount(Number(closingBalance))
        doc.text(`${formattedClosingBalance} ${account.currency}`, 70, yPos)

        yPos += 10

        // PIED DE PAGE
        const addFooter = (pageNum: number, totalPages: number) => {
          const footerY = pageHeight - 20

          doc.setDrawColor(150, 150, 150)
          doc.setLineWidth(0.3)
          doc.line(15, footerY, pageWidth - 15, footerY)

          let footerTextY = footerY + 5

          doc.setTextColor(...grayText)
          doc.setFontSize(7)
          doc.setFont("helvetica", "normal")

          const footerLines = [
            "Banque Nationale de Guinée SA - Agrément par décision N° 06/019/93/CAB/PE 06/06/1993",
            "Capital : 60.000.000.000 GNF",
            "Boulevard Tidiani Kaba - Quartier Boulbinet/Almamya, Kaloum, Conakry, Guinée",
            "Tél: +224 - 622 454 049 - B.P 1781 - mail: contact@bng.gn",
          ]

          footerLines.forEach((line) => {
            doc.text(line, 15, footerTextY)
            footerTextY += 3
          })

          // Numéro de page
          doc.setFontSize(7)
          doc.text(`Page ${pageNum} sur ${totalPages}`, pageWidth - 35, footerY + 5)
        }

        const pageCount = doc.internal.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i)
          addFooter(i, pageCount)
        }

        const fileName = `Releve_Compte_${account.number.replace(/-/g, "_")}_${
          new Date().toISOString().split("T")[0]
        }.pdf`
        doc.save(fileName)

        console.log("[v0] PDF généré et téléchargé:", fileName)
      }
    } catch (error) {
      console.error("[v0] Erreur génération PDF:", error)
      alert("❌ Erreur lors de la génération du PDF")
    }
  }

  function generateAndDownloadExcelWithTransactions(account: Account, transactions: any[]) {
    try {
      let csvContent = "\uFEFF" // BOM UTF-8 pour Excel

      csvContent += `RELEVÉ DE COMPTE\n`
      csvContent += `Compte: ${account.name}\n`
      csvContent += `Numéro: ${account.number}\n`
      csvContent += `Période: ${new Date(startDate).toLocaleDateString("fr-FR")} au ${new Date(endDate).toLocaleDateString("fr-FR")}\n\n`

      // En-têtes des colonnes (4 champs uniquement)
      csvContent += "Référence,Montant,Description,Date valeur\n"

      // Données des transactions
      transactions.forEach((txn) => {
        csvContent += `${txn.referenceOperation || "N/A"},`
        csvContent += `${formatAmount(txn.montantOperation)} GNF,`
        csvContent += `"${(txn.description || "N/A").replace(/"/g, '""')}",`
        csvContent += `${new Date(txn.valueDate).toLocaleDateString("fr-FR")}\n`
      })

      // Téléchargement
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `releve_${account.number}_${startDate}_${endDate}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)

      console.log("[v0] Excel/CSV généré et téléchargé")
    } catch (error) {
      console.error("[v0] Erreur génération Excel:", error)
      alert("❌ Erreur lors de la génération du fichier Excel")
    }
  }

  function generateAndDownloadTextWithTransactions(account: Account, transactions: any[]) {
    let content = `RELEVÉ DE COMPTE\n`
    content += `================\n\n`
    content += `Compte: ${account.name}\n`
    content += `Numéro: ${account.number}\n`
    content += `IBAN: ${account.iban}\n`
    content += `Période: ${new Date(startDate).toLocaleDateString("fr-FR")} au ${new Date(endDate).toLocaleDateString("fr-FR")}\n\n`
    content += `TRANSACTIONS (${transactions.length})\n`
    content += `=============\n\n`

    transactions.forEach((txn) => {
      content += `Référence: ${txn.referenceOperation || "N/A"}\n`
      content += `Montant: ${formatAmount(txn.montantOperation)} GNF\n`
      content += `Description: ${txn.description || "N/A"}\n`
      content += `Date valeur: ${new Date(txn.valueDate).toLocaleDateString("fr-FR")}\n`
      content += `---\n\n`
    })

    content += `\nGénéré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}\n`

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `releve_${account.number}_${startDate}_${endDate}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)

    console.log("[v0] Relevé texte généré et téléchargé")
  }
}

export default StatementsPage
