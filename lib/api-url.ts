import { config } from "@/lib/config"

/**
 * Normalize and build API URL
 * Ensures /api is added only once, even if config.API_BASE_URL already contains it
 */
export function getApiBaseUrl(): string {
  const normalize = (u?: string) => (u ? u.replace(/\/$/, "") : "")
  // Remove trailing /api if it exists, then add it once
  const cleanBaseUrl = normalize(config.API_BASE_URL).replace(/\/api$/, "")
  return `${cleanBaseUrl}/api`
}

export const TENANT_ID = config.TENANT_ID

