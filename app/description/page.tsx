"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Smartphone,
  Shield,
  Zap,
  Users,
  Globe,
  TrendingUp,
  Star,
  CheckCircle,
  Wallet,
  CreditCard,
  ArrowLeftRight,
  PiggyBank,
  Building2,
  Headphones,
  MapPin,
  Brain,
  Rocket,
  Award,
  Target,
  Heart,
  Code,
  Database,
  Lock,
  Monitor,
  Palette,
  Sparkles,
} from "lucide-react"
import Link from "next/link"

const features = [
  {
    icon: Wallet,
    title: "Gestion des Comptes",
    description: "Consultation temps réel, relevés automatiques, historique détaillé",
    color: "bg-blue-500",
    stats: "50,000+ consultations/jour",
  },
  {
    icon: CreditCard,
    title: "Cartes Bancaires",
    description: "Gestion complète, sécurité avancée, paiements sans contact",
    color: "bg-purple-500",
    stats: "15,000+ cartes actives",
  },
  {
    icon: ArrowLeftRight,
    title: "Virements & Transferts",
    description: "Instantanés, internationaux, programmés, sécurisés",
    color: "bg-green-500",
    stats: "25,000+ virements/jour",
  },
  {
    icon: TrendingUp,
    title: "Investissements",
    description: "Portefeuille, placements, analyse de performance",
    color: "bg-orange-500",
    stats: "2,500+ investisseurs",
  },
  {
    icon: PiggyBank,
    title: "Budget & Épargne",
    description: "Suivi intelligent, objectifs, conseils personnalisés",
    color: "bg-pink-500",
    stats: "40,000+ budgets créés",
  },
  {
    icon: Building2,
    title: "E-Services",
    description: "Demandes en ligne, RIB, signature électronique",
    color: "bg-indigo-500",
    stats: "10,000+ services/mois",
  },
  {
    icon: Headphones,
    title: "Support Client",
    description: "Chat 24/7, IA conversationnelle, conseillers experts",
    color: "bg-teal-500",
    stats: "98% satisfaction",
  },
  {
    icon: MapPin,
    title: "Services de Proximité",
    description: "Géolocalisation agences, DAB, services locaux",
    color: "bg-red-500",
    stats: "200+ points de service",
  },
]

const technologies = [
  { name: "Next.js 15", icon: Code, description: "Framework React moderne avec App Router" },
  { name: "TypeScript", icon: Database, description: "Typage statique pour la fiabilité" },
  { name: "Tailwind CSS", icon: Palette, description: "Design system moderne et cohérent" },
  { name: "shadcn/ui", icon: Sparkles, description: "Composants UI élégants et accessibles" },
  { name: "PWA", icon: Smartphone, description: "Application web progressive installable" },
  { name: "SSL/TLS", icon: Lock, description: "Chiffrement de niveau bancaire" },
]

const metrics = [
  { label: "Utilisateurs Actifs", value: "50,000+", icon: Users, color: "text-blue-600" },
  { label: "Transactions/Jour", value: "25,000+", icon: ArrowLeftRight, color: "text-green-600" },
  { label: "Satisfaction Client", value: "98%", icon: Star, color: "text-yellow-600" },
  { label: "Disponibilité", value: "99.9%", icon: CheckCircle, color: "text-emerald-600" },
  { label: "Temps de Réponse", value: "<2s", icon: Zap, color: "text-purple-600" },
  { label: "Agences Connectées", value: "200+", icon: Building2, color: "text-orange-600" },
]

const roadmap = [
  {
    period: "Court Terme (3 mois)",
    items: ["Authentification biométrique", "Notifications push temps réel", "Mode hors-ligne", "Widget mobile soldes"],
    progress: 75,
  },
  {
    period: "Moyen Terme (6 mois)",
    items: ["Assistant IA financier", "Blockchain traçabilité", "API publique", "Marketplace services"],
    progress: 45,
  },
  {
    period: "Long Terme (12 mois)",
    items: ["Néobanque complète", "Crédit instantané", "Financement participatif", "Expansion CEDEAO"],
    progress: 20,
  },
]

