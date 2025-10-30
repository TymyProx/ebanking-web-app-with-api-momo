"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Phone, Clock, Navigation, Search, Filter } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { config } from "@/lib/config"

interface PortalAgence {
  id: string
  agenceName: string
  address?: string
  city?: string
  postalCode?: string
  openingHours?: any
  branchManagerName?: string
  branchManagerPhone?: string
  exceptionalClosures?: any
  isTemporarilyClosed?: boolean
  mapEmbedUrl?: string
}

export default function AgencesPage() {
  const [allAgences, setAllAgences] = useState<PortalAgence[]>([])
  const [filteredAgences, setFilteredAgences] = useState<PortalAgence[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCommune, setSelectedCommune] = useState<string>("all")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)

  const communes = Array.from(new Set(allAgences.map((a) => a.city || ""))).filter(Boolean).sort()

  useEffect(() => {
    const fetchAgences = async () => {
      try {
        const base = config.API_BASE_URL.replace(/\/$/, "")
        const url = `${base}/api/portal/${config.TENANT_ID}/agences`
        const res = await fetch(url, { headers: { "Accept": "application/json" } })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const rows: PortalAgence[] = json.rows || []
        setAllAgences(rows)
        setFilteredAgences(rows)
      } catch (e) {
        console.error("Failed to load agences portal:", e)
        toast({ title: "Erreur", description: "Impossible de charger les agences.", variant: "destructive" })
      }
    }
    fetchAgences()
  }, [])

  useEffect(() => {
    let filtered = allAgences

    if (searchTerm) {
      filtered = filtered.filter(
        (agence) =>
          (agence.agenceName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (agence.address || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (agence.city || "").toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedCommune !== "all") {
      filtered = filtered.filter((agence) => (agence.city || "") === selectedCommune)
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

  const openInMaps = (agence: PortalAgence) => {
    if (agence.mapEmbedUrl) {
      window.open(agence.mapEmbedUrl, "_blank")
      return
    }
    if (agence.address || agence.city) {
      const q = encodeURIComponent(`${agence.address || ""} ${agence.city || ""}`.trim())
      window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank")
    }
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
                  <CardTitle className="text-lg">{agence.agenceName}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {agence.city || ""}
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
                <p className="text-sm text-gray-600">{agence.address}</p>
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
                {agence.openingHours && (
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Lun: {agence.openingHours?.mon?.open || "-"} - {agence.openingHours?.mon?.close || "-"}</p>
                    <p>Mar: {agence.openingHours?.tue?.open || "-"} - {agence.openingHours?.tue?.close || "-"}</p>
                    <p>Mer: {agence.openingHours?.wed?.open || "-"} - {agence.openingHours?.wed?.close || "-"}</p>
                    <p>Jeu: {agence.openingHours?.thu?.open || "-"} - {agence.openingHours?.thu?.close || "-"}</p>
                    <p>Ven: {agence.openingHours?.fri?.open || "-"} - {agence.openingHours?.fri?.close || "-"}</p>
                  </div>
                )}
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
