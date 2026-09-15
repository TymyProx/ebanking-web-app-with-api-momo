import type React from "react"
import {
  Home,
  FileText,
  Building2,
  Wallet,
  BarChart3,
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
  // Virements et carnet de bénéficiaires fermés au lancement (décision BNG 14/09/2026).
  // Réactivation : rétablir le groupe ci-dessous.
  operations: [],
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
        // Notifications masquées au lancement.
      ],
    },
  ],
  support: [],
}
