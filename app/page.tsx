"use client"

import type React from "react"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CreditCard,
  Smartphone,
  Globe,
  Shield,
  TrendingUp,
  FileText,
  Menu,
  X,
  ChevronRight,
  Check,
  ArrowRight,
  Clock,
  MapPin,
  Navigation,
  Phone,
  Loader2,
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { getAgenceStatus, type Agence, useAgences } from "@/hooks/use-agences"

/** Aligné sur login : largeur max sur ultra-wide + gouttières fluides (vw) + safe areas */
const PAGE_SHELL =
  "w-full max-w-[1920px] 2xl:max-w-[min(1920px,96vw)] mx-auto px-4 min-[400px]:px-5 sm:px-6 lg:px-[clamp(1.25rem,2vw,2.5rem)] xl:px-[clamp(1.5rem,2.5vw,3rem)] 2xl:px-[clamp(2rem,3vw,4rem)] [padding-left:max(1rem,env(safe-area-inset-left))] [padding-right:max(1rem,env(safe-area-inset-right))]"

// Custom hook for scroll animations
function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [])

  return { ref, isVisible }
}

// Separate component for animated stat to properly use hooks
function AnimatedStat({
  value,
  suffix,
  label,
  delay,
}: { value: number; suffix: string; label: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (!hasAnimated) {
            setHasAnimated(true)
            let startTime: number | null = null
            const animate = (currentTime: number) => {
              if (!startTime) startTime = currentTime
              const progress = Math.min((currentTime - startTime) / 2000, 1)
              setCount(Math.floor(progress * value))
              if (progress < 1) {
                requestAnimationFrame(animate)
              }
            }
            requestAnimationFrame(animate)
          }
        }
      },
      { threshold: 0.3 },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [value, hasAnimated])

  return (
    <div
      ref={ref}
      className={`text-center space-y-2 transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
      style={{
        transitionDelay: `${delay}ms`,
      }}
    >
      <div className="text-3xl min-[400px]:text-4xl md:text-5xl lg:text-[clamp(2rem,4.5vw,3.75rem)] xl:text-[clamp(2.25rem,4vw,4rem)] 2xl:text-[clamp(2.5rem,3.5vw,4.5rem)] font-bold bg-gradient-to-r from-green-800 via-green-700 to-green-600 bg-clip-text text-transparent tabular-nums">
        {count}
        {suffix}
      </div>
      <div className="text-xs sm:text-sm md:text-base text-muted-foreground font-medium uppercase tracking-wide">
        {label}
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const heroAnimation = useScrollAnimation()
  const servicesAnimation = useScrollAnimation()
  const ebankingAnimation = useScrollAnimation()
  const featuresAnimation = useScrollAnimation()
  const agencesAnimation = useScrollAnimation()
  const ctaAnimation = useScrollAnimation()

  const { agences: agencesPreview, loading: agencesLoading, error: agencesError } = useAgences({
    page: 1,
    limit: 6,
  })

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
      setMobileMenuOpen(false)
    }
  }

  const handleGetDirections = (agence: Agence) => {
    if (agence.mapEmbedUrl) {
      window.open(agence.mapEmbedUrl, "_blank")
      return
    }

    if (agence.latitude && agence.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${agence.latitude},${agence.longitude}`
      window.open(url, "_blank")
    } else if (agence.address || agence.city) {
      const query = encodeURIComponent(`${agence.address || ""} ${agence.city || ""}`.trim())
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank")
    }
  }

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth"
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
      document.documentElement.style.scrollBehavior = "auto"
    }
  }, [])

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          scrolled ? "bg-white/80 backdrop-blur-xl border-b shadow-sm" : "bg-transparent"
        }`}
      >
        <div className={`${PAGE_SHELL} flex h-[4.5rem] sm:h-20 items-center justify-between gap-3`}>
          <div className="flex items-center gap-2 min-w-0 shrink">
            <Image
              src="/images/logo-bng.png"
              alt="Astra Bank"
              width={140}
              height={48}
              className="object-contain w-[7.5rem] sm:w-32 md:w-36 lg:w-[clamp(8rem,12vw,11rem)] h-auto max-h-12"
              priority
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-6 xl:gap-8 2xl:gap-10 flex-1 justify-center max-w-3xl mx-4">
            <a
              href="#accueil"
              onClick={(e) => handleNavClick(e, "#accueil")}
              className="text-sm lg:text-[clamp(0.8125rem,0.95vw,0.9375rem)] font-medium hover:text-gray-700 transition-colors relative group cursor-pointer whitespace-nowrap"
            >
              Accueil
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-700 transition-all group-hover:w-full" />
            </a>
            <a
              href="#services"
              onClick={(e) => handleNavClick(e, "#services")}
              className="text-sm lg:text-[clamp(0.8125rem,0.95vw,0.9375rem)] font-medium hover:text-gray-700 transition-colors relative group cursor-pointer whitespace-nowrap"
            >
              Services
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-700 transition-all group-hover:w-full" />
            </a>
            <a
              href="#ebanking"
              onClick={(e) => handleNavClick(e, "#ebanking")}
              className="text-sm lg:text-[clamp(0.8125rem,0.95vw,0.9375rem)] font-medium hover:text-gray-700 transition-colors relative group cursor-pointer whitespace-nowrap"
            >
              E-Banking
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-700 transition-all group-hover:w-full" />
            </a>
            <a
              href="#agences"
              onClick={(e) => handleNavClick(e, "#agences")}
              className="text-sm lg:text-[clamp(0.8125rem,0.95vw,0.9375rem)] font-medium hover:text-gray-700 transition-colors relative group cursor-pointer whitespace-nowrap"
            >
              Agences
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-700 transition-all group-hover:w-full" />
            </a>
            <a
              href="#contact"
              onClick={(e) => handleNavClick(e, "#contact")}
              className="text-sm lg:text-[clamp(0.8125rem,0.95vw,0.9375rem)] font-medium hover:text-gray-700 transition-colors relative group cursor-pointer whitespace-nowrap"
            >
              Contact
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-700 transition-all group-hover:w-full" />
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link href="/signup" className="hidden md:inline-flex">
              <Button
                variant="outline"
                className="group bg-transparent hover:bg-yellow-200 text-sm lg:text-[clamp(0.8125rem,0.9vw,0.875rem)] px-3 lg:px-[clamp(0.75rem,1.2vw,1rem)]"
              >
                S'inscrire
              </Button>
            </Link>
            <Link href="/login">
              <Button className="hidden md:inline-flex group bg-green-700 hover:bg-green-800 text-sm lg:text-[clamp(0.8125rem,0.9vw,0.875rem)] px-3 lg:px-[clamp(0.75rem,1.2vw,1.25rem)]">
                Se connecter
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white/95 backdrop-blur-xl">
            <nav className={`${PAGE_SHELL} flex flex-col gap-4 py-6`}>
              <a
                href="#accueil"
                onClick={(e) => handleNavClick(e, "#accueil")}
                className="text-sm font-medium hover:text-gray-700 transition-colors cursor-pointer"
              >
                Accueil
              </a>
              <a
                href="#services"
                onClick={(e) => handleNavClick(e, "#services")}
                className="text-sm font-medium hover:text-gray-700 transition-colors cursor-pointer"
              >
                Services
              </a>
              <a
                href="#ebanking"
                onClick={(e) => handleNavClick(e, "#ebanking")}
                className="text-sm font-medium hover:text-gray-700 transition-colors cursor-pointer"
              >
                E-Banking
              </a>
              <a
                href="#agences"
                onClick={(e) => handleNavClick(e, "#agences")}
                className="text-sm font-medium hover:text-gray-700 transition-colors cursor-pointer"
              >
                Agences
              </a>
              <a
                href="#contact"
                onClick={(e) => handleNavClick(e, "#contact")}
                className="text-sm font-medium hover:text-gray-700 transition-colors cursor-pointer"
              >
                Contact
              </a>
              <Link href="/signup">
                <Button variant="outline" className="w-full bg-transparent border-gray-300">
                  S'inscrire
                </Button>
              </Link>
              <Link href="/login">
                <Button className="w-full bg-green-700 hover:bg-green-800">Se connecter</Button>
              </Link>
            </nav>
          </div>
        )}
      </header>

      <section
        id="accueil"
        className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20 md:pt-40 md:pb-28 lg:pb-32 xl:pt-[clamp(8rem,12vw,11rem)] xl:pb-[clamp(4rem,6vw,7rem)] bg-gradient-to-br from-gray-50 to-white"
      >
        <div className={`${PAGE_SHELL} relative`} ref={heroAnimation.ref}>
          <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-[clamp(2.5rem,4vw,5rem)] xl:gap-[clamp(3rem,5vw,6rem)] items-center">
            <div
              className={`space-y-6 md:space-y-8 transition-all duration-1000 ${
                heroAnimation.isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-20"
              }`}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[clamp(2.25rem,4.5vw,3.75rem)] xl:text-[clamp(2.5rem,4vw,4.25rem)] 2xl:text-[clamp(2.75rem,3.5vw,4.75rem)] font-bold tracking-tight leading-[1.12] sm:leading-tight text-green-700">
                Votre banque,{" "}
                <span className="font-bold text-yellow-400 block sm:inline">
                  accessible partout
                </span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl lg:text-[clamp(1.05rem,1.35vw,1.5rem)] xl:max-w-[min(100%,42rem)] text-gray-600 leading-relaxed">
                Gérez vos finances en toute simplicité avec Astra eBanking. Des services bancaires modernes, sécurisés
                et disponibles 24h/24 et 7j/7.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/login">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto text-base lg:text-[clamp(0.95rem,1.1vw,1.05rem)] px-6 py-5 sm:px-8 sm:py-6 lg:px-[clamp(1.75rem,2.5vw,2.25rem)] lg:py-[clamp(1.25rem,1.8vw,1.65rem)] group shadow-lg hover:shadow-xl transition-all bg-green-700 hover:bg-green-800"
                  >
                    Accéder à mon espace
                    <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-base lg:text-[clamp(0.95rem,1.1vw,1.05rem)] px-6 py-5 sm:px-8 sm:py-6 lg:px-[clamp(1.75rem,2.5vw,2.25rem)] lg:py-[clamp(1.25rem,1.8vw,1.65rem)] border-2 bg-transparent group bg-transparent hover:bg-yellow-200"
                >
                  En savoir plus
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-6 md:gap-8 pt-6 md:pt-8 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-gray-700" />
                  <span className="text-sm font-medium text-gray-700">Sécurisé</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-700" />
                  <span className="text-sm font-medium text-gray-700">24/7</span>
                </div>
              </div>
            </div>

            <div
              className={`relative min-h-[280px] h-[min(52vh,420px)] sm:h-[min(58vh,500px)] md:h-[min(62vh,560px)] lg:h-[min(68vh,640px)] xl:h-[min(72vh,720px)] 2xl:h-[min(75vh,800px)] max-h-[900px] mx-auto w-full max-w-[min(100%,920px)] lg:max-w-none transition-all duration-1000 delay-300 ${
                heroAnimation.isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-20"
              }`}
            >
              <div className="relative h-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl transform hover:scale-[1.02] lg:hover:scale-105 transition-transform duration-700">
                <Image
                  src="/images/accessibilite.png"
                  alt="Banking Interface"
                  fill
                  className="object-contain p-4 sm:p-6 lg:p-[clamp(1rem,2vw,2.5rem)]"
                  priority
                  sizes="(min-width: 1536px) 42vw, (min-width: 1024px) 48vw, 100vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 md:py-24 xl:py-[clamp(5rem,6vw,7rem)] bg-gray-100 border-y border-gray-200 text-black">
        <div className={`${PAGE_SHELL}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-12 lg:gap-[clamp(2rem,3vw,4rem)] xl:gap-[clamp(2.5rem,3.5vw,5rem)]">
            <AnimatedStat value={5000} suffix="+" label="Clients actifs" delay={0} />
            <AnimatedStat value={99.9} suffix="%" label="Disponibilité" delay={150} />
            <AnimatedStat value={24} suffix="/7" label="Support client" delay={300} />
            <AnimatedStat value={100} suffix="%" label="Sécurisé" delay={450} />
          </div>
        </div>
      </section>

      <section
        id="services"
        className="py-16 sm:py-20 md:py-28 lg:py-32 xl:py-[clamp(6rem,8vw,9rem)] bg-white"
        ref={servicesAnimation.ref}
      >
        <div className={`${PAGE_SHELL}`}>
          <div
            className={`text-center mb-12 md:mb-16 space-y-4 transition-all duration-1000 ${
              servicesAnimation.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <Badge variant="outline" className="mb-4 border-gray-300">
              Nos services
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[clamp(1.75rem,3.5vw,3.25rem)] xl:text-[clamp(2rem,3vw,3.5rem)] font-bold text-gray-900 max-w-[min(100%,48rem)] mx-auto">
              Solutions bancaires sur mesure
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-[clamp(1rem,1.25vw,1.25rem)] text-gray-600 max-w-2xl mx-auto px-1">
              Des solutions adaptées à vos besoins, que vous soyez particulier ou professionnel
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-[clamp(1.5rem,2.5vw,2.5rem)] xl:gap-10">
            {[
              {
                image: "/images/particulier.png",
                title: "Particuliers",
                description: "Comptes, épargne, crédits et plus",
              },
              {
                image: "/images/entreprise.png",
                title: "Professionnels",
                description: "Solutions adaptées à votre activité",
              },
            ].map((service, index) => (
              <Card
                key={index}
                className={`group overflow-hidden hover:shadow-2xl transition-all duration-700 border-2 hover:border-gray-400 ${
                  servicesAnimation.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <CardContent className="p-0">
                  <div className="relative h-72 sm:h-80 md:h-96 lg:h-[min(28rem,50vh)] xl:h-[min(32rem,55vh)] 2xl:h-[min(36rem,60vh)] overflow-hidden">
                    <Image
                      src={service.image || "/placeholder.svg"}
                      alt={service.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                      sizes="(min-width: 1024px) 50vw, 100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8 sm:right-8 space-y-3 sm:space-y-4 transform group-hover:translate-y-0 translate-y-2 transition-transform duration-500">
                      <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-[clamp(1.75rem,3vw,2.75rem)] font-bold text-white drop-shadow-lg">
                        {service.title}
                      </h3>
                      <p className="text-white/90 text-base sm:text-lg md:text-[clamp(1rem,1.35vw,1.25rem)]">
                        {service.description}
                      </p>
                      <Link href="/login">
                        <Button
                          size="lg"
                          className="group/btn shadow-xl hover:shadow-2xl bg-yellow-400 text-white hover:bg-yellow-450"
                        >
                          Découvrir
                          <ChevronRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover/btn:translate-x-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section
        id="ebanking"
        className="py-16 sm:py-20 md:py-28 lg:py-32 xl:py-[clamp(6rem,8vw,9rem)] bg-gray-50 overflow-x-hidden"
        ref={ebankingAnimation.ref}
      >
        <div className={`${PAGE_SHELL}`}>
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-[clamp(2rem,4vw,5rem)] xl:gap-[clamp(2.5rem,5vw,6rem)] items-center">
            <div
              className={`relative min-h-[320px] h-[min(70vh,520px)] sm:min-h-[400px] sm:h-[min(75vh,600px)] lg:h-[min(78vh,680px)] xl:h-[min(80vh,760px)] w-full max-w-full mx-auto transition-all duration-1000 ${
                ebankingAnimation.isVisible ? "opacity-100 -translate-x-0" : "opacity-0 -translate-x-20"
              }`}
            >
              <div className="absolute inset-0 flex flex-row flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-5 lg:gap-[clamp(0.75rem,2vw,1.5rem)] xl:gap-6 2xl:gap-8 px-1 sm:px-2">
                <div className="relative w-[42%] max-w-[280px] sm:w-[38%] sm:max-w-[320px] md:max-w-[340px] lg:w-[min(42%,18rem)] xl:w-[min(44%,20rem)] 2xl:w-[min(45%,22rem)] aspect-[9/19] min-h-[280px] sm:min-h-[340px] md:min-h-[380px] lg:min-h-[420px] max-h-[min(85vh,820px)] hover:scale-[1.02] lg:hover:scale-105 transition-transform duration-500">
                  <Image
                    src="/images/mobile-banking-card-list-screen.png"
                    alt="Application mobile — liste des cartes"
                    fill
                    className="object-contain object-bottom drop-shadow-2xl rounded-2xl"
                    sizes="(min-width: 1536px) 22vw, (min-width: 1024px) 28vw, 45vw"
                  />
                </div>

                <div className="relative w-[42%] max-w-[280px] sm:w-[38%] sm:max-w-[320px] md:max-w-[340px] lg:w-[min(42%,18rem)] xl:w-[min(44%,20rem)] 2xl:w-[min(45%,22rem)] aspect-[9/19] min-h-[280px] sm:min-h-[340px] md:min-h-[380px] lg:min-h-[420px] max-h-[min(85vh,820px)] hover:scale-[1.02] lg:hover:scale-105 transition-transform duration-500">
                  <Image
                    src="/images/mobile-banking-app-screen-dashboard-interface.png"
                    alt="Application mobile — tableau de bord"
                    fill
                    className="object-contain object-bottom drop-shadow-2xl rounded-2xl"
                    sizes="(min-width: 1536px) 22vw, (min-width: 1024px) 28vw, 45vw"
                  />
                </div>
              </div>
            </div>

            <div
              className={`space-y-6 md:space-y-8 min-w-0 transition-all duration-1000 delay-300 ${
                ebankingAnimation.isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-20"
              }`}
            >
              <div className="space-y-4">
                <Badge variant="outline">E-Banking</Badge>
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[clamp(1.75rem,3.25vw,3.25rem)] xl:text-[clamp(2rem,2.8vw,3.5rem)] font-bold">
                  Découvrez Astra e-Bank
                </h2>
                <p className="text-base sm:text-lg md:text-xl lg:text-[clamp(1.05rem,1.35vw,1.35rem)] font-semibold text-gray-900">
                  VOS OPÉRATIONS BANCAIRES DISPONIBLES 24H/24 ET 7J/7
                </p>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                  Astra e-Bank est une plateforme en ligne qui vous permet de consulter l'activité de vos comptes,
                  d'effectuer des virements et d'émettre diverses requêtes 24h/24 et 7j/7.
                </p>
              </div>

              <div className="space-y-3 md:space-y-4">
                {[
                  "Consultation du solde et de l'historique des opérations",
                  "Détail des mouvements avec dates de valeur",
                  "Consultation de vos dépôts et emprunts",
                  "Possibilité d'effectuer des virements et de régler vos factures",
                  "Édition de relevé de compte",
                  "Commande de chéquier",
                  "Impression de RIB",
                  "Et bien plus encore",
                ].map((advantage, index) => (
                  <div key={index} className="flex items-start gap-3 group">
                    <div className="mt-1 rounded-full bg-gray-100 p-1 group-hover:bg-gray-200 transition-colors">
                      <Check className="h-4 w-4 text-gray-900" />
                    </div>
                    <span className="text-sm sm:text-base text-gray-600">{advantage}</span>
                  </div>
                ))}
              </div>

              <Link href="/login">
                <Button size="lg" className="group mt-2 bg-green-700 hover:bg-green-800 text-white">
                  Commencer maintenant
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        className="py-16 sm:py-20 md:py-28 lg:py-32 xl:py-[clamp(6rem,8vw,9rem)] bg-white"
        ref={featuresAnimation.ref}
      >
        <div className={`${PAGE_SHELL}`}>
          <div
            className={`text-center mb-12 md:mb-16 space-y-4 transition-all duration-1000 ${
              featuresAnimation.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <Badge variant="outline">Fonctionnalités</Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[clamp(1.75rem,3.25vw,3.25rem)] font-bold text-gray-900 max-w-[min(100%,48rem)] mx-auto">
              Pourquoi choisir Astra eBanking ?
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-[clamp(1rem,1.25vw,1.25rem)] text-gray-600 max-w-2xl mx-auto px-1">
              Une expérience bancaire moderne et sécurisée
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8 lg:gap-[clamp(1.25rem,2vw,2rem)]">
            {[
              {
                icon: CreditCard,
                title: "Cartes bancaires",
                description: "Gérez vos cartes et effectuez vos paiements en toute sécurité",
                color: "from-blue-500 to-cyan-500",
              },
              {
                icon: Smartphone,
                title: "Paiement mobile",
                description: "Payez avec votre téléphone, partout et à tout moment",
                color: "from-purple-500 to-pink-500",
              },
              {
                icon: Globe,
                title: "Virements internationaux",
                description: "Transférez de l'argent dans le monde entier rapidement",
                color: "from-green-500 to-emerald-500",
              },
              {
                icon: Shield,
                title: "Sécurité maximale",
                description: "Vos données sont protégées par les dernières technologies",
                color: "from-orange-500 to-red-500",
              },
              {
                icon: TrendingUp,
                title: "Épargne et investissement",
                description: "Faites fructifier votre argent avec nos solutions d'épargne",
                color: "from-indigo-500 to-purple-500",
              },
              {
                icon: FileText,
                title: "Relevés en ligne",
                description: "Accédez à vos relevés bancaires à tout moment",
                color: "from-teal-500 to-cyan-500",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className={`group overflow-hidden hover:shadow-2xl transition-all duration-700 border-2 hover:border-gray-400 hover:-translate-y-3 bg-gradient-to-br from-background to-muted/30 ${
                  featuresAnimation.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-8 space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-100 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-lg relative z-10`}
                  >
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold relative z-10 text-gray-900">{feature.title}</h3>
                  <p className="text-base text-gray-600 leading-relaxed relative z-10">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section
        id="agences"
        className="py-16 sm:py-20 md:py-28 xl:py-[clamp(5.5rem,7vw,8rem)] bg-gray-50 border-y border-gray-200"
        ref={agencesAnimation.ref}
      >
        <div className={`${PAGE_SHELL}`}>
          <div
            className={`text-center mb-12 md:mb-16 space-y-4 transition-all duration-1000 ${
              agencesAnimation.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <Badge variant="outline" className="mb-4 border-gray-300">
              Nos agences
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[clamp(1.75rem,3.25vw,3.25rem)] font-bold text-gray-900 max-w-[min(100%,48rem)] mx-auto">
              Trouvez une agence près de vous
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-[clamp(1rem,1.25vw,1.25rem)] text-gray-600 max-w-2xl mx-auto px-1">
              Consultez quelques agences et obtenez un itinéraire en un clic.
            </p>
            {agencesError && (
              <p className="text-sm text-gray-500 mt-2">{agencesError}</p>
            )}
            <div className="flex justify-center pt-4">
              <Link href="/agences">
                <Button className="bg-green-700 hover:bg-green-800">
                  Voir toutes les agences
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {agencesLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="border-2">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Chargement des agences...</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : agencesPreview.length === 0 ? (
            <Card className="border-2">
              <CardContent className="p-8 text-center space-y-3">
                <p className="text-gray-700 font-medium">Aucune agence publiée pour le moment.</p>
                <p className="text-sm text-gray-600">
                  Les agences affichées ici proviennent de la base de données. Si vous êtes administrateur, publiez des
                  agences (e-portal) dans le Back-Office.
                </p>
                <Link href="/agences">
                  <Button variant="outline" className="bg-transparent">
                    Ouvrir la page agences
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {agencesPreview.map((agence, index) => {
                const status = getAgenceStatus(agence)
                const badgeClass =
                  status.color === "green"
                    ? "bg-gradient-to-r from-green-700 to-green-800 text-white shadow-lg shadow-green-700/30"
                    : status.color === "red"
                      ? "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/30"
                      : status.color === "yellow"
                        ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg shadow-yellow-500/30"
                        : "bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-lg shadow-gray-500/30"

                return (
                  <Card
                    key={agence.id}
                    className={`group overflow-hidden hover:shadow-2xl transition-all duration-500 border-2 hover:border-green-700 hover:-translate-y-2 bg-gradient-to-br from-white to-gray-50/50 ${
                      agencesAnimation.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
                    }`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <CardContent className="p-6 space-y-5 relative">
                      {/* Effet de fond animé */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-700/20 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                      
                      {/* Header avec badge */}
                      <div className="flex items-start justify-between gap-3 relative z-10">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-gray-900 text-xl leading-tight break-words group-hover:text-green-700 transition-colors">
                            {agence.agenceName}
                          </h3>
                          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                            <div className="p-1.5 rounded-lg bg-green-700/10 group-hover:bg-green-700/20 transition-colors">
                              <MapPin className="h-4 w-4 text-green-700 flex-shrink-0" />
                            </div>
                            <span className="break-words font-medium">
                              {agence.city}
                              {agence.country ? `, ${agence.country}` : ""}
                            </span>
                          </div>
                        </div>
                        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap shadow-md ${badgeClass}`}>
                          {status.label}
                        </span>
                      </div>

                      {/* Adresse avec icône */}
                      {(agence.address || agence.postalCode) && (
                        <div className="relative z-10">
                          <p className="text-sm text-gray-600 break-words leading-relaxed pl-7 relative">
                            <MapPin className="absolute left-0 top-0.5 h-4 w-4 text-gray-400" />
                            {agence.address}
                            {agence.postalCode ? ` - ${agence.postalCode}` : ""}
                          </p>
                        </div>
                      )}

                      {/* Téléphone avec icône */}
                      {agence.telephone && (
                        <div className="flex items-center gap-3 text-sm text-gray-700 relative z-10 group/phone">
                          <div className="p-2 rounded-lg bg-blue-50 group-hover/phone:bg-blue-100 transition-colors">
                            <Phone className="h-4 w-4 text-blue-600" />
                          </div>
                          <a 
                            href={`tel:${agence.telephone}`} 
                            className="hover:text-blue-600 hover:underline font-medium transition-colors"
                          >
                            {agence.telephone}
                          </a>
                        </div>
                      )}

                      {/* Divider */}
                      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent relative z-10" />

                      {/* Actions */}
                      <div className="flex items-center justify-between gap-3 pt-1 relative z-10">
                        <Link 
                          href="/agences" 
                          className="text-sm font-medium text-green-700 hover:text-green-800 hover:underline transition-colors flex items-center gap-1 group/link"
                        >
                          Détails
                          <ChevronRight className="h-3 w-3 transition-transform group-hover/link:translate-x-1" />
                        </Link>
                        <Button
                          size="sm"
                          className="bg-gray-100 hover:bg-gray-200 text-gray-900 border-2 border-yellow-400 hover:border-yellow-400 shadow-md hover:shadow-lg transition-all duration-300 group/btn"
                          onClick={() => handleGetDirections(agence)}
                        >
                          <Navigation className="mr-2 h-4 w-4 transition-transform group-hover/btn:rotate-12" />
                          Itinéraire
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section
        className="py-20 sm:py-24 md:py-28 lg:py-32 xl:py-[clamp(6.5rem,9vw,10rem)] relative overflow-hidden bg-green-50"
        ref={ctaAnimation.ref}
      >
        <div
          className={`${PAGE_SHELL} relative text-center transition-all duration-1000 ${
            ctaAnimation.isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <div className="max-w-[min(100%,56rem)] xl:max-w-[min(100%,60rem)] mx-auto space-y-6 sm:space-y-8 md:space-y-10 px-1">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-[clamp(2.25rem,4.5vw,4rem)] xl:text-[clamp(2.5rem,4vw,4.5rem)] 2xl:text-[clamp(2.75rem,3.5vw,5rem)] font-bold text-green-700 leading-[1.1] sm:leading-tight">
              Prêt à commencer ?
            </h2>

            <p className="text-base sm:text-lg md:text-xl lg:text-[clamp(1.05rem,1.5vw,1.5rem)] text-gray-700 leading-relaxed max-w-2xl mx-auto font-medium">
              Rejoignez des milliers de clients qui font confiance à Astra eBanking pour gérer leurs finances
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link href="/login">
                <Button
                  size="lg"
                  className="text-base sm:text-lg px-10 sm:px-12 py-7 sm:py-8 shadow-2xl hover:shadow-3xl transition-all duration-500 group bg-green-600 hover:bg-green-700 text-white border-2 border-green-600 hover:border-green-700 hover:scale-105"
                >
                  Accéder à mon espace
                  <ChevronRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:translate-x-2" />
                </Button>
              </Link>

              <Link href="/signup">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base sm:text-lg px-10 sm:px-12 py-7 sm:py-8 shadow-lg hover:shadow-xl transition-all duration-500 group bg-white/80 backdrop-blur-sm border-2 border-yellow-400 hover:bg-yellow-50 hover:border-yellow-500 text-gray-900 hover:scale-105"
                >
                  Créer un compte
                  <ArrowRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:translate-x-2" />
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </section>

      <footer id="contact" className="py-12 sm:py-16 md:py-20 xl:py-[clamp(4rem,5vw,6rem)] border-t bg-gray-100 border-gray-200">
        <div className={`${PAGE_SHELL}`}>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 lg:gap-12 xl:gap-[clamp(2rem,3vw,3.5rem)]">
            <div className="space-y-4">
              <Image
                src="/images/logo-bng.png"
                alt="Astra Bank"
                width={140}
                height={48}
                className="object-contain w-[7rem] sm:w-32 lg:w-[clamp(7.5rem,10vw,10rem)] h-auto"
                loading="lazy"
              />
              <p className="text-sm text-gray-600 leading-relaxed">
                Votre partenaire bancaire de confiance pour tous vos besoins financiers.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-base md:text-lg text-gray-900">Services</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li>
                  <Link href="#" className="hover:text-gray-700 transition-colors">
                    Comptes bancaires
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-gray-700 transition-colors">
                    Cartes bancaires
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-gray-700 transition-colors">
                    Crédits
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-gray-700 transition-colors">
                    Épargne
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-base md:text-lg text-gray-900">À propos</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li>
                  <Link href="#" className="hover:text-gray-700 transition-colors">
                    Qui sommes-nous
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-gray-700 transition-colors">
                    Carrières
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-gray-700 transition-colors">
                    Actualités
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-gray-700 transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-base md:text-lg text-gray-900">Légal</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li>
                  <Link href="#" className="hover:text-gray-700 transition-colors">
                    Mentions légales
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-gray-700 transition-colors">
                    Politique de confidentialité
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-gray-700 transition-colors">
                    CGU
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-gray-600">
            <p>© 2025 Astra Bank. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
