"use client"

import type React from "react"
import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff } from "lucide-react"
import AuthService from "@/lib/auth-service"
import { config } from "@/lib/config"
import { storeAuthToken } from "./actions"
import { getAccounts } from "@/app/accounts/actions"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const formData = new FormData(e.target as HTMLFormElement)
      const email = formData.get("email") as string
      const password = formData.get("password") as string

      const tenantId = config.TENANT_ID
      const invitationToken = ""

      const loginResult = await AuthService.signIn(email, password, tenantId, invitationToken)

      if (loginResult.success) {
        const userData = await AuthService.fetchMe()

        await storeAuthToken(loginResult.token, userData)

        if (rememberMe) {
          localStorage.setItem("rememberMe", "true")
        }

        const accounts = await getAccounts()

        console.log("[v0] Fetched accounts:", accounts)

        const hasActiveAccounts = accounts.some(
          (acc) => acc.status?.toUpperCase() === "ACTIF" || acc.status?.toUpperCase() === "ACTIVE",
        )

        console.log("[v0] Has active accounts:", hasActiveAccounts)

        if (hasActiveAccounts) {
          router.push("/dashboard")
        } else {
          router.push("/accounts/new")
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#0a8f4f]">
      {/* Left side - Hero Image with Green Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6dd47e] via-[#0a8f4f] to-[#0a8f4f]">
          {/* Decorative curved shape */}
          <div className="absolute right-0 top-0 bottom-0 w-[60%]">
            <svg viewBox="0 0 500 800" className="absolute right-0 h-full w-auto" preserveAspectRatio="xMaxYMid slice">
              <path
                d="M0,0 Q150,400 0,800 L500,800 L500,0 Z"
                fill="rgba(255,255,255,0.03)"
                className="animate-pulse"
                style={{ animationDuration: "4s" }}
              />
            </svg>
          </div>

          {/* Floating money/card graphics */}
          <div className="absolute top-[15%] right-[20%] opacity-40 animate-float">
            <div className="w-16 h-10 bg-white/20 rounded backdrop-blur-sm rotate-12 shadow-lg" />
          </div>
          <div className="absolute top-[35%] right-[15%] opacity-30 animate-float-delayed">
            <div className="w-20 h-12 bg-white/15 rounded backdrop-blur-sm -rotate-6 shadow-lg" />
          </div>
          <div className="absolute top-[25%] right-[35%] opacity-25 animate-float">
            <div className="w-12 h-8 bg-white/20 rounded backdrop-blur-sm rotate-[-20deg] shadow-lg" />
          </div>

          {/* Dotted pattern overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          />
        </div>

        {/* Logo */}
        <div className="absolute top-8 left-8 z-20">
          <div className="bg-white px-4 py-2 rounded shadow-lg">
            <Image
              src="/images/logo-bng.png"
              alt="BNG Logo"
              width={120}
              height={40}
              className="object-contain"
              priority
            />
          </div>
        </div>

        <div className="relative z-10 flex items-end justify-start w-full h-full pb-0">
          <div className="relative flex justify-start items-end max-w-[420px] w-full">
            <Image
              src="/images/image.png"
              alt="Welcome"
              width={420}
              height={550}
              className="object-contain object-bottom drop-shadow-2xl"
              priority
            />
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#0a8f4f] relative overflow-hidden">
        {/* Demi-cercle vert en arrière-plan */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#6dd47e]/30 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl"></div>
        
        {/* Motif de points en arrière-plan */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "25px 25px",
          }}
        />
        
        <div className="w-full max-w-md space-y-6 relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="bg-white px-6 py-3 rounded shadow-lg">
              <Image src="/images/logo-bng.png" alt="BNG Logo" width={140} height={45} className="object-contain" />
            </div>
          </div>

          {/* Connectez-vous Title */}
          <div>
            <h1 className="text-3xl font-bold text-white text-center mb-8">Connectez-vous</h1>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/90 border border-red-600">
                <p className="text-sm text-white">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-white uppercase tracking-wide">
                E-mail
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder=""
                className="h-11 bg-[#6dd47e]/30 border border-[#6dd47e]/50 text-white placeholder:text-white/60 focus:bg-[#6dd47e]/40 focus:border-[#6dd47e] focus:ring-0 backdrop-blur-sm"
                required
                disabled={isLoading}
              />
            </div>

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
                  placeholder=""
                  className="h-11 bg-[#6dd47e]/30 border border-[#6dd47e]/50 text-white pr-10 placeholder:text-white/60 focus:bg-[#6dd47e]/40 focus:border-[#6dd47e] focus:ring-0 backdrop-blur-sm"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                disabled={isLoading}
                className="border-white bg-white/20 data-[state=checked]:bg-white data-[state=checked]:text-green-700"
              />
              <Label htmlFor="remember" className="text-sm text-white cursor-pointer font-normal">
                Se rappeler de moi
              </Label>
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
                  <span>Connexion...</span>
                </div>
              ) : (
                "Connexion"
              )}
            </Button>

            {/* Forgot Password Link */}
            <div className="text-center pt-2">
              <Button
                type="button"
                variant="link"
                className="text-sm text-white hover:text-white/80 underline font-normal uppercase tracking-wide h-auto p-0"
              >
                Mot de passe oublié?
              </Button>
            </div>
          </form>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(12deg);
          }
          50% {
            transform: translateY(-20px) rotate(12deg);
          }
        }
        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0px) rotate(-6deg);
          }
          50% {
            transform: translateY(-15px) rotate(-6deg);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 3.5s ease-in-out infinite;
          animation-delay: 1s;
        }
      `}</style>
    </div>
  )
}
