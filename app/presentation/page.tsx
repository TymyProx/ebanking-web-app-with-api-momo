"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Home,
  CreditCard,
  ArrowLeftRight,
  TrendingUp,
  PiggyBank,
  HelpCircle,
  Wallet,
  Building2,
  MessageSquare,
  Shield,
  Smartphone,
  Lock,
  Zap,
  Users,
  Star,
  CheckCircle,
  ArrowRight,
  Play,
  Sparkles,
  Headphones,
} from "lucide-react"
import Link from "next/link"

const features = [
  {
    category: "Gestion des Comptes",
    icon: Wallet,
    color: "bg-blue-500",
    items: [
      {
        title: "Consultation des soldes",
        description: "Visualisez vos soldes en temps réel avec des graphiques interactifs",
        href: "/accounts/balance",
        status: "Disponible",
      },
      {
        title: "Relevés de compte",
        description: "Téléchargez et consultez vos relevés mensuels",
        href: "/accounts/statements",
        status: "Disponible",
      },
      {
        title: "Historique détaillé",
        description: "Recherche avancée dans vos transactions",
        href: "/accounts/balance",
        status: "Disponible",
      },
    ],
  },
  {
    category: "Cartes Bancaires",
    icon: CreditCard,
    color: "bg-purple-500",
    items: [
      {
        title: "Gestion des cartes",
        description: "Bloquez, débloquez et gérez vos cartes en temps réel",
        href: "/cartes",
        status: "Nouveau",
      },
      {
        title: "Modification des plafonds",
        description: "Ajustez vos limites de dépenses instantanément",
        href: "/cartes",
        status: "Disponible",
      },
      {
        title: "Sécurité avancée",
        description: "Paramètres de sécurité et notifications SMS",
        href: "/cartes",
        status: "Disponible",
      },
    ],
  },
  {
    category: "Virements & Paiements",
    icon: ArrowLeftRight,
    color: "bg-green-500",
    items: [
      {
        title: "Virements instantanés",
        description: "Effectuez des virements BNG-BNG, confrères et internationaux",
        href: "/transfers/new",
        status: "Disponible",
      },
      {
        title: "Paiement de factures",
        description: "Payez vos factures et commerçants en ligne",
        href: "/payments/bills",
        status: "Disponible",
      },
      {
        title: "Gestion des bénéficiaires",
        description: "Ajoutez et gérez vos bénéficiaires favoris",
        href: "/transfers/beneficiaries",
        status: "Disponible",
      },
    ],
  },
  {
    category: "Investissements",
    icon: TrendingUp,
    color: "bg-orange-500",
    items: [
      {
        title: "Portefeuille d'investissement",
        description: "Suivez vos placements et leur performance",
        href: "/investments",
        status: "Disponible",
      },
      {
        title: "Nouveaux placements",
        description: "Découvrez nos produits d'épargne et d'investissement",
        href: "/investments/new",
        status: "Disponible",
      },
      {
        title: "Analyse de performance",
        description: "Graphiques et statistiques détaillées",
        href: "/investments",
        status: "Disponible",
      },
    ],
  },
  {
    category: "Budget & Épargne",
    icon: PiggyBank,
    color: "bg-pink-500",
    items: [
      {
        title: "Suivi des dépenses",
        description: "Analysez vos habitudes de consommation",
        href: "/budget",
        status: "Disponible",
      },
      {
        title: "Budget personnel",
        description: "Créez et suivez vos budgets mensuels",
        href: "/budget/personal",
        status: "Disponible",
      },
      {
        title: "Objectifs d'épargne",
        description: "Définissez et atteignez vos objectifs financiers",
        href: "/budget",
        status: "Disponible",
      },
    ],
  },
  {
    category: "E-Services",
    icon: Building2,
    color: "bg-indigo-500",
    items: [
      {
        title: "Demandes de services",
        description: "Chéquiers, attestations, et autres demandes",
        href: "/services/requests",
        status: "Disponible",
      },
      {
        title: "RIB électronique",
        description: "Téléchargez votre RIB instantanément",
        href: "/accounts/rib",
        status: "Disponible",
      },
      {
        title: "Signature électronique",
        description: "Signez vos documents en ligne",
        href: "/services/signature",
        status: "Disponible",
      },
      {
        title: "Réclamations",
        description: "Soumettez et suivez vos réclamations",
        href: "/complaints",
        status: "Disponible",
      },
    ],
  },
  {
    category: "Support Client",
    icon: Headphones,
    color: "bg-teal-500",
    items: [
      {
        title: "Chat en direct",
        description: "Assistance instantanée avec nos conseillers",
        href: "/support/chat",
        status: "En ligne",
      },
      {
        title: "Centre d'aide",
        description: "FAQ et guides d'utilisation",
        href: "/support/help",
        status: "Disponible",
      },
      {
        title: "Localisation d'agences",
        description: "Trouvez l'agence la plus proche",
        href: "/agences",
        status: "Disponible",
      },
    ],
  },
]

const stats = [
  { label: "Utilisateurs actifs", value: "50,000+", icon: Users },
  { label: "Transactions par jour", value: "25,000+", icon: ArrowLeftRight },
  { label: "Satisfaction client", value: "98%", icon: Star },
  { label: "Disponibilité", value: "99.9%", icon: CheckCircle },
]

