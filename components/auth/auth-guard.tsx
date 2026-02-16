"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import AuthService from "@/lib/auth-service"
import { getAccounts } from "@/app/accounts/actions"
import { isAccountActive } from "@/lib/status-utils"

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
      const publicPaths = ["/", "/login", "/signup", "/auth/accept-invite", "/auth/verify-email"]
      const isPublicPage = publicPaths.some((path) => pathname.startsWith(path))

      if (isPublicPage) {
        if (AuthService.isAuthenticated() && pathname === "/") {
          try {
            const accounts = await getAccounts()
            // Utiliser la fonction normalisée pour vérifier les comptes actifs
            const hasActiveAccount = accounts.some((account) => isAccountActive(account.status))

            if (hasActiveAccount) {
              router.push("/dashboard")
            } else {
              router.push("/accounts/new")
            }
          } catch (error) {
            console.error("Error checking accounts:", error)
            router.push("/accounts/new")
          }
          return
        }
        setIsAuthenticated(true)
        setIsLoading(false)
        return
      }

      // Pour les pages protégées, vérifier l'authentification via les cookies HttpOnly
      try {
        // Vérifier l'authentification via l'API qui utilise les cookies HttpOnly
        const authCheckResponse = await fetch("/api/auth/check", {
          method: "GET",
          credentials: "include", // Important pour envoyer les cookies
          cache: "no-store",
        })

        if (!authCheckResponse.ok) {
          // Si l'API retourne une erreur, essayer avec localStorage comme fallback
          throw new Error("Auth check failed")
        }

        const authData = await authCheckResponse.json()

        if (authData.authenticated) {
          // Utilisateur authentifié avec informations complètes
          setIsAuthenticated(true)
          setIsLoading(false)
          return
        }

        // Si pas authentifié via cookies, vérifier localStorage comme fallback
        if (AuthService.isAuthenticated()) {
          try {
            await AuthService.fetchMe()
            setIsAuthenticated(true)
            setIsLoading(false)
            return
          } catch (fetchError) {
            console.error("Erreur lors de la récupération des informations utilisateur:", fetchError)
          }
        }

        // Pas authentifié du tout
        setIsAuthenticated(false)
        setIsLoading(false)
        router.push("/")
      } catch (error) {
        console.error("Erreur lors de la vérification de l'authentification:", error)
        // En cas d'erreur réseau, vérifier localStorage comme fallback
        if (AuthService.isAuthenticated()) {
          try {
            await AuthService.fetchMe()
            setIsAuthenticated(true)
            setIsLoading(false)
          } catch (fetchError) {
            console.error("Erreur lors de la récupération des informations utilisateur:", fetchError)
            setIsAuthenticated(false)
            setIsLoading(false)
            router.push("/")
          }
        } else {
          setIsAuthenticated(false)
          setIsLoading(false)
          router.push("/")
        }
      }
    }

    // Délai pour éviter les problèmes d'hydratation
    const timer = setTimeout(checkAuth, 100)

    return () => clearTimeout(timer)
  }, [pathname, router])

  // Afficher un loader pendant la vérification
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
