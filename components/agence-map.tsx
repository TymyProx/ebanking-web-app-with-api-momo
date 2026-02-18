"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Navigation, Loader2, AlertCircle } from "lucide-react"
import { Agence } from "@/hooks/use-agences"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AgenceMapProps {
  agences: Agence[]
  selectedAgence?: Agence | null
  onAgenceSelect?: (agence: Agence) => void
  onGetDirections?: (agence: Agence) => void
  className?: string
}

// Carte basée sur iframe (Google Maps) pour éviter les dépendances lourdes
export function AgenceMap({
  agences,
  selectedAgence,
  onAgenceSelect,
  onGetDirections,
  className,
}: AgenceMapProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [noCoordinates, setNoCoordinates] = useState(false)
  const [mapIframeUrl, setMapIframeUrl] = useState<string | null>(null)

  const agencesWithCoords = useMemo(
    () => agences.filter((a) => typeof a.latitude === "number" && typeof a.longitude === "number"),
    [agences],
  )

  const buildGoogleMapsEmbedUrl = (lat: number, lng: number, zoom = 15) =>
    `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`

  useEffect(() => {
    // Déterminer la vue carte: agence sélectionnée (pin), sinon première agence avec coords
    if (agences.length === 0) return

    if (agencesWithCoords.length === 0) {
      setNoCoordinates(true)
      setIsLoading(false)
      return
    }

    const defaultAgence = agencesWithCoords[0]
    const hasSelectedCoords =
      typeof selectedAgence?.latitude === "number" && typeof selectedAgence?.longitude === "number"
    const focusAgence = hasSelectedCoords ? (selectedAgence as Agence) : defaultAgence

    setHasError(false)
    setNoCoordinates(false)
    setMapIframeUrl(
      focusAgence.mapEmbedUrl ||
        buildGoogleMapsEmbedUrl(focusAgence.latitude as number, focusAgence.longitude as number, 15),
    )
    setIsLoading(false)
  }, [agences, agencesWithCoords, selectedAgence])

  const handleGetUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setMapIframeUrl(buildGoogleMapsEmbedUrl(loc.lat, loc.lng, 15))
        },
        (error) => {
          console.error("Erreur de géolocalisation:", error)
        }
      )
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-[600px]">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (noCoordinates) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-[600px]">
          <Alert variant="default" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Aucune agence ne dispose de coordonnées GPS. La vue carte ne peut pas être affichée.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (hasError || !mapIframeUrl || agences.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-[600px]">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {agences.length === 0
                ? "Aucune agence à afficher sur la carte."
                : "Impossible de charger la carte. Veuillez réessayer."}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-0 relative h-[600px]">
        <div className="relative w-full h-full overflow-hidden" role="region" aria-label="Carte des agences">
          {/* Fond Google Maps (pin affiché par Google, donc position toujours correcte) */}
          {mapIframeUrl && !hasError && (
            <iframe
              title="Google Maps"
              src={mapIframeUrl}
              className="absolute inset-0 w-full h-full"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              onError={() => setHasError(true)}
            />
          )}
        </div>

        {/* Contrôles */}
        <div className="absolute top-4 right-4 space-y-2 z-20">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleGetUserLocation}
            className="shadow-lg"
            aria-label="Me localiser"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Me localiser
          </Button>
        </div>

        {/* Sélecteur d'agence (pour déplacer l'épingle correctement) */}
        <div className="absolute top-4 left-4 z-20 w-[320px] max-w-[calc(100%-2rem)]">
          <Select
            value={selectedAgence?.id || ""}
            onValueChange={(id) => {
              const a = agences.find((x) => x.id === id)
              if (a) onAgenceSelect?.(a)
            }}
          >
            <SelectTrigger className="bg-white/90 backdrop-blur shadow-lg">
              <SelectValue placeholder="Choisir une agence" />
            </SelectTrigger>
            <SelectContent>
              {agences.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.agenceName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Légende */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 space-y-2 z-20">
          <p className="text-xs font-semibold mb-2">Légende</p>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Ouvert</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
            <span>Fermé</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Fermeture exceptionnelle</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Jour férié</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
