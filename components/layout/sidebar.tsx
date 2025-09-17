"use client"

import type * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from "react"
import {
  Home,
  CreditCard,
  ArrowLeftRight,
  Receipt,
  TrendingUp,
  PiggyBank,
  Settings,
  FileText,
  MessageSquare,
  Bell,
  User,
  Building2,
  ChevronRight,
  LogOut,
  HelpCircle,
  DollarSign,
  Wallet,
  BarChart3,
  Shield,
  Clock,
  AlertTriangle,
  Sparkles,
} from "lucide-react"

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
  accounts: [
    {
      title: "Mes Comptes",
      icon: Wallet,
      items: [
        {
          title: "Soldes et positions",
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
          title: "Nouveau virement",
          url: "/transfers/new",
          icon: ArrowLeftRight,
        },
        {
          title: "Bénéficiaires",
          url: "/transfers/beneficiaries",
          icon: User,
        },
      ],
    },
    // {
    //   title: "Paiements",
    //   icon: Receipt,
    //   items: [
    //     {
    //       title: "Payer une facture",
    //       url: "/payments/bills",
    //       icon: Receipt,
    //     },
    //     {
    //       title: "Paiements groupés",
    //       url: "/payments/bulk",
    //       icon: FileText,
    //     },
    //   ],
    // },
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
        {
          title: "Signature électronique",
          url: "/services/signature",
          icon: Shield,
        },
        {
          title: "Provision de fonds",
          url: "/services/funds-provision",
          icon: DollarSign,
        },
        {
          title: "Dépôt de chèque",
          url: "/services/check-deposit",
          icon: Receipt,
        },
        {
          title: "Réclamations",
          url: "/complaints",
          icon: AlertTriangle,
        },
      ],
    },
  ],
  // investments: [
  //   {
  //     title: "Investissements",
  //     icon: TrendingUp,
  //     items: [
  //       {
  //         title: "Mes investissements",
  //         url: "/investments",
  //         icon: TrendingUp,
  //       },
  //       {
  //         title: "Nouveau placement",
  //         url: "/investments/new",
  //         icon: TrendingUp,
  //       },
  //     ],
  //   },
  //   {
  //     title: "Budget",
  //     icon: PiggyBank,
  //     items: [
  //       {
  //         title: "Vue d'ensemble",
  //         url: "/budget",
  //         icon: BarChart3,
  //       },
  //       {
  //         title: "Budget personnel",
  //         url: "/budget/personal",
  //         icon: PiggyBank,
  //       },
  //     ],
  //   },
  // ],
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 text-white font-bold text-sm">
            A
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Astra eBanking</span>
            <span className="truncate text-xs text-muted-foreground">BNG Digital</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Navigation principale */}
        <SidebarGroup>
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
          <SidebarGroupLabel>Comptes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationData.accounts.map((item) => (
                <Collapsible key={item.title} asChild defaultOpen className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title}>
                        <item.icon />
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                              <Link href={subItem.url}>
                                <subItem.icon />
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Opérations */}
        <SidebarGroup>
          <SidebarGroupLabel>Opérations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationData.operations.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
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
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                  <Link href={subItem.url}>
                                    <subItem.icon />
                                    <span>{subItem.title}</span>
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
          <SidebarGroupLabel>Services</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationData.services.map((item) => (
                <Collapsible key={item.title} asChild className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title}>
                        <item.icon />
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                              <Link href={subItem.url}>
                                <subItem.icon />
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Investissements */}
        {/* <SidebarGroup>
          <SidebarGroupLabel>Investissements</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationData.investments.map((item) => (
                <Collapsible key={item.title} asChild className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title}>
                        <item.icon />
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                              <Link href={subItem.url}>
                                <subItem.icon />
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup> */}

        {/* Support */}
        <SidebarGroup>
          <SidebarGroupLabel>Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationData.support.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <Collapsible asChild className="group/collapsible">
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
                            {item.items.map((subItem) => (
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
                  ) : (
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
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

        {/* Autres */}
        <SidebarGroup>
          <SidebarGroupLabel>Autres</SidebarGroupLabel>
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
                <DropdownMenuItem>
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
