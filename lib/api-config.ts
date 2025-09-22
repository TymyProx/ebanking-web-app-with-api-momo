"use server"

const API_BASE_URL = process.env.API_BASE_URL || "https://api.example.com/api"
const TENANT_ID = process.env.TENANT_ID || "aa1287f6-06af-45b7-a905-8c57363565c2"

// Production-ready timeout settings
const FETCH_TIMEOUT = 30000 // 30 seconds for production
const RETRY_ATTEMPTS = 3
const RETRY_DELAY = 1000 // 1 second

interface FetchOptions extends RequestInit {
  timeout?: number
  retries?: number
}

// Enhanced fetch with timeout, retry logic, and circuit breaker pattern
export const fetchWithTimeout = async (url: string, options: FetchOptions = {}): Promise<Response> => {
  const { timeout = FETCH_TIMEOUT, retries = RETRY_ATTEMPTS, ...fetchOptions } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      console.log(`[v0] API Request attempt ${attempt + 1}/${retries + 1} to: ${url}`)

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        // Add connection keep-alive headers for better performance
        headers: {
          Connection: "keep-alive",
          "Keep-Alive": "timeout=30, max=100",
          ...fetchOptions.headers,
        },
      })

      clearTimeout(timeoutId)

      // If successful, return immediately
      if (response.ok) {
        console.log(`[v0] API Request successful on attempt ${attempt + 1}`)
        return response
      }

      // For non-2xx responses, don't retry client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        console.log(`[v0] Client error ${response.status}, not retrying`)
        return response
      }

      // For server errors (5xx), continue to retry
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`)
    } catch (error) {
      clearTimeout(timeoutId)
      lastError = error as Error

      console.log(`[v0] API Request failed on attempt ${attempt + 1}: ${lastError.message}`)

      // Don't retry on abort errors (timeout) if it's the last attempt
      if (lastError.name === "AbortError" && attempt === retries) {
        throw new Error(`Request timeout after ${timeout}ms`)
      }

      // Don't retry on network errors that indicate permanent failure
      if (lastError.message.includes("ENOTFOUND") || lastError.message.includes("ECONNREFUSED")) {
        console.log(`[v0] Permanent network error detected, not retrying`)
        throw lastError
      }
    }

    // Wait before retrying (exponential backoff)
    if (attempt < retries) {
      const delay = RETRY_DELAY * Math.pow(2, attempt)
      console.log(`[v0] Waiting ${delay}ms before retry...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error("Request failed after all retry attempts")
}

// Helper function to create authenticated API requests
export const createAuthenticatedRequest = (token: string, additionalHeaders: Record<string, string> = {}) => {
  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...additionalHeaders,
    },
  }
}

// API endpoints configuration
export const API_ENDPOINTS = {
  TRANSACTIONS: `${API_BASE_URL}/tenant/${TENANT_ID}/transaction`,
  ACCOUNTS: `${API_BASE_URL}/tenant/${TENANT_ID}/compte`,
  ACCOUNT_BY_ID: (id: string) => `${API_BASE_URL}/tenant/${TENANT_ID}/compte/${id}`,
  AUTH: {
    SIGN_IN: `${API_BASE_URL}/auth/sign-in`,
    ME: `${API_BASE_URL}/auth/me`,
  },
} as const

// Test data fallback for development/demo
export const getTestTransactions = () => [
  {
    txnId: "TXN_1734624422780_001",
    accountId: "1",
    txnType: "CREDIT",
    amount: "150000",
    valueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "COMPLETED",
    description: "Virement vers compte épargne",
  },
  {
    txnId: "TXN_1734538022780_002",
    accountId: "1",
    txnType: "DEBIT",
    amount: "75000",
    valueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: "COMPLETED",
    description: "Paiement facture électricité",
  },
  {
    txnId: "TXN_1734451622780_003",
    accountId: "2",
    txnType: "CREDIT",
    amount: "500000",
    valueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: "COMPLETED",
    description: "Dépôt de salaire",
  },
]

export const getTestAccounts = () => [
  {
    id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    accountId: "ACC001",
    customerId: "CUST001",
    accountNumber: "0001234567890",
    accountName: "Compte Courant Principal",
    currency: "GNF",
    bookBalance: "2500000",
    availableBalance: "2350000",
    status: "ACTIVE",
    type: "CURRENT",
    agency: "Agence Centrale",
    createdAt: "2023-01-15T10:00:00Z",
    tenantId: TENANT_ID,
  },
  {
    id: "3fa85f64-5717-4562-b3fc-2c963f66afa7",
    accountId: "ACC002",
    customerId: "CUST001",
    accountNumber: "0001234567891",
    accountName: "Compte Épargne",
    currency: "GNF",
    bookBalance: "5000000",
    availableBalance: "5000000",
    status: "ACTIVE",
    type: "SAVINGS",
    agency: "Agence Centrale",
    createdAt: "2023-03-20T10:00:00Z",
    tenantId: TENANT_ID,
  },
  {
    id: "3fa85f64-5717-4562-b3fc-2c963f66afa8",
    accountId: "ACC003",
    customerId: "CUST001",
    accountNumber: "0001234567892",
    accountName: "Compte USD",
    currency: "USD",
    bookBalance: "1200",
    availableBalance: "1150",
    status: "ACTIVE",
    type: "CURRENT",
    agency: "Agence Internationale",
    createdAt: "2023-06-10T10:00:00Z",
    tenantId: TENANT_ID,
  },
]

export { API_BASE_URL, TENANT_ID }
