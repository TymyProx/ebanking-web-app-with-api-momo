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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getAccounts } from "@/app/accounts/actions"

const navigationData = {
  main: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      description: "Vue d'ensemble",
    },
    {
      title: "Fonctionnalités",
      url: "/fonctionnalites",
      icon: Sparkles,
      badge: "Nouveau",
      description: "Nouvelles options",
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

// ✅ Force toutes les icônes Lucide en blanc (stroke & fill via currentColor)
const ICON_WHITE = "h-4 w-4 text-white stroke-white"
const ICON_WHITE_MD = "h-5 w-5 text-white stroke-white"

const SidebarGroupLabel = React.forwardRef<HTMLDivElement, React.ComponentProps<"div"> & { asChild?: boolean }>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div"

    return (
      <Comp
        ref={ref}
        data-sidebar="group-label"
        className={cn(
          "duration-200 flex h-8 shrink-0 items-center rounded-md px-3 text-[10px] font-bold uppercase tracking-widest text-white/70 outline-none ring-sidebar-ring transition-[margin,opacity] ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
          "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
          "border-l-2 border-white/30 pl-2.5",
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
            <SidebarMenuButton tooltip={item.title} className="text-white">
              <item.icon className={ICON_WHITE_MD} />
              <span className="text-white">{item.title}</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          {/* NOTE: dropdown bg white => on force les icônes en blanc quand même */}
          <DropdownMenuContent side="right" align="start" className="w-56 bg-white">
            <DropdownMenuLabel className="text-gray-900">{item.title}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {item.items?.map((subItem: any) => (
              <DropdownMenuItem key={subItem.title} asChild>
                <Link href={subItem.url} className="flex items-center gap-2">
                  <subItem.icon className={ICON_WHITE} />
                  <span className="text-gray-900">{subItem.title}</span>
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
            <SidebarMenuButton
              tooltip={item.title}
              className="h-11 rounded-xl text-white hover:bg-white/20 transition-all duration-200"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 text-white">
                <item.icon className={ICON_WHITE_MD} />
              </div>
              <span className="font-semibold text-white">{item.title}</span>
              <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-white stroke-white" />
            </SidebarMenuButton>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <SidebarMenuSub className="ml-4 mt-1 space-y-1 border-l-2 border-white/20 pl-3">
              {item.items?.map((subItem: any) => (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={pathname === subItem.url}
                    className="h-10 rounded-lg text-white/90 hover:bg-white/15 hover:text-white data-[active=true]:bg-white/25 data-[active=true]:text-white data-[active=true]:font-semibold data-[active=true]:border-l-2 data-[active=true]:border-[#f4c430] transition-all duration-200"
                  >
                    <Link href={subItem.url} className="flex items-center gap-2.5">
                      <subItem.icon className={ICON_WHITE} />
                      <span className="text-sm text-white">{subItem.title}</span>
                      {subItem.badge && (
                        <Badge variant="outline" className="ml-auto text-[10px] px-1.5 border-white/30 text-white">
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
    <Sidebar
      collapsible="icon"
      variant="inset"
      {...props}
      style={{
        backgroundImage: "url('/images/background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      // ✅ Force tous les svg (lucide) à être blancs, même si un parent met text-gray
      className="border-r border-white/10 text-white [&_svg]:text-white [&_svg]:stroke-white"
    >
      <SidebarHeader className="border-b border-white/10 bg-[#34763E]/20 backdrop-blur-sm">
        <div className="flex items-center gap-2 px-4 py-3">
          {state === "collapsed" ? (
            <div className="flex min-h-[56px] w-full items-center justify-center">
              <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-white/95 p-1.5 shadow-lg border border-white/20">
                <Image
                  src="/images/portrait-logo.png"
                  alt="BNG Logo"
                  width={48}
                  height={48}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>
            </div>
          ) : (
            <div className="flex min-h-[80px] w-full items-center justify-center py-2">
              <div className="h-[160px] w-[360px] flex-shrink-0 rounded-lg px-4 py-3">
                <Image
                  src="/images/logowhite.png"
                  alt="BNG Logo"
                  width={340}
                  height={160}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {isCheckingAccounts ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Loader2 className="h-6 w-6 animate-spin text-white/70" />
            <p className="text-sm text-white/70">Chargement...</p>
          </div>
        ) : !hasActiveAccount ? (
          <>
            <div className="px-3 py-2">
              {state === "collapsed" ? (
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center rounded-md border border-[#f4c430] bg-[#f4c430]/20 p-2 cursor-help backdrop-blur-sm">
                        <AlertCircle className={ICON_WHITE_MD + " text-[#f4c430] stroke-[#f4c430]"} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs bg-white border-[#f4c430]">
                      <p className="text-sm text-gray-900">
                        Veuillez initier la demande d'ouverture de compte pour accéder à toutes les fonctionnalités
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Alert className="border-[#f4c430] bg-[#f4c430]/20 backdrop-blur-sm">
                  <AlertCircle className="h-4 w-4 text-[#f4c430] stroke-[#f4c430]" />
                  <AlertDescription className="text-xs text-white font-medium">
                    Veuillez initier la demande d'ouverture de compte pour accéder à toutes les fonctionnalités
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <SidebarGroup className="mt-4">
              <SidebarGroupLabel asChild>
                <div>Comptes</div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/accounts/new"}
                      className="h-11 rounded-xl text-white hover:bg-white/20 data-[active=true]:bg-white/30 data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:border-l-4 data-[active=true]:border-[#f4c430] transition-all duration-200"
                    >
                      <Link href="/accounts/new" className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 group-data-[active=true]:bg-white/20">
                          <PlusCircle className={ICON_WHITE_MD} />
                        </div>
                        <span className="font-semibold text-white">Ouverture compte</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : (
          <>
            {/* Navigation principale */}
            <SidebarGroup className="mt-2">
              <SidebarGroupLabel asChild>
                <div>Principal</div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navigationData.main.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.url}
                        className="h-11 rounded-xl text-white hover:bg-white/20 data-[active=true]:bg-white/30 data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:border-l-4 data-[active=true]:border-[#f4c430] transition-all duration-200"
                      >
                        <Link href={item.url} className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 group-data-[active=true]:bg-white/20">
                            <item.icon className={ICON_WHITE_MD} />
                          </div>
                          <span className="font-semibold text-white">{item.title}</span>
                          {item.badge && (
                            <Badge className="ml-auto bg-gradient-to-r from-[#f4c430] to-[#e0b020] text-gray-900 border-0 font-bold text-[10px] px-2 shadow-sm">
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
            <SidebarGroup className="mt-4">
              <SidebarGroupLabel asChild>
                <div>Comptes</div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navigationData.accounts.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <MenuItemWithSubmenu item={item} />
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Opérations */}
            <SidebarGroup className="mt-4">
              <SidebarGroupLabel asChild>
                <div>Opérations</div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navigationData.operations.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <MenuItemWithSubmenu item={item} />
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Services */}
            <SidebarGroup className="mt-4">
              <SidebarGroupLabel asChild>
                <div>Services</div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navigationData.services.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      {item.url ? (
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === item.url}
                          className="h-11 rounded-xl text-white hover:bg-white/20 data-[active=true]:bg-white/30 data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:border-l-4 data-[active=true]:border-[#f4c430] transition-all duration-200"
                        >
                          <Link href={item.url} className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 group-data-[active=true]:bg-white/20">
                              <item.icon className={ICON_WHITE_MD} />
                            </div>
                            <span className="font-semibold text-white">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      ) : null}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Support */}
            <SidebarGroup className="mt-4">
              <SidebarGroupLabel asChild>
                <div>Support</div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navigationData.support.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      {"items" in item ? (
                        <MenuItemWithSubmenu item={item} />
                      ) : "url" in item ? (
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === item.url}
                          className="h-11 rounded-xl text-white hover:bg-white/20 data-[active=true]:bg-white/30 data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:border-l-4 data-[active=true]:border-[#f4c430] transition-all duration-200"
                        >
                          <Link href={item.url} className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 group-data-[active=true]:bg-white/20">
                              <item.icon className={ICON_WHITE_MD} />
                            </div>
                            <span className="font-semibold text-white">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      ) : null}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Autres */}
            <SidebarGroup className="mt-4">
              <SidebarGroupLabel asChild>
                <div>Autres</div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navigationData.other.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.url}
                        className="h-11 rounded-xl text-white hover:bg-white/20 data-[active=true]:bg-white/30 data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:border-l-4 data-[active=true]:border-[#f4c430] transition-all duration-200"
                      >
                        <Link href={item.url} className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 group-data-[active=true]:bg-white/20">
                            <item.icon className={ICON_WHITE_MD} />
                          </div>
                          <span className="font-semibold">{item.title}</span>
                          {item.badge && (
                            <Badge className="ml-auto bg-red-500 text-white border-0 font-bold text-[10px] px-2 shadow-sm animate-pulse">
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

      <SidebarFooter className="border-t border-white/10 bg-[#34763E]/20 backdrop-blur-sm">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-white/30 data-[state=open]:text-white hover:bg-white/20 transition-all duration-200 rounded-xl border border-transparent hover:border-white/30 shadow-sm hover:shadow-md text-white"
                >
                  <Avatar className="h-10 w-10 rounded-xl ring-2 ring-white/30 ring-offset-2 ring-offset-transparent">
                    <AvatarImage src="/placeholder-user.jpg" alt={userData?.fullName || "Utilisateur"} />
                    <AvatarFallback className="rounded-xl bg-gradient-to-br from-white/90 to-white/70 text-[#34763E] font-bold text-sm">
                      {userData?.fullName ? getInitials(userData.fullName) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-bold text-white">{userData?.fullName || "Utilisateur"}</span>
                    <span className="truncate text-xs text-white/70 font-medium">
                      {userData?.email || "Client Particulier"}
                    </span>
                  </div>
                  <ChevronRight className="ml-auto size-4 text-white/70 stroke-white" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-2xl shadow-2xl border-gray-200 bg-white/95 backdrop-blur-xl"
                side="bottom"
                align="end"
                sideOffset={8}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-3 px-3 py-3 text-left bg-gradient-to-r from-[#34763E]/5 to-transparent rounded-t-2xl">
                    <Avatar className="h-12 w-12 rounded-xl ring-2 ring-[#34763E]/30 ring-offset-2">
                      <AvatarImage src="/placeholder-user.jpg" alt={userData?.fullName || "Utilisateur"} />
                      <AvatarFallback className="rounded-xl bg-gradient-to-br from-[#34763E] to-[#2a5f32] text-white font-bold">
                        {userData?.fullName ? getInitials(userData.fullName) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left leading-tight">
                      <span className="truncate font-bold text-gray-900 text-sm">
                        {userData?.fullName || "Utilisateur"}
                      </span>
                      <span className="truncate text-xs text-gray-500 font-medium mt-0.5">
                        {userData?.email || "email@example.com"}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="bg-gray-200/50" />

                <div className="py-1">
                  <DropdownMenuItem
                    asChild
                    className="mx-1 rounded-lg hover:bg-[#34763E]/5 focus:bg-[#34763E]/10 transition-colors cursor-pointer"
                  >
                    <Link href="/profile" className="flex items-center px-2 py-2.5">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#34763E]/10 text-[#34763E] mr-3">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-sm">Mon profil</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem className="mx-1 rounded-lg hover:bg-[#34763E]/5 focus:bg-[#34763E]/10 transition-colors cursor-pointer px-2 py-2.5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-600 mr-3">
                      <Settings className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-sm">Paramètres</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem className="mx-1 rounded-lg hover:bg-[#34763E]/5 focus:bg-[#34763E]/10 transition-colors cursor-pointer px-2 py-2.5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-600 mr-3">
                      <HelpCircle className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-sm">Aide</span>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="bg-gray-200/50" />

                <div className="py-1">
                  <DropdownMenuItem
                    asChild
                    className="mx-1 rounded-lg hover:bg-red-50 focus:bg-red-50 transition-colors cursor-pointer px-2 py-2.5"
                  >
                    <div className="w-full">
                      <LogoutButton variant="ghost" size="sm" showIcon={true}>
                        <span className="text-red-600 hover:text-red-700 font-medium">Se déconnecter</span>
                      </LogoutButton>
                    </div>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
