"use client"

import { useEffect } from "react"

/**
 * Composant qui supprime les cookies de session UNIQUEMENT à la fermeture de l'onglet
 * Ne supprime JAMAIS les cookies lors d'un rafraîchissement de page
 * 
 * IMPORTANT: Ce composant ne supprime plus les cookies au chargement pour éviter
 * les problèmes lors du rafraîchissement. Les cookies sont supprimés uniquement
 * lors de la fermeture de l'onglet via l'événement pagehide.
 */
export function SessionCleanup() {
  useEffect(() => {
    // Fonction pour supprimer les cookies de session
    // Cette fonction est appelée uniquement lors de la fermeture de l'onglet
    const clearSession = async () => {
      try {
        // Utiliser sendBeacon pour garantir l'envoi même si la page se ferme
        const url = "/api/auth/clear-session"
        const blob = new Blob([JSON.stringify({})], { type: "application/json" })
        
        // sendBeacon est plus fiable que fetch pour beforeunload
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url, blob)
        } else {
          // Fallback pour les navigateurs qui ne supportent pas sendBeacon
          fetch(url, {
            method: "POST",
            body: JSON.stringify({}),
            headers: { "Content-Type": "application/json" },
            keepalive: true, // Important pour les requêtes lors de la fermeture
          }).catch(() => {
            // Ignorer les erreurs lors de la fermeture
          })
        }
      } catch (error) {
        // Ignorer les erreurs lors de la fermeture de l'onglet
        console.error("Error clearing session:", error)
      }
    }

    // Écouter l'événement pagehide pour détecter la fermeture de l'onglet
    // pagehide est plus fiable que unload pour distinguer fermeture vs rafraîchissement
    const handlePageHide = (e: PageTransitionEvent) => {
      // Si persisted est false, c'est une fermeture d'onglet (pas un rafraîchissement)
      // persisted = true signifie que la page est mise en cache (rafraîchissement)
      if (!e.persisted) {
        // C'est une fermeture d'onglet, supprimer les cookies
        clearSession()
      }
      // Si persisted = true, c'est un rafraîchissement, on ne fait rien
      // Les cookies restent intacts
    }

    // Ajouter l'écouteur d'événement
    window.addEventListener("pagehide", handlePageHide)

    // Nettoyer l'écouteur lors du démontage
    return () => {
      window.removeEventListener("pagehide", handlePageHide)
    }
  }, [])

  // Ce composant ne rend rien
  return null
}
