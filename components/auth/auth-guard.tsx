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

      // Pour les pages protégées, vérifier le token et les infos utilisateur
      if (!AuthService.isAuthenticated()) {
        setIsAuthenticated(false)
        setIsLoading(false)
        // Rediriger vers la page de d'accueil si pas de cookie
        router.push("/")
        return
      }

      let user = AuthService.getCurrentUser()
      if (!user) {
        try {
          user = await AuthService.fetchMe()
        } catch (error) {
          console.error("Erreur lors de la récupération des informations utilisateur:", error)
          // Rediriger vers la page de d'acceuil en cas d'erreur
          router.push("/")
          return
        }
      }

      // Utilisateur authentifié avec informations complètes
      setIsAuthenticated(true)
      setIsLoading(false)
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
