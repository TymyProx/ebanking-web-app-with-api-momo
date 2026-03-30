"use client"

import type React from "react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Eye,
  EyeOff,
  HelpCircle,
  UserPlus,
  Lock,
  Smartphone,
  MapPin,
  CreditCard,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import AuthService from "@/lib/auth-service"
import { config } from "@/lib/config"
import { storeAuthToken } from "./actions"
import { getAccounts } from "@/app/accounts/actions"
import { isAccountActive } from "@/lib/status-utils"
import Link from "next/link"
import { dispatchAuthSessionChanged } from "@/lib/auth-events"

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
        dispatchAuthSessionChanged()

        if (rememberMe) {
          localStorage.setItem("rememberMe", "true")
        }

        const accounts = await getAccounts()

        console.log("[v0] Fetched accounts:", accounts)

        // Utiliser la fonction normalisée pour vérifier les comptes actifs
        const hasActiveAccounts = accounts.some((acc) => isAccountActive(acc.status))

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
    <div className="min-h-screen lg:h-screen relative overflow-x-hidden overflow-y-auto lg:overflow-hidden">
      {/* Logo - taille proportionnelle */}
      <div className="absolute top-4 sm:top-4 lg:top-[2vw] left-1/2 -translate-x-1/2 lg:left-[2vw] lg:translate-x-0 z-50">
        <Image
          src="/images/logowhite.png"
          alt="BNG Logo"
          width={160}
          height={48}
          className="object-contain drop-shadow-lg w-32 sm:w-36 lg:w-[12vw] lg:min-w-[180px] lg:max-w-[260px]"
          priority
        />
      </div>

      {/* Full Screen Background Hero */}
      <div className="absolute lg:fixed inset-0 z-0 min-h-screen lg:min-h-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2d6e3e] via-[#36803e] to-[#2d6e3e]">
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>

          {/* Banking illustration - ~50% viewport pour une bonne visibilité */}
          <div className="hidden lg:block absolute bottom-0 left-[55%] -translate-x-1/2 w-[60vw] min-w-[500px] max-w-[1500px] opacity-100">
            <Image
              src="/images/image2.png"
              alt="Banking"
              width={800}
              height={600}
              className="w-full h-auto object-contain"
              priority
              sizes="(max-width: 1024px) 0vw, 90vw"
            />
          </div>


          {/* Badge fixe — un peu plus haut sur mobile pour aérer le carrousel en dessous */}
          <div className="absolute top-24 sm:top-28 lg:top-[28%] left-5 right-5 sm:left-6 sm:right-6 lg:left-[2vw] lg:right-auto lg:max-w-[28%] px-0 z-10">
            <span className="text-xs sm:text-sm lg:text-[clamp(0.75rem,0.9vw,1rem)] font-semibold text-[#f4c430] uppercase tracking-wider px-3 py-1 lg:px-[0.8vw] lg:py-[0.3vw] bg-white/10 backdrop-blur-sm rounded-full inline-block">
              BNG CONNECT
            </span>
          </div>

          {/* Bloc carousel texte — plus bas sur mobile/tablette pour aérer sous le badge */}
          <div className="absolute top-40 sm:top-44 lg:top-[56%] lg:-translate-y-1/2 left-5 right-5 sm:left-6 sm:right-6 lg:left-[2vw] lg:right-auto lg:max-w-[28%] px-0">
            <div className="text-left text-white space-y-2 sm:space-y-3 lg:space-y-[1vw] transition-all duration-700 ease-in-out">
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-[2.2vw] lg:min-w-[16px] lg:leading-tight font-bold animate-fadeIn drop-shadow-2xl leading-snug sm:leading-tight pr-1">
                {welcomeMessages[currentMessageIndex].title}
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-[clamp(0.875rem,1.1vw,1.25rem)] text-white/90 animate-fadeIn drop-shadow-lg leading-relaxed pr-1">
                {welcomeMessages[currentMessageIndex].description}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="w-full px-5 pt-64 pb-10 min-[400px]:px-6 sm:px-6 sm:pt-72 sm:pb-8 md:pt-80 lg:px-[2vw] lg:pt-[2vw] lg:pb-[1.5vw] relative z-10 min-h-screen lg:h-screen flex flex-col justify-between [padding-left:max(1.25rem,env(safe-area-inset-left))] [padding-right:max(1.25rem,env(safe-area-inset-right))]">
        {/* Login Form - Top Right */}
        <div className="w-full max-w-full mb-0 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-4 lg:gap-[1.5vw]">
            <div className="sm:col-start-3 flex justify-center sm:justify-end mt-6 sm:mt-0 w-full min-w-0">
              <div className="relative group w-full max-w-md sm:max-w-[85%] lg:max-w-[28vw] lg:min-w-[360px] mx-auto sm:mx-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2d6e3e]/30 via-[#f4c430]/20 to-[#2d6e3e]/30 rounded-2xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity pointer-events-none"></div>
                <div className="relative bg-white/40 backdrop-blur-2xl rounded-2xl shadow-2xl px-5 py-6 sm:p-5 lg:p-[1.6vw] border border-white/20">
                  {/* Decorative corner */}
                  <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-br from-white/15 to-transparent rounded-bl-full"></div>

                  <>
                      <div className="text-center mb-3 sm:mb-3 lg:mb-[1vw] relative z-10">
                        <h2 className="text-lg sm:text-xl lg:text-[clamp(1.1rem,1.4vw,1.5rem)] font-bold text-white mb-0.5 drop-shadow-2xl">Connexion</h2>
                      </div>

                      {/* Login Form */}
                      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3 lg:space-y-[0.8vw]">
                    <div className="space-y-3 sm:space-y-2.5 lg:space-y-[0.8vw]">
                      {error && (
                        <div className="p-2.5 rounded-lg bg-[#2d6e3e]/70 border-0 shadow-md">
                          <p className="text-xs text-white text-center font-semibold drop-shadow-md">{error}</p>
                        </div>
                      )}

                      {/* Email/User ID Field */}
                      <div className="space-y-1">
                        <Label
                          htmlFor="email"
                          className="text-xs lg:text-[clamp(0.75rem,0.85vw,0.95rem)] font-semibold text-white/90 flex items-center space-x-1 drop-shadow-lg"
                        >
                          <span>Identifiant / E-mail</span>
                          <span className="text-red-300 drop-shadow-md">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="exemple@email.com"
                            className="h-9 sm:h-10 lg:h-[clamp(2.5rem,3vw,3.25rem)] bg-[#2d6e3e]/60 border-0 text-white text-sm lg:text-[clamp(0.8rem,0.9vw,1rem)] placeholder:text-white/60 focus:bg-[#2d6e3e]/60 focus:ring-0 rounded-lg transition-all hover:bg-[#2d6e3e]/60 shadow-md"
                            required
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      {/* Password Field */}
                      <div className="space-y-1">
                        <Label
                          htmlFor="password"
                          className="text-xs lg:text-[clamp(0.75rem,0.85vw,0.95rem)] font-semibold text-white/90 flex items-center space-x-1 drop-shadow-lg"
                        >
                          <span>Mot de passe</span>
                          <span className="text-red-300 drop-shadow-md">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="h-9 sm:h-10 lg:h-[clamp(2.5rem,3vw,3.25rem)] lg:pr-12 bg-[#2d6e3e]/60 border-0 text-white text-sm lg:text-[clamp(0.8rem,0.9vw,1rem)] pr-11 placeholder:text-white/60 focus:bg-[#2d6e3e]/60 focus:ring-0 rounded-lg transition-all hover:bg-[#2d6e3e]/60 shadow-md"
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
                        </div>
                        <div className="pt-1 text-right">
                          <Link href="/auth/forgot-password" className="text-xs text-white/80 hover:text-white font-semibold">
                            Mot de passe oublié ?
                          </Link>
                        </div>
                      </div>

                      {/* Remember Me */}
                      {/* <div className="flex items-center justify-between pt-0.5">
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
                      </div> */}

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        className="relative w-full h-10 sm:h-11 lg:h-[clamp(2.75rem,3.2vw,3.5rem)] bg-gradient-to-r from-[#f4c430] via-[#f8d060] to-[#f4c430] hover:from-[#e0b020] hover:via-[#f4c430] hover:to-[#e0b020] text-gray-900 font-semibold text-sm lg:text-[clamp(0.85rem,1vw,1.1rem)] shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group rounded-lg"
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

                      {/* Séparateur + accès portail (cartes modernes) */}
                      <div className="relative my-6 sm:my-4 lg:my-[0.85vw]">
                        <div className="absolute inset-0 flex items-center" aria-hidden>
                          <div className="w-full border-t border-white/20" />
                        </div>
                        <div className="relative flex justify-center px-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/75 backdrop-blur-sm">
                            Inscription
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3 sm:space-y-2.5">
                        <button
                          type="button"
                          onClick={() => router.push("/signup?flow=existing")}
                          className="group relative w-full overflow-hidden rounded-xl border border-[#2d6e3e]/50 bg-gradient-to-br from-[#2d6e3e]/55 via-[#2d6e3e]/35 to-[#1a4d2a]/40 px-4 py-3.5 text-left shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-md transition-all duration-300 hover:border-[#4a9d5e]/70 hover:shadow-[0_12px_40px_rgba(45,110,62,0.35)] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:translate-y-0 active:scale-[0.99] sm:p-3.5"
                        >
                          <div className="relative flex items-start gap-3">
                            <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white shadow-inner ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-105 group-hover:bg-white/20">
                              <CreditCard className="h-5 w-5" strokeWidth={2} />
                            </div>
                            <div className="min-w-0 flex-1 pt-0.5">
                              <p className="text-sm font-bold tracking-tight text-white drop-shadow-md">
                                Déjà client BNG ?
                              </p>
                              <p className="mt-0.5 text-[11px] leading-snug text-white/80 sm:text-xs">
                               Souscrivez à E-banking.
                              </p>
                            </div>
                            <ChevronRight
                              className="mt-2 h-5 w-5 shrink-0 text-white/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-white"
                              strokeWidth={2.5}
                              aria-hidden
                            />
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => router.push("/signup?flow=new")}
                          className="group relative w-full overflow-hidden rounded-xl border border-[#2d6e3e]/50 bg-gradient-to-br from-[#2d6e3e]/55 via-[#2d6e3e]/35 to-[#1a4d2a]/40 px-4 py-3.5 text-left shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-md transition-all duration-300 hover:border-[#4a9d5e]/70 hover:shadow-[0_12px_40px_rgba(45,110,62,0.35)] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:translate-y-0 active:scale-[0.99] sm:p-3.5"
                        >
                          <div className="relative flex items-start gap-3">
                            <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white shadow-inner ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-105 group-hover:bg-white/20">
                              <UserPlus className="h-5 w-5" strokeWidth={2} />
                            </div>
                            <div className="min-w-0 flex-1 pt-0.5">
                              <p className="text-sm font-bold tracking-tight text-white drop-shadow-md">
                                Nouveau client ?
                              </p>
                              <p className="mt-0.5 text-[11px] leading-snug text-white/85 sm:text-xs">
                                Demande d'ouverture de compte.
                              </p>
                            </div>
                            <ChevronRight
                              className="mt-2 h-5 w-5 shrink-0 text-white/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-white"
                              strokeWidth={2.5}
                              aria-hidden
                            />
                          </div>
                        </button>
                      </div>
                    </div>
                  </form>
                  </>
                </div>
              </div>
            </div>
          </div>
        </div>

         {/* Information Cards - proportions et marges cohérentes */}
         <div className="w-full max-w-full mt-4 sm:-mt-3 mb-8 sm:mb-5 md:mb-6 lg:mb-[1.5vw]">
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-4 lg:gap-[1.5vw] max-w-md mx-auto sm:max-w-none sm:mx-0">
            {/* Nous trouver → /agences (hors connexion : sans sidebar, voir ConditionalLayout) */}
            <Link
              href="/agences"
              className="group relative block cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d6e3e] focus-visible:ring-offset-2"
              aria-label="Voir nos agences"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#2d6e3e]/10 to-transparent rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-white/75 backdrop-blur-xl rounded-xl shadow-lg px-4 py-3.5 sm:p-4 lg:p-[1.2vw] hover:shadow-xl hover:-translate-y-1 hover:bg-white/85 transition-all duration-300 border border-white/40 overflow-hidden">
                {/* Decorative element */}
                <div className="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-[#2d6e3e]/10 to-transparent rounded-bl-full"></div>

                <div className="flex items-center gap-3 relative z-10">
                  <div className="relative flex-shrink-0">
                    <div className="p-2 sm:p-2.5 bg-gradient-to-br from-[#2d6e3e]/10 to-[#2d6e3e]/5 rounded-xl">
                      <MapPin className="h-4 sm:h-5 w-4 sm:w-5 text-[#2d6e3e]" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm lg:text-[clamp(0.75rem,0.9vw,1rem)] drop-shadow-sm">Nous Trouver</h3>
                    <p className="text-xs lg:text-[clamp(0.65rem,0.75vw,0.9rem)] text-gray-700 font-medium mt-0.5 drop-shadow-sm">
                      Notre équipe est à votre disposition
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Mobile Banking */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#f4c430]/10 to-transparent rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-white/75 backdrop-blur-xl rounded-xl shadow-lg px-4 py-3.5 sm:p-4 lg:p-[1.2vw] hover:shadow-xl hover:-translate-y-1 hover:bg-white/85 transition-all duration-300 border border-white/40 overflow-hidden">
                {/* Decorative element */}
                <div className="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-[#f4c430]/10 to-transparent rounded-bl-full"></div>

                <div className="flex items-center gap-3 relative z-10">
                  <div className="relative flex-shrink-0">
                    <div className="p-2 sm:p-2.5 bg-gradient-to-br from-[#f4c430]/10 to-[#f4c430]/5 rounded-xl">
                      <Smartphone className="h-4 sm:h-5 w-4 sm:w-5 text-[#f4c430]" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm lg:text-[clamp(0.75rem,0.9vw,1rem)] drop-shadow-sm">Application Mobile</h3>
                    <p className="text-xs lg:text-[clamp(0.65rem,0.75vw,0.9rem)] text-gray-700 font-medium mt-0.5 drop-shadow-sm">Banking en mobilité 24/7</p>
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/support"
              className="group relative block cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d6e3e] focus-visible:ring-offset-2"
              aria-label="Support client — contact et assistance"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#2d6e3e]/10 to-transparent rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-white/75 backdrop-blur-xl rounded-xl shadow-lg px-4 py-3.5 sm:p-4 lg:p-[1.2vw] hover:shadow-xl hover:-translate-y-1 hover:bg-white/85 transition-all duration-300 border border-white/40 overflow-hidden">
                <div className="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-[#2d6e3e]/10 to-transparent rounded-bl-full"></div>

                <div className="flex items-center gap-3 relative z-10">
                  <div className="relative flex-shrink-0">
                    <div className="p-2 sm:p-2.5 bg-gradient-to-br from-[#2d6e3e]/10 to-[#2d6e3e]/5 rounded-xl">
                      <HelpCircle className="h-4 sm:h-5 w-4 sm:w-5 text-[#2d6e3e]" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm lg:text-[clamp(0.75rem,0.9vw,1rem)] drop-shadow-sm">Support Client</h3>
                    <p className="text-xs lg:text-[clamp(0.65rem,0.75vw,0.9rem)] text-gray-700 font-medium mt-0.5 drop-shadow-sm">
                      Assistance disponible 24/7
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
