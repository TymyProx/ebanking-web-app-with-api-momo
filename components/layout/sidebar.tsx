"use client"

import React from "react"

import type { ReactElement } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from "react"
import {
  Home,
  CreditCard,
  ArrowLeftRight,
  Settings,
  FileText,
  MessageSquare,
  Bell,
  User,
  Building2,
  ChevronRight,
  HelpCircle,
  Wallet,
  BarChart3,
  Clock,
  Sparkles,
  AlertCircle,
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Slot } from "@radix-ui/react-slot"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { LogoutButton } from "@/components/auth/logout-button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getAccounts } from "@/app/accounts/actions"

const navigationData = {
  main: [
    {
      title: "Tableau de bord",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Fonctionnalités",
      url: "/fonctionnalites",
      icon: Sparkles,
      badge: "Nouveau",
    },
  ],
  accounts: [
    {
      title: "Gérer vos comptes",
      icon: Wallet,
      items: [
        {
          title: "Mes comptes",
          url: "/accounts/balance",
          icon: BarChart3,
        },
        {
          title: "Relevés de compte",
          url: "/accounts/statements",
          icon: FileText,
        },
      ],
    },
  ],
  operations: [
    {
      title: "Virements",
      icon: ArrowLeftRight,
      items: [
        {
          title: "Effectuer un virement",
          url: "/transfers/new",
          icon: ArrowLeftRight,
        },
        {
          title: "Bénéficiaires",
          url: "/transfers/beneficiaries",
          icon: User,
        },
        {
          title: "Mes virements",
          url: "/transfers/mes-virements",
          icon: Clock,
        },
      ],
    },
    {
      title: "Cartes",
      url: "/cartes",
      icon: CreditCard,
      badge: "Nouveau",
    },
  ],
  services: [
    {
      title: "E-Services",
      icon: Settings,
      items: [
        {
          title: "Demandes",
          url: "/services/requests",
          icon: FileText,
        },
        {
          title: "RIB",
          url: "/services/rib",
          icon: FileText,
        },
      ],
    },
  ],
  support: [
    {
      title: "Support",
      icon: HelpCircle,
      items: [
        {
          title: "Chat en direct",
          url: "/support/chat",
          icon: MessageSquare,
          badge: "En ligne",
        },
        {
          title: "Historique des chats",
          url: "/support/chat/history",
          icon: Clock,
        },
        {
          title: "Centre d'aide",
          url: "/support/help",
          icon: HelpCircle,
        },
      ],
    },
    {
      title: "Agences",
      url: "/agences",
      icon: Building2,
    },
  ],
  other: [
    {
      title: "Notifications",
      url: "/notifications",
      icon: Bell,
      badge: "3",
    },
    {
      title: "Opérations en attente",
      url: "/operations/pending",
      icon: Clock,
    },
  ],
}

