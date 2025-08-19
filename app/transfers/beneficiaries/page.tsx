"use client"

import { useState, useEffect } from "react"
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
  Trash2,
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
import { addBeneficiary, updateBeneficiary, deleteBeneficiary, validateRIB, getBeneficiaries } from "./actions"
import { useActionState } from "react"

interface Beneficiary {
  id: string
  name: string
  account: string
  bank: string
  type: "BNG-BNG" | "BNG-CONFRERE" | "BNG-INTERNATIONAL"
  favorite: boolean
  lastUsed: string
  addedDate: string
  iban?: string
  swiftCode?: string
  country?: string
}

interface BeneficiaryFormData {
  name: string
  account: string
  bank: string
  type: string
  iban?: string
  swiftCode?: string
  country?: string
}

export default function BeneficiariesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null)
  const [formData, setFormData] = useState<BeneficiaryFormData>({
    name: "",
    account: "",
    bank: "",
    type: "",
  })
  const [ribValidation, setRibValidation] = useState<{ isValid: boolean; message: string } | null>(null)
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [addState, addAction, isAddPending] = useActionState(addBeneficiary, null)
  const [updateState, updateAction, isUpdatePending] = useActionState(updateBeneficiary, null)
  const [deleteState, deleteAction, isDeletePending] = useActionState(deleteBeneficiary, null)

  useEffect(() => {
    const loadBeneficiaries = async () => {
      setIsLoading(true)
      try {
        const apiBeneficiaries = await getBeneficiaries()
        console.log("ApiBeneficiaire",apiBeneficiaries)
        const transformedBeneficiaries: Beneficiary[] = apiBeneficiaries.map((apiB) => ({
          id: apiB.id,
          name: apiB.name,
          account: apiB.accountNumber,
          bank: getBankNameFromCode(apiB.bankCode),
          type: getBeneficiaryType(apiB.bankCode),
          favorite: false,
          lastUsed: "Jamais",
          addedDate: new Date(apiB.createdAt).toLocaleDateString("fr-FR"),
        }))
        console.log("Transformed Beneficiaries",transformedBeneficiaries)
        setBeneficiaries(transformedBeneficiaries)
      } catch (error) {
        console.error("Erreur lors du chargement des bénéficiaires:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadBeneficiaries()
  }, [])

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

  const getBeneficiaryType = (bankCode: string): "BNG-BNG" | "BNG-CONFRERE" | "BNG-INTERNATIONAL" => {
    if (bankCode === "BNG") {
      return "BNG-BNG"
    } else if (["BICI", "SGBG", "UBA", "ECO", "VISTA"].includes(bankCode)) {
      return "BNG-CONFRERE"
    } else {
      return "BNG-INTERNATIONAL"
    }
  }

  const filteredBeneficiaries = beneficiaries.filter((beneficiary) => {
    const matchesSearch =
      beneficiary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      beneficiary.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
      beneficiary.bank.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter =
      filterType === "all" || (filterType === "favorites" && beneficiary.favorite) || beneficiary.type === filterType

    return matchesSearch && matchesFilter
  })

  const resetForm = () => {
    setFormData({
      name: "",
      account: "",
      bank: "",
      type: "",
    })
    setRibValidation(null)
  }

  const handleAddBeneficiary = async (formData: FormData) => {
    const result = await addAction(formData)
    if (result?.success) {
      const apiBeneficiaries = await getBeneficiaries()
      const transformedBeneficiaries: Beneficiary[] = apiBeneficiaries.map((apiB) => ({
        id: apiB.id,
        name: apiB.name,
        account: apiB.accountNumber,
        bank: getBankNameFromCode(apiB.bankCode),
        type: getBeneficiaryType(apiB.bankCode),
        favorite: false,
        lastUsed: "Jamais",
        addedDate: new Date(apiB.createdAt).toLocaleDateString("fr-FR"),
      }))
      setBeneficiaries(transformedBeneficiaries)
      setIsAddDialogOpen(false)
      resetForm()
    }
  }

  const handleEditBeneficiary = async (formData: FormData) => {
    if (!editingBeneficiary) return

    const result = await updateAction(formData)
    if (result?.success) {
      const apiBeneficiaries = await getBeneficiaries()
      const transformedBeneficiaries: Beneficiary[] = apiBeneficiaries.map((apiB) => ({
        id: apiB.id,
        name: apiB.name,
        account: apiB.accountNumber,
        bank: getBankNameFromCode(apiB.bankCode),
        type: getBeneficiaryType(apiB.bankCode),
        favorite: beneficiaries.find((b) => b.id === apiB.id)?.favorite || false,
        lastUsed: beneficiaries.find((b) => b.id === apiB.id)?.lastUsed || "Jamais",
        addedDate: new Date(apiB.createdAt).toLocaleDateString("fr-FR"),
      }))
      setBeneficiaries(transformedBeneficiaries)
      setIsEditDialogOpen(false)
      setEditingBeneficiary(null)
      resetForm()
    }
  }

  const handleDeleteBeneficiary = async (beneficiaryId: string) => {
    const formData = new FormData()
    formData.append("beneficiaryId", beneficiaryId)

    const result = await deleteAction(formData)
    if (result?.success) {
      setBeneficiaries((prev) => prev.filter((b) => b.id !== beneficiaryId))
    }
  }

  const validateRIBField = async (account: string, type: string) => {
    if (!account) {
      setRibValidation(null)
      return
    }

    try {
      const result = await validateRIB(account, type)
      setRibValidation(result)
    } catch (error) {
      setRibValidation({
        isValid: false,
        message: "Erreur lors de la validation",
      })
    }
  }

  const toggleFavorite = (id: string) => {
    setBeneficiaries((prev) => prev.map((b) => (b.id === id ? { ...b, favorite: !b.favorite } : b)))
  }

  const openEditDialog = (beneficiary: Beneficiary) => {
    setEditingBeneficiary(beneficiary)
    setFormData({
      name: beneficiary.name,
      account: beneficiary.account,
      bank: beneficiary.bank,
      type: beneficiary.type,
      iban: beneficiary.iban || "",
      swiftCode: beneficiary.swiftCode || "",
      country: beneficiary.country || "",
    })
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

  const BeneficiaryForm = ({
    isEdit = false,
    onSubmit,
    isPending,
  }: {
    isEdit?: boolean
    onSubmit: (formData: FormData) => void
    isPending: boolean
  }) => (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom complet *</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Nom et prénom du bénéficiaire"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Type de bénéficiaire *</Label>
        <Select
          name="type"
          value={formData.type}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
          required
        >
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
        <Label htmlFor="account">{formData.type === "BNG-INTERNATIONAL" ? "IBAN *" : "Numéro de compte / RIB *"}</Label>
        <Input
          id="account"
          name="account"
          value={formData.account}
          onChange={(e) => {
            const value = e.target.value
            setFormData((prev) => ({ ...prev, account: value }))
            if (value.length > 5) {
              validateRIBField(value, formData.type)
            }
          }}
          placeholder={formData.type === "BNG-INTERNATIONAL" ? "FR76 1234 5678 9012 3456 78" : "0001-234567-89"}
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
        {formData.type === "BNG-BNG" ? (
          <Input id="bank" name="bank" value="Banque Nationale de Guinée" readOnly className="bg-gray-50" />
        ) : (
          <Select
            name="bank"
            value={formData.bank}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, bank: value }))}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez la banque" />
            </SelectTrigger>
            <SelectContent>
              {formData.type === "BNG-CONFRERE" ? (
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

      {formData.type === "BNG-INTERNATIONAL" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="swiftCode">Code SWIFT</Label>
            <Input
              id="swiftCode"
              name="swiftCode"
              value={formData.swiftCode || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, swiftCode: e.target.value }))}
              placeholder="BNPAFRPP"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Pays</Label>
            <Select
              name="country"
              value={formData.country || ""}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, country: value }))}
            >
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
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (isEdit) {
              setIsEditDialogOpen(false)
              setEditingBeneficiary(null)
            } else {
              setIsAddDialogOpen(false)
            }
            resetForm()
          }}
          disabled={isPending}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isPending || (ribValidation && !ribValidation.isValid)}>
          {isPending ? "Traitement..." : isEdit ? "Modifier" : "Ajouter"}
        </Button>
      </div>
    </form>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des bénéficiaires</h1>
          <p className="text-gray-600">Gérez vos destinataires de virements</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un bénéficiaire
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Ajouter un bénéficiaire</DialogTitle>
            </DialogHeader>

            {addState?.success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">✅ Bénéficiaire ajouté avec succès.</AlertDescription>
              </Alert>
            )}

            {addState?.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>❌ Erreur lors de l'ajout. Veuillez vérifier les informations.</AlertDescription>
              </Alert>
            )}

            <BeneficiaryForm onSubmit={handleAddBeneficiary} isPending={isAddPending} />
          </DialogContent>
        </Dialog>
      </div>

      {deleteState?.success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">✅ Bénéficiaire supprimé avec succès.</AlertDescription>
        </Alert>
      )}

      {deleteState?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>❌ Erreur lors de la suppression. Veuillez réessayer.</AlertDescription>
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
                <SelectItem value="favorites">Favoris</SelectItem>
                <SelectItem value="BNG-BNG">BNG vers BNG</SelectItem>
                <SelectItem value="BNG-CONFRERE">BNG vers Confrère</SelectItem>
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
                    <Button variant="ghost" size="sm" onClick={() => toggleFavorite(beneficiary.id)}>
                      {beneficiary.favorite ? (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      ) : (
                        <StarOff className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(beneficiary)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="w-4 h-4 mr-2" />
                          Faire un virement
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteBeneficiary(beneficiary.id)}
                          disabled={isDeletePending}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier le bénéficiaire</DialogTitle>
          </DialogHeader>

          {updateState?.success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">✅ Bénéficiaire modifié avec succès.</AlertDescription>
            </Alert>
          )}

          {updateState?.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                ❌ Erreur lors de la modification. Veuillez vérifier les informations.
              </AlertDescription>
            </Alert>
          )}

          <BeneficiaryForm isEdit={true} onSubmit={handleEditBeneficiary} isPending={isUpdatePending} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
