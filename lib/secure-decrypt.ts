import { cookies } from "next/headers"
import { config } from "@/lib/config"

// Server-only decryption utilities - never expose encryption keys to client
const normalize = (u?: string) => (u ? u.replace(/\/$/, "") : "")
const API_BASE_URL = `${normalize(config.API_BASE_URL)}/api`
const TENANT_ID = config.TENANT_ID

/**
 * Import AES-GCM key from base64 string (Node.js)
 */
function importAesGcmKeyFromBase64Node(base64Key: string): Buffer {
  return Buffer.from(base64Key, "base64")
}

/**
 * Decrypt AES-GCM encrypted data from JSON format (Node.js)
 */
function decryptAesGcmFromJsonNode(
  payload: { iv: string; ct: string; tag?: string },
  keyBuffer: Buffer
): string {
  const crypto = require("crypto")
  
  const iv = Buffer.from(payload.iv, "base64")
  const ciphertext = Buffer.from(payload.ct, "base64")
  const tag = payload.tag ? Buffer.from(payload.tag, "base64") : undefined

  const decipher = crypto.createDecipheriv("aes-256-gcm", keyBuffer, iv)
  if (tag) {
    decipher.setAuthTag(tag)
  }

  let decrypted = decipher.update(ciphertext, undefined, "utf8")
  decrypted += decipher.final("utf8")
  
  return decrypted
}

/**
 * Check if a value is encrypted JSON
 */
export function isEncryptedJson(v: any): v is { iv: string; ct: string } {
  return v && typeof v === "object" && typeof v.iv === "string" && typeof v.ct === "string"
}

/**
 * Decrypt a single field value (server-side only)
 */
export async function decryptField(encryptedValue: any): Promise<string> {
  "use server"
  
  if (!encryptedValue) return ""
  
  const secureMode = (process.env.PORTAL_SECURE_MODE || "false").toLowerCase() === "true"
  if (!secureMode) {
    // If not in secure mode, return as string
    return typeof encryptedValue === "string" ? encryptedValue : JSON.stringify(encryptedValue)
  }

  const keyB64 = process.env.PORTAL_KEY_B64 || ""
  if (!keyB64) {
    console.warn("[secure-decrypt] PORTAL_KEY_B64 environment variable not set")
    return typeof encryptedValue === "string" ? encryptedValue : "[encrypted]"
  }

  try {
    const keyBuffer = importAesGcmKeyFromBase64Node(keyB64)
    
    // Handle stringified JSON
    let payload = encryptedValue
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload)
      } catch {
        return encryptedValue
      }
    }

    if (isEncryptedJson(payload)) {
      return decryptAesGcmFromJsonNode(payload, keyBuffer)
    }

    return typeof encryptedValue === "string" ? encryptedValue : JSON.stringify(encryptedValue)
  } catch (error) {
    console.error("[secure-decrypt] Decryption error:", error)
    return "[decryption failed]"
  }
}

/**
 * Decrypt card data on server-side
 */
export async function decryptCards(encryptedCards: any[]): Promise<any[]> {
  "use server"
  
  const secureMode = (process.env.PORTAL_SECURE_MODE || "false").toLowerCase() === "true"
  if (!secureMode) return encryptedCards

  const keyB64 = process.env.PORTAL_KEY_B64 || ""
  if (!keyB64) {
    console.warn("[secure-decrypt] PORTAL_KEY_B64 environment variable not set")
    return encryptedCards
  }

  try {
    const keyBuffer = importAesGcmKeyFromBase64Node(keyB64)

    return await Promise.all(
      encryptedCards.map(async (card: any) => {
        const decrypted: any = { ...card }

        const fieldsToDecrypt = ["numCard", "accountNumber", "typCard", "status", "dateEmission", "dateExpiration"]

        for (const field of fieldsToDecrypt) {
          if (decrypted[field] && isEncryptedJson(decrypted[field])) {
            try {
              decrypted[field] = decryptAesGcmFromJsonNode(decrypted[field], keyBuffer)
            } catch (err) {
              console.error(`[secure-decrypt] Failed to decrypt ${field}:`, err)
            }
          }
        }

        // Ensure fields are strings
        for (const field of fieldsToDecrypt) {
          decrypted[field] = typeof decrypted[field] === "string" ? decrypted[field] : ""
        }

        return decrypted
      })
    )
  } catch (error) {
    console.error("[secure-decrypt] Card decryption error:", error)
    return encryptedCards
  }
}

/**
 * Decrypt beneficiary data on server-side
 */
export async function decryptBeneficiaries(encryptedBeneficiaries: any[]): Promise<any[]> {
  "use server"
  
  const secureMode = (process.env.PORTAL_SECURE_MODE || "false").toLowerCase() === "true"
  if (!secureMode) return encryptedBeneficiaries

  const keyB64 = process.env.PORTAL_KEY_B64 || ""
  if (!keyB64) {
    console.warn("[secure-decrypt] PORTAL_KEY_B64 environment variable not set")
    return encryptedBeneficiaries
  }

  try {
    const keyBuffer = importAesGcmKeyFromBase64Node(keyB64)

    return await Promise.all(
      encryptedBeneficiaries.map(async (beneficiary: any) => {
        const decrypted: any = { ...beneficiary }

        const resolveField = async (value: any, fallback?: any): Promise<string> => {
          const candidate = value ?? fallback
          if (candidate === null || candidate === undefined) return ""

          // Try to decrypt if it's encrypted JSON
          if (isEncryptedJson(candidate)) {
            try {
              return decryptAesGcmFromJsonNode(candidate, keyBuffer)
            } catch (err) {
              // Try parsing if it's a stringified JSON
              if (typeof candidate === "string") {
                try {
                  const parsed = JSON.parse(candidate)
                  if (isEncryptedJson(parsed)) {
                    return decryptAesGcmFromJsonNode(parsed, keyBuffer)
                  }
                } catch {
                  // Not parseable
                }
              }
              return "[encrypted data]"
            }
          }

          if (typeof candidate === "string") return candidate

          try {
            return JSON.stringify(candidate)
          } catch {
            return String(candidate)
          }
        }

        decrypted.name = await resolveField(decrypted.name, decrypted.name_json)
        decrypted.accountNumber = await resolveField(decrypted.accountNumber, decrypted.accountNumber_json)
        decrypted.bankName = await resolveField(decrypted.bankName, decrypted.bankName_json)
        decrypted.bankCode = await resolveField(decrypted.bankCode, decrypted.bankCode_json)
        decrypted.codagence = await resolveField(decrypted.codagence, decrypted.codagence_json)
        decrypted.clerib = await resolveField(decrypted.clerib, decrypted.clerib_json)

        return decrypted
      })
    )
  } catch (error) {
    console.error("[secure-decrypt] Beneficiary decryption error:", error)
    return encryptedBeneficiaries
  }
}
