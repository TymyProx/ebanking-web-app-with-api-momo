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
  Edit,
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
import { importAesGcmKeyFromBase64, isEncryptedJson, decryptAesGcmFromJson } from "@/lib/crypto"

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
  status: number
  codagence?: string
  clerib?: string
}

interface Bank {
  id: string
  bankName: string
  swiftCode: string
  codeBank: string
}

export default function BeneficiariesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null)
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const [selectedType, setSelectedType] = useState("")
  const [selectedBank, setSelectedBank] = useState("")
  const [banks, setBanks] = useState<Bank[]>([])
  const [selectedBankCode, setSelectedBankCode] = useState("")
  const [selectedSwiftCode, setSelectedSwiftCode] = useState("")
  const [loadingBanks, setLoadingBanks] = useState(false)
  const [accountNumberError, setAccountNumberError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const editFormRef = useRef<HTMLFormElement>(null)

  const [addState, addAction, isAddPending] = useActionState(addBeneficiary, null)
  const [updateState, updateAction, isUpdatePending] = useActionState(updateBeneficiary, null)
  const [deactivateState, deactivateAction, isDeactivatePending] = useActionState(deactivateBeneficiary, null)
  const [reactivateState, reactivateAction, isReactivatePending] = useActionState(reactivateBeneficiary, null)

  const [showDeactivateSuccess, setShowDeactivateSuccess] = useState(false)
  const [showReactivateSuccess, setShowReactivateSuccess] = useState(false)
  const [showAddSuccess, setShowAddSuccess] = useState(false)
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false)

  const loadBeneficiaries = async () => {
    setIsLoading(true)
    try {
      const apiBeneficiaries = await getBeneficiaries()
      const secureMode = (process.env.NEXT_PUBLIC_PORTAL_SECURE_MODE || "false").toLowerCase() === "true"
      const keyB64 = process.env.NEXT_PUBLIC_PORTAL_KEY_B64 || ""
      const logDebug = (process.env.NEXT_PUBLIC_LOG_LEVEL || "").toLowerCase() === "debug"
      let key: CryptoKey | null = null
      try {
        if (secureMode && keyB64) key = await importAesGcmKeyFromBase64(keyB64)
      } catch (_) {
        key = null
      }

      if (logDebug) {
        console.log("[BEN] secureMode:", secureMode, "key loaded:", !!key, "rows:", apiBeneficiaries.length)
        if (apiBeneficiaries[0]) {
          const s = apiBeneficiaries[0] as any
          console.log("[BEN] sample raw:", {
            id: s.id,
            nameType: typeof s.name,
            accountNumberType: typeof s.accountNumber,
            bankCodeType: typeof s.bankCode,
            bankNameType: typeof s.bankName,
            namePreview: typeof s.name === 'string' ? s.name.slice(0, 40) : s.name,
          })
        }
      }

      const transformedBeneficiaries: Beneficiary[] = await Promise.all(
        apiBeneficiaries.map(async (apiB: any) => {
          let name: any = apiB.name
          let accountNumber: any = apiB.accountNumber
          let bankCode: any = apiB.bankCode
          let bankName: any = apiB.bankName
          const asEnc = (v: any) => {
            if (!v) return null
            if (isEncryptedJson(v)) return v
            if (typeof v === 'string') {
              try {
                const parsed = JSON.parse(v)
                return isEncryptedJson(parsed) ? parsed : null
              } catch {
                return null
              }
            }
            return null
          }
          try {
            const nEnc = key ? asEnc(name) : null
            if (nEnc) name = await decryptAesGcmFromJson(nEnc, key as CryptoKey)
            const aEnc = key ? asEnc(accountNumber) : null
            if (aEnc) accountNumber = await decryptAesGcmFromJson(aEnc, key as CryptoKey)
            const bcEnc = key ? asEnc(bankCode) : null
            if (bcEnc) bankCode = await decryptAesGcmFromJson(bcEnc, key as CryptoKey)
            const bnEnc = key ? asEnc(bankName) : null
            if (bnEnc) bankName = await decryptAesGcmFromJson(bnEnc, key as CryptoKey)
          } catch (_) {}

          if (logDebug) {
            console.log("[BEN] row decrypted:", {
              id: apiB.id,
              nameType: typeof name,
              accountType: typeof accountNumber,
              bankCodeType: typeof bankCode,
              bankNameType: typeof bankName,
              namePreview: typeof name === 'string' ? name.slice(0, 40) : name,
            })
          }

          return {
            id: apiB.id,
            name: typeof name === 'string' ? name : '',
            account: typeof accountNumber === 'string' ? accountNumber : '',
            bank: getBankNameFromCode(typeof bankCode === 'string' && bankCode ? bankCode : (typeof bankName === 'string' ? bankName : '')),
            type: apiB.typeBeneficiary,
            favorite: apiB.favoris || false,
            lastUsed: "Jamais",
            addedDate: new Date(apiB.createdAt).toLocaleDateString("fr-FR"),
            status: apiB.status,
            codagence: apiB.codagence,
            clerib: apiB.clerib,
          } as Beneficiary
        })
      )
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
  }, [selectedType])

  useEffect(() => {
    loadBeneficiaries()
  }, [])

  useEffect(() => {
    if (addState?.success || updateState?.success || deactivateState?.success || reactivateState?.success) {
      loadBeneficiaries()
    }
  }, [addState?.success, updateState?.success, deactivateState?.success, reactivateState?.success])

  useEffect(() => {
    if (addState?.success) {
      setShowAddSuccess(true)
      const timer = setTimeout(() => {
        setShowAddSuccess(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [addState?.success])

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

  const filteredBeneficiaries = beneficiaries.filter((beneficiary) => {
    const matchesSearch =
      (beneficiary.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (beneficiary.account || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (beneficiary.bank || '').toLowerCase().includes(searchTerm.toLowerCase())

    let matchesFilter = false
    if (filterType === "all") {
      matchesFilter = beneficiary.status === 0 // Only show active beneficiaries by default
    } else if (filterType === "inactive") {
      matchesFilter = beneficiary.status === 1 // Show inactive beneficiaries
    } else if (filterType === "favorites") {
      matchesFilter = beneficiary.favorite && beneficiary.status === 0 // Only active favorites
    } else {
      matchesFilter = beneficiary.type === filterType && beneficiary.status === 0 // Only active of specific type
    }

    return matchesSearch && matchesFilter
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
      formData.set("bank", "GNXXX")
      formData.set("bankname", "Banque Nationale de Guinée")
    } else if (selectedType === "BNG-CONFRERE") {
      formData.set("bank", selectedBankCode)
      formData.set("bankname", selectedBank)
    } else {
      const bankValue = selectedBank
      formData.set("bank", bankValue)
    }

    if (selectedType === "BNG-CONFRERE" && selectedBankCode) {
      formData.set("bankCode", selectedBankCode)
    }

    startTransition(async () => {
      const result = await addAction(formData)
      if (result?.success) {
        setIsAddDialogOpen(false)
        await loadBeneficiaries()
        resetForm()
        if (formRef.current) {
          formRef.current.reset()
        }
      }
    })
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

    startTransition(async () => {
      const result = await updateAction(formData)
      if (result?.success) {
        setIsEditDialogOpen(false)
        setEditingBeneficiary(null)
        await loadBeneficiaries()
        resetForm()
      }
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

  const handleFormSuccess = async () => {
    await loadBeneficiaries()
  }

  const handleDeactivateBeneficiary = async (id: string) => {
    try {
      const result = await deactivateAction(id)
      if (result.success) {
        setBeneficiaries((prev) => prev.map((b) => (b.id === id ? { ...b, status: 1 } : b)))
        setShowDeactivateSuccess(true)
        const timer = setTimeout(() => {
          setShowDeactivateSuccess(false)
        }, 5000)
        return () => clearTimeout(timer)
      } else {
        console.error("Erreur lors de la désactivation du bénéficiaire:", result.error)
      }
    } catch (error) {
      console.error("Erreur lors de la désactivation du bénéficiaire:", error)
    }
  }

  const handleReactivateBeneficiary = async (id: string) => {
    try {
      const result = await reactivateAction(id)
      if (result.success) {
        setBeneficiaries((prev) => prev.map((b) => (b.id === id ? { ...b, status: 0 } : b)))
        setShowReactivateSuccess(true)
        const timer = setTimeout(() => {
          setShowReactivateSuccess(false)
        }, 5000)
        return () => clearTimeout(timer)
      } else {
        console.error("Erreur lors de la réactivation du bénéficiaire:", result.error)
      }
    } catch (error) {
      console.error("Erreur lors de la réactivation du bénéficiaire:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Gestion des bénéficiaires
          </h1>
          <p className="text-muted-foreground text-lg">Gérez vos destinataires de virements</p>
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
              {addState?.success && (
                <Alert variant="default" className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">Bénéficiaire ajouté avec succès</AlertDescription>
                </Alert>
              )}

              {addState?.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{addState.error}</AlertDescription>
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
                            required
                          />
                        ) : (
                          <Input id="codeBanque" name="codeBanque" placeholder="Ex: GNXXX" required />
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
                    <Input id="codeAgence" name="codeAgence" placeholder="Ex: 0001" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account">Numéro de compte *</Label>
                    <Input
                      id="account"
                      name="account"
                      onChange={(e) => validateAccountNumber(e.target.value)}
                      placeholder="1234567890"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      required
                    />
                    {accountNumberError && <p className="text-sm text-red-600">{accountNumberError}</p>}
                    <p className="text-xs text-muted-foreground">10 chiffres uniquement</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cleRib">Clé RIB *</Label>
                    <Input id="cleRib" name="cleRib" placeholder="Ex: 89" maxLength={2} required />
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
                  disabled={isAddPending || (accountNumberError !== null && selectedType !== "BNG-INTERNATIONAL")}
                >
                  {isAddPending ? "Traitement..." : "Ajouter"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {showAddSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">✅ Bénéficiaire ajouté avec succès.</AlertDescription>
        </Alert>
      )}

      {addState?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>❌ {addState.error}</AlertDescription>
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
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les bénéficiaires</SelectItem>
                <SelectItem value="BNG-CONFRERE">Confrère(Guinée)</SelectItem>
                <SelectItem value="favorites">Favoris</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
                <SelectItem value="BNG-BNG">Interne</SelectItem>
                <SelectItem value="BNG-INTERNATIONAL">International</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{beneficiaries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Favoris</p>
                <p className="text-2xl font-bold">{beneficiaries.filter((b) => b.favorite).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">BNG</p>
                <p className="text-2xl font-bold">{beneficiaries.filter((b) => b.type === "BNG-BNG").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Globe className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">International</p>
                <p className="text-2xl font-bold">
                  {beneficiaries.filter((b) => b.type === "BNG-INTERNATIONAL").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
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
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="font-mono">{beneficiary.account}</p>
                        <p className="font-medium">{beneficiary.bank}</p>
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
                    {beneficiary.status === 0 && (
                      <Button variant="ghost" size="sm" onClick={() => toggleFavorite(beneficiary.id)}>
                        {beneficiary.favorite ? (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        ) : (
                          <StarOff className="w-4 h-4 text-gray-400" />
                        )}
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {beneficiary.status === 0 ? (
                          <>
                            <DropdownMenuItem onClick={() => openEditDialog(beneficiary)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Users className="w-4 h-4 mr-2" />
                              Faire un virement
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-orange-600"
                              onClick={() => handleDeactivateBeneficiary(beneficiary.id)}
                              disabled={isDeactivatePending}
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              Désactiver
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem
                            className="text-green-600"
                            onClick={() => handleReactivateBeneficiary(beneficiary.id)}
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
                          required
                        />
                      ) : (
                        <Input id="edit-codeBanque" name="codeBanque" placeholder="Ex: GNXXX" required />
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
                    placeholder="Ex: 0001"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-account">Numéro de compte *</Label>
                  <Input
                    id="edit-account"
                    name="account"
                    defaultValue={editingBeneficiary?.account || ""}
                    onChange={(e) => validateAccountNumber(e.target.value)}
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
                    required
                  />
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
                disabled={isUpdatePending || (accountNumberError !== null && selectedType !== "BNG-INTERNATIONAL")}
              >
                {isUpdatePending ? "Traitement..." : "Modifier"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
