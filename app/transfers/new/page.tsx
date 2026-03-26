"use client"

import type React from "react"
import { useState, useTransition, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { addBeneficiaryAndActivate } from "../beneficiaries/actions"
import { executeTransfer, validateTransferBeforeOtp } from "./actions"
import { getAccounts } from "../../accounts/actions"
import { getBeneficiaries, getBanks } from "../beneficiaries/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowRight, Plus, User, Check, AlertCircle, Wallet, Loader2 } from "lucide-react"
import { useActionState } from "react"
import { OtpModal } from "@/components/otp-modal"
import { toast } from "@/hooks/use-toast"
import { isAccountActive } from "@/lib/status-utils"
import { DatePickerField, toLocalYmd } from "@/components/ui/date-picker-field"

// Types
interface Beneficiary {
  id: string
  name: string
  account: string
  bank: string
  type: "BNG-BNG" | "BNG-CONFRERE" | "International"
  workflowStatus?: string
  status?: number
  clerib?: string
}

interface Account {
  id: string
  name: string
  number: string
  balance: number
  currency: string
  status?: string
}

interface Bank {
  id: string
  bankName: string
  swiftCode: string
  codeBank: string
}

type TransferType = "account-to-account" | "account-to-beneficiary" | "account-to-occasional-beneficiary"

function TransferFieldHint({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="text-sm text-destructive mt-1.5" role="alert">
      {message}
    </p>
  )
}

/** Nombre de chiffres attendu pour le compte bénéficiaire ponctuel (aligné sur le formulaire) */
const OCCASIONAL_BENEFICIARY_ACCOUNT_DIGITS = 18

function getOccasionalAccountFormatMessage(accountValue: string): string | undefined {
  const acc = accountValue.trim()
  if (!acc) return undefined
  if (!/^\d+$/.test(acc)) {
    return "Le numéro de compte ne doit contenir que des chiffres."
  }
  if (acc.length !== OCCASIONAL_BENEFICIARY_ACCOUNT_DIGITS) {
    return `Le numéro doit comporter exactement ${OCCASIONAL_BENEFICIARY_ACCOUNT_DIGITS} chiffres (actuellement : ${acc.length}).`
  }
  return undefined
}

const countries = [
  "France",
  "Sénégal",
  "Mali",
  "Côte d'Ivoire",
  "Burkina Faso",
  "Niger",
  "Mauritanie",
  "Gambie",
  "Sierra Leone",
  "Liberia",
]

const AGENCE_CODE_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "Agence Principale — Koulewondy", value: "012" },
  { label: "Agence Port — Port Almamya", value: "252" },
  { label: "Agence Madina — Madina Ecole", value: "212" },
  { label: "Agence Lambanyi — Lambanyi", value: "022" },
  { label: "Agence Kagbelen — Kagbelen", value: "032" },
  { label: "Agance Kamsar — Kamsar", value: "007" },
  { label: "Agence Kankan — Kankan", value: "152" },
]

