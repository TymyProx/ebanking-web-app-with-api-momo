import { cookies } from "next/headers"

export interface CookieOptions {
  httpOnly?: boolean
  secure?: boolean
  sameSite?: "lax" | "strict" | "none"
  maxAge?: number
  path?: string
  domain?: string
}

/**
 * Get cookie configuration for production and development
 */
export function getCookieConfig(): CookieOptions {
  const isProduction = process.env.NODE_ENV === "production"

  const config: CookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  }

  // In production, set the domain if NEXT_PUBLIC_EBANKING_URL is defined
  if (isProduction && process.env.NEXT_PUBLIC_EBANKING_URL) {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_EBANKING_URL)
      // Extract domain (e.g., vercel.app from proxyma1-bngebanking.vercel.app)
      const hostname = url.hostname
      const parts = hostname.split(".")

      // If it's a subdomain (e.g., xxx.vercel.app), use the parent domain
      if (parts.length > 2) {
        config.domain = `.${parts.slice(-2).join(".")}`
      } else {
        config.domain = hostname
      }
    } catch (error) {
      console.error("[v0] Failed to parse NEXT_PUBLIC_EBANKING_URL for cookie domain:", error)
    }
  }

  return config
}

/**
 * Set a cookie with proper configuration
 */
export async function setSecureCookie(name: string, value: string, options?: Partial<CookieOptions>) {
  const cookieStore = await cookies()
  const config = getCookieConfig()

  cookieStore.set(name, value, {
    ...config,
    ...options,
  })
}

/**
 * Get a cookie value
 */
export async function getSecureCookie(name: string): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(name)?.value
}

/**
 * Delete a cookie
 */
export async function deleteSecureCookie(name: string) {
  const cookieStore = await cookies()
  cookieStore.delete(name)
}
