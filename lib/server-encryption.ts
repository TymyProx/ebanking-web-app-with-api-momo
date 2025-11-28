"use server"

import { encryptAesGcmToJson, importAesGcmKeyFromBase64 } from "./crypto"

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
