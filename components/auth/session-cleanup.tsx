"use client"

import { useEffect } from "react"
import {
  clearAuthStorage,
  consumeSessionEvicted,
  getTabId,
} from "@/lib/auth-token-storage"

const SESSION_FLAG = "session_active"
const REFRESH_FLAG = "is_refreshing"

export function SessionCleanup() {
  useEffect(() => {
    // Marquer session active (survit aux refresh, disparaît à la fermeture onglet)
    try {
      sessionStorage.setItem(SESSION_FLAG, "true")
      // On remet le refresh flag à false au chargement normal
      sessionStorage.removeItem(REFRESH_FLAG)
    } catch (e) {
      console.warn("sessionStorage not available:", e)
    }

    // Détecter explicitement un refresh/navigation (F5, Ctrl+R, fermeture = aussi beforeunload)
    // => on s'en sert pour empêcher le cleanup en cas de refresh
    const markRefresh = () => {
      try {
        sessionStorage.setItem(REFRESH_FLAG, "true")
      } catch {}
    }

    // Bonus: détecte les raccourcis refresh (utile sur certains navigateurs)
    const onKeyDown = (e: KeyboardEvent) => {
      const isRefreshKey =
        e.key === "F5" ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r")
      if (isRefreshKey) markRefresh()
    }

    // beforeunload se déclenche sur refresh ET fermeture,
    // donc on s'en sert uniquement pour marquer "possible refresh"
    window.addEventListener("beforeunload", markRefresh)
    window.addEventListener("keydown", onKeyDown)

    const handlePageHide = (e: PageTransitionEvent) => {
      if (e.persisted) return
      if (consumeSessionEvicted()) return

      try {
        const sessionActive = sessionStorage.getItem(SESSION_FLAG)
        const isRefreshing = sessionStorage.getItem(REFRESH_FLAG) === "true"

        // 2) Si on a détecté un refresh/navigation, on ne nettoie pas
        if (isRefreshing) {
          // Important: on enlève le flag pour éviter qu'il pollue la prochaine navigation
          sessionStorage.removeItem(REFRESH_FLAG)
          return
        }

        // 3) Sinon, c'est une vraie fermeture onglet/navigateur -> cleanup
        if (sessionActive) {
          try {
            clearAuthStorage({ broadcast: false })
          } catch {}

          sessionStorage.removeItem(SESSION_FLAG)
          sessionStorage.removeItem(REFRESH_FLAG)

          const url = "/api/auth/clear-session"
          const blob = new Blob([JSON.stringify({ tabId: getTabId() })], {
            type: "application/json",
          })

          if (navigator.sendBeacon) {
            navigator.sendBeacon(url, blob)
          } else {
            fetch(url, {
              method: "POST",
              body: JSON.stringify({ tabId: getTabId() }),
              headers: { "Content-Type": "application/json" },
              keepalive: true,
            }).catch(() => {})
          }
        }
      } catch (err) {
        console.warn("Error in handlePageHide:", err)
      }
    }

    window.addEventListener("pagehide", handlePageHide)

    return () => {
      window.removeEventListener("pagehide", handlePageHide)
      window.removeEventListener("beforeunload", markRefresh)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  return null
}
