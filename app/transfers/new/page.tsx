"use client"

import type React from "react"
import { useState, useTransition, useEffect, useRef } from "react"
import { addBeneficiaryAndActivate } from "../beneficiaries/actions"
import { executeTransfer } from "./actions"
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
import { ArrowRight, Plus, User, Check, AlertCircle, Wallet } from "lucide-react"
import { useActionState } from "react"
import { OtpModal } from "@/components/otp-modal"
import { toast } from "@/hooks/use-toast"
import { isAccountActive } from "@/lib/status-utils"

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

export default function NewTransferPage() {
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
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [isLoadingBeneficiaries, setIsLoadingBeneficiaries] = useState(true)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)

  const [transferValidationError, setTransferValidationError] = useState<string>("")
  const [transferSubmitted, setTransferSubmitted] = useState(false)

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
  const [ribError, setRibError] = useState<string | null>(null)
  const [addFormSuccess, setAddFormSuccess] = useState(false)
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

  // Refs pour le scroll automatique vers les messages
  const successMessageRef = useRef<HTMLDivElement>(null)
  const errorMessageRef = useRef<HTMLDivElement>(null)
  const validationErrorMessageRef = useRef<HTMLDivElement>(null)

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

  const sanitizeRibPart = (value: string) => value.replace(/\s+/g, "").toUpperCase()

  /**
   * Calcul du modulo 97 selon la procédure BCRG
   * @param numeric - Chaîne de chiffres
   * @returns Le reste de la division par 97
   */
  const mod97 = (numeric: string) => {
    let remainder = 0
    for (let i = 0; i < numeric.length; i += 1) {
      const digit = numeric.charCodeAt(i) - 48
      if (digit < 0 || digit > 9) {
        return -1
      }
      remainder = (remainder * 10 + digit) % 97
    }
    return remainder
  }

  /**
   * Calcule la clé RIB selon la procédure officielle de la BCRG
   * (Banque Centrale de la République de Guinée)
   * 
   * Procédure CleRIBBCRG :
   * 1. CompteBCRG = Complète(CodeBank,3) + Complète(CodeAgence,3) + Droite(LeCompte10,10) + "00"
   * 2. Reste = 0
   * 3. Pour chaque chiffre : Reste = modulo(Reste*10 + Valeur, 97)
   * 4. K = 97 - Reste
   * 5. Retourner K formaté sur 2 chiffres
   * 
   * @param bankCode - Code banque (sera complété à 3 chiffres)
   * @param agencyCode - Code agence (sera complété à 3 chiffres)
   * @param accountNumber - Numéro de compte (10 chiffres, on prend les 10 derniers)
   * @returns Clé RIB sur 2 chiffres (ex: "45")
   */
  const computeRibKey = (bankCode: string, agencyCode: string, accountNumber: string) => {
    // 1. Compléter les codes à 3 chiffres et prendre les 10 derniers chiffres du compte
    const completedBankCode = bankCode.padStart(3, '0').slice(0, 3)
    const completedAgencyCode = agencyCode.padStart(3, '0').slice(0, 3)
    const last10Digits = accountNumber.slice(-10).padStart(10, '0')
    
    // 2. Construire CompteBCRG = CodeBank(3) + CodeAgence(3) + Compte(10) + "00"
    const compteBCRG = `${completedBankCode}${completedAgencyCode}${last10Digits}00`
    
    // 3. Calculer le modulo 97
    const remainder = mod97(compteBCRG)
    if (remainder < 0) {
      return ""
    }

    // 4. K = 97 - Reste
    const key = 97 - remainder
    
    // 5. Retourner K formaté sur 2 chiffres
    return key.toString().padStart(2, "0")
  }

  /**
   * Valide un RIB complet selon la procédure BCRG
   * @param bankCode - Code banque (3 chiffres)
   * @param agencyCode - Code agence (3 chiffres)
   * @param accountNumber - Numéro de compte (10 chiffres)
   * @param ribKey - Clé RIB saisie (2 chiffres)
   * @returns Résultat de la validation avec erreur éventuelle
   */
  const validateRibLocally = (bankCode: string, agencyCode: string, accountNumber: string, ribKey: string) => {
    const sanitizedBank = sanitizeRibPart(bankCode)
    const sanitizedAgency = sanitizeRibPart(agencyCode)
    const sanitizedAccount = sanitizeRibPart(accountNumber)
    const sanitizedKey = sanitizeRibPart(ribKey)

    // Vérifications des champs requis
    if (!sanitizedBank || !sanitizedAgency || !sanitizedAccount || !sanitizedKey) {
      return { valid: false, error: "Tous les champs RIB sont requis" }
    }

    // Vérification de la longueur du code banque
    if (sanitizedBank.length !== 3) {
      return { valid: false, error: "Le code banque doit contenir exactement 3 caractères" }
    }

    // Vérification que le code banque est numérique
    if (!/^[0-9]{3}$/.test(sanitizedBank)) {
      return { valid: false, error: "Le code banque doit contenir uniquement des chiffres" }
    }

    // Vérification de la longueur du code agence
    if (sanitizedAgency.length !== 3) {
      return { valid: false, error: "Le code agence doit contenir exactement 3 caractères" }
    }

    // Vérification que le code agence est numérique
    if (!/^[0-9]{3}$/.test(sanitizedAgency)) {
      return { valid: false, error: "Le code agence doit contenir uniquement des chiffres" }
    }

    // Vérification de la longueur du numéro de compte
    if (sanitizedAccount.length !== 10) {
      return { valid: false, error: "Le numéro de compte doit contenir exactement 10 chiffres" }
    }

    // Vérification que le numéro de compte est numérique
    if (!/^[0-9]{10}$/.test(sanitizedAccount)) {
      return { valid: false, error: "Le numéro de compte doit contenir uniquement des chiffres" }
    }

    // Vérification de la clé RIB
    if (!/^[0-9]{2}$/.test(sanitizedKey)) {
      return { valid: false, error: "La clé RIB doit contenir exactement 2 chiffres" }
    }

    // Calcul de la clé RIB attendue selon la procédure BCRG
    const expectedKey = computeRibKey(sanitizedBank, sanitizedAgency, sanitizedAccount)
    if (!expectedKey) {
      console.error("[RIB] Erreur lors du calcul de la clé RIB")
      return { valid: false, error: "Impossible de calculer la clé RIB" }
    }

    // Comparaison de la clé saisie avec la clé calculée
    if (expectedKey !== sanitizedKey) {
      console.warn("[RIB] ❌ Clé RIB incorrecte !")
      console.warn("[RIB] 📝 Détails de la validation :")
      console.warn("[RIB]   - Code Banque:", sanitizedBank)
      console.warn("[RIB]   - Code Agence:", sanitizedAgency)
      console.warn("[RIB]   - Numéro de compte:", sanitizedAccount)
      console.warn("[RIB]   - Clé RIB saisie:", sanitizedKey)
      console.warn("[RIB]   - Clé RIB attendue (BCRG):", expectedKey)
      return { 
        valid: false, 
        error: `Clé RIB invalide. Clé attendue : ${expectedKey}, clé saisie : ${sanitizedKey}` 
      }
    }

    console.log("[RIB] ✅ Validation réussie selon la procédure BCRG")
    console.log("[RIB]   - Code Banque:", sanitizedBank)
    console.log("[RIB]   - Code Agence:", sanitizedAgency)
    console.log("[RIB]   - Numéro de compte:", sanitizedAccount)
    console.log("[RIB]   - Clé RIB:", sanitizedKey)

    return { valid: true, error: null }
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
    setRibError(null)
    setAddFormSuccess(false)
    if (beneficiaryFormRef.current) {
      beneficiaryFormRef.current.reset()
    }
  }

  const handleRibFieldChange = () => {
    setRibError(null)
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

  const handleTransferTypeChange = (type: TransferType) => {
    setTransferType(type)
    setSelectedBeneficiary("")
    setSelectedCreditAccount("")
    setOccasionalBeneficiary(null)
    setOccasionalBeneficiaryName("")
    setOccasionalBeneficiaryAccount("")
    setTransferValidationError("")
    setTransferSubmitted(false)
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

    const debitAccount = accounts.find((acc) => acc.id === selectedAccount)
    if (debitAccount && Number.parseFloat(amount) > debitAccount.balance) {
      setTransferValidationError(
        `Le montant saisi (${formatCurrency(Number.parseFloat(amount), debitAccount.currency)}) dépasse le solde disponible (${formatCurrency(debitAccount.balance, debitAccount.currency)})`,
      )
      setTransferSubmitted(false)
      return
    }

    if (!motif.trim()) {
      setTransferValidationError("Veuillez saisir le motif du virement")
      setTransferSubmitted(false)
      return
    }

    // Si c'est un bénéficiaire ponctuel, enregistrer d'abord en BD avec statut 100
    if (transferType === "account-to-occasional-beneficiary" && occasionalBeneficiaryName && occasionalBeneficiaryAccount) {
      // Créer un FormData pour enregistrer le bénéficiaire ponctuel
      const beneficiaryFormData = new FormData()
      beneficiaryFormData.append("name", occasionalBeneficiaryName.trim())
      beneficiaryFormData.append("account", occasionalBeneficiaryAccount.trim())
      beneficiaryFormData.append("type", "BNG-BNG") // Type par défaut pour bénéficiaire ponctuel
      beneficiaryFormData.append("bankname", "Banque Nationale de Guinée")
      // S'assurer que le statut est bien "100" comme string
      beneficiaryFormData.append("status", "100")
      beneficiaryFormData.append("bankCode", "022")
      beneficiaryFormData.append("codeBanque", "022")

      // Vérifier que le statut est bien dans le FormData
      console.log("[handleTransferSubmit] Status in FormData:", beneficiaryFormData.get("status"))

      // Enregistrer le bénéficiaire ponctuel en BD
      try {
        const result = await addBeneficiaryAndActivate(null, beneficiaryFormData)
        if (!result.success) {
          setTransferValidationError(result.error || "Erreur lors de l'enregistrement du bénéficiaire ponctuel")
          setTransferSubmitted(false)
          return
        }
        // Créer l'objet bénéficiaire ponctuel avec l'ID généré
        const generatedId = `BEN_${Date.now()}`
        setOccasionalBeneficiary({
          name: occasionalBeneficiaryName.trim(),
          account: occasionalBeneficiaryAccount.trim(),
          bank: "Banque Nationale de Guinée",
          type: "BNG-BNG",
          id: generatedId,
        })
      } catch (error) {
        console.error("[handleTransferSubmit] Erreur lors de l'enregistrement:", error)
        setTransferValidationError("Erreur lors de l'enregistrement du bénéficiaire ponctuel")
        setTransferSubmitted(false)
        return
      }
    }

    const formData = new FormData()
    formData.append("sourceAccount", selectedAccount)
    formData.append("transferType", transferType)

    if (transferType === "account-to-beneficiary") {
      formData.append("beneficiaryId", selectedBeneficiary)
    } else if (transferType === "account-to-occasional-beneficiary") {
      // Pour le bénéficiaire ponctuel, on passe l'ID du bénéficiaire créé
      if (occasionalBeneficiary?.id) {
        formData.append("beneficiaryId", occasionalBeneficiary.id)
      } else {
        // Si l'enregistrement a échoué, utiliser les données directes
        formData.append("occasionalBeneficiaryName", occasionalBeneficiaryName.trim())
        formData.append("occasionalBeneficiaryAccount", occasionalBeneficiaryAccount.trim())
      }
    } else {
      formData.append("targetAccount", selectedCreditAccount)
    }

    formData.append("amount", amount)
    formData.append("purpose", motif)
    formData.append("transferDate", transferDate)

    // Stocker les données du virement pour la modale de confirmation
    setPendingTransferData(formData)
    setIsTransferConfirmed(false)
    setShowConfirmationModal(true)
  }

  // Fonction pour déclencher l'OTP après confirmation
  const handleConfirmAndProceed = () => {
    if (!isTransferConfirmed || !pendingTransferData) {
      return
    }

    // Fermer la modale de confirmation
    setShowConfirmationModal(false)
    
    // Générer un référence unique pour ce virement
    const referenceId = `TRANSFER-${Date.now()}-${selectedAccount.substring(0, 8)}`
    setOtpReferenceId(referenceId)
    setShowOtpModal(true)
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
    if (transferState?.success && transferSubmitted) {
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
      setTransferSubmitted(false) // Réinitialiser l'état de soumission
    }
  }, [transferState?.success, transferSubmitted])

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
    if (selectedType === "BNG-INTERNATIONAL") {
      setRibError(null)
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

      const timer = setTimeout(() => {
        setShowSuccessMessage(false)
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [transferState?.success])

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

  return (
    <div className="mt-6 space-y-6 relative">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">Effectuer un virement</h1>
        <p className="text-muted-foreground">Transférez des fonds vers un bénéficiaire ou entre vos comptes</p>
      </div>

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
                <Select value={selectedAccount} onValueChange={handleDebitAccountChange}>
                  <SelectTrigger className="h-12 border-2 hover:border-primary/50 focus:border-primary transition-colors">
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
                <SelectContent>
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
                  <Select value={selectedCreditAccount} onValueChange={setSelectedCreditAccount}>
                    <SelectTrigger className="h-12 border-2 hover:border-primary/50 focus:border-primary transition-colors">
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
                      placeholder="Saisissez le nom et prénoms du bénéficiaire"
                      required
                      className="h-12 border-2 hover:border-primary/50 focus:border-primary transition-colors"
                    />
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
                      placeholder="Saisissez le numéro de compte (18 chiffres)"
                      maxLength={18}
                      required
                      className="h-12 border-2 hover:border-primary/50 focus:border-primary transition-colors"
                    />
                    <p className="text-sm text-muted-foreground">18 chiffres</p>
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
                  <Select value={selectedBeneficiary} onValueChange={setSelectedBeneficiary}>
                    <SelectTrigger className="min-h-12 h-auto py-2 border-2 hover:border-primary/50 focus:border-primary transition-colors">
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
                  placeholder="0"
                  required
                  className={`h-12 text-lg border-2 transition-colors ${
                    amountError
                      ? "border-destructive focus:border-destructive"
                      : "hover:border-primary/50 focus:border-primary"
                  }`}
                />
                {amountError && (
                  <Alert variant="destructive" className="border-l-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{amountError}</AlertDescription>
                  </Alert>
                )}
                {selectedAccountData && !amountError && (
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
                  placeholder="Indiquez le motif du virement..."
                  rows={3}
                  required
                  className="border-2 hover:border-primary/50 focus:border-primary transition-colors resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transferDate" className="font-medium">
                  Date d'exécution *
                </Label>
                <Input
                  id="transferDate"
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                  className="h-12 border-2 hover:border-primary/50 focus:border-primary transition-colors"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={
                isTransferPending ||
                !selectedAccount ||
                (transferType === "account-to-beneficiary"
                  ? !selectedBeneficiary
                  : transferType === "account-to-occasional-beneficiary"
                    ? !occasionalBeneficiaryName.trim() || !occasionalBeneficiaryAccount.trim()
                    : !selectedCreditAccount) ||
                !amount ||
                !motif ||
                !isAmountValid
              }
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
                  <SelectContent>
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
                      <SelectContent>
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
                  <Input
                    id="codeAgence"
                    name="codeAgence"
                    placeholder="Ex: 001"
                    maxLength={3}
                    onChange={handleRibFieldChange}
                    required
                  />
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
                  {ribError && selectedType !== "BNG-INTERNATIONAL" && (
                    <p className="text-sm text-destructive">{ribError}</p>
                  )}
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
                  ((accountNumberError !== null || ribError !== null) && selectedType !== "BNG-INTERNATIONAL")
                }
              >
                {isAddBeneficiaryPending ? "Traitement..." : "Ajouter"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modale de confirmation */}
      <Dialog open={showConfirmationModal} onOpenChange={setShowConfirmationModal}>
        <DialogContent className="sm:max-w-[750px] max-h-[95vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-3 border-b">
            <DialogTitle className="text-lg">Confirmation du virement</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="text-xs text-muted-foreground mb-3">
              Veuillez vérifier les informations ci-dessous avant de procéder au virement.
            </div>

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

          <DialogFooter className="px-6 py-4 border-t bg-muted/30 flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmationModal(false)
                setIsTransferConfirmed(false)
              }}
              className="flex-1 sm:flex-initial"
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirmAndProceed}
              disabled={!isTransferConfirmed}
              className="flex-1 sm:flex-initial h-10 px-6 font-semibold bg-primary hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Effectuer virement
            </Button>
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
