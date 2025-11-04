import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Clock, Navigation, Mail } from "lucide-react"
import { Agence, getAgenceStatus } from "@/hooks/use-agences"

interface AgenceCardProps {
  agence: Agence
  onGetDirections?: (agence: Agence) => void
}

export function AgenceCard({ agence, onGetDirections }: AgenceCardProps) {
  const status = getAgenceStatus(agence)

  const getStatusBadgeVariant = () => {
    switch (status.color) {
      case "green":
        return "default"
      case "red":
        return "destructive"
      case "yellow":
        return "secondary"
      default:
        return "outline"
    }
  }

  const handleCall = () => {
    if (agence.telephone) {
      window.location.href = `tel:${agence.telephone}`
    }
  }

  const handleEmail = () => {
    if (agence.email) {
      window.location.href = `mailto:${agence.email}`
    }
  }

  const getDayLabel = (key: string): string => {
    const labels: Record<string, string> = {
      mon: "Lundi",
      tue: "Mardi",
      wed: "Mercredi",
      thu: "Jeudi",
      fri: "Vendredi",
      sat: "Samedi",
      sun: "Dimanche",
    }
    return labels[key] || key
  }

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
      role="article"
      aria-label={`Agence ${agence.agenceName}`}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg mb-2 break-words">
              {agence.agenceName}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 mr-1 flex-shrink-0" aria-hidden="true" />
                <span className="break-words">
                  {agence.city}
                  {agence.country && `, ${agence.country}`}
                </span>
              </div>
              {agence.distance && (
                <Badge variant="outline" className="text-xs">
                  {agence.distance.toFixed(1)} km
                </Badge>
              )}
            </div>
          </div>
          <Badge 
            variant={getStatusBadgeVariant()}
            className="shrink-0"
            aria-label={`Statut: ${status.label}`}
          >
            {status.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Adresse */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground break-words">
            {agence.address}
            {agence.postalCode && ` - ${agence.postalCode}`}
          </p>
        </div>

        {/* Contact */}
        <div className="space-y-2">
          {agence.telephone && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Phone className="w-4 h-4 mr-2 flex-shrink-0" aria-hidden="true" />
              <a 
                href={`tel:${agence.telephone}`}
                className="hover:text-primary hover:underline focus:text-primary focus:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                aria-label={`Appeler l'agence ${agence.agenceName}`}
              >
                {agence.telephone}
              </a>
            </div>
          )}
          {agence.email && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail className="w-4 h-4 mr-2 flex-shrink-0" aria-hidden="true" />
              <a 
                href={`mailto:${agence.email}`}
                className="hover:text-primary hover:underline focus:text-primary focus:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded break-all"
                aria-label={`Envoyer un email à l'agence ${agence.agenceName}`}
              >
                {agence.email}
              </a>
            </div>
          )}
        </div>

        {/* Horaires d'ouverture */}
        {agence.openingHours && (
          <div className="space-y-2">
            <div className="flex items-center text-sm font-medium">
              <Clock className="w-4 h-4 mr-2" aria-hidden="true" />
              Horaires d'ouverture
            </div>
            <div className="text-sm text-muted-foreground space-y-1 pl-6">
              {Object.entries(agence.openingHours).map(([key, hours]) => (
                <div key={key} className="flex justify-between">
                  <span className="font-medium">{getDayLabel(key)}:</span>
                  <span>
                    {hours?.closed
                      ? "Fermé"
                      : hours?.open && hours?.close
                      ? `${hours.open} - ${hours.close}`
                      : "Non disponible"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services disponibles */}
        {agence.services && agence.services.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Services disponibles:</p>
            <div className="flex flex-wrap gap-1" role="list" aria-label="Services disponibles">
              {agence.services.map((service, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs"
                  role="listitem"
                >
                  {service}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Fermetures exceptionnelles à venir */}
        {agence.exceptionalClosures && agence.exceptionalClosures.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-orange-600">Fermetures à venir:</p>
            <div className="space-y-1">
              {agence.exceptionalClosures.slice(0, 3).map((closure, index) => (
                <div key={index} className="text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-300">
                    {new Date(closure.date).toLocaleDateString("fr-FR")} - {closure.reason}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          {agence.telephone && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 min-w-[120px]"
              onClick={handleCall}
              aria-label={`Appeler l'agence ${agence.agenceName}`}
            >
              <Phone className="w-4 h-4 mr-1" aria-hidden="true" />
              Appeler
            </Button>
          )}
          {agence.email && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 min-w-[120px]"
              onClick={handleEmail}
              aria-label={`Envoyer un email à l'agence ${agence.agenceName}`}
            >
              <Mail className="w-4 h-4 mr-1" aria-hidden="true" />
              Email
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            className="flex-1 min-w-[120px]"
            onClick={() => onGetDirections?.(agence)}
            aria-label={`Obtenir l'itinéraire vers l'agence ${agence.agenceName}`}
          >
            <Navigation className="w-4 h-4 mr-1" aria-hidden="true" />
            Itinéraire
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
