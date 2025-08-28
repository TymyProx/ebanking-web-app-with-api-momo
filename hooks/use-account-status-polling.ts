"use client"

import { useEffect, useRef } from "react"
import { getAccounts } from "@/app/accounts/actions"
import { useNotifications } from "@/contexts/notification-context"

interface Account {
  id: string
  name: string
  number: string
  status: string
}

export function useAccountStatusPolling(accounts: Account[], enabled = true) {
  const { addNotification } = useNotifications()
  const previousStatusesRef = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    if (!enabled || accounts.length === 0) return

    // Initialize previous statuses
    accounts.forEach((account) => {
      previousStatusesRef.current.set(account.id, account.status)
    })

    const pollForStatusChanges = async () => {
      try {
        const accountsData = await getAccounts()

        if (Array.isArray(accountsData)) {
          accountsData.forEach((account: any) => {
            const accountId = account.id || account.accountId
            const currentStatus = account.status
            const previousStatus = previousStatusesRef.current.get(accountId)

            if (previousStatus && previousStatus !== currentStatus) {
              // Status changed, add notification
              addNotification({
                type: "account_status",
                title: "Changement de statut de compte",
                message: `Le statut de votre compte ${account.accountName || account.name} (${account.accountNumber}) a été modifié de "${previousStatus}" vers "${currentStatus}".`,
                timestamp: new Date(),
                isRead: false,
              })

              console.log("[v0] Changement de statut détecté:", { accountId, previousStatus, currentStatus })
            }

            // Update previous status
            previousStatusesRef.current.set(accountId, currentStatus)
          })
        }
      } catch (error) {
        console.error("[v0] Erreur lors de la vérification des statuts:", error)
      }
    }

    // Poll every 30 seconds
    const interval = setInterval(pollForStatusChanges, 30000)

    return () => clearInterval(interval)
  }, [accounts, enabled, addNotification])
}
