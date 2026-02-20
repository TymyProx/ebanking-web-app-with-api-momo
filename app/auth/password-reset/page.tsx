"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, CheckCircle, AlertCircle, KeyRound, Eye, EyeOff } from "lucide-react"
import AuthService from "@/lib/auth-service"
import { validatePassword } from "@/lib/password-validation"

export default function PasswordResetPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const passwordErrors = useMemo(() => {
    if (!password) return []
    return validatePassword(password).errors
  }, [password])

  const canSubmit = useMemo(() => {
    const v = validatePassword(password)
    return token && v.isValid && password === confirmPassword && !isLoading
  }, [token, password, confirmPassword, isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!token) {
      setMessage({ type: "error", text: "Token manquant ou invalide." })
      return
    }

    const v = validatePassword(password)
    if (!v.isValid) {
      setMessage({ type: "error", text: v.errors.join(", ") })
      return
    }
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Les mots de passe ne correspondent pas." })
      return
    }

    setIsLoading(true)
    try {
      await AuthService.passwordReset(token, password)
      setMessage({ type: "success", text: "Mot de passe réinitialisé. Vous pouvez vous connecter." })
      setTimeout(() => router.push("/login"), 800)
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Erreur lors de la réinitialisation." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <Link href="/login" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la connexion
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-[#34763E]/10 flex items-center justify-center">
              <KeyRound className="h-5 w-5 text-[#34763E]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Réinitialiser le mot de passe</h1>
              <p className="text-sm text-gray-600">Choisissez un nouveau mot de passe</p>
            </div>
          </div>

          {!token && (
            <Alert className="mb-4 border-red-500 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">Token manquant. Ouvrez le lien reçu par email.</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert className={`mb-4 ${message.type === "success" ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}>
              {message.type === "success" ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label="Afficher / masquer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.length > 0 && (
                <div className="text-xs text-red-600 space-y-1">
                  {passwordErrors.map((err, idx) => (
                    <p key={idx}>• {err}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label="Afficher / masquer"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full bg-[#34763E] hover:bg-[#2a5f32]" disabled={!canSubmit}>
              {isLoading ? "Validation..." : "Valider"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}


