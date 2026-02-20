"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Toaster } from "@/components/ui/toaster"
import AuthService from "@/lib/auth-service"

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  // Vérifier l'authentification au montage et quand le pathname change
  useEffect(() => {
    // Vérifier si l'utilisateur est authentifié
    const checkAuth = () => {
      const authenticated = AuthService.isAuthenticated()
      setIsAuthenticated(authenticated)
    }

    // Vérification initiale
    checkAuth()

    // Écouter les changements de localStorage pour détecter les connexions/déconnexions
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token" || e.key === "user") {
        checkAuth()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    
    // Vérifier périodiquement (pour détecter les changements dans le même onglet)
    // Intervalle réduit pour une meilleure réactivité
    const interval = setInterval(checkAuth, 500)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [pathname])

  const isPublicPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/auth/accept-invite") ||
    pathname.startsWith("/auth/verify-email") ||
    pathname.startsWith("/auth/forgot-password") ||
    pathname.startsWith("/auth/password-reset")

  // Page Agences : afficher le layout complet si connecté, sinon sans layout
  const isAgencesPage = pathname === "/agences"

  if (isPublicPage) {
    return (
      <>
        {children}
        <Toaster />
      </>
    )
  }

  // Pour la page Agences, attendre la vérification de l'authentification
  if (isAgencesPage && isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </div>
        <Toaster />
      </div>
    )
  }

  // Pour la page Agences, si l'utilisateur n'est pas connecté, afficher sans layout avec marges
  if (isAgencesPage && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </div>
        <Toaster />
      </div>
    )
  }

  // Pour toutes les autres pages (ou Agences si connecté), afficher le layout complet
  return (
    <SidebarProvider defaultOpen={true} collapsible="icon">
      <AppSidebar />
      <SidebarInset>
        <Header />
        <div className="flex flex-1 flex-col gap-4 p-2 sm:p-4 pt-0 overflow-x-hidden">
          <div className="w-full max-w-full overflow-x-hidden">{children}</div>
        </div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}
