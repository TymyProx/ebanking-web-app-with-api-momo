"use client"

import { useState, useTransition, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, MapPin, Briefcase, Shield, CheckCircle, AlertCircle, Edit, Save, X } from "lucide-react"
import { updateProfile } from "./actions"
import { AuthService, type User as AuthUser } from "@/lib/auth-service"

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  address: string
  city: string
  postalCode: string
  country: string
  profession: string
  employer: string
  monthlyIncome: string
}

const defaultData: ProfileData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  address: "",
  city: "",
  postalCode: "",
  country: "Guinée",
  profession: "",
  employer: "",
  monthlyIncome: "",
}

const countries = ["Guinée", "Sénégal", "Mali", "Côte d'Ivoire", "Burkina Faso", "Niger", "France", "Autre"]

const incomeRanges = [
  { value: "0-1000000", label: "Moins de 1 000 000 GNF" },
  { value: "1000000-3000000", label: "1 000 000 - 3 000 000 GNF" },
  { value: "3000000-5000000", label: "3 000 000 - 5 000 000 GNF" },
  { value: "5000000-10000000", label: "5 000 000 - 10 000 000 GNF" },
  { value: "10000000+", label: "Plus de 10 000 000 GNF" },
]

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<ProfileData>(defaultData)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const loadUserData = () => {
      try {
        const user = AuthService.getCurrentUser()
        //console.log("[v0] Données utilisateur récupérées:", user)

        if (user) {
          setCurrentUser(user)
          setFormData({
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            phone: user.phoneNumber || "",
            dateOfBirth: "",
            address: "",
            city: "",
            postalCode: "",
            country: "Guinée",
            profession: "",
            employer: "",
            monthlyIncome: "",
          })
        }
      } catch (error) {
        console.error("[v0] Erreur lors du chargement des données utilisateur:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [])

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = (): string | null => {
    const required = ["firstName", "lastName", "email", "phone", "address", "city", "country"]

    for (const field of required) {
      if (!formData[field as keyof ProfileData].trim()) {
        return `Le champ ${
          field === "firstName"
            ? "Prénom"
            : field === "lastName"
              ? "Nom"
              : field === "email"
                ? "Email"
                : field === "phone"
                  ? "Téléphone"
                  : field === "address"
                    ? "Adresse"
                    : field === "city"
                      ? "Ville"
                      : field === "country"
                        ? "Pays"
                        : field
        } est obligatoire`
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      return "Format d'email invalide"
    }

    return null
  }

  const handleSave = () => {
    const error = validateForm()
    if (error) {
      setMessage({ type: "error", text: error })
      return
    }

    startTransition(async () => {
      try {
        const result = await updateProfile(formData)
        if (result.success) {
          setMessage({ type: "success", text: result.message })
          setIsEditing(false)
          setTimeout(() => setMessage(null), 5000)
        } else {
          setMessage({ type: "error", text: result.message })
        }
      } catch (error) {
        setMessage({ type: "error", text: "Erreur lors de la sauvegarde. Veuillez réessayer." })
      }
    })
  }

  const handleCancel = () => {
    if (currentUser) {
      setFormData({
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        email: currentUser.email || "",
        phone: currentUser.phoneNumber || "",
        dateOfBirth: "",
        address: "",
        city: "",
        postalCode: "",
        country: "Guinée",
        profession: "",
        employer: "",
        monthlyIncome: "",
      })
    }
    setIsEditing(false)
    setMessage(null)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des informations...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Mon Profil
          </h1>
          <p className="text-muted-foreground text-lg">Gérez vos informations personnelles</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Modifier
          </Button>
        )}
      </div>

      {message && (
        <Alert
          className={`mb-6 ${message.type === "success" ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations Personnelles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informations Personnelles
              </CardTitle>
              <CardDescription>Vos informations de base (* champs obligatoires)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="dateOfBirth">Date de naissance</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50" : ""}
                />
              </div>
            </CardContent>
          </Card>

          {/* Adresse */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Adresse
              </CardTitle>
              <CardDescription>Votre adresse de résidence (* champs obligatoires)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Adresse complète *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50" : ""}
                  placeholder="Quartier, rue, numéro..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">Ville *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Code postal</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange("postalCode", e.target.value)}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="country">Pays *</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => handleInputChange("country", value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className={!isEditing ? "bg-gray-50" : ""}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations Professionnelles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Informations Professionnelles
              </CardTitle>
              <CardDescription>Vos informations professionnelles (optionnel)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="profession">Profession</Label>
                  <Input
                    id="profession"
                    value={formData.profession}
                    onChange={(e) => handleInputChange("profession", e.target.value)}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="employer">Employeur</Label>
                  <Input
                    id="employer"
                    value={formData.employer}
                    onChange={(e) => handleInputChange("employer", e.target.value)}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="monthlyIncome">Revenus mensuels</Label>
                <Select
                  value={formData.monthlyIncome}
                  onValueChange={(value) => handleInputChange("monthlyIncome", value)}
                  disabled={!isEditing}
                >
                  <SelectTrigger className={!isEditing ? "bg-gray-50" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {incomeRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-4">
              <Button onClick={handleSave} disabled={isPending} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isPending}
                className="flex items-center gap-2 bg-transparent"
              >
                <X className="w-4 h-4" />
                Annuler
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statut du compte */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Statut du compte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Compte vérifié</span>
                <Badge
                  variant="default"
                  className={`${currentUser?.emailVerified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {currentUser?.emailVerified ? "Vérifié" : "En attente"}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>ID Utilisateur</span>
                  <span className="font-mono">{currentUser?.id?.slice(0, 8) || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Email</span>
                  <span>{currentUser?.email || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tenant actif</span>
                  <span>{currentUser?.tenants?.[0]?.tenant?.name || "N/A"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                <Shield className="w-4 h-4 mr-2" />
                Sécurité du compte
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                <User className="w-4 h-4 mr-2" />
                Préférences
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
