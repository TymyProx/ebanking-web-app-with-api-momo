"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Navigation, Loader2, AlertCircle } from "lucide-react"
import { Agence, getAgenceStatus } from "@/hooks/use-agences"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AgenceMapProps {
  agences: Agence[]
  selectedAgence?: Agence | null
  onAgenceSelect?: (agence: Agence) => void
  onGetDirections?: (agence: Agence) => void
  className?: string
}

// Utilisation d'une carte basée sur iframe pour éviter les dépendances lourdes
// et permettre le lazy loading
export function AgenceMap({
  agences,
  selectedAgence,
  onAgenceSelect,
  onGetDirections,
  className,
}: AgenceMapProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  // Carte interactive avec marqueurs SVG personnalisés
  const mapRef = useRef<HTMLDivElement>(null)
  const [hoveredAgence, setHoveredAgence] = useState<Agence | null>(null)
  const [mapBounds, setMapBounds] = useState<{
    minLat: number
    maxLat: number
    minLng: number
    maxLng: number
  } | null>(null)

  useEffect(() => {
    // Calculer les limites de la carte
    if (agences.length > 0) {
      const validAgences = agences.filter((a) => a.latitude && a.longitude)
      if (validAgences.length > 0) {
        const lats = validAgences.map((a) => a.latitude!)
        const lngs = validAgences.map((a) => a.longitude!)

        setMapBounds({
          minLat: Math.min(...lats),
          maxLat: Math.max(...lats),
          minLng: Math.min(...lngs),
          maxLng: Math.max(...lngs),
        })
        setIsLoading(false)
      }
    }
  }, [agences])

  const getAgencePosition = (agence: Agence) => {
    if (!agence.latitude || !agence.longitude || !mapBounds) return null

    const padding = 0.1 // 10% de marge
    const latRange = mapBounds.maxLat - mapBounds.minLat
    const lngRange = mapBounds.maxLng - mapBounds.minLng

    // Normaliser les coordonnées entre 0 et 1 avec padding
    const x =
      ((agence.longitude - mapBounds.minLng + lngRange * padding) /
        (lngRange * (1 + 2 * padding))) *
      100
    const y =
      ((mapBounds.maxLat - agence.latitude + latRange * padding) /
        (latRange * (1 + 2 * padding))) *
      100

    return { x, y }
  }

  const handleGetUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
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

  if (hasError || !mapBounds || agences.length === 0) {
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
        {/* Carte SVG avec marqueurs */}
        <div
          ref={mapRef}
          className="relative w-full h-full bg-gradient-to-br from-blue-50 to-green-50 overflow-hidden"
          role="region"
          aria-label="Carte des agences"
        >
          {/* Grille de fond */}
          <svg
            className="absolute inset-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="rgba(0,0,0,0.05)"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Marqueurs des agences */}
          {agences.map((agence) => {
            const pos = getAgencePosition(agence)
            if (!pos) return null

            const status = getAgenceStatus(agence)
            const isSelected = selectedAgence?.id === agence.id
            const isHovered = hoveredAgence?.id === agence.id

            return (
              <div
                key={agence.id}
                className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer transition-all duration-200 z-10"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  zIndex: isSelected || isHovered ? 50 : 10,
                }}
                onMouseEnter={() => setHoveredAgence(agence)}
                onMouseLeave={() => setHoveredAgence(null)}
                onClick={() => onAgenceSelect?.(agence)}
                role="button"
                tabIndex={0}
                aria-label={`Agence ${agence.agenceName}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onAgenceSelect?.(agence)
                  }
                }}
              >
                {/* Marqueur */}
                <svg
                  width={isSelected || isHovered ? "48" : "32"}
                  height={isSelected || isHovered ? "60" : "40"}
                  viewBox="0 0 32 40"
                  className="drop-shadow-lg transition-all duration-200"
                  aria-hidden="true"
                >
                  <path
                    d="M16 0C7.2 0 0 7.2 0 16c0 8 10 20 15 24 1 1 1 1 2 0 5-4 15-16 15-24C32 7.2 24.8 0 16 0z"
                    fill={
                      status.color === "green"
                        ? "#22c55e"
                        : status.color === "red"
                        ? "#ef4444"
                        : status.color === "yellow"
                        ? "#eab308"
                        : "#6b7280"
                    }
                    stroke="white"
                    strokeWidth="2"
                  />
                  <circle cx="16" cy="15" r="6" fill="white" />
                </svg>

                {/* Popup au survol ou sélection */}
                {(isSelected || isHovered) && (
                  <div
                    className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 w-72 pointer-events-none"
                    role="tooltip"
                  >
                    <Card className="shadow-xl border-2 border-primary pointer-events-auto">
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <h3 className="font-semibold text-base mb-1">
                            {agence.agenceName}
                          </h3>
                          <Badge
                            variant={
                              status.color === "green"
                                ? "default"
                                : status.color === "red"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {status.label}
                          </Badge>
                        </div>

                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-start">
                            <MapPin className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                            <span className="break-words">
                              {agence.address}
                              {agence.city && `, ${agence.city}`}
                            </span>
                          </div>

                          {agence.telephone && (
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                              <span>{agence.telephone}</span>
                            </div>
                          )}

                          {agence.openingHours && (
                            <div className="text-xs mt-2 p-2 bg-muted rounded">
                              <p className="font-medium mb-1">Horaires:</p>
                              {Object.entries(agence.openingHours)
                                .slice(0, 2)
                                .map(([key, hours]) => (
                                  <div key={key} className="flex justify-between">
                                    <span>
                                      {key === "mon"
                                        ? "Lun"
                                        : key === "tue"
                                        ? "Mar"
                                        : key === "wed"
                                        ? "Mer"
                                        : key === "thu"
                                        ? "Jeu"
                                        : key === "fri"
                                        ? "Ven"
                                        : key === "sat"
                                        ? "Sam"
                                        : "Dim"}
                                      :
                                    </span>
                                    <span>
                                      {hours?.closed
                                        ? "Fermé"
                                        : `${hours?.open || ""} - ${hours?.close || ""}`}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          )}

                          {agence.services && agence.services.length > 0 && (
                            <div className="text-xs">
                              <p className="font-medium mb-1">Services:</p>
                              <div className="flex flex-wrap gap-1">
                                {agence.services.slice(0, 3).map((service, i) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {service}
                                  </Badge>
                                ))}
                                {agence.services.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{agence.services.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <Button
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            onGetDirections?.(agence)
                          }}
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          Obtenir l'itinéraire
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )
          })}

          {/* Position de l'utilisateur */}
          {userLocation && mapBounds && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${
                  ((userLocation.lng - mapBounds.minLng) /
                    (mapBounds.maxLng - mapBounds.minLng)) *
                  100
                }%`,
                top: `${
                  ((mapBounds.maxLat - userLocation.lat) /
                    (mapBounds.maxLat - mapBounds.minLat)) *
                  100
                }%`,
              }}
            >
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
            </div>
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

// Composant pour un marqueur simple (exporté pour réutilisation)
export function AgenceMarker({
  agence,
  isSelected,
}: {
  agence: Agence
  isSelected?: boolean
}) {
  const status = getAgenceStatus(agence)

  return (
    <div className="relative">
      <MapPin
        className={`w-8 h-8 ${
          status.color === "green"
            ? "text-green-500"
            : status.color === "red"
            ? "text-red-500"
            : status.color === "yellow"
            ? "text-yellow-500"
            : "text-gray-500"
        } ${isSelected ? "animate-bounce" : ""}`}
        fill="currentColor"
      />
    </div>
  )
}
