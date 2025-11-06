import type React from "react"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthGuard } from "@/components/auth/auth-guard"
import { ConditionalLayout } from "@/components/layout/conditional-layout"
import { NotificationProvider } from "@/contexts/notification-context"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
})

const poppinsBody = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Astra eBanking - BNG",
  description: "La banque digitale nouvelle génération de la BNG",
  keywords: ["banque", "digital", "BNG", "Astra", "eBanking", "finance"],
  authors: [{ name: "BNG Digital Team" }],
  generator: "v0.dev",
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
      <body className={`${poppins.variable} ${poppinsBody.variable} font-body antialiased`}>
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
