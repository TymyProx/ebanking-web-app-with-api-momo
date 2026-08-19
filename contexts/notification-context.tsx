"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { fetchUserNotifications, type NotificationItem } from "@/app/notifications/actions"
import { getCurrentUser } from "@/app/user/actions"
import { EBANKING_AUTH_SESSION_CHANGED } from "@/lib/auth-events"

export interface Notification extends NotificationItem {
  read: boolean
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  getRecentNotifications: (limit?: number) => Notification[]
  refresh: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

/** Clé localStorage par utilisateur connecté (évite de mélanger « lus » entre comptes). */
const readStorageKeyForUser = (userId: string) => `notification_read_ids:${userId}`

/** Rafraîchissement régulier (audit comptes / statuts demandes d’ouverture, etc.). */
const POLL_INTERVAL = 45_000

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  /** Incrémenté à la connexion / déconnexion pour forcer resync user + notifications. */
  const [authSessionVersion, setAuthSessionVersion] = useState(0)
  const readStorageKeyRef = useRef<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const getReadIds = useCallback((): Set<string> => {
    const key = readStorageKeyRef.current
    if (!key) return new Set()
    try {
      const stored = localStorage.getItem(key)
      if (stored) return new Set(JSON.parse(stored))
    } catch {}
    return new Set()
  }, [])

  const saveReadIds = useCallback((ids: Set<string>) => {
    const key = readStorageKeyRef.current
    if (!key) return
    try {
      const arr = [...ids].slice(-500)
      localStorage.setItem(key, JSON.stringify(arr))
    } catch {}
  }, [])

  /**
   * Met à jour la clé « lus » selon l’utilisateur courant, puis charge les notifications (cookie token).
   * Sans spinner — utilisé au focus, polling, et en interne après auth.
   */
  const silentReload = useCallback(async () => {
    try {
      const u = await getCurrentUser()
      if (!mountedRef.current) return
      readStorageKeyRef.current = u?.id ? readStorageKeyForUser(String(u.id)) : null

      const items = await fetchUserNotifications()
      if (!mountedRef.current) return

      const readIds = getReadIds()
      const withRead = items.map((n) => ({ ...n, read: readIds.has(n.id) }))
      setNotifications(withRead)
      setUnreadCount(withRead.filter((n) => !n.read).length)
    } catch {
      if (!mountedRef.current) return
      setNotifications([])
      setUnreadCount(0)
    }
  }, [getReadIds])

  useEffect(() => {
    const bump = () => setAuthSessionVersion((v) => v + 1)
    window.addEventListener(EBANKING_AUTH_SESSION_CHANGED, bump)
    return () => window.removeEventListener(EBANKING_AUTH_SESSION_CHANGED, bump)
  }, [])

  /** Connexion / déconnexion / premier rendu : resync avec indicateur de chargement. */
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        await silentReload()
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [authSessionVersion, silentReload])

  useEffect(() => {
    const id = setInterval(() => void silentReload(), POLL_INTERVAL)
    return () => clearInterval(id)
  }, [silentReload])

  useEffect(() => {
    const onFocus = () => void silentReload()
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [silentReload])

  const markAsRead = useCallback(
    (notificationId: string) => {
      const readIds = getReadIds()
      readIds.add(notificationId)
      saveReadIds(readIds)

      setNotifications((prev) => {
        const updated = prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        setUnreadCount(updated.filter((n) => !n.read).length)
        return updated
      })
    },
    [getReadIds, saveReadIds],
  )

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const readIds = getReadIds()
      prev.forEach((n) => readIds.add(n.id))
      saveReadIds(readIds)
      setUnreadCount(0)
      return prev.map((n) => ({ ...n, read: true }))
    })
  }, [getReadIds, saveReadIds])

  const getRecentNotifications = useCallback(
    (limit = 5) => notifications.slice(0, limit),
    [notifications],
  )

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      await silentReload()
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [silentReload])

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, markAsRead, markAllAsRead, getRecentNotifications, refresh }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