export default function NewTransferPage() {
  const router = useRouter()
  const [transferType, setTransferType] = useState<TransferType>("account-to-beneficiary")

  // États pour le virement
  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string>("")
  const [selectedCreditAccount, setSelectedCreditAccount] = useState<string>("")
  const [occasionalBeneficiary, setOccasionalBeneficiary] = useState<{
    name: string
    account: string
    bank: string
    type?: string
    codeAgence?: string
    cleRib?: string
    codeBanque?: string
    id?: string
  } | null>(null)
  const [occasionalBeneficiaryName, setOccasionalBeneficiaryName] = useState<string>("")
  const [occasionalBeneficiaryAccount, setOccasionalBeneficiaryAccount] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [motif, setMotif] = useState<string>("")
  const [transferDate, setTransferDate] = useState<string>(toLocalYmd())
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [isLoadingBeneficiaries, setIsLoadingBeneficiaries] = useState(true)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)

  const [transferValidationError, setTransferValidationError] = useState<string>("")
  const [transferSubmitted, setTransferSubmitted] = useState(false)
  /** Afficher les erreurs de champ uniquement après toucher ou soumission (évite le rouge au chargement) */
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const [isAddBeneficiaryDialogOpen, setIsAddBeneficiaryDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [transferState, transferAction, isTransferPending] = useActionState(executeTransfer, null)
  const [addBeneficiaryState, addBeneficiaryAction, isAddBeneficiaryPending] = useActionState(
    addBeneficiaryAndActivate,
    null,
  )

  const [selectedType, setSelectedType] = useState("")
  const [selectedBank, setSelectedBank] = useState("")
  const [banks, setBanks] = useState<Bank[]>([])
  const [selectedBankCode, setSelectedBankCode] = useState("")
  const [selectedSwiftCode, setSelectedSwiftCode] = useState("")
  const [loadingBanks, setLoadingBanks] = useState(false)
  const [accountNumberError, setAccountNumberError] = useState<string | null>(null)
  const [addFormSuccess, setAddFormSuccess] = useState(false)
  const [selectedAgenceCode, setSelectedAgenceCode] = useState("")
  const beneficiaryFormRef = useRef<HTMLFormElement>(null)

  const [beneficiaryMessage, setBeneficiaryMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // États pour la validation en temps réel du montant
  const [amountError, setAmountError] = useState<string>("")
  const [isAmountValid, setIsAmountValid] = useState(true)

  // États pour l'OTP
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpReferenceId, setOtpReferenceId] = useState<string | null>(null)
  const [pendingTransferData, setPendingTransferData] = useState<FormData | null>(null)
  
  // États pour la modale de confirmation
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [isTransferConfirmed, setIsTransferConfirmed] = useState(false)
  const [isPreOtpValidating, setIsPreOtpValidating] = useState(false)
  const [confirmPreOtpError, setConfirmPreOtpError] = useState("")

  // Refs pour le scroll automatique vers les messages
  const successMessageRef = useRef<HTMLDivElement>(null)
  const errorMessageRef = useRef<HTMLDivElement>(null)
  const validationErrorMessageRef = useRef<HTMLDivElement>(null)
  /** Évite de réinitialiser le formulaire au 2e clic sur Confirmer quand transferState.success est encore celui du virement précédent */
  const lastProcessedSuccessRef = useRef<unknown>(null)

  // États pour contrôler l'affichage des messages
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [showErrorMessage, setShowErrorMessage] = useState(false)

  // Fonctions utilitaires
  const toText = (val: any): string => (typeof val === "string" ? val : val ? JSON.stringify(val) : "")
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency === "GNF" ? "GNF" : currency,
      minimumFractionDigits: currency === "GNF" ? 0 : 2,
    }).format(Math.trunc(amount))
  }

  const validateRIB = (account: string, type: string): boolean => {
    switch (type) {
      case "BNG-BNG":
        return /^BNG-\d{4}-\d{6}-\d{2}$/.test(account)
      case "BNG-CONFRERE":
        return /^[A-Z]{3}-\d{4}-\d{6}-\d{2}$/.test(account)
      case "International":
        return /^[A-Z]{2}\d{2}[\s\d]{15,34}$/.test(account.replace(/\s/g, ""))
      default:
        return false
    }
  }

  const loadBanks = async () => {
    try {
      setLoadingBanks(true)
      const banksData = await getBanks()
      setBanks(banksData)
    } catch (error) {
      console.error("Erreur lors du chargement des banques:", error)
      setBanks([])
    } finally {
      setLoadingBanks(false)
    }
  }

  const validateAccountNumber = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "")

    if (digitsOnly.length === 0) {
      setAccountNumberError(null)
      return
    }

    if (digitsOnly.length !== 10) {
      setAccountNumberError("Le numéro de compte doit contenir exactement 10 chiffres")
      return false
    }

    if (value !== digitsOnly) {
      setAccountNumberError("Le numéro de compte ne doit contenir que des chiffres")
      return false
    }

    setAccountNumberError(null)
    return true
  }

  const handleBankSelection = (bankName: string) => {
    setSelectedBank(bankName)
    const selectedBankData = banks.find((bank) => bank.bankName === bankName)
    if (selectedBankData) {
      setSelectedBankCode(selectedBankData.codeBank || "")
      setSelectedSwiftCode(selectedBankData.swiftCode || "")
    } else {
      setSelectedBankCode("")
      setSelectedSwiftCode("")
    }
  }

  const resetBeneficiaryForm = () => {
    setSelectedType("")
    setSelectedBank("")
    setSelectedBankCode("")
    setSelectedSwiftCode("")
    setAccountNumberError(null)
    setAddFormSuccess(false)
    setSelectedAgenceCode("")
    if (beneficiaryFormRef.current) {
      beneficiaryFormRef.current.reset()
    }
  }

  const handleRibFieldChange = () => {
    // Fonction pour marquer le formulaire comme modifié si nécessaire
  }

  const handleAddBeneficiary = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    if (selectedType !== "BNG-INTERNATIONAL") {
      const accountNumber = formData.get("account") as string
      if (!validateAccountNumber(accountNumber)) {
        return
      }
    }

    formData.set("type", selectedType)

    if (selectedType === "BNG-BNG") {
      const internalBankCode = selectedBankCode || "022"
      formData.set("bank", "GNXXX")
      formData.set("bankname", "Banque Nationale de Guinée")
      formData.set("bankCode", internalBankCode)
      formData.set("codeBanque", internalBankCode)
    } else if (selectedType === "BNG-CONFRERE") {
      formData.set("bank", selectedBankCode)
      formData.set("bankname", selectedBank)
      if (selectedBankCode) {
        formData.set("bankCode", selectedBankCode)
        formData.set("codeBanque", selectedBankCode)
      }
    } else {
      const bankValue = selectedBank
      formData.set("bank", bankValue)
      if (bankValue) {
        formData.set("bankname", bankValue)
      }
    }

    // Cette partie n'est plus utilisée pour les bénéficiaires ponctuels
    // Les bénéficiaires ponctuels sont maintenant saisis directement dans la card

    // Pour les bénéficiaires normaux, enregistrer en BD
    startTransition(() => {
      addBeneficiaryAction(formData)
    })
  }

  /** Marque un champ comme touché pour afficher ses erreurs */
  const markFieldTouched = (field: string) =>
    setTouchedFields((prev) => (prev[field] ? prev : { ...prev, [field]: true }))

  const handleTransferTypeChange = (type: TransferType) => {
    setTransferType(type)
    setSelectedBeneficiary("")
    setSelectedCreditAccount("")
    setOccasionalBeneficiary(null)
    setOccasionalBeneficiaryName("")
    setOccasionalBeneficiaryAccount("")
    setTransferValidationError("")
    setTransferSubmitted(false)
    setTouchedFields({})
    setSubmitAttempted(false) // Nouveau type = formulaire visuellement réinitialisé
  }

  const handleDebitAccountChange = (accountId: string) => {
    setSelectedAccount(accountId)
    // Reset credit account selection when debit account changes to ensure currency compatibility
    if (transferType === "account-to-account") {
      setSelectedCreditAccount("")
    }
  }

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setTransferSubmitted(true)
    setSubmitAttempted(true) // Afficher les erreurs de champs après soumission
    setTransferValidationError("") // Réinitialiser les erreurs

    if (!selectedAccount) {
      setTransferValidationError("Veuillez sélectionner un compte débiteur")
      setTransferSubmitted(false)
      return
    }

    if (transferType === "account-to-beneficiary") {
      if (!selectedBeneficiary) {
        setTransferValidationError("Veuillez sélectionner un bénéficiaire")
        setTransferSubmitted(false)
        return
      }
    } else if (transferType === "account-to-occasional-beneficiary") {
      if (!occasionalBeneficiaryName.trim() || !occasionalBeneficiaryAccount.trim()) {
        setTransferValidationError("Veuillez saisir le nom et le numéro de compte du bénéficiaire ponctuel")
        setTransferSubmitted(false)
        return
      }
      const occasionalAcctMsg = getOccasionalAccountFormatMessage(occasionalBeneficiaryAccount)
      if (occasionalAcctMsg) {
        setTransferValidationError(occasionalAcctMsg)
        setTransferSubmitted(false)
        return
      }
    } else {
      if (!selectedCreditAccount) {
        setTransferValidationError("Veuillez sélectionner un compte créditeur")
        setTransferSubmitted(false)
        return
      }
      if (selectedAccount === selectedCreditAccount) {
        setTransferValidationError("Le compte débiteur et créditeur ne peuvent pas être identiques")
        setTransferSubmitted(false)
        return
      }
      const debitAccount = accounts.find((acc) => acc.id === selectedAccount)
      const creditAccount = accounts.find((acc) => acc.id === selectedCreditAccount)
      if (debitAccount && creditAccount && debitAccount.currency !== creditAccount.currency) {
        setTransferValidationError(
          "Les virements compte à compte ne peuvent être effectués qu'entre des comptes de même devise",
        )
        setTransferSubmitted(false)
        return
      }
    }

    if (!amount || Number.parseFloat(amount) <= 0) {
      setTransferValidationError("Veuillez saisir un montant valide")
      setTransferSubmitted(false)
      return
    }

    const amountNum = Number.parseFloat(amount)
    if (amountNum < 1000) {
      setTransferValidationError("Montant minimum : 1 000 GNF")
      setTransferSubmitted(false)
      return
    }

    const debitAccount = accounts.find((acc) => acc.id === selectedAccount)
    if (debitAccount && Number.parseFloat(amount) > debitAccount.balance) {
      setTransferValidationError(
        `Le montant saisi (${formatCurrency(Number.parseFloat(amount), debitAccount.currency)}) dépasse le solde disponible (${formatCurrency(debitAccount.balance, debitAccount.currency)})`,
      )
      setTransferSubmitted(false)
      return
    }

    if (motif.trim().length < 5) {
      setTransferValidationError("Le motif doit contenir au moins 5 caractères")
      setTransferSubmitted(false)
      return
    }

    if (!transferDate?.trim()) {
      setTransferValidationError("Veuillez choisir une date d'exécution")
      setTransferSubmitted(false)
      return
    }

    const execDate = new Date(transferDate)
    if (Number.isNaN(execDate.getTime())) {
      setTransferValidationError("La date d'exécution n'est pas valide")
      setTransferSubmitted(false)
      return
    }

    // Si c'est un bénéficiaire ponctuel, enregistrer optionnellement en BD (pour historique)
    // Le virement utilise toujours les champs de saisie directement
    if (transferType === "account-to-occasional-beneficiary" && occasionalBeneficiaryName && occasionalBeneficiaryAccount) {
      const beneficiaryFormData = new FormData()
      beneficiaryFormData.append("name", occasionalBeneficiaryName.trim())
      beneficiaryFormData.append("account", occasionalBeneficiaryAccount.trim())
      beneficiaryFormData.append("type", "BNG-BNG")
      beneficiaryFormData.append("bankname", "Banque Nationale de Guinée")
      beneficiaryFormData.append("status", "100")
      beneficiaryFormData.append("bankCode", "022")
      beneficiaryFormData.append("codeBanque", "022")

      addBeneficiaryAndActivate(null, beneficiaryFormData).then((result) => {
        if (result.success) {
          setOccasionalBeneficiary({
            name: occasionalBeneficiaryName.trim(),
            account: occasionalBeneficiaryAccount.trim(),
            bank: "Banque Nationale de Guinée",
            type: "BNG-BNG",
            id: `BEN_${Date.now()}`,
          })
        }
      }).catch(() => { /* Ignorer l'erreur, le virement utilise les champs directs */ })
    }

    const formData = new FormData()
    formData.append("sourceAccount", selectedAccount)
    formData.append("transferType", transferType)

    if (transferType === "account-to-beneficiary") {
      formData.append("beneficiaryId", selectedBeneficiary)
    } else if (transferType === "account-to-occasional-beneficiary") {
      // Toujours utiliser les champs de saisie directement (comme demandé)
      formData.append("occasionalBeneficiaryName", occasionalBeneficiaryName.trim())
      formData.append("occasionalBeneficiaryAccount", occasionalBeneficiaryAccount.trim())
    } else {
      formData.append("targetAccount", selectedCreditAccount)
    }

    formData.append("amount", amount)
    formData.append("purpose", motif)
    formData.append("transferDate", transferDate)

    // Stocker les données du virement pour la modale de confirmation
    setConfirmPreOtpError("")
    setPendingTransferData(formData)
    setIsTransferConfirmed(false)
    setShowConfirmationModal(true)
  }

  // Fonction pour déclencher l'OTP après confirmation (contrôles serveur d'abord)
  const handleConfirmAndProceed = async () => {
    if (!isTransferConfirmed || !pendingTransferData) {
      return
    }

    setConfirmPreOtpError("")
    setIsPreOtpValidating(true)
    try {
      const check = await validateTransferBeforeOtp(pendingTransferData)
      if (!check.success) {
        setConfirmPreOtpError(check.error || "Impossible de valider le virement")
        return
      }

      setShowConfirmationModal(false)

      const referenceId = `TRANSFER-${Date.now()}-${selectedAccount.substring(0, 8)}`
      setOtpReferenceId(referenceId)
      setShowOtpModal(true)
    } catch (e) {
      console.error("[v0] validateTransferBeforeOtp:", e)
      setConfirmPreOtpError("Erreur lors de la vérification. Veuillez réessayer.")
    } finally {
      setIsPreOtpValidating(false)
    }
  }

  // Fonction appelée après validation OTP
  const handleOtpVerified = (payload?: any) => {
    console.log("[v0] OTP vérifié avec succès, payload:", payload)
    if (pendingTransferData) {
      startTransition(() => {
        transferAction(pendingTransferData)
      })
      // Réinitialiser les données en attente
      setPendingTransferData(null)
      setOtpReferenceId(null)
      setShowOtpModal(false)
    }
  }

  const selectedAccountData = accounts.find((acc) => acc.id === selectedAccount)
  const selectedBeneficiaryData = beneficiaries.find((ben) => ben.id === selectedBeneficiary)
  const selectedCreditAccountData = accounts.find((acc) => acc.id === selectedCreditAccount)

  useEffect(() => {
    if (!transferState?.success || !transferSubmitted) return
    if (lastProcessedSuccessRef.current === transferState) return
    lastProcessedSuccessRef.current = transferState
    setTransferValidationError("")
    setSelectedAccount("")
    setSelectedBeneficiary("")
    setSelectedCreditAccount("")
    setOccasionalBeneficiaryName("")
    setOccasionalBeneficiaryAccount("")
    setOccasionalBeneficiary(null)
    setAmount("")
    setMotif("")
    setTransferDate(new Date().toISOString().split("T")[0])
    setTransferSubmitted(false)
    setTouchedFields({})
    setSubmitAttempted(false)
    setTransferType("account-to-beneficiary")
    setShowConfirmationModal(false)
    setShowOtpModal(false)
    setPendingTransferData(null)
    setIsTransferConfirmed(false)
    setConfirmPreOtpError("")
    setOtpReferenceId(null)
    setIsPreOtpValidating(false)
    loadAccounts()
    loadBeneficiaries()
  }, [transferState, transferSubmitted])

  const loadAccounts = async () => {
    try {
      setIsLoadingAccounts(true)
      const result = await getAccounts()

      if (Array.isArray(result) && result.length > 0) {
        const adaptedAccounts = result.map((apiAccount: any) => ({
          id: apiAccount.id || apiAccount.accountId,
          name: apiAccount.accountName || apiAccount.name || `Compte ${apiAccount.accountNumber || apiAccount.number}`,
          number: apiAccount.accountNumber || apiAccount.number || apiAccount.id,
          balance: apiAccount.availableBalance || apiAccount.balance || 0,
          currency: apiAccount.currency || "GNF",
          status: apiAccount.status,
        }))
        // Filtrer uniquement les comptes actifs avec la fonction normalisée
        const activeAccounts = adaptedAccounts.filter(
          (account: Account) =>
            isAccountActive(account.status) &&
            account.number &&
            String(account.number).trim() !== "",
        )
        setAccounts(activeAccounts)
      } else {
        setAccounts([])
      }
    } catch (error) {
      console.error("[v0] Erreur lors du chargement des comptes:", error)
      setAccounts([])
    } finally {
      setIsLoadingAccounts(false)
    }
  }

  const loadBeneficiaries = async () => {
    try {
      setIsLoadingBeneficiaries(true)
      const result = await getBeneficiaries()

      // No need for client-side decryption, data is already decrypted

      if (Array.isArray(result) && result.length > 0) {
        const adaptedBeneficiaries = result.map((apiBeneficiary: any) => ({
          id: apiBeneficiary.id,
          name: apiBeneficiary.name,
          account: apiBeneficiary.accountNumber,
          bank: apiBeneficiary.bankName,
          type: apiBeneficiary.type,
          workflowStatus: apiBeneficiary.workflowStatus,
          status: apiBeneficiary.status,
          clerib: apiBeneficiary.clerib || "",
        }))

        const activeBeneficiaries = adaptedBeneficiaries.filter((beneficiary: any) => {
          const workflow = (beneficiary.workflowStatus || "").toLowerCase()
          const statusValue = Number(beneficiary.status)
          const normalizedStatus = Number.isNaN(statusValue) ? 0 : statusValue

          const isStatusActive = normalizedStatus === 0 || normalizedStatus === 1
          const isWorkflowActive = workflow === "" || workflow === "disponible"

          return isStatusActive && isWorkflowActive
        })
        setBeneficiaries(activeBeneficiaries)
      } else {
        setBeneficiaries([])
      }
    } catch (error) {
      console.error("[v0] Erreur lors du chargement des bénéficiaires:", error)
      setBeneficiaries([])
    } finally {
      setIsLoadingBeneficiaries(false)
    }
  }

  useEffect(() => {
    loadAccounts()
    loadBeneficiaries()
  }, [])

  useEffect(() => {
    if (selectedType === "BNG-CONFRERE") {
      loadBanks()
    }
  }, [selectedType])

  useEffect(() => {
    if (selectedType === "BNG-BNG") {
      setSelectedBank("Banque Nationale de Guinée")
      setSelectedBankCode("022")
      setSelectedSwiftCode("")
    } else if (selectedType === "BNG-CONFRERE") {
      setSelectedBank("")
      setSelectedBankCode("")
      setSelectedSwiftCode("")
    } else if (selectedType !== "") {
      setSelectedBank("")
      setSelectedBankCode("")
      setSelectedSwiftCode("")
    }
  }, [selectedType])

  useEffect(() => {
    if (addBeneficiaryState?.success && transferType !== "account-to-occasional-beneficiary") {
      setAddFormSuccess(true)
      loadBeneficiaries()
      resetBeneficiaryForm()
      toast({
        title: "Succès",
        description: "Bénéficiaire ajouté avec succès!",
      })
      setTimeout(() => {
        setAddFormSuccess(false)
        setIsAddBeneficiaryDialogOpen(false)
      }, 2000)
    }
  }, [addBeneficiaryState?.success, transferType])


  useEffect(() => {
    if (transferValidationError && transferSubmitted) {
      // Scroll vers le message
      setTimeout(() => {
        validationErrorMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 100)

      const timer = setTimeout(() => {
        setTransferValidationError("")
        setTransferSubmitted(false)
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [transferValidationError, transferSubmitted])

  useEffect(() => {
    if (transferState?.success) {
      setShowSuccessMessage(true)
      // Scroll vers le message
      setTimeout(() => {
        successMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 100)

      // Rafraîchir la page après 2 secondes pour mettre à jour les données
      const refreshTimer = setTimeout(() => {
        router.refresh()
      }, 2000)

      const timer = setTimeout(() => {
        setShowSuccessMessage(false)
      }, 8000)
      return () => {
        clearTimeout(timer)
        clearTimeout(refreshTimer)
      }
    }
  }, [transferState?.success, router])

  useEffect(() => {
    if (transferState?.error) {
      setShowErrorMessage(true)
      // Scroll vers le message
      setTimeout(() => {
        errorMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 100)

      const timer = setTimeout(() => {
        setShowErrorMessage(false)
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [transferState?.error])

  // Fonction de validation en temps réel du montant
  const validateAmount = (value: string) => {
    if (!value || Number.parseFloat(value) <= 0) {
      setAmountError("")
      setIsAmountValid(false)
      return false
    }

    const debitAccount = accounts.find((acc) => acc.id === selectedAccount)
    if (!debitAccount) {
      setAmountError("")
      setIsAmountValid(false)
      return false
    }

    const amountValue = Number.parseFloat(value)
    if (amountValue > debitAccount.balance) {
      setAmountError(
        `Le montant saisi (${formatCurrency(amountValue, debitAccount.currency)}) dépasse le solde disponible (${formatCurrency(debitAccount.balance, debitAccount.currency)})`,
      )
      setIsAmountValid(false)
      return false
    }

    setAmountError("")
    setIsAmountValid(true)
    return true
  }

  // Gestionnaire de changement du montant avec validation en temps réel
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Ne permet que les chiffres, le point décimal et un seul point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value)
      validateAmount(value)
    }
  }

  // Révalider le montant lorsque le compte change
  useEffect(() => {
    if (amount && selectedAccount) {
      validateAmount(amount)
    }
  }, [selectedAccount])

  /** Validation réelle : toutes les erreurs (pour désactiver le bouton) */
  const rawValidationErrors = useMemo(() => {
    const raw: Record<string, string> = {}

    if (!selectedAccount) raw.debitAccount = "Sélectionnez le compte à débiter."
    if (transferType === "account-to-beneficiary") {
      if (!selectedBeneficiary) raw.destination = "Choisissez un bénéficiaire enregistré dans la liste."
    } else if (transferType === "account-to-occasional-beneficiary") {
      if (!occasionalBeneficiaryName.trim()) raw.occasionalName = "Renseignez le nom du bénéficiaire ponctuel."
      const accTrim = occasionalBeneficiaryAccount.trim()
      if (!accTrim) {
        raw.occasionalAccount = "Renseignez le numéro de compte du bénéficiaire ponctuel."
      } else {
        const formatMsg = getOccasionalAccountFormatMessage(occasionalBeneficiaryAccount)
        if (formatMsg) raw.occasionalAccount = formatMsg
      }
    } else {
      if (!selectedCreditAccount) raw.destination = "Sélectionnez le compte à créditer."
      else if (selectedAccount && selectedCreditAccount === selectedAccount) {
        raw.destination = "Le compte à créditer doit être différent du compte à débiter."
      } else {
        const debitAccount = accounts.find((acc) => acc.id === selectedAccount)
        const creditAccount = accounts.find((acc) => acc.id === selectedCreditAccount)
        if (debitAccount && creditAccount && debitAccount.currency !== creditAccount.currency) {
          raw.destination = "Les deux comptes doivent avoir la même devise pour ce type de virement."
        }
      }
    }

    const amtTrim = amount.trim().replace(",", ".")
    if (amountError) raw.amount = amountError
    else if (!amtTrim) raw.amount = "Indiquez le montant du virement."
    else {
      const n = Number.parseFloat(amtTrim)
      if (!Number.isFinite(n) || n <= 0) raw.amount = "Le montant doit être un nombre valide strictement supérieur à zéro."
      else if (n < 1000) raw.amount = "Le montant minimum autorisé est de 1 000 GNF."
      else if (selectedAccount && !isAmountValid && Number.isFinite(n) && n >= 1000) {
        raw.amount = "Le montant saisi dépasse le solde disponible sur le compte à débiter."
      }
    }

    if (motif.trim().length < 5) {
      raw.motif = `Le motif doit contenir au moins 5 caractères (actuellement : ${motif.trim().length}).`
    }
    if (!transferDate?.trim()) raw.transferDate = "Choisissez une date d'exécution."
    else if (Number.isNaN(new Date(transferDate).getTime())) raw.transferDate = "La date d'exécution n'est pas valide."

    return raw
  }, [
    selectedAccount,
    transferType,
    selectedBeneficiary,
    selectedCreditAccount,
    occasionalBeneficiaryName,
    occasionalBeneficiaryAccount,
    amount,
    amountError,
    isAmountValid,
    motif,
    transferDate,
    accounts,
  ])

  /** L'utilisateur a rempli tous les champs requis (mais certains peuvent être invalides) */
  const allRequiredFieldsFilled = useMemo(() => {
    if (!selectedAccount || !amount.trim() || !motif.trim() || !transferDate?.trim()) return false
    if (transferType === "account-to-beneficiary") return !!selectedBeneficiary
    if (transferType === "account-to-occasional-beneficiary") {
      return !!occasionalBeneficiaryName.trim() && !!occasionalBeneficiaryAccount.trim()
    }
    return !!selectedCreditAccount
  }, [
    selectedAccount,
    transferType,
    selectedBeneficiary,
    selectedCreditAccount,
    occasionalBeneficiaryName,
    occasionalBeneficiaryAccount,
    amount,
    motif,
    transferDate,
  ])

  /** Messages affichés sous chaque champ — après toucher, soumission, ou lorsque tous les champs sont remplis mais certains invalides */
  const transferFieldMessages = useMemo(() => {
    const displayed: Record<string, string> = {}
    const fieldKeys = ["debitAccount", "destination", "occasionalName", "occasionalAccount", "amount", "motif", "transferDate"] as const
    const shouldShow = (k: string) => touchedFields[k] || submitAttempted || (allRequiredFieldsFilled && Object.keys(rawValidationErrors).length > 0)
    for (const k of fieldKeys) {
      const msg = rawValidationErrors[k]
      if (msg && shouldShow(k)) displayed[k] = msg
    }
    return displayed
  }, [rawValidationErrors, touchedFields, submitAttempted, allRequiredFieldsFilled])

  const isTransferFormReady = Object.keys(rawValidationErrors).length === 0

  return (
    <div className="mt-6 space-y-6 relative">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">Effectuer un virement</h1>
        <p className="text-muted-foreground">Transférez des fonds vers un bénéficiaire ou entre vos comptes</p>
      </div>

      <div className="lg:max-w-3xl">
        {transferValidationError && transferSubmitted && (
          <Alert ref={validationErrorMessageRef} variant="destructive" className="border-l-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{transferValidationError}</AlertDescription>
          </Alert>
        )}

        {transferState?.success && showSuccessMessage && (
          <Alert ref={successMessageRef} className="border-l-4 border-primary bg-primary/5">
            <Check className="h-4 w-4 text-primary" />
            <AlertDescription className="text-primary font-medium">
              {toText(transferState.message) || "Virement effectué avec succès !"}
            </AlertDescription>
          </Alert>
        )}

        {transferState?.error && showErrorMessage && (
          <Alert ref={errorMessageRef} variant="destructive" className="border-l-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{toText(transferState.error)}</AlertDescription>
          </Alert>
        )}
      </div>

      <form onSubmit={handleTransferSubmit} className="grid grid-cols-1 lg:grid-cols-7 gap-6 relative">
        <div className="lg:col-span-4 space-y-6 lg:max-w-3xl lg:w-full">
            {/* Compte débiteur */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                Compte débiteur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label htmlFor="account" className="font-medium">
                  Sélectionner le compte à débiter *
                </Label>
                <Select
                  value={selectedAccount}
                  onValueChange={handleDebitAccountChange}
                  onOpenChange={(open) => !open && markFieldTouched("debitAccount")}
                >
                  <SelectTrigger
                    className={`h-12 border-2 transition-colors ${
                      transferFieldMessages.debitAccount
                        ? "border-destructive focus:border-destructive"
                        : "hover:border-primary/50 focus:border-primary"
                    }`}
                  >
                    <SelectValue placeholder={isLoadingAccounts ? "Chargement..." : "Choisir un compte"} />
                  </SelectTrigger>
                  <SelectContent side="bottom">
                    {isLoadingAccounts ? (
                      <SelectItem value="loading" disabled>
                        Chargement des comptes...
                      </SelectItem>
                    ) : accounts.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        Aucun compte trouvé
                      </SelectItem>
                    ) : (
                      accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id} className="py-3 cursor-pointer">
                          <div className="flex items-center justify-between w-full gap-4">
                            <div>
                              <div className="font-medium">{account.name}</div>
                              <div className="text-sm text-muted-foreground">{account.number}</div>
                            </div>
                            <span className="font-semibold text-primary">
                              {formatCurrency(account.balance, account.currency)}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <TransferFieldHint message={transferFieldMessages.debitAccount} />
              </div>
            </CardContent>
          </Card>
          
          {/* Type de virement */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ArrowRight className="h-5 w-5 text-primary" />
                </div>
                Virement vers ...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={transferType} onValueChange={handleTransferTypeChange}>
                <SelectTrigger className="h-12 border-2 hover:border-primary/50 focus:border-primary transition-colors">
                  <SelectValue placeholder="Choisir le type de virement" />
                </SelectTrigger>
                <SelectContent side="bottom">
                  <SelectItem value="account-to-beneficiary" className="py-3 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium">Vers un bénéficiaire</div>
                        <div className="text-sm text-muted-foreground">Virement vers un bénéficiaire enregistré</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="account-to-occasional-beneficiary" className="py-3 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium">Vers un bénéficiaire ponctuel</div>
                        <div className="text-sm text-muted-foreground">Virement vers un bénéficiaire ponctuel</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="account-to-account" className="py-3 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Wallet className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium">Entre mes comptes</div>
                        <div className="text-sm text-muted-foreground">Virement entre vos comptes</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

        

          {/* Compte créditeur ou Bénéficiaire */}
          {transferType === "account-to-account" ? (
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 rounded-lg bg-accent/20">
                    <Wallet className="h-5 w-5 text-accent-foreground" />
                  </div>
                  Compte créditeur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Label htmlFor="creditAccount" className="font-medium">
                    Sélectionner le compte à créditer *
                  </Label>
                  <Select
                    value={selectedCreditAccount}
                    onValueChange={setSelectedCreditAccount}
                    onOpenChange={(open) => !open && markFieldTouched("destination")}
                  >
                    <SelectTrigger
                      className={`h-12 border-2 transition-colors ${
                        transferFieldMessages.destination
                          ? "border-destructive focus:border-destructive"
                          : "hover:border-primary/50 focus:border-primary"
                      }`}
                    >
                      <SelectValue placeholder={isLoadingAccounts ? "Chargement..." : "Choisir un compte"} />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingAccounts ? (
                        <SelectItem value="loading" disabled>
                          Chargement des comptes...
                        </SelectItem>
                      ) : accounts.length === 0 ? (
                        <SelectItem value="empty" disabled>
                          Aucun compte trouvé
                        </SelectItem>
                      ) : (
                        accounts
                          .filter((account) => {
                            const debitAccount = accounts.find((acc) => acc.id === selectedAccount)
                            return (
                              account.id !== selectedAccount &&
                              (!debitAccount || account.currency === debitAccount.currency)
                            )
                          })
                          .map((account) => (
                            <SelectItem key={account.id} value={account.id} className="py-3 cursor-pointer">
                              <div className="flex items-center justify-between w-full gap-4">
                                <div>
                                  <div className="font-medium">{account.name}</div>
                                  <div className="text-sm text-muted-foreground">{account.number}</div>
                                </div>
                                <span className="font-semibold text-primary">
                                  {formatCurrency(account.balance, account.currency)}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                  <TransferFieldHint message={transferFieldMessages.destination} />
                  {selectedAccountData && transferType === "account-to-account" && (
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <p className="text-sm text-muted-foreground">
                        Seuls les comptes en {selectedAccountData.currency} sont disponibles
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : transferType === "account-to-occasional-beneficiary" ? (
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 rounded-lg bg-accent/20">
                    <User className="h-4 w-4 text-accent-foreground" />
                  </div>
                  Bénéficiaire ponctuel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="occasionalBeneficiaryName" className="font-medium">
                      Nom et prénoms du bénéficiaire *
                    </Label>
                    <Input
                      id="occasionalBeneficiaryName"
                      type="text"
                      value={occasionalBeneficiaryName}
                      onChange={(e) => setOccasionalBeneficiaryName(e.target.value)}
                      onBlur={() => markFieldTouched("occasionalName")}
                      placeholder="Saisissez le nom et prénoms du bénéficiaire"
                      required
                      className={`h-12 border-2 transition-colors ${
                        transferFieldMessages.occasionalName
                          ? "border-destructive focus:border-destructive"
                          : "hover:border-primary/50 focus:border-primary"
                      }`}
                    />
                    <TransferFieldHint message={transferFieldMessages.occasionalName} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="occasionalBeneficiaryAccount" className="font-medium">
                      Numéro de compte *
                    </Label>
                    <Input
                      id="occasionalBeneficiaryAccount"
                      type="text"
                      value={occasionalBeneficiaryAccount}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "")
                        if (value.length <= 18) {
                          setOccasionalBeneficiaryAccount(value)
                        }
                      }}
                      onBlur={() => markFieldTouched("occasionalAccount")}
                      placeholder="Saisissez le numéro de compte (18 chiffres)"
                      maxLength={18}
                      required
                      className={`h-12 border-2 transition-colors ${
                        transferFieldMessages.occasionalAccount
                          ? "border-destructive focus:border-destructive"
                          : "hover:border-primary/50 focus:border-primary"
                      }`}
                    />
                    <TransferFieldHint message={transferFieldMessages.occasionalAccount} />
                    <p className="text-sm text-muted-foreground">
                      {OCCASIONAL_BENEFICIARY_ACCOUNT_DIGITS} chiffres exactement, sans espace
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-lg">
                    <div className="p-2 rounded-lg bg-accent/20">
                      <User className="h-4 w-4 text-accent-foreground" />
                    </div>
                    Bénéficiaire
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent"
                    onClick={() => {
                      resetBeneficiaryForm()
                      setIsAddBeneficiaryDialogOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Nouveau
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Label htmlFor="beneficiary" className="font-medium">
                    Sélectionner le bénéficiaire *
                  </Label>
                  <Select
                    value={selectedBeneficiary}
                    onValueChange={setSelectedBeneficiary}
                    onOpenChange={(open) => !open && markFieldTouched("destination")}
                  >
                    <SelectTrigger
                      className={`min-h-12 h-auto py-2 border-2 transition-colors ${
                        transferFieldMessages.destination
                          ? "border-destructive focus:border-destructive"
                          : "hover:border-primary/50 focus:border-primary"
                      }`}
                    >
                      <SelectValue placeholder={isLoadingBeneficiaries ? "Chargement..." : "Choisir un bénéficiaire"}>
                        {selectedBeneficiary && beneficiaries.find((b) => b.id === selectedBeneficiary) && (
                          <div className="flex items-start gap-3 py-1">
                            <User className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0 text-left">
                              <div className="font-medium truncate">
                                {beneficiaries.find((b) => b.id === selectedBeneficiary)?.name}
                              </div>
                              <div className="text-sm text-muted-foreground truncate">
                                {beneficiaries.find((b) => b.id === selectedBeneficiary)?.account}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {beneficiaries.find((b) => b.id === selectedBeneficiary)?.bank}
                              </div>
                            </div>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingBeneficiaries ? (
                        <SelectItem value="loading" disabled>
                          Chargement des bénéficiaires...
                        </SelectItem>
                      ) : beneficiaries.length === 0 ? (
                        <SelectItem value="empty" disabled>
                          Aucun bénéficiaire trouvé
                        </SelectItem>
                      ) : (
                        beneficiaries.map((beneficiary) => (
                          <SelectItem key={beneficiary.id} value={beneficiary.id} className="py-3 cursor-pointer">
                            <div className="flex items-start gap-3">
                              <User className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium">{beneficiary.name}</div>
                                <div className="text-sm text-muted-foreground break-all">{beneficiary.account}</div>
                                <div className="text-xs text-muted-foreground">{beneficiary.bank}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <TransferFieldHint message={transferFieldMessages.destination} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Détails du virement */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 rounded-lg bg-secondary/20">
                  <ArrowRight className="h-5 w-5 text-secondary-foreground" />
                </div>
                Détails du virement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="amount" className="font-medium">
                  Montant *
                </Label>
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={handleAmountChange}
                  onBlur={() => markFieldTouched("amount")}
                  placeholder="0"
                  required
                  className={`h-12 text-lg border-2 transition-colors ${
                    transferFieldMessages.amount
                      ? "border-destructive focus:border-destructive"
                      : "hover:border-primary/50 focus:border-primary"
                  }`}
                />
                <TransferFieldHint message={transferFieldMessages.amount} />
                {selectedAccountData && !transferFieldMessages.amount && (
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <p className="text-sm text-muted-foreground">
                      Solde disponible:{" "}
                      <span className="font-semibold text-primary">
                        {formatCurrency(selectedAccountData.balance, selectedAccountData.currency)}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="motif" className="font-medium">
                  Motif du virement *
                </Label>
                <Textarea
                  id="motif"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  onBlur={() => markFieldTouched("motif")}
                  placeholder="Indiquez le motif du virement..."
                  rows={3}
                  required
                  className={`border-2 transition-colors resize-none ${
                    transferFieldMessages.motif
                      ? "border-destructive focus:border-destructive"
                      : "hover:border-primary/50 focus:border-primary"
                  }`}
                />
                <TransferFieldHint message={transferFieldMessages.motif} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transferDate" className="font-medium">
                  Date d'exécution *
                </Label>
                <DatePickerField
                  id="transferDate"
                  value={transferDate}
                  onChange={setTransferDate}
                  onTriggerBlur={() => markFieldTouched("transferDate")}
                  minDate={toLocalYmd()}
                  fromYear={new Date().getFullYear()}
                  toYear={new Date().getFullYear() + 5}
                  buttonClassName={`h-12 border-2 transition-colors ${
                    transferFieldMessages.transferDate
                      ? "border-destructive focus:border-destructive"
                      : "hover:border-primary/50 focus:border-primary"
                  }`}
                />
                <TransferFieldHint message={transferFieldMessages.transferDate} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isTransferPending || !isTransferFormReady}
              className="h-12 px-8 font-semibold bg-primary hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              <Check className="h-5 w-5 mr-2" />
              {isTransferPending ? "Traitement en cours..." : "Confirmer virement"}
            </Button>
          </div>
        </div>

        <div 
          className="lg:fixed lg:w-[380px] lg:z-[5] lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto"
          style={{
            position: 'fixed',
            top: '6rem',
            right: '1.5rem',
            willChange: 'transform',
            transform: 'translateZ(0)'
          }}
        >
          <Card className="border-2 shadow-lg">
            <CardHeader className="border-b bg-muted/30 pb-1">
              <CardTitle className="text-base">Résumé du virement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-3">
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Type de virement</h4>
                <div className="p-2 bg-muted/50 rounded-lg border">
                  <p className="text-sm font-medium">
                    {transferType === "account-to-beneficiary"
                      ? "Vers un bénéficiaire"
                      : transferType === "account-to-occasional-beneficiary"
                        ? "Vers un bénéficiaire ponctuel"
                        : "Entre mes comptes"}
                  </p>
                </div>
              </div>

              {selectedAccountData && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Compte à débiter</h4>
                  <div className="p-2 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm font-medium">{selectedAccountData.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedAccountData.number}</p>
                    <p className="text-xs font-semibold text-primary mt-0.5">
                      {formatCurrency(selectedAccountData.balance, selectedAccountData.currency)}
                    </p>
                  </div>
                </div>
              )}

              {transferType === "account-to-beneficiary" && selectedBeneficiaryData && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Bénéficiaire</h4>
                  <div className="p-2 bg-accent/10 rounded-lg border border-accent/20">
                    <p className="text-sm font-medium">{selectedBeneficiaryData.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedBeneficiaryData.account}
                      {(selectedBeneficiaryData as any).clerib ? (selectedBeneficiaryData as any).clerib : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">{selectedBeneficiaryData.bank}</p>
                  </div>
                </div>
              )}

              {transferType === "account-to-occasional-beneficiary" && (occasionalBeneficiaryName || occasionalBeneficiaryAccount) && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Bénéficiaire ponctuel</h4>
                  <div className="p-2 bg-accent/10 rounded-lg border border-accent/20">
                    <p className="text-sm font-medium">{occasionalBeneficiaryName || "Non renseigné"}</p>
                    <p className="text-xs text-muted-foreground">
                      {occasionalBeneficiaryAccount || "Non renseigné"}
                    </p>
                  </div>
                </div>
              )}

              {transferType === "account-to-account" && selectedCreditAccountData && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Compte à créditer</h4>
                  <div className="p-2 bg-accent/10 rounded-lg border border-accent/20">
                    <p className="text-sm font-medium">{selectedCreditAccountData.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedCreditAccountData.number}</p>
                    <p className="text-xs font-semibold text-primary mt-0.5">
                      {formatCurrency(selectedCreditAccountData.balance, selectedCreditAccountData.currency)}
                    </p>
                  </div>
                </div>
              )}

              {amount && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Montant</h4>
                  <div className="p-2 bg-secondary/10 rounded-lg border-2 border-secondary/30">
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(Number.parseFloat(amount), selectedAccountData?.currency || "GNF")}
                    </p>
                  </div>
                </div>
              )}

              {motif && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Motif</h4>
                  <div className="p-2 bg-muted/50 rounded-lg border">
                    <p className="text-xs">{motif}</p>
                  </div>
                </div>
              )}

              {transferDate && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Date d'exécution</h4>
                  <div className="p-2 bg-muted/50 rounded-lg border">
                    <p className="text-xs font-medium">
                      {new Date(transferDate).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </form>

      <Dialog open={isAddBeneficiaryDialogOpen && transferType !== "account-to-occasional-beneficiary"} onOpenChange={(open) => {
        if (transferType !== "account-to-occasional-beneficiary") {
          setIsAddBeneficiaryDialogOpen(open)
        }
      }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un bénéficiaire</DialogTitle>
          </DialogHeader>

          <form ref={beneficiaryFormRef} onSubmit={handleAddBeneficiary} className="space-y-4">
            {addFormSuccess && (
              <Alert variant="default" className="border-primary/20 bg-primary/5">
                <Check className="h-4 w-4 text-primary" />
                <AlertDescription className="text-primary">Bénéficiaire ajouté avec succès!</AlertDescription>
              </Alert>
            )}

            {addBeneficiaryState?.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{addBeneficiaryState.error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet *</Label>
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="Nom et prénom du bénéficiaire" 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type de bénéficiaire *</Label>
                <Select value={selectedType} onValueChange={setSelectedType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le type" />
                  </SelectTrigger>
                  <SelectContent side="bottom">
                    <SelectItem value="BNG-BNG">Interne</SelectItem>
                    <SelectItem value="BNG-CONFRERE">Confrère(Guinée)</SelectItem>
                    <SelectItem value="BNG-INTERNATIONAL">International</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedType !== "" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bank">Banque *</Label>
                  {selectedType === "BNG-BNG" ? (
                    <Input
                      id="bank"
                      name="bankname"
                      value="Banque Nationale de Guinée"
                      readOnly
                      className="bg-muted/50"
                    />
                  ) : selectedType === "BNG-CONFRERE" ? (
                    <Select name="bankname" value={selectedBank} onValueChange={handleBankSelection} required>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingBanks ? "Chargement..." : "Sélectionnez une banque"} />
                      </SelectTrigger>
                      <SelectContent side="bottom">
                        {banks.map((bank) => (
                          <SelectItem key={bank.id} value={bank.bankName}>
                            {bank.bankName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : selectedType === "BNG-INTERNATIONAL" ? (
                    <Input
                      id="bank"
                      name="bank"
                      value={selectedBank || ""}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      placeholder="Saisissez le nom de la banque"
                      required
                    />
                  ) : null}
                </div>

                {(selectedType === "BNG-CONFRERE" || selectedType === "BNG-BNG") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="codeBanque">Code Banque *</Label>
                      <Input
                        id="codeBanque"
                        name="codeBanque"
                        value={selectedBankCode || ""}
                        placeholder="Code banque"
                        disabled
                        className="bg-muted/50"
                        maxLength={3}
                        required
                      />
                    </div>

                    {selectedType === "BNG-CONFRERE" && (
                      <div className="space-y-2">
                        <Label htmlFor="swiftCode">Code SWIFT</Label>
                        <Input
                          id="swiftCode"
                          name="swiftCode"
                          value={selectedSwiftCode || ""}
                          placeholder="Code SWIFT"
                          disabled
                          className="bg-muted/50"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {selectedType !== "BNG-INTERNATIONAL" && selectedType !== "" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codeAgence">Code agence *</Label>
                  {selectedType === "BNG-BNG" ? (
                    <>
                      <input type="hidden" name="codeAgence" value={selectedAgenceCode} />
                      <Select
                        value={selectedAgenceCode}
                        onValueChange={(v) => {
                          setSelectedAgenceCode(v)
                          handleRibFieldChange()
                        }}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un code agence" />
                        </SelectTrigger>
                        <SelectContent side="bottom">
                          {AGENCE_CODE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label} (Code: {opt.value})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  ) : (
                    <Input
                      id="codeAgence"
                      name="codeAgence"
                      placeholder="Ex: 001"
                      maxLength={3}
                      onChange={handleRibFieldChange}
                      required
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account">Numéro de compte *</Label>
                  <Input
                    id="account"
                    name="account"
                    onChange={(e) => {
                      validateAccountNumber(e.target.value)
                      handleRibFieldChange()
                    }}
                    placeholder="1234567890"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    required
                  />
                  {accountNumberError && <p className="text-sm text-destructive">{accountNumberError}</p>}
                  <p className="text-sm text-muted-foreground">10 chiffres uniquement</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cleRib">Clé RIB *</Label>
                  <Input
                    id="cleRib"
                    name="cleRib"
                    placeholder="Ex: 89"
                    maxLength={2}
                    onChange={handleRibFieldChange}
                    required
                  />
                </div>
              </div>
            )}

            {selectedType === "BNG-INTERNATIONAL" && (
              <div className="space-y-2">
                <Label htmlFor="account">IBAN *</Label>
                <Input id="account" name="account" placeholder="FR76 1234 5678 9012 3456 78" required />
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddBeneficiaryDialogOpen(false)}
                disabled={isAddBeneficiaryPending}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={
                  isAddBeneficiaryPending ||
                  (accountNumberError !== null && selectedType !== "BNG-INTERNATIONAL")
                }
              >
                {isAddBeneficiaryPending ? "Traitement..." : "Ajouter"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modale de confirmation */}
      <Dialog
        open={showConfirmationModal}
        onOpenChange={(open) => {
          setShowConfirmationModal(open)
          if (!open) {
            setConfirmPreOtpError("")
            setIsTransferConfirmed(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-[750px] max-h-[95vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-3 border-b">
            <DialogTitle className="text-lg">Confirmation du virement</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="text-xs text-muted-foreground mb-3">
              Veuillez vérifier les informations ci-dessous avant de procéder au virement.
            </div>

            {confirmPreOtpError ? (
              <Alert variant="destructive" className="mb-3 py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{confirmPreOtpError}</AlertDescription>
              </Alert>
            ) : null}

            {/* Résumé du virement - Disposition en grille compacte */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground">Type de virement</h4>
                <div className="p-2 bg-muted/50 rounded border text-sm">
                  {transferType === "account-to-beneficiary"
                    ? "Vers un bénéficiaire"
                    : transferType === "account-to-occasional-beneficiary"
                      ? "Vers un bénéficiaire ponctuel"
                      : "Entre mes comptes"}
                </div>
              </div>

              {amount && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">Montant</h4>
                  <div className="p-2 bg-secondary/10 rounded border-2 border-secondary/30">
                    <p className="text-base font-bold text-primary">
                      {formatCurrency(Number.parseFloat(amount), selectedAccountData?.currency || "GNF")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {selectedAccountData && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">Compte à débiter</h4>
                  <div className="p-2 bg-primary/5 rounded border border-primary/20">
                    <p className="text-sm font-medium">{selectedAccountData.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedAccountData.number}</p>
                    <p className="text-xs font-semibold text-primary">
                      {formatCurrency(selectedAccountData.balance, selectedAccountData.currency)}
                    </p>
                  </div>
                </div>
              )}

              {transferType === "account-to-beneficiary" && selectedBeneficiaryData && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">Bénéficiaire</h4>
                  <div className="p-2 bg-accent/10 rounded border border-accent/20">
                    <p className="text-sm font-medium">{selectedBeneficiaryData.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedBeneficiaryData.account}
                      {(selectedBeneficiaryData as any).clerib ? (selectedBeneficiaryData as any).clerib : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">{selectedBeneficiaryData.bank}</p>
                  </div>
                </div>
              )}

              {transferType === "account-to-occasional-beneficiary" && (occasionalBeneficiaryName || occasionalBeneficiaryAccount) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">Bénéficiaire ponctuel</h4>
                  <div className="p-2 bg-accent/10 rounded border border-accent/20">
                    <p className="text-sm font-medium">{occasionalBeneficiaryName || "Non renseigné"}</p>
                    <p className="text-xs text-muted-foreground">
                      {occasionalBeneficiaryAccount || "Non renseigné"}
                    </p>
                  </div>
                </div>
              )}

              {transferType === "account-to-account" && selectedCreditAccountData && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">Compte à créditer</h4>
                  <div className="p-2 bg-accent/10 rounded border border-accent/20">
                    <p className="text-sm font-medium">{selectedCreditAccountData.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedCreditAccountData.number}</p>
                    <p className="text-xs font-semibold text-primary">
                      {formatCurrency(selectedCreditAccountData.balance, selectedCreditAccountData.currency)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {motif && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">Motif</h4>
                  <div className="p-2 bg-muted/50 rounded border">
                    <p className="text-xs line-clamp-2">{motif}</p>
                  </div>
                </div>
              )}

              {transferDate && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">Date d'exécution</h4>
                  <div className="p-2 bg-muted/50 rounded border">
                    <p className="text-xs font-medium">
                      {new Date(transferDate).toLocaleDateString("fr-FR", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Checkbox de confirmation */}
            <div className="flex items-start space-x-2 mt-4 pt-3 border-t">
              <Checkbox
                id="confirm-transfer"
                checked={isTransferConfirmed}
                onCheckedChange={(checked) => setIsTransferConfirmed(checked === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="confirm-transfer"
                className="text-xs font-normal leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                J'ai lu et confirme les informations du transfert
              </Label>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-muted/30 flex-col gap-3 sm:flex-col">
            {!isPreOtpValidating && !isTransferConfirmed ? (
              <p className="text-xs text-muted-foreground text-center sm:text-left order-first sm:order-none" role="status">
                Le bouton « Effectuer virement » est grisé : cochez la case « J&apos;ai lu et confirme les informations du
                transfert » pour poursuivre vers l&apos;envoi du code de vérification.
              </p>
            ) : null}
            {isPreOtpValidating ? (
              <p className="text-xs text-muted-foreground text-center sm:text-left" role="status">
                Vérification de votre virement auprès du serveur… Le bouton est momentanément indisponible.
              </p>
            ) : null}
            <div className="flex flex-row gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmationModal(false)
                  setIsTransferConfirmed(false)
                  setConfirmPreOtpError("")
                }}
                disabled={isPreOtpValidating}
                className="flex-1 sm:flex-initial"
              >
                Annuler
              </Button>
              <Button
                onClick={() => void handleConfirmAndProceed()}
                disabled={!isTransferConfirmed || isPreOtpValidating}
                className="flex-1 sm:flex-initial h-10 px-6 font-semibold bg-primary hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {isPreOtpValidating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                {isPreOtpValidating ? "Vérification…" : "Effectuer virement"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showOtpModal && otpReferenceId && (
        <OtpModal
          open={showOtpModal}
          onOpenChange={(open) => {
            if (!open) {
              setShowOtpModal(false)
              setOtpReferenceId(null)
              setPendingTransferData(null)
            }
          }}
          onVerified={handleOtpVerified}
          purpose="transfer"
          referenceId={otpReferenceId}
          title="Vérification du virement"
          description="Veuillez entrer le code de vérification pour confirmer ce virement"
          deliveryMethod="EMAIL"
        />
      )}
    </div>
  )
}
