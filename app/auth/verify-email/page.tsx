"use client"

import type React from "react"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Loader2, Mail, Eye, EyeOff, HelpCircle, UserPlus, Smartphone, MapPin } from "lucide-react"
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
      {/* Logo aligné avec le texte de bienvenue */}
      <div className="absolute top-4 sm:top-4 lg:top-2 left-1/2 -translate-x-1/2 lg:left-2 lg:translate-x-0 z-50">
        <Image
          src="/images/logowhite.png"
          alt="BNG Logo"
          width={160}
          height={48}
          className="object-contain drop-shadow-lg w-32 sm:w-36 lg:w-[200px]"
          priority
        />
      </div>

      {/* Full Screen Background Hero */}
      <div className="absolute lg:fixed inset-0 z-0 min-h-screen lg:min-h-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2d6e3e] via-[#36803e] to-[#2d6e3e]">
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>

          {/* Banking illustration */}
          <div className="hidden lg:block absolute bottom-0 left-1/2 -translate-x-1/2 opacity-30">
            <Image src="/images/image2.png" alt="Banking" width={550} height={400} className="object-contain" />
          </div>

          <div className="absolute top-28 sm:top-32 lg:top-1/2 lg:-translate-y-1/2 left-4 sm:left-6 right-4 lg:right-auto lg:max-w-2xl px-2 sm:px-0">
            <div className="text-left text-white space-y-3 sm:space-y-4 transition-all duration-700 ease-in-out">
              <div className="flex items-center justify-start space-x-2 mb-2 sm:mb-3">
                <span className="text-xs sm:text-sm font-semibold text-[#f4c430] uppercase tracking-wider px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full">
                  Astra e-Banking
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold animate-fadeIn drop-shadow-2xl leading-tight">
                {welcomeMessages[currentMessageIndex].title}
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 animate-fadeIn drop-shadow-lg leading-relaxed">
                {welcomeMessages[currentMessageIndex].description}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="w-full px-4 sm:px-6 pt-64 sm:pt-72 md:pt-80 lg:pt-16 pb-2 relative z-10 min-h-screen lg:h-screen flex flex-col justify-between">
        {/* Verification Form - Top Right */}
        <div className="w-full max-w-full mb-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            <div className="lg:col-start-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2d6e3e]/30 via-[#f4c430]/20 to-[#2d6e3e]/30 rounded-2xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="bg-white/40 backdrop-blur-2xl rounded-2xl shadow-2xl p-4 sm:p-5 border border-white/20">
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
                      <div className="text-center mb-3 sm:mb-4 relative z-10">
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 drop-shadow-2xl">Créez un mot de passe</h2>
                      </div>

                      <form onSubmit={handlePasswordSubmit} className="space-y-3 sm:space-y-4">
                        <div className="space-y-2 sm:space-y-3">
                          {error && (
                            <div className="p-2.5 rounded-lg bg-[#2d6e3e]/70 border-0 shadow-md">
                              <p className="text-xs text-white text-center font-semibold drop-shadow-md">{error}</p>
                            </div>
                          )}

                          {/* Password Field */}
                          <div className="space-y-1">
                            <Label htmlFor="password" className="text-xs font-semibold text-white/90 flex items-center space-x-1 drop-shadow-lg">
                              <span>Mot de passe</span>
                              <span className="text-red-300 drop-shadow-md">*</span>
                            </Label>
                            <div className="relative group">
                              <Input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Créer un mot de passe"
                                className="h-9 sm:h-10 bg-[#2d6e3e]/60 border-0 text-white text-sm pr-11 placeholder:text-white/60 focus:bg-[#2d6e3e]/70 focus:ring-0 rounded-lg transition-all group-hover:bg-[#2d6e3e]/65 shadow-md"
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
                              <div className="text-xs text-red-300 space-y-0.5 mt-1">
                                {passwordErrors.map((err, index) => (
                                  <p key={index}>• {err}</p>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Confirm Password Field */}
                          <div className="space-y-1">
                            <Label htmlFor="confirmPassword" className="text-xs font-semibold text-white/90 flex items-center space-x-1 drop-shadow-lg">
                              <span>Confirmer le mot de passe</span>
                              <span className="text-red-300 drop-shadow-md">*</span>
                            </Label>
                            <div className="relative group">
                              <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirmer votre mot de passe"
                                className="h-9 sm:h-10 bg-[#2d6e3e]/60 border-0 text-white text-sm pr-11 placeholder:text-white/60 focus:bg-[#2d6e3e]/70 focus:ring-0 rounded-lg transition-all group-hover:bg-[#2d6e3e]/65 shadow-md"
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
                            className="relative w-full h-9 sm:h-10 bg-gradient-to-r from-[#f4c430] via-[#f8d060] to-[#f4c430] hover:from-[#e0b020] hover:via-[#f4c430] hover:to-[#e0b020] text-gray-900 font-semibold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group rounded-lg"
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
                      <div className="space-y-2">
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
                            <Button className="w-full h-9 sm:h-10 bg-gradient-to-r from-[#f4c430] via-[#f8d060] to-[#f4c430] hover:from-[#e0b020] hover:via-[#f4c430] hover:to-[#e0b020] text-gray-900 font-semibold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group rounded-lg">
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
                          className="w-full h-9 sm:h-10 bg-gradient-to-r from-[#f4c430] via-[#f8d060] to-[#f4c430] hover:from-[#e0b020] hover:via-[#f4c430] hover:to-[#e0b020] text-gray-900 font-semibold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group rounded-lg"
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

        {/* Information Cards - Full Width at Bottom */}
        <div className="w-full max-w-full -mt-2 sm:-mt-3 mb-4 sm:mb-5 md:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {/* New User */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2d6e3e]/10 to-transparent rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/75 backdrop-blur-xl rounded-xl shadow-lg p-3 sm:p-4 hover:shadow-xl hover:-translate-y-1 hover:bg-white/85 transition-all duration-300 border border-white/40 overflow-hidden">
                  <div className="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-[#2d6e3e]/10 to-transparent rounded-bl-full"></div>
                  
                  <div className="flex items-center space-x-3 relative z-10">
                    <div className="relative flex-shrink-0">
                      <div className="p-2 sm:p-2.5 bg-gradient-to-br from-[#2d6e3e]/10 to-[#2d6e3e]/5 rounded-xl">
                        <MapPin className="h-4 sm:h-5 w-4 sm:w-5 text-[#2d6e3e]" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-xs sm:text-sm drop-shadow-sm">Nouvel utilisateur?</h3>
                      <p className="text-xs text-gray-700 font-medium mt-1 drop-shadow-sm hidden sm:block">Créez votre compte rapidement</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Banking */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#f4c430]/10 to-transparent rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/75 backdrop-blur-xl rounded-xl shadow-lg p-3 sm:p-4 hover:shadow-xl hover:-translate-y-1 hover:bg-white/85 transition-all duration-300 border border-white/40 overflow-hidden">
                  <div className="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-[#f4c430]/10 to-transparent rounded-bl-full"></div>
                  
                  <div className="flex items-center space-x-3 relative z-10">
                    <div className="relative flex-shrink-0">
                      <div className="p-2 sm:p-2.5 bg-gradient-to-br from-[#f4c430]/10 to-[#f4c430]/5 rounded-xl">
                        <Smartphone className="h-4 sm:h-5 w-4 sm:w-5 text-[#f4c430]" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-xs sm:text-sm drop-shadow-sm">Application Mobile</h3>
                      <p className="text-xs text-gray-700 font-medium mt-1 drop-shadow-sm hidden sm:block">Banking en mobilité 24/7</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2d6e3e]/10 to-transparent rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/75 backdrop-blur-xl rounded-xl shadow-lg p-3 sm:p-4 hover:shadow-xl hover:-translate-y-1 hover:bg-white/85 transition-all duration-300 border border-white/40 overflow-hidden">
                  <div className="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-[#2d6e3e]/10 to-transparent rounded-bl-full"></div>
                  
                  <div className="flex items-center space-x-3 relative z-10">
                    <div className="relative flex-shrink-0">
                      <div className="p-2 sm:p-2.5 bg-gradient-to-br from-[#2d6e3e]/10 to-[#2d6e3e]/5 rounded-xl">
                        <HelpCircle className="h-4 sm:h-5 w-4 sm:w-5 text-[#2d6e3e]" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-xs sm:text-sm drop-shadow-sm">Support Client</h3>
                      <p className="text-xs text-gray-700 font-medium mt-1 drop-shadow-sm hidden sm:block">Assistance disponible 24/7</p>
                    </div>
                  </div>
                </div>
              </div>
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
