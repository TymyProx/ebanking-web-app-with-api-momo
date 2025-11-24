"use server"
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
import { cookies } from "next/headers"
import { config } from "@/lib/config"

const normalize = (u?: string) => (u ? u.replace(/\/$/, "") : "")
const API_BASE_URL = `${normalize(config.API_BASE_URL)}/api`
const TENANT_ID = config.TENANT_ID

export interface Transaction {
  txnId: string
  accountId: string
  numCompte?: string
  txnType: "CREDIT" | "DEBIT"
  amount: string
  valueDate: string
  status: string
  description?: string
  referenceOperation?: string
  codeOperation?: string
  creditAccount?: string
  codeDevise?: string
  clientId?: string
}

/**
 * Récupère toutes les transactions liées aux comptes de l'utilisateur connecté
 */
export async function getUserTransactions(): Promise<{ success: boolean; data: Transaction[]; error?: string }> {
  const cookieToken = (await cookies()).get("token")?.value
  const usertoken = cookieToken

  if (!usertoken) {
    console.log("[v0] Token manquant")
    return { success: false, data: [], error: "Token d'authentification manquant" }
  }

  try {
    // 1. Récupérer l'ID de l'utilisateur connecté
    let currentUserId: string | null = null
    try {
      const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${usertoken}`,
        },
        next: { revalidate: 60 },
      })

      if (userResponse.ok) {
        const userData = await userResponse.json()
        currentUserId = userData.id
        console.log("[v0] User ID récupéré:", currentUserId)
      }
    } catch (error) {
      console.error("[v0] Erreur lors de la récupération de l'utilisateur:", error)
    }

    // 2. Récupérer les comptes de l'utilisateur
    let userAccountNumbers: string[] = []
    try {
      const accountsResponse = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/compte`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${usertoken}`,
        },
        next: { revalidate: 60 },
      })

      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json()
        let accounts = []

        // Gérer différents formats de réponse
        if (accountsData.rows && Array.isArray(accountsData.rows)) {
          accounts = accountsData.rows
        } else if (accountsData.data) {
          accounts = Array.isArray(accountsData.data) ? accountsData.data : [accountsData.data]
        } else if (Array.isArray(accountsData)) {
          accounts = accountsData
        }

        // Filtrer par clientId si disponible
        if (currentUserId) {
          accounts = accounts.filter((acc: any) => acc.clientId === currentUserId)
        }

        // Extraire les numéros de compte
        userAccountNumbers = accounts
          .map((acc: any) => acc.accountNumber || acc.numCompte || acc.accountId)
          .filter(Boolean)

        console.log("[v0] Numéros de compte de l'utilisateur:", userAccountNumbers)
      }
    } catch (error) {
      console.error("[v0] Erreur lors de la récupération des comptes:", error)
    }

    // 3. Récupérer toutes les transactions
    const transactionsResponse = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/transactions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usertoken}`,
      },
      cache: "no-store",
    })

    if (!transactionsResponse.ok) {
      console.error("[v0] Erreur API transactions:", transactionsResponse.status, transactionsResponse.statusText)
      return { success: false, data: [], error: `Erreur API: ${transactionsResponse.status}` }
    }

    const transactionsData = await transactionsResponse.json()

    // Gérer différents formats de réponse
    let allTransactions: Transaction[] = []
    if (Array.isArray(transactionsData.content)) {
      allTransactions = transactionsData.content
    } else if (Array.isArray(transactionsData.rows)) {
      allTransactions = transactionsData.rows
    } else if (Array.isArray(transactionsData)) {
      allTransactions = transactionsData
    } else if (transactionsData.data) {
      allTransactions = Array.isArray(transactionsData.data) ? transactionsData.data : [transactionsData.data]
    }

    console.log("[v0] Total transactions récupérées:", allTransactions.length)

    // 4. Filtrer les transactions par comptes de l'utilisateur
    let userTransactions = allTransactions

    // Filtrer par clientId si disponible
    if (currentUserId) {
      userTransactions = userTransactions.filter((txn: any) => txn.clientId === currentUserId)
    }

    // Filtrer également par numéro de compte si disponible
    if (userAccountNumbers.length > 0) {
      userTransactions = userTransactions.filter((txn: any) => {
        const txnAccountNumber = txn.numCompte || txn.accountNumber || txn.accountId
        return userAccountNumbers.includes(txnAccountNumber)
      })
    }

    console.log("[v0] Transactions filtrées pour l'utilisateur:", userTransactions.length)

    // 5. Trier par date (plus récent en premier)
    const sortedTransactions = userTransactions.sort((a: any, b: any) => {
      const dateA = new Date(a.valueDate || a.createdAt || 0).getTime()
      const dateB = new Date(b.valueDate || b.createdAt || 0).getTime()
      return dateB - dateA // Ordre décroissant
    })

    return {
      success: true,
      data: sortedTransactions,
    }
  } catch (error) {
    console.error("[v0] Erreur lors de la récupération des transactions:", error)
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Erreur inconnue",
    }
  }
}
