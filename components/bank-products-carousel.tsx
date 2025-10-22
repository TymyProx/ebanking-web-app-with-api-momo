"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, PiggyBank, TrendingUp, Shield, Home, Briefcase } from "lucide-react"

const bankProducts = [
  {
    id: 1,
    title: "Compte Épargne Plus",
    description: "Faites fructifier votre argent avec un taux d'intérêt attractif de 5% par an",
    icon: PiggyBank,
    color: "from-emerald-500/20 to-emerald-600/10",
    iconColor: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
  },
  {
    id: 2,
    title: "Carte Visa Gold",
    description: "Profitez d'avantages exclusifs et d'une assurance voyage complète",
    icon: CreditCard,
    color: "from-amber-500/20 to-amber-600/10",
    iconColor: "text-amber-600",
    bgColor: "bg-amber-500/10",
  },
  {
    id: 3,
    title: "Investissement Pro",
    description: "Diversifiez votre portefeuille avec nos solutions d'investissement",
    icon: TrendingUp,
    color: "from-blue-500/20 to-blue-600/10",
    iconColor: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  {
    id: 4,
    title: "Assurance Vie",
    description: "Protégez votre famille avec notre assurance vie complète",
    icon: Shield,
    color: "from-purple-500/20 to-purple-600/10",
    iconColor: "text-purple-600",
    bgColor: "bg-purple-500/10",
  },
  {
    id: 5,
    title: "Crédit Immobilier",
    description: "Réalisez votre projet immobilier avec des taux avantageux",
    icon: Home,
    color: "from-rose-500/20 to-rose-600/10",
    iconColor: "text-rose-600",
    bgColor: "bg-rose-500/10",
  },
  {
    id: 6,
    title: "Prêt Professionnel",
    description: "Développez votre entreprise avec notre financement adapté",
    icon: Briefcase,
    color: "from-indigo-500/20 to-indigo-600/10",
    iconColor: "text-indigo-600",
    bgColor: "bg-indigo-500/10",
  },
]

export function BankProductsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % bankProducts.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  const currentProduct = bankProducts[currentIndex]
  const Icon = currentProduct.icon

  return (
    <div className="relative h-full">
      <Card
        className={`border-0 shadow-lg bg-gradient-to-br ${currentProduct.color} transition-all duration-500 h-full`}
      >
        <CardContent className="p-6 flex flex-col justify-between h-full min-h-[280px]">
          <div className="space-y-4">
            <div className={`w-14 h-14 rounded-xl ${currentProduct.bgColor} flex items-center justify-center`}>
              <Icon className={`h-7 w-7 ${currentProduct.iconColor}`} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-heading font-bold">{currentProduct.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{currentProduct.description}</p>
            </div>
          </div>

          <div className="space-y-4 mt-6">
            <Button className="w-full btn-primary">En savoir plus</Button>

            <div className="flex justify-center gap-2">
              {bankProducts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "w-8 bg-primary"
                      : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                  aria-label={`Aller au produit ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
