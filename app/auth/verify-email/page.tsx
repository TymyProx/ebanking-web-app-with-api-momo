"use client"

import type React from "react"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Loader2, Mail, Eye, EyeOff } from "lucide-react"
import { completeSignup } from "./actions"

function VerifyEmailContent() {
  const [status, setStatus] = useState<"pending" | "setting-password" | "creating" | "success" | "error">("pending")
  const [message, setMessage] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  useEffect(() => {
    if (token) {
      setStatus("setting-password")
    }
  }, [token])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères")
      return
    }

    if (!token) {
      setError("Token de vérification manquant")
      return
    }

    setStatus("creating")

    const result = await completeSignup(token, password)

    if (result.success) {
      setStatus("success")
      setMessage(result.message)
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } else {
      setStatus("error")
      setMessage(result.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <Image src="/images/logo-bng.png" alt="BNG Logo" width={150} height={50} className="object-contain" />
          </div>

          {/* Status Content */}
          <div className="text-center space-y-4">
            {status === "pending" && (
              <>
                <div className="flex justify-center">
                  <Mail className="h-16 w-16 text-[hsl(123,38%,57%)]" />
                </div>
                <h1 className="text-2xl font-bold text-[hsl(220,13%,13%)]">Vérifiez votre email</h1>
                <p className="text-[hsl(220,13%,46%)]">
                  Un email de vérification a été envoyé à <strong>{email}</strong>
                </p>
                <p className="text-sm text-[hsl(220,13%,46%)]">
                  Veuillez cliquer sur le lien dans l'email pour continuer votre inscription.
                </p>
              </>
            )}

            {status === "setting-password" && (
              <>
                <h1 className="text-2xl font-bold text-[hsl(220,13%,13%)]">Définissez votre mot de passe</h1>
                <p className="text-[hsl(220,13%,46%)]">Créez un mot de passe sécurisé pour votre compte</p>

                <form onSubmit={handlePasswordSubmit} className="space-y-4 text-left">
                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

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
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                    className="w-full h-12 bg-gradient-to-r from-[hsl(45,93%,47%)] to-[hsl(123,38%,57%)] hover:opacity-90 text-white font-semibold"
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
                <h1 className="text-2xl font-bold text-[hsl(220,13%,13%)]">Création de votre compte...</h1>
                <p className="text-[hsl(220,13%,46%)]">
                  Veuillez patienter pendant que nous finalisons votre inscription.
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold text-[hsl(220,13%,13%)]">Compte créé avec succès !</h1>
                <p className="text-[hsl(220,13%,46%)]">{message}</p>
                <p className="text-sm text-[hsl(220,13%,46%)]">Redirection vers votre tableau de bord...</p>
              </>
            )}

            {status === "error" && (
              <>
                <div className="flex justify-center">
                  <XCircle className="h-16 w-16 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-[hsl(220,13%,13%)]">Erreur</h1>
                <p className="text-[hsl(220,13%,46%)]">{message}</p>
                <Button
                  onClick={() => router.push("/signup")}
                  className="w-full bg-[hsl(123,38%,57%)] hover:bg-[hsl(123,38%,47%)] text-white"
                >
                  Retour à l'inscription
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm font-semibold text-[hsl(220,13%,46%)]">BNG BANK INTERNATIONAL 2025 ©</p>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(123,38%,57%)]" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
