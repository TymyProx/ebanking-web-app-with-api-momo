import { useState, useEffect, useCallback } from "react"
import { config } from "@/lib/config"

export interface Agence {
  id: string
  agenceName: string
  address?: string
  city?: string
  country?: string
  postalCode?: string
  latitude?: number
  longitude?: number
  telephone?: string
  email?: string
  services?: string[]
  openingHours?: {
    mon?: { open: string; close: string; closed?: boolean }
    tue?: { open: string; close: string; closed?: boolean }
    wed?: { open: string; close: string; closed?: boolean }
    thu?: { open: string; close: string; closed?: boolean }
    fri?: { open: string; close: string; closed?: boolean }
    sat?: { open: string; close: string; closed?: boolean }
    sun?: { open: string; close: string; closed?: boolean }
  }
  exceptionalClosures?: Array<{
    date: string
    reason: string
  }>
  publicHolidays?: string[]
  isTemporarilyClosed?: boolean
  mapEmbedUrl?: string
  distance?: number
}

export interface AgencesQuery {
  search?: string
  city?: string
  country?: string
  status?: "all" | "open" | "closed"
  page?: number
  limit?: number
}

interface UseAgencesResult {
  agences: Agence[]
  loading: boolean
  error: string | null
  totalCount: number
  totalPages: number
  currentPage: number
  refetch: () => void
  setQuery: (query: AgencesQuery) => void
}

// Cache avec expiration de 5 minutes
interface CacheEntry {
  data: Agence[]
  timestamp: number
}

let cache: CacheEntry | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// URL du backup JSON fourni par l'équipe Marketing
const BACKUP_JSON_URL = "/data/agences-backup.json"

