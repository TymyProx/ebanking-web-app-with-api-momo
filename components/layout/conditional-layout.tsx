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

  // Pages d’info publiques (agences, support) : layout complet si connecté, sinon shell minimal
  const isPublicInfoPage = pathname === "/agences" || pathname === "/support"

  if (isPublicPage) {
    return (
      <>
        {children}
        <Toaster />
      </>
    )
  }

  const publicInfoShell = (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-full mx-auto px-2 sm:px-3 md:px-4 py-5 sm:py-7">
        {children}
      </div>
      <Toaster />
    </div>
  )

  if (isPublicInfoPage && isAuthenticated === null) {
    return publicInfoShell
  }

  if (isPublicInfoPage && !isAuthenticated) {
    return publicInfoShell
  }

  // Pour toutes les autres pages (ou pages info si connecté), afficher le layout complet
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
