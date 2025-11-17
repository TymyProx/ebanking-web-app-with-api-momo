"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from 'next/navigation'
import AuthService from "@/lib/auth-service"
import { getAccounts } from "@/app/accounts/actions"

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
      const publicPaths = ["/", "/auth/accept-invite"]
      const isPublicPage = publicPaths.some((path) => pathname.startsWith(path))

      if (isPublicPage) {
        if (AuthService.isAuthenticated() && pathname === "/") {
          try {
            const accounts = await getAccounts()
            
            if (accounts && accounts.length > 0) {
              const hasActiveAccount = accounts.some(
                (account) => {
                  const status = account.status?.toUpperCase()
                  return status === "ACTIF" || status === "ACTIVE"
                }
              )

              if (hasActiveAccount) {
                router.push("/accounts/balance")
              } else {
                router.push("/accounts/new")
              }
            } else {
              console.log("[v0] AuthGuard - No accounts data, staying on current page")
            }
          } catch (error) {
            console.error("[v0] AuthGuard - Error checking accounts:", error)
          }
          return
        }
        setIsAuthenticated(true)
        setIsLoading(false)
        return
      }

      if (!AuthService.isAuthenticated()) {
        setIsAuthenticated(false)
        setIsLoading(false)
        router.push("/")
        return
      }

      let user = AuthService.getCurrentUser()
      if (!user) {
        try {
          user = await AuthService.fetchMe()
        } catch (error) {
          console.error("Erreur lors de la récupération des informations utilisateur:", error)
          router.push("/")
          return
        }
      }

      setIsAuthenticated(true)
      setIsLoading(false)
    }

    const timer = setTimeout(checkAuth, 100)

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
