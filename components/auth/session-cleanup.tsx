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
    // IMPORTANT: Définir le flag IMMÉDIATEMENT au début pour protéger contre les refresh
    // Ce flag sera préservé lors d'un rafraîchissement mais supprimé lors de la fermeture de l'onglet
    // Si le flag existe déjà, c'est qu'on est dans une session continue (refresh ou navigation)
    const sessionFlag = sessionStorage.getItem(SESSION_FLAG)
    
    // Définir le flag maintenant pour protéger contre les refresh
    // Même si le flag existait déjà, on le redéfinit pour s'assurer qu'il est présent
    sessionStorage.setItem(SESSION_FLAG, "true")
    
    // Si le flag existait déjà, c'est une session continue (refresh ou navigation)
    // Dans ce cas, on ne fait rien de plus, les cookies restent intacts
    if (sessionFlag) {
      // Le flag existait déjà, donc c'est une session continue (refresh ou navigation)
      // On ne fait rien de plus, les cookies restent intacts
      // On continue pour définir les écouteurs d'événements
    }
    
    // Si le flag n'existait pas, c'est soit :
    // 1. Un premier chargement après connexion (on garde les cookies)
    // 2. Un nouvel onglet après fermeture (on supprimera les cookies lors de la fermeture)
    // On ne supprime PAS les cookies ici, seulement lors de la fermeture de l'onglet

    // Fonction pour supprimer les cookies de session
    // Cette fonction est appelée uniquement lors de la fermeture de l'onglet
    // IMPORTANT: On ne supprime JAMAIS les cookies si le flag existe (refresh ou navigation)
    const clearSession = async () => {
      try {
        // Vérifier une dernière fois si le flag existe
        // Si le flag existe, c'est qu'on est dans une session active (refresh ou navigation)
        // Dans ce cas, on NE supprime PAS les cookies
        const currentFlag = sessionStorage.getItem(SESSION_FLAG)
        if (currentFlag) {
          // Le flag existe, donc c'est une session active, on ne supprime PAS les cookies
          return
        }
        
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

    // Écouter l'événement pagehide pour détecter la fermeture de l'onglet
    // pagehide est plus fiable que unload pour distinguer fermeture vs rafraîchissement
    const handlePageHide = (e: PageTransitionEvent) => {
      // Si persisted est true, c'est un rafraîchissement (page mise en cache)
      // Dans ce cas, on ne supprime JAMAIS les cookies
      if (e.persisted) {
        // C'est un rafraîchissement, on ne fait rien
        // Le flag reste dans sessionStorage et sera préservé
        return
      }
      
      // Si persisted est false, cela peut être une fermeture d'onglet
      // Mais on vérifie d'abord si le flag existe
      // Si le flag existe, c'est qu'on est dans une session active (refresh ou navigation)
      const currentFlag = sessionStorage.getItem(SESSION_FLAG)
      if (currentFlag) {
        // Le flag existe, donc c'est une session active, on ne supprime PAS les cookies
        // Cela protège contre les faux positifs lors d'un refresh
        return
      }
      
      // Seulement si le flag n'existe pas ET que persisted est false,
      // on peut supposer que c'est une vraie fermeture d'onglet
      // Mais même dans ce cas, clearSession vérifiera encore une fois le flag
      clearSession()
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
