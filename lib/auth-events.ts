/** Émis après login / logout pour recharger session côté client (notifications, etc.) */
export const EBANKING_AUTH_SESSION_CHANGED = "ebanking:auth-session-changed"

export function dispatchAuthSessionChanged(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(EBANKING_AUTH_SESSION_CHANGED))
}
