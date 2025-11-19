import crypto from "crypto"

export function encryptAesGcmNode(value: unknown, base64Key: string): { iv: string; ct: string; tag: string } {
  const key = Buffer.from(base64Key, "base64")
  if (key.length !== 32) {
    throw new Error("Invalid AES key: must be 32 bytes in base64")
  }
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
  const plaintext = typeof value === "string" ? value : JSON.stringify(value)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    iv: iv.toString("base64"),
    ct: encrypted.toString("base64"),
    tag: tag.toString("base64"),
  }
}

export function decryptAesGcmNode(
  encrypted: { iv: string; ct: string; tag: string },
  base64Key: string
): string {
  try {
    const key = Buffer.from(base64Key, "base64")
    if (key.length !== 32) {
      throw new Error("Invalid AES key: must be 32 bytes in base64")
    }
    
    const iv = Buffer.from(encrypted.iv, "base64")
    const ct = Buffer.from(encrypted.ct, "base64")
    const tag = Buffer.from(encrypted.tag, "base64")
    
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
    decipher.setAuthTag(tag)
    
    const decrypted = Buffer.concat([decipher.update(ct), decipher.final()])
    return decrypted.toString("utf8")
  } catch (error) {
    console.error("[v0] Decryption failed:", error)
    return ""
  }
}

export function stringifyEncrypted(obj: { iv: string; ct: string; tag: string; key_id?: string }) {
  return JSON.stringify(obj)
}
