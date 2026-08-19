"use client"

import type React from "react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, User, Mail, UserCheck, HelpCircle, UserPlus, MapPin } from "lucide-react"
import { AuthFeaturesInfoCard } from "@/components/auth/auth-features-info-card"
import { AuthBrandHeader } from "@/components/auth/auth-brand-header"
import axios from "axios"
import { config } from "@/lib/config"
import { validatePassword } from "@/lib/password-validation"

const API_BASE_URL = config.API_BASE_URL

const welcomeMessages = [
  {
    title: "Bienvenue sur votre plateforme bancaire",
    description:
      "Avec une protection de niveau bancaire, nous facilitons les opérations bancaires par Internet de manière sécurisée.",
  },
  {
    title: "Activez votre compte BNG CONNECT",
    description:
      "Finalisez votre inscription en quelques étapes et profitez de tous nos services bancaires en ligne.",
  },
  {
    title: "Une sécurité maximale pour vos transactions",
    description:
      "Cryptage 256-bit, authentification à deux facteurs et surveillance continue pour protéger votre argent.",
  },
]

export default function AcceptInvitePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  })

  // Carrousel automatique pour les messages de bienvenue
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % welcomeMessages.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const tokenParam = searchParams.get("token")
    const emailParam = searchParams.get("email")
    const firstNameParam = searchParams.get("firstName")
    const lastNameParam = searchParams.get("lastName")

    if (!tokenParam) {
      alert("Token d'invitation manquant")
      router.push("/login")
      return
    }

    setToken(tokenParam)

    if (emailParam) {
      setInvitedEmail(emailParam)
      setFormData((prev) => ({
        ...prev,
        email: emailParam,
        firstName: firstNameParam || "",
        lastName: lastNameParam || "",
      }))
    }
  }, [searchParams, router])

  const handlePasswordChange = (newPassword: string) => {
    setFormData({ ...formData, password: newPassword })
    const validation = validatePassword(newPassword)
    setPasswordErrors(validation.errors)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const validation = validatePassword(formData.password)
    if (!validation.isValid) {
      setError(validation.errors.join(", "))
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return
    }

    if (invitedEmail && formData.email.toLowerCase() !== invitedEmail.toLowerCase()) {
      setError("L'email ne correspond pas à celui de l'invitation")
      return
    }

    setIsLoading(true)

    try {
      const tenantId = config.TENANT_ID
      if (!tenantId) {
        throw new Error("Configuration manquante")
      }

      const response = await axios.post(`${API_BASE_URL}/api/auth/sign-up`, {
        email: formData.email,
        password: formData.password,
        invitationToken: token,
        token: token,
        tenantId: tenantId,
        firstName: formData.firstName,
        lastName: formData.lastName,
      })

      const authToken = response.data

      if (authToken) {
        localStorage.setItem("token", authToken)

        const userResponse = await axios.get(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        })

        localStorage.setItem("user", JSON.stringify(userResponse.data))
        router.push("/login")
      } else {
        throw new Error("Token d'authentification non reçu")
      }
    } catch (err: any) {
      console.error("Erreur lors de l'activation:", err)
      let errorMessage = "Erreur lors de l'activation du compte"

      if (err.response?.data) {
        errorMessage = err.response.data.message || err.response.data.error || errorMessage
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen lg:h-screen relative overflow-x-hidden overflow-y-auto lg:overflow-hidden">
      <AuthBrandHeader />

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
          <div className="absolute top-[10.75rem] sm:top-[11.5rem] lg:top-[28%] left-5 right-5 sm:left-6 sm:right-6 lg:left-[2vw] lg:right-auto lg:max-w-[28%] px-0 z-10">
            <span className="text-lg sm:text-[1.35rem] md:text-[1.6rem] lg:text-[1.8vw] font-semibold text-[#f4c430] uppercase tracking-wider px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 lg:px-[1vw] lg:py-[0.5vw] bg-white/10 backdrop-blur-sm rounded-full inline-block">
              BNG CONNECT
            </span>
          </div>

          {/* Bloc carousel texte — aligné /login */}
          <div className="absolute top-[14.25rem] sm:top-[15.25rem] lg:top-[56%] lg:-translate-y-1/2 left-5 right-5 sm:left-6 sm:right-6 lg:left-[2vw] lg:right-auto lg:max-w-[28%] px-0">
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

      <main className="w-full px-5 pb-10 min-[400px]:px-6 sm:px-6 sm:pb-8 lg:px-[2vw] lg:pb-[1.5vw] relative z-10 min-h-screen lg:h-screen flex flex-col justify-between [padding-left:max(1.25rem,env(safe-area-inset-left))] [padding-right:max(1.25rem,env(safe-area-inset-right))] [padding-top:calc(env(safe-area-inset-top,0px)+28rem)] max-[380px]:[padding-top:calc(env(safe-area-inset-top,0px)+34rem)] sm:[padding-top:calc(env(safe-area-inset-top,0px)+31rem)] md:[padding-top:calc(env(safe-area-inset-top,0px)+31.5rem)] lg:pt-[2vw]">
        {/* Activation Form - Top Right */}
        <div className="w-full max-w-full mb-0 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-4 lg:gap-[1.5vw]">
            <div className="sm:col-start-3 flex justify-center sm:justify-end mt-6 sm:mt-0 w-full min-w-0">
              <div className="relative group w-full max-w-md sm:max-w-[85%] lg:max-w-[28vw] lg:min-w-[360px] mx-auto sm:mx-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2d6e3e]/30 via-[#f4c430]/20 to-[#2d6e3e]/30 rounded-2xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity pointer-events-none"></div>
                <div className="relative bg-white/40 backdrop-blur-2xl rounded-2xl shadow-2xl px-5 py-6 sm:p-5 lg:p-[1.6vw] border border-white/20">
                  {/* Decorative corner */}
                  <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-br from-white/15 to-transparent rounded-bl-full"></div>
                  
                  <div className="text-center mb-3 sm:mb-3 lg:mb-[1vw] relative z-10">
                    <h2 className="text-lg sm:text-xl lg:text-[clamp(1.1rem,1.4vw,1.5rem)] font-bold text-white mb-0.5 drop-shadow-2xl">
                      Activation
                    </h2>
                    <p className="text-xs sm:text-sm lg:text-[clamp(0.7rem,0.8vw,0.85rem)] text-white/90 drop-shadow-md">
                      Finalisez votre inscription
                    </p>
                  </div>

                  {/* Activation Form */}
                  <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3 lg:space-y-[0.8vw]">
                    <div className="space-y-3 sm:space-y-2.5 lg:space-y-[0.8vw]">
                      {error && (
                        <div className="p-2.5 rounded-lg bg-[#2d6e3e]/70 border-0 shadow-md">
                          <p className="text-xs text-white text-center font-semibold drop-shadow-md">{error}</p>
                        </div>
                      )}

                      {/* Email Field */}
                      <div className="space-y-1">
                        <Label
                          htmlFor="email"
                          className="text-xs lg:text-[clamp(0.75rem,0.85vw,0.95rem)] font-semibold text-white/90 flex items-center space-x-1 drop-shadow-lg"
                        >
                          <span>Email</span>
                          <span className="text-red-300 drop-shadow-md">*</span>
                        </Label>
                        <div className="relative group">
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            readOnly
                            className="h-9 sm:h-10 lg:h-[clamp(2.5rem,3vw,3.25rem)] pr-10 bg-[#2d6e3e]/60 border-0 text-white text-sm lg:text-[clamp(0.8rem,0.9vw,1rem)] placeholder:text-white/60 focus:bg-[#2d6e3e]/60 focus:ring-0 rounded-lg transition-all hover:bg-[#2d6e3e]/60 shadow-md"
                            required
                            disabled={isLoading || !!invitedEmail}
                          />
                          <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70 drop-shadow-sm" />
                        </div>
                      </div>

                      {/* First Name Field */}
                      <div className="space-y-1">
                        <Label
                          htmlFor="firstName"
                          className="text-xs lg:text-[clamp(0.75rem,0.85vw,0.95rem)] font-semibold text-white/90 flex items-center space-x-1 drop-shadow-lg"
                        >
                          <span>Prénom</span>
                          <span className="text-red-300 drop-shadow-md">*</span>
                        </Label>
                        <div className="relative group">
                          <Input
                            id="firstName"
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className="h-9 sm:h-10 lg:h-[clamp(2.5rem,3vw,3.25rem)] pr-10 bg-[#2d6e3e]/60 border-0 text-white text-sm lg:text-[clamp(0.8rem,0.9vw,1rem)] placeholder:text-white/60 focus:bg-[#2d6e3e]/60 focus:ring-0 rounded-lg transition-all hover:bg-[#2d6e3e]/60 shadow-md"
                            required
                            disabled={isLoading}
                          />
                          <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70 drop-shadow-sm" />
                        </div>
                      </div>

                      {/* Last Name Field */}
                      <div className="space-y-1">
                        <Label
                          htmlFor="lastName"
                          className="text-xs lg:text-[clamp(0.75rem,0.85vw,0.95rem)] font-semibold text-white/90 flex items-center space-x-1 drop-shadow-lg"
                        >
                          <span>Nom</span>
                          <span className="text-red-300 drop-shadow-md">*</span>
                        </Label>
                        <div className="relative group">
                          <Input
                            id="lastName"
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className="h-9 sm:h-10 lg:h-[clamp(2.5rem,3vw,3.25rem)] pr-10 bg-[#2d6e3e]/60 border-0 text-white text-sm lg:text-[clamp(0.8rem,0.9vw,1rem)] placeholder:text-white/60 focus:bg-[#2d6e3e]/60 focus:ring-0 rounded-lg transition-all hover:bg-[#2d6e3e]/60 shadow-md"
                            required
                            disabled={isLoading}
                          />
                          <UserCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70 drop-shadow-sm" />
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
                        <div className="relative group">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => handlePasswordChange(e.target.value)}
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
                        {formData.password && passwordErrors.length > 0 && (
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
                            type={showPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                      </div>

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
                            <span className="text-sm">Activation...</span>
                          </div>
                        ) : (
                          <span className="relative z-10 text-sm">Activer mon compte</span>
                        )}
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
