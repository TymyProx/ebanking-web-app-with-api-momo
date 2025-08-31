"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Phone, Clock, Navigation, Search, Filter } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Agence {
  id: string
  nom: string
  adresse: string
  commune: string
  telephone: string
  email: string
  horaires: {
    semaine: string
    samedi: string
    dimanche: string
  }
  services: string[]
  coordonnees: {
    lat: number
    lng: number
  }
  distance?: number
}

const agences: Agence[] = [
  {
    id: "1",
    nom: "BNG Plateau",
    adresse: "Avenue Chardy, Immeuble SCIAM, Plateau",
    commune: "Plateau",
    telephone: "+225 20 20 20 20",
    email: "plateau@bng.ci",
    horaires: {
      semaine: "8h00 - 17h00",
      samedi: "8h00 - 12h00",
      dimanche: "Fermé",
    },
    services: ["Guichet automatique", "Conseiller clientèle", "Coffre-fort", "Change"],
    coordonnees: { lat: 5.3196, lng: -4.0231 },
  },
  {
    id: "2",
    nom: "BNG Cocody",
    adresse: "Boulevard Lagunaire, Riviera 2, Cocody",
    commune: "Cocody",
    telephone: "+225 20 20 20 21",
    email: "cocody@bng.ci",
    horaires: {
      semaine: "8h00 - 17h00",
      samedi: "8h00 - 12h00",
      dimanche: "Fermé",
    },
    services: ["Guichet automatique", "Conseiller clientèle", "Crédit immobilier"],
    coordonnees: { lat: 5.3441, lng: -3.9921 },
  },
  {
    id: "3",
    nom: "BNG Marcory",
    adresse: "Boulevard VGE, Zone 4C, Marcory",
    commune: "Marcory",
    telephone: "+225 20 20 20 22",
    email: "marcory@bng.ci",
    horaires: {
      semaine: "8h00 - 17h00",
      samedi: "8h00 - 12h00",
      dimanche: "Fermé",
    },
    services: ["Guichet automatique", "Conseiller clientèle", "Western Union"],
    coordonnees: { lat: 5.2847, lng: -4.0162 },
  },
  {
    id: "4",
    nom: "BNG Adjamé",
    adresse: "Avenue 13, près du marché d'Adjamé",
    commune: "Adjamé",
    telephone: "+225 20 20 20 23",
    email: "adjame@bng.ci",
    horaires: {
      semaine: "8h00 - 17h00",
      samedi: "8h00 - 12h00",
      dimanche: "Fermé",
    },
    services: ["Guichet automatique", "Conseiller clientèle", "Microfinance"],
    coordonnees: { lat: 5.378, lng: -4.0164 },
  },
  {
    id: "5",
    nom: "BNG Treichville",
    adresse: "Avenue 7, Boulevard de la République, Treichville",
    commune: "Treichville",
    telephone: "+225 20 20 20 24",
    email: "treichville@bng.ci",
    horaires: {
      semaine: "8h00 - 17h00",
      samedi: "8h00 - 12h00",
      dimanche: "Fermé",
    },
    services: ["Guichet automatique", "Conseiller clientèle", "Change", "Transfert international"],
    coordonnees: { lat: 5.2944, lng: -4.0267 },
  },
]

export default function AgencesPage() {
  const [filteredAgences, setFilteredAgences] = useState<Agence[]>(agences)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCommune, setSelectedCommune] = useState<string>("all")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)

  const communes = Array.from(new Set(agences.map((a) => a.commune))).sort()

  useEffect(() => {
    let filtered = agences

    if (searchTerm) {
      filtered = filtered.filter(
        (agence) =>
          agence.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agence.adresse.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agence.commune.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedCommune !== "all") {
      filtered = filtered.filter((agence) => agence.commune === selectedCommune)
    }

    // Calculer les distances si la géolocalisation est disponible
    if (userLocation) {
      filtered = filtered
        .map((agence) => ({
          ...agence,
          distance: calculateDistance(userLocation, agence.coordonnees),
        }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
    }

    setFilteredAgences(filtered)
  }, [searchTerm, selectedCommune, userLocation])

  const calculateDistance = (pos1: { lat: number; lng: number }, pos2: { lat: number; lng: number }) => {
    const R = 6371 // Rayon de la Terre en km
    const dLat = ((pos2.lat - pos1.lat) * Math.PI) / 180
    const dLon = ((pos2.lng - pos1.lng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((pos1.lat * Math.PI) / 180) *
        Math.cos((pos2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const getCurrentLocation = () => {
    setIsLoadingLocation(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setIsLoadingLocation(false)
          toast({
            title: "Position détectée",
            description: "Les agences sont maintenant triées par distance.",
          })
        },
        (error) => {
          setIsLoadingLocation(false)
          toast({
            title: "Erreur de géolocalisation",
            description: "Impossible d'obtenir votre position.",
            variant: "destructive",
          })
        },
      )
    } else {
      setIsLoadingLocation(false)
      toast({
        title: "Géolocalisation non supportée",
        description: "Votre navigateur ne supporte pas la géolocalisation.",
        variant: "destructive",
      })
    }
  }

  const openInMaps = (agence: Agence) => {
    const url = `www.google.com/maps/dir/?api=1&destination=${agence.coordonnees.lat},${agence.coordonnees.lng}`
    window.open(url, "_blank")
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nos Agences</h1>
          <p className="text-gray-600">Trouvez l'agence BNG la plus proche de vous</p>
        </div>
        <Button onClick={getCurrentLocation} disabled={isLoadingLocation} variant="outline">
          <Navigation className="w-4 h-4 mr-2" />
          {isLoadingLocation ? "Localisation..." : "Me localiser"}
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtres de recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher par nom, adresse ou commune..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCommune} onValueChange={setSelectedCommune}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Toutes les communes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les communes</SelectItem>
                {communes.map((commune) => (
                  <SelectItem key={commune} value={commune}>
                    {commune}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des agences */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredAgences.map((agence) => (
          <Card key={agence.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{agence.nom}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {agence.commune}
                    {agence.distance && (
                      <Badge variant="outline" className="ml-2">
                        {agence.distance.toFixed(1)} km
                      </Badge>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{agence.adresse}</p>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  {agence.telephone}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm font-medium">
                  <Clock className="w-4 h-4 mr-2" />
                  Horaires
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Lun-Ven: {agence.horaires.semaine}</p>
                  <p>Samedi: {agence.horaires.samedi}</p>
                  <p>Dimanche: {agence.horaires.dimanche}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Services disponibles:</p>
                <div className="flex flex-wrap gap-1">
                  {agence.services.map((service, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={() => window.open(`tel:${agence.telephone}`)}
                >
                  <Phone className="w-4 h-4 mr-1" />
                  Appeler
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={() => openInMaps(agence)}
                >
                  <Navigation className="w-4 h-4 mr-1" />
                  Itinéraire
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAgences.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune agence trouvée</h3>
            <p className="text-gray-600">Essayez de modifier vos critères de recherche.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
