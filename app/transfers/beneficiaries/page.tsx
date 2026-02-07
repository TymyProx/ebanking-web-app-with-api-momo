"use client"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Users,
  Plus,
  Search,
  UserX,
  Building,
  User,
  Globe,
  MoreVertical,
  Star,
  StarOff,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  addBeneficiary,
  addBeneficiaryAndActivate,
  updateBeneficiary,
  deactivateBeneficiary,
  reactivateBeneficiary,
  getBeneficiaries,
  toggleBeneficiaryFavorite,
  getBanks,
  getBeneficiaryDetails,
} from "./actions"
import { useActionState } from "react"
import type React from "react"
import { useRef } from "react"
import { toast } from "@/hooks/use-toast"
import { OtpModal } from "@/components/otp-modal"

interface Beneficiary {
  id: string
  name: string
  account: string
  bank: string
  type: string
  favorite: boolean
  lastUsed: string
  addedDate: string
  iban?: string
  swiftCode?: string
  country?: string
  status: StatusBeneficiaire
  codagence?: string
  clerib?: string
  workflowStatus: WorkflowStatus
  workflowMetadata?: Record<string, any> | null
}

interface Bank {
  id: string
  bankName: string
  swiftCode: string
  codeBank: string
}

type ActionResult = {
  success?: boolean
  error?: string
  message?: string
}

const WORKFLOW_STATUS = {
  CREATED: "cree",
  VERIFIED: "verifie",
  VALIDATED: "valide",
  AVAILABLE: "disponible",
  SUSPENDED: "suspendu",
} as const

const STATUS_BENEFICIAIRE = {
  ACTIVE: 0,
  INACTIVE: 1,
} as const

type WorkflowStatus = (typeof WORKFLOW_STATUS)[keyof typeof WORKFLOW_STATUS]
type StatusBeneficiaire = (typeof STATUS_BENEFICIAIRE)[keyof typeof STATUS_BENEFICIAIRE]

const PENDING_WORKFLOW_STATUSES: WorkflowStatus[] = [
  WORKFLOW_STATUS.CREATED,
  WORKFLOW_STATUS.VERIFIED,
  WORKFLOW_STATUS.VALIDATED,
]

const WORKFLOW_LABELS: Record<WorkflowStatus, string> = {
  [WORKFLOW_STATUS.CREATED]: "Créé",
  [WORKFLOW_STATUS.VERIFIED]: "Vérification",
  [WORKFLOW_STATUS.VALIDATED]: "Validation",
  [WORKFLOW_STATUS.AVAILABLE]: "Disponible",
  [WORKFLOW_STATUS.SUSPENDED]: "Suspendu",
}

const toWorkflowStatus = (value: any): WorkflowStatus => {
  const allowed = Object.values(WORKFLOW_STATUS) as WorkflowStatus[]
  return allowed.includes(value as WorkflowStatus) ? (value as WorkflowStatus) : WORKFLOW_STATUS.AVAILABLE
}

