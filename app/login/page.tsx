"use client"

import type React from "react"
import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Shield, Lock, CreditCard, Smartphone, AlertCircle } from "lucide-react"
import AuthService from "@/lib/auth-service"
import { config } from "@/lib/config"
import { storeAuthToken } from "./actions"
import { getAccounts } from "@/app/accounts/actions"

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

      const tenantId = config.TENANT_ID
      const invitationToken = ""

      const loginResult = await AuthService.signIn(email, password, tenantId, invitationToken)

      if (loginResult.success) {
        const userData = await AuthService.fetchMe()

        await storeAuthToken(loginResult.token, userData)

        if (rememberMe) {
          localStorage.setItem("rememberMe", "true")
        }

        const accounts = await getAccounts()

        const hasActiveAccounts = accounts.some(
          (acc) => acc.status?.toUpperCase() === "ACTIF" || acc.status?.toUpperCase() === "ACTIVE",
        )

        if (hasActiveAccounts) {
          router.push("/dashboard")
        } else {
          router.push("/accounts/new")
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#1e4620] via-[#2d6b31] to-[#1e4620]">
      {/* Left Panel - Branding & Information */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#f4c430]/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between w-full p-12">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <div className="group flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md transition-all duration-300 hover:bg-white/20 hover:scale-105">
              <Image
                src="/images/logowhite.png"
                alt="BNG Logo"
                width={80}
                height={80}
                className="object-contain scale-110"
                priority
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">BNG E-Banking</h2>
              <p className="text-sm text-white/70">Votre banque en ligne</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl font-bold text-white leading-tight mb-4">Toutes vos opérations bancaires</h1>
              <p className="text-xl text-white/90 font-medium">à partir d'une connexion sécurisée unique</p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 pt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/15 transition-all">
                <div className="w-10 h-10 bg-[#f4c430] rounded-lg flex items-center justify-center mb-3">
                  <Shield className="w-5 h-5 text-gray-900" />
                </div>
                <h3 className="text-white font-semibold mb-1">Sécurité Maximale</h3>
                <p className="text-white/70 text-sm">Protocole bancaire certifié</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/15 transition-all">
                <div className="w-10 h-10 bg-[#f4c430] rounded-lg flex items-center justify-center mb-3">
                  <CreditCard className="w-5 h-5 text-gray-900" />
                </div>
                <h3 className="text-white font-semibold mb-1">Gestion Complète</h3>
                <p className="text-white/70 text-sm">Tous vos comptes en un lieu</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/15 transition-all">
                <div className="w-10 h-10 bg-[#f4c430] rounded-lg flex items-center justify-center mb-3">
                  <Smartphone className="w-5 h-5 text-gray-900" />
                </div>
                <h3 className="text-white font-semibold mb-1">Accès 24/7</h3>
                <p className="text-white/70 text-sm">Disponible à tout moment</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/15 transition-all">
                <div className="w-10 h-10 bg-[#f4c430] rounded-lg flex items-center justify-center mb-3">
                  <Lock className="w-5 h-5 text-gray-900" />
                </div>
                <h3 className="text-white font-semibold mb-1">Données Protégées</h3>
                <p className="text-white/70 text-sm">Cryptage de bout en bout</p>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <p className="text-sm text-white/90">
              <strong className="text-white">Conseil de sécurité:</strong> Ne divulguez jamais vos identifiants
              bancaires. Nos agents ne vous demanderont jamais votre mot de passe.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image src="/images/logowhite.png" alt="BNG Logo" width={120} height={40} className="object-contain" />
          </div>

          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Connexion</h1>
            <p className="text-gray-600">Accédez à votre espace bancaire sécurisé</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Erreur de connexion</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                Identifiant utilisateur
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Entrez votre adresse e-mail"
                className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#2d6b31] focus:ring-[#2d6b31]"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">Format: votre@email.com</p>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                Mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Entrez votre mot de passe"
                  className="h-12 bg-white border-gray-300 text-gray-900 pr-12 placeholder:text-gray-400 focus:border-[#2d6b31] focus:ring-[#2d6b31]"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isLoading}
                  className="border-gray-300 data-[state=checked]:bg-[#2d6b31] data-[state=checked]:border-[#2d6b31]"
                />
                <Label htmlFor="remember" className="text-sm text-gray-700 cursor-pointer font-normal">
                  Mémoriser l'identifiant
                </Label>
              </div>
              <Button
                type="button"
                variant="link"
                className="text-sm text-[#2d6b31] hover:text-[#1e4620] font-medium h-auto p-0"
              >
                Mot de passe oublié?
              </Button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-[#2d6b31] hover:bg-[#1e4620] text-white font-semibold text-base shadow-md hover:shadow-lg transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                  <span>Connexion en cours...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Lock className="w-5 h-5" />
                  <span>SE CONNECTER</span>
                </div>
              )}
            </Button>

            {/* Additional Links */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <Button
                  type="button"
                  variant="link"
                  className="text-[#2d6b31] hover:text-[#1e4620] font-medium h-auto p-0"
                >
                  ID utilisateur oublié?
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="text-[#2d6b31] hover:text-[#1e4620] font-medium h-auto p-0"
                >
                  Inscription instantanée
                </Button>
              </div>
            </div>
          </form>

          {/* Help Section */}
          <div className="pt-6 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Besoin d'aide?</h3>
              <p className="text-sm text-gray-600">
                Notre service d'assistance est disponible 24/7 au{" "}
                <span className="font-semibold text-[#2d6b31]">+225 XX XX XX XX XX</span>
              </p>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Nouvel utilisateur?{" "}
                <Button variant="link" className="text-[#2d6b31] font-medium h-auto p-0 text-xs">
                  Ouvrir un compte
                </Button>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-gray-200">
            <p className="text-xs text-center text-gray-500">
              © 2026 BNG. Tous droits réservés. | <button className="hover:underline">Confidentialité</button> |{" "}
              <button className="hover:underline">Conditions</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
