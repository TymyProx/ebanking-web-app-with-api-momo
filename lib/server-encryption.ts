"use server"

import { encryptAesGcmToJson, importAesGcmKeyFromBase64, decryptAesGcmFromJson, isEncryptedJson } from "./crypto"

export async function decryptDataServer(data: Record<string, any>): Promise<Record<string, any>> {
  const secureMode = (process.env.NEXT_PUBLIC_PORTAL_SECURE_MODE || "false").toLowerCase() === "true"
  const keyB64 = process.env.PORTAL_KEY_B64 || ""

  if (!secureMode || !keyB64) {
    return data
  }

  try {
    const key = await importAesGcmKeyFromBase64(keyB64)
    const decrypted: Record<string, any> = { ...data }

    for (const [fieldName, value] of Object.entries(data)) {
      if (fieldName.endsWith("_json") && isEncryptedJson(value)) {
        try {
          const originalField = fieldName.replace(/_json$/, "")
          decrypted[originalField] = await decryptAesGcmFromJson(value, key)
          delete decrypted[fieldName]
        } catch (error) {
          console.error(`[v0] Failed to decrypt field ${fieldName}:`, error)
        }
      } else if (isEncryptedJson(value)) {
        try {
          decrypted[fieldName] = await decryptAesGcmFromJson(value, key)
        } catch (error) {
          console.error(`[v0] Failed to decrypt field ${fieldName}:`, error)
        }
      }
    }

    return decrypted
  } catch (error) {
    console.error("[v0] Server decryption error:", error)
    return data
  }
}

export async function encryptDataServer(data: Record<string, any>): Promise<Record<string, any>> {
  const secureMode = (process.env.NEXT_PUBLIC_PORTAL_SECURE_MODE || "false").toLowerCase() === "true"
  const keyB64 = process.env.PORTAL_KEY_B64 || ""
  const keyId = process.env.PORTAL_KEY_ID || "k1-mobile-v1"

  if (!secureMode || !keyB64) {
    return data
  }

  try {
    const key = await importAesGcmKeyFromBase64(keyB64)
    const encrypted: Record<string, any> = {}

    for (const [fieldName, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        encrypted[`${fieldName}_json`] = await encryptAesGcmToJson(String(value), key)
      }
    }

    encrypted.key_id = keyId
    return encrypted
  } catch (error) {
    console.error("[v0] Server encryption error:", error)
    throw new Error("Encryption failed")
  }
}

export async function getEncryptionConfig() {
  return {
    secureMode: (process.env.NEXT_PUBLIC_PORTAL_SECURE_MODE || "false").toLowerCase() === "true",
    keyId: process.env.PORTAL_KEY_ID || "k1-mobile-v1",
  }
}
