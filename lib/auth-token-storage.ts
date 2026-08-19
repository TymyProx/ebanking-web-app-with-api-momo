import { getApiBaseUrl } from "./api-url"
import { tokenCookieName, userCookieName } from "./auth-cookie-names"

const TOKEN_KEY = "token"
const USER_KEY = "user"
const TAB_ID_KEY = "auth_tab_id"
const CHANNEL_NAME = "bng-eportal-auth-session"
const SESSION_FRESH_UNTIL_KEY = "auth_session_fresh_until"
const SESSION_EVICTED_KEY = "bng_session_evicted"
const LOGIN_GRACE_MS = 8_000

export type AuthBroadcastMessage =
  | { type: "SESSION_REPLACED"; sourceTabId: string }
  | { type: "SESSION_SIGNED_OUT"; sourceTabId: string }

let broadcastChannel: BroadcastChannel | null = null

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null
  if (!broadcastChannel) {
    try {
      broadcastChannel = new BroadcastChannel(CHANNEL_NAME)
    } catch {
      return null
    }
  }
  return broadcastChannel
}

/** Identifiant d'onglet stable (sessionStorage) pour les cookies serveur par onglet. */
export function getTabId(): string {
  if (typeof window === "undefined") return "server"

  let tabId = sessionStorage.getItem(TAB_ID_KEY)
  if (!tabId) {
    tabId = crypto.randomUUID()
    sessionStorage.setItem(TAB_ID_KEY, tabId)
  }
  return tabId
}

export function getTokenCookieName(tabId?: string): string {
  return tokenCookieName(tabId ?? getTabId())
}

export function getUserCookieName(tabId?: string): string {
  return userCookieName(tabId ?? getTabId())
}

export function clearLegacyAuthCookies() {
  if (typeof window === "undefined") return
  document.cookie = "token=; path=/; max-age=0"
  document.cookie = "user=; path=/; max-age=0"
  document.cookie = "auth_tab_id=; path=/; max-age=0"
}

/** Marque une fenêtre de grâce après connexion (évite faux 401 pendant la rotation). */
export function markSessionLoginFresh() {
  if (typeof window === "undefined") return
  sessionStorage.setItem(SESSION_FRESH_UNTIL_KEY, String(Date.now() + LOGIN_GRACE_MS))
}

export function isSessionLoginFresh(): boolean {
  if (typeof window === "undefined") return false
  const until = Number(sessionStorage.getItem(SESSION_FRESH_UNTIL_KEY) || "0")
  return until > Date.now()
}

/** Indique qu'un départ vers /login est une expulsion (pas une fermeture d'onglet). */
export function markSessionEvicted() {
  if (typeof window === "undefined") return
  sessionStorage.setItem(SESSION_EVICTED_KEY, "1")
}

export function consumeSessionEvicted(): boolean {
  if (typeof window === "undefined") return false
  const evicted = sessionStorage.getItem(SESSION_EVICTED_KEY) === "1"
  if (evicted) sessionStorage.removeItem(SESSION_EVICTED_KEY)
  return evicted
}

/** Notifie les autres onglets après une connexion complète (cookies + profil). */
export function notifyOtherTabsSessionReplaced() {
  if (typeof window === "undefined") return
  getChannel()?.postMessage({
    type: "SESSION_REPLACED",
    sourceTabId: getTabId(),
  } satisfies AuthBroadcastMessage)
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null

  const fromSession = sessionStorage.getItem(TOKEN_KEY)
  if (fromSession) return fromSession

  const legacy = localStorage.getItem(TOKEN_KEY)
  if (legacy) {
    sessionStorage.setItem(TOKEN_KEY, legacy)
    localStorage.removeItem(TOKEN_KEY)
    clearLegacyAuthCookies()
    return legacy
  }

  return null
}

export function setAuthToken(token: string, options?: { broadcastReplaced?: boolean }) {
  if (typeof window === "undefined") return

  sessionStorage.setItem(TOKEN_KEY, token)
  localStorage.removeItem(TOKEN_KEY)
  clearLegacyAuthCookies()

  if (options?.broadcastReplaced !== false) {
    notifyOtherTabsSessionReplaced()
  }
}

export function setUserDataJson(data: unknown) {
  if (typeof window === "undefined") return
  const serialized = JSON.stringify(data)
  sessionStorage.setItem(USER_KEY, serialized)
  localStorage.removeItem(USER_KEY)
}

export function getUserDataJson(): string | null {
  if (typeof window === "undefined") return null

  const fromSession = sessionStorage.getItem(USER_KEY)
  if (fromSession) return fromSession

  const legacy = localStorage.getItem(USER_KEY)
  if (legacy) {
    sessionStorage.setItem(USER_KEY, legacy)
    localStorage.removeItem(USER_KEY)
    return legacy
  }

  return null
}

export function clearAuthStorage(options?: { broadcast?: boolean }) {
  if (typeof window === "undefined") return

  const broadcast = options?.broadcast !== false

  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem("rememberMe")
  clearLegacyAuthCookies()

  if (broadcast) {
    getChannel()?.postMessage({
      type: "SESSION_SIGNED_OUT",
      sourceTabId: getTabId(),
    } satisfies AuthBroadcastMessage)
  }
}

export function subscribeAuthBroadcast(callback: (message: AuthBroadcastMessage) => void): () => void {
  const channel = getChannel()
  if (!channel) return () => {}

  const handler = (event: MessageEvent<AuthBroadcastMessage>) => {
    if (!event.data?.type) return
    if (event.data.sourceTabId === getTabId()) return
    callback(event.data)
  }

  channel.addEventListener("message", handler)
  return () => channel.removeEventListener("message", handler)
}

export async function validateSessionWithServer(): Promise<boolean> {
  const token = getAuthToken()
  if (!token) return false
  if (isSessionLoginFresh()) return true

  const apiBaseUrl = getApiBaseUrl().replace(/\/$/, "")

  try {
    const response = await fetch(`${apiBaseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    return response.ok
  } catch {
    return true
  }
}
