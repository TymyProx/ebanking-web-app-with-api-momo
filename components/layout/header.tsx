"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
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
    const storedUserData = localStorage.getItem("userData")
    const token = localStorage.getItem("token")

    if (storedUserData) {
      setUserData(JSON.parse(storedUserData))
    }
  }, [])

  useEffect(() => {
    const checkActiveAccounts = async () => {
      try {
        const accounts = await getAccounts()
        const activeAccounts = accounts.filter((account) => account.status?.toUpperCase() === "ACTIF")
        setHasActiveAccount(activeAccounts.length > 0)
      } catch (error) {
        console.error("Error checking active accounts:", error)
        setHasActiveAccount(true) // Default to true on error to show breadcrumb
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

  // Générer le breadcrumb basé sur le pathname
  const generateBreadcrumb = () => {
    const segments = pathname.split("/").filter(Boolean)

    if (segments.length === 0) {
      return [{ label: "Tableau de bord", href: "/" }]
    }

    const breadcrumbItems = [{ label: "Accueil", href: "/" }]

    segments.forEach((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/")
      const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace("-", " ")
      breadcrumbItems.push({ label, href })
    })

    return breadcrumbItems
  }

  const breadcrumbItems = generateBreadcrumb()

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      {!isCheckingAccounts && hasActiveAccount && (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbItems.map((item, index) => (
              <div key={item.href} className="flex items-center">
                {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                <BreadcrumbItem className="hidden md:block">
                  {index === breadcrumbItems.length - 1 ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {/* Spacer */}
      <div className="ml-auto flex items-center gap-2">
        {/* Search */}
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Search className="h-4 w-4" />
          <span className="sr-only">Rechercher</span>
        </Button>

        <NotificationDropdown />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
                <AvatarFallback>{userData?.fullName ? getInitials(userData.fullName) : "U"}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userData?.fullName || "Utilisateur"}</p>
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
