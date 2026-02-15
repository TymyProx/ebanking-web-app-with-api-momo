"use client"

import { useEffect } from "react"

const SESSION_FLAG = "session_active"

/**
 * Composant qui supprime les cookies de session à la fermeture de l'onglet
 * Utilise sessionStorage pour détecter si l'onglet a été fermé
 */
export function SessionCleanup() {
  useEffect(() => {
    // Vérifier si c'est un nouveau chargement de page (onglet fermé puis rouvert)
    const sessionFlag = sessionStorage.getItem(SESSION_FLAG)
    
    if (!sessionFlag) {
      // Si le flag n'existe pas, cela signifie que l'onglet a été fermé
      // Supprimer les cookies de session
      const clearSession = async () => {
        try {
          await fetch("/api/auth/clear-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          })
        } catch (error) {
          // Ignorer les erreurs
          console.error("Error clearing session:", error)
        }
      }
      clearSession()
    }

    // Définir le flag de session active
    sessionStorage.setItem(SESSION_FLAG, "true")

    // Fonction pour supprimer les cookies de session
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

    // Écouter l'événement beforeunload (avant la fermeture de l'onglet)
    const handleBeforeUnload = () => {
      clearSession()
    }

    // Écouter l'événement unload (pendant la fermeture de l'onglet)
    const handleUnload = () => {
      clearSession()
    }

    // Écouter l'événement visibilitychange (quand l'onglet devient caché)
    // Note: On ne supprime pas les cookies ici car l'onglet peut être juste caché
    // et non fermé (ex: changement d'onglet)

    // Ajouter les écouteurs d'événements
    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("unload", handleUnload)

    // Nettoyer les écouteurs lors du démontage
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("unload", handleUnload)
    }
  }, [])

  // Ce composant ne rend rien
  return null
}
