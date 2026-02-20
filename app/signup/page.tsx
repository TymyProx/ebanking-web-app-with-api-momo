"use client"

import type React from "react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail, MapPin, CreditCard, HelpCircle, Smartphone, UserPlus, ArrowLeft } from "lucide-react"
import { initiateSignup, initiateExistingClientSignup } from "./actions"

const signupMessages = [
  {
    title: "Rejoignez la famille BNG Bank",
    description: "Créez votre compte en quelques minutes et profitez d'une expérience bancaire moderne et sécurisée.",
  },
  {
    title: "Un compte bancaire à votre mesure",
    description: "Bénéficiez de services bancaires adaptés à vos besoins avec une gestion simplifiée de vos finances.",
  },
  {
    title: "Sécurité et confidentialité garanties",
    description: "Vos données personnelles et financières sont protégées par les technologies les plus avancées.",
  },
  {
    title: "Activez votre compte en ligne",
    description: "Déjà client ? Activez votre accès en ligne en quelques clics et gérez vos comptes où que vous soyez.",
  },
]

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [clientType, setClientType] = useState<"new" | "existing" | null>(null)
  const [verificationSent, setVerificationSent] = useState(false)
  const [maskedEmail, setMaskedEmail] = useState("")
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const router = useRouter()

  // Carrousel automatique pour les messages
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % signupMessages.length)
    }, 5000) // Change toutes les 5 secondes

    return () => clearInterval(interval)
  }, [])

  const handleNewClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const formData = new FormData(e.target as HTMLFormElement)
      const fullName = formData.get("fullName") as string
      const email = formData.get("email") as string
      const phone = formData.get("phone") as string
      const address = formData.get("address") as string

      const result = await initiateSignup({
        fullName,
        email,
        phone,
        address,
      })

      if (result.success) {
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`)
      } else {
        setError(result.message)
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'inscription")
    } finally {
      setIsLoading(false)
    }
  }

  const handleExistingClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const formData = new FormData(e.target as HTMLFormElement)
      const clientCode = formData.get("clientCode") as string

      const result = await initiateExistingClientSignup({ clientCode })

      if (result.success && result.maskedEmail) {
        setVerificationSent(true)
        setMaskedEmail(result.maskedEmail)
      } else {
        setError(result.message)
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue")
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
          <div className="hidden lg:block absolute bottom-0 left-[35%] -translate-x-1/2 w-[90%] max-w-[1800px] opacity-50 lg:left-[35%] lg:w-[90%] xl:left-[35%] xl:w-[90%] 2xl:left-[35%] 2xl:w-[90%]">
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

          {/* Hero Text - Positioned on the Top Left */}
          <div className="absolute top-32 sm:top-36 lg:top-[60%] lg:-translate-y-1/2 left-4 sm:left-6 right-4 lg:right-auto lg:max-w-[28%] xl:max-w-[30%] 2xl:max-w-[32%] px-2 sm:px-0">
            <div className="text-left text-white space-y-3 sm:space-y-4 transition-all duration-700 ease-in-out">
              <div className="flex items-center justify-start space-x-2 mb-2 sm:mb-3">
                <span className="text-xs sm:text-sm font-semibold text-[#f4c430] uppercase tracking-wider px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full">
                  Astra e-Banking
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold animate-fadeIn drop-shadow-2xl leading-tight">
                {signupMessages[currentMessageIndex].title}
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 animate-fadeIn drop-shadow-lg leading-relaxed">
                {signupMessages[currentMessageIndex].description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Overlay with transparency */}
      <main className="w-full px-4 sm:px-6 pt-64 sm:pt-72 md:pt-80 lg:pt-16 pb-2 relative z-10 min-h-screen lg:h-screen flex flex-col justify-between">
        {/* Signup Form - Top Right */}
        <div className="w-full max-w-full mb-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            <div className="sm:col-start-3 flex justify-center sm:justify-end mt-8 sm:mt-0">
              <div className="relative group w-full max-w-[90%] sm:max-w-[85%]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2d6e3e]/30 via-[#f4c430]/20 to-[#2d6e3e]/30 rounded-2xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="bg-white/40 backdrop-blur-2xl rounded-2xl shadow-2xl p-4 sm:p-5 border border-white/20">
                  {/* Decorative corner */}
                  <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-br from-white/15 to-transparent rounded-bl-full"></div>

                  {!clientType && (
                    <>
                      <div className="text-center mb-2 sm:mb-3 relative z-10">
                        <h2 className="text-lg sm:text-xl font-bold text-white mb-1 drop-shadow-2xl">Inscription</h2>
                      </div>

                      {/* Client Type Selection */}
                      <div className="space-y-2 sm:space-y-3">
                        <button
                          onClick={() => setClientType("new")}
                          className="w-full p-4 sm:p-5 bg-[#2d6e3e]/60 backdrop-blur-md rounded-xl hover:bg-[#2d6e3e]/70 transition-all text-left group border border-white/30 shadow-lg"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30">
                              <User className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xs sm:text-sm font-bold text-white mb-1 drop-shadow-md">
                                Nouveau client
                              </h3>
                              <p className="text-xs text-white/90 drop-shadow-sm">Créer un nouveau compte</p>
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => setClientType("existing")}
                          className="w-full p-4 sm:p-5 bg-[#2d6e3e]/60 backdrop-blur-md rounded-xl hover:bg-[#2d6e3e]/70 transition-all text-left group border border-[#f4c430]/50 shadow-lg"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-[#f4c430]/30 rounded-lg group-hover:bg-[#f4c430]/40">
                              <CreditCard className="w-4 sm:w-5 h-4 sm:h-5 text-[#f4c430]" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xs sm:text-sm font-bold text-white mb-1 drop-shadow-md">
                                Déjà client
                              </h3>
                              <p className="text-xs text-white/90 drop-shadow-sm">Activer mon accès en ligne</p>
                            </div>
                          </div>
                        </button>

                        {/* Login Link */}
                        <div className="text-center pt-2 sm:pt-3">
                          <Link href="/login" className="text-xs text-white/90 hover:text-white font-medium">
                            Vous avez déjà un compte en ligne ?{" "}
                            <span className="text-[#f4c430] font-semibold">Se connecter</span>
                          </Link>
                        </div>
                      </div>
                    </>
                  )}

                  {clientType === "new" && !verificationSent && (
                    <>
                      <button
                        onClick={() => setClientType(null)}
                        className="text-xs text-white/90 hover:text-white flex items-center space-x-1 font-medium mb-3 sm:mb-4"
                      >
                        <ArrowLeft className="h-3 w-3" />
                        <span>Retour</span>
                      </button>

                      <div className="text-center mb-2 sm:mb-3 relative z-10">
                        <h2 className="text-lg sm:text-xl font-bold text-white mb-1 drop-shadow-2xl">
                          Nouveau compte
                        </h2>
                      </div>

                      {/* New Client Form */}
                      <form onSubmit={handleNewClientSubmit} className="space-y-2 sm:space-y-3">
                        <div className="space-y-2 sm:space-y-2.5">
                          {error && (
                            <div className="p-2.5 rounded-lg bg-[#2d6e3e]/70 border-0 shadow-md">
                              <p className="text-xs text-white text-center font-semibold drop-shadow-md">{error}</p>
                            </div>
                          )}

                          {/* Full Name Field */}
                          <div className="space-y-1">
                            <Label
                              htmlFor="fullName"
                              className="text-xs font-semibold text-white/90 flex items-center space-x-1 drop-shadow-lg"
                            >
                              <span>Nom complet</span>
                              <span className="text-red-300 drop-shadow-md">*</span>
                            </Label>
                            <div className="relative group">
                              <Input
                                id="fullName"
                                name="fullName"
                                type="text"
                                placeholder="Votre nom complet"
                                className="h-9 sm:h-10 bg-[#2d6e3e]/60 border-0 text-white text-sm placeholder:text-white/60 focus:bg-[#2d6e3e]/70 focus:ring-0 rounded-lg transition-all group-hover:bg-[#2d6e3e]/65 shadow-md"
                                required
                                disabled={isLoading}
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                            </div>
                          </div>

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
                                placeholder="votre.email@exemple.com"
                                className="h-9 sm:h-10 bg-[#2d6e3e]/60 border-0 text-white text-sm placeholder:text-white/60 focus:bg-[#2d6e3e]/70 focus:ring-0 rounded-lg transition-all group-hover:bg-[#2d6e3e]/65 shadow-md"
                                required
                                disabled={isLoading}
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                            </div>
                          </div>

                          {/* Phone Field */}
                          <div className="space-y-1">
                            <Label
                              htmlFor="phone"
                              className="text-xs font-semibold text-white/90 flex items-center space-x-1 drop-shadow-lg"
                            >
                              <span>Téléphone</span>
                              <span className="text-red-300 drop-shadow-md">*</span>
                            </Label>
                            <div className="relative group">
                              <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                placeholder="+224 XX XX XX XX XX"
                                className="h-9 sm:h-10 bg-[#2d6e3e]/60 border-0 text-white text-sm placeholder:text-white/60 focus:bg-[#2d6e3e]/70 focus:ring-0 rounded-lg transition-all group-hover:bg-[#2d6e3e]/65 shadow-md"
                                required
                                disabled={isLoading}
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                            </div>
                          </div>

                          {/* Address Field */}
                          <div className="space-y-1">
                            <Label
                              htmlFor="address"
                              className="text-xs font-semibold text-white/90 flex items-center space-x-1 drop-shadow-lg"
                            >
                              <span>Adresse</span>
                              <span className="text-red-300 drop-shadow-md">*</span>
                            </Label>
                            <div className="relative group">
                              <Input
                                id="address"
                                name="address"
                                type="text"
                                placeholder="Votre adresse complète"
                                className="h-9 sm:h-10 bg-[#2d6e3e]/60 border-0 text-white text-sm placeholder:text-white/60 focus:bg-[#2d6e3e]/70 focus:ring-0 rounded-lg transition-all group-hover:bg-[#2d6e3e]/65 shadow-md"
                                required
                                disabled={isLoading}
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                            </div>
                          </div>

                          {/* Submit Button */}
                          <Button
                            type="submit"
                            className="relative w-full h-9 sm:h-10 bg-gradient-to-r from-[#f4c430] via-[#f8d060] to-[#f4c430] hover:from-[#e0b020] hover:via-[#f4c430] hover:to-[#e0b020] text-gray-900 font-semibold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group rounded-lg"
                            disabled={isLoading}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                            {isLoading ? (
                              <div className="flex items-center space-x-2 relative z-10">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-900/30 border-t-gray-900"></div>
                                <span className="text-sm">Inscription...</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center space-x-2 relative z-10">
                                <UserPlus className="h-4 w-4" />
                                <span className="text-sm">S'inscrire</span>
                              </div>
                            )}
                          </Button>
                        </div>
                      </form>
                    </>
                  )}

                  {clientType === "existing" && !verificationSent && (
                    <>
                      <button
                        onClick={() => setClientType(null)}
                        className="text-xs text-white/90 hover:text-white flex items-center space-x-1 font-medium mb-3 sm:mb-4"
                      >
                        <ArrowLeft className="h-3 w-3" />
                        <span>Retour</span>
                      </button>

                      <div className="text-center mb-2 sm:mb-3 relative z-10">
                        <h2 className="text-lg sm:text-xl font-bold text-white mb-1 drop-shadow-2xl">
                          Client existant
                        </h2>
                      </div>

                      {/* Existing Client Form */}
                      <form onSubmit={handleExistingClientSubmit} className="space-y-2 sm:space-y-3">
                        <div className="space-y-2 sm:space-y-2.5">
                          {error && (
                            <div className="p-2.5 rounded-lg bg-[#2d6e3e]/70 border-0 shadow-md">
                              <p className="text-xs text-white text-center font-semibold drop-shadow-md">{error}</p>
                            </div>
                          )}

                          <div className="space-y-1">
                            <Label
                              htmlFor="clientCode"
                              className="text-xs font-semibold text-white/90 flex items-center space-x-1 drop-shadow-lg"
                            >
                              <span>Racine du compte</span>
                              <span className="text-red-300 drop-shadow-md">*</span>
                            </Label>
                            <div className="relative group">
                              <Input
                                id="clientCode"
                                name="clientCode"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]{6}"
                                maxLength={6}
                                placeholder="Votre racine du compte"
                                className="h-9 sm:h-10 bg-[#2d6e3e]/60 border-0 text-white text-sm placeholder:text-white/60 focus:bg-[#2d6e3e]/70 focus:ring-0 rounded-lg transition-all group-hover:bg-[#2d6e3e]/65 shadow-md"
                                required
                                disabled={isLoading}
                                onInput={(e) => {
                                  const target = e.target as HTMLInputElement
                                  target.value = target.value.replace(/[^0-9]/g, "")
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                            </div>
                            <p className="text-xs text-white/70">Trouvez votre racine sur vos documents bancaires</p>
                          </div>

                          <Button
                            type="submit"
                            className="relative w-full h-9 sm:h-10 bg-gradient-to-r from-[#f4c430] via-[#f8d060] to-[#f4c430] hover:from-[#e0b020] hover:via-[#f4c430] hover:to-[#e0b020] text-gray-900 font-semibold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group rounded-lg"
                            disabled={isLoading}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                            {isLoading ? (
                              <div className="flex items-center space-x-2 relative z-10">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-900/30 border-t-gray-900"></div>
                                <span className="text-sm">Vérification...</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center space-x-2 relative z-10">
                                <CreditCard className="h-4 w-4" />
                                <span className="text-sm">Continuer</span>
                              </div>
                            )}
                          </Button>
                        </div>
                      </form>
                    </>
                  )}

                  {verificationSent && maskedEmail && (
                    <>
                      <div className="text-center space-y-3 sm:space-y-6">
                        <div className="mx-auto w-12 sm:w-16 h-12 sm:h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <Mail className="w-6 sm:w-8 h-6 sm:h-8 text-[#f4c430]" />
                        </div>

                        <div className="space-y-2 sm:space-y-3">
                          <h2 className="text-xl sm:text-2xl font-bold text-white drop-shadow-2xl">Email envoyé !</h2>
                          <p className="text-sm sm:text-base text-white/90 drop-shadow-lg">
                            Un email de vérification a été envoyé à{" "}
                            <span className="font-semibold text-white">{maskedEmail}</span>
                          </p>
                          <p className="text-xs text-white/80 drop-shadow-md">
                            Cliquez sur le lien dans l'email pour définir votre mot de passe et activer votre compte.
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

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.7s ease-in-out;
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.05);
          }
        }
        .animate-pulse {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 10px;
        }
        ::-webkit-scrollbar-track {
          background: linear-gradient(to bottom, #f1f1f1, #e5e5e5);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #2d6e3e, #36803e);
          border-radius: 10px;
          border: 2px solid #f1f1f1;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #36803e, #2d6e3e);
        }
        
        /* Smooth transitions */
        * {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  )
}
