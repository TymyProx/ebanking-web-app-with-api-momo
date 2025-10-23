"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import AuthService from "@/lib/auth-service"

interface LogoutButtonProps {
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "lg"
  showIcon?: boolean
  children?: React.ReactNode
}

export function LogoutButton({
  variant = "ghost",
  size = "default",
  showIcon = true,
  children = "Déconnexion",
}: LogoutButtonProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await AuthService.signOut()

      router.push("/")
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
      router.push("/")
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleLogout} className="flex items-center gap-2">
      {showIcon && <LogOut className="h-4 w-4" />}
      {children}
    </Button>
  )
}
