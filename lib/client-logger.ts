/** Logs client visibles uniquement en développement local. */
export const isDevClient = process.env.NODE_ENV === "development"

export function devLog(...args: unknown[]) {
  if (isDevClient) console.log(...args)
}

export function devWarn(...args: unknown[]) {
  if (isDevClient) console.warn(...args)
}

export function devError(...args: unknown[]) {
  if (isDevClient) console.error(...args)
}

/** Extrait un message utilisateur sans exposer config/headers/stack Axios. */
export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") return fallback

  const err = error as { response?: { data?: unknown }; message?: string }
  const data = err.response?.data

  if (typeof data === "string" && data.trim()) return data.trim()

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>
    for (const key of ["message", "error", "msg"]) {
      const value = obj[key]
      if (typeof value === "string" && value.trim()) return value.trim()
    }
    if (Array.isArray(obj.errors) && obj.errors.length > 0) {
      const first = obj.errors[0] as { message?: string } | string
      if (typeof first === "string" && first.trim()) return first.trim()
      if (first && typeof first === "object" && typeof first.message === "string") {
        return first.message
      }
    }
  }

  if (typeof err.message === "string" && err.message.trim()) {
    const msg = err.message.trim()
    if (!msg.includes("status code") && !msg.startsWith("Request failed")) {
      return msg
    }
  }

  return fallback
}
