"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Wallet,
  CreditCard,
  ArrowLeftRight,
  Receipt,
  TrendingUp,
  PiggyBank,
  Settings,
  FileText,
  MessageSquare,
  Building2,
  MapPin,
  Shield,
  Smartphone,
  Eye,
  Download,
  Send,
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Calculator,
  Headphones,
  Camera,
  Banknote,
  CreditCardIcon as CardIcon,
  ArrowUpRight,
  Calendar,
  Target,
  Home,
  ShoppingCart,
  UserPlus,
  Sparkles,
} from "lucide-react"
import Link from "next/link"

const fonctionnalites = [
  {
    id: "comptes",
    title: "Gestion des Comptes",
    icon: Wallet,
    color: "bg-blue-500",
    description: "Gérez tous vos comptes bancaires depuis une interface unique",
    features: [
      {
        name: "Consultation des Soldes",
        description: "Visualisez vos soldes en temps réel avec des graphiques interactifs",
        icon: Eye,
        href: "/accounts/balance",
        status: "Disponible",
        details: [
          "Soldes de tous vos comptes en temps réel",
          "Graphiques d'évolution des soldes",
          "Alertes personnalisables pour les seuils",
          "Historique détaillé des mouvements",
          "Export des données en PDF/Excel",
        ],
        screenshot: "/placeholder.svg?height=300&width=500&text=Consultation+Soldes",
      },
      {
        name: "Relevés de Compte",
        description: "Téléchargez et consultez vos relevés mensuels",
        icon: Download,
        href: "/accounts/statements",
        status: "Disponible",
        details: [
          "Génération automatique des relevés",
          "Téléchargement instantané en PDF",
          "Archivage numérique sécurisé",
          "Recherche avancée dans l'historique",
          "Envoi par email automatique",
        ],
        screenshot: "/placeholder.svg?height=300&width=500&text=Relevés+de+Compte",
      },
      {
        name: "Historique des Transactions",
        description: "Recherche avancée dans vos transactions",
        icon: Search,
        href: "/accounts/balance",
        status: "Disponible",
        details: [
          "Filtres par date, montant, type",
          "Recherche par bénéficiaire",
          "Catégorisation automatique",
          "Export personnalisé",
          "Analyse des tendances",
        ],
        screenshot: "/placeholder.svg?height=300&width=500&text=Historique+Transactions",
      },
    ],
  },
  {
    id: "cartes",
    title: "Cartes Bancaires",
    icon: CreditCard,
    color: "bg-purple-500",
    description: "Gérez toutes vos cartes bancaires en toute sécurité",
    features: [
      {
        name: "Gestion des Cartes",
        description: "Bloquez, débloquez et gérez vos cartes en temps réel",
        icon: CardIcon,
        href: "/cartes",
        status: "Nouveau",
        details: [
          "Visualisation de toutes vos cartes",
          "Activation/Désactivation instantanée",
          "Blocage temporaire ou définitif",
          "Renouvellement automatique",
          "Historique par carte",
        ],
        screenshot: "/placeholder.svg?height=300&width=500&text=Gestion+Cartes",
      },
      {
        name: "Modification des Plafonds",
        description: "Ajustez vos limites de dépenses instantanément",
        icon: Settings,
        href: "/cartes",
        status: "Disponible",
        details: [
          "Plafonds de retrait modifiables",
          "Limites de paiement ajustables",
          "Plafonds internet personnalisés",
          "Zones géographiques autorisées",
          "Application immédiate",
        ],
        screenshot: "/placeholder.svg?height=300&width=500&text=Plafonds+Cartes",
      },
      {
        name: "Sécurité Avancée",
        description: "Paramètres de sécurité et notifications SMS",
        icon: Shield,
        href: "/cartes",
        status: "Disponible",
        details: [
          "Notifications SMS pour chaque transaction",
          "Alertes de sécurité en temps réel",
          "Paramètres de géolocalisation",
          "Code PIN modifiable en ligne",
          "Détection de fraude automatique",
        ],
        screenshot: "/placeholder.svg?height=300&width=500&text=Sécurité+Cartes",
      },
    ],
  },
  {
    id: "virements",
    title: "Virements & Transferts",
    icon: ArrowLeftRight,
    color: "bg-green-500",
    description: "Effectuez tous types de virements en toute simplicité",
    features: [
      {
        name: "Virements Instantanés",
        description: "Virements BNG-BNG, confrères et internationaux",
        icon: Send,
        href: "/transfers/new",
        status: "Disponible",
        details: [
          "Virements BNG-BNG instantanés gratuits",
          "Virements vers banques confrères",
          "Virements internationaux SWIFT",
          "Virements programmés et récurrents",
          "Suivi en temps réel",
        ],
        screenshot: "/placeholder.svg?height=300&width=500&text=Virements+Instantanés",
      },
      {
        name: "Gestion des Bénéficiaires",
        description: "Ajoutez et gérez vos bénéficiaires favoris",
        icon: UserPlus,
        href: "/transfers/beneficiaries",
        status: "Disponible",
        details: [
          "Carnet d'adresses sécurisé",
          "Validation par SMS",
          "Groupes de bénéficiaires",
          "Historique par bénéficiaire",
          "Import/Export de listes",
        ],
        screenshot: "/placeholder.svg?height=300&width=500&text=Bénéficiaires",
      },
      {
        name: "Virements Programmés",
        description: "Planifiez vos virements à l'avance",
        icon: Calendar,
        href: "/transfers/new",
        status: "Disponible",
        details: [
          "Programmation de virements futurs",
          "Virements récurrents automatiques",
          "Gestion des échéances",
          "Notifications de rappel",
          "Modification/Annulation possible",
        ],
        screenshot: "/placeholder.svg?height=300&width=500&text=Virements+Programmés",
      },
    ],
  },
  {
    id: "paiements",
    title: "Paiements & Factures",
    icon: Receipt,
    color: "bg-orange-500",
    description: "Payez vos factures et commerçants facilement",
    features: [
      {
        name: "Paiement de Factures",
        description: "Payez toutes vos factures en ligne",
        icon: Receipt,
        href: "/payments/bills",
        status: "Disponible",
        details: [
          "Électricité (EDG et partenaires)",
          "Télécommunications (Orange, MTN)",
          "Eau (SEEG et distributeurs)",
          "Internet (tous fournisseurs)",
          "Assurances et autres services",
        ],
        screenshot: "/placeholder.svg?height=300&width=500&text=Paiement+Factures",
      },
      {
        name: "Paiements Commerçants",
        description: "Payez chez vos commerçants favoris",
        icon: ShoppingCart,
        href: "/payments/bills",
        status: "Disponible",
        details: [
          "QR Code pour paiement sans contact",
          "E-commerce intégré",
          "Marchés et commerces locaux",
          "Services professionnels",
          "Cashback et réductions",
        ],
        screenshot: "/placeholder.svg?height=300&width=500&text=Paiements+Commerçants",
      },
      {
        name: "Paiements en Lot",
        description: "Traitez plusieurs paiements simultanément",
        icon: FileText,
        href: "/payments/bulk",
        status: "Disponible",
        details: [
          "Paiement de salaires en masse",
          "Paiements fournisseurs multiples",
          "Workflow de validation",
          "Rapports de réconciliation",
          "Import de fichiers Excel/CSV",
        ],
        screenshot: "/placeholder.svg?height=300&width=500&text=Paiements+Lot",
      },
    ],
  },
  {
    id: "investissements",
    title: "Investissements",
    icon: TrendingUp,
    color: "bg-indigo-500",
    description: "Gérez et développez votre portefeuille d'investissement",
    features: [
      {
        name: "Portefeuille d'Investissement",
        description: "Suivez vos placements et leur performance",
        icon: BarChart3,
        href: "/investments",
        status: "Disponible",
        details: [
          "Vue d'ensemble du portefeuille",
          "Performance en temps réel",
          "Répartition par type d'actif",
          "Graphiques d'évolution",
          "Calcul automatique des rendements",
        ],
        screenshot: "/placeholder.svg?height=300&width=500&text=Portefeuille+Investissement",
      },
      {
        name: "Nouveaux Placements",
        description: "Découvrez nos produits d'épargne et d'investissement",
        icon: Plus,
        href: "/investments/new",
        status: "Disponible",
        details: [
          "Catalogue de produits complet",
          "Simulateur de rendements",
          "Souscription en ligne",
          "Conseil personnalisé",
          "Diversification automatique",
        ],
        screenshot: "/placeholder.svg?height=300&width=500&text=Nouveaux+Placements",
      },
      {
        name: "Analyse de Performance",
        description: "Analysez la performance de vos investissements",
        icon: Calculator,
        href: "/investments",
        status: "Disponible",
        details: [
          "Rapports de performance détaillés",
          "Comparaison avec indices",
          "Analyse de risque",
          "Recommandations d'optimisation",
          "Alertes de performance",
        ],
        screenshot: "/placeholder.svg?height=300&width=500&text=Analyse+Performance",
      },
    ],
  },
  {
    id: "budget",
    title: "Budget & Épargne",
    icon: PiggyBank,
    color: "bg-pink-500",
    description: "Planifiez et suivez votre budget personnel",
    features: [
      {
        name: "Suivi des Dépenses",
        description: "Analysez vos habitudes de consommation",
        icon: BarChart3,
        href: "/budget",
        status: "Disponible",
        details: [
          "Catégorisation automatique",
          "Graphiques de répartition",
          "Tendances mensuelles",
          "Comparaisons périodiques",
          "Alertes de dépassement",
        ],
        screenshot: "/placeholder.svg?height=300&width=500&text=Suivi+Dépenses",
      },
      {
        name: "Budget Personnel",
        description: "Créez et suivez vos budgets mensuels",
        icon: Target,
        href: "/budget/personal",
        status: "Disponible",
        details: [
          "Création de budgets par catégorie",
          "Objectifs d'épargne personnalisés",
          "Suivi en temps réel",
          "Recommandations intelligentes",
          "Rapports mensuels automatiques",
        ],
        screenshot: "/placeholder.svg?height=300&width=500&text=Budget+Personnel",
      },
      {
        name: "Objectifs d'Épargne",
        description: "Définissez et atteignez vos objectifs financiers",
        icon: Target,
        href: "/budget",
        status: "Disponible",
        details: [
          "Définition d'objectifs multiples",
          "Suivi de progression visuel",
          "Épargne automatique programmée",
          "Conseils d'optimisation",
          "Célébration des objectifs atteints",
        ],
        screenshot: "/placeholder.svg?height=300&width=500&text=Objectifs+Épargne",
      },
    ],
  },
  {
    id: "services",
    title: "E-Services",
    icon: Settings,
    color: "bg-teal-500",
    description: "Tous vos services bancaires en ligne",
    features: [
      {
        name: "Demandes de Services",
        description: "Chéquiers, attestations, et autres demandes",
        icon: FileText,
        href: "/services/requests",
        status: "Disponible",
        details: [
          "Demande de chéquiers en ligne",
          "Attestations bancaires automatiques",
          "Certificats et documents officiels",
          "Suivi des demandes en temps réel",
          "Livraison à domicile ou en agence",
        ],
        screenshot: "/placeholder.svg?height=300&width=500&text=Demandes+Services",
      },
      {
        name: "RIB Électronique",
        description: "Téléchargez votre RIB instantanément",
        icon: Download,
        href: "/services/rib",
        status: "Disponible",
        details: [
          "Génération instantanée du RIB",
          "QR Code pour partage facile",
          "Formats multiples (PDF, image)",
          "Personnalisation du design",
          "Historique des RIB générés",
        ],
        screenshot: "/placeholder.svg?height=300&width=500&text=RIB+Électronique",
      },
      {
        name: "Signature Électronique",
        description: "Signez vos documents en ligne",
        icon: Shield,
        href: "/services/signature",
        status: "Disponible",
        details: [
          "Signature légale de documents",
          "Certificats numériques sécurisés",
          "Horodatage des signatures",
          "Archivage sécurisé",
          "Validation juridique",
        ],
        screenshot: "/placeholder.svg?height=300&width=500&text=Signature+Électronique",
      },
      {
        name: "Dépôt de Chèques",
        description: "Déposez vos chèques par photo",
        icon: Camera,
        href: "/services/check-deposit",
        status: "Disponible",
        details: [
          "Photo-dépôt avec smartphone",
          "Validation automatique OCR",
          "Crédit immédiat sous réserve",
          "Suivi du statut d'encaissement",
          "Historique des dépôts",
        ],
        screenshot: "/placeholder.svg?height=300&width=500&text=Dépôt+Chèques",
      },
    ],
  },
  {
    id: "support",
    title: "Support Client",
    icon: Headphones,
    color: "bg-red-500",
    description: "Assistance et support personnalisé 24/7",
    features: [
      {
        name: "Chat en Direct",
        description: "Assistance instantanée avec nos conseillers",
        icon: MessageSquare,
        href: "/support/chat",
        status: "En ligne",
        details: [
          "Conseillers disponibles 7j/7",
          "IA conversationnelle 24/7",
          "Historique des conversations",
          "Transfert vers experts",
          "Support multilingue",
        ],
        screenshot: "/placeholder.svg?height=300&width=500&text=Chat+Direct",
      },
      {
        name: "Centre d'Aide",
        description: "FAQ et guides d'utilisation",
        icon: FileText,
        href: "/support/help",
        status: "Disponible",
        details: [
          "FAQ complète et mise à jour",
          "Guides vidéo tutoriels",
          "Documentation utilisateur",
          "Recherche intelligente",
          "Articles de blog financier",
        ],
        screenshot: "/placeholder.svg?height=300&width=500&text=Centre+Aide",
      },
      {
        name: "Réclamations",
        description: "Soumettez et suivez vos réclamations",
        icon: AlertTriangle,
        href: "/complaints",
        status: "Disponible",
        details: [
          "Formulaire de réclamation guidé",
          "Suivi en temps réel du traitement",
          "Notifications de progression",
          "Résolution dans les délais",
          "Satisfaction client mesurée",
        ],
        screenshot: "/placeholder.svg?height=300&width=500&text=Réclamations",
      },
    ],
  },
  {
    id: "proximite",
    title: "Services de Proximité",
    icon: MapPin,
    color: "bg-yellow-500",
    description: "Trouvez nos services près de chez vous",
    features: [
      {
        name: "Localisation d'Agences",
        description: "Trouvez l'agence la plus proche",
        icon: Building2,
        href: "/agences",
        status: "Disponible",
        details: [
          "Carte interactive de toutes les agences",
          "Géolocalisation automatique",
          "Informations pratiques complètes",
          "Itinéraires GPS intégrés",
          "Horaires et services disponibles",
        ],
        screenshot: "/placeholder.svg?height=300&width=500&text=Localisation+Agences",
      },
      {
        name: "Distributeurs Automatiques",
        description: "Réseau complet de DAB",
        icon: Banknote,
        href: "/agences",
        status: "Disponible",
        details: [
          "Réseau BNG et partenaires",
          "Disponibilité en temps réel",
          "Types d'opérations disponibles",
          "Signalement d'incidents",
          "Planificateur de retraits",
        ],
        screenshot: "/placeholder.svg?height=300&width=500&text=Distributeurs+DAB",
      },
      {
        name: "Services Mobiles",
        description: "Services bancaires mobiles",
        icon: Smartphone,
        href: "/agences",
        status: "Bientôt",
        details: [
          "Conseillers mobiles à domicile",
          "Services bancaires itinérants",
          "Ouverture de compte à domicile",
          "Formation digitale personnalisée",
          "Support technique mobile",
        ],
        screenshot: "/placeholder.svg?height=300&width=500&text=Services+Mobiles",
      },
    ],
  },
]

