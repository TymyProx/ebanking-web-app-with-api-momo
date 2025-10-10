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
      //console.log("ApiBeneficiaire", apiBeneficiaries)
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
      //console.log("Transformed Beneficiaries", transformedBeneficiaries)
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
        await loadBeneficiaries() // Force refresh the list immediately
        resetForm()
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
        await loadBeneficiaries() // Force refresh the list immediately
        resetForm()
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

  const handleFormSuccess = async () => {
    //console.log("[v0] Form submitted successfully, refreshing list...")
    await loadBeneficiaries()
  }

  return (
    <div className="space-y-8">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 rounded-2xl blur-3xl -z-10" />
        <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-border/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                Gestion des bénéficiaires
              </h1>
              <p className="text-muted-foreground mt-1">Gérez vos destinataires de virements</p>
            </div>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
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
                  errorMessage={addState?.error}
                  onMessageClear={() => {
                    // Clear any local message states - the form component handles its own cleanup
                  }}
                  onSubmit={handleAddBeneficiary}
                  onCancel={() => setIsAddDialogOpen(false)}
                  isPending={isAddPending}
                  onSuccess={handleFormSuccess}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
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

      <Card className="border-2 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
        <CardContent className="pt-6 relative">
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-2 hover:border-primary/50 transition-all duration-300 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-500/10 group-hover:from-blue-500/10 group-hover:to-blue-500/20 transition-all duration-300" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  {beneficiaries.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-yellow-500/50 transition-all duration-300 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-yellow-500/10 group-hover:from-yellow-500/10 group-hover:to-yellow-500/20 transition-all duration-300" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/20">
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Favoris</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-800 bg-clip-text text-transparent">
                  {beneficiaries.filter((b) => b.favorite).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-green-500/50 transition-all duration-300 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-500/10 group-hover:from-green-500/10 group-hover:to-green-500/20 transition-all duration-300" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20">
                <Building className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">BNG</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                  {beneficiaries.filter((b) => b.type === "BNG-BNG").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-purple-500/50 transition-all duration-300 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-500/10 group-hover:from-purple-500/10 group-hover:to-purple-500/20 transition-all duration-300" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20">
                <Globe className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">International</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                  {beneficiaries.filter((b) => b.type === "BNG-INTERNATIONAL").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-secondary mr-3">
              <Users className="w-5 h-5 text-white" />
            </div>
            Mes bénéficiaires ({filteredBeneficiaries.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 inline-block mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
              <p className="text-muted-foreground">Chargement des bénéficiaires...</p>
            </div>
          ) : filteredBeneficiaries.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 inline-block mb-4">
                <Users className="w-12 h-12 text-primary" />
              </div>
              <p className="text-muted-foreground font-medium">Aucun bénéficiaire trouvé</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Ajoutez votre premier bénéficiaire pour commencer</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBeneficiaries.map((beneficiary) => (
                <div
                  key={beneficiary.id}
                  className="flex items-center justify-between p-4 border-2 rounded-xl hover:border-primary/50 hover:shadow-md transition-all duration-300 bg-white/50 backdrop-blur-sm group"
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
            errorMessage={updateState?.error}
            onMessageClear={() => {
              // Clear any local message states - the form component handles its own cleanup
            }}
            onSubmit={handleEditBeneficiary}
            onCancel={() => {
              setIsEditDialogOpen(false)
              setEditingBeneficiary(null)
            }}
            isPending={isUpdatePending}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