export default function BeneficiariesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("")
  const [activeFilter, setActiveFilter] = useState<"all" | "favorites" | "BNG-BNG" | "BNG-CONFRERE" | "BNG-INTERNATIONAL">("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null)
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [isLoading, setIsLoading] = useState(true) // Renamed from setLoading
  const [isPending, startTransition] = useTransition()

  // ✅ NEW: Ajout état pour la modale de détails
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null)

  const [selectedType, setSelectedType] = useState("")
  const [selectedBank, setSelectedBank] = useState("")
  const [banks, setBanks] = useState<Bank[]>([])
  const [selectedBankCode, setSelectedBankCode] = useState("")
  const [selectedSwiftCode, setSelectedSwiftCode] = useState("")
  const [loadingBanks, setLoadingBanks] = useState(false)
  const [accountNumberError, setAccountNumberError] = useState<string | null>(null)
  const [ribError, setRibError] = useState<string | null>(null)
  const [formDirty, setFormDirty] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const editFormRef = useRef<HTMLFormElement>(null)

  const [addFormSuccess, setAddFormSuccess] = useState(false)

  const [addState, addAction, isAddPending] = useActionState<any, any>(addBeneficiary as any, null as any)
  // ✅ NEW: Streamlined action for OTP-verified beneficiary creation
  const [addAndActivateState, addAndActivateAction, isAddAndActivatePending] = useActionState<any, any>(
    addBeneficiaryAndActivate as any,
    null as any,
  )
  const [updateState, updateAction, isUpdatePending] = useActionState<any, any>(updateBeneficiary as any, null as any)
  const [deactivateState, deactivateAction, isDeactivatePending] = useActionState<any, any>(
    deactivateBeneficiary as any,
    null as any,
  )
  const [reactivateState, reactivateAction, isReactivatePending] = useActionState<any, any>(
    reactivateBeneficiary as any,
    null as any,
  )

  const [showDeactivateSuccess, setShowDeactivateSuccess] = useState(false)
  const [showReactivateSuccess, setShowReactivateSuccess] = useState(false)
  const [showAddSuccess, setShowAddSuccess] = useState(false)
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false)

  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpReferenceId, setOtpReferenceId] = useState<string | null>(null)
  const [pendingBeneficiaryData, setPendingBeneficiaryData] = useState<FormData | null>(null)

  const loadBeneficiaries = async () => {
    setIsLoading(true)
    try {
      const apiBeneficiaries = await getBeneficiaries()

      const transformedBeneficiaries: Beneficiary[] = apiBeneficiaries
        .map((apiB: any) => {
        // Data is already decrypted server-side
        const name = apiB.name ?? ""
        const accountNumber = apiB.accountNumber ?? ""
        const bankNamePlain = apiB.bankName ?? ""
        const bankResolved = bankNamePlain || getBankNameFromCode(apiB.bankCode)
        const codagence = apiB.codagence ?? ""
        const clerib = apiB.clerib ?? ""
        const workflowStatus = toWorkflowStatus(apiB.workflowStatus)
        let workflowMetadata = apiB.workflowMetadata || null
        if (workflowMetadata && typeof workflowMetadata === "string") {
          try {
            workflowMetadata = JSON.parse(workflowMetadata)
          } catch {
            workflowMetadata = null
          }
        }

        return {
          id: apiB.id,
          name,
          account: accountNumber,
          bank: bankResolved,
          type: apiB.typeBeneficiary,
          favorite: Boolean(apiB.favoris),
          lastUsed: "Jamais", // This might need to be fetched or calculated differently if available
          addedDate: apiB.createdAt ? new Date(apiB.createdAt).toLocaleDateString("fr-FR") : "",
          status: apiB.status,
          codagence,
          clerib,
          workflowStatus,
          workflowMetadata,
        } as Beneficiary
      })
        .filter((beneficiary) => {
          // Exclure les bénéficiaires avec le statut 100 (bénéficiaires ponctuels)
          const statusValue = Number(beneficiary.status)
          return statusValue !== 100
        })
      setBeneficiaries(transformedBeneficiaries)
    } catch (error) {
      console.error("Erreur lors du chargement des bénéficiaires:", error)
    } finally {
      setIsLoading(false)
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

  useEffect(() => {
    if (selectedType === "BNG-CONFRERE") {
      loadBanks()
    }
  }, [selectedType])

  useEffect(() => {
    if (selectedType === "BNG-BNG") {
      setSelectedBank("Banque Nationale de Guinée")
      setSelectedBankCode("022") // Auto-fill code banque with "022" for internal type
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
    loadBeneficiaries()
  }, [])

  useEffect(() => {
    if (
      addState?.success ||
      addAndActivateState?.success ||
      updateState?.success ||
      deactivateState?.success ||
      reactivateState?.success
    ) {
      loadBeneficiaries()
    }
  }, [
    addState?.success,
    addAndActivateState?.success,
    updateState?.success,
    deactivateState?.success,
    reactivateState?.success,
  ])

  useEffect(() => {
    if (addState?.success || addAndActivateState?.success) {
      setShowAddSuccess(true)

      if (addAndActivateState?.success) {
        setAddFormSuccess(true)
        resetForm()
        setPendingBeneficiaryData(null)
        setOtpReferenceId(null)

        setTimeout(() => {
          setAddFormSuccess(false)
        }, 10000)
      }

      const timer = setTimeout(() => {
        setShowAddSuccess(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [addState?.success, addAndActivateState?.success])

  useEffect(() => {
    if (updateState?.success) {
      setShowUpdateSuccess(true)
      const timer = setTimeout(() => {
        setShowUpdateSuccess(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [updateState?.success])

  useEffect(() => {
    if (deactivateState?.success) {
      setShowDeactivateSuccess(true)
      const timer = setTimeout(() => {
        setShowDeactivateSuccess(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [deactivateState?.success])

  useEffect(() => {
    if (reactivateState?.success) {
      setShowReactivateSuccess(true)
      const timer = setTimeout(() => {
        setShowReactivateSuccess(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [reactivateState?.success])

  const getBankNameFromCode = (bankCode: string): string => {
    const bankNames: Record<string, string> = {
      BNG: "Banque Nationale de Guinée",
      BICI: "BICIGUI",
      SGBG: "Société Générale de Banques en Guinée",
      UBA: "United Bank for Africa",
      ECO: "Ecobank Guinée",
      VISTA: "VISTA BANK",
      BNPP: "BNP Paribas",
      SG: "Société Générale",
      CA: "Crédit Agricole",
      HSBC: "HSBC",
      DB: "Deutsche Bank",
    }
    return bankNames[bankCode] || bankCode
  }

  // Helper function to filter beneficiaries based on type and status filters (without search)
  const getFilteredBeneficiariesForCount = (
    beneficiariesList: Beneficiary[],
    typeFilter: typeof activeFilter,
    statusFilter: string,
  ) => {
    return beneficiariesList.filter((beneficiary) => {
      // Exclure les bénéficiaires avec le statut 100 (bénéficiaires ponctuels)
      const statusValue = Number(beneficiary.status)
      if (statusValue === 100) {
        return false
      }

      const isSuspended = beneficiary.status === 1 || beneficiary.workflowStatus === WORKFLOW_STATUS.SUSPENDED
      const isPending = PENDING_WORKFLOW_STATUSES.includes(beneficiary.workflowStatus)

      // Filtre par onglet actif (type de bénéficiaire)
      let matchesTypeFilter = false
      if (typeFilter === "all") {
        matchesTypeFilter = true
      } else if (typeFilter === "favorites") {
        matchesTypeFilter = beneficiary.favorite === true
      } else {
        matchesTypeFilter = beneficiary.type === typeFilter
      }

      // Filtre secondaire (dropdown)
      let matchesSecondaryFilter = true
      if (statusFilter === "active") {
        matchesSecondaryFilter = beneficiary.status === 0
      } else if (statusFilter === "inactive") {
        matchesSecondaryFilter = beneficiary.status === 1
      } else if (statusFilter === "pending") {
        matchesSecondaryFilter = isPending
      } else if (statusFilter === "all" || statusFilter === "") {
        // Par défaut (all ou vide), exclure les suspendus
        matchesSecondaryFilter = !isSuspended
      } else {
        // Par défaut, exclure les suspendus
        matchesSecondaryFilter = !isSuspended
      }

      return matchesTypeFilter && matchesSecondaryFilter
    })
  }

  const filteredBeneficiaries = beneficiaries.filter((beneficiary) => {
    // Exclure les bénéficiaires avec le statut 100 (bénéficiaires ponctuels)
    const statusValue = Number(beneficiary.status)
    if (statusValue === 100) {
      return false
    }

    const safe = (v: any) => (typeof v === "string" ? v : v ? JSON.stringify(v) : "")
    const searchLc = searchTerm.toLowerCase()
    const nameLc = safe(beneficiary.name).toLowerCase()
    const accountLc = safe(beneficiary.account).toLowerCase()
    const bankLc = safe(beneficiary.bank).toLowerCase()
    const matchesSearch = nameLc.includes(searchLc) || accountLc.includes(searchLc) || bankLc.includes(searchLc)

    const isAvailable = beneficiary.status === 0 && beneficiary.workflowStatus === WORKFLOW_STATUS.AVAILABLE
    const isSuspended = beneficiary.status === 1 || beneficiary.workflowStatus === WORKFLOW_STATUS.SUSPENDED
    const isPending = PENDING_WORKFLOW_STATUSES.includes(beneficiary.workflowStatus)

    // Filtre par onglet actif (type de bénéficiaire)
    let matchesTypeFilter = false
    if (activeFilter === "all") {
      matchesTypeFilter = true
    } else if (activeFilter === "favorites") {
      matchesTypeFilter = beneficiary.favorite === true
    } else {
      matchesTypeFilter = beneficiary.type === activeFilter
    }

    // Filtre secondaire (dropdown)
    let matchesSecondaryFilter = true
    if (filterType === "active") {
      // Afficher uniquement les bénéficiaires avec status = 0 (actifs) du type sélectionné
      matchesSecondaryFilter = beneficiary.status === 0
    } else if (filterType === "inactive") {
      // Afficher uniquement les bénéficiaires avec status = 1 (inactifs) du type sélectionné
      matchesSecondaryFilter = beneficiary.status === 1
    } else if (filterType === "pending") {
      matchesSecondaryFilter = isPending
    } else if (filterType === "all" || filterType === "") {
      // Par défaut (all ou vide), exclure les suspendus
      matchesSecondaryFilter = !isSuspended
    } else {
      // Par défaut, exclure les suspendus
      matchesSecondaryFilter = !isSuspended
    }

    return matchesSearch && matchesTypeFilter && matchesSecondaryFilter
  })

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

  const replaceLettersWithDigits = (value: string) =>
    value
      .split("")
      .map((char) => {
        if (/[0-9]/.test(char)) {
          return char
        }
        const code = char.charCodeAt(0) - 55
        return code >= 10 && code <= 35 ? String(code) : ""
      })
      .join("")

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

  const computeRibKey = (bankCode: string, agencyCode: string, accountNumber: string) => {
    const numeric = `${replaceLettersWithDigits(bankCode)}${replaceLettersWithDigits(agencyCode)}${replaceLettersWithDigits(accountNumber)}`
    const remainder = mod97(numeric)
    if (remainder < 0) {
      return ""
    }
    const key = 97 - remainder
    return key.toString().padStart(2, "0")
  }

  const validateRibLocally = (bankCode: string, agencyCode: string, accountNumber: string, ribKey: string) => {
    const sanitizedBank = sanitizeRibPart(bankCode)
    const sanitizedAgency = sanitizeRibPart(agencyCode)
    const sanitizedAccount = sanitizeRibPart(accountNumber)
    const sanitizedKey = sanitizeRibPart(ribKey)

    if (!sanitizedBank || !sanitizedAgency || !sanitizedAccount || !sanitizedKey) {
      return { valid: false, error: "Tous les champs RIB sont requis" }
    }

    if (sanitizedBank.length !== 3) {
      return { valid: false, error: "Le code banque doit contenir exactement 3 caractères" }
    }

    if (sanitizedAgency.length !== 3) {
      return { valid: false, error: "Le code agence doit contenir exactement 3 caractères" }
    }

    if (sanitizedAccount.length !== 10) {
      return { valid: false, error: "Le numéro de compte doit contenir exactement 10 chiffres" }
    }

    if (!/^[0-9]{2}$/.test(sanitizedKey)) {
      return { valid: false, error: "La clé RIB doit contenir 2 chiffres" }
    }

    const expectedKey = computeRibKey(sanitizedBank, sanitizedAgency, sanitizedAccount)
    if (!expectedKey) {
      return { valid: false, error: "Impossible de calculer la clé RIB" }
    }

    if (expectedKey !== sanitizedKey) {
      console.log("[v0] Clé RIB incorrecte !")
      console.log("[v0] Clé RIB saisie:", sanitizedKey)
      console.log("[v0] Clé RIB attendue:", expectedKey)
      console.log("[v0] Code Banque:", sanitizedBank)
      console.log("[v0] Code Agence:", sanitizedAgency)
      console.log("[v0] Numéro de compte:", sanitizedAccount)
      return { valid: false, error: "Clé RIB invalide" }
    }

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

  const resetForm = () => {
    setSelectedType("")
    setSelectedBank("")
    setSelectedBankCode("")
    setSelectedSwiftCode("")
    setAccountNumberError(null)
    setRibError(null)
    setFormDirty(false)
    if (formRef.current) {
      formRef.current.reset()
    }
  }

  const handleRibFieldChange = () => {
    setRibError(null)
    setFormDirty(true)
  }

  const handleAddBeneficiary = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    if (selectedType !== "BNG-INTERNATIONAL") {
      const accountNumber = formData.get("account") as string
      if (!validateAccountNumber(accountNumber)) {
        return
      }

      if (selectedType === "BNG-BNG" || selectedType === "BNG-CONFRERE") {
        const agencyCode = (formData.get("codeAgence") as string) || ""
        const cleRib = (formData.get("cleRib") as string) || ""
        const bankCodeForRib =
          selectedType === "BNG-BNG"
            ? selectedBankCode || "022"
            : selectedBankCode || (formData.get("bank") as string) || ""

        const ribValidation = validateRibLocally(bankCodeForRib, agencyCode, accountNumber, cleRib)
        if (!ribValidation.valid) {
          setRibError(ribValidation.error)
          toast({
            title: "RIB invalide",
            description: ribValidation.error,
            variant: "destructive",
          })
          return
        }
        setRibError(null)
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

    // Sauvegarder les données et ouvrir le modal OTP
    setPendingBeneficiaryData(formData)
    setShowOtpModal(true)
  }

  const handleEditBeneficiary = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingBeneficiary) return

    const formData = new FormData(e.currentTarget)

    if (selectedType !== "BNG-INTERNATIONAL") {
      const accountNumber = formData.get("account") as string
      if (!validateAccountNumber(accountNumber)) {
        return
      }

      if (selectedType === "BNG-BNG" || selectedType === "BNG-CONFRERE") {
        const agencyCode = (formData.get("codeAgence") as string) || ""
        const cleRib = (formData.get("cleRib") as string) || ""
        const bankCodeForRib =
          selectedType === "BNG-BNG"
            ? selectedBankCode || "022"
            : selectedBankCode || (formData.get("bank") as string) || ""

        const ribValidation = validateRibLocally(bankCodeForRib, agencyCode, accountNumber, cleRib)
        if (!ribValidation.valid) {
          setRibError(ribValidation.error)
          toast({
            title: "RIB invalide",
            description: ribValidation.error,
            variant: "destructive",
          })
          return
        }
        setRibError(null)
      }
    }

    formData.set("type", selectedType)

    if (selectedType === "BNG-BNG") {
      formData.set("bank", "GNXXX")
      formData.set("bankname", "Banque Nationale de Guinée")
    } else if (selectedType === "BNG-CONFRERE") {
      formData.set("bank", selectedBankCode)
      formData.set("bankname", selectedBank)
    } else {
      const bankValue = selectedBank
      formData.set("bank", bankValue)
      if (bankValue) {
        formData.set("bankname", bankValue)
      }
    }

    if (selectedType === "BNG-CONFRERE" && selectedBankCode) {
      formData.set("bankCode", selectedBankCode)
    }

    formData.append("id", editingBeneficiary.id)
    const apiBeneficiaries = await getBeneficiaries()
    const apiBeneficiary = apiBeneficiaries.find((b) => b.id === editingBeneficiary.id)
    if (apiBeneficiary?.beneficiaryId) {
      formData.append("beneficiaryId", apiBeneficiary.beneficiaryId)
    }

    startTransition(() => {
      updateAction(formData)
    })
  }

  const toggleFavorite = async (id: string) => {
    const beneficiary = beneficiaries.find((b) => b.id === id)
    if (!beneficiary) return

    try {
      const result = await toggleBeneficiaryFavorite(id, beneficiary.favorite)
      if (result.success) {
        setBeneficiaries((prev) => prev.map((b) => (b.id === id ? { ...b, favorite: !b.favorite } : b)))
      } else {
        console.error("Erreur lors de la modification du favori:", result.error)
      }
    } catch (error) {
      console.error("Erreur lors de la modification du favori:", error)
    }
  }

  const openEditDialog = async (beneficiary: Beneficiary) => {
    const fullBeneficiary = await getBeneficiaryDetails(beneficiary.id)

    if (fullBeneficiary) {
      setEditingBeneficiary({
        ...beneficiary,
        codagence: fullBeneficiary.codagence,
        clerib: fullBeneficiary.clerib,
      })
    } else {
      setEditingBeneficiary(beneficiary)
    }

    setSelectedType(beneficiary.type)
    setSelectedBank(beneficiary.bank)
    setIsEditDialogOpen(true)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "BNG-BNG":
        return <Building className="w-4 h-4 text-blue-600" />
      case "BNG-CONFRERE":
        return <User className="w-4 h-4 text-green-600" />
      case "BNG-INTERNATIONAL":
        return <Globe className="w-4 h-4 text-purple-600" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "BNG-BNG":
        return <Badge variant="secondary">BNG</Badge>
      case "BNG-CONFRERE":
        return <Badge variant="outline">Confrère</Badge>
      case "BNG-INTERNATIONAL":
        return <Badge className="bg-purple-100 text-purple-800">International</Badge>
      default:
        return <Badge variant="outline">Autre</Badge>
    }
  }

  const getstatutBadge = (status: StatusBeneficiaire) => {
    switch (status) {
      case STATUS_BENEFICIAIRE.INACTIVE:
        return (
          <Badge variant="outline" className="border-red-500 text-red-800 bg-red-100 font-semibold">
            Inactif
          </Badge>
        )
      case STATUS_BENEFICIAIRE.ACTIVE:
      default:
        return (
          <Badge variant="outline" className="border-green-500 text-green-800 bg-green-100 font-semibold">
            Actif
          </Badge>
        )
    }
  }

  const handleFormSuccess = async () => {
    await loadBeneficiaries()
  }

  const handleDeactivateBeneficiary = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const fd = new FormData()
      fd.set("id", id)
      startTransition(async () => {
        await deactivateAction(fd)
        // Recharger pour avoir les données à jour depuis la BD
        await loadBeneficiaries()
      })
      // setShowDeactivateSuccess(true) // Moved inside loadBeneficiaries success
      // setTimeout(() => setShowDeactivateSuccess(false), 5000) // Moved inside loadBeneficiaries success
    } catch (error) {
      console.error("Erreur lors de la désactivation du bénéficiaire:", error)
    }
  }

  const handleReactivateBeneficiary = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const fd = new FormData()
      fd.set("id", id)
      startTransition(async () => {
        await reactivateAction(fd)
        // Recharger pour avoir les données à jour depuis la BD
        await loadBeneficiaries()
      })
      // setShowReactivateSuccess(true) // Moved inside loadBeneficiaries success
      // setTimeout(() => setShowReactivateSuccess(false), 5000) // Moved inside loadBeneficiaries success
    } catch (error) {
      console.error("Erreur lors de la réactivation du bénéficiaire:", error)
    }
  }

  // ✅ NEW: Fonction pour ouvrir la modale de détails
  const openDetailsDialog = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary)
    setIsDetailsDialogOpen(true)
  }

  const handleOtpVerified = async (payload: { otpId?: string | null; referenceId?: string }) => {
    if (!pendingBeneficiaryData) return

    setShowOtpModal(false)
    setOtpReferenceId(payload.referenceId || null)

    // Soumettre le formulaire après vérification OTP
    startTransition(() => {
      addAndActivateAction(pendingBeneficiaryData)
    })
  }

  const handleOtpCancel = () => {
    setShowOtpModal(false)
    setPendingBeneficiaryData(null)
    setOtpReferenceId(null)
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-primary">Gestion des bénéficiaires</h1>
          <p className="text-sm text-muted-foreground">Gérez vos destinataires de virements</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un bénéficiaire
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Ajouter un bénéficiaire</DialogTitle>
            </DialogHeader>

            <form ref={formRef} onSubmit={handleAddBeneficiary} className="space-y-4">
              {addFormSuccess && (
                <Alert variant="default" className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    ✅ Bénéficiaire ajouté et activé avec succès! Vous pouvez maintenant effectuer des virements.
                  </AlertDescription>
                </Alert>
              )}

              {/* Show errors from streamlined flow */}
              {addAndActivateState?.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>❌ {addAndActivateState.error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet *</Label>
                  <Input id="name" name="name" placeholder="Nom et prénom du bénéficiaire" required />
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
                        className="bg-gray-50"
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
                        className="bg-white"
                        required
                      />
                    ) : null}
                  </div>

                  {(selectedType === "BNG-CONFRERE" || selectedType === "BNG-BNG") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="codeBanque">Code Banque *</Label>
                        {selectedType === "BNG-CONFRERE" || selectedType === "BNG-BNG" ? (
                          <Input
                            id="codeBanque"
                            name="codeBanque"
                            value={selectedBankCode || ""}
                            placeholder="Code banque"
                            disabled
                            className="bg-gray-50"
                            maxLength={3}
                            required
                          />
                        ) : (
                          <Input id="codeBanque" name="codeBanque" placeholder="Ex: 022" maxLength={3} required />
                        )}
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
                            className="bg-gray-50"
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
                    {accountNumberError && <p className="text-sm text-red-600">{accountNumberError}</p>}
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
                      <p className="text-sm text-red-600">{ribError}</p>
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
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isAddPending}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isAddAndActivatePending ||
                    ((accountNumberError !== null || ribError !== null) && selectedType !== "BNG-INTERNATIONAL")
                  }
                >
                  {isAddAndActivatePending ? "Traitement..." : "Ajouter"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {showAddSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ✅ Bénéficiaire ajouté et activé avec succès! Vous pouvez maintenant effectuer des virements.
          </AlertDescription>
        </Alert>
      )}

      {/* Show errors from streamlined flow */}
      {addAndActivateState?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>❌ {addAndActivateState.error}</AlertDescription>
        </Alert>
      )}

      {showUpdateSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">✅ Bénéficiaire modifié avec succès.</AlertDescription>
        </Alert>
      )}

      {updateState?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>❌ {updateState.error}</AlertDescription>
        </Alert>
      )}

      {showDeactivateSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">✅ Bénéficiaire désactivé avec succès.</AlertDescription>
        </Alert>
      )}

      {reactivateState?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>❌ Erreur lors de la réactivation. Veuillez réessayer.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher un bénéficiaire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Désactivés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Onglets de catégories */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Tous les bénéficiaires */}
        <button
          onClick={() => setActiveFilter("all")}
          className={`relative group p-4 rounded-xl border-2 transition-all duration-300 text-left ${
            activeFilter === "all"
              ? "border-primary bg-primary/5 shadow-lg shadow-primary/20"
              : "border-border bg-card hover:border-primary/50 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Tous</h3>
                <p className="text-xl font-bold text-primary">
                  {getFilteredBeneficiariesForCount(beneficiaries, "all", filterType).length}
                </p>
              </div>
            </div>
            {activeFilter === "all" && (
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
            )}
          </div>
          {activeFilter === "all" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 rounded-b-xl"></div>
          )}
        </button>

        {/* Favoris */}
        <button
          onClick={() => setActiveFilter("favorites")}
          className={`relative group p-4 rounded-xl border-2 transition-all duration-300 text-left ${
            activeFilter === "favorites"
              ? "border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20 shadow-lg shadow-yellow-500/20"
              : "border-border bg-card hover:border-yellow-500/50 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Favoris</h3>
                <p className="text-xl font-bold text-yellow-600">
                  {getFilteredBeneficiariesForCount(beneficiaries, "favorites", filterType).length}
                </p>
              </div>
            </div>
            {activeFilter === "favorites" && (
              <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></div>
            )}
          </div>
          {activeFilter === "favorites" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500/0 via-yellow-500 to-yellow-500/0 rounded-b-xl"></div>
          )}
        </button>

        {/* BNG Interne */}
        <button
          onClick={() => setActiveFilter("BNG-BNG")}
          className={`relative group p-4 rounded-xl border-2 transition-all duration-300 text-left ${
            activeFilter === "BNG-BNG"
              ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-lg shadow-blue-500/20"
              : "border-border bg-card hover:border-blue-500/50 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                <Building className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">BNG</h3>
                <p className="text-xl font-bold text-blue-600">
                  {getFilteredBeneficiariesForCount(beneficiaries, "BNG-BNG", filterType).length}
                </p>
              </div>
            </div>
            {activeFilter === "BNG-BNG" && (
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
            )}
          </div>
          {activeFilter === "BNG-BNG" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/0 via-blue-500 to-blue-500/0 rounded-b-xl"></div>
          )}
        </button>

        {/* Confrères */}
        <button
          onClick={() => setActiveFilter("BNG-CONFRERE")}
          className={`relative group p-4 rounded-xl border-2 transition-all duration-300 text-left ${
            activeFilter === "BNG-CONFRERE"
              ? "border-green-500 bg-green-50/50 dark:bg-green-950/20 shadow-lg shadow-green-500/20"
              : "border-border bg-card hover:border-green-500/50 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Confrères</h3>
                <p className="text-xl font-bold text-green-600">
                  {getFilteredBeneficiariesForCount(beneficiaries, "BNG-CONFRERE", filterType).length}
                </p>
              </div>
            </div>
            {activeFilter === "BNG-CONFRERE" && (
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            )}
          </div>
          {activeFilter === "BNG-CONFRERE" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500/0 via-green-500 to-green-500/0 rounded-b-xl"></div>
          )}
        </button>

        {/* International */}
        <button
          onClick={() => setActiveFilter("BNG-INTERNATIONAL")}
          className={`relative group p-4 rounded-xl border-2 transition-all duration-300 text-left ${
            activeFilter === "BNG-INTERNATIONAL"
              ? "border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 shadow-lg shadow-purple-500/20"
              : "border-border bg-card hover:border-purple-500/50 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5">
                <Globe className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">International</h3>
                <p className="text-xl font-bold text-purple-600">
                  {getFilteredBeneficiariesForCount(beneficiaries, "BNG-INTERNATIONAL", filterType).length}
                </p>
              </div>
            </div>
            {activeFilter === "BNG-INTERNATIONAL" && (
              <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse"></div>
            )}
          </div>
          {activeFilter === "BNG-INTERNATIONAL" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/0 via-purple-500 to-purple-500/0 rounded-b-xl"></div>
          )}
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Mes bénéficiaires ({filteredBeneficiaries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Chargement des bénéficiaires...</p>
            </div>
          ) : filteredBeneficiaries.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun bénéficiaire trouvé</p>
              <p className="text-sm text-gray-400">Ajoutez votre premier bénéficiaire pour commencer</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBeneficiaries.map((beneficiary) => (
                <div
                  key={beneficiary.id}
                  // ✅ NEW: Ajout du onClick sur la carte pour ouvrir la modale
                  onClick={() => openDetailsDialog(beneficiary)}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      {getTypeIcon(beneficiary.type)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{beneficiary.name}</h3>
                        {beneficiary.favorite && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                        {getTypeBadge(beneficiary.type)}
                        {getstatutBadge(beneficiary.status)}
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="font-mono">{beneficiary.account}</p>
                        <p className="font-medium">{beneficiary.bank}</p>
                        {beneficiary.workflowStatus !== WORKFLOW_STATUS.AVAILABLE && (
                          <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded inline-block">
                            ⏳ En attente de validation manuelle
                          </p>
                        )}
                        {beneficiary.country && <p className="text-xs text-gray-500">{beneficiary.country}</p>}
                      </div>
                    </div>

                    <div className="text-right text-sm text-gray-500">
                      <p>Dernier virement</p>
                      <p className="font-medium">{beneficiary.lastUsed}</p>
                      <p className="text-xs">Ajouté le {beneficiary.addedDate}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      // ✅ NEW: Empêche l'ouverture de la modale de détails lors du clic sur l'icône favori
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(beneficiary.id)
                      }}
                    >
                      {beneficiary.favorite ? (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      ) : (
                        <StarOff className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          // ✅ NEW: Empêche l'ouverture de la modale de détails lors du clic sur le menu
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {beneficiary.status === 0 ? (
                          <>
                            <DropdownMenuItem
                              disabled={beneficiary.workflowStatus !== WORKFLOW_STATUS.AVAILABLE}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (beneficiary.workflowStatus === WORKFLOW_STATUS.AVAILABLE) {
                                  window.location.href = "/transfers/new"
                                }
                              }}
                            >
                              <Users className="w-4 h-4 mr-2" />
                              {beneficiary.workflowStatus === WORKFLOW_STATUS.AVAILABLE
                                ? "Faire un virement"
                                : "⏳ En attente de validation"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-orange-600"
                              onClick={(e) => handleDeactivateBeneficiary(beneficiary.id, e)}
                              disabled={isDeactivatePending}
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              Désactiver
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem
                            className="text-green-600"
                            onClick={(e) => handleReactivateBeneficiary(beneficiary.id, e)}
                            disabled={isReactivatePending}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Réactiver
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ NEW: Nouvelle modale pour afficher les détails du bénéficiaire */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Détails du bénéficiaire</span>
            </DialogTitle>
          </DialogHeader>

          {selectedBeneficiary && (
            <div className="space-y-6">
              {/* Statut et badges */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getTypeBadge(selectedBeneficiary.type)}
                  {selectedBeneficiary.status === 1 ? (
                    <Badge variant="outline" className="border-red-400 text-red-700 bg-red-50">
                      Désactivé
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-green-500 text-green-800 bg-green-100 font-semibold">
                      Actif
                    </Badge>
                  )}
                </div>
                {selectedBeneficiary.favorite && (
                  <div className="flex items-center space-x-1 text-yellow-600">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium">Favori</span>
                  </div>
                )}
              </div>

              {/* Informations principales */}
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Nom complet</Label>
                  <p className="text-lg font-semibold">{selectedBeneficiary.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Type</Label>
                    <p className="font-medium">
                      {selectedBeneficiary.type === "BNG-BNG"
                        ? "Interne"
                        : selectedBeneficiary.type === "BNG-CONFRERE"
                          ? "Confrère (Guinée)"
                          : "International"}
                    </p>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Banque</Label>
                    <p className="font-medium">{selectedBeneficiary.bank}</p>
                  </div>
                </div>

                {/* Compte */}
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {selectedBeneficiary.type === "BNG-INTERNATIONAL" ? "IBAN" : "Numéro de compte"}
                  </Label>
                  <p className="font-mono text-base font-semibold bg-gray-50 p-3 rounded border">
                    {selectedBeneficiary.account}
                  </p>
                </div>

                {/* RIB pour types non-internationaux */}
                {selectedBeneficiary.type !== "BNG-INTERNATIONAL" && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedBeneficiary.codagence && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Code agence</Label>
                        <p className="font-mono font-medium">{selectedBeneficiary.codagence}</p>
                      </div>
                    )}
                    {selectedBeneficiary.clerib && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Clé RIB</Label>
                        <p className="font-mono font-medium">{selectedBeneficiary.clerib}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Informations supplémentaires */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label className="text-xs text-muted-foreground">Ajouté le</Label>
                    <p className="text-sm">{selectedBeneficiary.addedDate}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Dernier virement</Label>
                    <p className="text-sm">{selectedBeneficiary.lastUsed}</p>
                  </div>
                </div>

                {/* Message pour les bénéficiaires en attente */}
                {selectedBeneficiary.workflowStatus !== WORKFLOW_STATUS.AVAILABLE && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 text-sm">
                      Ce bénéficiaire est en attente de validation manuelle. Vous ne pouvez pas encore effectuer de
                      virements.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                  Fermer
                </Button>
                {selectedBeneficiary.status === 0 &&
                  selectedBeneficiary.workflowStatus === WORKFLOW_STATUS.AVAILABLE && (
                    <Button
                      onClick={() => {
                        setIsDetailsDialogOpen(false)
                        window.location.href = "/transfers/new"
                      }}
                    >
                      Faire un virement
                    </Button>
                  )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Modifier le bénéficiaire</DialogTitle>
          </DialogHeader>

          <form ref={editFormRef} onSubmit={handleEditBeneficiary} className="space-y-4">
            {updateState?.success && (
              <Alert variant="default" className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">Bénéficiaire modifié avec succès</AlertDescription>
              </Alert>
            )}

            {updateState?.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{updateState.error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nom complet *</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingBeneficiary?.name || ""}
                  placeholder="Nom et prénom du bénéficiaire"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-type">Type de bénéficiaire *</Label>
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
                  <Label htmlFor="edit-bank">Banque *</Label>
                  {selectedType === "BNG-BNG" ? (
                    <Input
                      id="edit-bank"
                      name="bankname"
                      value="Banque Nationale de Guinée"
                      readOnly
                      className="bg-gray-50"
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
                      id="edit-bank"
                      name="bank"
                      value={selectedBank || ""}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      placeholder="Saisissez le nom de la banque"
                      className="bg-white"
                      required
                    />
                  ) : null}
                </div>

                {(selectedType === "BNG-CONFRERE" || selectedType === "BNG-BNG") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-codeBanque">Code Banque *</Label>
                      {selectedType === "BNG-CONFRERE" || selectedType === "BNG-BNG" ? (
                        <Input
                          id="edit-codeBanque"
                          name="codeBanque"
                          value={selectedBankCode || ""}
                          placeholder="Code banque"
                          disabled
                          className="bg-gray-50"
                          maxLength={3}
                          required
                        />
                      ) : (
                        <Input id="edit-codeBanque" name="codeBanque" placeholder="Ex: 022" maxLength={3} required />
                      )}
                    </div>

                    {selectedType === "BNG-CONFRERE" && (
                      <div className="space-y-2">
                        <Label htmlFor="edit-swiftCode">Code SWIFT</Label>
                        <Input
                          id="edit-swiftCode"
                          name="swiftCode"
                          value={selectedSwiftCode || ""}
                          placeholder="Code SWIFT"
                          disabled
                          className="bg-gray-50"
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
                  <Label htmlFor="edit-codeAgence">Code agence *</Label>
                  <Input
                    id="edit-codeAgence"
                    name="codeAgence"
                    defaultValue={editingBeneficiary?.codagence || ""}
                    placeholder="Ex: 001"
                    maxLength={3}
                    onChange={handleRibFieldChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-account">Numéro de compte *</Label>
                  <Input
                    id="edit-account"
                    name="account"
                    defaultValue={editingBeneficiary?.account || ""}
                    onChange={(e) => {
                      validateAccountNumber(e.target.value)
                      handleRibFieldChange()
                    }}
                    placeholder="1234567890"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    required
                  />
                  {accountNumberError && <p className="text-sm text-red-600">{accountNumberError}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-cleRib">Clé RIB *</Label>
                  <Input
                    id="edit-cleRib"
                    name="cleRib"
                    defaultValue={editingBeneficiary?.clerib || ""}
                    placeholder="Ex: 89"
                    maxLength={2}
                    onChange={handleRibFieldChange}
                    required
                  />
                  {ribError && selectedType !== "BNG-INTERNATIONAL" && (
                    <p className="text-sm text-red-600">{ribError}</p>
                  )}
                </div>
              </div>
            )}

            {selectedType === "BNG-INTERNATIONAL" && (
              <div className="space-y-2">
                <Label htmlFor="edit-account">IBAN *</Label>
                <Input
                  id="edit-account"
                  name="account"
                  defaultValue={editingBeneficiary?.account || ""}
                  placeholder="FR76 1234 5678 9012 3456 78"
                  required
                />
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setEditingBeneficiary(null)
                }}
                disabled={isUpdatePending}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={
                  isUpdatePending ||
                  ((accountNumberError !== null || ribError !== null) && selectedType !== "BNG-INTERNATIONAL")
                }
              >
                {isUpdatePending ? "Traitement..." : "Modifier"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <OtpModal
        open={showOtpModal}
        onOpenChange={setShowOtpModal}
        onVerified={handleOtpVerified}
        onCancel={handleOtpCancel}
        purpose="ADD_BENEFICIARY"
        referenceId={otpReferenceId || undefined}
        title="🔐 Confirmer l'ajout du bénéficiaire"
        description={`Pour confirmer l'ajout de "${pendingBeneficiaryData?.get("name") || "ce bénéficiaire"}", entrez le code OTP envoyé par email. Le bénéficiaire sera immédiatement actif après validation.`}
        deliveryMethod="EMAIL"
        autoGenerate={true}
      />
    </div>
  )
}
