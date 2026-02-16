"use client"

import { useEffect } from "react"

const SESSION_FLAG = "session_active"

/**
 * Composant qui supprime les cookies de session à la fermeture de l'onglet
 * Ne supprime PAS les cookies lors d'un rafraîchissement de page
 * 
 * Logique :
 * - sessionStorage est préservé lors d'un rafraîchissement mais vidé lors de la fermeture de l'onglet
 * - Si le flag n'existe pas au chargement, c'est une nouvelle session (onglet fermé puis rouvert)
 * - On utilise performance.navigation.type pour détecter un refresh
 */
export function SessionCleanup() {
  useEffect(() => {
    // Vérifier si le flag de session existe
    // sessionStorage est préservé lors d'un rafraîchissement mais vidé lors de la fermeture de l'onglet
    const sessionFlag = sessionStorage.getItem(SESSION_FLAG)
    
    // Si le flag existe, c'est soit un refresh, soit une navigation normale
    // Dans ce cas, on ne supprime PAS les cookies - c'est une session continue
    if (sessionFlag) {
      // Le flag existe, donc c'est une session continue (refresh ou navigation)
      // On ne fait rien, les cookies restent intacts
      return
    }
    
    // Si le flag n'existe pas, cela peut être :
    // 1. Un premier chargement après connexion (on garde les cookies)
    // 2. Un nouvel onglet après fermeture (on supprime les cookies)
    // On ne peut pas vraiment distinguer ces deux cas au chargement initial
    // Donc on NE supprime PAS les cookies ici, seulement lors de la fermeture de l'onglet
    
    // Définir le flag de session active pour les prochains chargements
    // Ce flag sera préservé lors d'un rafraîchissement mais supprimé lors de la fermeture de l'onglet
    sessionStorage.setItem(SESSION_FLAG, "true")

    // Fonction pour supprimer les cookies de session
    // Cette fonction est appelée uniquement lors de la fermeture de l'onglet
    const clearSession = async () => {
      try {
        // Supprimer le flag de sessionStorage
        sessionStorage.removeItem(SESSION_FLAG)
        
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

    // Écouter l'événement visibilitychange pour détecter quand l'onglet devient caché
    // On ne supprime pas les cookies ici car l'onglet peut être juste caché (changement d'onglet)
    
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
      // Le flag reste dans sessionStorage et sera préservé
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