const SidebarGroupLabel = React.forwardRef<HTMLDivElement, React.ComponentProps<"div"> & { asChild?: boolean }>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div"

    return (
      <Comp
        ref={ref}
        data-sidebar="group-label"
        className={cn(
          "duration-200 flex h-9 shrink-0 items-center rounded-md px-2.5 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60 outline-none ring-sidebar-ring transition-[margin,opacity] ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
          "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
          className,
        )}
        {...props}
      />
    )
  },
)

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>): ReactElement {
  const pathname = usePathname()
  const [userData, setUserData] = useState<any>(null)
  const [hasActiveAccount, setHasActiveAccount] = useState<boolean>(false)
  const [isCheckingAccounts, setIsCheckingAccounts] = useState<boolean>(true)
  const { state } = useSidebar()

  useEffect(() => {
    const storedUserData = localStorage.getItem("user")
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData))
    }
  }, [])

  useEffect(() => {
    async function checkActiveAccounts() {
      try {
        setIsCheckingAccounts(true)
        const accounts = await getAccounts()

        const hasActive = accounts.some((account) => account.status === "ACTIF")

        setHasActiveAccount(hasActive)
      } catch (error) {
        console.error("Error checking accounts:", error)
        setHasActiveAccount(false)
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

  const MenuItemWithSubmenu = ({ item }: { item: any }) => {
    const isCollapsed = state === "collapsed"

    if (isCollapsed) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton tooltip={item.title}>
              <item.icon />
              <span>{item.title}</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-48">
            <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {item.items?.map((subItem: any) => (
              <DropdownMenuItem key={subItem.title} asChild>
                <Link href={subItem.url} className="flex items-center gap-2">
                  <subItem.icon className="h-4 w-4" />
                  <span>{subItem.title}</span>
                  {subItem.badge && (
                    <Badge variant="outline" className="ml-auto">
                      {subItem.badge}
                    </Badge>
                  )}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }

    return (
      <Collapsible asChild defaultOpen className="group/collapsible">
        <div>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={item.title}>
              <item.icon />
              <span>{item.title}</span>
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.items?.map((subItem: any) => (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                    <Link href={subItem.url}>
                      <subItem.icon />
                      <span>{subItem.title}</span>
                      {subItem.badge && (
                        <Badge variant="outline" className="ml-auto">
                          {subItem.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </div>
      </Collapsible>
    )
  }

  return (
    <Sidebar collapsible="icon" variant="inset" {...props} className="border-r-0">
      <SidebarHeader className="border-b border-border/40 bg-gradient-to-br from-[#0B8338]/5 to-[#FFEB00]/5">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B8338] to-[#0B8338]/80 shadow-lg shadow-[#0B8338]/20">
            <Image src="/images/logo-bng.png" alt="BNG Logo" width={32} height={32} className="object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#0B8338]">BNG</span>
            <span className="text-xs text-muted-foreground">E-Banking</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-gradient-to-b from-background to-muted/20">
        {isCheckingAccounts ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-4 border-[#0B8338]/20 border-t-[#0B8338] animate-spin" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Chargement...</p>
          </div>
        ) : !hasActiveAccount ? (
          <>
            <div className="px-3 py-4">
              <Alert className="border-[#FFEB00]/50 bg-gradient-to-br from-[#FFEB00]/10 to-[#FFEB00]/5 shadow-sm">
                <AlertCircle className="h-4 w-4 text-[#0B8338]" />
                <AlertDescription className="text-xs font-medium text-foreground">
                  Ouvrez un compte pour accéder à toutes les fonctionnalités
                </AlertDescription>
              </Alert>
            </div>

            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <div className="text-[#0B8338] font-bold">Comptes</div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/accounts/balance"}
                      className="hover:bg-[#0B8338]/10 data-[active=true]:bg-gradient-to-r data-[active=true]:from-[#0B8338] data-[active=true]:to-[#0B8338]/80 data-[active=true]:text-white data-[active=true]:shadow-md transition-all duration-200"
                    >
                      <Link href="/accounts/balance">
                        <BarChart3 />
                        <span>Mes comptes</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : (
          <>
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <div className="text-[#0B8338] font-bold">Principal</div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationData.main.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.url}
                        className="hover:bg-[#0B8338]/10 data-[active=true]:bg-gradient-to-r data-[active=true]:from-[#0B8338] data-[active=true]:to-[#0B8338]/80 data-[active=true]:text-white data-[active=true]:shadow-md transition-all duration-200"
                      >
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                          {item.badge && (
                            <Badge
                              variant="secondary"
                              className="ml-auto bg-[#FFEB00] text-[#0B8338] border-0 font-semibold"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <div className="text-[#0B8338] font-bold">Comptes</div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationData.accounts.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <MenuItemWithSubmenu item={item} />
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <div className="text-[#0B8338] font-bold">Opérations</div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationData.operations.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      {item.items ? (
                        <MenuItemWithSubmenu item={item} />
                      ) : (
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === item.url}
                          className="hover:bg-[#0B8338]/10 data-[active=true]:bg-gradient-to-r data-[active=true]:from-[#0B8338] data-[active=true]:to-[#0B8338]/80 data-[active=true]:text-white data-[active=true]:shadow-md transition-all duration-200"
                        >
                          <Link href={item.url!}>
                            <item.icon />
                            <span>{item.title}</span>
                            {item.badge && (
                              <Badge
                                variant="secondary"
                                className="ml-auto bg-[#FFEB00] text-[#0B8338] border-0 font-semibold"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <div className="text-[#0B8338] font-bold">Services</div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationData.services.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <MenuItemWithSubmenu item={item} />
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <div className="text-[#0B8338] font-bold">Support</div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationData.support.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      {item.items ? (
                        <MenuItemWithSubmenu item={item} />
                      ) : (
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === item.url}
                          className="hover:bg-[#0B8338]/10 data-[active=true]:bg-gradient-to-r data-[active=true]:from-[#0B8338] data-[active=true]:to-[#0B8338]/80 data-[active=true]:text-white data-[active=true]:shadow-md transition-all duration-200"
                        >
                          <Link href={item.url!}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <div className="text-[#0B8338] font-bold">Autres</div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationData.other.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.url}
                        className="hover:bg-[#0B8338]/10 data-[active=true]:bg-gradient-to-r data-[active=true]:from-[#0B8338] data-[active=true]:to-[#0B8338]/80 data-[active=true]:text-white data-[active=true]:shadow-md transition-all duration-200"
                      >
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                          {item.badge && (
                            <Badge variant="destructive" className="ml-auto bg-red-500 border-0 font-semibold">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 bg-gradient-to-br from-[#0B8338]/5 to-[#FFEB00]/5">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-[#0B8338]/10 hover:bg-[#0B8338]/10 transition-all duration-200"
                >
                  <Avatar className="h-8 w-8 rounded-lg ring-2 ring-[#0B8338]/20">
                    <AvatarImage src="/placeholder-user.jpg" alt={userData?.fullName || "Utilisateur"} />
                    <AvatarFallback className="rounded-lg bg-gradient-to-br from-[#0B8338] to-[#0B8338]/80 text-white font-semibold">
                      {userData?.fullName ? getInitials(userData.fullName) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-foreground">
                      {userData?.fullName || "Utilisateur"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {userData?.email || "Client Particulier"}
                    </span>
                  </div>
                  <ChevronRight className="ml-auto size-4 text-[#0B8338]" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg shadow-lg border-[#0B8338]/20"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src="/placeholder-user.jpg" alt={userData?.fullName || "Utilisateur"} />
                      <AvatarFallback className="rounded-lg bg-gradient-to-br from-[#0B8338] to-[#0B8338]/80 text-white font-semibold">
                        {userData?.fullName ? getInitials(userData.fullName) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{userData?.fullName || "Utilisateur"}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {userData?.email || "email@example.com"}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Mon profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Paramètres</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Aide</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <LogoutButton variant="ghost" size="sm" showIcon={true}>
                    Se déconnecter
                  </LogoutButton>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
