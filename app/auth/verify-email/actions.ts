"use server"

import { cookies } from "next/headers"
import { setSecureCookie } from "@/lib/cookie-config"
import { getApiBaseUrl, TENANT_ID } from "@/lib/api-url"

const API_BASE_URL = getApiBaseUrl()

// Endpoints (adaptables)
const TENANT_USERS_ENDPOINT = `${API_BASE_URL}/tenant/${TENANT_ID}/tenantUsers`
const CLIENT_ENDPOINT = `${API_BASE_URL}/tenant/${TENANT_ID}/client`
const COMPTE_ENDPOINT = `${API_BASE_URL}/tenant/${TENANT_ID}/compte`
const COMPTE_BNG_ENDPOINT = `${API_BASE_URL}/tenant/${TENANT_ID}/compte-bng`

// ⚠️ IMPORTANT: adapte si ton endpoint BdClientBng a un autre nom
const BDCLIENT_BNG_ENDPOINT = `${API_BASE_URL}/tenant/${TENANT_ID}/bd-client-bng`

const safeJson = async (res: Response) => {
  const t = await res.text()
  try {
    return t ? JSON.parse(t) : null
  } catch {
    return null
  }
}

const getRows = (payload: any): any[] => {
  if (!payload) return []
  if (Array.isArray(payload.rows)) return payload.rows
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload.value)) return payload.value
  return []
}

const getAll = async (url: string, token: string) => {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (res.status === 204 || res.status === 404) return []
  if (!res.ok) {
    const t = await res.text().catch(() => "")
    throw new Error(`Erreur GET ${res.status} ${url}: ${t}`)
  }

  const payload = await safeJson(res)
  return getRows(payload)
}

const getSupportToken = async () => {
  const email = "support@proxyma-technologies.net"
  const password = "123"

  const res = await fetch(`${API_BASE_URL}/auth/sign-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, tenantId: TENANT_ID }),
  })

  if (!res.ok) {
    const t = await res.text().catch(() => "")
    throw new Error(`Connexion support impossible: ${t}`)
  }

  const txt = await res.text()
  const token = txt.startsWith("eyJ")
    ? txt
    : JSON.parse(txt)?.token || JSON.parse(txt)?.data?.token

  if (!token) throw new Error("Token support introuvable")
  return token as string
}

const normalizeClientType = (pending: any) => {
  const raw = String(pending?.clientType || "").toLowerCase().trim()
  if (raw === "existing" || raw === "new") return raw

  const numClient = String(pending?.numClient || "").trim()
  if (numClient && !numClient.startsWith("CLI-")) return "existing"

  return "new"
}

// BdClientBng fetch (payload de référence)
const fetchBdClientBngByNumClient = async (supportToken: string, numClient: string) => {
  const url = `${BDCLIENT_BNG_ENDPOINT}?filter=numClient||$eq||${encodeURIComponent(numClient)}`
  console.log("[fetchBdClientBng] Fetching URL:", url)
  console.log("[fetchBdClientBng] Searching for numClient:", numClient)
  
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${supportToken}`,
      "Content-Type": "application/json",
    },
  })

  if (res.status === 404 || res.status === 204) {
    console.log("[fetchBdClientBng] No results (404/204)")
    return null
  }
  
  if (!res.ok) {
    const t = await res.text().catch(() => "")
    console.error("[fetchBdClientBng] Error:", t)
    throw new Error(`Erreur récupération BdClientBng: ${t || res.status}`)
  }

  const payload = await safeJson(res)
  const rows = getRows(payload)
  
  console.log("[fetchBdClientBng] Total rows received:", rows.length)
  console.log("[fetchBdClientBng] Available numClients:", rows.map((r: any) => r.numClient))
  
  // ⚠️ IMPORTANT : Trouver la correspondance EXACTE avec le numClient recherché
  const searchCode = String(numClient).trim()
  const exactMatch = rows.find((row: any) => 
    String(row.numClient || "").trim() === searchCode
  )
  
  if (exactMatch) {
    console.log("[fetchBdClientBng] ✅ Exact match found:", exactMatch.numClient)
    console.log("[fetchBdClientBng] Client data:", {
      numClient: exactMatch.numClient,
      email: exactMatch.email,
      nomComplet: exactMatch.nomComplet || exactMatch.fullName
    })
    return exactMatch
  }
  
  console.log("[fetchBdClientBng] ❌ No exact match found for:", searchCode)
  return null
}

