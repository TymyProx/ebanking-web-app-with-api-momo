"use client"

import type React from "react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, HelpCircle, UserPlus, Lock, Smartphone, MapPin } from "lucide-react"
import AuthService from "@/lib/auth-service"
import { config } from "@/lib/config"
import { storeAuthToken } from "./actions"
import { getAccounts } from "@/app/accounts/actions"

const welcomeMessages = [
  {
    title: "Bienvenue sur votre plateforme bancaire",
    description:
      "Avec une protection de niveau bancaire, nous facilitons les opérations bancaires par Internet de manière sécurisée.",
  },
  {
    title: "Gérez vos comptes en toute simplicité",
    description:
      "Consultez vos soldes, effectuez des virements et payez vos factures en quelques clics depuis n'importe où.",
  },
  {
    title: "Une sécurité maximale pour vos transactions",
    description:
      "Cryptage 256-bit, authentification à deux facteurs et surveillance continue pour protéger votre argent.",
  },
  {
    title: "Services bancaires disponibles 24/7",
    description: "Accédez à tous vos services bancaires à toute heure, tous les jours de l'année, sans interruption.",
  },
]

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const router = useRouter()

  // Carrousel automatique pour les messages de bienvenue
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % welcomeMessages.length)
    }, 5000) // Change toutes les 5 secondes

    return () => clearInterval(interval)
  }, [])

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

        console.log("[v0] Fetched accounts:", accounts)

        const hasActiveAccounts = accounts.some(
          (acc) => acc.status?.toUpperCase() === "ACTIF" || acc.status?.toUpperCase() === "ACTIVE",
        )

        console.log("[v0] Has active accounts:", hasActiveAccounts)

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
    <div className="min-h-screen w-full relative overflow-x-hidden">
      {/* Background avec overlay */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#2d6e3e] via-[#36803e] to-[#2d6e3e]"
          style={{
            backgroundImage: 'url("/images/image2.png")',
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Overlay vert */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#2d6e3e]/95 via-[#36803e]/95 to-[#2d6e3e]/95"></div>
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
        </div>
      </div>

      {/* Container principal avec Grid */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Logo - Position responsive */}
        <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex justify-center lg:justify-start">
              <Image
                src="/images/logowhite.png"
                alt="BNG Logo"
                width={200}
                height={60}
                className="object-contain drop-shadow-lg w-32 sm:w-40 md:w-48 lg:w-[200px] xl:w-[240px] 2xl:w-[260px] h-auto"
                priority
              />
            </div>
          </div>
        </div>

        {/* Main Content Grid - Responsive Layout */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
          <div className="max-w-[1400px] mx-auto">
            {/* Grid Container: 2 colonnes sur desktop, 1 colonne sur mobile */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 xl:gap-12 items-center min-h-[60vh] lg:min-h-[70vh]">
              {/* Zone Gauche: Hero Content */}
              <div className="flex flex-col justify-center space-y-4 sm:space-y-6 text-center xl:text-left order-2 xl:order-1">
                <div className="space-y-3 sm:space-y-4 transition-all duration-700 ease-in-out">
                  <div className="flex items-center justify-center xl:justify-start space-x-2">
                    <span className="text-xs sm:text-sm font-semibold text-[#f4c430] uppercase tracking-wider px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">
                      Astra e-Banking
                    </span>
                  </div>
                  <h1
                    className="font-bold text-white animate-fadeIn drop-shadow-2xl leading-tight"
                    style={{
                      fontSize: "clamp(1.5rem, 4vw + 0.5rem, 3rem)",
                    }}
                  >
                    {welcomeMessages[currentMessageIndex].title}
                  </h1>
                  <p
                    className="text-white/90 animate-fadeIn drop-shadow-lg leading-relaxed max-w-2xl mx-auto xl:mx-0"
                    style={{
                      fontSize: "clamp(0.875rem, 2vw + 0.25rem, 1.125rem)",
                    }}
                  >
                    {welcomeMessages[currentMessageIndex].description}
                  </p>
                </div>
              </div>

              {/* Zone Droite: Login Card */}
              <div className="flex justify-center xl:justify-end order-1 xl:order-2">
                <div className="w-full max-w-[520px] xl:max-w-[560px]">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#2d6e3e]/30 via-[#f4c430]/20 to-[#2d6e3e]/30 rounded-2xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                    <div className="relative bg-white/40 backdrop-blur-2xl rounded-2xl shadow-2xl p-4 sm:p-5 md:p-6 border border-white/20">
                      {/* Decorative corner */}
                      <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-br from-white/15 to-transparent rounded-bl-full"></div>

                      <div className="text-center mb-4 sm:mb-5 relative z-10">
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 drop-shadow-2xl">Connexion</h2>
                      </div>

                      {/* Login Form */}
                      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                        <div className="space-y-2.5 sm:space-y-3">
                          {error && (
                            <div className="p-2.5 rounded-lg bg-[#2d6e3e]/70 border-0 shadow-md">
                              <p className="text-xs text-white text-center font-semibold drop-shadow-md break-words">
                                {error}
                              </p>
                            </div>
                          )}

                          {/* Email/User ID Field */}
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="email"
                              className="text-xs font-semibold text-white/90 flex items-center space-x-1 drop-shadow-lg"
                            >
                              <span>Identifiant / E-mail</span>
                              <span className="text-red-300 drop-shadow-md">*</span>
                            </Label>
                            <div className="relative group">
                              <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="exemple@email.com"
                                className="w-full h-10 sm:h-11 bg-[#2d6e3e]/60 border-0 text-white text-sm placeholder:text-white/60 focus:bg-[#2d6e3e]/70 focus:ring-0 rounded-lg transition-all group-hover:bg-[#2d6e3e]/65 shadow-md"
                                required
                                disabled={isLoading}
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                            </div>
                          </div>

                          {/* Password Field */}
                          <div className="space-y-1.5">
                            <Label
                              htmlFor="password"
                              className="text-xs font-semibold text-white/90 flex items-center space-x-1 drop-shadow-lg"
                            >
                              <span>Mot de passe</span>
                              <span className="text-red-300 drop-shadow-md">*</span>
                            </Label>
                            <div className="relative group">
                              <Input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="w-full h-10 sm:h-11 bg-[#2d6e3e]/60 border-0 text-white text-sm pr-11 placeholder:text-white/60 focus:bg-[#2d6e3e]/70 focus:ring-0 rounded-lg transition-all group-hover:bg-[#2d6e3e]/65 shadow-md"
                                required
                                disabled={isLoading}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                disabled={isLoading}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                            </div>
                          </div>

                          {/* Remember Me */}
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center space-x-2 group">
                              <Checkbox
                                id="remember"
                                checked={rememberMe}
                                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                                disabled={isLoading}
                                className="border-0 bg-[#2d6e3e]/60 data-[state=checked]:bg-white data-[state=checked]:border-0 data-[state=checked]:text-[#2d6e3e] rounded w-4 h-4 shadow-md"
                              />
                              <Label
                                htmlFor="remember"
                                className="text-xs text-white/90 cursor-pointer font-medium group-hover:text-white transition-colors drop-shadow-md"
                              >
                                Se rappeler de moi
                              </Label>
                            </div>
                          </div>

                          {/* Submit Button */}
                          <Button
                            type="submit"
                            className="relative w-full h-10 sm:h-11 bg-gradient-to-r from-[#f4c430] via-[#f8d060] to-[#f4c430] hover:from-[#e0b020] hover:via-[#f4c430] hover:to-[#e0b020] text-gray-900 font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group rounded-lg"
                            disabled={isLoading}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                            {isLoading ? (
                              <div className="flex items-center space-x-2 relative z-10">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-900/30 border-t-gray-900"></div>
                                <span className="text-sm">Connexion en cours...</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center space-x-2 relative z-10">
                                <Lock className="h-4 w-4" />
                                <span className="text-sm">Se connecter</span>
                              </div>
                            )}
                          </Button>
                        </div>

                        {/* Forgot Password & Register Links */}
                        <div className="space-y-2 pt-2 border-t-0">
                          <Button
                            type="button"
                            variant="link"
                            className="w-full text-xs text-white/90 hover:text-white font-medium h-auto py-2 bg-[#2d6e3e]/50 hover:bg-[#2d6e3e]/60 rounded-lg transition-all"
                          >
                            <span className="flex items-center justify-center space-x-1.5 drop-shadow-lg">
                              <span>Mot de passe oublié?</span>
                            </span>
                          </Button>
                          <div className="relative py-1.5">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-white/20"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                              <span className="bg-white/10 backdrop-blur-sm px-3 py-0.5 text-white/80 font-medium rounded-full">
                                ou
                              </span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            className="relative w-full h-10 sm:h-11 bg-gradient-to-r from-[#f4c430] via-[#f8d060] to-[#f4c430] hover:from-[#e0b020] hover:via-[#f4c430] hover:to-[#e0b020] text-gray-900 font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group rounded-lg"
                            onClick={() => router.push("/signup")}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                            <div className="flex items-center justify-center space-x-2 relative z-10">
                              <UserPlus className="h-4 w-4" />
                              <span className="text-sm">Créer un nouveau compte</span>
                            </div>
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Information Cards - Bottom Section */}
        <div className="px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
          <div className="max-w-[1400px] mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {/* Card 1: Nous Trouver */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2d6e3e]/10 to-transparent rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/75 backdrop-blur-xl rounded-xl shadow-lg p-3 sm:p-4 hover:shadow-xl hover:-translate-y-1 hover:bg-white/85 transition-all duration-300 border border-white/40 overflow-hidden">
                  {/* Decorative element */}
                  <div className="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-[#2d6e3e]/10 to-transparent rounded-bl-full"></div>

                  <div className="flex items-center space-x-3 relative z-10">
                    <div className="relative flex-shrink-0">
                      <div className="p-2 sm:p-2.5 bg-gradient-to-br from-[#2d6e3e]/10 to-[#2d6e3e]/5 rounded-xl">
                        <MapPin className="h-4 sm:h-5 w-4 sm:w-5 text-[#2d6e3e]" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-xs sm:text-sm drop-shadow-sm">Nous Trouver</h3>
                      <p className="text-xs text-gray-700 font-medium mt-0.5 drop-shadow-sm">
                        Notre équipe est à votre disposition
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Application Mobile */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#f4c430]/10 to-transparent rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/75 backdrop-blur-xl rounded-xl shadow-lg p-3 sm:p-4 hover:shadow-xl hover:-translate-y-1 hover:bg-white/85 transition-all duration-300 border border-white/40 overflow-hidden">
                  {/* Decorative element */}
                  <div className="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-[#f4c430]/10 to-transparent rounded-bl-full"></div>

                  <div className="flex items-center space-x-3 relative z-10">
                    <div className="relative flex-shrink-0">
                      <div className="p-2 sm:p-2.5 bg-gradient-to-br from-[#f4c430]/10 to-[#f4c430]/5 rounded-xl">
                        <Smartphone className="h-4 sm:h-5 w-4 sm:w-5 text-[#f4c430]" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-xs sm:text-sm drop-shadow-sm">Application Mobile</h3>
                      <p className="text-xs text-gray-700 font-medium mt-0.5 drop-shadow-sm">Banking en mobilité 24/7</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Support Client */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2d6e3e]/10 to-transparent rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/75 backdrop-blur-xl rounded-xl shadow-lg p-3 sm:p-4 hover:shadow-xl hover:-translate-y-1 hover:bg-white/85 transition-all duration-300 border border-white/40 overflow-hidden">
                  {/* Decorative element */}
                  <div className="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-[#2d6e3e]/10 to-transparent rounded-bl-full"></div>

                  <div className="flex items-center space-x-3 relative z-10">
                    <div className="relative flex-shrink-0">
                      <div className="p-2 sm:p-2.5 bg-gradient-to-br from-[#2d6e3e]/10 to-[#2d6e3e]/5 rounded-xl">
                        <HelpCircle className="h-4 sm:h-5 w-4 sm:w-5 text-[#2d6e3e]" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-xs sm:text-sm drop-shadow-sm">Support Client</h3>
                      <p className="text-xs text-gray-700 font-medium mt-0.5 drop-shadow-sm">
                        Assistance disponible 24/7
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
