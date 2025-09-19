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
import { Eye, EyeOff, Lock, Mail, AlertCircle, Shield, Sparkles } from "lucide-react"
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
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10 fade-in">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-white/95 backdrop-blur-sm p-4 rounded-3xl shadow-2xl border border-white/20">
              <Image src="/images/logo-bng.png" alt="BNG Logo" width={200} height={200} className="object-contain" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold gradient-text">Bienvenue</h1>
            <p className="text-white/80 text-lg">Votre banque digitale nouvelle génération</p>
          </div>
        </div>

        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm card-hover">
          <CardHeader className="space-y-2 pb-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-2xl font-bold gradient-text">Connexion Sécurisée</CardTitle>
              <Sparkles className="h-5 w-5 text-secondary" />
            </div>
            <CardDescription className="text-muted-foreground">
              Accédez à votre espace bancaire personnel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Adresse email
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="votre@email.com"
                    className="pl-12 h-12 bg-input/50 border-border/50 focus:border-primary/50 focus:bg-background transition-all duration-200"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Mot de passe
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Votre mot de passe"
                    className="pl-12 pr-12 h-12 bg-input/50 border-border/50 focus:border-primary/50 focus:bg-background transition-all duration-200"
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/50"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    disabled={isLoading}
                    className="border-border/50"
                  />
                  <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                    Se souvenir de moi
                  </Label>
                </div>
                <Button variant="link" className="px-0 text-sm text-accent hover:text-accent/80 font-medium">
                  Mot de passe oublié ?
                </Button>
              </div>

              <Button
                type="submit"
                className="w-full h-12 btn-gradient text-white font-semibold text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                    <span>Connexion en cours...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Se connecter</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center space-y-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <p className="text-white/90 text-sm mb-2">Première connexion ?</p>
            <Button variant="link" className="text-white hover:text-white/80 p-0 font-medium">
              Contactez votre conseiller
            </Button>
          </div>

          <div className="flex flex-col items-center space-y-3">
            <div className="flex items-center space-x-2 text-white/70">
              <Shield className="h-4 w-4" />
              <span className="text-sm">Connexion sécurisée SSL 256 bits</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-white/60">Serveurs opérationnels</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
