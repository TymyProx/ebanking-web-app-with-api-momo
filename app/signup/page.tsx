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
      <div
        className="min-h-screen flex"
        style={{
          backgroundImage: "url('/images/background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Left side - Hero Image with Green Background */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute -top-24 -left-40 w-72 h-72">
              <div className="w-full h-full bg-[#B9E3A8] rounded-full opacity-40" />
            </div>

            <div className="absolute left-[-60%] top-[40%] w-[1000px] h-[1000px]">
              <div className="w-full h-full bg-[#B9E3A8] rounded-full opacity-50" />
            </div>

            {/* Floating money/card graphics */}
            <div className="absolute top-[25%] right-[25%]">
              <img
                src="/images/billet.png"
                alt="billet"
                className="w-[320px] h-auto object-contain rotate-12 drop-shadow-lg"
              />
            </div>
          </div>

          {/* Logo */}
          <div className="absolute top-4 left-18 z-20 translate-x-4">
            <div className="group flex h-[200px] w-[200px] items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-all duration-500 hover:bg-white/20 hover:shadow-[0_0_40px_rgba(244,196,48,0.4)]">
              <Image
                src="/images/logowhite.png"
                alt="BNG Logo"
                width={300}
                height={200}
                className="object-contain scale-125 transition-transform duration-500 group-hover:scale-140"
                priority
              />
            </div>
          </div>

          <div className="relative z-10 flex items-end justify-start w-full h-full pb-0">
            <div className="relative flex justify-start items-end max-w-[420px] w-full">
              <Image
                src="/images/image.png"
                alt="Welcome"
                width={300}
                height={400}
                className="object-contain object-bottom drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>

        {/* Right side - Success Message */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative overflow-hidden">
          <div className="absolute -bottom-20 -right-20 w-40 h-40">
            <div className="w-full h-full bg-[#B9E3A8] rounded-full opacity-20" />
          </div>

          <div className="w-full max-w-md space-y-8 relative z-10">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <Image src="/images/logowhite.png" alt="BNG Logo" width={180} height={60} className="object-contain" />
            </div>

            {/* Success Message Content */}
            <div className="space-y-6">
              <div className="mx-auto w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Mail className="w-10 h-10 text-white" />
              </div>

              <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-white">Email envoyé !</h1>
                <p className="text-lg text-white/90">
                  Un email de vérification a été envoyé à{" "}
                  <span className="font-semibold text-white">{maskedEmail}</span>
                </p>
                <p className="text-sm text-white/80 px-4">
                  Veuillez cliquer sur le lien dans l'email pour définir votre mot de passe et activer votre compte.
                </p>
              </div>

              <Button
                onClick={() => router.push("/login")}
                className="w-full h-12 bg-[#f4c430] hover:bg-[#e0b020] text-gray-900 font-bold text-base shadow-lg uppercase tracking-wide"
              >
                Retour à la connexion
              </Button>
            </div>

            {/* Footer */}
            <div className="pt-8 text-center">
              <p className="text-sm font-semibold text-white/80">BNG BANK INTERNATIONAL 2025 ©</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!clientType) {
    return (
      <div
        className="min-h-screen flex"
        style={{
          backgroundImage: "url('/images/background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Left side - Hero Image with Green Background */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute -top-24 -left-40 w-72 h-72">
              <div className="w-full h-full bg-[#B9E3A8] rounded-full opacity-40" />
            </div>

            <div className="absolute left-[-60%] top-[40%] w-[1000px] h-[1000px]">
              <div className="w-full h-full bg-[#B9E3A8] rounded-full opacity-50" />
            </div>

            {/* Floating money/card graphics */}
            <div className="absolute top-[25%] right-[25%]">
              <img
                src="/images/billet.png"
                alt="billet"
                className="w-[320px] h-auto object-contain rotate-12 drop-shadow-lg"
              />
            </div>
          </div>

          {/* Logo */}
          <div className="absolute top-4 left-18 z-20 translate-x-4">
            <div className="group flex h-[200px] w-[200px] items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-all duration-500 hover:bg-white/20 hover:shadow-[0_0_40px_rgba(244,196,48,0.4)]">
              <Image
                src="/images/logowhite.png"
                alt="BNG Logo"
                width={300}
                height={200}
                className="object-contain scale-125 transition-transform duration-500 group-hover:scale-140"
                priority
              />
            </div>
          </div>

          <div className="relative z-10 flex items-end justify-start w-full h-full pb-0">
            <div className="relative flex justify-start items-end max-w-[420px] w-full">
              <Image
                src="/images/image.png"
                alt="Welcome"
                width={300}
                height={400}
                className="object-contain object-bottom drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>

        {/* Right side - Client Type Selection */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative overflow-hidden">
          <div className="absolute -bottom-20 -right-20 w-40 h-40">
            <div className="w-full h-full bg-[#B9E3A8] rounded-full opacity-20" />
          </div>

          <div className="w-full max-w-md space-y-8 relative z-10">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <Image src="/images/logowhite.png" alt="BNG Logo" width={180} height={60} className="object-contain" />
            </div>

            {/* Welcome Text */}
            <div className="space-y-2">
              <h1 className="text-5xl font-bold text-white">Rejoignez-nous</h1>
              <p className="text-3xl font-semibold text-white/90">
                sur <span className="font-bold">MyBNG Bank</span>
              </p>
            </div>

            {/* Client Type Selection */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Choisissez votre profil</h2>

              <div className="space-y-4">
                <button
                  onClick={() => setClientType("new")}
                  className="w-full p-6 border-2 border-white/30 bg-white/10 backdrop-blur-sm rounded-xl hover:border-white/60 hover:bg-white/20 transition-all text-left group"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-white/20 rounded-lg group-hover:bg-white/30">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">Nouveau client</h3>
                      <p className="text-sm text-white/80">
                        Je n'ai pas encore de compte chez BNG Bank et je souhaite en créer un
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setClientType("existing")}
                  className="w-full p-6 border-2 border-white/30 bg-white/10 backdrop-blur-sm rounded-xl hover:border-[#f4c430] hover:bg-[#f4c430]/20 transition-all text-left group"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-[#f4c430]/20 rounded-lg group-hover:bg-[#f4c430]/30">
                      <CreditCard className="w-6 h-6 text-[#f4c430]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">Déjà client</h3>
                      <p className="text-sm text-white/80">
                        J'ai déjà un compte chez BNG Bank et je souhaite activer mon accès en ligne
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Login Link */}
              <div className="text-center pt-4">
                <p className="text-sm text-white/80">
                  Vous avez déjà un compte en ligne ?{" "}
                  <Link href="/login" className="text-[#f4c430] hover:underline font-semibold">
                    Se connecter
                  </Link>
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-8 text-center">
              <p className="text-sm font-semibold text-white/80">BNG BANK INTERNATIONAL 2025 ©</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (clientType === "existing") {
    return (
      <div
        className="min-h-screen flex"
        style={{
          backgroundImage: "url('/images/background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Left side - Hero Image with Green Background */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute -top-24 -left-40 w-72 h-72">
              <div className="w-full h-full bg-[#B9E3A8] rounded-full opacity-40" />
            </div>

            <div className="absolute left-[-60%] top-[40%] w-[1000px] h-[1000px]">
              <div className="w-full h-full bg-[#B9E3A8] rounded-full opacity-50" />
            </div>

            {/* Floating money/card graphics */}
            <div className="absolute top-[25%] right-[25%]">
              <img
                src="/images/billet.png"
                alt="billet"
                className="w-[320px] h-auto object-contain rotate-12 drop-shadow-lg"
              />
            </div>
          </div>

          {/* Logo */}
          <div className="absolute top-4 left-18 z-20 translate-x-4">
            <div className="group flex h-[200px] w-[200px] items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-all duration-500 hover:bg-white/20 hover:shadow-[0_0_40px_rgba(244,196,48,0.4)]">
              <Image
                src="/images/logowhite.png"
                alt="BNG Logo"
                width={300}
                height={200}
                className="object-contain scale-125 transition-transform duration-500 group-hover:scale-140"
                priority
              />
            </div>
          </div>

          <div className="relative z-10 flex items-end justify-start w-full h-full pb-0">
            <div className="relative flex justify-start items-end max-w-[420px] w-full">
              <Image
                src="/images/image.png"
                alt="Welcome"
                width={300}
                height={400}
                className="object-contain object-bottom drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>

        {/* Right side - Existing Client Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative overflow-hidden">
          <div className="absolute -bottom-20 -right-20 w-40 h-40">
            <div className="w-full h-full bg-[#B9E3A8] rounded-full opacity-20" />
          </div>

          <div className="w-full max-w-md space-y-6 relative z-10">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <Image src="/images/logowhite.png" alt="BNG Logo" width={180} height={60} className="object-contain" />
            </div>

            {/* Back Button */}
            <button
              onClick={() => setClientType(null)}
              className="text-sm text-white hover:text-white/80 flex items-center space-x-1 font-semibold"
            >
              <span>←</span>
              <span>Retour</span>
            </button>

            {/* Welcome Text */}
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-white">Déjà client</h1>
              <p className="text-lg text-white/90">Activez votre accès en ligne</p>
            </div>

            {/* Existing Client Form */}
            <form onSubmit={handleExistingClientSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/90 border border-red-600">
                  <p className="text-sm text-white">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="clientCode" className="text-sm font-medium text-white uppercase tracking-wide">
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
                    className="h-11 bg-[#6dd47e]/30 border border-[#6dd47e]/50 text-white pr-10 placeholder:text-white/60 focus:bg-[#6dd47e]/40 focus:border-[#6dd47e] focus:ring-0 backdrop-blur-sm"
                    required
                    disabled={isLoading}
                    onInput={(e) => {
                      const target = e.target as HTMLInputElement
                      target.value = target.value.replace(/[^0-9]/g, "")
                    }}
                  />
                  <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/70" />
                </div>
                <p className="text-xs text-white/70">
                  Vous trouverez votre racine du compte sur vos documents bancaires
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#f4c430] hover:bg-[#e0b020] text-gray-900 font-bold text-base shadow-lg uppercase tracking-wide"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-900/30 border-t-gray-900"></div>
                    <span>Vérification...</span>
                  </div>
                ) : (
                  "Continuer"
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="pt-8 text-center">
              <p className="text-sm font-semibold text-white/80">BNG BANK INTERNATIONAL 2025 ©</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex"
      style={{
        backgroundImage: "url('/images/background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Left side - Hero Image with Green Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-24 -left-40 w-72 h-72">
            <div className="w-full h-full bg-[#B9E3A8] rounded-full opacity-40" />
          </div>

          <div className="absolute left-[-60%] top-[40%] w-[1000px] h-[1000px]">
            <div className="w-full h-full bg-[#B9E3A8] rounded-full opacity-50" />
          </div>

          {/* Floating money/card graphics */}
          <div className="absolute top-[25%] right-[25%]">
            <img
              src="/images/billet.png"
              alt="billet"
              className="w-[320px] h-auto object-contain rotate-12 drop-shadow-lg"
            />
          </div>
        </div>

        {/* Logo */}
        <div className="absolute top-4 left-18 z-20 translate-x-4">
          <div className="group flex h-[200px] w-[200px] items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-all duration-500 hover:bg-white/20 hover:shadow-[0_0_40px_rgba(244,196,48,0.4)]">
            <Image
              src="/images/logowhite.png"
              alt="BNG Logo"
              width={300}
              height={200}
              className="object-contain scale-125 transition-transform duration-500 group-hover:scale-140"
              priority
            />
          </div>
        </div>

        <div className="relative z-10 flex items-end justify-start w-full h-full pb-0">
          <div className="relative flex justify-start items-end max-w-[420px] w-full">
            <Image
              src="/images/image.png"
              alt="Welcome"
              width={300}
              height={400}
              className="object-contain object-bottom drop-shadow-2xl"
              priority
            />
          </div>
        </div>
      </div>

      {/* Right side - New Client Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute -bottom-20 -right-20 w-40 h-40">
          <div className="w-full h-full bg-[#B9E3A8] rounded-full opacity-20" />
        </div>

        <div className="w-full max-w-md space-y-6 relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image src="/images/logowhite.png" alt="BNG Logo" width={180} height={60} className="object-contain" />
          </div>

          {/* Back Button */}
          <button
            onClick={() => setClientType(null)}
            className="text-sm text-white hover:text-white/80 flex items-center space-x-1 font-semibold"
          >
            <span>←</span>
            <span>Retour</span>
          </button>

          {/* Welcome Text */}
          <div className="space-y-2">
            <h1 className="text-5xl font-bold text-white">Rejoignez-nous</h1>
            <p className="text-2xl font-semibold text-white/90">
              sur <span className="font-bold">MyBNG Bank</span>
            </p>
          </div>

          {/* Signup Form */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Créer un compte</h2>

            <form onSubmit={handleNewClientSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/90 border border-red-600">
                  <p className="text-sm text-white">{error}</p>
                </div>
              )}

              {/* Full Name Field */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-white uppercase tracking-wide">
                  Nom complet
                </Label>
                <div className="relative">
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Votre nom complet"
                    className="h-11 bg-[#6dd47e]/30 border border-[#6dd47e]/50 text-white pr-10 placeholder:text-white/60 focus:bg-[#6dd47e]/40 focus:border-[#6dd47e] focus:ring-0 backdrop-blur-sm"
                    required
                    disabled={isLoading}
                  />
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/70" />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-white uppercase tracking-wide">
                  Email
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="votre.email@exemple.com"
                    className="h-11 bg-[#6dd47e]/30 border border-[#6dd47e]/50 text-white pr-10 placeholder:text-white/60 focus:bg-[#6dd47e]/40 focus:border-[#6dd47e] focus:ring-0 backdrop-blur-sm"
                    required
                    disabled={isLoading}
                  />
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/70" />
                </div>
              </div>

              {/* Phone Number Field */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-white uppercase tracking-wide">
                  Numéro de téléphone
                </Label>
                <div className="relative">
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+225 XX XX XX XX XX"
                    className="h-11 bg-[#6dd47e]/30 border border-[#6dd47e]/50 text-white pr-10 placeholder:text-white/60 focus:bg-[#6dd47e]/40 focus:border-[#6dd47e] focus:ring-0 backdrop-blur-sm"
                    required
                    disabled={isLoading}
                  />
                  <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/70" />
                </div>
              </div>

              {/* Address Field */}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium text-white uppercase tracking-wide">
                  Adresse
                </Label>
                <div className="relative">
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    placeholder="Votre adresse complète"
                    className="h-11 bg-[#6dd47e]/30 border border-[#6dd47e]/50 text-white pr-10 placeholder:text-white/60 focus:bg-[#6dd47e]/40 focus:border-[#6dd47e] focus:ring-0 backdrop-blur-sm"
                    required
                    disabled={isLoading}
                  />
                  <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/70" />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-[#f4c430] hover:bg-[#e0b020] text-gray-900 font-bold text-base shadow-lg uppercase tracking-wide"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-900/30 border-t-gray-900"></div>
                    <span>Inscription...</span>
                  </div>
                ) : (
                  "S'inscrire"
                )}
              </Button>

              {/* Login Link */}
              <div className="text-center pt-2">
                <p className="text-sm text-white/80">
                  Vous avez déjà un compte ?{" "}
                  <Link href="/login" className="text-[#f4c430] hover:underline font-semibold uppercase tracking-wide">
                    Se connecter
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="pt-8 text-center">
            <p className="text-sm font-semibold text-white/80">BNG BANK INTERNATIONAL 2025 ©</p>
          </div>
        </div>
      </div>
    </div>
  )
}
