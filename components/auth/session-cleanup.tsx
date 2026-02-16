"use client"

import { useEffect } from "react"

const SESSION_FLAG = "session_active"

/**
 * Composant qui supprime les cookies et le localStorage à la fermeture de l'onglet ou du navigateur
 * Ne supprime PAS les cookies ni le localStorage lors d'un rafraîchissement de page
 * 
 * Logique :
 * - sessionStorage est préservé lors d'un rafraîchissement mais vidé lors de la fermeture de l'onglet
 * - Si le flag n'existe pas au chargement, c'est une nouvelle session (onglet fermé puis rouvert)
 * - Lors de la fermeture : supprime les cookies (via API) et le localStorage (côté client)
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

    // Écouter l'événement pagehide pour détecter la fermeture de l'onglet ou du navigateur
    // pagehide est plus fiable que unload pour distinguer fermeture vs rafraîchissement
    const handlePageHide = (e: PageTransitionEvent) => {
      // Si persisted est true, c'est un rafraîchissement (page mise en cache)
      // Dans ce cas, on ne supprime JAMAIS les cookies ni le localStorage
      if (e.persisted) {
        // C'est un rafraîchissement, on ne fait rien
        // Le flag reste dans sessionStorage et sera préservé
        return
      }
      
      // Si persisted est false, c'est une fermeture d'onglet ou du navigateur
      // On vérifie si le flag existe encore dans sessionStorage
      // Si le flag existe, c'est qu'on est dans une session active qui se ferme
      const currentFlag = sessionStorage.getItem(SESSION_FLAG)
      
      if (currentFlag) {
        // Le flag existe, donc c'est une vraie fermeture d'onglet/navigateur
        // On supprime le localStorage et les cookies
        
        // Supprimer le localStorage (token, user, et autres données d'authentification)
        try {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          localStorage.removeItem("rememberMe")
        } catch (localStorageError) {
          console.error("Error clearing localStorage:", localStorageError)
        }
        
        // Supprimer le flag
        sessionStorage.removeItem(SESSION_FLAG)
        
        // Supprimer les cookies via API
        const url = "/api/auth/clear-session"
        const blob = new Blob([JSON.stringify({})], { type: "application/json" })
        
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url, blob)
        } else {
          fetch(url, {
            method: "POST",
            body: JSON.stringify({}),
            headers: { "Content-Type": "application/json" },
            keepalive: true,
          }).catch(() => {
            // Ignorer les erreurs
          })
        }
      }
      // Si le flag n'existe pas, c'est qu'on est dans une nouvelle session
      // (onglet fermé puis rouvert), on ne fait rien car les cookies ont déjà été supprimés
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
