"use client"

import type React from "react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, User, Mail, UserCheck, AlertCircle } from "lucide-react"
import axios from "axios"
import { config } from "@/lib/config"
import { validatePassword, getPasswordRequirements } from "@/lib/password-validation"

const API_BASE_URL = config.API_BASE_URL

export default function AcceptInvitePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  })

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

    // Validation
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

      // Appel à l'API d'activation
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
        // Stocker le token
        localStorage.setItem("token", authToken)

        // Récupérer les informations utilisateur
        const userResponse = await axios.get(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        })

        localStorage.setItem("user", JSON.stringify(userResponse.data))

        // Rediriger vers le tableau de bord
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
    <div className="min-h-screen flex bg-gray-100">
      {/* Left side - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="relative w-full h-full p-8">
          <div className="relative w-full h-full overflow-hidden rounded-2xl shadow-lg border backdrop-blur-sm">
            <Image src="/images/welcom.png" alt="Welcome" fill className="object-cover rounded-2xl" priority />
            <div className="absolute top-12 left-6 z-10">
              <Image
                src="/images/logo-bng.png"
                alt="BNG Logo"
                width={150}
                height={50}
                className="object-contain drop-shadow-md"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Activation Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image src="/images/logo-bng.png" alt="BNG Logo" width={150} height={50} className="object-contain" />
          </div>

          {/* Welcome Text */}
          <div className="space-y-2">
            <h1 className="text-5xl font-bold text-[hsl(45,93%,47%)]">Activation</h1>
            <p className="text-3xl font-semibold text-[hsl(123,38%,57%)]">
              de votre <span className="font-bold">compte MyBNG</span>
            </p>
          </div>

          {/* Activation Form */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[hsl(220,13%,13%)]">Finaliser votre inscription</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900">Le mot de passe doit contenir :</p>
                    <ul className="text-xs text-blue-700 space-y-0.5">
                      {getPasswordRequirements().map((req, index) => (
                        <li key={index} className="flex items-center space-x-1">
                          <span>•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-[hsl(220,13%,13%)]">
                  Email
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-12 pr-10 bg-white border-gray-300 focus:border-[hsl(123,38%,57%)] focus:ring-[hsl(123,38%,57%)]"
                    required
                    readOnly
                    disabled={isLoading || !!invitedEmail}
                  />
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* First Name Field */}
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-[hsl(220,13%,13%)]">
                  Prénom
                </Label>
                <div className="relative">
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="h-12 pr-10 bg-white border-gray-300 focus:border-[hsl(123,38%,57%)] focus:ring-[hsl(123,38%,57%)]"
                    required
                    disabled={isLoading}
                  />
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Last Name Field */}
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium text-[hsl(220,13%,13%)]">
                  Nom
                </Label>
                <div className="relative">
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="h-12 pr-10 bg-white border-gray-300 focus:border-[hsl(123,38%,57%)] focus:ring-[hsl(123,38%,57%)]"
                    required
                    disabled={isLoading}
                  />
                  <UserCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-[hsl(220,13%,13%)]">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className="h-12 pr-10 bg-white border-gray-300 focus:border-[hsl(123,38%,57%)] focus:ring-[hsl(123,38%,57%)]"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {formData.password && passwordErrors.length > 0 && (
                  <div className="text-xs text-red-600 space-y-0.5 mt-1">
                    {passwordErrors.map((err, index) => (
                      <p key={index}>• {err}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-[hsl(220,13%,13%)]">
                  Confirmer le mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="h-12 pr-10 bg-white border-gray-300 focus:border-[hsl(123,38%,57%)] focus:ring-[hsl(123,38%,57%)]"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-[hsl(45,93%,47%)] to-[hsl(123,38%,57%)] hover:opacity-90 text-white font-semibold text-base shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                    <span>Activation...</span>
                  </div>
                ) : (
                  "Activer mon compte"
                )}
              </Button>
            </form>
          </div>

          {/* Footer */}
          <div className="pt-8 text-center">
            <p className="text-sm font-semibold text-[hsl(220,13%,46%)]">BNG BANK INTERNATIONAL 2025 ©</p>
          </div>
        </div>
      </div>
    </div>
  )
}
