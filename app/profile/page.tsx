"use client"

import { useState, useTransition, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, MapPin, CheckCircle, AlertCircle, Lock } from "lucide-react"
import { getUserProfileData } from "./actions"
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
  codeClient: string
  nomComplet: string
  clientType: string
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
  codeClient: "",
  nomComplet: "",
  clientType: "",
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
  const [formData, setFormData] = useState<ProfileData>(defaultData)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [pwd, setPwd] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" })
  const [pwdMessage, setPwdMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = AuthService.getCurrentUser()

        if (user) {
          setCurrentUser(user)
        }

        const result = await getUserProfileData()

        if (result.success && result.data) {
          setFormData(result.data)
        } else {
          if (user) {
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
              codeClient: "",
              nomComplet: "",
              clientType: "",
            })
          }
        }
      } catch (error) {
        console.error("[v0] Erreur lors du chargement des données utilisateur:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [])

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
          <h1 className="text-3xl font-bold text-primary">Mon Profil</h1>
          <p className="text-sm text-muted-foreground">Gérez vos informations personnelles</p>
        </div>
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

      <div className="space-y-6">
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
              {formData.codeClient && (
                <div>
                  <Label htmlFor="codeClient">Code Client</Label>
                  <Input id="codeClient" value={formData.codeClient} disabled className="bg-gray-50" />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input id="firstName" value={formData.firstName} disabled className="bg-gray-50" />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input id="lastName" value={formData.lastName} disabled className="bg-gray-50" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" value={formData.email} disabled className="bg-gray-50" />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input id="phone" value={formData.phone} disabled className="bg-gray-50" />
                </div>
              </div>

              <div>
                <Label htmlFor="dateOfBirth">Date de naissance</Label>
                <Input id="dateOfBirth" type="date" value={formData.dateOfBirth} disabled className="bg-gray-50" />
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
                  disabled
                  className="bg-gray-50"
                  placeholder="Quartier, rue, numéro..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">Ville *</Label>
                  <Input id="city" value={formData.city} disabled className="bg-gray-50" />
                </div>
                <div>
                  <Label htmlFor="postalCode">Code postal</Label>
                  <Input id="postalCode" value={formData.postalCode} disabled className="bg-gray-50" />
                </div>
                <div>
                  <Label htmlFor="country">Pays *</Label>
                  <Select value={formData.country} disabled>
                    <SelectTrigger className="bg-gray-50">
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

          {/* Sécurité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Sécurité
              </CardTitle>
              <CardDescription>Changez votre mot de passe</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pwdMessage && (
                <Alert className={pwdMessage.type === "success" ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}>
                  {pwdMessage.type === "success" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={pwdMessage.type === "success" ? "text-green-800" : "text-red-800"}>
                    {pwdMessage.text}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="oldPassword">Mot de passe actuel</Label>
                  <Input
                    id="oldPassword"
                    type="password"
                    value={pwd.oldPassword}
                    onChange={(e) => setPwd((p) => ({ ...p, oldPassword: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={pwd.newPassword}
                    onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirmer</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={pwd.confirmPassword}
                    onChange={(e) => setPwd((p) => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  className="bg-[#34763E] hover:bg-[#2a5f32]"
                  disabled={
                    isPending ||
                    !pwd.oldPassword ||
                    !pwd.newPassword ||
                    pwd.newPassword !== pwd.confirmPassword
                  }
                  onClick={() => {
                    setPwdMessage(null)
                    startTransition(async () => {
                      try {
                        if (pwd.oldPassword === pwd.newPassword) {
                          setPwdMessage({ type: "error", text: "Le nouveau mot de passe doit être différent de l’ancien." })
                          return
                        }
                        await AuthService.changePassword(pwd.oldPassword, pwd.newPassword)
                        setPwdMessage({ type: "success", text: "Mot de passe modifié avec succès." })
                        setPwd({ oldPassword: "", newPassword: "", confirmPassword: "" })
                      } catch (e: any) {
                        const raw = String(e?.message || "")
                        const status = e?.status
                        const isInvalidOld = /old password is invalid/i.test(raw)
                        const isWeak = /weak|too weak/i.test(raw)

                        if (status === 401) {
                          setPwdMessage({ type: "error", text: "Session expirée. Veuillez vous reconnecter." })
                          return
                        }
                        if (isInvalidOld) {
                          setPwdMessage({ type: "error", text: "Mot de passe actuel incorrect." })
                          return
                        }
                        if (isWeak) {
                          setPwdMessage({ type: "error", text: "Le nouveau mot de passe est trop faible." })
                          return
                        }

                        setPwdMessage({
                          type: "error",
                          text: raw || "Erreur lors du changement de mot de passe.",
                        })
                      }
                    })
                  }}
                >
                  {isPending ? "Modification..." : "Modifier le mot de passe"}
                </Button>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  )
}





