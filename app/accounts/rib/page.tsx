"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  Download,
  Printer,
  Mail,
  Copy,
  CreditCard,
  Building,
  MapPin,
  Phone,
  Wallet,
  PiggyBank,
  DollarSign,
  ArrowRight,
} from "lucide-react"
import { getAccounts } from "../../accounts/actions"
import { getUserProfile, getAccountForRib, sendRibEmail } from "./actions"
import { isAccountActive } from "@/lib/status-utils"
import { generateStandardizedPDF, formatAmount as formatAmountUtil, savePDF, type PDFContentOptions } from "@/lib/pdf-generator"
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
  ribKey: string
}

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = ""
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength

  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }

  return btoa(binary)
}

let cachedBngLogoDataUrl: string | null = null

const getBngLogoDataUrl = async () => {
  if (cachedBngLogoDataUrl) {
    return cachedBngLogoDataUrl
  }

  try {
    const response = await fetch("/images/logo-bng.png")
    if (!response.ok) {
      throw new Error(`Impossible de charger le logo BNG (${response.status})`)
    }

    const blob = await response.blob()
    const reader = new FileReader()

    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onerror = () => reject(new Error("Erreur lors de la lecture du logo BNG"))
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })

    cachedBngLogoDataUrl = dataUrl
    return dataUrl
  } catch (error) {
    console.error("[RIB] Impossible de charger le logo BNG:", error)
    return null
  }
}

const generatePDF = async (account: Account) => {
  const { jsPDF } = await import("jspdf")
  const CONTENT_LEFT = 15
  const pageWidth = 210

  const blackText: [number, number, number] = [15, 23, 42]
  const grayText: [number, number, number] = [100, 116, 139]
  const primaryGreen: [number, number, number] = [11, 132, 56]

  // Utiliser le service standardisé
  const content: PDFContentOptions = {
    title: "RELEVÉ D'IDENTITÉ BANCAIRE (RIB)",
    drawContent: (doc, y) => {
      let yPos = y

      // Description
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(...grayText)
      const descriptionLines = [
        "Pour les virements initiés et en provenance de l'étranger.",
        "Ci-dessous, les références nationales et internationales du client.",
        "Ce relevé est remis au client à sa demande et destiné à ses partenaires.",
      ]

      descriptionLines.forEach((line) => {
        doc.text(line, CONTENT_LEFT, yPos)
        yPos += 6
      })

      yPos += 8

      // Client
      doc.setFontSize(9)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(...blackText)
      doc.text(`CLIENT: ${account.accountHolder.toUpperCase()}`, CONTENT_LEFT, yPos)

      yPos += 15

      // Tableau RIB / IBAN
      doc.setFontSize(9)
      doc.setFont("helvetica", "bold")
      doc.text(account.name, CONTENT_LEFT, yPos)

      yPos += 10

      const tableStartX = CONTENT_LEFT
      const tableTotalWidth = 185

      const labelWidth = 23
      const col1Width = 32
      const col2Width = 32
      const col3Width = 79
      const col4Width = 19
      const rowHeight = 8

      const headerY = yPos
      const ribY = headerY + rowHeight
      const ibanY = ribY + rowHeight

      const headerStartX = tableStartX + labelWidth
      const colX1 = headerStartX + col1Width
      const colX2 = colX1 + col2Width
      const colX3 = colX2 + col3Width
      const colX4 = colX3 + col4Width

      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.3)

      // En-tête
      doc.rect(headerStartX, headerY, tableTotalWidth - labelWidth, rowHeight)

      doc.setFontSize(8)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(...blackText)
      doc.text("Code", headerStartX + 2, headerY + 3)
      doc.text("Banque", headerStartX + 2, headerY + 6)
      doc.text("Code Agence", colX1 + 2, headerY + 5)
      doc.text("N° Compte", colX2 + 2, headerY + 5)
      doc.text("Clé RIB", colX3 + 2, headerY + 5)

      // Traits verticaux
      doc.line(headerStartX, headerY, headerStartX, headerY + rowHeight)
      doc.line(colX1, headerY, colX1, headerY + rowHeight)
      doc.line(colX2, headerY, colX2, headerY + rowHeight)
      doc.line(colX3, headerY, colX3, headerY + rowHeight)
      doc.line(colX4, headerY, colX4, headerY + rowHeight)

      // Ligne RIB
      doc.rect(tableStartX, ribY, tableTotalWidth, rowHeight)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.text("RIB", tableStartX + 2, ribY + 5)

      // Formater les valeurs avec les bonnes longueurs
      const bankCode = (account.bankCode || "022").padStart(3, "0").slice(0, 3)
      const branchCode = (account.branchCode || "001").padStart(3, "0").slice(0, 3)
      const accountNumberClean = account.number.replace(/-/g, "").replace(/\s/g, "")
      // Le numéro de compte doit avoir 10 chiffres (sans la clé RIB)
      const numeroCompte = accountNumberClean.length > 10 
        ? accountNumberClean.slice(0, 10) 
        : accountNumberClean.padStart(10, "0").slice(0, 10)
      // La clé RIB est un champ séparé de 2 chiffres
      const cleRib = account.ribKey 
        ? String(account.ribKey).padStart(2, "0").slice(0, 2)
        : (accountNumberClean.length > 10 ? accountNumberClean.slice(-2) : "00")

      doc.text(bankCode, headerStartX + 2, ribY + 5)
      doc.text(branchCode, colX1 + 2, ribY + 5)
      doc.text(numeroCompte, colX2 + 2, ribY + 5)
      doc.text(cleRib, colX3 + 2, ribY + 5)

      // Traits verticaux RIB
      doc.line(tableStartX, ribY, tableStartX, ribY + rowHeight)
      doc.line(headerStartX, ribY, headerStartX, ribY + rowHeight)
      doc.line(colX1, ribY, colX1, ribY + rowHeight)
      doc.line(colX2, ribY, colX2, ribY + rowHeight)
      doc.line(colX3, ribY, colX3, ribY + rowHeight)
      doc.line(colX4, ribY, colX4, ribY + rowHeight)

      // Ligne IBAN
      doc.rect(tableStartX, ibanY, tableTotalWidth, rowHeight)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(8)
      doc.text("IBAN", tableStartX + 2, ibanY + 5)

      const ibanValue = `${account.iban}`
      const swiftCode = `CODE SWIFT: ${account.swiftCode}`
      const ibanComplete = `${ibanValue} / ${swiftCode}`

      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
      doc.text(ibanComplete, headerStartX + 2, ibanY + 5)

      doc.line(headerStartX, ibanY, headerStartX, ibanY + rowHeight)

      return ibanY + rowHeight + 20
    },
  }

  const doc = await generateStandardizedPDF(content, {
    title: "RELEVÉ D'IDENTITÉ BANCAIRE (RIB)",
    includeLogo: true,
    logoPath: "/images/logo-bng.png",
  })

  return doc.output("blob")
}

