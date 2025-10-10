"use client"

import type React from "react"
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
  LogOut,
  HelpCircle,
  Wallet,
  BarChart3,
  Clock,
  Sparkles,
  Users,
  Zap,
} from "lucide-react"
import Image from "next/image"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
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

const navigationData = {
  main: [
    {
      title: "Tableau de bord",
      url: "/",
      icon: Home,
    },
    {
      title: "Fonctionnalités",
      url: "/fonctionnalites",
      icon: Sparkles,
      badge: "Nouveau",
    },
  ],
  banking: [
    {
      title: "Mes Comptes",
      icon: Wallet,
      items: [
        {
          title: "Soldes",
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
          icon: Users,
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
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>): ReactElement {
  const pathname = usePathname()
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    const storedUserData = localStorage.getItem("user")
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData))
    }
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

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="relative overflow-hidden border-b border-sidebar-border/30 bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/5 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 animate-pulse" />
        <div className="relative flex items-center justify-center px-4 py-6">
          <div className="group flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-white/90 to-white/70 p-3 shadow-2xl shadow-primary/20 backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:shadow-primary/30 hover:rotate-3">
            <Image
              src="/images/logo-bng.png"
              alt="BNG Logo"
              width={70}
              height={70}
              className="object-contain transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 flex items-center gap-2 px-3 text-[10px] font-black uppercase tracking-[0.15em] text-sidebar-foreground/40">
            <Zap className="h-3 w-3" />
            <span>Principal</span>
            <div className="ml-auto h-px flex-1 bg-gradient-to-r from-sidebar-foreground/20 to-transparent" />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationData.main.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url} className="group relative overflow-hidden">
                      <div className="relative z-10 flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 transition-all duration-300 group-hover:scale-110 group-hover:from-primary/20 group-hover:to-secondary/20 group-data-[active=true]:from-primary/20 group-data-[active=true]:to-secondary/20 group-data-[active=true]:shadow-lg group-data-[active=true]:shadow-primary/20">
                          <item.icon className="h-[18px] w-[18px] transition-transform duration-300 group-hover:scale-110 group-data-[active=true]:scale-110" />
                        </div>
                        <span className="whitespace-nowrap font-medium">{item.title}</span>
                      </div>
                      {item.badge && (
                        <Badge className="ml-auto bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30 animate-pulse">
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

        <div className="my-4 h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />

        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 flex items-center gap-2 px-3 text-[10px] font-black uppercase tracking-[0.15em] text-sidebar-foreground/40">
            <Wallet className="h-3 w-3" />
            <span>Banque</span>
            <div className="ml-auto h-px flex-1 bg-gradient-to-r from-sidebar-foreground/20 to-transparent" />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationData.banking.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <Collapsible asChild defaultOpen className="group/collapsible">
                      <div>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title} className="group relative overflow-hidden">
                            <div className="relative z-10 flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 transition-all duration-300 group-hover:scale-110 group-hover:from-blue-500/20 group-hover:to-cyan-500/20">
                                <item.icon className="h-[18px] w-[18px] transition-transform duration-300 group-hover:scale-110" />
                              </div>
                              <span className="whitespace-nowrap font-medium">{item.title}</span>
                            </div>
                            <ChevronRight className="ml-auto h-4 w-4 transition-all duration-500 group-data-[state=open]/collapsible:rotate-90 group-data-[state=open]/collapsible:text-primary" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="transition-all duration-300 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                          <SidebarMenuSub className="ml-2 border-l-2 border-gradient-to-b from-primary/30 to-transparent">
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                  <Link href={subItem.url} className="group relative">
                                    <div className="flex items-center gap-2.5">
                                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5 transition-all duration-300 group-hover:scale-110 group-hover:from-primary/15 group-hover:to-secondary/15 group-data-[active=true]:from-primary/15 group-data-[active=true]:to-secondary/15">
                                        <subItem.icon className="h-4 w-4" />
                                      </div>
                                      <span className="whitespace-nowrap">{subItem.title}</span>
                                    </div>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link href={item.url!} className="group relative overflow-hidden">
                        <div className="relative z-10 flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 transition-all duration-300 group-hover:scale-110 group-hover:from-blue-500/20 group-hover:to-cyan-500/20 group-data-[active=true]:from-blue-500/20 group-data-[active=true]:to-cyan-500/20 group-data-[active=true]:shadow-lg group-data-[active=true]:shadow-blue-500/20">
                            <item.icon className="h-[18px] w-[18px] transition-transform duration-300 group-hover:scale-110 group-data-[active=true]:scale-110" />
                          </div>
                          <span className="whitespace-nowrap font-medium">{item.title}</span>
                        </div>
                        {item.badge && (
                          <Badge className="ml-auto bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30 animate-pulse">
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

        <div className="my-4 h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />

        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 flex items-center gap-2 px-3 text-[10px] font-black uppercase tracking-[0.15em] text-sidebar-foreground/40">
            <Settings className="h-3 w-3" />
            <span>Services</span>
            <div className="ml-auto h-px flex-1 bg-gradient-to-r from-sidebar-foreground/20 to-transparent" />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationData.services.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <Collapsible asChild className="group/collapsible">
                      <div>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title} className="group relative overflow-hidden">
                            <div className="relative z-10 flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 transition-all duration-300 group-hover:scale-110 group-hover:from-purple-500/20 group-hover:to-pink-500/20">
                                <item.icon className="h-[18px] w-[18px] transition-transform duration-300 group-hover:scale-110" />
                              </div>
                              <span className="whitespace-nowrap font-medium">{item.title}</span>
                            </div>
                            <ChevronRight className="ml-auto h-4 w-4 transition-all duration-500 group-data-[state=open]/collapsible:rotate-90 group-data-[state=open]/collapsible:text-primary" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="transition-all duration-300 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                          <SidebarMenuSub className="ml-2 border-l-2 border-gradient-to-b from-primary/30 to-transparent">
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                  <Link href={subItem.url} className="group relative">
                                    <div className="flex items-center gap-2.5">
                                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5 transition-all duration-300 group-hover:scale-110 group-hover:from-primary/15 group-hover:to-secondary/15 group-data-[active=true]:from-primary/15 group-data-[active=true]:to-secondary/15">
                                        <subItem.icon className="h-4 w-4" />
                                      </div>
                                      <span className="whitespace-nowrap">{subItem.title}</span>
                                    </div>
                                    {subItem.badge && (
                                      <Badge
                                        variant="outline"
                                        className="ml-auto bg-green-500/10 text-green-600 border-green-500/30 text-[10px] px-1.5 py-0"
                                      >
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
                  ) : (
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link href={item.url!} className="group relative overflow-hidden">
                        <div className="relative z-10 flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 transition-all duration-300 group-hover:scale-110 group-hover:from-purple-500/20 group-hover:to-pink-500/20 group-data-[active=true]:from-purple-500/20 group-data-[active=true]:to-pink-500/20 group-data-[active=true]:shadow-lg group-data-[active=true]:shadow-purple-500/20">
                            <item.icon className="h-[18px] w-[18px] transition-transform duration-300 group-hover:scale-110 group-data-[active=true]:scale-110" />
                          </div>
                          <span className="whitespace-nowrap font-medium">{item.title}</span>
                        </div>
                        {item.badge && (
                          <Badge
                            variant="destructive"
                            className="ml-auto shadow-lg shadow-destructive/30 animate-pulse"
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

        <div className="my-4 h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />

        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 flex items-center gap-2 px-3 text-[10px] font-black uppercase tracking-[0.15em] text-sidebar-foreground/40">
            <HelpCircle className="h-3 w-3" />
            <span>Aide & Support</span>
            <div className="ml-auto h-px flex-1 bg-gradient-to-r from-sidebar-foreground/20 to-transparent" />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationData.support.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <Collapsible asChild className="group/collapsible">
                      <div>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title} className="group relative overflow-hidden">
                            <div className="relative z-10 flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 transition-all duration-300 group-hover:scale-110 group-hover:from-orange-500/20 group-hover:to-red-500/20">
                                <item.icon className="h-[18px] w-[18px] transition-transform duration-300 group-hover:scale-110" />
                              </div>
                              <span className="whitespace-nowrap font-medium">{item.title}</span>
                            </div>
                            <ChevronRight className="ml-auto h-4 w-4 transition-all duration-500 group-data-[state=open]/collapsible:rotate-90 group-data-[state=open]/collapsible:text-primary" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="transition-all duration-300 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                          <SidebarMenuSub className="ml-2 border-l-2 border-gradient-to-b from-primary/30 to-transparent">
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                  <Link href={subItem.url} className="group relative">
                                    <div className="flex items-center gap-2.5">
                                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5 transition-all duration-300 group-hover:scale-110 group-hover:from-primary/15 group-hover:to-secondary/15 group-data-[active=true]:from-primary/15 group-data-[active=true]:to-secondary/15">
                                        <subItem.icon className="h-4 w-4" />
                                      </div>
                                      <span className="whitespace-nowrap">{subItem.title}</span>
                                    </div>
                                    {subItem.badge && (
                                      <Badge
                                        variant="outline"
                                        className="ml-auto bg-green-500/10 text-green-600 border-green-500/30 text-[10px] px-1.5 py-0"
                                      >
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
                  ) : (
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link href={item.url!} className="group relative overflow-hidden">
                        <div className="relative z-10 flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 transition-all duration-300 group-hover:scale-110 group-hover:from-orange-500/20 group-hover:to-red-500/20 group-data-[active=true]:from-orange-500/20 group-data-[active=true]:to-red-500/20 group-data-[active=true]:shadow-lg group-data-[active=true]:shadow-orange-500/20">
                            <item.icon className="h-[18px] w-[18px] transition-transform duration-300 group-hover:scale-110 group-data-[active=true]:scale-110" />
                          </div>
                          <span className="whitespace-nowrap font-medium">{item.title}</span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="relative overflow-hidden border-t border-sidebar-border/30 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 p-3 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="group relative overflow-hidden data-[state=open]:bg-gradient-to-r data-[state=open]:from-sidebar-accent/60 data-[state=open]:to-sidebar-accent/30 hover:bg-gradient-to-r hover:from-sidebar-accent/40 hover:to-sidebar-accent/20 hover:shadow-lg transition-all duration-300"
                >
                  <div className="relative z-10 flex items-center gap-3">
                    <Avatar className="h-10 w-10 rounded-2xl border-2 border-primary/30 shadow-lg shadow-primary/20 transition-all duration-300 group-hover:scale-105 group-hover:border-primary/50 group-hover:shadow-primary/30">
                      <AvatarImage src="/placeholder-user.jpg" alt={userData?.fullName || "Utilisateur"} />
                      <AvatarFallback className="rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-secondary text-white font-bold text-sm">
                        {userData?.fullName ? getInitials(userData.fullName) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-bold">{userData?.fullName || "Utilisateur"}</span>
                      <span className="truncate text-xs text-muted-foreground/80">
                        {userData?.email || "Client Particulier"}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="ml-auto h-4 w-4 transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-2xl border-sidebar-border/50 bg-sidebar/95 backdrop-blur-xl shadow-2xl"
                side="bottom"
                align="end"
                sideOffset={8}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-3 px-2 py-2 text-left text-sm">
                    <Avatar className="h-10 w-10 rounded-2xl border-2 border-primary/30 shadow-lg">
                      <AvatarImage src="/placeholder-user.jpg" alt={userData?.fullName || "Utilisateur"} />
                      <AvatarFallback className="rounded-2xl bg-gradient-to-br from-primary to-secondary text-white font-bold">
                        {userData?.fullName ? getInitials(userData.fullName) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-bold">{userData?.fullName || "Utilisateur"}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {userData?.email || "email@example.com"}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-sidebar-border/50" />
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer rounded-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-sidebar-accent/60 hover:to-sidebar-accent/30"
                >
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-3 h-4 w-4" />
                    <span>Mon profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-sidebar-accent/60 hover:to-sidebar-accent/30">
                  <Settings className="mr-3 h-4 w-4" />
                  <span>Paramètres</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-sidebar-accent/60 hover:to-sidebar-accent/30">
                  <HelpCircle className="mr-3 h-4 w-4" />
                  <span>Aide</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-sidebar-border/50" />
                <DropdownMenuItem className="cursor-pointer rounded-lg text-destructive transition-all duration-200 hover:bg-destructive/10 focus:text-destructive">
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Se déconnecter</span>
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
