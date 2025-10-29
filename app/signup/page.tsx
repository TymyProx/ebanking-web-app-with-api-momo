"use client"

import type React from "react"
import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, User, Mail, Phone, MapPin } from "lucide-react"
import { signupUser } from "./actions"

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const formData = new FormData(e.target as HTMLFormElement)
      const fullName = formData.get("fullName") as string
      const email = formData.get("email") as string
      const phone = formData.get("phone") as string
      const address = formData.get("address") as string
      const password = formData.get("password") as string
      const confirmPassword = formData.get("confirmPassword") as string

      // Validate passwords match
      if (password !== confirmPassword) {
        setError("Les mots de passe ne correspondent pas")
        setIsLoading(false)
        return
      }

      const result = await signupUser({
        fullName,
        email,
        phone,
        address,
        password,
      })

      if (result.success) {
        if (result.requiresVerification) {
          router.push(`/auth/verify-email?email=${encodeURIComponent(result.email || email)}`)
        } else {
          router.push("/dashboard")
        }
      } else {
        setError(result.message)
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'inscription")
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

      {/* Right side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image src="/images/logo-bng.png" alt="BNG Logo" width={150} height={50} className="object-contain" />
          </div>

          {/* Welcome Text */}
          <div className="space-y-2">
            <h1 className="text-5xl font-bold text-[hsl(45,93%,47%)]">Rejoignez-nous</h1>
            <p className="text-3xl font-semibold text-[hsl(123,38%,57%)]">
              sur <span className="font-bold">MyBNG Bank</span>
            </p>
          </div>

          {/* Signup Form */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[hsl(220,13%,13%)]">Créer un compte</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Full Name Field */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-[hsl(220,13%,13%)]">
                  Nom complet
                </Label>
                <div className="relative">
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Votre nom complet"
                    className="h-12 pr-10 bg-white border-gray-300 focus:border-[hsl(123,38%,57%)] focus:ring-[hsl(123,38%,57%)]"
                    required
                    disabled={isLoading}
                  />
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                    name="email"
                    type="email"
                    placeholder="votre.email@exemple.com"
                    className="h-12 pr-10 bg-white border-gray-300 focus:border-[hsl(123,38%,57%)] focus:ring-[hsl(123,38%,57%)]"
                    required
                    disabled={isLoading}
                  />
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Phone Number Field */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-[hsl(220,13%,13%)]">
                  Numéro de téléphone
                </Label>
                <div className="relative">
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+225 XX XX XX XX XX"
                    className="h-12 pr-10 bg-white border-gray-300 focus:border-[hsl(123,38%,57%)] focus:ring-[hsl(123,38%,57%)]"
                    required
                    disabled={isLoading}
                  />
                  <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Address Field */}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium text-[hsl(220,13%,13%)]">
                  Adresse
                </Label>
                <div className="relative">
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    placeholder="Votre adresse complète"
                    className="h-12 pr-10 bg-white border-gray-300 focus:border-[hsl(123,38%,57%)] focus:ring-[hsl(123,38%,57%)]"
                    required
                    disabled={isLoading}
                  />
                  <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Créer un mot de passe"
                    className="h-12 pr-10 bg-white border-gray-300 focus:border-[hsl(123,38%,57%)] focus:ring-[hsl(123,38%,57%)]"
                    required
                    disabled={isLoading}
                    minLength={8}
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

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-[hsl(220,13%,13%)]">
                  Confirmer le mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirmer votre mot de passe"
                    className="h-12 pr-10 bg-white border-gray-300 focus:border-[hsl(123,38%,57%)] focus:ring-[hsl(123,38%,57%)]"
                    required
                    disabled={isLoading}
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                    <span>Inscription...</span>
                  </div>
                ) : (
                  "S'inscrire"
                )}
              </Button>

              {/* Login Link */}
              <div className="text-center">
                <p className="text-sm text-[hsl(220,13%,46%)]">
                  Vous avez déjà un compte ?{" "}
                  <Link href="/login" className="text-[hsl(123,38%,57%)] hover:underline font-semibold">
                    Se connecter
                  </Link>
                </p>
              </div>
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
