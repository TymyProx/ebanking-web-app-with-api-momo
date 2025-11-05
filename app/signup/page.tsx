"use client"

import type React from "react"
import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail, Phone, MapPin, UserCheck, UserPlus } from "lucide-react"
import { initiateSignup, initiateExistingClientSignup } from "./actions"

type ClientType = "new" | "existing" | null

export default function SignupPage() {
  const [clientType, setClientType] = useState<ClientType>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
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

      const result = await initiateExistingClientSignup({ clientCode })

      if (result.success) {
        setError("")

        // Show success message for 2 seconds before redirecting
        const successDiv = document.createElement("div")
        successDiv.className = "p-4 rounded-lg bg-green-50 border border-green-200 mb-4"
        successDiv.innerHTML = `<p class="text-sm text-green-600">${result.message}</p>`

        const form = e.target as HTMLFormElement
        form.insertBefore(successDiv, form.firstChild)

        setTimeout(() => {
          router.push(`/auth/verify-email?email=${encodeURIComponent(result.email!)}`)
        }, 2000)
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

          {clientType === null ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-[hsl(220,13%,13%)]">Choisissez votre profil</h2>

              <div className="space-y-4">
                {/* New Client Button */}
                <button
                  onClick={() => setClientType("new")}
                  className="w-full p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-[hsl(123,38%,57%)] hover:shadow-lg transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-r from-[hsl(45,93%,47%)] to-[hsl(123,38%,57%)] rounded-lg group-hover:scale-110 transition-transform">
                      <UserPlus className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-bold text-[hsl(220,13%,13%)]">Nouveau client</h3>
                      <p className="text-sm text-[hsl(220,13%,46%)]">Je n'ai pas encore de compte chez BNG Bank</p>
                    </div>
                  </div>
                </button>

                {/* Existing Client Button */}
                <button
                  onClick={() => setClientType("existing")}
                  className="w-full p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-[hsl(123,38%,57%)] hover:shadow-lg transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-r from-[hsl(45,93%,47%)] to-[hsl(123,38%,57%)] rounded-lg group-hover:scale-110 transition-transform">
                      <UserCheck className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-bold text-[hsl(220,13%,13%)]">Déjà client</h3>
                      <p className="text-sm text-[hsl(220,13%,46%)]">J'ai déjà un compte chez BNG Bank</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Login Link */}
              <div className="text-center pt-4">
                <p className="text-sm text-[hsl(220,13%,46%)]">
                  Vous avez déjà un compte utilisateur ?{" "}
                  <Link href="/login" className="text-[hsl(123,38%,57%)] hover:underline font-semibold">
                    Se connecter
                  </Link>
                </p>
              </div>
            </div>
          ) : clientType === "new" ? (
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <button onClick={() => setClientType(null)} className="text-[hsl(123,38%,57%)] hover:underline text-sm">
                  ← Retour
                </button>
              </div>

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
                  className="w-full h-12 bg-gradient-to-r from-[hsl(45,93%,47%)] to-[hsl(123,38%,57%)] hover:opacity-90 text-white font-semibold text-base shadow-lg"
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
          ) : (
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <button onClick={() => setClientType(null)} className="text-[hsl(123,38%,57%)] hover:underline text-sm">
                  ← Retour
                </button>
              </div>

              <h2 className="text-2xl font-bold text-[hsl(220,13%,13%)]">Activer mon compte en ligne</h2>
              <p className="text-sm text-[hsl(220,13%,46%)]">
                Entrez votre code client pour créer votre accès en ligne
              </p>

              <form onSubmit={handleExistingClientSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Client Code Field */}
                <div className="space-y-2">
                  <Label htmlFor="clientCode" className="text-sm font-medium text-[hsl(220,13%,13%)]">
                    Code Client
                  </Label>
                  <div className="relative">
                    <Input
                      id="clientCode"
                      name="clientCode"
                      type="text"
                      placeholder="CLI-XXXXXXXXXX"
                      className="h-12 pr-10 bg-white border-gray-300 focus:border-[hsl(123,38%,57%)] focus:ring-[hsl(123,38%,57%)]"
                      required
                      disabled={isLoading}
                    />
                    <UserCheck className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-xs text-[hsl(220,13%,46%)]">
                    Vous trouverez votre code client sur vos documents bancaires
                  </p>
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
                      <span>Vérification...</span>
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
          )}

          {/* Footer */}
          <div className="pt-8 text-center">
            <p className="text-sm font-semibold text-[hsl(220,13%,46%)]">BNG BANK INTERNATIONAL 2025 ©</p>
          </div>
        </div>
      </div>
    </div>
  )
}
