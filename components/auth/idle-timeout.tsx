"use client"

import { useEffect, useRef, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import AuthService from "@/lib/auth-service"
import { dispatchAuthSessionChanged, EBANKING_AUTH_SESSION_CHANGED } from "@/lib/auth-events"
import { clientLogout } from "@/lib/client-logout"

const IDLE_MS = 5 * 60 * 1000
const THROTTLE_MS = 500

/**
 * Déconnecte l’utilisateur après {@link IDLE_MS} sans activité (souris, clavier, scroll, etc.).
 * Actif uniquement si un token est présent dans localStorage.
 */
export function IdleTimeout() {
  const router = useRouter()
  const pathname = usePathname()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const throttleRef = useRef(0)
  const loggingOutRef = useRef(false)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const runLogout = useCallback(async () => {
    if (loggingOutRef.current || !AuthService.isAuthenticated()) return
    loggingOutRef.current = true
    clearTimer()
    try {
      await clientLogout()
      dispatchAuthSessionChanged()
      try {
        sessionStorage.clear()
      } catch {
        /* ignore */
      }
      router.push("/login")
    } finally {
      loggingOutRef.current = false
    }
  }, [clearTimer, router])

  const scheduleIdle = useCallback(() => {
    if (!AuthService.isAuthenticated()) {
      clearTimer()
      return
    }
    const now = Date.now()
    if (now - throttleRef.current < THROTTLE_MS) return
    throttleRef.current = now

    clearTimer()
    timerRef.current = setTimeout(() => {
      void runLogout()
    }, IDLE_MS)
  }, [clearTimer, runLogout])

  useEffect(() => {
    const onActivity = () => scheduleIdle()
    const onSessionChanged = () => {
      if (AuthService.isAuthenticated()) scheduleIdle()
      else clearTimer()
    }

    if (AuthService.isAuthenticated()) scheduleIdle()
    else clearTimer()

    const events = ["mousedown", "keydown", "scroll", "touchstart", "click", "wheel"] as const
    events.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }))
    document.addEventListener("visibilitychange", onActivity)
    window.addEventListener(EBANKING_AUTH_SESSION_CHANGED, onSessionChanged)

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, onActivity))
      document.removeEventListener("visibilitychange", onActivity)
      window.removeEventListener(EBANKING_AUTH_SESSION_CHANGED, onSessionChanged)
      clearTimer()
    }
  }, [pathname, scheduleIdle, clearTimer])

  return null
}
