/**
 * Utility to safely render potentially encrypted data
 * Prevents "Objects are not valid as a React child" errors
 */

export function safeString(value: any): string {
  // If null or undefined, return empty string
  if (value === null || value === undefined) {
    return ""
  }

  // If it's already a string or number, return it as string
  if (typeof value === "string" || typeof value === "number") {
    return String(value)
  }

  // If it's an encrypted object with ct, iv, tag, key_id
  if (typeof value === "object" && "ct" in value && "iv" in value && "tag" in value) {
    console.warn("[v0] Encrypted object detected in render, data not decrypted properly:", value)
    return "[Données chiffrées]"
  }

  // For any other object, try to stringify
  if (typeof value === "object") {
    try {
      return JSON.stringify(value)
    } catch {
      return "[Objet complexe]"
    }
  }

  return String(value)
}

export function isSafeToRender(value: any): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return true
  if (typeof value === "object" && "ct" in value) return false
  return true
}
