"use client"

import { useEffect } from "react"

const SESSION_FLAG = "session_active"

/**
 * Marque simplement la session navigateur. On ne vide plus token / cookies sur
 * `pagehide` : cet événement se déclenche aussi quand on change d’onglet, on
 * passe en arrière-plan (mobile) ou on ouvre un PDF — ce qui déconnectait
 * l’utilisateur en cours d’usage.
 */
export function SessionCleanup() {
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_FLAG, "true")
    } catch (e) {
      console.warn("sessionStorage not available:", e)
    }
  }, [])

  return null
}