export default function DescriptionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm">
                <Rocket className="h-10 w-10" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Description Complète</h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">Astra eBanking - La révolution bancaire digitale</p>
            <p className="text-lg text-blue-50 max-w-3xl mx-auto">
              Découvrez en détail toutes les fonctionnalités, technologies et innovations qui font d'Astra eBanking la
              plateforme bancaire la plus avancée de Guinée.
            </p>
          </div>
        </div>
      </section>

      {/* Métriques Clés */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Métriques de Performance</h2>
            <p className="text-lg text-gray-600">Des chiffres qui parlent de notre succès</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {metrics.map((metric, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 ${metric.color}`}
                    >
                      <metric.icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
                  <div className="text-sm text-gray-600">{metric.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Fonctionnalités Principales */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Fonctionnalités Complètes</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Une suite complète de services bancaires digitaux pour répondre à tous vos besoins financiers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center mb-4">
                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-2xl ${feature.color} text-white`}
                    >
                      <feature.icon className="h-8 w-8" />
                    </div>
                  </div>
                  <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                  <CardDescription className="text-gray-600">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-center">
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                      {feature.stats}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Technique */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Technologies Modernes</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Construit avec les dernières technologies pour une performance et une sécurité optimales
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {technologies.map((tech, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                      <tech.icon className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{tech.name}</h3>
                  <p className="text-gray-600 text-sm">{tech.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sécurité */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-sm">
                <Shield className="h-10 w-10" />
              </div>
            </div>
            <h2 className="text-4xl font-bold mb-6">Sécurité de Niveau Bancaire</h2>
            <p className="text-xl text-gray-300 mb-12">
              Protection maximale de vos données et transactions avec les standards internationaux les plus élevés
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <Lock className="h-16 w-16 mx-auto mb-4 text-blue-400" />
                <h3 className="text-xl font-semibold mb-3">Chiffrement SSL/TLS</h3>
                <p className="text-gray-400">
                  Toutes les communications sont chiffrées avec les protocoles les plus sécurisés
                </p>
              </div>
              <div className="text-center">
                <Smartphone className="h-16 w-16 mx-auto mb-4 text-green-400" />
                <h3 className="text-xl font-semibold mb-3">Authentification 2FA</h3>
                <p className="text-gray-400">
                  Double authentification par SMS et biométrie pour une sécurité renforcée
                </p>
              </div>
              <div className="text-center">
                <Monitor className="h-16 w-16 mx-auto mb-4 text-yellow-400" />
                <h3 className="text-xl font-semibold mb-3">Monitoring 24/7</h3>
                <p className="text-gray-400">Surveillance continue et détection automatique des activités suspectes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Roadmap & Évolutions</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Notre vision pour l'avenir de la banque digitale en Guinée
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {roadmap.map((phase, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg text-center">{phase.period}</CardTitle>
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progression</span>
                        <span>{phase.progress}%</span>
                      </div>
                      <Progress value={phase.progress} className="h-2" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {phase.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Avantages Concurrentiels */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Avantages Concurrentiels</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ce qui nous distingue sur le marché bancaire guinéen
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                  <Award className="h-8 w-8" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">Innovation</h3>
              <p className="text-gray-600">Première banque 100% digitale avec des fonctionnalités uniques en Guinée</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-600">
                  <Target className="h-8 w-8" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">Accessibilité</h3>
              <p className="text-gray-600">Interface intuitive, multilingue et adaptée aux besoins locaux</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                  <Brain className="h-8 w-8" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">Intelligence</h3>
              <p className="text-gray-600">IA intégrée pour des conseils financiers personnalisés et intelligents</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                  <Heart className="h-8 w-8" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">Impact Social</h3>
              <p className="text-gray-600">Inclusion financière et développement économique local</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Découvrez Astra eBanking</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Rejoignez la révolution bancaire digitale et profitez d'une expérience financière moderne et sécurisée
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50" asChild>
              <Link href="/">
                <Sparkles className="mr-2 h-5 w-5" />
                Explorer l'Application
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 bg-transparent"
              asChild
            >
              <Link href="/presentation">
                <Globe className="mr-2 h-5 w-5" />
                Voir la Présentation
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
