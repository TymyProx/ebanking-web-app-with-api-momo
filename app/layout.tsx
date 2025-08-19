import type React from "react"
import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthGuard } from "@/components/auth/auth-guard"
import { ConditionalLayout } from "@/components/layout/conditional-layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Astra eBanking - BNG",
  description: "La banque digitale nouvelle génération de la BNG",
  keywords: ["banque", "digital", "BNG", "Astra", "eBanking", "finance"],
  authors: [{ name: "BNG Digital Team" }],
  viewport: "width=device-width, initial-scale=1",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthGuard>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </AuthGuard>
        </ThemeProvider>
      </body>
    </html>
  )
}
