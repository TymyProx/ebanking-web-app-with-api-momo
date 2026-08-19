"use client"

import AuthService from "@/lib/auth-service"
import { getTabId } from "@/lib/client-tab-id"

/** Nettoie la session côté serveur (cookies HttpOnly) puis sessionStorage local. */
export async function clientLogout(): Promise<void> {
  try {
    await fetch("/api/auth/clear-session", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tabId: getTabId() }),
    })
  } catch {
    // on poursuit le nettoyage client même si l'API échoue
  }
  await AuthService.signOut()
}
