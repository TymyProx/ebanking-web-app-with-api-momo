"use client"

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i)
  return bytes.buffer
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

export async function importAesGcmKeyFromBase64(base64Key: string): Promise<CryptoKey> {
  const raw = base64ToArrayBuffer(base64Key)
  return await crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"])
}

function concatArrayBuffers(a: ArrayBuffer, b: ArrayBuffer): ArrayBuffer {
  const ua = new Uint8Array(a)
  const ub = new Uint8Array(b)
  const out = new Uint8Array(ua.length + ub.length)
  out.set(ua, 0)
  out.set(ub, ua.length)
  return out.buffer
}

export async function decryptAesGcmFromJson(payload: any, key: CryptoKey): Promise<string> {
  // Accept stringified JSON
  if (typeof payload === "string") {
    try { payload = JSON.parse(payload) } catch { /* ignore */ }
  }
  const iv = new Uint8Array(base64ToArrayBuffer(payload.iv))
  let ctBuf = base64ToArrayBuffer(payload.ct)
  // If a separate GCM tag is provided (from Node crypto), append it to ciphertext for WebCrypto
  if (payload.tag) {
    const tagBuf = base64ToArrayBuffer(payload.tag)
    ctBuf = concatArrayBuffers(ctBuf, tagBuf)
  }
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ctBuf)
  return new TextDecoder().decode(decrypted)
}

export function isEncryptedJson(v: any): v is { iv: string; ct: string } {
  return v && typeof v === "object" && typeof v.iv === "string" && typeof v.ct === "string"
}


