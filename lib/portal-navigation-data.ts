import type React from "react"
import {
  Home,
  ArrowLeftRight,
  FileText,
  Bell,
  User,
  Building2,
  Wallet,
  BarChart3,
  Clock,
  AlertCircle,
} from "lucide-react"

export type PortalMenuItem = {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
  badge?: string
}

export type PortalNavigationData = {
  main: PortalMenuItem[]
  accounts: Array<{
    title: string
    icon: React.ComponentType<{ className?: string }>
    items: Array<{
      title: string
      url: string
      icon: React.ComponentType<{ className?: string }>
      badge?: string
    }>
  }>
  operations: Array<{
    title: string
    url?: string
    icon: React.ComponentType<{ className?: string }>
    items?: Array<{
      title: string
      url: string
      icon: React.ComponentType<{ className?: string }>
      badge?: string
    }>
    badge?: string
  }>
  services: Array<{
    title: string
    icon: React.ComponentType<{ className?: string }>
    items: Array<{
      title: string
      url: string
      icon: React.ComponentType<{ className?: string }>
      badge?: string
    }>
  }>
  support: Array<{
    title: string
    url?: string
    icon: React.ComponentType<{ className?: string }>
    items?: Array<{
      title: string
      url: string
      icon: React.ComponentType<{ className?: string }>
      badge?: string
    }>
    badge?: string
  }>
}

/** Données de menu principal (sidebar) — source unique pour la navigation et le carrousel login / auth. */
export const navigationData: PortalNavigationData = {
  main: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      description: "Vue d'ensemble",
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
          title: "Relevé de coordonnées bancaires",
          url: "/accounts/rib",
          icon: FileText,
        },
        {
          title: "Relevés bancaires",
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
  ],
  services: [
    {
      title: "E-Services",
      icon: FileText,
      items: [
        {
          title: "Réclamations",
          url: "/services/reclamation",
          icon: AlertCircle,
        },
        {
          title: "Agences",
          url: "/agences",
          icon: Building2,
        },
        {
          title: "Notifications",
          url: "/notifications",
          icon: Bell,
        },
      ],
    },
  ],
  support: [],
}
