"use client"

import type React from "react"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Loader2, Mail, Eye, EyeOff, AlertCircle } from "lucide-react"
import { completeSignup } from "./actions"
import { validatePassword, getPasswordRequirements } from "@/lib/password-validation"

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

      {/* Right side - Verification Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image src="/images/logo-bng.png" alt="BNG Logo" width={150} height={50} className="object-contain" />
          </div>

          {/* Status Content */}
          <div className="space-y-6">
            {status === "pending" && (
              <>
                <div className="flex justify-center">
                  <Mail className="h-16 w-16 text-[hsl(123,38%,57%)]" />
                </div>
                <div className="text-center space-y-2">
                  <h1 className="text-3xl font-bold text-[hsl(220,13%,13%)]">Vérifiez votre email</h1>
                  <p className="text-[hsl(220,13%,46%)]">
                    Un email de vérification a été envoyé à <strong>{email}</strong>
                  </p>
                  <p className="text-sm text-[hsl(220,13%,46%)]">
                    Veuillez cliquer sur le lien dans l'email pour continuer votre inscription.
                  </p>
                </div>
              </>
            )}

            {status === "setting-password" && (
              <>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-[hsl(45,93%,47%)]">
                    Nous-y sommes presque ! Définissez votre mot de passe
                  </h1>
                  <p className="text-[hsl(220,13%,46%)]">Créez un mot de passe sécurisé pour votre compte</p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  {/* Password Requirements Info Box */}
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
                        minLength={8}
                        value={password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {/* Real-time Password Validation Errors */}
                    {password && passwordErrors.length > 0 && (
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
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirmer votre mot de passe"
                        className="h-12 pr-10 bg-white border-gray-300 focus:border-[hsl(123,38%,57%)] focus:ring-[hsl(123,38%,57%)]"
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-[hsl(45,93%,47%)] to-[hsl(123,38%,57%)] hover:opacity-90 text-white font-semibold text-base shadow-lg"
                  >
                    Créer mon compte
                  </Button>
                </form>
              </>
            )}

            {status === "creating" && (
              <>
                <div className="flex justify-center">
                  <Loader2 className="h-16 w-16 text-[hsl(123,38%,57%)] animate-spin" />
                </div>
                <div className="space-y-2 text-center">
                  <h1 className="text-3xl font-bold text-[hsl(220,13%,13%)]">Création de votre compte...</h1>
                  <p className="text-[hsl(220,13%,46%)]">
                    Veuillez patienter pendant que nous finalisons votre inscription.
                  </p>
                </div>
              </>
            )}

            {status === "success" && (
              <>
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <div className="space-y-4 text-center">
                  <h1 className="text-3xl font-bold text-[hsl(220,13%,13%)]">Compte créé avec succès !</h1>
                  <p className="text-[hsl(220,13%,46%)]">{message}</p>
                  <div className="pt-4">
                    <p className="text-sm text-[hsl(220,13%,46%)] mb-3">
                      Vous pouvez maintenant vous connecter avec vos identifiants
                    </p>
                    <Link href="/login">
                      <Button className="w-full h-12 bg-gradient-to-r from-[hsl(45,93%,47%)] to-[hsl(123,38%,57%)] hover:opacity-90 text-white font-semibold text-base shadow-lg">
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
                  <XCircle className="h-16 w-16 text-red-500" />
                </div>
                <div className="space-y-4 text-center">
                  <h1 className="text-3xl font-bold text-[hsl(220,13%,13%)]">Erreur</h1>
                  <p className="text-[hsl(220,13%,46%)]">{message}</p>
                  <Button
                    onClick={() => router.push("/signup")}
                    className="w-full h-12 bg-gradient-to-r from-[hsl(45,93%,47%)] to-[hsl(123,38%,57%)] hover:opacity-90 text-white font-semibold"
                  >
                    Retour à l'inscription
                  </Button>
                </div>
              </>
            )}
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
