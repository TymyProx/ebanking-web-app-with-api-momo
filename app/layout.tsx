import type React from "react"
import type { Metadata } from "next"
import { Space_Grotesk, DM_Sans } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthGuard } from "@/components/auth/auth-guard"
import { ConditionalLayout } from "@/components/layout/conditional-layout"
import { NotificationProvider } from "@/contexts/notification-context"
import { SessionCleanup } from "@/components/auth/session-cleanup"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Astra eBanking - BNG",
  description: "La banque digitale nouvelle génération de la BNG",
  keywords: ["banque", "digital", "BNG", "Astra", "eBanking", "finance"],
  authors: [{ name: "BNG Digital Team" }],
  generator: "v0.dev",
  icons: {
    icon: [
      { url: "/images/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/images/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/images/favicon.ico",
    apple: "/images/apple-touch-icon.png",
  },
  manifest: "/images/site.webmanifest",
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${dmSans.variable} font-body antialiased`}>
        <SessionCleanup />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthGuard>
            <NotificationProvider>
              <ConditionalLayout>{children}</ConditionalLayout>
            </NotificationProvider>
          </AuthGuard>
        </ThemeProvider>
      </body>
    </html>
  )
}
