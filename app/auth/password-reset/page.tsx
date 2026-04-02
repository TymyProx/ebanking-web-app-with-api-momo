"use client"

import { useMemo, useState, useEffect } from "react"
import type React from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff, MapPin, HelpCircle } from "lucide-react"
import AuthService from "@/lib/auth-service"
import { AuthFeaturesInfoCard } from "@/components/auth/auth-features-info-card"
import { validatePassword } from "@/lib/password-validation"

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

export default function PasswordResetPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  const passwordErrors = useMemo(() => {
    if (!password) return []
    return validatePassword(password).errors
  }, [password])

  const canSubmit = useMemo(() => {
    const v = validatePassword(password)
    return token && v.isValid && password === confirmPassword && !isLoading
  }, [token, password, confirmPassword, isLoading])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % welcomeMessages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!token) {
      setMessage({ type: "error", text: "Token manquant ou invalide." })
      return
    }

    const v = validatePassword(password)
    if (!v.isValid) {
      setMessage({ type: "error", text: v.errors.join(", ") })
      return
    }
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Les mots de passe ne correspondent pas." })
      return
    }

    setIsLoading(true)
    try {
      await AuthService.passwordReset(token, password)
      setMessage({ type: "success", text: "Mot de passe réinitialisé. Vous pouvez vous connecter." })
      setTimeout(() => router.push("/login"), 800)
    } catch (err: unknown) {
      const error = err as { message?: string }
      setMessage({ type: "error", text: error?.message || "Erreur lors de la réinitialisation." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen lg:h-screen relative overflow-x-hidden overflow-y-auto lg:overflow-hidden">
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
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />

          {/* Banking illustration — même bloc que /login */}
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

          {/* Badge fixe — aligné /login (mobile) */}
          <div className="absolute top-24 sm:top-28 lg:top-[28%] left-5 right-5 sm:left-6 sm:right-6 lg:left-[2vw] lg:right-auto lg:max-w-[28%] px-0 z-10">
            <span className="text-lg sm:text-[1.35rem] md:text-[1.6rem] lg:text-[1.8vw] font-semibold text-[#f4c430] uppercase tracking-wider px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 lg:px-[1vw] lg:py-[0.5vw] bg-white/10 backdrop-blur-sm rounded-full inline-block">
              BNG CONNECT
            </span>
          </div>

          {/* Bloc carousel texte — aligné /login */}
          <div className="absolute top-40 sm:top-44 lg:top-[56%] lg:-translate-y-1/2 left-5 right-5 sm:left-6 sm:right-6 lg:left-[2vw] lg:right-auto lg:max-w-[28%] px-0">
            <div className="text-left text-white space-y-2 sm:space-y-3 lg:space-y-[1vw] transition-all duration-700 ease-in-out">
              <h1 className="text-2xl sm:text-[1.95rem] md:text-[2.35rem] lg:text-[2.6vw] lg:min-w-[16px] lg:leading-tight font-bold animate-fadeIn drop-shadow-2xl leading-snug sm:leading-tight pr-1">
                {welcomeMessages[currentMessageIndex].title}
              </h1>
              <p className="text-lg sm:text-xl md:text-[1.4rem] lg:text-[clamp(1.1rem,1.35vw,1.55rem)] text-white/90 animate-fadeIn drop-shadow-lg leading-relaxed pr-1">
                {welcomeMessages[currentMessageIndex].description}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="w-full px-5 pt-64 pb-10 min-[400px]:px-6 sm:px-6 sm:pt-72 sm:pb-8 md:pt-80 lg:px-[2vw] lg:pt-[2vw] lg:pb-[1.5vw] relative z-10 min-h-screen lg:h-screen flex flex-col justify-between [padding-left:max(1.25rem,env(safe-area-inset-left))] [padding-right:max(1.25rem,env(safe-area-inset-right))]">
        {/* Form - Top Right */}
        <div className="w-full max-w-full mb-0 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-4 lg:gap-[1.5vw]">
            <div className="sm:col-start-3 flex justify-center sm:justify-end mt-6 sm:mt-0 w-full min-w-0">
              <div className="relative group w-full max-w-md sm:max-w-[85%] lg:max-w-[28vw] lg:min-w-[360px] mx-auto sm:mx-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2d6e3e]/30 via-[#f4c430]/20 to-[#2d6e3e]/30 rounded-2xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity pointer-events-none" />
                <div className="relative bg-white/40 backdrop-blur-2xl rounded-2xl shadow-2xl px-5 py-6 sm:p-5 lg:p-[1.6vw] border border-white/20">
                  <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-br from-white/15 to-transparent rounded-bl-full" />

                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="text-xs text-white/90 hover:text-white flex items-center space-x-1 font-medium mb-3 sm:mb-4"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    <span>Retour à la connexion</span>
                  </button>

                  <div className="text-center mb-3 sm:mb-3 lg:mb-[1vw] relative z-10 space-y-1">
                    <h2 className="text-lg sm:text-xl lg:text-[clamp(1.1rem,1.4vw,1.5rem)] font-bold text-white mb-0.5 drop-shadow-2xl">
                      Réinitialiser le mot de passe
                    </h2>
                    <p className="text-xs lg:text-[clamp(0.7rem,0.8vw,0.85rem)] text-white/80 drop-shadow-lg">
                      Choisissez un nouveau mot de passe
                    </p>
                  </div>

                  {!token && (
                    <Alert className="mb-4 border-red-400/80 bg-red-500/30 backdrop-blur-sm">
                      <AlertCircle className="h-4 w-4 text-red-200" />
                      <AlertDescription className="text-white text-sm">
                        Token manquant. Ouvrez le lien reçu par email.
                      </AlertDescription>
                    </Alert>
                  )}

                  {message && (
                    <Alert
                      className={`mb-4 ${
                        message.type === "success"
                          ? "border-green-400/80 bg-green-500/30"
                          : "border-red-400/80 bg-red-500/30"
                      } backdrop-blur-sm`}
                    >
                      {message.type === "success" ? (
                        <CheckCircle className="h-4 w-4 text-green-200" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-200" />
                      )}
                      <AlertDescription
                        className={message.type === "success" ? "text-white text-sm" : "text-white text-sm"}
                      >
                        {message.text}
                      </AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3 lg:space-y-[0.8vw]">
                    <div className="space-y-3 sm:space-y-2.5 lg:space-y-[0.8vw]">
                      <div className="space-y-1">
                        <Label
                          htmlFor="password"
                          className="text-xs lg:text-[clamp(0.75rem,0.85vw,0.95rem)] font-semibold text-white/90 flex items-center space-x-1 drop-shadow-lg"
                        >
                          <span>Nouveau mot de passe</span>
                          <span className="text-red-300 drop-shadow-md">*</span>
                        </Label>
                        <div className="relative group">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={isLoading}
                            required
                            className="h-9 sm:h-10 lg:h-[clamp(2.5rem,3vw,3.25rem)] lg:pr-12 bg-[#2d6e3e]/60 border-0 text-white text-sm lg:text-[clamp(0.8rem,0.9vw,1rem)] placeholder:text-white/60 focus:bg-[#2d6e3e]/60 focus:ring-0 rounded-lg transition-all hover:bg-[#2d6e3e]/60 shadow-md pr-11"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((s) => !s)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                            aria-label="Afficher / masquer"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {passwordErrors.length > 0 && (
                          <div role="alert" className="mt-1 space-y-1">
                            {passwordErrors.map((err, idx) => (
                              <p
                                key={idx}
                                className="text-xs font-semibold leading-snug text-red-500"
                              >
                                • {err}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label
                          htmlFor="confirmPassword"
                          className="text-xs lg:text-[clamp(0.75rem,0.85vw,0.95rem)] font-semibold text-white/90 flex items-center space-x-1 drop-shadow-lg"
                        >
                          <span>Confirmer le mot de passe</span>
                          <span className="text-red-300 drop-shadow-md">*</span>
                        </Label>
                        <div className="relative group">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={isLoading}
                            required
                            className="h-9 sm:h-10 lg:h-[clamp(2.5rem,3vw,3.25rem)] lg:pr-12 bg-[#2d6e3e]/60 border-0 text-white text-sm lg:text-[clamp(0.8rem,0.9vw,1rem)] placeholder:text-white/60 focus:bg-[#2d6e3e]/60 focus:ring-0 rounded-lg transition-all hover:bg-[#2d6e3e]/60 shadow-md pr-11"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((s) => !s)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                            aria-label="Afficher / masquer"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={!canSubmit}
                        className="relative w-full h-10 sm:h-11 lg:h-[clamp(2.75rem,3.2vw,3.5rem)] bg-gradient-to-r from-[#f4c430] via-[#f8d060] to-[#f4c430] hover:from-[#e0b020] hover:via-[#f4c430] hover:to-[#e0b020] text-gray-900 font-semibold text-sm lg:text-[clamp(0.85rem,1vw,1.1rem)] shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group rounded-lg"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                        <span className="relative z-10 text-sm">
                          {isLoading ? "Validation..." : "Valider"}
                        </span>
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Information Cards */}
        <div className="w-full max-w-full mt-12 sm:mt-10 md:mt-12 mb-8 sm:mb-5 md:mb-6 lg:mb-[1.5vw]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-4 lg:gap-[1.5vw] max-w-md mx-auto sm:max-w-none sm:mx-0">
            <Link
              href="/agences"
              className="group relative block cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d6e3e] focus-visible:ring-offset-2"
              aria-label="Voir nos agences"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#2d6e3e]/10 to-transparent rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/75 backdrop-blur-xl rounded-xl shadow-lg px-4 py-3.5 sm:p-4 lg:p-[1.2vw] hover:shadow-xl hover:-translate-y-1 hover:bg-white/85 transition-all duration-300 border border-white/40 overflow-hidden">
                <div className="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-[#2d6e3e]/10 to-transparent rounded-bl-full" />
                <div className="flex items-center gap-3 relative z-10">
                  <div className="relative flex-shrink-0">
                    <div className="p-2 sm:p-2.5 bg-gradient-to-br from-[#2d6e3e]/10 to-[#2d6e3e]/5 rounded-xl">
                      <MapPin className="h-4 sm:h-5 w-4 sm:w-5 text-[#2d6e3e]" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm lg:text-[clamp(0.75rem,0.9vw,1rem)] drop-shadow-sm uppercase tracking-wide">Nous Trouver</h3>
                    <p className="text-xs lg:text-[clamp(0.65rem,0.75vw,0.9rem)] text-gray-700 font-medium mt-0.5 drop-shadow-sm lowercase first-letter:uppercase">Notre équipe est à votre disposition</p>
                  </div>
                </div>
              </div>
            </Link>
            <AuthFeaturesInfoCard />
            <Link
              href="/support"
              className="group relative block cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d6e3e] focus-visible:ring-offset-2"
              aria-label="Support client — contact et assistance"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#2d6e3e]/10 to-transparent rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/75 backdrop-blur-xl rounded-xl shadow-lg px-4 py-3.5 sm:p-4 lg:p-[1.2vw] hover:shadow-xl hover:-translate-y-1 hover:bg-white/85 transition-all duration-300 border border-white/40 overflow-hidden">
                <div className="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-[#2d6e3e]/10 to-transparent rounded-bl-full" />
                <div className="flex items-center gap-3 relative z-10">
                  <div className="relative flex-shrink-0">
                    <div className="p-2 sm:p-2.5 bg-gradient-to-br from-[#2d6e3e]/10 to-[#2d6e3e]/5 rounded-xl">
                      <HelpCircle className="h-4 sm:h-5 w-4 sm:w-5 text-[#2d6e3e]" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm lg:text-[clamp(0.75rem,0.9vw,1rem)] drop-shadow-sm uppercase tracking-wide">Support Client</h3>
                    <p className="text-xs lg:text-[clamp(0.65rem,0.75vw,0.9rem)] text-gray-700 font-medium mt-0.5 drop-shadow-sm lowercase first-letter:uppercase">Assistance disponible 24/7</p>
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
