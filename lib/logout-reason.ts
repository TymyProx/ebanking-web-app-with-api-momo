export const LOGOUT_REASON_KEY = "ebanking_logout_reason"

export type LogoutReason = "idle_timeout" | "session_replaced" | "session_expired" | "manual"

export const LOGIN_LOGOUT_MESSAGES: Record<Exclude<LogoutReason, "manual">, string> = {
  session_replaced:
    "Votre session a été fermée car vous vous êtes connecté depuis un autre appareil ou navigateur.",
  idle_timeout:
    "Votre session a expiré pour cause d'inactivité. Veuillez vous reconnecter.",
  session_expired: "Votre session a expiré. Veuillez vous reconnecter.",
}

export function setLogoutReason(reason: LogoutReason): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(LOGOUT_REASON_KEY, reason)
  } catch {
    /* ignore */
  }
}

export function peekLogoutReason(): LogoutReason | null {
  if (typeof window === "undefined") return null
  try {
    const value = sessionStorage.getItem(LOGOUT_REASON_KEY)
    return value ? (value as LogoutReason) : null
  } catch {
    return null
  }
}

export function consumeLogoutReason(): LogoutReason | null {
  const value = peekLogoutReason()
  if (!value) return null
  try {
    sessionStorage.removeItem(LOGOUT_REASON_KEY)
  } catch {
    /* ignore */
  }
  return value
}

const SESSION_REPLACED_MARKER = "AUTH_SESSION_REPLACED"

/** Déduit la cause de déconnexion à partir d'une réponse 401 API. */
export function resolveLoginReasonFrom401(error: unknown): LogoutReason {
  const responseData = (error as { response?: { data?: unknown } })?.response?.data

  if (
    responseData === SESSION_REPLACED_MARKER ||
    (typeof responseData === "object" &&
      responseData !== null &&
      (responseData as { reason?: string }).reason === "session_replaced")
  ) {
    return "session_replaced"
  }

  return "session_expired"
}

export { SESSION_REPLACED_MARKER }
