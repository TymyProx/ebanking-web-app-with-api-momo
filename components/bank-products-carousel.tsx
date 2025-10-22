"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, PiggyBank, TrendingUp, Shield, Home, Briefcase, ArrowRight, Sparkles } from "lucide-react"

const bankProducts = [
  {
    id: 1,
    title: "Compte Épargne Plus",
    description: "Faites fructifier votre argent avec un taux d'intérêt attractif de 5% par an",
    rate: "5% / an",
    icon: PiggyBank,
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    bgGradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
    iconBg: "bg-gradient-to-br from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-600",
  },
  {
    id: 2,
    title: "Carte Visa Gold",
    description: "Profitez d'avantages exclusifs et d'une assurance voyage complète",
    rate: "Premium",
    icon: CreditCard,
    gradient: "from-amber-500 via-orange-500 to-yellow-500",
    bgGradient: "from-amber-500/10 via-orange-500/5 to-transparent",
    iconBg: "bg-gradient-to-br from-amber-500/20 to-orange-500/20",
    iconColor: "text-amber-600",
  },
  {
    id: 3,
    title: "Investissement Pro",
    description: "Diversifiez votre portefeuille avec nos solutions d'investissement",
    rate: "Rendement élevé",
    icon: TrendingUp,
    gradient: "from-blue-500 via-indigo-500 to-purple-500",
    bgGradient: "from-blue-500/10 via-indigo-500/5 to-transparent",
    iconBg: "bg-gradient-to-br from-blue-500/20 to-indigo-500/20",
    iconColor: "text-blue-600",
  },
  {
    id: 4,
    title: "Assurance Vie",
    description: "Protégez votre famille avec notre assurance vie complète",
    rate: "Protection totale",
    icon: Shield,
    gradient: "from-purple-500 via-fuchsia-500 to-pink-500",
    bgGradient: "from-purple-500/10 via-fuchsia-500/5 to-transparent",
    iconBg: "bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20",
    iconColor: "text-purple-600",
  },
  {
    id: 5,
    title: "Crédit Immobilier",
    description: "Réalisez votre projet immobilier avec des taux avantageux",
    rate: "Taux bas",
    icon: Home,
    gradient: "from-rose-500 via-pink-500 to-red-500",
    bgGradient: "from-rose-500/10 via-pink-500/5 to-transparent",
    iconBg: "bg-gradient-to-br from-rose-500/20 to-pink-500/20",
    iconColor: "text-rose-600",
  },
  {
    id: 6,
    title: "Prêt Professionnel",
    description: "Développez votre entreprise avec notre financement adapté",
    rate: "Sur mesure",
    icon: Briefcase,
    gradient: "from-indigo-500 via-blue-500 to-cyan-500",
    bgGradient: "from-indigo-500/10 via-blue-500/5 to-transparent",
    iconBg: "bg-gradient-to-br from-indigo-500/20 to-blue-500/20",
    iconColor: "text-indigo-600",
  },
]

export function BankProductsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % bankProducts.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const currentProduct = bankProducts[currentIndex]
  const Icon = currentProduct.icon

  return (
    <Card className="border-0 shadow-lg overflow-hidden relative group">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${currentProduct.bgGradient} transition-all duration-700 ease-in-out`}
      />

      <div className="relative">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl ${currentProduct.iconBg} backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg transition-transform duration-300 group-hover:scale-110`}
              >
                <Icon className={`h-6 w-6 ${currentProduct.iconColor}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  <span className="text-xs font-medium text-primary uppercase tracking-wider">Offre exclusive</span>
                </div>
              </div>
            </div>
            <div
              className={`px-3 py-1 rounded-full bg-gradient-to-r ${currentProduct.gradient} text-white text-xs font-semibold shadow-md`}
            >
              {currentProduct.rate}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pb-6">
          <div className="space-y-3 min-h-[120px]">
            <h3 className="text-2xl font-heading font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {currentProduct.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{currentProduct.description}</p>
          </div>

          <Button className="w-full h-12 btn-primary group/btn relative overflow-hidden">
            <span className="relative z-10 flex items-center justify-center gap-2 font-medium">
              En savoir plus
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
            </span>
            <div
              className={`absolute inset-0 bg-gradient-to-r ${currentProduct.gradient} opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300`}
            />
          </Button>

          <div className="flex justify-center items-center gap-2 pt-2">
            {bankProducts.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className="relative group/dot"
                aria-label={`Aller au produit ${index + 1}`}
              >
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    index === currentIndex
                      ? "w-10 bg-gradient-to-r " + bankProducts[index].gradient
                      : "w-2 bg-muted-foreground/30 group-hover/dot:bg-muted-foreground/50"
                  }`}
                />
                {index === currentIndex && <div className="absolute inset-0 rounded-full bg-white/30 animate-pulse" />}
              </button>
            ))}
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
