"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import AuthService from "@/lib/auth-service"
import { validateSessionWithServer } from "@/lib/auth-token-storage"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = async () => {
      const publicPaths = [
        "/agences",
        "/support",
        "/login",
        "/signup",
        "/auth/accept-invite",
        "/auth/verify-email",
        "/auth/forgot-password",
        "/auth/password-reset",
      ]
      const isPublicPage = publicPaths.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`),
      )

      if (isPublicPage) {
        if (AuthService.isAuthenticated() && pathname === "/login") {
          router.push("/dashboard")
          return
        }
        setIsAuthenticated(true)
        setIsLoading(false)
        return
      }

      if (!AuthService.isAuthenticated()) {
        setIsAuthenticated(false)
        setIsLoading(false)
        router.push("/login")
        return
      }

      const alive = await validateSessionWithServer()
      if (!alive) {
        setIsAuthenticated(false)
        setIsLoading(false)
        const params = new URLSearchParams({ reason: "session_replaced" })
        router.push(`/login?${params.toString()}`)
        return
      }

      setIsAuthenticated(true)
      setIsLoading(false)
    }

    const timer = setTimeout(() => {
      void checkAuth()
    }, 100)

    return () => clearTimeout(timer)
  }, [pathname, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
