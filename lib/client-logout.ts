"use client"

import AuthService from "@/lib/auth-service"

/** Nettoie la session côté serveur (cookies HttpOnly) puis localStorage / cookies JS. */
export async function clientLogout(): Promise<void> {
  try {
    await fetch("/api/auth/clear-session", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
  } catch {
    // on poursuit le nettoyage client même si l’API échoue
  }
  await AuthService.signOut()
}
