import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Send, Users } from "lucide-react"
import { AccountsCarousel } from "@/components/accounts-carousel"
import { BankProductsCarousel } from "@/components/bank-products-carousel"
import { PersonalizedOffers } from "@/components/personalized-offers"
import { RecentTransactions } from "@/components/recent-transactions"

export default function Dashboard() {
  return (
    <div className="space-y-3 sm:space-y-4 fade-in pt-3 sm:pt-6 pb-6 sm:pb-12 px-1 sm:px-0">
      <AccountsCarousel />

      <Card className="border-0 shadow-sm bg-muted/30">
        <CardContent className="pt-3 p-2 sm:p-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Link href="/transfers/new">
              <Button size="sm" className="h-11 flex flex-col space-y-0.5 w-full btn-primary group">
                <Send className="h-3.5 w-3.5 group-hover:scale-110 transition-transform pt-1" />
                <span className="text-xs font-medium">Virement</span>
              </Button>
            </Link>
            <Link href="/transfers/beneficiaries">
              <Button
                size="sm"
                variant="outline"
                className="h-11 flex flex-col space-y-0.5 w-full hover:bg-secondary/10 hover:border-secondary group bg-transparent"
              >
                <Users className="h-3.5 w-3.5 group-hover:scale-110 transition-transform pt-1" />
                <span className="text-xs font-medium truncate">Gestion des bénéficiaires</span>
              </Button>
            </Link>
            <Link href="/accounts/balance">
              <Button
                size="sm"
                variant="outline"
                className="h-11 flex flex-col space-y-0.5 w-full hover:bg-accent/10 hover:border-accent group bg-transparent"
              >
                <Eye className="h-3.5 w-3.5 group-hover:scale-110 transition-transform pt-1" />
                <span className="text-xs font-medium">Consultation de solde</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <RecentTransactions />

        <div className="min-w-0 space-y-3">
          <PersonalizedOffers />
          <div className="mb-2">
            <h2 className="text-base sm:text-lg font-heading font-semibold">Nos Produits</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Découvrez nos offres exclusives</p>
          </div>
          <BankProductsCarousel />
        </div>
      </div>
    </div>
  )
}
