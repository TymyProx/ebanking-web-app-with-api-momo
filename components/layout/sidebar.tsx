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
  Loader2,
  PlusCircle,
  FileCheck,
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
          title: "Consultation de solde",
          url: "/accounts/balance",
          icon: BarChart3,
        },
        {
          title: "Relevés de compte",
          url: "/accounts/statements",
          icon: FileText,
        },
        {
          title: "Ouverture compte",
          url: "/accounts/new",
          icon: PlusCircle,
        },
        {
          title: "Relevé de coordonnées bancaires",
          url: "/accounts/rib",
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
      title: "Gestion des cartes",
      icon: CreditCard,
      items: [
        {
          title: "Mes cartes",
          url: "/cartes",
          icon: CreditCard,
        },
        {
          title: "Demande de carte",
          url: "/cartes/demande",
          icon: FileCheck,
        },
      ],
    },
  ],
  services: [
    {
      title: "E-Services",
      url: "/services/requests",
      icon: FileText,
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
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-120 w-120 items-center justify-center">
            <Image src="/images/logo-bng.png" alt="BNG Logo" width={120} height={120} className="object-contain" />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {isCheckingAccounts ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Chargement...</p>
          </div>
        ) : !hasActiveAccount ? (
          <>
            <div className="px-3 py-2">
              <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                <AlertDescription className="text-xs text-amber-800 dark:text-amber-300">
                  Veuillez initier la demande d'ouverture de compte pour accéder à toutes les fonctionnalités
                </AlertDescription>
              </Alert>
            </div>

            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <div>Comptes</div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/accounts/new"}>
                      <Link href="/accounts/new">
                        <PlusCircle />
                        <span>Ouverture compte</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {/* </CHANGE> */}
          </>
        ) : (
          <>
            {/* Navigation principale */}
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <div>Principal</div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationData.main.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={pathname === item.url}>
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto">
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

            {/* Comptes */}
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <div>Comptes</div>
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

            {/* Opérations */}
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <div>Opérations</div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationData.operations.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      {item.items ? (
                        <MenuItemWithSubmenu item={item} />
                      ) : (
                        <SidebarMenuButton asChild isActive={pathname === item.url}>
                          <Link href={item.url!}>
                            <item.icon />
                            <span>{item.title}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="ml-auto">
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

            {/* Services */}
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <div>Services</div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationData.services.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      {item.url ? (
                        <SidebarMenuButton asChild isActive={pathname === item.url}>
                          <Link href={item.url}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      ) : null}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Support */}
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <div>Support</div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationData.support.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      {"items" in item ? (
                        <MenuItemWithSubmenu item={item} />
                      ) : "url" in item ? (
                        <SidebarMenuButton asChild isActive={pathname === item.url}>
                          <Link href={item.url}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      ) : null}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Autres */}
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <div>Autres</div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationData.other.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={pathname === item.url}>
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                          {item.badge && (
                            <Badge variant="destructive" className="ml-auto">
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

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="/placeholder-user.jpg" alt={userData?.fullName || "Utilisateur"} />
                    <AvatarFallback className="rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 text-white">
                      {userData?.fullName ? getInitials(userData.fullName) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{userData?.fullName || "Utilisateur"}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {userData?.email || "Client Particulier"}
                    </span>
                  </div>
                  <ChevronRight className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src="/placeholder-user.jpg" alt={userData?.fullName || "Utilisateur"} />
                      <AvatarFallback className="rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 text-white">
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
