"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Search, Filter, ExternalLink, List, Map, AlertCircle, Loader2, Settings } from "lucide-react"
import { useAgences, type Agence } from "@/hooks/use-agences"
import { AgenceCard } from "@/components/agence-card"
import { AgenceMap } from "@/components/agence-map"
import { toast } from "@/hooks/use-toast"
import { config } from "@/lib/config"
import AuthService, { type User } from "@/lib/auth-service"

export default function AgencesPage() {
  // État de l'utilisateur et des rôles
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isNetworkManager, setIsNetworkManager] = useState(false)

  // Vue active (liste ou carte)
  const [activeView, setActiveView] = useState<"list" | "map">("list")

  // Filtres
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCity, setSelectedCity] = useState<string>("all")
  const [selectedCountry, setSelectedCountry] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<"all" | "open" | "closed">("all")
  const [currentPage, setCurrentPage] = useState(1)

  // Hook personnalisé pour les agences
  const {
    agences,
    loading,
    error,
    totalCount,
    totalPages,
    currentPage: page,
    setQuery,
  } = useAgences({
    search: searchTerm,
    city: selectedCity,
    country: selectedCountry,
    status: selectedStatus,
    page: currentPage,
    limit: 25,
  })

  // Agence sélectionnée sur la carte
  const [selectedAgence, setSelectedAgence] = useState<Agence | null>(null)

  // Charger les informations utilisateur
  useEffect(() => {
    const user = AuthService.getCurrentUser()
    setCurrentUser(user)

    if (user && user.tenants && user.tenants.length > 0) {
      const tenant = user.tenants.find((t) => t.tenantId === config.TENANT_ID)
      if (tenant && tenant.roles) {
        const roles = tenant.roles
        setUserRole(roles[0] || "Client")

        // Vérifier si l'utilisateur est Responsable réseau
        setIsNetworkManager(roles.includes("Responsable réseau") || roles.includes("network_manager"))
      } else {
        setUserRole("Client")
      }
    } else {
      setUserRole("Client")
    }
  }, [])

  // Mettre à jour la query quand les filtres changent
  useEffect(() => {
    setQuery({
      search: searchTerm,
      city: selectedCity,
      country: selectedCountry,
      status: selectedStatus,
      page: currentPage,
      limit: 25,
    })
  }, [searchTerm, selectedCity, selectedCountry, selectedStatus, currentPage, setQuery])

  // Extraire les villes et pays uniques
  const cities = Array.from(new Set(agences.map((a) => a.city).filter(Boolean))).sort()
  const countries = Array.from(new Set(agences.map((a) => a.country).filter(Boolean))).sort()

  // Gérer l'obtention d'itinéraire
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
    } else {
      toast({
        title: "Information manquante",
        description: "Les coordonnées de cette agence ne sont pas disponibles.",
        variant: "destructive",
      })
    }
  }

  // Gérer le changement de page
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll vers le haut
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm("")
    setSelectedCity("all")
    setSelectedCountry("all")
    setSelectedStatus("all")
    setCurrentPage(1)
  }

  // Rediriger vers le Back-Office pour la gestion des agences
  const handleManageAgences = () => {
    const backOfficeUrl = process.env.NEXT_PUBLIC_BACK_OFFICE_URL || "https://back-office.bng.cm"
    window.open(`${backOfficeUrl}/agences`, "_blank")
  }

  return (
   <div className="space-y-6" lang="fr">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-primary">
            Localisation des agences
          </h1>
          <p className="text-xs text-muted-foreground">Trouvez l'agence BNG la plus proche de vous</p>
        </div>

        {/* Bouton pour le Responsable réseau */}
        {isNetworkManager && (
          <Button
            variant="default"
            onClick={handleManageAgences}
            className="shrink-0"
            aria-label="Gérer les agences dans le Back-Office"
          >
            <Settings className="w-4 h-4 mr-2" />
            Mettre à jour les agences
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Message d'erreur avec fallback */}
      {error && (
        <Alert variant={error.includes("hors ligne") ? "default" : "destructive"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Barre de filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Filter className="w-5 h-5 mr-2" aria-hidden="true" />
            Filtres de recherche
          </CardTitle>
          <CardDescription>Affinez votre recherche d'agence selon vos besoins</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Ligne 1: Recherche textuelle */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4"
                aria-hidden="true"
              />
              <Input
                placeholder="Rechercher par nom, adresse, ville..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                aria-label="Rechercher une agence"
              />
            </div>

            {/* Ligne 2: Filtres */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Filtre par ville */}
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger aria-label="Filtrer par ville">
                  <SelectValue placeholder="Toutes les villes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les villes</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtre par pays */}
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger aria-label="Filtrer par pays">
                  <SelectValue placeholder="Tous les pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les pays</SelectItem>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtre par statut */}
              <Select
                value={selectedStatus}
                onValueChange={(value) => {
                  setSelectedStatus(value as "all" | "open" | "closed")
                  setCurrentPage(1) // Réinitialiser à la page 1 lors du changement de filtre
                }}
              >
                <SelectTrigger aria-label="Filtrer par statut">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="open">Ouvert</SelectItem>
                  <SelectItem value="closed">Fermé</SelectItem>
                </SelectContent>
              </Select>

              {/* Bouton réinitialiser */}
              <Button
                variant="outline"
                onClick={resetFilters}
                className="w-full bg-transparent"
                aria-label="Réinitialiser les filtres"
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bascule Liste/Carte */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "list" | "map")}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-2" role="tablist" aria-label="Vues des agences">
            <TabsTrigger value="list" className="flex items-center gap-2" aria-label="Vue liste">
              <List className="w-4 h-4" aria-hidden="true" />
              Liste
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2" aria-label="Vue carte">
              <Map className="w-4 h-4" aria-hidden="true" />
              Carte
            </TabsTrigger>
          </TabsList>

          {/* Compteur de résultats */}
          <div className="text-sm text-muted-foreground">
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Chargement...</span>
              </div>
            ) : (
              <span>
                {totalCount} agence{totalCount !== 1 ? "s" : ""} trouvée{totalCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Vue Liste */}
        <TabsContent value="list" className="space-y-6 mt-6">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">Chargement des agences...</p>
                </div>
              </CardContent>
            </Card>
          ) : agences.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" aria-hidden="true" />
                <h3 className="text-lg font-medium text-foreground mb-2">Aucune agence trouvée</h3>
                <p className="text-muted-foreground mb-4">Aucune agence ne correspond à vos critères de recherche.</p>
                <Button variant="outline" onClick={resetFilters}>
                  Réinitialiser les filtres
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Grille des agences */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {agences.map((agence) => (
                  <AgenceCard key={agence.id} agence={agence} onGetDirections={handleGetDirections} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        aria-disabled={currentPage === 1}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {/* Pages */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }

                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => handlePageChange(pageNum)}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                            aria-label={`Aller à la page ${pageNum}`}
                            aria-current={currentPage === pageNum ? "page" : undefined}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    })}

                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        aria-disabled={currentPage === totalPages}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </TabsContent>

        {/* Vue Carte */}
        <TabsContent value="map" className="mt-6">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center h-[600px]">
                <div className="text-center space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <AgenceMap
              agences={agences}
              selectedAgence={selectedAgence}
              onAgenceSelect={setSelectedAgence}
              onGetDirections={handleGetDirections}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Informations d'accessibilité */}
      <Card className="border-muted">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-medium text-foreground mb-1">Informations importantes</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Les horaires peuvent varier en fonction des jours fériés et événements exceptionnels.</li>
                <li>Nous vous recommandons d'appeler avant de vous déplacer pour confirmer l'ouverture.</li>
                <li>
                  Pour toute question, contactez notre service client au{" "}
                  <a
                    href="tel:+224222000000"
                    className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                  >
                    +224 222 000 000
                  </a>
                  .
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
