"use client"

import { getTabId as getStoredTabId } from "@/lib/auth-token-storage"

/** À passer aux server actions depuis les composants client. */
export function getTabId(): string {
  return getStoredTabId()
}
