"use server"

import { cookies } from "next/headers"
import { setSecureCookie } from "@/lib/cookie-config"
import { config } from "@/lib/config"

const normalize = (u?: string) => (u ? u.replace(/\/$/, "") : "")
const API_BASE_URL = `${normalize(config.API_BASE_URL)}/api`
const TENANT_ID = String(config.TENANT_ID)

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
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${supportToken}`,
      "Content-Type": "application/json",
    },
  })

  if (res.status === 404 || res.status === 204) return null
  if (!res.ok) {
    const t = await res.text().catch(() => "")
    throw new Error(`Erreur récupération BdClientBng: ${t || res.status}`)
  }

  const payload = await safeJson(res)
  const rows = getRows(payload)
  return rows[0] ?? null
}

export async function completeSignup(token: string, password: string) {
  try {
    const cookieStore = await cookies()
    const pendingCookie = cookieStore.get("pending_signup_data")
    if (!pendingCookie) throw new Error("Session expirée. Recommence l'inscription.")

    const pending = JSON.parse(pendingCookie.value)
    if (pending.verificationToken !== token) {
      throw new Error("Token de vérification invalide")
    }

    const clientType = normalizeClientType(pending)

    // ============================================================
    // PREFLIGHT GET (support token)
    // ============================================================
    const supportToken = await getSupportToken()

    // USER duplicate (email)
    const users = await getAll(TENANT_USERS_ENDPOINT, supportToken)
    const emailLower = String(pending.email).trim().toLowerCase()
    if (users.some((u: any) => String(u.email || "").toLowerCase() === emailLower)) {
      throw new Error("Ce compte existe déjà. Veuillez vous connecter.")
    }

    // CLIENTS existing state (on ne crée jamais 2 fois)
    const clients = await getAll(CLIENT_ENDPOINT, supportToken)

    // existing: codeClient = numClient (BdClientBng)
    // new: codeClient = pending.codeClient
    const codeClient =
      clientType === "existing"
        ? String(pending.numClient || "").trim()
        : String(pending.codeClient || "").trim()

    if (clientType === "existing") {
      if (!codeClient || codeClient.startsWith("CLI-")) {
        throw new Error("Code client BNG invalide (numClient attendu depuis BdClientBng).")
      }
      // ⚠️ si déjà existant, on ne postera pas client plus tard
      // mais on ne bloque pas le process (car user n'existe pas encore)
      // => on garde l’info pour skip
    } else {
      // new: doublons stricts
      if (codeClient && clients.some((c: any) => String(c.codeClient || "").trim() === codeClient)) {
        throw new Error("Client déjà existant (codeClient)")
      }
      if (clients.some((c: any) => String(c.email || "").trim().toLowerCase() === emailLower)) {
        throw new Error("Client déjà existant (email)")
      }
    }

    // comptes duplicates (existing only)
    let comptesBng: any[] = []
    if (clientType === "existing") {
      const comptes = await getAll(COMPTE_ENDPOINT, supportToken)
      const existingAccountNumbers = new Set(
        comptes.map((c: any) => String(c.accountNumber || "").trim()).filter(Boolean),
      )

      const resBng = await fetch(
        `${COMPTE_BNG_ENDPOINT}?filter=clientId||$eq||${encodeURIComponent(codeClient)}`,
        { headers: { Authorization: `Bearer ${supportToken}` } },
      )
      if (!resBng.ok) {
        const t = await resBng.text().catch(() => "")
        throw new Error(`Erreur récupération CompteBng: ${t}`)
      }

      const bngPayload = await safeJson(resBng)
      comptesBng = getRows(bngPayload).filter(
        (c: any) => String(c.clientId || "").trim() === codeClient,
      )

      const duplicates = comptesBng
        .map((c: any) => String(c.numCompte || "").trim())
        .filter((n: string) => existingAccountNumbers.has(n))

      if (duplicates.length > 0) {
        throw new Error(`Compte(s) déjà existant(s): ${duplicates.join(", ")}`)
      }
    }

    // ============================================================
    // POST FLOW (aucun doublon user ; new client validé ; comptes validés)
    // ============================================================

    // SIGN-UP
    const signupRes = await fetch(`${API_BASE_URL}/auth/sign-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: pending.email, password, tenantId: TENANT_ID }),
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
    // ✅ CLIENT: créer UNE SEULE FOIS pour existing
    //    et payload doit venir de BdClientBng
    // ============================================================
    if (clientType === "existing") {
      // 1) Re-check post-signup si client existe déjà (codeClient) => si oui, on ne post pas
      const clientsAfter = await getAll(CLIENT_ENDPOINT, supportToken)
      const existingClient = clientsAfter.find((c: any) => String(c.codeClient || "").trim() === codeClient)

      if (!existingClient) {
        // 2) Récupérer BdClientBng (source de vérité)
        const bd = await fetchBdClientBngByNumClient(supportToken, codeClient)
        if (!bd) throw new Error("BdClientBng introuvable pour ce numClient (impossible de créer le client).")

        // 3) Construire payload *depuis BdClientBng* (et non pending)
        const clientBody = {
          data: {
            nomComplet: String(bd.nomComplet || bd.fullName || pending.fullName || pending.email),
            email: String(bd.email || pending.email),
            telephone: String(bd.telephone || bd.phone || pending.phone || ""),
            adresse: String(bd.adresse || bd.address || pending.address || ""),
            codeClient: codeClient,      // ✅ numClient BdClientBng
            userid: String(userId),      // ✅ lien au user créé
            clientType: "existing",
            verificationToken: token,
          },
        }

        const clientRes = await fetch(CLIENT_ENDPOINT, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(clientBody),
        })

        if (!clientRes.ok) {
          const t = await clientRes.text().catch(() => "")
          throw new Error(`Erreur création client (existing): ${t}`)
        }
      } else {
        // client existe déjà => on ne crée pas
        // optionnel: tu peux PATCH ici pour lier userid si ton API le supporte
        // mais tu n'as pas demandé, donc on skip.
      }
    } else {
      // NEW: créer client depuis pending (comme avant)
      const clientRes = await fetch(CLIENT_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            nomComplet: pending.fullName || pending.email,
            email: pending.email,
            telephone: pending.phone || "",
            adresse: pending.address || "",
            codeClient: String(pending.codeClient || "").trim(),
            userid: String(userId),
            clientType: "new",
            verificationToken: token,
          },
        }),
      })

      if (!clientRes.ok) {
        const t = await clientRes.text().catch(() => "")
        throw new Error(`Erreur création client (new): ${t}`)
      }
    }

    // ============================================================
    // COMPTES (existing)
    // ============================================================
    if (clientType === "existing") {
      for (const c of comptesBng) {
        const accountNumber = String(c.numCompte || "").trim()
        if (!accountNumber) continue

        const res = await fetch(COMPTE_ENDPOINT, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: {
              accountId: accountNumber,
              accountNumber,
              accountName: c.accountName || c.typeCompte || "Compte",
              currency: c.devise || "GNF",
              bookBalance: c.bookBalance || "0",
              availableBalance: c.availableBalance || "0",
              status: "ACTIF",
              type: c.typeCompte || "CURRENT",
              codeAgence: c.codeAgence || "001",
              clientId: String(userId), // comme ton modèle actuel
              codeBanque: c.codeBanque || "BNG",
              cleRib: c.cleRib || "00",
            },
          }),
        })

        if (!res.ok) {
          const t = await res.text().catch(() => "")
          throw new Error(`Erreur création compte ${accountNumber}: ${t}`)
        }
      }
    }

    await setSecureCookie("user", JSON.stringify(userData))
    cookieStore.delete("pending_signup_data")

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