const technologies = [
  { name: "Next.js 15", description: "Framework React moderne", icon: "⚡" },
  { name: "TypeScript", description: "Typage statique", icon: "🔷" },
  { name: "Tailwind CSS", description: "Design system moderne", icon: "🎨" },
  { name: "shadcn/ui", description: "Composants UI élégants", icon: "✨" },
  { name: "Responsive Design", description: "Mobile-first", icon: "📱" },
  { name: "Dark Mode", description: "Thème sombre/clair", icon: "🌙" },
]

export default function PresentationPage() {
  const [selectedFeature, setSelectedFeature] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <Sparkles className="h-8 w-8" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Astra eBanking
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">La banque digitale nouvelle génération de la BNG</p>
            <p className="text-lg mb-10 text-blue-50 max-w-2xl mx-auto">
              Une expérience bancaire moderne, sécurisée et intuitive. Gérez tous vos comptes, cartes, virements et
              investissements depuis une interface élégante et responsive.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50" asChild>
                <Link href="/">
                  <Play className="mr-2 h-5 w-5" />
                  Découvrir l'application
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 bg-transparent"
                asChild
              >
                <Link href="/support/help">
                  <HelpCircle className="mr-2 h-5 w-5" />
                  Guide d'utilisation
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Fonctionnalités Complètes</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Découvrez toutes les fonctionnalités de votre banque digitale moderne
            </p>
          </div>

          <Tabs defaultValue="0" className="max-w-6xl mx-auto">
            <TabsList className="grid grid-cols-3 lg:grid-cols-7 mb-8">
              {features.map((feature, index) => (
                <TabsTrigger key={index} value={index.toString()} className="flex flex-col gap-1 p-3">
                  <feature.icon className="h-5 w-5" />
                  <span className="text-xs hidden lg:block">{feature.category.split(" ")[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {features.map((feature, index) => (
              <TabsContent key={index} value={index.toString()}>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="text-center pb-8">
                    <div className="flex items-center justify-center mb-4">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-2xl ${feature.color} text-white`}
                      >
                        <feature.icon className="h-8 w-8" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl">{feature.category}</CardTitle>
                    <CardDescription className="text-lg">
                      Découvrez les fonctionnalités de {feature.category.toLowerCase()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      {feature.items.map((item, itemIndex) => (
                        <Card key={itemIndex} className="border border-gray-200 hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-lg">{item.title}</h3>
                              <Badge
                                variant={
                                  item.status === "Nouveau"
                                    ? "default"
                                    : item.status === "En ligne"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {item.status}
                              </Badge>
                            </div>
                            <p className="text-gray-600 mb-4">{item.description}</p>
                            <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                              <Link href={item.href}>
                                Découvrir
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Link>
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Technologies Modernes</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Construit avec les dernières technologies pour une expérience optimale
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {technologies.map((tech, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="text-4xl mb-4">{tech.icon}</div>
                  <h3 className="font-semibold text-lg mb-2">{tech.name}</h3>
                  <p className="text-gray-600">{tech.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                <Shield className="h-8 w-8" />
              </div>
            </div>
            <h2 className="text-4xl font-bold mb-6">Sécurité Maximale</h2>
            <p className="text-xl text-gray-300 mb-12">
              Vos données et transactions sont protégées par les plus hauts standards de sécurité bancaire
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <Lock className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                <h3 className="text-xl font-semibold mb-2">Chiffrement SSL</h3>
                <p className="text-gray-400">Toutes les communications sont chiffrées</p>
              </div>
              <div className="text-center">
                <Smartphone className="h-12 w-12 mx-auto mb-4 text-green-400" />
                <h3 className="text-xl font-semibold mb-2">Authentification 2FA</h3>
                <p className="text-gray-400">Double authentification par SMS</p>
              </div>
              <div className="text-center">
                <Zap className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
                <h3 className="text-xl font-semibold mb-2">Monitoring 24/7</h3>
                <p className="text-gray-400">Surveillance continue des transactions</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Prêt à découvrir Astra eBanking ?</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Rejoignez les milliers de clients qui font confiance à notre plateforme bancaire moderne
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50" asChild>
              <Link href="/">
                <Home className="mr-2 h-5 w-5" />
                Accéder à l'application
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 bg-transparent"
              asChild
            >
              <Link href="/support/chat">
                <MessageSquare className="mr-2 h-5 w-5" />
                Contacter le support
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 text-white font-bold text-sm mr-2">
                  A
                </div>
                <span className="font-bold text-lg">Astra eBanking</span>
              </div>
              <p className="text-gray-400">La banque digitale de demain, disponible aujourd'hui.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Comptes bancaires</li>
                <li>Cartes de paiement</li>
                <li>Virements</li>
                <li>Investissements</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Centre d'aide</li>
                <li>Chat en direct</li>
                <li>Agences</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Légal</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Conditions d'utilisation</li>
                <li>Politique de confidentialité</li>
                <li>Sécurité</li>
                <li>Rglementation</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Astra eBanking - BNG. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
