"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Mail, Phone, Building2 } from "lucide-react"
import AuthService from "@/lib/auth-service"
import { config } from "@/lib/config"

function telHref(phone: string) {
  return `tel:${phone.replace(/[\s().-]/g, "")}`
}

export default function SupportPage() {
  const router = useRouter()
  const [isPublicVisitor, setIsPublicVisitor] = useState(true)

  useEffect(() => {
    setIsPublicVisitor(!AuthService.isAuthenticated())
  }, [])

  const phone = config.SUPPORT_PHONE
  const email = config.SUPPORT_EMAIL

  return (
    <div className="space-y-6" lang="fr">
      {isPublicVisitor ? (
        <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/[0.06] via-background to-muted/30 p-4 sm:p-5 md:p-6 shadow-[0_1px_0_0_rgba(0,0,0,0.03),0_8px_24px_-8px_rgba(45,110,62,0.12)]">
          <div className="relative space-y-4 sm:space-y-5">
            <button
              type="button"
              onClick={() => router.back()}
              className="group flex h-10 w-10 items-center justify-center rounded-full border border-primary/15 bg-background/80 text-primary shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:bg-background hover:shadow-md hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
              aria-label="Retour à la page précédente"
            >
              <ArrowLeft className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-0.5" aria-hidden />
            </button>

            <div className="flex flex-row items-center justify-between gap-3 sm:gap-4 pt-0.5">
              <div className="min-w-0 flex-1 pr-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary leading-tight">
                  <span className="border-b-[3px] border-[#f4c430] pb-0.5">Sup</span>
                  port client
                </h1>
                <p className="mt-4 sm:mt-5 max-w-md text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  Contactez la Banque Nationale de Guinée pour toute question sur vos comptes ou l’e-banking.
                </p>
              </div>
              <Link
                href="/"
                className="shrink-0 flex items-center self-center rounded-xl p-1.5 ring-1 ring-transparent transition-all duration-300 hover:bg-background/60 hover:ring-primary/15 hover:shadow-md"
                aria-label="Banque Nationale de Guinée — Accueil"
              >
                <Image
                  src="/images/logo-bng.png"
                  alt="BNG - Banque Nationale de Guinée"
                  width={280}
                  height={84}
                  className="h-11 w-auto sm:h-12 md:h-14 lg:h-16 object-contain object-right"
                  priority
                />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-primary">
              <span className="border-b-[3px] border-[#f4c430] pb-0.5">Sup</span>
              port client
            </h1>
            <p className="text-xs text-muted-foreground">
              Coordonnées de la Banque Nationale de Guinée
            </p>
          </div>
        </div>
      )}

      <Card className="border-primary/10 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" aria-hidden />
            Banque Nationale de Guinée
          </CardTitle>
          <CardDescription>Service client et assistance e-banking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4 rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground shrink-0">
              <Phone className="h-4 w-4 text-primary" aria-hidden />
              Téléphone
            </div>
            <a
              href={telHref(phone)}
              className="text-base font-medium text-primary hover:underline break-all"
            >
              {phone}
            </a>
          </div>

          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4 rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground shrink-0">
              <Mail className="h-4 w-4 text-primary" aria-hidden />
              E-mail
            </div>
            <a href={`mailto:${email}`} className="text-base font-medium text-primary hover:underline break-all">
              {email}
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
