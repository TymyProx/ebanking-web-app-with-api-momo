"use client"

import type React from "react"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Loader2, Mail, Eye, EyeOff } from "lucide-react"
import { completeSignup } from "./actions"
import { validatePassword } from "@/lib/password-validation"

function VerifyEmailContent() {
  const [status, setStatus] = useState<"pending" | "setting-password" | "creating" | "success" | "error">("pending")
  const [message, setMessage] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const email = searchParams.get("email")

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

      {/* Right side - Verification Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute -bottom-20 -right-20 w-40 h-40">
          <div className="w-full h-full bg-[#B9E3A8] rounded-full opacity-20" />
        </div>

        <div className="w-full max-w-md space-y-6 relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image src="/images/logowhite.png" alt="BNG Logo" width={180} height={60} className="object-contain" />
          </div>

          {/* Status Content */}
          <div className="space-y-6">
            {status === "pending" && (
              <>
                <div className="flex justify-center">
                  <div className="mx-auto w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Mail className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div className="text-center space-y-4">
                  <h1 className="text-3xl font-bold text-white">Vérifiez votre email</h1>
                  <p className="text-lg text-white/90">
                    Un email de vérification a été envoyé à <strong className="text-white">{email}</strong>
                  </p>
                  <p className="text-sm text-white/80">
                    Veuillez cliquer sur le lien dans l'email pour continuer votre inscription.
                  </p>
                </div>
              </>
            )}

            {status === "setting-password" && (
              <>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-white text-center mb-8">Définissez votre mot de passe</h1>
                  <p className="text-white/90 text-center">Créez un mot de passe sécurisé pour votre compte</p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/90 border border-red-600">
                      <p className="text-sm text-white">{error}</p>
                    </div>
                  )}

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-white uppercase tracking-wide">
                      Mot de passe
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Créer un mot de passe"
                        className="h-11 bg-[#6dd47e]/30 border border-[#6dd47e]/50 text-white pr-10 placeholder:text-white/60 focus:bg-[#6dd47e]/40 focus:border-[#6dd47e] focus:ring-0 backdrop-blur-sm"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {/* Real-time Password Validation Errors */}
                    {password && passwordErrors.length > 0 && (
                      <div className="text-xs text-red-300 space-y-0.5 mt-1">
                        {passwordErrors.map((err, index) => (
                          <p key={index}>• {err}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-white uppercase tracking-wide">
                      Confirmer le mot de passe
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirmer votre mot de passe"
                        className="h-11 bg-[#6dd47e]/30 border border-[#6dd47e]/50 text-white pr-10 placeholder:text-white/60 focus:bg-[#6dd47e]/40 focus:border-[#6dd47e] focus:ring-0 backdrop-blur-sm"
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-[#f4c430] hover:bg-[#e0b020] text-gray-900 font-bold text-base shadow-lg uppercase tracking-wide"
                  >
                    Créer mon compte
                  </Button>
                </form>
              </>
            )}

            {status === "creating" && (
              <>
                <div className="flex justify-center">
                  <Loader2 className="h-16 w-16 text-white animate-spin" />
                </div>
                <div className="space-y-2 text-center">
                  <h1 className="text-3xl font-bold text-white">Création de votre compte...</h1>
                  <p className="text-white/90">Veuillez patienter pendant que nous finalisons votre inscription.</p>
                </div>
              </>
            )}

            {status === "success" && (
              <>
                <div className="flex justify-center">
                  <div className="mx-auto w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div className="space-y-4 text-center">
                  <h1 className="text-3xl font-bold text-white">Compte créé avec succès !</h1>
                  <p className="text-white/90">{message}</p>
                  <div className="pt-4">
                    <p className="text-sm text-white/80 mb-3">
                      Vous pouvez maintenant vous connecter avec vos identifiants
                    </p>
                    <Link href="/login">
                      <Button className="w-full h-12 bg-[#f4c430] hover:bg-[#e0b020] text-gray-900 font-bold text-base shadow-lg uppercase tracking-wide">
                        Se connecter
                      </Button>
                    </Link>
                  </div>
                </div>
              </>
            )}

            {status === "error" && (
              <>
                <div className="flex justify-center">
                  <div className="mx-auto w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-red-400" />
                  </div>
                </div>
                <div className="space-y-4 text-center">
                  <h1 className="text-3xl font-bold text-white">Erreur</h1>
                  <p className="text-white/90">{message}</p>
                  <Button
                    onClick={() => router.push("/signup")}
                    className="w-full h-12 bg-[#f4c430] hover:bg-[#e0b020] text-gray-900 font-bold text-base shadow-lg uppercase tracking-wide"
                  >
                    Retour à l'inscription
                  </Button>
                </div>
              </>
            )}
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

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(123,38%,57%)]" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
