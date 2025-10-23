"use client"

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
  Lock,
  Clock,
} from "lucide-react"
import { useState, useEffect } from "react"

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          scrolled ? "bg-background/80 backdrop-blur-xl border-b shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-20 items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/images/logo-bng.png" alt="Astra Bank" width={140} height={48} className="object-contain" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#accueil" className="text-sm font-medium hover:text-primary transition-colors relative group">
              Accueil
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </Link>
            <Link href="#services" className="text-sm font-medium hover:text-primary transition-colors relative group">
              Services
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </Link>
            <Link href="#ebanking" className="text-sm font-medium hover:text-primary transition-colors relative group">
              E-Banking
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </Link>
            <Link href="#contact" className="text-sm font-medium hover:text-primary transition-colors relative group">
              Contact
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button className="hidden md:inline-flex group">
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
          <div className="md:hidden border-t bg-background/95 backdrop-blur-xl">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-4 py-6">
              <Link
                href="#accueil"
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Accueil
              </Link>
              <Link
                href="#services"
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Services
              </Link>
              <Link
                href="#ebanking"
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                E-Banking
              </Link>
              <Link
                href="#contact"
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
              <Link href="/login">
                <Button className="w-full">Se connecter</Button>
              </Link>
            </nav>
          </div>
        )}
      </header>

      <section id="accueil" className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(74,222,128,0.1),transparent_50%)]" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-left duration-700">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
                Votre banque,{" "}
                <span className="bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent animate-gradient">
                  accessible partout
                </span>
              </h1>

              <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground leading-relaxed">
                Gérez vos finances en toute simplicité avec Astra eBanking. Des services bancaires modernes, sécurisés
                et disponibles 24h/24 et 7j/7.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/login">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto text-base px-8 py-6 group shadow-lg hover:shadow-xl transition-all"
                  >
                    Accéder à mon espace
                    <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-base px-8 py-6 border-2 bg-transparent"
                >
                  En savoir plus
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-6 md:gap-8 pt-6 md:pt-8 border-t">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Sécurisé</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Crypté</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">24/7</span>
                </div>
              </div>
            </div>

            <div className="relative h-[400px] sm:h-[500px] lg:h-[600px] animate-in fade-in slide-in-from-right duration-700">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-purple-500/10 to-secondary/20 rounded-3xl blur-3xl animate-pulse" />
              <div className="relative h-full rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/modern-banking-mobile-app-interface-dashboard.jpg"
                  alt="Banking Interface"
                  fill
                  className="object-contain p-8 hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-muted/30 border-y">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { value: "50K+", label: "Clients actifs" },
              { value: "99.9%", label: "Disponibilité" },
              { value: "24/7", label: "Support client" },
              { value: "100%", label: "Sécurisé" },
            ].map((stat, index) => (
              <div key={index} className="text-center space-y-2">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="py-20 md:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16 space-y-4">
            <Badge variant="outline" className="mb-4">
              Nos services
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">Solutions bancaires sur mesure</h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Des solutions adaptées à vos besoins, que vous soyez particulier ou professionnel
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-500 border-2">
              <CardContent className="p-0">
                <div className="relative h-80 overflow-hidden">
                  <Image
                    src="/images/happy-family-using-banking-services-smiling.jpg"
                    alt="Particuliers"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-6 left-6 right-6 md:bottom-8 md:left-8 md:right-8 space-y-4">
                    <h3 className="text-3xl md:text-4xl font-bold text-white">Particuliers</h3>
                    <p className="text-white/90 text-base md:text-lg">Comptes, épargne, crédits et plus</p>
                    <Link href="/login">
                      <Button size="lg" variant="secondary" className="group/btn">
                        Découvrir
                        <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-500 border-2">
              <CardContent className="p-0">
                <div className="relative h-80 overflow-hidden">
                  <Image
                    src="/images/business-professionals-meeting-office-modern.jpg"
                    alt="Professionnels"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute inset-0 bg-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-6 left-6 right-6 md:bottom-8 md:left-8 md:right-8 space-y-4">
                    <h3 className="text-3xl md:text-4xl font-bold text-white">Professionnels</h3>
                    <p className="text-white/90 text-base md:text-lg">Solutions adaptées à votre activité</p>
                    <Link href="/login">
                      <Button size="lg" variant="secondary" className="group/btn">
                        Découvrir
                        <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="ebanking" className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="relative h-[500px] sm:h-[600px] md:h-[700px]">
              <div className="absolute inset-0 flex items-center justify-center gap-4 md:gap-6 lg:gap-8">
                <div className="relative w-80 sm:w-[28rem] md:w-[32rem] h-[650px] sm:h-[750px] md:h-[800px] hover:scale-105 transition-transform duration-500">
                  <Image
                    src="/images/mobile-banking-app-screen-dashboard-interface.jpg"
                    alt="Mobile App"
                    fill
                    className="object-contain drop-shadow-2xl rounded-2xl"
                  />
                </div>

                <div className="relative w-80 sm:w-[28rem] md:w-[32rem] h-[650px] sm:h-[750px] md:h-[800px] hover:scale-105 transition-transform duration-500">
                  <Image
                    src="/images/mobile-banking-transactions-list-screen.jpg"
                    alt="Mobile App"
                    fill
                    className="object-contain drop-shadow-2xl rounded-2xl"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 md:space-y-8">
              <div className="space-y-4">
                <Badge variant="outline">E-Banking</Badge>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">Découvrez Astra e-Bank</h2>
                <p className="text-lg sm:text-xl font-semibold text-primary">
                  VOS OPÉRATIONS BANCAIRES DISPONIBLES 24H/24 ET 7J/7
                </p>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
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
                    <div className="mt-1 rounded-full bg-primary/10 p-1 group-hover:bg-primary/20 transition-colors">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm sm:text-base text-muted-foreground">{advantage}</span>
                  </div>
                ))}
              </div>

              <Link href="/login">
                <Button size="lg" className="group mt-2">
                  Commencer maintenant
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16 space-y-4">
            <Badge variant="outline">Fonctionnalités</Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">Pourquoi choisir Astra eBanking ?</h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
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
                className="group hover:shadow-xl transition-all duration-500 border-2 hover:border-primary/50"
              >
                <CardContent className="p-6 md:p-8 space-y-4">
                  <div
                    className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-lg`}
                  >
                    <feature.icon className="h-6 w-6 md:h-7 md:w-7 text-white" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold">{feature.title}</h3>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-600 to-secondary" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative text-center text-white">
          <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">Prêt à commencer ?</h2>
            <p className="text-lg sm:text-xl md:text-2xl opacity-90 leading-relaxed">
              Rejoignez des milliers de clients qui font confiance à Astra eBanking pour gérer leurs finances
            </p>
            <Link href="/login">
              <Button
                size="lg"
                variant="secondary"
                className="text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 shadow-2xl hover:shadow-3xl transition-all group"
              >
                Accéder à mon espace
                <ChevronRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer id="contact" className="py-16 md:py-20 border-t bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div className="space-y-4">
              <Image src="/images/logo-bng.png" alt="Astra Bank" width={140} height={48} className="object-contain" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Votre partenaire bancaire de confiance pour tous vos besoins financiers.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-base md:text-lg">Services</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Comptes bancaires
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Cartes bancaires
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Crédits
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Épargne
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-base md:text-lg">À propos</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Qui sommes-nous
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Carrières
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Actualités
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-base md:text-lg">Légal</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Mentions légales
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Politique de confidentialité
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    CGU
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© 2025 Astra Bank. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
