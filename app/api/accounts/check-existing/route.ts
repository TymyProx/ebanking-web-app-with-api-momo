import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getApiBaseUrl, TENANT_ID } from "@/lib/api-url"

const API_BASE_URL = getApiBaseUrl()

export async function GET() {
  try {
    const cookieToken = (await cookies()).get("token")?.value

    if (!cookieToken) {
      return NextResponse.json({ hasActiveAccounts: false })
    }

    // Get current user ID
    const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookieToken}`,
      },
    })

    if (!userResponse.ok) {
      return NextResponse.json({ hasActiveAccounts: false })
    }

    const userData = await userResponse.json()
    const currentUserId = userData.id

    // Get user accounts
    const accountsResponse = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/compte`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookieToken}`,
      },
    })

    if (!accountsResponse.ok) {
      return NextResponse.json({ hasActiveAccounts: false })
    }

    const accountsData = await accountsResponse.json()
    
    let accounts = []
    if (accountsData.rows && Array.isArray(accountsData.rows)) {
      accounts = accountsData.rows
    } else if (accountsData.data) {
      if (Array.isArray(accountsData.data)) {
        accounts = accountsData.data
      } else if (typeof accountsData.data === "object") {
        accounts = [accountsData.data]
      }
    } else if (Array.isArray(accountsData)) {
      accounts = accountsData
    }

    // Filter by current user and active status
    const userActiveAccounts = accounts.filter(
      (account: any) => 
        account.clientId === currentUserId && 
        (account.status === "ACTIF" || account.status === "ACTIVE")
    )

    return NextResponse.json({ 
      hasActiveAccounts: userActiveAccounts.length > 0,
      accountCount: userActiveAccounts.length 
    })
  } catch (error) {
    console.error("Error checking existing accounts:", error)
    return NextResponse.json({ hasActiveAccounts: false })
  }
}
