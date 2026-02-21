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
      <div className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-green-800 via-green-700 to-green-600 bg-clip-text text-transparent">
        {count}
        {suffix}
      </div>
      <div className="text-sm md:text-base text-muted-foreground font-medium uppercase tracking-wide">{label}</div>
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
    <div className="min-h-screen bg-white overflow-hidden">
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          scrolled ? "bg-white/80 backdrop-blur-xl border-b shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-20 items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo-bng.png"
              alt="Astra Bank"
              width={140}
              height={48}
              className="object-contain"
              priority
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#accueil"
              onClick={(e) => handleNavClick(e, "#accueil")}
              className="text-sm font-medium hover:text-gray-700 transition-colors relative group cursor-pointer"
            >
              Accueil
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-700 transition-all group-hover:w-full" />
            </a>
            <a
              href="#services"
              onClick={(e) => handleNavClick(e, "#services")}
              className="text-sm font-medium hover:text-gray-700 transition-colors relative group cursor-pointer"
            >
              Services
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-700 transition-all group-hover:w-full" />
            </a>
            <a
              href="#ebanking"
              onClick={(e) => handleNavClick(e, "#ebanking")}
              className="text-sm font-medium hover:text-gray-700 transition-colors relative group cursor-pointer"
            >
              E-Banking
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-700 transition-all group-hover:w-full" />
            </a>
            <a
              href="#agences"
              onClick={(e) => handleNavClick(e, "#agences")}
              className="text-sm font-medium hover:text-gray-700 transition-colors relative group cursor-pointer"
            >
              Agences
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-700 transition-all group-hover:w-full" />
            </a>
            <a
              href="#contact"
              onClick={(e) => handleNavClick(e, "#contact")}
              className="text-sm font-medium hover:text-gray-700 transition-colors relative group cursor-pointer"
            >
              Contact
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-700 transition-all group-hover:w-full" />
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/signup" className="hidden md:inline-flex">
              <Button variant="outline" className="group bg-transparent hover:bg-yellow-200">
                S'inscrire
              </Button>
            </Link>
            <Link href="/login">
              <Button className="hidden md:inline-flex group bg-green-700 hover:bg-green-800">
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
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-4 py-6">
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
        className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32 bg-gradient-to-br from-gray-50 to-white"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative" ref={heroAnimation.ref}>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div
              className={`space-y-6 md:space-y-8 transition-all duration-1000 ${
                heroAnimation.isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-20"
              }`}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight text-green-700">
                Votre banque,{" "}
                <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold  text-yellow-400">
                  accessible partout
                </span>
              </h1>

              <p className="text-lg sm:text-xl md:text-2xl text-gray-600 leading-relaxed">
                Gérez vos finances en toute simplicité avec Astra eBanking. Des services bancaires modernes, sécurisés
                et disponibles 24h/24 et 7j/7.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/login">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto text-base px-8 py-6 group shadow-lg hover:shadow-xl transition-all bg-green-700 hover:bg-green-800"
                  >
                    Accéder à mon espace
                    <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-base px-8 py-6 border-2 bg-transparent group bg-transparent hover:bg-yellow-200"
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
              className={`relative h-[400px] sm:h-[500px] lg:h-[600px] transition-all duration-1000 delay-300 ${
                heroAnimation.isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-20"
              }`}
            >
              <div className="relative h-full rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-700">
                <Image
                  src="/images/accessibilite.png"
                  alt="Banking Interface"
                  fill
                  className="object-contain p-8"
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24 bg-gray-100 border-y border-gray-200 text-black">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 lg:gap-16">
            <AnimatedStat value={5000} suffix="+" label="Clients actifs" delay={0} />
            <AnimatedStat value={99.9} suffix="%" label="Disponibilité" delay={150} />
            <AnimatedStat value={24} suffix="/7" label="Support client" delay={300} />
            <AnimatedStat value={100} suffix="%" label="Sécurisé" delay={450} />
          </div>
        </div>
      </section>

      <section id="services" className="py-20 md:py-32 bg-white" ref={servicesAnimation.ref}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`text-center mb-12 md:mb-16 space-y-4 transition-all duration-1000 ${
              servicesAnimation.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <Badge variant="outline" className="mb-4 border-gray-300">
              Nos services
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">Solutions bancaires sur mesure</h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Des solutions adaptées à vos besoins, que vous soyez particulier ou professionnel
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
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
                  <div className="relative h-96 overflow-hidden">
                    <Image
                      src={service.image || "/placeholder.svg"}
                      alt={service.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                      sizes="(min-width: 1024px) 50vw, 100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                    <div className="absolute bottom-8 left-8 right-8 space-y-4 transform group-hover:translate-y-0 translate-y-2 transition-transform duration-500">
                      <h3 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">{service.title}</h3>
                      <p className="text-white/90 text-lg md:text-xl">{service.description}</p>
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

      <section id="ebanking" className="py-20 md:py-32 bg-gray-50" ref={ebankingAnimation.ref}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div
              className={`relative h-[500px] sm:h-[600px] md:h-[700px] transition-all duration-1000 ${
                ebankingAnimation.isVisible ? "opacity-100 -translate-x-0" : "opacity-0 -translate-x-20"
              }`}
            >
              <div className="absolute inset-0 flex items-center justify-center gap-4 md:gap-6 lg:gap-8">
                <div className="relative w-80 sm:w-[28rem] md:w-[32rem] h-[650px] sm:h-[750px] md:h-[800px] hover:scale-105 transition-transform duration-500">
                  <Image
                    src="/images/mobile-banking-card-list-screen.png"
                    alt="Mobile App"
                    fill
                    className="object-contain drop-shadow-2xl rounded-2xl"
                    sizes="(min-width: 1024px) 40vw, 90vw"
                  />
                </div>

                <div className="relative w-80 sm:w-[28rem] md:w-[32rem] h-[650px] sm:h-[750px] md:h-[800px] hover:scale-105 transition-transform duration-500">
                  <Image
                    src="/images/mobile-banking-app-screen-dashboard-interface.png"
                    alt="Mobile App"
                    fill
                    className="object-contain drop-shadow-2xl rounded-2xl"
                    sizes="(min-width: 1024px) 40vw, 90vw"
                  />
                </div>
              </div>
            </div>

            <div
              className={`space-y-6 md:space-y-8 transition-all duration-1000 delay-300 ${
                ebankingAnimation.isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-20"
              }`}
            >
              <div className="space-y-4">
                <Badge variant="outline">E-Banking</Badge>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">Découvrez Astra e-Bank</h2>
                <p className="text-lg sm:text-xl font-semibold text-gray-900">
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

      <section className="py-20 md:py-32 bg-white" ref={featuresAnimation.ref}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`text-center mb-12 md:mb-16 space-y-4 transition-all duration-1000 ${
              featuresAnimation.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <Badge variant="outline">Fonctionnalités</Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
              Pourquoi choisir Astra eBanking ?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Une expérience bancaire moderne et sécurisée
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
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

      <section id="agences" className="py-20 md:py-28 bg-gray-50 border-y border-gray-200" ref={agencesAnimation.ref}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 transition-all duration-1000 ${
              agencesAnimation.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <div className="space-y-3">
              <Badge variant="outline" className="border-gray-300">
                Nos agences
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">Trouvez une agence près de vous</h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl">
                Consultez quelques agences et obtenez un itinéraire en un clic.
              </p>
              {agencesError && (
                <p className="text-sm text-gray-500">{agencesError}</p>
              )}
            </div>

            <div className="flex gap-3">
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
              {agencesPreview.map((agence) => {
                const status = getAgenceStatus(agence)
                const badgeClass =
                  status.color === "green"
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : status.color === "red"
                      ? "bg-red-100 text-red-800 border border-red-200"
                      : status.color === "yellow"
                        ? "bg-yellow-100 text-yellow-900 border border-yellow-200"
                        : "bg-gray-100 text-gray-700 border border-gray-200"

                return (
                  <Card key={agence.id} className="border-2 hover:shadow-xl transition-all duration-300 bg-white">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-lg leading-snug break-words">{agence.agenceName}</p>
                          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="break-words">
                              {agence.city}
                              {agence.country ? `, ${agence.country}` : ""}
                            </span>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${badgeClass}`}>
                          {status.label}
                        </span>
                      </div>

                      {(agence.address || agence.postalCode) && (
                        <p className="text-sm text-gray-600 break-words">
                          {agence.address}
                          {agence.postalCode ? ` - ${agence.postalCode}` : ""}
                        </p>
                      )}

                      {agence.telephone && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Phone className="h-4 w-4 text-gray-600" />
                          <a href={`tel:${agence.telephone}`} className="hover:underline">
                            {agence.telephone}
                          </a>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-3 pt-2">
                        <Link href="/agences" className="text-sm text-green-700 hover:text-green-800 hover:underline">
                          Détails
                        </Link>
                        <Button
                          size="sm"
                          className="bg-yellow-400 hover:bg-yellow-450 text-white"
                          onClick={() => handleGetDirections(agence)}
                        >
                          <Navigation className="mr-2 h-4 w-4" />
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

      <section className="py-24 md:py-32 relative overflow-hidden bg-green-50" ref={ctaAnimation.ref}>
        <div
          className={`container mx-auto px-4 sm:px-6 lg:px-8 relative text-center transition-all duration-1000 ${
            ctaAnimation.isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <div className="max-w-4xl mx-auto space-y-8 md:space-y-10">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-green-700 leading-tight">
              Prêt à commencer ?
            </h2>

            <p className="text-lg sm:text-xl md:text-2xl text-gray-700 leading-relaxed max-w-2xl mx-auto font-medium">
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

            <div className="flex flex-wrap justify-center items-center gap-8 pt-8">
              <div className="flex items-center gap-2 text-gray-700">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">100% Sécurisé</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Activation immédiate</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" className="py-16 md:py-20 border-t bg-gray-100 border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div className="space-y-4">
              <Image
                src="/images/logo-bng.png"
                alt="Astra Bank"
                width={140}
                height={48}
                className="object-contain"
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
