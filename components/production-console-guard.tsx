"use client"

import { useEffect } from "react"

/**
 * En production, neutralise la console navigateur pour éviter
 * l'exposition de détails techniques (stack, headers, tokens…).
 */
export function ProductionConsoleGuard() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return

    const noop = () => {}
    const methods = ["log", "debug", "info", "warn", "error", "trace"] as const

    for (const method of methods) {
      try {
        ;(console[method] as (...args: unknown[]) => void) = noop
      } catch {
        // ignore
      }
    }
  }, [])

  return null
}
