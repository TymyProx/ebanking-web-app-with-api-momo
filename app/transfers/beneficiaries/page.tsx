"use client"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
} from "./actions"
import { useActionState } from "react"
import BeneficiaryForm from "@/components/beneficiary-form"

interface Beneficiary {
  id: string
  name: string
  account: string
  bank: string
  type: string //\"BNG-BNG\" | \"BNG-CONFRERE\" | \"BNG-INTERNATIONAL\"
  favorite: boolean
  lastUsed: string
  addedDate: string
  iban?: string
  swiftCode?: string
  country?: string
  status: number // Added status field to track active/inactive beneficiaries
}

export default function BeneficiariesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null)
  const [ribValidation, setRibValidation] = useState<{ isValid: boolean; message: string } | null>(null)
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const [addState, addAction, isAddPending] = useActionState(addBeneficiary, null)
  const [updateState, updateAction, isUpdatePending] = useActionState(updateBeneficiary, null)
  const [deactivateState, deactivateAction, isDeactivatePending] = useActionState(deactivateBeneficiary, null)
  const [reactivateState, reactivateAction, isReactivatePending] = useActionState(reactivateBeneficiary, null)

  const [addMessage, setAddMessage] = useState<string | null>(null)
  const [updateMessage, setUpdateMessage] = useState<string | null>(null)
  const [showDeactivateSuccess, setShowDeactivateSuccess] = useState(false)
  const [showReactivateSuccess, setShowReactivateSuccess] = useState(false)
  const [showAddSuccess, setShowAddSuccess] = useState(false)
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false)

  const loadBeneficiaries = async () => {
    setIsLoading(true)
    try {
      const apiBeneficiaries = await getBeneficiaries()
      console.log("ApiBeneficiaire", apiBeneficiaries)
      const transformedBeneficiaries: Beneficiary[] = apiBeneficiaries.map((apiB) => ({
        id: apiB.id,
        name: apiB.name,
        account: apiB.accountNumber,
        bank: getBankNameFromCode(apiB.bankCode),
        type: apiB.typeBeneficiary,
        favorite: apiB.favoris || false,
        lastUsed: "Jamais",
        addedDate: new Date(apiB.createdAt).toLocaleDateString("fr-FR"),
        status: apiB.status, // Include status from API response
      }))
      console.log("Transformed Beneficiaries", transformedBeneficiaries)
      setBeneficiaries(transformedBeneficiaries)
    } catch (error) {
      console.error("Erreur lors du chargement des bénéficiaires:", error)
    } finally {
      setIsLoading(false)
    }
  }

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
      beneficiary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      beneficiary.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
      beneficiary.bank.toLowerCase().includes(searchTerm.toLowerCase())

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

  const resetForm = () => {
    setRibValidation(null)
    setAddMessage(null)
    setUpdateMessage(null)
  }

  const handleAddBeneficiary = async (formData: FormData) => {
    startTransition(async () => {
      const result = await addAction(formData)
      if (result?.success) {
        setIsAddDialogOpen(false)
        setAddMessage(null) // Clear form messages when closing modal
      } else {
        setAddMessage(result?.error || "Erreur lors de l'ajout du bénéficiaire.")
      }
    })
  }

  const handleEditBeneficiary = async (formData: FormData) => {
    if (!editingBeneficiary) return

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
      } else {
        setUpdateMessage(result?.error || "Erreur lors de la modification du bénéficiaire.")
      }
    })
  }

  const handleDeactivateBeneficiary = async (beneficiaryId: string) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.append("id", beneficiaryId)
      await deactivateAction(formData)
    })
  }

  const handleReactivateBeneficiary = async (beneficiaryId: string) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.append("id", beneficiaryId)
      await reactivateAction(formData)
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

  const openEditDialog = (beneficiary: Beneficiary) => {
    setEditingBeneficiary(beneficiary)
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

            <BeneficiaryForm
              successMessage={addState?.success ? "✅ Bénéficiaire ajouté avec succès." : undefined}
              errorMessage={addMessage || addState?.error}
              onMessageClear={() => setAddMessage(null)}
              onSubmit={handleAddBeneficiary}
              onCancel={() => setIsAddDialogOpen(false)}
              isPending={isAddPending}
            />
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
                <SelectItem value="favorites">Favoris</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier le bénéficiaire</DialogTitle>
          </DialogHeader>

          <BeneficiaryForm
            isEdit={true}
            initialData={{
              name: editingBeneficiary?.name,
              account: editingBeneficiary?.account,
              bank: editingBeneficiary?.bank,
              type: editingBeneficiary?.type,
              iban: editingBeneficiary?.iban,
              swiftCode: editingBeneficiary?.swiftCode,
              country: editingBeneficiary?.country,
            }}
            successMessage={updateState?.success ? "✅ Bénéficiaire modifié avec succès." : undefined}
            errorMessage={updateMessage || updateState?.error}
            onMessageClear={() => setUpdateMessage(null)}
            onSubmit={handleEditBeneficiary}
            onCancel={() => {
              setIsEditDialogOpen(false)
              setEditingBeneficiary(null)
            }}
            isPending={isUpdatePending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
