"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CreditCard, Smartphone, Globe, Shield, TrendingUp, FileText, Menu, X, ChevronRight, Check } from "lucide-react"
import { useState } from "react"

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/images/logo-bng.png" alt="Astra Bank" width={120} height={40} className="object-contain" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#accueil" className="text-sm font-medium hover:text-primary transition-colors">
              Accueil
            </Link>
            <Link href="#services" className="text-sm font-medium hover:text-primary transition-colors">
              Services
            </Link>
            <Link href="#ebanking" className="text-sm font-medium hover:text-primary transition-colors">
              E-Banking
            </Link>
            <Link href="#contact" className="text-sm font-medium hover:text-primary transition-colors">
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button className="hidden md:inline-flex">Se connecter</Button>
            </Link>
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t">
            <nav className="container flex flex-col gap-4 py-4">
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

      {/* Hero Section */}
      <section
        id="accueil"
        className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10"
      >
        <div className="container py-24 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-block rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                Banque digitale moderne
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Votre banque,{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  accessible partout
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Gérez vos finances en toute simplicité avec Astra eBanking. Des services bancaires modernes, sécurisés
                et disponibles 24h/24 et 7j/7.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login">
                  <Button size="lg" className="w-full sm:w-auto">
                    Accéder à mon espace
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                  En savoir plus
                </Button>
              </div>
            </div>
            <div className="relative h-[400px] lg:h-[500px]">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-3xl" />
              <Image src="/modern-banking-app.png" alt="Banking Interface" fill className="object-contain p-8" />
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section id="services" className="py-24 bg-muted/50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Nos services</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Des solutions bancaires adaptées à vos besoins, que vous soyez particulier ou professionnel
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Particuliers Card */}
            <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300">
              <CardContent className="p-0">
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src="/happy-family-banking.jpg"
                    alt="Particuliers"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-6 left-6">
                    <h3 className="text-3xl font-bold text-white mb-2">Particuliers</h3>
                    <p className="text-white/90 mb-4">Comptes, épargne, crédits et plus</p>
                    <Link href="/login">
                      <Button variant="secondary">
                        Découvrir
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Professionnels Card */}
            <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300">
              <CardContent className="p-0">
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src="/business-professionals-meeting.png"
                    alt="Professionnels"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-6 left-6">
                    <h3 className="text-3xl font-bold text-white mb-2">Professionnels, Entreprises</h3>
                    <p className="text-white/90 mb-4">Solutions adaptées à votre activité</p>
                    <Link href="/login">
                      <Button variant="secondary">
                        Découvrir
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* E-Banking Section */}
      <section id="ebanking" className="py-24">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-[500px]">
              <div className="absolute inset-0 flex items-center justify-center gap-8">
                <div className="relative w-64 h-[500px]">
                  <Image src="/mobile-banking-app-screen.jpg" alt="Mobile App" fill className="object-contain" />
                </div>
                <div className="relative w-64 h-[500px]">
                  <Image src="/mobile-banking-transactions-screen.jpg" alt="Mobile App" fill className="object-contain" />
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Découvrez Astra e-Bank</h2>
                <p className="text-xl text-muted-foreground mb-2">VOS OPÉRATIONS BANCAIRES</p>
                <p className="text-xl font-semibold mb-6">DISPONIBLES 24H/24 ET 7J/7</p>
                <p className="text-muted-foreground">
                  Astra e-Bank est une plateforme en ligne qui vous permet de consulter l'activité de vos comptes,
                  d'effectuer des virements et d'émettre diverses requêtes 24h/24 et 7j/7.
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-bold mb-6 text-primary">Avantages</h3>
                <div className="space-y-4">
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
                    <div key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{advantage}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login">
                  <Button size="lg" className="w-full sm:w-auto">
                    Commencer maintenant
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-muted/50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Pourquoi choisir Astra eBanking ?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Une expérience bancaire moderne et sécurisée
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: CreditCard,
                title: "Cartes bancaires",
                description: "Gérez vos cartes et effectuez vos paiements en toute sécurité",
              },
              {
                icon: Smartphone,
                title: "Paiement mobile",
                description: "Payez avec votre téléphone, partout et à tout moment",
              },
              {
                icon: Globe,
                title: "Virements internationaux",
                description: "Transférez de l'argent dans le monde entier rapidement",
              },
              {
                icon: Shield,
                title: "Sécurité maximale",
                description: "Vos données sont protégées par les dernières technologies",
              },
              {
                icon: TrendingUp,
                title: "Épargne et investissement",
                description: "Faites fructifier votre argent avec nos solutions d'épargne",
              },
              {
                icon: FileText,
                title: "Relevés en ligne",
                description: "Accédez à vos relevés bancaires à tout moment",
              },
            ].map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary to-secondary text-white">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Prêt à commencer ?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Rejoignez des milliers de clients qui font confiance à Astra eBanking pour gérer leurs finances
          </p>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Accéder à mon espace
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-12 border-t">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Image src="/images/logo-bng.png" alt="Astra Bank" width={120} height={40} className="object-contain" />
              <p className="text-sm text-muted-foreground">
                Votre partenaire bancaire de confiance pour tous vos besoins financiers.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
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
              <h3 className="font-semibold mb-4">À propos</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
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
              <h3 className="font-semibold mb-4">Légal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
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
