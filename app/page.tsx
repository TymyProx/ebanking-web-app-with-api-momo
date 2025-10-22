import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Building2,
  Users,
  Shield,
  Clock,
  Smartphone,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
} from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-heading font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Astra eBanking
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#services" className="text-sm font-medium hover:text-primary transition-colors">
              Services
            </Link>
            <Link href="#produits" className="text-sm font-medium hover:text-primary transition-colors">
              Produits
            </Link>
            <Link href="#ebanking" className="text-sm font-medium hover:text-primary transition-colors">
              E-Banking
            </Link>
            <Link href="#contact" className="text-sm font-medium hover:text-primary transition-colors">
              Contact
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity">
                Se connecter
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-block px-4 py-2 bg-primary/10 rounded-full mb-4">
              <span className="text-sm font-medium text-primary">Banque digitale nouvelle génération</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-heading font-bold leading-tight">
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                Votre banque
              </span>
              <br />
              accessible 24h/24 et 7j/7
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Gérez vos comptes, effectuez vos virements et accédez à tous vos services bancaires en toute sécurité
              depuis votre ordinateur ou mobile.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/login">
                <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-lg h-14">
                  Accéder à mon espace
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#ebanking">
                <Button size="lg" variant="outline" className="text-lg h-14 border-2 bg-transparent">
                  Découvrir l'app mobile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section id="services" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="group overflow-hidden border-2 hover:border-primary transition-all duration-300 hover:shadow-xl">
              <CardContent className="p-0">
                <div className="relative h-64 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Users className="h-24 w-24 text-primary opacity-80 group-hover:scale-110 transition-transform" />
                </div>
                <div className="p-8 space-y-4">
                  <h3 className="text-2xl font-heading font-bold">Particuliers</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Comptes courants, épargne, cartes bancaires, crédits personnels et tous les services adaptés à vos
                    besoins quotidiens.
                  </p>
                  <Link href="/login">
                    <Button
                      variant="outline"
                      className="w-full group-hover:bg-primary group-hover:text-white bg-transparent"
                    >
                      Accéder à mes comptes
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="group overflow-hidden border-2 hover:border-secondary transition-all duration-300 hover:shadow-xl">
              <CardContent className="p-0">
                <div className="relative h-64 bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center">
                  <Building2 className="h-24 w-24 text-secondary opacity-80 group-hover:scale-110 transition-transform" />
                </div>
                <div className="p-8 space-y-4">
                  <h3 className="text-2xl font-heading font-bold">Professionnels & Entreprises</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Solutions bancaires professionnelles, financement d'entreprise, gestion de trésorerie et services
                    dédiés aux PME.
                  </p>
                  <Link href="/login">
                    <Button
                      variant="outline"
                      className="w-full group-hover:bg-secondary group-hover:text-white bg-transparent"
                    >
                      Espace professionnel
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* E-Banking Section */}
      <section id="ebanking" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-heading font-bold">
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Découvrez Astra e-Bank
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Vos opérations bancaires disponibles 24h/24 et 7j/7
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="relative z-10 flex justify-center space-x-4">
                  <div className="w-64 h-[500px] bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl shadow-2xl flex items-center justify-center border-8 border-background">
                    <div className="text-center space-y-4 p-8">
                      <Smartphone className="h-16 w-16 mx-auto text-primary" />
                      <div className="space-y-2">
                        <div className="h-3 bg-primary/30 rounded w-32 mx-auto"></div>
                        <div className="h-3 bg-secondary/30 rounded w-24 mx-auto"></div>
                      </div>
                      <div className="space-y-2 pt-4">
                        <div className="h-16 bg-gradient-to-r from-primary to-secondary rounded-xl"></div>
                        <div className="h-12 bg-muted rounded-xl"></div>
                        <div className="h-12 bg-muted rounded-xl"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl -z-10"></div>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-heading font-bold mb-6">Avantages</h3>
                  <div className="space-y-4">
                    {[
                      "Consultation du solde et de l'historique des opérations",
                      "Détail des mouvements avec dates de valeur",
                      "Consultation de vos dépôts et emprunts",
                      "Possibilité d'effectuer des virements et de régler vos factures",
                      "Édition de relevé de compte",
                      "Commande de chéquier",
                      "Impression de RIB",
                    ].map((feature, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground leading-relaxed">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <p className="text-sm text-muted-foreground mb-4">Téléchargez l'application mobile</p>
                  <div className="flex flex-wrap gap-4">
                    <Button
                      variant="outline"
                      className="h-14 px-6 border-2 hover:bg-primary hover:text-white hover:border-primary bg-transparent"
                    >
                      <svg className="h-6 w-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                      </svg>
                      App Store
                    </Button>
                    <Button
                      variant="outline"
                      className="h-14 px-6 border-2 hover:bg-secondary hover:text-white hover:border-secondary bg-transparent"
                    >
                      <svg className="h-6 w-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z" />
                      </svg>
                      Google Play
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="produits" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-heading font-bold">Pourquoi choisir Astra eBanking ?</h2>
              <p className="text-xl text-muted-foreground">Une banque moderne qui vous accompagne au quotidien</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-2 hover:border-primary transition-all hover:shadow-lg">
                <CardContent className="p-8 space-y-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Shield className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-heading font-bold">Sécurité maximale</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Vos données sont protégées par les dernières technologies de cryptage et d'authentification.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-secondary transition-all hover:shadow-lg">
                <CardContent className="p-8 space-y-4">
                  <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <Clock className="h-7 w-7 text-secondary" />
                  </div>
                  <h3 className="text-xl font-heading font-bold">Disponible 24/7</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Accédez à vos comptes et effectuez vos opérations à tout moment, où que vous soyez.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-accent transition-all hover:shadow-lg">
                <CardContent className="p-8 space-y-4">
                  <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center">
                    <CreditCard className="h-7 w-7 text-accent" />
                  </div>
                  <h3 className="text-xl font-heading font-bold">Services complets</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Virements, paiements, gestion de cartes, relevés... Tout ce dont vous avez besoin en un seul
                    endroit.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-heading font-bold mb-4">Centre de Relation Client</h2>
              <p className="text-muted-foreground">Notre équipe est à votre disposition pour vous accompagner</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardContent className="p-8 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Téléphone</h3>
                    <p className="text-sm text-muted-foreground">+224 XX XX XX XX</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-8 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center mx-auto">
                    <Mail className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Email</h3>
                    <p className="text-sm text-muted-foreground">contact@astra-ebanking.com</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-8 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                    <MapPin className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Adresse</h3>
                    <p className="text-sm text-muted-foreground">Conakry, Guinée</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <span className="text-white font-bold text-sm">A</span>
                  </div>
                  <span className="text-lg font-heading font-bold">Astra eBanking</span>
                </div>
                <p className="text-sm text-muted-foreground">La banque digitale nouvelle génération de la BNG</p>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Services</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="#" className="hover:text-primary transition-colors">
                      Comptes
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-primary transition-colors">
                      Virements
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-primary transition-colors">
                      Cartes
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-primary transition-colors">
                      Paiements
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">À propos</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="#" className="hover:text-primary transition-colors">
                      Qui sommes-nous
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-primary transition-colors">
                      Actualités
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-primary transition-colors">
                      Carrières
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
                <h4 className="font-semibold mb-4">Légal</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="#" className="hover:text-primary transition-colors">
                      Mentions légales
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-primary transition-colors">
                      Confidentialité
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-primary transition-colors">
                      CGU
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-primary transition-colors">
                      Sécurité
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t text-center text-sm text-muted-foreground">
              <p>&copy; {new Date().getFullYear()} Astra eBanking - BNG. Tous droits réservés.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