export default function FonctionnalitesPage() {
  const [selectedCategory, setSelectedCategory] = useState("comptes")
  const [selectedFeature, setSelectedFeature] = useState(0)

  const currentCategory = fonctionnalites.find((cat) => cat.id === selectedCategory)
  const currentFeature = currentCategory?.features[selectedFeature]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm">
                <Sparkles className="h-10 w-10" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Fonctionnalités</h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Découvrez toutes les fonctionnalités d'Astra eBanking
            </p>
            <p className="text-lg text-blue-50 max-w-3xl mx-auto">
              Une suite complète de services bancaires digitaux pour répondre à tous vos besoins financiers, du plus
              simple au plus complexe.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation des Catégories */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-4">
            {fonctionnalites.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => {
                  setSelectedCategory(category.id)
                  setSelectedFeature(0)
                }}
                className="flex items-center gap-2"
              >
                <category.icon className="h-4 w-4" />
                {category.title}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Contenu Principal */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          {currentCategory && (
            <div className="max-w-7xl mx-auto">
              {/* En-tête de Catégorie */}
              <div className="text-center mb-12">
                <div className="flex items-center justify-center mb-6">
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl ${currentCategory.color} text-white`}
                  >
                    <currentCategory.icon className="h-8 w-8" />
                  </div>
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">{currentCategory.title}</h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">{currentCategory.description}</p>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Liste des Fonctionnalités */}
                <div className="lg:col-span-1">
                  <div className="space-y-4">
                    {currentCategory.features.map((feature, index) => (
                      <Card
                        key={index}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedFeature === index ? "ring-2 ring-blue-500 shadow-lg" : ""
                        }`}
                        onClick={() => setSelectedFeature(index)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                              <feature.icon className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{feature.name}</h3>
                              <Badge
                                variant={
                                  feature.status === "Nouveau"
                                    ? "default"
                                    : feature.status === "En ligne"
                                      ? "secondary"
                                      : feature.status === "Bientôt"
                                        ? "outline"
                                        : "outline"
                                }
                                className="mt-1"
                              >
                                {feature.status}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm">{feature.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Détails de la Fonctionnalité */}
                <div className="lg:col-span-2">
                  {currentFeature && (
                    <Card className="h-full">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                              <currentFeature.icon className="h-6 w-6" />
                            </div>
                            <div>
                              <CardTitle className="text-2xl">{currentFeature.name}</CardTitle>
                              <CardDescription className="text-lg">{currentFeature.description}</CardDescription>
                            </div>
                          </div>
                          <Badge
                            variant={
                              currentFeature.status === "Nouveau"
                                ? "default"
                                : currentFeature.status === "En ligne"
                                  ? "secondary"
                                  : currentFeature.status === "Bientôt"
                                    ? "outline"
                                    : "outline"
                            }
                          >
                            {currentFeature.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Capture d'écran simulée */}
                        <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                              <currentFeature.icon className="h-8 w-8 text-gray-600" />
                            </div>
                            <p className="text-gray-600 font-medium">Aperçu de {currentFeature.name}</p>
                            <p className="text-sm text-gray-500">Interface utilisateur moderne et intuitive</p>
                          </div>
                        </div>

                        {/* Détails de la Fonctionnalité */}
                        <div>
                          <h4 className="text-lg font-semibold mb-4">Caractéristiques principales :</h4>
                          <div className="grid md:grid-cols-2 gap-3">
                            {currentFeature.details.map((detail, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                <span className="text-sm text-gray-700">{detail}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Boutons d'Action */}
                        <div className="flex gap-4 pt-4 border-t">
                          <Button asChild className="flex-1">
                            <Link href={currentFeature.href}>
                              <ArrowUpRight className="h-4 w-4 mr-2" />
                              Essayer maintenant
                            </Link>
                          </Button>
                          <Button variant="outline" className="flex-1 bg-transparent">
                            <FileText className="h-4 w-4 mr-2" />
                            Documentation
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Statistiques Globales */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Statistiques d'Utilisation</h2>
            <p className="text-lg text-gray-600">L'impact de nos fonctionnalités sur l'expérience utilisateur</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">50K+</div>
              <div className="text-sm text-gray-600">Consultations de soldes/jour</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">15K+</div>
              <div className="text-sm text-gray-600">Cartes gérées</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">25K+</div>
              <div className="text-sm text-gray-600">Virements/jour</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">10K+</div>
              <div className="text-sm text-gray-600">Factures payées/jour</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-600 mb-2">40K+</div>
              <div className="text-sm text-gray-600">Budgets créés</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-600 mb-2">98%</div>
              <div className="text-sm text-gray-600">Satisfaction support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Prêt à explorer toutes ces fonctionnalités ?</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Découvrez par vous-même la puissance et la simplicité d'Astra eBanking
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
              <Link href="/support/help">
                <Headphones className="mr-2 h-5 w-5" />
                Obtenir de l'aide
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
