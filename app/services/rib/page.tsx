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
  CheckCircle,
  Wallet,
  PiggyBank,
  DollarSign,
} from "lucide-react"
import { getAccounts } from "../../accounts/actions"
import { getUserProfile, getAccountForRib, sendRibEmail } from "./actions"
import { generateRibData } from "./rib-utils"
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

  const doc = new jsPDF()
  const pageWidth = 210
  const pageHeight = 297

  // ═══════════════════════════════════════════════════════════════════════════
  // COULEURS BNG
  // ═══════════════════════════════════════════════════════════════════════════
  const primaryGreen: [number, number, number] = [0, 149, 65] // Vert BNG principal (#009541)
  const deepGreen: [number, number, number] = [0, 107, 63] // Vert foncé pour les accents (#006B3F)
  const lightGreen: [number, number, number] = [233, 246, 239] // Vert très clair pour fonds (#E9F6EF)
  const blackText: [number, number, number] = [20, 30, 30] // Texte principal
  const grayBorder: [number, number, number] = [170, 180, 170] // Bordures neutres

  const logoDataUrl = await getBngLogoDataUrl()
  const headerHeight = 36

  // Fond de l'en-tête bleu
  doc.setFillColor(...primaryGreen)
  doc.rect(0, 0, pageWidth, headerHeight, "F")

  // Ligne dorée
  doc.setFillColor(...deepGreen)
  doc.rect(0, headerHeight, pageWidth, 2, "F")

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", 15, 6, 24, 24)
  }

  const headerTextX = logoDataUrl ? 45 : 15

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("BANQUE NATIONALE DE GUINÉE", headerTextX, 16)

  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.text("RELEVÉ D'IDENTITÉ BANCAIRE", headerTextX, 24)

  doc.setDrawColor(...deepGreen)
  doc.setLineWidth(0.6)
  doc.line(15, headerHeight + 6, pageWidth - 15, headerHeight + 6)

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1: IDENTIFIANT INTERNATIONAL
  // ═══════════════════════════════════════════════════════════════════════════

  let yPos = headerHeight + 16

  doc.setTextColor(...primaryGreen)
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("Identifiant international de compte bancaire", 15, yPos)

  doc.setDrawColor(...deepGreen)
  doc.setLineWidth(0.2)
  doc.line(15, yPos + 3, pageWidth - 15, yPos + 3)

  yPos += 9
  doc.setTextColor(...blackText)
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text("IBAN (International Bank Account Number)", 15, yPos)
  doc.text("BIC (Bank Identifier Code)", 120, yPos)

  yPos += 5
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  const ibanDisplay = account.iban
  doc.text(ibanDisplay, 15, yPos)
  doc.text(account.swiftCode, 120, yPos)

  yPos += 12

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: DOMICILIATION
  // ═══════════════════════════════════════════════════════════════════════════

  doc.setTextColor(...primaryGreen)
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("Domiciliation", 15, yPos)

  yPos += 5

  // Ligne de séparation
  doc.setDrawColor(...deepGreen)
  doc.setLineWidth(0.2)
  doc.line(15, yPos, pageWidth - 15, yPos)

  yPos += 6

  // Détails de domiciliation
  doc.setTextColor(...blackText)
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")

  const domicilationLines = [
    `Code Banque: ${account.bankCode}`,
    `Code Agence: ${account.branchCode}`,
    `Agence: ${account.branchName}`,
    "Banque Nationale de Guinée",
    "CONAKRY - RÉPUBLIQUE DE GUINÉE"
  ]

  domicilationLines.forEach(line => {
    doc.text(line, 15, yPos)
    yPos += 5
  })

  yPos += 5

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: NUMÉRO DE COMPTE
  // ═══════════════════════════════════════════════════════════════════════════

  doc.setTextColor(...primaryGreen)
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("Numéro de compte", 15, yPos)

  yPos += 5

  // Ligne de séparation
  doc.setDrawColor(...deepGreen)
  doc.setLineWidth(0.2)
  doc.line(15, yPos, pageWidth - 15, yPos)

  yPos += 6

  doc.setTextColor(...blackText)
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text(account.number, 15, yPos)

  // Code RIB à droite
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...blackText)
  doc.text("RIB (Relevé d'Identité Bancaire):", 120, yPos - 3)

  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  const ribCode = `${account.bankCode} ${account.branchCode} ${account.number.replace(/-/g, "")}`
  doc.text(ribCode, 120, yPos + 2)

  yPos += 15

  // ═══════════════════════════════════════════════════════════════════════════
  // ENCADRÉ D'INFORMATION IMPORTANTE
  // ═══════════════════════════════════════════════════════════════════════════

  yPos = pageHeight - 60

  doc.setDrawColor(...primaryGreen)
  doc.setLineWidth(0.5)
  doc.rect(15, yPos, pageWidth - 30, 30)

  // Fond léger
  doc.setFillColor(...lightGreen)
  doc.rect(15, yPos, pageWidth - 30, 30, "F")

  // Texte important
  yPos += 4
  doc.setTextColor(...primaryGreen)
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text("IMPORTANT - À CONSERVER PRÉCIEUSEMENT", 18, yPos)

  yPos += 5
  doc.setTextColor(...blackText)
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")

  const importantText = [
    "Ce relevé d'identité bancaire est un document officiel nécessaire pour recevoir des virements.",
    "Il est valable pour les virements nationaux et internationaux, les prélèvements automatiques",
    "et la domiciliation de votre salaire. Ne le communiquez qu'à des organismes de confiance.",
    "Conservez-le précieusement. Toute utilisation frauduleuse est pénalement sanctionnée."
  ]

  importantText.forEach(line => {
    doc.text(line, 18, yPos, { maxWidth: pageWidth - 36 })
    yPos += 4
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // PIED DE PAGE
  // ═══════════════════════════════════════════════════════════════════════════

  const generatedDate = new Date()
  const formattedDate = generatedDate.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric"
  })
  const formattedTime = generatedDate.toLocaleTimeString("fr-FR")

  // Ligne de séparation finale
  doc.setDrawColor(...grayBorder)
  doc.setLineWidth(0.3)
  doc.line(15, pageHeight - 10, pageWidth - 15, pageHeight - 10)

  doc.setTextColor(...grayBorder)
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.text(`Généré le ${formattedDate} à ${formattedTime}`, 15, pageHeight - 5)
  doc.text(`Réf: RIB-${account.number.replace(/-/g, "")}-${generatedDate.getTime()}`, 90, pageHeight - 5)
  doc.text("Page 1/1", pageWidth - 25, pageHeight - 5)

  // Numéro de sécurité en haut à droite
  doc.setTextColor(...primaryGreen)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  doc.text("DOCUMENT OFFICIEL", pageWidth - 45, 8)

  const fileName = `RIB_${account.number.replace(/-/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`
  return doc.output("blob")
}

