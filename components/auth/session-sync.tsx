"use client"



import { useCallback, useEffect } from "react"

import { usePathname } from "next/navigation"

import {

  clearAuthStorage,

  getAuthToken,

  getTabId,

  isSessionLoginFresh,

  markSessionEvicted,

  subscribeAuthBroadcast,

  validateSessionWithServer,

  type AuthBroadcastMessage,

} from "@/lib/auth-token-storage"



const HEARTBEAT_MS = 20_000



function isAuthPath(pathname: string | null): boolean {

  return (

    !!pathname?.startsWith("/login") ||

    !!pathname?.startsWith("/signup") ||

    !!pathname?.startsWith("/auth/")

  )

}



async function clearTabServerCookies() {

  try {

    await fetch("/api/auth/clear-session", {

      method: "POST",

      credentials: "include",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ tabId: getTabId() }),

    })

  } catch {

    // ignore

  }

}



function forceLogoutToLogin(reason: "session_replaced" | "session_expired") {

  markSessionEvicted()

  clearAuthStorage({ broadcast: false })

  void clearTabServerCookies()



  const params = new URLSearchParams()

  params.set("reason", reason)

  if (typeof window !== "undefined") {

    params.set("redirect", window.location.pathname + window.location.search)

  }

  window.location.href = `/login?${params.toString()}`

}



function handleSessionEvent(message: AuthBroadcastMessage, pathname: string | null) {

  if (message.type === "SESSION_REPLACED") {

    if (isAuthPath(pathname) && !getAuthToken()) return

    forceLogoutToLogin("session_replaced")

    return

  }



  if (message.type === "SESSION_SIGNED_OUT") {

    if (isAuthPath(pathname) && !getAuthToken()) return

    markSessionEvicted()

    clearAuthStorage({ broadcast: false })

    void clearTabServerCookies()

    window.location.href = "/login"

  }

}



export function SessionSync() {

  const pathname = usePathname()



  const checkSession = useCallback(async () => {

    if (isAuthPath(pathname)) return

    if (!getAuthToken()) return

    if (isSessionLoginFresh()) return



    const alive = await validateSessionWithServer()

    if (!alive) {

      forceLogoutToLogin("session_expired")

    }

  }, [pathname])



  useEffect(() => {

    return subscribeAuthBroadcast((message) => handleSessionEvent(message, pathname))

  }, [pathname])



  useEffect(() => {

    void checkSession()



    const interval = setInterval(() => {

      void checkSession()

    }, HEARTBEAT_MS)



    const onVisible = () => {

      if (document.visibilityState === "visible") {

        void checkSession()

      }

    }



    document.addEventListener("visibilitychange", onVisible)

    return () => {

      clearInterval(interval)

      document.removeEventListener("visibilitychange", onVisible)

    }

  }, [checkSession])



  return null

}


