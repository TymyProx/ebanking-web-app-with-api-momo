"use client"

import type React from "react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, ArrowLeft, MapPin, Smartphone, HelpCircle } from "lucide-react"
import AuthService from "@/lib/auth-service"

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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
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
    setSuccess(false)

    try {
      await AuthService.sendPasswordResetEmail(email.trim().toLowerCase())
      setSuccess(true)
    } catch (err: any) {
      // Afficher le message d'erreur détaillé du backend
      const errorMessage = err?.message || err?.response?.data || "Erreur lors de l'envoi de l'email"
      setError(errorMessage)
      console.error("Erreur lors de l'envoi de l'email de réinitialisation:", err)
    } finally {
      setIsLoading(false)
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
          <div className="hidden lg:block absolute bottom-0 left-[35%] -translate-x-1/2 w-[90%] max-w-[1800px] opacity-100 lg:left-[35%] lg:w-[90%] xl:left-[35%] xl:w-[90%] 2xl:left-[35%] 2xl:w-[90%]">
            <Image
              src="/images/image2.png"
              alt="Banking"
              width={2000}
              height={1600}
              className="w-full h-auto object-contain"
              priority
              sizes="(max-width: 1024px) 0vw, 90vw"
            />
          </div>

          <div className="absolute top-32 sm:top-36 lg:top-[60%] lg:-translate-y-1/2 left-4 sm:left-6 right-4 lg:right-auto lg:max-w-[28%] xl:max-w-[30%] 2xl:max-w-[32%] px-2 sm:px-0">
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
        {/* Forgot Password Form - Top Right */}
        <div className="w-full max-w-full mb-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            <div className="sm:col-start-3 flex justify-center sm:justify-end mt-8 sm:mt-0 mb-8 sm:mb-0">
              <div className="relative group w-full max-w-[90%] sm:max-w-[85%]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2d6e3e]/30 via-[#f4c430]/20 to-[#2d6e3e]/30 rounded-2xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="bg-white/40 backdrop-blur-2xl rounded-2xl shadow-2xl p-4 sm:p-5 border border-white/20">
                  {/* Decorative corner */}
                  <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-br from-white/15 to-transparent rounded-bl-full"></div>

                  {!success ? (
                    <>
                      <button
                        onClick={() => router.push("/login")}
                        className="text-xs text-white/90 hover:text-white flex items-center space-x-1 font-medium mb-3 sm:mb-4"
                      >
                        <ArrowLeft className="h-3 w-3" />
                        <span>Retour à la connexion</span>
                      </button>

                      <div className="text-center mb-2 sm:mb-3 relative z-10">
                        <h2 className="text-lg sm:text-xl font-bold text-white mb-1 drop-shadow-2xl">
                          Mot de passe oublié
                        </h2>
                      </div>

                      {/* Forgot Password Form */}
                      <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
                        <div className="space-y-2 sm:space-y-2.5">
                          {error && (
                            <div className="p-2.5 rounded-lg bg-[#2d6e3e]/70 border-0 shadow-md">
                              <p className="text-xs text-white text-center font-semibold drop-shadow-md">{error}</p>
                            </div>
                          )}

                          {/* Email Field */}
                          <div className="space-y-1">
                            <Label
                              htmlFor="email"
                              className="text-xs font-semibold text-white/90 flex items-center space-x-1 drop-shadow-lg"
                            >
                              <span>Email</span>
                              <span className="text-red-300 drop-shadow-md">*</span>
                            </Label>
                            <div className="relative group">
                              <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="exemple@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-9 sm:h-10 bg-[#2d6e3e]/60 border-0 text-white text-sm placeholder:text-white/60 focus:bg-[#2d6e3e]/70 focus:ring-0 rounded-lg transition-all group-hover:bg-[#2d6e3e]/65 shadow-md"
                                required
                                disabled={isLoading}
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                            </div>
                            <p className="text-xs text-white/70">Entrez votre adresse email pour recevoir un lien de réinitialisation</p>
                          </div>

                          {/* Submit Button */}
                          <Button
                            type="submit"
                            className="relative w-full h-10 sm:h-11 bg-gradient-to-r from-[#f4c430] via-[#f8d060] to-[#f4c430] hover:from-[#e0b020] hover:via-[#f4c430] hover:to-[#e0b020] text-gray-900 font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group rounded-lg"
                            disabled={isLoading || !email.trim()}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                            {isLoading ? (
                              <div className="flex items-center space-x-2 relative z-10">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-900/30 border-t-gray-900"></div>
                                <span className="text-sm">Envoi en cours...</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center space-x-2 relative z-10">
                                <Mail className="h-4 w-4" />
                                <span className="text-sm">Envoyer le lien</span>
                              </div>
                            )}
                          </Button>
                        </div>
                      </form>
                    </>
                  ) : (
                    <>
                      <div className="text-center space-y-3 sm:space-y-6">
                        <div className="mx-auto w-12 sm:w-16 h-12 sm:h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <Mail className="w-6 sm:w-8 h-6 sm:h-8 text-[#f4c430]" />
                        </div>

                        <div className="space-y-2 sm:space-y-3">
                          <h2 className="text-xl sm:text-2xl font-bold text-white drop-shadow-2xl">Email envoyé !</h2>
                          <p className="text-sm sm:text-base text-white/90 drop-shadow-lg">
                            Un email de réinitialisation a été envoyé à{" "}
                            <span className="font-semibold text-white">{email}</span>
                          </p>
                          <p className="text-xs text-white/80 drop-shadow-md">
                            Cliquez sur le lien dans l'email pour réinitialiser votre mot de passe.
                          </p>
                          <p className="text-xs text-white/70 drop-shadow-md">
                            Si vous ne recevez rien, vérifiez vos spams ou contactez le support.
                          </p>
                        </div>

                        <Button
                          onClick={() => router.push("/login")}
                          className="relative w-full h-10 sm:h-11 bg-gradient-to-r from-[#f4c430] via-[#f8d060] to-[#f4c430] hover:from-[#e0b020] hover:via-[#f4c430] hover:to-[#e0b020] text-gray-900 font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group rounded-lg"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                          <span className="relative z-10 text-sm">Retour à la connexion</span>
                        </Button>
                      </div>
                    </>
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

            {/* Mobile Banking */}
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

            {/* Support */}
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
      </main>
    </div>
  )
}
