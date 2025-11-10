"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Settings, User } from "lucide-react"
import { LogoutButton } from "@/components/auth/logout-button"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { getAccounts } from "@/app/accounts/actions"

export function Header() {
  const pathname = usePathname()
  const [userData, setUserData] = useState<any>(null)
  const [hasActiveAccount, setHasActiveAccount] = useState<boolean>(false)
  const [isCheckingAccounts, setIsCheckingAccounts] = useState<boolean>(true)

  useEffect(() => {
    const fetchUserData = async () => {
      console.log("[v0] Fetching user data...")

      // First try localStorage
      const storedUserData = localStorage.getItem("userData")
      const token = localStorage.getItem("token")

      console.log("[v0] localStorage userData:", storedUserData)
      console.log("[v0] token exists:", !!token)

      if (storedUserData) {
        const parsedData = JSON.parse(storedUserData)
        console.log("[v0] Parsed userData:", parsedData)
        setUserData(parsedData)
      }

      // Then fetch fresh data from API
      if (token) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            console.log("[v0] API user data:", data)
            setUserData(data)
            // Update localStorage with fresh data
            localStorage.setItem("userData", JSON.stringify(data))
          } else {
            console.log("[v0] API response not ok:", response.status)
          }
        } catch (error) {
          console.error("[v0] Error fetching user data from API:", error)
        }
      }
    }

    fetchUserData()
  }, [])

  useEffect(() => {
    const checkActiveAccounts = async () => {
      try {
        const accounts = await getAccounts()
        const activeAccounts = accounts.filter((account) => account.status?.toUpperCase() === "ACTIF")
        setHasActiveAccount(activeAccounts.length > 0)
      } catch (error) {
        console.error("Error checking active accounts:", error)
        setHasActiveAccount(true)
      } finally {
        setIsCheckingAccounts(false)
      }
    }

    checkActiveAccounts()
  }, [])

  const getInitials = (fullName: string) => {
    if (!fullName) return "U"
    return fullName
      .split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const displayName =
    userData?.fullName?.trim() ||
    [userData?.firstName, userData?.lastName].filter(Boolean).join(" ").trim() ||
    (userData?.first_name && userData?.last_name)
      ? `${userData.first_name} ${userData.last_name}`.trim()
      : userData?.email?.split("@")[0] || "Utilisateur"

  console.log("[v0] Final displayName:", displayName)

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      {!isCheckingAccounts && hasActiveAccount && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Bonjour,</span>
          <span className="text-sm font-semibold text-primary">{displayName}</span>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Search className="h-4 w-4" />
          <span className="sr-only">Rechercher</span>
        </Button>

        <NotificationDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
                <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">{userData?.email || "email@example.com"}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Paramètres</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <LogoutButton variant="ghost" size="sm" showIcon={true}>
                Déconnexion
              </LogoutButton>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