export async function completeSignup(token: string, password: string, email?: string) {
  try {
    const cookieStore = await cookies()
    const pendingCookie = cookieStore.get("pending_signup_data")
    
    let pending: any = null
    if (pendingCookie) {
      try {
        pending = JSON.parse(pendingCookie.value)
        // Vérifier que le token correspond si le cookie existe
        if (pending.verificationToken !== token) {
          throw new Error("Token de vérification invalide")
        }
      } catch (e) {
        // Si le cookie est invalide, continuer sans cookie
        console.log("[completeSignup] Cookie invalide, continuation avec token uniquement")
        pending = null
      }
    }

    // Si pas de cookie mais email fourni, permettre de continuer
    if (!pending && !email) {
      throw new Error("Email requis pour finaliser l'inscription")
    }

    // Utiliser les données du cookie si disponibles, sinon utiliser l'email fourni
    const signupEmail = pending?.email || email
    if (!signupEmail) {
      throw new Error("Email requis pour finaliser l'inscription")
    }

    const clientType = pending ? normalizeClientType(pending) : "new"

    // ============================================================
    // PREFLIGHT GET (support token)
    // ============================================================
    const supportToken = await getSupportToken()

    // Determine codeClient for compte fetching (existing clients only)
    const codeClient =
      clientType === "existing" && pending
        ? String(pending.numClient || "").trim()
        : ""

    if (clientType === "existing" && (!codeClient || codeClient.startsWith("CLI-"))) {
      throw new Error("Code client BNG invalide (numClient attendu depuis BdClientBng).")
    }

    // ============================================================
    // ✅ COMPTES: Will be created by backend during signup
    // ============================================================
    // The backend (AuthService.signup) will automatically create all accounts
    // for existing clients during the signup process. No need to check for duplicates
    // or create them manually here.

    // ============================================================
    // POST FLOW (aucun doublon user ; new client validé ; comptes validés)
    // ============================================================

    // SIGN-UP with extra client data
    const signupRes = await fetch(`${API_BASE_URL}/auth/sign-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: signupEmail, 
        password, 
        tenantId: TENANT_ID,
        // Extra client data (utiliser les données du cookie si disponibles, sinon valeurs par défaut)
        fullName: pending?.fullName || "",
        phone: pending?.phone || "",
        address: pending?.address || "",
        clientType: clientType,
        numClient: clientType === "existing" ? codeClient : undefined,
      }),
    })

    if (!signupRes.ok) {
      const t = await signupRes.text().catch(() => "")
      if (t.includes("already") || t.includes("exists")) {
        throw new Error("Ce compte existe déjà. Veuillez vous connecter.")
      }
      throw new Error(t)
    }

    const signupTxt = await signupRes.text()
    const authToken = signupTxt.startsWith("eyJ")
      ? signupTxt
      : JSON.parse(signupTxt)?.token || JSON.parse(signupTxt)?.data?.token

    if (!authToken) throw new Error("Token manquant après sign-up")

    // ME
    const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    if (!meRes.ok) throw new Error("Erreur récupération utilisateur")
    const userData = await meRes.json()
    const userId = userData.id
    if (!userId) throw new Error("userId introuvable")

    // ============================================================
    // ✅ CLIENT: Already created by backend during signup
    // ============================================================
    console.log("[completeSignup] Client automatically created by backend during signup")
    // The AuthService.signup method in the backend already creates the client
    // We don't need to create it manually here anymore

    // ============================================================
    // ✅ COMPTES: Already created by backend during signup
    // ============================================================
    console.log("[completeSignup] Comptes automatically created by backend during signup")
    // The AuthService.signup method in the backend already creates all accounts
    // for existing clients. We don't need to create them manually here anymore.
    // If accounts were not created by the backend, they will be created on next login
    // or can be manually created by the admin if needed.

    await setSecureCookie("user", JSON.stringify(userData))
    // Supprimer le cookie seulement s'il existe
    if (pendingCookie) {
      cookieStore.delete("pending_signup_data")
    }

    return {
      success: true,
      message: clientType === "existing"
        ? "Votre accès en ligne a été activé avec succès !"
        : "Votre compte a été créé avec succès !",
    }
  } catch (error: any) {
    console.error("[completeSignup]", error)
    return {
      success: false,
      message: error.message || "Une erreur est survenue",
    }
  }
}
