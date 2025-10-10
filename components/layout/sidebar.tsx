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
      <SidebarHeader className="border-b border-sidebar-border/50 bg-gradient-to-br from-sidebar to-sidebar/95">
        <div className="flex items-center justify-center px-4 py-4">
          <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-white/10 p-2 backdrop-blur-sm">
            <Image src="/images/logo-bng.png" alt="BNG Logo" width={80} height={80} className="object-contain" />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="mb-1 text-xs font-bold uppercase tracking-wider text-sidebar-foreground/50">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationData.main.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url} className="group">
                      <item.icon className="transition-transform group-hover:scale-110" />
                      <span className="whitespace-nowrap">{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto bg-primary/10 text-primary">
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
          <SidebarGroupLabel className="mb-1 text-xs font-bold uppercase tracking-wider text-sidebar-foreground/50">
            Banque
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationData.banking.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <Collapsible asChild defaultOpen className="group/collapsible">
                      <div>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title} className="group">
                            <item.icon className="transition-transform group-hover:scale-110" />
                            <span className="whitespace-nowrap">{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                  <Link href={subItem.url} className="group">
                                    <subItem.icon className="transition-transform group-hover:scale-110" />
                                    <span className="whitespace-nowrap">{subItem.title}</span>
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
                      <Link href={item.url!} className="group">
                        <item.icon className="transition-transform group-hover:scale-110" />
                        <span className="whitespace-nowrap">{item.title}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto bg-primary/10 text-primary">
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
          <SidebarGroupLabel className="mb-1 text-xs font-bold uppercase tracking-wider text-sidebar-foreground/50">
            Services
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationData.services.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <Collapsible asChild className="group/collapsible">
                      <div>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title} className="group">
                            <item.icon className="transition-transform group-hover:scale-110" />
                            <span className="whitespace-nowrap">{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                  <Link href={subItem.url} className="group">
                                    <subItem.icon className="transition-transform group-hover:scale-110" />
                                    <span className="whitespace-nowrap">{subItem.title}</span>
                                    {subItem.badge && (
                                      <Badge variant="outline" className="ml-auto text-xs">
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
                      <Link href={item.url!} className="group">
                        <item.icon className="transition-transform group-hover:scale-110" />
                        <span className="whitespace-nowrap">{item.title}</span>
                        {item.badge && (
                          <Badge variant="destructive" className="ml-auto">
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
          <SidebarGroupLabel className="mb-1 text-xs font-bold uppercase tracking-wider text-sidebar-foreground/50">
            Aide & Support
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationData.support.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <Collapsible asChild className="group/collapsible">
                      <div>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title} className="group">
                            <item.icon className="transition-transform group-hover:scale-110" />
                            <span className="whitespace-nowrap">{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                  <Link href={subItem.url} className="group">
                                    <subItem.icon className="transition-transform group-hover:scale-110" />
                                    <span className="whitespace-nowrap">{subItem.title}</span>
                                    {subItem.badge && (
                                      <Badge
                                        variant="outline"
                                        className="ml-auto bg-green-500/10 text-green-600 text-xs"
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
                      <Link href={item.url!} className="group">
                        <item.icon className="transition-transform group-hover:scale-110" />
                        <span className="whitespace-nowrap">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 bg-gradient-to-br from-sidebar/95 to-sidebar p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent/50 data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent/30"
                >
                  <Avatar className="h-9 w-9 rounded-xl border-2 border-primary/20">
                    <AvatarImage src="/placeholder-user.jpg" alt={userData?.fullName || "Utilisateur"} />
                    <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white font-semibold">
                      {userData?.fullName ? getInitials(userData.fullName) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{userData?.fullName || "Utilisateur"}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {userData?.email || "Client Particulier"}
                    </span>
                  </div>
                  <ChevronRight className="ml-auto size-4 transition-transform group-hover:translate-x-0.5" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-9 w-9 rounded-xl border-2 border-primary/20">
                      <AvatarImage src="/placeholder-user.jpg" alt={userData?.fullName || "Utilisateur"} />
                      <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white font-semibold">
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
                  <Link href="/profile" className="flex items-center cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Mon profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Paramètres</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Aide</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
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
