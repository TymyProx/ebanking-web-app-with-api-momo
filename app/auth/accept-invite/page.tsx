"use client"

import type React from "react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, User, Mail, UserCheck, HelpCircle, UserPlus, Smartphone, MapPin } from "lucide-react"
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
    title: "Activez votre compte MyBNG",
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
        router.push("/")
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
        {/* Activation Form - Top Right */}
        <div className="w-full max-w-full mb-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            <div className="lg:col-start-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2d6e3e]/30 via-[#f4c430]/20 to-[#2d6e3e]/30 rounded-2xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="bg-white/40 backdrop-blur-2xl rounded-2xl shadow-2xl p-4 sm:p-5 border border-white/20">
                  {/* Decorative corner */}
                  <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-br from-white/15 to-transparent rounded-bl-full"></div>
                  
                  <div className="text-center mb-3 sm:mb-4 relative z-10">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#f4c430] mb-1 drop-shadow-2xl">Activation</h2>
                    <p className="text-xs sm:text-sm text-white/90 drop-shadow-md">Finalisez votre inscription</p>
                  </div>

                  {/* Activation Form */}
                  <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                    <div className="space-y-2 sm:space-y-3">
                      {error && (
                        <div className="p-2.5 rounded-lg bg-[#2d6e3e]/70 border-0 shadow-md">
                          <p className="text-xs text-white text-center font-semibold drop-shadow-md">{error}</p>
                        </div>
                      )}

                      {/* Email Field */}
                      <div className="space-y-1">
                        <Label htmlFor="email" className="text-xs font-semibold text-white/90 flex items-center space-x-1 drop-shadow-lg">
                          <span>Email</span>
                          <span className="text-red-300 drop-shadow-md">*</span>
                        </Label>
                        <div className="relative group">
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            readOnly
                            className="h-9 sm:h-10 bg-[#2d6e3e]/60 border-0 text-white text-sm placeholder:text-white/60 focus:bg-[#2d6e3e]/70 focus:ring-0 rounded-lg transition-all group-hover:bg-[#2d6e3e]/65 shadow-md"
                            required
                            disabled={isLoading || !!invitedEmail}
                          />
                          <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70 drop-shadow-sm" />
                        </div>
                      </div>

                      {/* First Name Field */}
                      <div className="space-y-1">
                        <Label htmlFor="firstName" className="text-xs font-semibold text-white/90 flex items-center space-x-1 drop-shadow-lg">
                          <span>Prénom</span>
                          <span className="text-red-300 drop-shadow-md">*</span>
                        </Label>
                        <div className="relative group">
                          <Input
                            id="firstName"
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className="h-9 sm:h-10 bg-[#2d6e3e]/60 border-0 text-white text-sm placeholder:text-white/60 focus:bg-[#2d6e3e]/70 focus:ring-0 rounded-lg transition-all group-hover:bg-[#2d6e3e]/65 shadow-md"
                            required
                            disabled={isLoading}
                          />
                          <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70 drop-shadow-sm" />
                        </div>
                      </div>

                      {/* Last Name Field */}
                      <div className="space-y-1">
                        <Label htmlFor="lastName" className="text-xs font-semibold text-white/90 flex items-center space-x-1 drop-shadow-lg">
                          <span>Nom</span>
                          <span className="text-red-300 drop-shadow-md">*</span>
                        </Label>
                        <div className="relative group">
                          <Input
                            id="lastName"
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className="h-9 sm:h-10 bg-[#2d6e3e]/60 border-0 text-white text-sm placeholder:text-white/60 focus:bg-[#2d6e3e]/70 focus:ring-0 rounded-lg transition-all group-hover:bg-[#2d6e3e]/65 shadow-md"
                            required
                            disabled={isLoading}
                          />
                          <UserCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70 drop-shadow-sm" />
                        </div>
                      </div>

                      {/* Password Field */}
                      <div className="space-y-1">
                        <Label htmlFor="password" className="text-xs font-semibold text-white/90 flex items-center space-x-1 drop-shadow-lg">
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
                            className="h-9 sm:h-10 bg-[#2d6e3e]/60 border-0 text-white text-sm pr-11 placeholder:text-white/60 focus:bg-[#2d6e3e]/70 focus:ring-0 rounded-lg transition-all group-hover:bg-[#2d6e3e]/65 shadow-md"
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
                            type={showPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            placeholder="••••••••"
                            className="h-9 sm:h-10 bg-[#2d6e3e]/60 border-0 text-white text-sm pr-11 placeholder:text-white/60 focus:bg-[#2d6e3e]/70 focus:ring-0 rounded-lg transition-all group-hover:bg-[#2d6e3e]/65 shadow-md"
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
                        className="relative w-full h-9 sm:h-10 bg-gradient-to-r from-[#f4c430] via-[#f8d060] to-[#f4c430] hover:from-[#e0b020] hover:via-[#f4c430] hover:to-[#e0b020] text-gray-900 font-semibold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group rounded-lg"
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
