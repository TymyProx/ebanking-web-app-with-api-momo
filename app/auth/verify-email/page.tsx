"use client"

import type React from "react"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Loader2, Mail, Eye, EyeOff, HelpCircle, UserPlus, MapPin } from "lucide-react"
import { AuthFeaturesInfoCard } from "@/components/auth/auth-features-info-card"
import { completeSignup } from "./actions"
import { validatePassword } from "@/lib/password-validation"

const welcomeMessages = [
  {
    title: "Vérification de votre email",
    description:
      "Finalisez votre inscription en définissant votre mot de passe et profitez de tous nos services bancaires en ligne.",
  },
  {
    title: "Bienvenue sur votre plateforme bancaire",
    description:
      "Avec une protection de niveau bancaire, nous facilitons les opérations bancaires par Internet de manière sécurisée.",
  },
  {
    title: "Une sécurité maximale pour vos transactions",
    description:
      "Cryptage 256-bit, authentification à deux facteurs et surveillance continue pour protéger votre argent.",
  },
]

function VerifyEmailContent() {
  const [status, setStatus] = useState<"pending" | "setting-password" | "creating" | "success" | "error">("pending")
  const [message, setMessage] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  // Carrousel automatique pour les messages de bienvenue
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % welcomeMessages.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (token) {
      setStatus("setting-password")
    }
  }, [token])

  const handlePasswordChange = (newPassword: string) => {
    setPassword(newPassword)
    const validation = validatePassword(newPassword)
    setPasswordErrors(validation.errors)
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const validation = validatePassword(password)
    if (!validation.isValid) {
      setError(validation.errors.join(", "))
      return
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return
    }

    if (!token) {
      setError("Token de vérification manquant")
      return
    }

    setStatus("creating")

    const result = await completeSignup(token, password, email || undefined)

    if (result.success) {
      setStatus("success")
      setMessage(result.message)
    } else {
      setStatus("error")
      setMessage(result.message)
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
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>

          {/* Banking illustration - toujours ~38% de la largeur viewport */}
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

      <main className="w-full px-5 pb-10 min-[400px]:px-6 sm:px-6 sm:pb-8 lg:px-[2vw] lg:pb-[1.5vw] relative z-10 min-h-screen lg:h-screen flex flex-col justify-between [padding-left:max(1.25rem,env(safe-area-inset-left))] [padding-right:max(1.25rem,env(safe-area-inset-right))] [padding-top:calc(env(safe-area-inset-top,0px)+20rem)] max-[380px]:[padding-top:calc(env(safe-area-inset-top,0px)+31rem)] sm:[padding-top:calc(env(safe-area-inset-top,0px)+28rem)] md:[padding-top:calc(env(safe-area-inset-top,0px)+28.5rem)] lg:pt-[2vw]">
        {/* Verification Form - Top Right */}
        <div className="w-full max-w-full mb-0 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-4 lg:gap-[1.5vw]">
            <div className="sm:col-start-3 flex justify-center sm:justify-end mt-6 sm:mt-0 w-full min-w-0">
              <div className="relative group w-full max-w-md sm:max-w-[85%] lg:max-w-[28vw] lg:min-w-[360px] mx-auto sm:mx-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2d6e3e]/30 via-[#f4c430]/20 to-[#2d6e3e]/30 rounded-2xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity pointer-events-none"></div>
                <div className="relative bg-white/40 backdrop-blur-2xl rounded-2xl shadow-2xl px-5 py-6 sm:p-5 lg:p-[1.6vw] border border-white/20">
                  {/* Decorative corner */}
                  <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-br from-white/15 to-transparent rounded-bl-full"></div>
                  
                  {/* Status Content */}
                  {status === "pending" && (
                    <div className="space-y-4 sm:space-y-5 text-center">
                      <div className="mx-auto w-16 sm:w-20 h-16 sm:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Mail className="w-8 sm:w-10 h-8 sm:h-10 text-white" />
                      </div>
                      <div className="space-y-3 sm:space-y-4">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg">Vérifiez votre email</h1>
                        <p className="text-sm sm:text-base text-white/90 drop-shadow-md">
                          Un email de vérification a été envoyé à{" "}
                          <span className="font-semibold text-white">{email}</span>
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-white px-4 drop-shadow-lg">
                          Veuillez cliquer sur le lien dans l'email pour continuer votre inscription.
                        </p>
                      </div>
                    </div>
                  )}

                  {status === "setting-password" && (
                    <>
                      <div className="text-center mb-3 sm:mb-3 lg:mb-[1vw] relative z-10">
                        <h2 className="text-lg sm:text-xl lg:text-[clamp(1.1rem,1.4vw,1.5rem)] font-bold text-white mb-0.5 drop-shadow-2xl">
                          Créez un mot de passe
                        </h2>
                      </div>

                      <form onSubmit={handlePasswordSubmit} className="space-y-3 sm:space-y-3 lg:space-y-[0.8vw]">
                        <div className="space-y-3 sm:space-y-2.5 lg:space-y-[0.8vw]">
                          {error && (
                            <div className="p-2.5 rounded-lg bg-[#2d6e3e]/70 border-0 shadow-md">
                              <p className="text-xs text-white text-center font-semibold drop-shadow-md">{error}</p>
                            </div>
                          )}

                          {/* Password Field */}
                          <div className="space-y-1">
                            <Label
                              htmlFor="password"
                              className="text-xs lg:text-[clamp(0.75rem,0.85vw,0.95rem)] font-semibold text-white/90 flex items-center space-x-1 drop-shadow-lg"
                            >
                              <span>Mot de passe</span>
                              <span className="text-red-300 drop-shadow-md">*</span>
                            </Label>
                            <div className="relative group">
                              <Input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Créer un mot de passe"
                                className="h-9 sm:h-10 lg:h-[clamp(2.5rem,3vw,3.25rem)] lg:pr-12 bg-[#2d6e3e]/60 border-0 text-white text-sm lg:text-[clamp(0.8rem,0.9vw,1rem)] pr-11 placeholder:text-white/60 focus:bg-[#2d6e3e]/60 focus:ring-0 rounded-lg transition-all hover:bg-[#2d6e3e]/60 shadow-md"
                                required
                                value={password}
                                onChange={(e) => handlePasswordChange(e.target.value)}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                            {password && passwordErrors.length > 0 && (
                              <div role="alert" className="mt-1 space-y-1">
                                {passwordErrors.map((err, index) => (
                                  <p
                                    key={index}
                                    className="text-xs font-semibold leading-snug text-red-500"
                                  >
                                    • {err}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Confirm Password Field */}
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
                                name="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirmer votre mot de passe"
                                className="h-9 sm:h-10 lg:h-[clamp(2.5rem,3vw,3.25rem)] lg:pr-12 bg-[#2d6e3e]/60 border-0 text-white text-sm lg:text-[clamp(0.8rem,0.9vw,1rem)] pr-11 placeholder:text-white/60 focus:bg-[#2d6e3e]/60 focus:ring-0 rounded-lg transition-all hover:bg-[#2d6e3e]/60 shadow-md"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Submit Button */}
                          <Button
                            type="submit"
                            className="relative w-full h-10 sm:h-11 lg:h-[clamp(2.75rem,3.2vw,3.5rem)] bg-gradient-to-r from-[#f4c430] via-[#f8d060] to-[#f4c430] hover:from-[#e0b020] hover:via-[#f4c430] hover:to-[#e0b020] text-gray-900 font-semibold text-sm lg:text-[clamp(0.85rem,1vw,1.1rem)] shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group rounded-lg"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                            <span className="relative z-10 text-sm">Créer mon compte</span>
                          </Button>
                        </div>
                      </form>
                    </>
                  )}

                  {status === "creating" && (
                    <div className="space-y-4 sm:space-y-5 text-center">
                      <div className="flex justify-center">
                        <Loader2 className="h-12 sm:h-16 w-12 sm:w-16 text-white animate-spin" />
                      </div>
                      <div className="space-y-3">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg">Création de votre compte...</h1>
                        <p className="text-sm sm:text-base text-white/90 drop-shadow-md">Veuillez patienter.</p>
                      </div>
                    </div>
                  )}

                  {status === "success" && (
                    <div className="space-y-4 sm:space-y-5 text-center">
                      <div className="mx-auto w-16 sm:w-20 h-16 sm:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <CheckCircle className="w-8 sm:w-10 h-8 sm:h-10 text-white" />
                      </div>
                      <div className="space-y-3 sm:space-y-4">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg">Compte créé avec succès !</h1>
                        <p className="text-sm sm:text-base text-white/90 drop-shadow-md">{message}</p>
                        <div className="pt-2 sm:pt-3">
                          <p className="text-xs sm:text-sm text-white/80 mb-2 sm:mb-3">
                            Vous pouvez maintenant vous connecter
                          </p>
                          <Link href="/login">
                            <Button className="w-full h-9 sm:h-10 lg:h-[clamp(2.75rem,3.2vw,3.5rem)] bg-gradient-to-r from-[#f4c430] via-[#f8d060] to-[#f4c430] hover:from-[#e0b020] hover:via-[#f4c430] hover:to-[#e0b020] text-gray-900 font-semibold text-xs sm:text-sm lg:text-[clamp(0.85rem,1vw,1.1rem)] shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group rounded-lg">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                              <span className="relative z-10">Se connecter</span>
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {status === "error" && (
                    <div className="space-y-4 sm:space-y-5 text-center">
                      <div className="mx-auto w-16 sm:w-20 h-16 sm:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <XCircle className="w-8 sm:w-10 h-8 sm:h-10 text-red-400" />
                      </div>
                      <div className="space-y-3 sm:space-y-4">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg">Erreur</h1>
                        <p className="text-sm sm:text-base text-white/90 drop-shadow-md">{message}</p>
                        <Button
                          onClick={() => router.push("/signup")}
                          className="w-full h-9 sm:h-10 lg:h-[clamp(2.75rem,3.2vw,3.5rem)] bg-gradient-to-r from-[#f4c430] via-[#f8d060] to-[#f4c430] hover:from-[#e0b020] hover:via-[#f4c430] hover:to-[#e0b020] text-gray-900 font-semibold text-xs sm:text-sm lg:text-[clamp(0.85rem,1vw,1.1rem)] shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group rounded-lg"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                          <span className="relative z-10">Retour à l'inscription</span>
                        </Button>
                      </div>
                    </div>
                  )}
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
                <div className="absolute inset-0 bg-gradient-to-br from-[#2d6e3e]/10 to-transparent rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/75 backdrop-blur-xl rounded-xl shadow-lg px-4 py-3.5 sm:p-4 lg:p-[1.2vw] hover:shadow-xl hover:-translate-y-1 hover:bg-white/85 transition-all duration-300 border border-white/40 overflow-hidden">
                  <div className="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-[#2d6e3e]/10 to-transparent rounded-bl-full"></div>

                  <div className="flex items-center gap-3 relative z-10">
                    <div className="relative flex-shrink-0">
                      <div className="p-2 sm:p-2.5 bg-gradient-to-br from-[#2d6e3e]/10 to-[#2d6e3e]/5 rounded-xl">
                        <MapPin className="h-4 sm:h-5 w-4 sm:w-5 text-[#2d6e3e]" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-xs sm:text-sm lg:text-[clamp(0.75rem,0.9vw,1rem)] drop-shadow-sm uppercase tracking-wide">Nouvel utilisateur?</h3>
                      <p className="text-xs lg:text-[clamp(0.65rem,0.75vw,0.9rem)] text-gray-700 font-medium mt-0.5 drop-shadow-sm lowercase first-letter:uppercase hidden sm:block">Créez votre compte rapidement</p>
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
                      <h3 className="font-bold text-gray-900 text-xs sm:text-sm lg:text-[clamp(0.75rem,0.9vw,1rem)] drop-shadow-sm uppercase tracking-wide">Support Client</h3>
                      <p className="text-xs lg:text-[clamp(0.65rem,0.75vw,0.9rem)] text-gray-700 font-medium mt-0.5 drop-shadow-sm lowercase first-letter:uppercase hidden sm:block">Assistance disponible 24/7</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
      </main>

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.7s ease-in-out; }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer { animation: shimmer 3s infinite; }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar { width: 10px; }
        ::-webkit-scrollbar-track { background: linear-gradient(to bottom, #f1f1f1, #e5e5e5); border-radius: 10px; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #2d6e3e, #36803e); border-radius: 10px; border: 2px solid #f1f1f1; }
        ::-webkit-scrollbar-thumb:hover { background: linear-gradient(to bottom, #36803e, #2d6e3e); }
        
        /* Smooth transitions */
        * { scroll-behavior: smooth; }
      `}</style>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2d6e3e] via-[#36803e] to-[#2d6e3e]">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