export function useAgences(initialQuery: AgencesQuery = {}): UseAgencesResult {
  const [agences, setAgences] = useState<Agence[]>([])
  const [allAgences, setAllAgences] = useState<Agence[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState<AgencesQuery>({
    page: 1,
    limit: 25,
    ...initialQuery,
  })

  const fetchAgences = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Vérifier le cache
      if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
        setAllAgences(cache.data)
        setLoading(false)
        return
      }

      // Tentative de récupération depuis l'API principale
      try {
        const base = config.API_BASE_URL.replace(/\/$/, "")
        const url = `${base}/api/portal/${config.TENANT_ID}/agences`
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const json = await res.json()
        const rows: Agence[] = json.rows || []

        // Mise à jour du cache
        cache = {
          data: rows,
          timestamp: Date.now(),
        }

        setAllAgences(rows)
      } catch (apiError) {
        console.warn("API principale indisponible, utilisation du backup:", apiError)

        // Fallback sur le backup JSON Marketing
        const backupRes = await fetch(BACKUP_JSON_URL)
        if (!backupRes.ok) throw new Error("Backup également indisponible")

        const backupData = await backupRes.json()
        const rows: Agence[] = backupData.agences || []

        // Mise à jour du cache avec le backup
        cache = {
          data: rows,
          timestamp: Date.now(),
        }

        setAllAgences(rows)
        setError("Mode hors ligne - Données de sauvegarde")
      }
    } catch (err) {
      console.error("Erreur lors du chargement des agences:", err)
      setError("Impossible de charger les agences. Veuillez réessayer plus tard.")
      setAllAgences([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Filtrage et pagination côté client
  useEffect(() => {
    let filtered = [...allAgences]

    // Recherche textuelle
    if (query.search) {
      const searchLower = query.search.toLowerCase()
      filtered = filtered.filter(
        (agence) =>
          agence.agenceName?.toLowerCase().includes(searchLower) ||
          agence.address?.toLowerCase().includes(searchLower) ||
          agence.city?.toLowerCase().includes(searchLower) ||
          agence.country?.toLowerCase().includes(searchLower)
      )
    }

    // Filtre par ville
    if (query.city && query.city !== "all") {
      filtered = filtered.filter((agence) => agence.city === query.city)
    }

    // Filtre par pays
    if (query.country && query.country !== "all") {
      filtered = filtered.filter((agence) => agence.country === query.country)
    }

    // Filtre par statut (ouvert/fermé)
    if (query.status && query.status !== "all") {
      const now = new Date()
      const currentDay = now.toLocaleLowerCase() as keyof typeof agence.openingHours
      const dayMap: Record<number, keyof typeof agence.openingHours> = {
        0: "sun",
        1: "mon",
        2: "tue",
        3: "wed",
        4: "thu",
        5: "fri",
        6: "sat",
      }
      const todayKey = dayMap[now.getDay()]

      filtered = filtered.filter((agence) => {
        const isOpen = isAgenceOpen(agence, now, todayKey)
        return query.status === "open" ? isOpen : !isOpen
      })
    }

    // Pagination
    const page = query.page || 1
    const limit = query.limit || 25
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit

    setAgences(filtered.slice(startIndex, endIndex))
  }, [allAgences, query])

  useEffect(() => {
    fetchAgences()
  }, [fetchAgences])

  const totalCount = allAgences.length
  const totalPages = Math.ceil(totalCount / (query.limit || 25))

  return {
    agences,
    loading,
    error,
    totalCount,
    totalPages,
    currentPage: query.page || 1,
    refetch: fetchAgences,
    setQuery,
  }
}

// Fonction utilitaire pour déterminer si une agence est ouverte
function isAgenceOpen(
  agence: Agence,
  now: Date,
  todayKey: keyof NonNullable<Agence["openingHours"]>
): boolean {
  // Vérifier fermeture temporaire
  if (agence.isTemporarilyClosed) return false

  // Vérifier fermetures exceptionnelles
  const todayStr = now.toISOString().split("T")[0]
  if (agence.exceptionalClosures?.some((closure) => closure.date === todayStr)) {
    return false
  }

  // Vérifier jours fériés
  if (agence.publicHolidays?.includes(todayStr)) {
    return false
  }

  // Vérifier horaires d'ouverture
  const todayHours = agence.openingHours?.[todayKey]
  if (!todayHours || todayHours.closed) return false

  const currentTime = now.getHours() * 60 + now.getMinutes()
  const [openHour, openMin] = todayHours.open.split(":").map(Number)
  const [closeHour, closeMin] = todayHours.close.split(":").map(Number)
  const openTime = openHour * 60 + openMin
  const closeTime = closeHour * 60 + closeMin

  return currentTime >= openTime && currentTime < closeTime
}

// Fonction pour obtenir le statut d'une agence
export function getAgenceStatus(agence: Agence): {
  status: "open" | "closed" | "exceptional" | "holiday"
  label: string
  color: string
} {
  const now = new Date()
  const dayMap: Record<number, keyof NonNullable<Agence["openingHours"]>> = {
    0: "sun",
    1: "mon",
    2: "tue",
    3: "wed",
    4: "thu",
    5: "fri",
    6: "sat",
  }
  const todayKey = dayMap[now.getDay()]
  const todayStr = now.toISOString().split("T")[0]

  // Fermeture temporaire
  if (agence.isTemporarilyClosed) {
    return { status: "closed", label: "Fermé temporairement", color: "red" }
  }

  // Fermeture exceptionnelle
  const exceptionalClosure = agence.exceptionalClosures?.find(
    (closure) => closure.date === todayStr
  )
  if (exceptionalClosure) {
    return {
      status: "exceptional",
      label: `Fermeture exceptionnelle - ${exceptionalClosure.reason}`,
      color: "red",
    }
  }

  // Jour férié
  if (agence.publicHolidays?.includes(todayStr)) {
    return { status: "holiday", label: "Fermé - Jour férié", color: "yellow" }
  }

  // Vérifier horaires
  const isOpen = isAgenceOpen(agence, now, todayKey)

  return {
    status: isOpen ? "open" : "closed",
    label: isOpen ? "Ouvert" : "Fermé",
    color: isOpen ? "green" : "gray",
  }
}

