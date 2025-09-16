"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from "lucide-react"

interface BeneficiaryFormProps {
  isEdit?: boolean
  initialData?: {
    name?: string
    account?: string
    bank?: string
    type?: string
    iban?: string
    swiftCode?: string
    country?: string
  }
  onSubmit: (formData: FormData) => void
  onCancel: () => void
  isPending: boolean
  successMessage?: string
  errorMessage?: string
  onMessageClear?: () => void
}

interface Bank {
  id: string
  bankName: string
  swiftCode: string
  codeBank: string
}

export default function BeneficiaryForm({
  isEdit = false,
  initialData = {},
  onSubmit,
  onCancel,
  isPending,
  successMessage,
  errorMessage,
  onMessageClear,
}: BeneficiaryFormProps) {
  const [selectedType, setSelectedType] = useState(initialData.type || "")
  const [selectedBank, setSelectedBank] = useState(initialData.bank || "")
  const [banks, setBanks] = useState<Bank[]>([])
  const [selectedBankCode, setSelectedBankCode] = useState("")
  const [loadingBanks, setLoadingBanks] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const loadBanks = async () => {
    try {
      setLoadingBanks(true)
      const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || localStorage.getItem("tenantId")
      const token = localStorage.getItem("authToken")

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/tenant/${tenantId}/banque`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setBanks(data.rows || [])
      }
    } catch (error) {
      console.error("Erreur lors du chargement des banques:", error)
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
    } else if (selectedType !== "") {
      setSelectedBank("")
      setSelectedBankCode("")
    }
  }, [selectedType])

  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        if (onMessageClear) {
          onMessageClear()
        }
      }, 8000)

      return () => clearTimeout(timer)
    }
  }, [successMessage, errorMessage, onMessageClear])

  useEffect(() => {
    if (successMessage && !isEdit) {
      setSelectedType("")
      setSelectedBank("")

      if (formRef.current) {
        formRef.current.reset()
      }
    }
  }, [successMessage, isEdit])

  const validateRIBField = async (account: string, type: string) => {
    if (!account || account.length <= 5) {
      return
    }

    const isValid = account.length >= 10
    console.log(isValid ? "RIB valide" : "RIB invalide")
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    formData.set("type", selectedType)
    const bankValue = selectedType === "BNG-BNG" ? "Banque Nationale de Guinée" : selectedBank
    formData.set("bank", bankValue)
    if (selectedType === "BNG-CONFRERE" && selectedBankCode) {
      formData.set("bankCode", selectedBankCode)
    }

    onSubmit(formData)
  }

  const handleBankSelection = (bankName: string) => {
    setSelectedBank(bankName)
    const selectedBankData = banks.find((bank) => bank.bankName === bankName)
    if (selectedBankData) {
      setSelectedBankCode(selectedBankData.codeBank)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      {successMessage && (
        <Alert variant="default" className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nom complet *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={initialData.name || ""}
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

      <div className="space-y-2">
        <Label htmlFor="account">{selectedType === "BNG-INTERNATIONAL" ? "IBAN *" : "Numéro de compte / RIB *"}</Label>
        <Input
          id="account"
          name="account"
          defaultValue={initialData.account || ""}
          onChange={(e) => validateRIBField(e.target.value, selectedType)}
          placeholder={selectedType === "BNG-INTERNATIONAL" ? "FR76 1234 5678 9012 3456 78" : "0001-234567-89"}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bank">Banque *</Label>
        {selectedType === "BNG-BNG" ? (
          <Input id="bank" name="bank" value="Banque Nationale de Guinée" readOnly className="bg-gray-50" />
        ) : selectedType === "BNG-CONFRERE" ? (
          <Select value={selectedBank} onValueChange={handleBankSelection} required>
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
            value={selectedBank}
            onChange={(e) => setSelectedBank(e.target.value)}
            placeholder="Saisissez le nom de la banque"
            className="bg-white"
            required
          />
        ) : null}
      </div>

      {selectedType === "BNG-CONFRERE" && selectedBankCode && (
        <input type="hidden" name="codeBank" value={selectedBankCode} />
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Annuler
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Traitement..." : isEdit ? "Modifier" : "Ajouter"}
        </Button>
      </div>
    </form>
  )
}
