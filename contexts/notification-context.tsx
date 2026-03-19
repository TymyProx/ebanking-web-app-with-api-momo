"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { fetchUserNotifications, type NotificationItem } from "@/app/notifications/actions"

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

const READ_IDS_KEY = "notification_read_ids"
const POLL_INTERVAL = 60_000

function getReadIds(): Set<string> {
  try {
    const stored = localStorage.getItem(READ_IDS_KEY)
    if (stored) return new Set(JSON.parse(stored))
  } catch {}
  return new Set()
}

function saveReadIds(ids: Set<string>) {
  try {
    const arr = [...ids].slice(-500)
    localStorage.setItem(READ_IDS_KEY, JSON.stringify(arr))
  } catch {}
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useRef(true)

  const loadNotifications = useCallback(async () => {
    try {
      const items = await fetchUserNotifications()
      if (!mountedRef.current) return
      const readIds = getReadIds()
      const withRead = items.map((n) => ({ ...n, read: readIds.has(n.id) }))
      setNotifications(withRead)
      setUnreadCount(withRead.filter((n) => !n.read).length)
    } catch {
      // silently fail – keep previous notifications
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    loadNotifications()
    return () => { mountedRef.current = false }
  }, [loadNotifications])

  useEffect(() => {
    intervalRef.current = setInterval(loadNotifications, POLL_INTERVAL)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [loadNotifications])

  useEffect(() => {
    const onFocus = () => loadNotifications()
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [loadNotifications])

  const markAsRead = useCallback((notificationId: string) => {
    const readIds = getReadIds()
    readIds.add(notificationId)
    saveReadIds(readIds)

    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      setUnreadCount(updated.filter((n) => !n.read).length)
      return updated
    })
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const readIds = getReadIds()
      prev.forEach((n) => readIds.add(n.id))
      saveReadIds(readIds)
      setUnreadCount(0)
      return prev.map((n) => ({ ...n, read: true }))
    })
  }, [])

  const getRecentNotifications = useCallback(
    (limit = 5) => notifications.slice(0, limit),
    [notifications],
  )

  const refresh = useCallback(async () => {
    setLoading(true)
    await loadNotifications()
  }, [loadNotifications])

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
