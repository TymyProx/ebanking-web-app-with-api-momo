"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
}

export default function BeneficiaryForm({
  isEdit = false,
  initialData = {},
  onSubmit,
  onCancel,
  isPending,
}: BeneficiaryFormProps) {
  const [selectedType, setSelectedType] = useState(initialData.type || "")
  const [selectedBank, setSelectedBank] = useState(initialData.bank || "")
  const [selectedCountry, setSelectedCountry] = useState(initialData.country || "")
  const [ribValidation, setRibValidation] = useState<{ isValid: boolean; message: string } | null>(null)

  const formRef = useRef<HTMLFormElement>(null)

  const validateRIBField = async (account: string, type: string) => {
    if (!account || account.length <= 5) {
      setRibValidation(null)
      return
    }

    // Simulation de validation RIB
    const isValid = account.length >= 10
    setRibValidation({
      isValid,
      message: isValid ? "RIB valide" : "RIB invalide",
    })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    formData.set("type", selectedType)
    formData.set("bank", selectedBank)
    if (selectedCountry) {
      formData.set("country", selectedCountry)
    }

    onSubmit(formData)
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
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
            <SelectItem value="BNG-BNG">BNG vers BNG (Gratuit)</SelectItem>
            <SelectItem value="BNG-CONFRERE">BNG vers Confrère (2,500 GNF)</SelectItem>
            <SelectItem value="BNG-INTERNATIONAL">International (Variable)</SelectItem>
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
        {ribValidation && (
          <div
            className={`flex items-center space-x-2 text-sm ${
              ribValidation.isValid ? "text-green-600" : "text-red-600"
            }`}
          >
            {ribValidation.isValid ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{ribValidation.message}</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bank">Banque *</Label>
        {selectedType === "BNG-BNG" ? (
          <Input id="bank" name="bank" value="Banque Nationale de Guinée" readOnly className="bg-gray-50" />
        ) : (
          <Select value={selectedBank} onValueChange={setSelectedBank} required>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez la banque" />
            </SelectTrigger>
            <SelectContent>
              {selectedType === "BNG-CONFRERE" ? (
                <>
                  <SelectItem value="BICIGUI">BICIGUI</SelectItem>
                  <SelectItem value="SGBG">Société Générale de Banques en Guinée</SelectItem>
                  <SelectItem value="UBA">United Bank for Africa</SelectItem>
                  <SelectItem value="ECOBANK">Ecobank Guinée</SelectItem>
                  <SelectItem value="VISTA BANK">Vista Bank</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="BNP Paribas">BNP Paribas</SelectItem>
                  <SelectItem value="Société Générale">Société Générale</SelectItem>
                  <SelectItem value="Crédit Agricole">Crédit Agricole</SelectItem>
                  <SelectItem value="HSBC">HSBC</SelectItem>
                  <SelectItem value="Deutsche Bank">Deutsche Bank</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      {selectedType === "BNG-INTERNATIONAL" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="swiftCode">Code SWIFT</Label>
            <Input id="swiftCode" name="swiftCode" defaultValue={initialData.swiftCode || ""} placeholder="BNPAFRPP" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Pays</Label>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez le pays" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="France">France</SelectItem>
                <SelectItem value="Belgique">Belgique</SelectItem>
                <SelectItem value="Suisse">Suisse</SelectItem>
                <SelectItem value="Canada">Canada</SelectItem>
                <SelectItem value="États-Unis">États-Unis</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Annuler
        </Button>
        <Button type="submit" disabled={isPending || (ribValidation && !ribValidation.isValid)}>
          {isPending ? "Traitement..." : isEdit ? "Modifier" : "Ajouter"}
        </Button>
      </div>
    </form>
  )
}
