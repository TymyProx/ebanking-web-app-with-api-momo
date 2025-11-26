"use client"

import type React from "react"
import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail, Phone, MapPin, CreditCard } from "lucide-react"
import { initiateSignup, initiateExistingClientSignup } from "./actions"

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [clientType, setClientType] = useState<"new" | "existing" | null>(null)
  const [verificationSent, setVerificationSent] = useState(false)
  const [maskedEmail, setMaskedEmail] = useState("")
  const router = useRouter()

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

      console.log("[v0] Submitting existing client code:", clientCode)

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

  if (verificationSent && maskedEmail) {
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

        {/* Right side - Success Message */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <Image src="/images/logo-bng.png" alt="BNG Logo" width={150} height={50} className="object-contain" />
            </div>

            {/* Success Message Content */}
            <div className="space-y-6">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="w-10 h-10 text-green-600" />
              </div>

              <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-[hsl(45,93%,47%)]">Email envoyé !</h1>
                <p className="text-lg text-[hsl(220,13%,46%)]">
                  Un email de vérification a été envoyé à{" "}
                  <span className="font-semibold text-[hsl(220,13%,13%)]">{maskedEmail}</span>
                </p>
                <p className="text-sm text-[hsl(220,13%,46%)] px-4">
                  Veuillez cliquer sur le lien dans l'email pour définir votre mot de passe et activer votre compte.
                </p>
              </div>

              <Button
                onClick={() => router.push("/login")}
                className="w-full h-12 bg-primary hover:opacity-90 text-white font-semibold text-base shadow-lg"
              >
                Retour à la connexion
              </Button>
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

  if (!clientType) {
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

        {/* Right side - Client Type Selection */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <Image src="/images/logo-bng.png" alt="BNG Logo" width={150} height={50} className="object-contain" />
            </div>

            {/* Welcome Text */}
            <div className="space-y-2">
              <h1 className="text-5xl font-bold text-[hsl(45,93%,47%)]">Rejoignez-nous</h1>
              <p className="text-3xl font-semibold text-primary">
                sur <span className="font-bold">MyBNG Bank</span>
              </p>
            </div>

            {/* Client Type Selection */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-[hsl(220,13%,13%)]">Choisissez votre profil</h2>

              <div className="space-y-4">
                <button
                  onClick={() => setClientType("new")}
                  className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-[hsl(123,38%,57%)] hover:bg-green-50 transition-all text-left group"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-[hsl(123,38%,57%)]/10 rounded-lg group-hover:bg-[hsl(123,38%,57%)]/20">
                      <User className="w-6 h-6 text-[hsl(123,38%,57%)]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[hsl(220,13%,13%)] mb-1">Nouveau client</h3>
                      <p className="text-sm text-[hsl(220,13%,46%)]">
                        Je n'ai pas encore de compte chez BNG Bank et je souhaite en créer un
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setClientType("existing")}
                  className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-[hsl(45,93%,47%)] hover:bg-yellow-50 transition-all text-left group"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-[hsl(45,93%,47%)]/10 rounded-lg group-hover:bg-[hsl(45,93%,47%)]/20">
                      <CreditCard className="w-6 h-6 text-[hsl(45,93%,47%)]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[hsl(220,13%,13%)] mb-1">Déjà client</h3>
                      <p className="text-sm text-[hsl(220,13%,46%)]">
                        J'ai déjà un compte chez BNG Bank et je souhaite activer mon accès en ligne
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Login Link */}
              <div className="text-center pt-4">
                <p className="text-sm text-[hsl(220,13%,46%)]">
                  Vous avez déjà un compte en ligne ?{" "}
                  <Link href="/login" className="text-[hsl(123,38%,57%)] hover:underline font-semibold">
                    Se connecter
                  </Link>
                </p>
              </div>
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

  if (clientType === "existing") {
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

        {/* Right side - Existing Client Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <Image src="/images/logo-bng.png" alt="BNG Logo" width={150} height={50} className="object-contain" />
            </div>

            {/* Back Button */}
            <button
              onClick={() => setClientType(null)}
              className="text-sm text-[hsl(123,38%,57%)] hover:underline flex items-center space-x-1"
            >
              <span>←</span>
              <span>Retour</span>
            </button>

            {/* Welcome Text */}
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-[hsl(45,93%,47%)]">Déjà client</h1>
              <p className="text-lg text-[hsl(220,13%,46%)]">Activez votre accès en ligne</p>
            </div>

            {/* Existing Client Form */}
            <form onSubmit={handleExistingClientSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="clientCode" className="text-sm font-medium text-[hsl(220,13%,13%)]">
                  Racine du compte
                </Label>
                <div className="relative">
                  <Input
                    id="clientCode"
                    name="clientCode"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="Entrez votre racine du compte"
                    className="h-12 pr-10 bg-white border-gray-300 focus:border-[hsl(123,38%,57%)] focus:ring-[hsl(123,38%,57%)]"
                    required
                    disabled={isLoading}
                    onInput={(e) => {
                      // Only allow digits
                      const target = e.target as HTMLInputElement
                      target.value = target.value.replace(/[^0-9]/g, "")
                    }}
                  />
                  <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                <p className="text-xs text-[hsl(220,13%,46%)]">
                  Vous trouverez votre racine du compte sur vos documents bancaires
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:opacity-90 text-white font-semibold text-base shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                    <span>Vérification...</span>
                  </div>
                ) : (
                  "Continuer"
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="pt-8 text-center">
              <p className="text-sm font-semibold text-[hsl(220,13%,46%)]">BNG BANK INTERNATIONAL 2025 ©</p>
            </div>
          </div>
        </div>
      </div>
    )
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

      {/* Right side - New Client Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image src="/images/logo-bng.png" alt="BNG Logo" width={150} height={50} className="object-contain" />
          </div>

          {/* Back Button */}
          <button
            onClick={() => setClientType(null)}
            className="text-sm text-[hsl(123,38%,57%)] hover:underline flex items-center space-x-1"
          >
            <span>←</span>
            <span>Retour</span>
          </button>

          {/* Welcome Text */}
          <div className="space-y-2">
            <h1 className="text-5xl font-bold text-[hsl(45,93%,47%)]">Rejoignez-nous</h1>
            <p className="text-3xl font-semibold text-primary">
              sur <span className="font-bold">MyBNG Bank</span>
            </p>
          </div>

          {/* Signup Form */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[hsl(220,13%,13%)]">Créer un compte</h2>

            <form onSubmit={handleNewClientSubmit} className="space-y-5">
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

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:opacity-90 text-white font-semibold text-base shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                    <span>Envoi...</span>
                  </div>
                ) : (
                  "Continuer"
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