export default function RIBPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const preSelectedAccountId = searchParams.get("accountId")

  const [copied, setCopied] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<string>("")
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)

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
          const adaptedAccounts: Account[] = await Promise.all(
            accountsData.map(async (acc: any) => {
              // Récupérer les infos détaillées du compte
              const ribInfo = await getAccountForRib(acc.id)
              const ribData = ribInfo ? generateRibData(ribInfo, profile) : null

              return {
                id: acc.id || acc.accountId,
                name: acc.accountName || acc.name || `Compte ${acc.accountNumber}`,
                number: acc.accountNumber,
                balance: Number.parseFloat(acc.bookBalance || acc.balance || "0"),
                currency: acc.currency || "GNF",
                type: acc.type === "SAVINGS" ? ("Épargne" as const) : ("Courant" as const),
                status: (acc.status === "ACTIF" ? "Actif" : acc.status) as "Actif" | "Bloqué" | "Fermé",
                iban: ribData?.iban || `GN82 ${acc.codeBanque || "BNG"} ${acc.codeAgence || "001"} ${acc.accountNumber}`,
                accountHolder: ribData?.accountHolder || (profile ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim() : "TITULAIRE"),
                bankName: ribData?.bankName || "Banque Nationale de Guinée",
                bankCode: ribData?.bankCode || acc.codeBanque || "BNG",
                branchCode: ribData?.branchCode || acc.codeAgence || "001",
                branchName: ribData?.branchName || "Agence Kaloum",
                swiftCode: ribData?.swiftCode || "BNGNGNCX",
              }
            })
          )

          const activeAccounts = adaptedAccounts.filter(
            (account: Account) => account.status === "Actif" && account.number && String(account.number).trim() !== "",
          )

          console.log("[RIB] Comptes actifs avec données complètes:", activeAccounts)
          setAccounts(activeAccounts)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error)
        // Fallback avec données de test si API indisponible
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
            accountHolder: userProfile ? `${userProfile.firstName || ""} ${userProfile.lastName || ""}`.trim() : "DIALLO Mamadou",
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

    loadData()
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

  const handlePrint = () => {
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
                <div>Code Banque: <strong>${selectedAccount.bankCode}</strong></div>
                <div>Code Agence: <strong>${selectedAccount.branchCode}</strong></div>
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
                    <div class="value" style="font-size: 10px;">${selectedAccount.bankCode} ${selectedAccount.branchCode} ${selectedAccount.number.replace(/-/g, "")}</div>
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
        Code banque: ${selectedAccount.bankCode}
        Code agence: ${selectedAccount.branchCode}
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
      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Relevé d'Identité Bancaire (RIB)
        </h1>
        <p className="text-muted-foreground text-lg">Consultez et téléchargez votre RIB</p>
        {preSelectedAccount && (
          <div className="mt-2">
            <Alert className="border-emerald-200 bg-emerald-50">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-700">
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
                          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 ml-2">
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
                  <h2 className="text-lg font-bold text-emerald-700">{selectedAccount.bankName.toUpperCase()}</h2>
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
                      {selectedAccount?.bankCode ?? ""} {selectedAccount?.branchCode ?? ""}{" "}
                      {(selectedAccount?.number ?? "").replace(/-/g, "")}
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
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimer
                </Button>
                <Button variant="outline" onClick={() => {
                   if (userProfile?.email) {
                     setIsEmailDialogOpen(true)
                   } else {
                     toast({
                       variant: "destructive",
                       title: "Email requis",
                       description: "Ajoutez un email à votre profil utilisateur pour recevoir votre RIB.",
                     })
                   }
                 }}>
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
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                  <p>Recevoir des virements</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                  <p>Domicilier votre salaire</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                  <p>Prélèvements automatiques</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
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

      <AlertDialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Envoyer le RIB par email</AlertDialogTitle>
            <AlertDialogDescription>
              Vous recevrez un email contenant votre RIB.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsEmailDialogOpen(false)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleEmailSend} disabled={isSendingEmail}>
              {isSendingEmail ? "Envoi..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
