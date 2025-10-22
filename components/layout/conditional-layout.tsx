"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Toaster } from "@/components/ui/toaster"

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()

  // Pages qui n'ont pas besoin du layout principal (sidebar + header)
  const publicPaths = ["/login", "/auth/accept-invite"]
  const isPublicPage = publicPaths.some((path) => pathname.startsWith(path))

  if (isPublicPage) {
    return (
      <>
        {children}
        <Toaster />
      </>
    )
  }

  return (
    <SidebarProvider defaultOpen={true} collapsible="icon">
      <AppSidebar />
      <SidebarInset>
        <Header />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}