export default function RIBPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const preSelectedAccountId = searchParams.get("accountId")

  const [copied, setCopied] = useState(false)
  const [copiedRIB, setCopiedRIB] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<string>("")
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [showRib, setShowRib] = useState(false)
  const [isLoadingRib, setIsLoadingRib] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger le profil utilisateur
        const profile = await getUserProfile()
        setUserProfile(profile)

        // Charger les comptes
        const accountsData = await getAccounts()
        console.log("[RIB] Comptes récupérés:", accountsData)

        if (Array.isArray(accountsData)) {
          const adaptedAccounts: Account[] = accountsData
            .filter((acc: any) => {
              // Filtrer seulement les comptes actifs avant de les adapter
              return isAccountActive(acc.status)
            })
            .map((acc: any) => {
              // Normaliser le statut
              let status: "Actif" | "Bloqué" | "Fermé" = "Actif"
              const rawStatus = (acc.status || "").toUpperCase()
              if (rawStatus === "ACTIF" || rawStatus === "ACTIVE") {
                status = "Actif"
              } else if (rawStatus === "BLOQUÉ" || rawStatus === "BLOCKED" || rawStatus === "BLOQUE") {
                status = "Bloqué"
              } else if (rawStatus === "FERMÉ" || rawStatus === "CLOSED" || rawStatus === "FERME") {
                status = "Fermé"
              }

              return {
                id: acc.id || acc.accountId,
                name: acc.accountName || acc.name || `Compte ${acc.accountNumber}`,
                number: acc.accountNumber,
                balance: Number.parseFloat(acc.bookBalance || acc.balance || "0"),
                currency: acc.currency || "GNF",
                type: acc.type === "SAVINGS" ? ("Épargne" as const) : ("Courant" as const),
                status,
              iban: (() => {
                const bankCode = (acc.codeBanque || "022").padStart(3, "0").slice(0, 3)
                const branchCode = (acc.codeAgence || "001").padStart(3, "0").slice(0, 3)
                const accountNumberClean = (acc.accountNumber || "").replace(/-/g, "").replace(/\s/g, "")
                const numeroCompte = accountNumberClean.length > 10 
                  ? accountNumberClean.slice(0, 10) 
                  : accountNumberClean.padStart(10, "0").slice(0, 10)
                const cleRib = acc.cleRib 
                  ? String(acc.cleRib).padStart(2, "0").slice(0, 2)
                  : (accountNumberClean.length > 10 ? accountNumberClean.slice(-2) : "00")
                return `GN82${bankCode}${branchCode}${numeroCompte}${cleRib}`
              })(),
              accountHolder: profile 
                ? (profile.fullName || `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || profile.email || "TITULAIRE")
                : "TITULAIRE",
              bankName: "Banque Nationale de Guinée",
              bankCode: (acc.codeBanque || "022").padStart(3, "0").slice(0, 3),
              branchCode: (acc.codeAgence || "001").padStart(3, "0").slice(0, 3),
              branchName: "Agence Kaloum",
              swiftCode: "BNGNGNCX",
              ribKey: acc.cleRib || acc.ribKey || "00",
            }
          })

          // Filtrer seulement les comptes avec un numéro valide
          // (Les comptes actifs ont déjà été filtrés avant la normalisation)
          const validAccounts = adaptedAccounts.filter(
            (account: Account) => {
              // Vérifier que le compte a un numéro valide
              const hasValidNumber = account.number && String(account.number).trim() !== ""
              return hasValidNumber
            },
          )

          console.log("[RIB] Tous les comptes récupérés:", adaptedAccounts)
          console.log("[RIB] Comptes avec numéro valide:", validAccounts)
          
          // Si aucun compte, utiliser le fallback
          if (validAccounts.length === 0) {
            console.log("[RIB] Aucun compte trouvé, utilisation du compte de test")
            setAccounts([
              {
                id: "1",
                name: "Compte Courant",
                number: "0001234567",
                balance: 2400000,
                currency: "GNF",
                type: "Courant",
                status: "Actif",
                iban: (() => {
                  const bankCode = "022"
                  const branchCode = "001"
                  const accountNumberClean = "0001234567"
                  const numeroCompte = accountNumberClean.padStart(10, "0").slice(0, 10)
                  const cleRib = "00"
                  return `GN82${bankCode}${branchCode}${numeroCompte}${cleRib}`
                })(),
                accountHolder: profile
                  ? (profile.fullName || `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "TITULAIRE")
                  : "TITULAIRE",
                bankName: "Banque Nationale de Guinée",
          bankCode: "022",
          branchCode: "001",
                branchName: "Agence Kaloum",
                swiftCode: "BNGNGNCX",
                ribKey: "00",
              },
            ])
          } else {
            setAccounts(validAccounts)
          }
        }
      } catch (error) {
        console.error("[RIB] Erreur lors du chargement des données:", error)
        // Fallback avec données de test si API indisponible
        const fallbackAccount = {
          id: "1",
          name: "Compte Courant",
          number: "0001234567",
          balance: 2400000,
          currency: "GNF",
          type: "Courant" as const,
          status: "Actif" as const,
          iban: (() => {
            const bankCode = "022"
            const branchCode = "001"
            const accountNumberClean = "0001234567"
            const numeroCompte = accountNumberClean.padStart(10, "0").slice(0, 10)
            const cleRib = "00"
            return `GN82${bankCode}${branchCode}${numeroCompte}${cleRib}`
          })(),
          accountHolder: userProfile
            ? (userProfile.fullName || `${userProfile.firstName || ""} ${userProfile.lastName || ""}`.trim() || "TITULAIRE")
            : "TITULAIRE",
          bankName: "Banque Nationale de Guinée",
          bankCode: "022",
          branchCode: "001",
          branchName: "Agence Kaloum",
          swiftCode: "BNGNGNCX",
          ribKey: "12345",
        }
        console.log("[RIB] Utilisation du compte de test:", fallbackAccount)
        setAccounts([fallbackAccount])
      } finally {
        setIsLoadingAccounts(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    if (preSelectedAccountId && accounts.find((acc) => acc.id === preSelectedAccountId)) {
      setSelectedAccountId(preSelectedAccountId)
      setShowRib(true)
    }
  }, [preSelectedAccountId, accounts])

  const selectedAccount = accounts.find((acc) => acc.id === selectedAccountId)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyRIBToClipboard = () => {
    if (!selectedAccount) return
    // Formater le RIB avec les bonnes longueurs : Code banque (3) + Code agence (3) + Numéro compte (10) + Clé RIB (2)
    const bankCode = (selectedAccount.bankCode || "022").padStart(3, "0").slice(0, 3)
    const branchCode = (selectedAccount.branchCode || "001").padStart(3, "0").slice(0, 3)
    const accountNumberClean = selectedAccount.number.replace(/-/g, "").replace(/\s/g, "")
    const numeroCompte = accountNumberClean.length > 10 
      ? accountNumberClean.slice(0, 10) 
      : accountNumberClean.padStart(10, "0").slice(0, 10)
    const cleRib = selectedAccount.ribKey 
      ? String(selectedAccount.ribKey).padStart(2, "0").slice(0, 2)
      : (accountNumberClean.length > 10 ? accountNumberClean.slice(-2) : "00")
    const rib = `${bankCode}${branchCode}${numeroCompte}${cleRib}`
    navigator.clipboard.writeText(rib)
    setCopiedRIB(true)
    setTimeout(() => setCopiedRIB(false), 2000)
  }

  const handlePrint = () => {
    if (!selectedAccount) return

    // Créer un contenu HTML pour l'impression
    const printContent = `
      <html>
        <head>
          <title>RIB - ${selectedAccount.accountHolder}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              color: #000;
              background: #fff;
              line-height: 1.6;
            }
            .container {
              max-width: 210mm;
              height: 297mm;
              margin: 0 auto;
              padding: 20mm;
              background: white;
              color: black;
            }
            .header {
              background: #009541;
              color: #ffffff;
              display: flex;
              align-items: center;
              padding: 18px 20px;
              border-radius: 0 0 12px 12px;
              position: relative;
              margin-bottom: 24px;
            }
            .header::after {
              content: "";
              position: absolute;
              left: 0;
              bottom: -6px;
              width: 100%;
              height: 4px;
              background: #006B3F;
              border-radius: 999px;
            }
            .header-logo {
              width: 52px;
              height: auto;
              margin-right: 18px;
            }
            .bank-name {
              font-size: 18px;
              font-weight: bold;
              color: #ffffff;
              margin-bottom: 4px;
              text-transform: uppercase;
            }
            .title {
              font-size: 13px;
              font-weight: 600;
              color: #E9F6EF;
            }
            .section {
              margin-bottom: 25px;
            }
            .section-title {
              font-size: 9px;
              font-weight: bold;
              color: #006B3F;
              margin-bottom: 8px;
              background: #E9F6EF;
              display: inline-block;
              padding: 4px 10px;
              border-left: 3px solid #006B3F;
              border-radius: 4px;
            }
            .section-divider {
              border-bottom: 1px solid #f2a007;
              margin-bottom: 8px;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            .label {
              font-size: 8px;
              font-weight: normal;
              color: #000;
            }
            .value {
              font-size: 11px;
              font-weight: bold;
              color: #000;
            }
            .important-box {
              border: 1px solid #006B3F;
              background-color: #E9F6EF;
              padding: 15px;
              margin-bottom: 20px;
              margin-top: 20px;
            }
            .important-title {
              font-size: 8px;
              font-weight: bold;
              color: #006B3F;
              margin-bottom: 10px;
            }
            .important-text {
              font-size: 7px;
              color: #000;
              line-height: 1.4;
            }
            .footer {
              border-top: 1px solid #646464;
              padding-top: 10px;
              margin-top: 20px;
              font-size: 7px;
              color: #646464;
              display: flex;
              justify-content: space-between;
            }
            .footer-item {
              flex: 1;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .container {
                margin: 0;
                padding: 20mm;
                height: auto;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="/images/logo-bng.png" alt="Banque Nationale de Guinée" class="header-logo" />
              <div>
                <div class="bank-name">BANQUE NATIONALE DE GUINÉE</div>
                <div class="title">RELEVÉ D'IDENTITÉ BANCAIRE</div>
              </div>
            </div>

            <!-- Section 1: Identifiant International -->
            <div class="section">
              <div class="section-title">Identifiant international de compte bancaire</div>
              <div class="section-divider"></div>
              <div style="margin-top: 8px;">
                <div class="row">
                  <div>
                    <div class="label">IBAN (International Bank Account Number)</div>
                    <div class="value">${selectedAccount.iban}</div>
                  </div>
                  <div>
                    <div class="label">BIC (Bank Identifier Code)</div>
                    <div class="value">${selectedAccount.swiftCode}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section 2: Domiciliation -->
            <div class="section">
              <div class="section-title">Domiciliation</div>
              <div class="section-divider"></div>
              <div style="margin-top: 8px; font-size: 9px;">
                <div>Code Banque: <strong>${(selectedAccount.bankCode || "022").padStart(3, "0").slice(0, 3)}</strong></div>
                <div>Code Agence: <strong>${(selectedAccount.branchCode || "001").padStart(3, "0").slice(0, 3)}</strong></div>
                <div>Agence: <strong>${selectedAccount.branchName}</strong></div>
                <div>Banque Nationale de Guinée</div>
                <div>CONAKRY - RÉPUBLIQUE DE GUINÉE</div>
              </div>
            </div>

            <!-- Section 3: Numéro de Compte -->
            <div class="section">
              <div class="section-title">Numéro de compte</div>
              <div class="section-divider"></div>
              <div style="margin-top: 8px;">
                <div class="row">
                  <div>
                    <div class="value" style="font-size: 11px;">${selectedAccount.number}</div>
                  </div>
                  <div>
                    <div class="label">RIB (Relevé d'Identité Bancaire)</div>
                    <div class="value" style="font-size: 10px;">${(() => {
                      const bankCode = (selectedAccount.bankCode || "022").padStart(3, "0").slice(0, 3)
                      const branchCode = (selectedAccount.branchCode || "001").padStart(3, "0").slice(0, 3)
                      const accountNumberClean = selectedAccount.number.replace(/-/g, "").replace(/\s/g, "")
                      const numeroCompte = accountNumberClean.length > 10 
                        ? accountNumberClean.slice(0, 10) 
                        : accountNumberClean.padStart(10, "0").slice(0, 10)
                      const cleRib = selectedAccount.ribKey 
                        ? String(selectedAccount.ribKey).padStart(2, "0").slice(0, 2)
                        : (accountNumberClean.length > 10 ? accountNumberClean.slice(-2) : "00")
                      return `${bankCode}${branchCode}${numeroCompte}${cleRib}`
                    })()}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Important Box -->
            <div class="important-box">
              <div class="important-title">IMPORTANT - À CONSERVER PRÉCIEUSEMENT</div>
              <div class="important-text">
                Ce relevé d'identité bancaire est un document officiel nécessaire pour recevoir des virements. 
                Il est valable pour les virements nationaux et internationaux, les prélèvements automatiques 
                et la domiciliation de votre salaire. Ne le communiquez qu'à des organismes de confiance. 
                Conservez-le précieusement. Toute utilisation frauduleuse est pénalement sanctionnée.
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="footer-item">Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}</div>
              <div class="footer-item">Réf: RIB-${selectedAccount.number.replace(/-/g, "")}-${Date.now()}</div>
              <div class="footer-item" style="text-align: right;">Page 1/1</div>
            </div>
          </div>
        </body>
      </html>
    `

    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()

      // Attendre que le contenu soit chargé avant d'imprimer
      setTimeout(() => {
        printWindow.print()
      }, 250)
    } else {
      toast({
        variant: "destructive",
        title: "Autorisation requise",
        description: "Veuillez autoriser les pop-ups pour utiliser la fonction d'impression",
      })
    }
  }

  const downloadPDF = async () => {
    if (!selectedAccount) return

    try {
      const pdfBlob = await generatePDF(selectedAccount)
      const fileName = `RIB_${selectedAccount.number.replace(/-/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error)
      const pdfContent = `
        RELEVÉ D'IDENTITÉ BANCAIRE (RIB)
        
        ${selectedAccount.bankName.toUpperCase()}
        
        Numéro de compte: ${selectedAccount.number}
        IBAN: ${selectedAccount.iban}
        Code banque: ${(selectedAccount.bankCode || "022").padStart(3, "0").slice(0, 3)}
        Code agence: ${(selectedAccount.branchCode || "001").padStart(3, "0").slice(0, 3)}
        Code SWIFT: ${selectedAccount.swiftCode}
        
        Agence: ${selectedAccount.branchName}
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

  const handleEmailSend = async () => {
    if (!selectedAccount || !userProfile?.email) {
      toast({
        variant: "destructive",
        title: "Email requis",
        description: "Ajoutez un email à votre profil utilisateur pour recevoir votre RIB.",
      })
      return
    }

    setIsSendingEmail(true)

    try {
      const pdfBlob = await generatePDF(selectedAccount)
      const fileName = `RIB_${selectedAccount.number.replace(/-/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`
      const pdfArrayBuffer = await pdfBlob.arrayBuffer()
      const pdfBase64 = arrayBufferToBase64(pdfArrayBuffer)

      const emailSubject = `Relevé d'Identité Bancaire - ${selectedAccount.number}`
      const emailHtml = `
        <p>Bonjour ${userProfile.firstName || ""} ${userProfile.lastName || ""},</p>
        <p>Veuillez trouver ci-joint votre Relevé d'Identité Bancaire (RIB) pour le compte <strong>${selectedAccount.number}</strong>.</p>
        <p>Ce document vous permettra de réaliser des virements et domiciliations en toute sécurité.</p>
        <p>Cordialement,<br/>Banque Nationale de Guinée</p>
      `
      const emailText = `Bonjour ${userProfile.firstName || ""} ${userProfile.lastName || ""},\n\nVeuillez trouver ci-joint votre Relevé d'Identité Bancaire (RIB) pour le compte ${selectedAccount.number}.\nCe document vous permettra de réaliser des virements et domiciliations en toute sécurité.\n\nCordialement,\nBanque Nationale de Guinée`

      const result = await sendRibEmail({
        to: userProfile.email,
        subject: emailSubject,
        html: emailHtml,
        text: emailText,
        attachment: {
          filename: fileName,
          content: pdfBase64,
          contentType: "application/pdf",
        },
      })

      if (!result?.success) {
        throw new Error(result?.error || "Une erreur est survenue lors de l'envoi du RIB")
      }

      toast({
        title: "Email envoyé",
        description: `Votre RIB a été envoyé à ${userProfile.email}`,
      })
      setIsEmailDialogOpen(false)
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email:", error)
      toast({
        variant: "destructive",
        title: "Envoi impossible",
        description: "Erreur lors de l'envoi du RIB. Veuillez réessayer.",
      })
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
        return <DollarSign className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const formatAmount = (amount: number, currency = "GNF") => {
    if (currency === "GNF") {
      return new Intl.NumberFormat("fr-FR").format(Math.trunc(amount))
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(Math.trunc(amount))
  }

  const loadFullRibData = async () => {
    if (!selectedAccountId) return

    try {
      setIsLoadingRib(true)
      const ribData = await getAccountForRib(selectedAccountId)
      console.log("[RIB] Données du RIB récupérées:", ribData)
      setShowRib(true)
    } catch (error) {
      console.error("Erreur lors du chargement des données du RIB:", error)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors du chargement des données du RIB. Veuillez réessayer.",
      })
    } finally {
      setIsLoadingRib(false)
    }
  }

  if (!showRib) {
    return (
      <div className="mt-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-primary">Relevé de Coordonnées Bancaire (RIB)</h1>
          <p className="text-sm text-muted-foreground">
            Sélectionnez le compte pour lequel vous souhaitez obtenir le RIB
          </p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Sélection du compte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label htmlFor="account-select">Choisir le compte pour le RIB</Label>
              {!isLoadingAccounts && accounts.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground bg-gray-50 rounded-lg border">
                  Aucun compte disponible. Veuillez créer un compte pour obtenir un RIB.
                </div>
              ) : (
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId} disabled={isLoadingAccounts}>
                  <SelectTrigger id="account-select" className="h-auto min-h-[50px]">
                    <SelectValue
                      placeholder={isLoadingAccounts ? "Chargement des comptes..." : "Sélectionner un compte"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} - {account.number} ({formatAmount(account.balance ?? 0, account.currency)} {account.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedAccount && (
              <div className="p-4 bg-gray-50 rounded-lg border">
                <h3 className="font-medium mb-3">Aperçu du compte sélectionné</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nom du compte</span>
                    <span className="font-medium">{selectedAccount.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Numéro</span>
                    <span className="font-mono">{selectedAccount.number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span>{selectedAccount.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Solde</span>
                    <span className="font-semibold text-green-600">
                      {formatAmount(selectedAccount.balance, selectedAccount.currency)} {selectedAccount.currency}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={loadFullRibData}
              disabled={!selectedAccountId || isLoadingRib || isLoadingAccounts}
            >
              {isLoadingRib ? "Chargement..." : "Afficher le RIB"}
              {!isLoadingRib && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">Relevé de Coordonnées Bancaire (RIB)</h1>
        <p className="text-sm text-muted-foreground">Consultez et téléchargez votre RIB</p>
        <div className="mt-2">
          <Button variant="outline" size="sm" onClick={() => setShowRib(false)}>
            ← Changer de compte
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <CreditCard className="w-5 h-5 mr-2" />
                Informations bancaires
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {selectedAccount && (
                <>
                  <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg bg-gray-50">
                    <div className="text-center mb-3">
                      <h2 className="text-base font-bold text-emerald-700">{selectedAccount.bankName.toUpperCase()}</h2>
                      <p className="text-xs text-gray-600">RELEVÉ D'IDENTITÉ BANCAIRE</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Titulaire du compte</p>
                        <p className="font-semibold text-sm">{selectedAccount.accountHolder}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Numéro de compte</p>
                        <p className="font-mono font-semibold text-sm">{selectedAccount.number}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Code banque</p>
                        <p className="font-mono text-sm">{(selectedAccount.bankCode || "022").padStart(3, "0").slice(0, 3)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Code agence</p>
                        <p className="font-mono text-sm">{(selectedAccount.branchCode || "001").padStart(3, "0").slice(0, 3)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">RIB</p>
                        <p className="font-mono font-semibold text-sm">
                          {selectedAccount?.bankCode ?? ""}
                          {selectedAccount?.branchCode ?? ""}
                          {(selectedAccount?.number ?? "").replace(/-/g, "")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">IBAN</p>
                        <p className="font-mono font-semibold text-sm">{selectedAccount.iban}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Code SWIFT</p>
                          <p className="font-mono font-semibold text-sm">{selectedAccount.swiftCode}</p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant="outline"
                            className={
                              selectedAccount.status === "Actif"
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                            }
                          >
                            Compte {selectedAccount.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Type de compte</p>
                          <p className="font-medium text-sm">{selectedAccount.type}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Devise</p>
                          <p className="font-medium text-sm">{selectedAccount.currency}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={downloadPDF} size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger PDF
                    </Button>
                    <Button variant="outline" onClick={handlePrint} size="sm">
                      <Printer className="w-4 h-4 mr-2" />
                      Imprimer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (userProfile?.email) {
                          setIsEmailDialogOpen(true)
                        } else {
                          toast({
                            variant: "destructive",
                            title: "Email requis",
                            description: "Ajoutez un email à votre profil utilisateur pour recevoir votre RIB.",
                          })
                        }
                      }}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Envoyer par email
                    </Button>
                    <Button variant="outline" onClick={copyRIBToClipboard} size="sm">
                      <Copy className="w-4 h-4 mr-2" />
                      {copiedRIB ? "Copié !" : "Copier RIB"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          {selectedAccount && (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base">
                    <Building className="w-5 h-5 mr-2" />
                    Informations agence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div>
                    <p className="font-semibold text-sm">{selectedAccount.branchName}</p>
                    <p className="text-xs text-gray-600">{selectedAccount.bankName}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs">Avenue de la République</p>
                        <p className="text-xs">Kaloum, Conakry</p>
                        <p className="text-xs">République de Guinée</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <p className="text-xs">+224 622 123 456</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <p className="text-xs text-gray-500">Horaires d'ouverture</p>
                    <p className="text-xs">Lun - Ven: 8h00 - 16h00</p>
                    <p className="text-xs">Sam: 8h00 - 12h00</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Utilisation du RIB</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1"></div>
                      <p>Recevoir des virements</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1"></div>
                      <p>Domicilier votre salaire</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1"></div>
                      <p>Prélèvements automatiques</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1"></div>
                      <p>Virements internationaux</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {selectedAccount && (
        <AlertDialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Envoyer le RIB par email</AlertDialogTitle>
              <AlertDialogDescription>Vous recevrez un email contenant votre RIB.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsEmailDialogOpen(false)}>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleEmailSend} disabled={isSendingEmail}>
                {isSendingEmail ? "Envoi..." : "Confirmer"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
