"use client"

import type React from "react"
import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react"
import AuthService from "@/lib/auth-service"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const formData = new FormData(e.target as HTMLFormElement)
      const email = formData.get("email") as string
      const password = formData.get("password") as string

      const tenantId = "aa1287f6-06af-45b7-a905-8c57363565c2"
      const invitationToken = ""

      const loginResult = await AuthService.signIn(email, password, tenantId, invitationToken)
      console.log("Résultat de la connexion:", loginResult)
      if (loginResult.success) {
        await AuthService.fetchMe()

        if (rememberMe) {
          localStorage.setItem("rememberMe", "true")
        }

        // Redirection vers le dashboard
        router.push("/")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo et titre */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-white p-3 rounded-2xl shadow-lg">
              <Image src="/images/logo-bng.png" alt="BNG Logo" width={64} height={64} className="object-contain" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">BNG eBanking</h1>
            <p className="text-gray-600 mt-2">Banque Nationale de Guinée</p>
          </div>
        </div>

        {/* Formulaire de connexion */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center">Connexion</CardTitle>
            <CardDescription className="text-center">Accédez à votre espace bancaire sécurisé</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="votre@email.com"
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Votre mot de passe"
                    className="pl-10 pr-10"
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="remember" className="text-sm text-gray-600">
                    Se souvenir de moi
                  </Label>
                </div>
                <Button variant="link" className="px-0 text-sm text-blue-600 hover:text-blue-800">
                  Mot de passe oublié ?
                </Button>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Connexion en cours...</span>
                  </div>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Informations supplémentaires */}
        <div className="text-center space-y-4">
          <div className="text-sm text-gray-600">
            <p>Première connexion ?</p>
            <Button variant="link" className="text-blue-600 hover:text-blue-800 p-0">
              Contactez votre conseiller
            </Button>
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-gray-500">Connexion sécurisée SSL 256 bits</p>
            <div className="flex justify-center items-center space-x-4 mt-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-500">Serveurs opérationnels</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
