"use client"

import type React from "react"
import Image from "next/image"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Lock, ArrowLeft, CheckCircle, Loader2 } from "lucide-react"
import { resetPassword } from "@/app/login/forgot-password-actions"

function PasswordResetContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError("Token de réinitialisation manquant ou invalide.")
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!token) {
      setError("Token de réinitialisation manquant ou invalide.")
      return
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.")
      return
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }

    setIsLoading(true)

    try {
      const result = await resetPassword(token, password)

      if (result.success) {
        setSuccess(true)
        // Rediriger vers la page de connexion après 3 secondes
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      } else {
        setError(result.error || "Erreur lors de la réinitialisation du mot de passe")
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen lg:h-screen relative overflow-x-hidden overflow-y-auto lg:overflow-hidden">
      {/* Logo */}
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
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>

          <div className="hidden lg:block absolute bottom-0 left-[35%] -translate-x-1/2 w-[90%] max-w-[1800px] opacity-100 lg:left-[35%] lg:w-[90%] xl:left-[35%] xl:w-[90%] 2xl:left-[35%] 2xl:w-[90%]">
            <Image
              src="/images/image2.png"
              alt="Banking"
              width={2000}
              height={1600}
              className="w-full h-auto object-contain"
              priority
              sizes="(max-width: 1024px) 0vw, 90vw"
            />
          </div>
        </div>
      </div>

      <main className="w-full px-4 sm:px-6 pt-64 sm:pt-72 md:pt-80 lg:pt-16 pb-2 relative z-10 min-h-screen lg:h-screen flex flex-col justify-center">
        <div className="w-full max-w-full">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            <div className="sm:col-start-3 flex justify-center sm:justify-end">
              <div className="relative group w-full max-w-[90%] sm:max-w-[85%]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2d6e3e]/30 via-[#f4c430]/20 to-[#2d6e3e]/30 rounded-2xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="bg-white/40 backdrop-blur-2xl rounded-2xl shadow-2xl p-4 sm:p-5 border border-white/20">
                  <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-br from-white/15 to-transparent rounded-bl-full"></div>

                  {success ? (
                    <div className="space-y-4 text-center">
                      <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                      </div>
                      <h2 className="text-xl font-bold text-white drop-shadow-2xl">Mot de passe réinitialisé !</h2>
                      <p className="text-sm text-white/90 drop-shadow-lg">
                        Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="text-center mb-4 relative z-10">
                        <h2 className="text-lg sm:text-xl font-bold text-white mb-1 drop-shadow-2xl">Réinitialiser le mot de passe</h2>
                        <p className="text-xs text-white/80 drop-shadow-md">Entrez votre nouveau mot de passe</p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-3">
                        {error && (
                          <div className="p-2.5 rounded-lg bg-red-500/70 border-0 shadow-md">
                            <p className="text-xs text-white text-center font-semibold drop-shadow-md">{error}</p>
                          </div>
                        )}

                        <div className="space-y-1">
                          <Label htmlFor="password" className="text-xs font-semibold text-white/90 flex items-center space-x-1 drop-shadow-lg">
                            <span>Nouveau mot de passe</span>
                            <span className="text-red-300 drop-shadow-md">*</span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="password"
                              name="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="h-9 sm:h-10 bg-[#2d6e3e]/60 border-0 text-white text-sm pr-11 placeholder:text-white/60 focus:bg-[#2d6e3e]/60 focus:ring-0 rounded-lg transition-all hover:bg-[#2d6e3e]/60 shadow-md"
                              required
                              disabled={isLoading || !token}
                              minLength={8}
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
                          <p className="text-xs text-white/70">Minimum 8 caractères</p>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="confirmPassword" className="text-xs font-semibold text-white/90 flex items-center space-x-1 drop-shadow-lg">
                            <span>Confirmer le mot de passe</span>
                            <span className="text-red-300 drop-shadow-md">*</span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              name="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="••••••••"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="h-9 sm:h-10 bg-[#2d6e3e]/60 border-0 text-white text-sm pr-11 placeholder:text-white/60 focus:bg-[#2d6e3e]/60 focus:ring-0 rounded-lg transition-all hover:bg-[#2d6e3e]/60 shadow-md"
                              required
                              disabled={isLoading || !token}
                              minLength={8}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                              disabled={isLoading}
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="relative w-full h-10 sm:h-11 bg-gradient-to-r from-[#f4c430] via-[#f8d060] to-[#f4c430] hover:from-[#e0b020] hover:via-[#f4c430] hover:to-[#e0b020] text-gray-900 font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group rounded-lg"
                          disabled={isLoading || !token}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                          {isLoading ? (
                            <div className="flex items-center space-x-2 relative z-10">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-900/30 border-t-gray-900"></div>
                              <span className="text-sm">Réinitialisation...</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center space-x-2 relative z-10">
                              <Lock className="h-4 w-4" />
                              <span className="text-sm">Réinitialiser</span>
                            </div>
                          )}
                        </Button>

                        <Button
                          type="button"
                          onClick={() => router.push("/login")}
                          variant="ghost"
                          className="w-full text-white/90 hover:text-white hover:bg-white/10"
                          disabled={isLoading}
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Retour à la connexion
                        </Button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function PasswordResetPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2d6e3e] via-[#36803e] to-[#2d6e3e]">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      }
    >
      <PasswordResetContent />
    </Suspense>
  )
}
