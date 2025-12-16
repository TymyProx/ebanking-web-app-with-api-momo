"use server"

import { cookies } from "next/headers"
import { setSecureCookie } from "@/lib/cookie-config"
import { config } from "@/lib/config"

const normalize = (u?: string) => (u ? u.replace(/\/$/, "") : "")
const API_BASE_URL = `${normalize(config.API_BASE_URL)}/api`
const TENANT_ID = config.TENANT_ID

const safeJson = async (res: Response) => {
  const t = await res.text()
  try {
    return t ? JSON.parse(t) : null
  } catch {
    return t
  }
}

const normalizeClientType = (pendingData: any) => {
  // 1) si le front a déjà mis "existing"/"new"
  const raw = String(pendingData?.clientType ?? "").toLowerCase().trim()
  if (raw === "existing" || raw === "new") return raw

  // 2) fallback fiable: un "existing BNG" a un numClient BdClientBng (pas CLI-...)
  const numClient = String(pendingData?.numClient ?? "").trim()
  if (numClient && !numClient.startsWith("CLI-")) return "existing"

  return "new"
}

const extractRows = (data: any) => {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.rows)) return data.rows
  if (Array.isArray(data.data)) return data.data
  if (Array.isArray(data.value)) return data.value
  return []
}


export async function completeSignup(token: string, password: string, emailFallback?: string) {
  try {
    console.log("[v0] Starting signup completion process...")

    const cookieStore = await cookies()
    const pendingDataCookie = cookieStore.get("pending_signup_data")

    let pendingData: any | null = null
    if (!pendingDataCookie) {
      console.error("[v0] No pending signup data found in cookie")
      throw new Error("Données d'inscription manquantes ou expirées. Veuillez recommencer le processus d'inscription.")
    }

    pendingData = JSON.parse(pendingDataCookie.value)

    if (pendingData.verificationToken !== token) {
      console.error("[v0] Token mismatch")
      throw new Error("Token de vérification invalide")
    }

    console.log("[v0] Token verified successfully")

    // const clientType = pendingData.clientType || "new"
    // console.log("[v0] Client type:", clientType)
    const clientType = normalizeClientType(pendingData)
    console.log("[v0] Client type (normalized):", clientType)


    if (clientType === "existing") {
      console.log("[v0] Processing EXISTING BNG client signup...")

      console.log("[v0] Step 1: Creating auth account...")

      const signupPayload = {
        email: String(pendingData.email),
        password: String(password),
        tenantId: String(TENANT_ID),
      }

      const signupResponse = await fetch(`${API_BASE_URL}/auth/sign-up`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupPayload),
      })

      console.log("[v0] Signup response status:", signupResponse.status)

      if (!signupResponse.ok) {
        const errorText = await signupResponse.text()
        console.error("[v0] Signup failed:", errorText)

        let errorData: any = {}
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          errorData = { message: errorText }
        }

        if (errorData.message?.includes("Email is already in use") || errorData.message?.includes("already exists")) {
          throw new Error("Ce compte existe déjà. Veuillez vous connecter avec vos identifiants.")
        }

        throw new Error(errorData.message || "Erreur lors de la création du compte")
      }

      const signupResponseText = await signupResponse.text()
      const authToken = signupResponseText.startsWith("eyJ") ? signupResponseText : JSON.parse(signupResponseText).token

      if (!authToken) {
        throw new Error("Aucun token reçu du serveur")
      }

      console.log("[v0] Auth account created successfully")

      console.log("[v0] Step 2: Getting user info...")

      const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (!meResponse.ok) {
        throw new Error("Erreur lors de la récupération des informations utilisateur")
      }

      const userData = await meResponse.json()
      const userId = userData.id
      console.log("[v0] User info retrieved, userId:", userId)

      if (pendingData.fullName) {
        userData.fullName = pendingData.fullName
      }

      // console.log("[v0] Step 3: Creating client profile for existing BNG client...")

      // const clientPayload = {
      //   data: {
      //     nomComplet: String(pendingData.fullName || pendingData.email),
      //     email: String(pendingData.email),
      //     telephone: String(pendingData.phone || ""),
      //     adresse: String(pendingData.address || ""),
      //     codeClient: String(pendingData.numClient), // Using numClient from BdClientBng (not CLI-...)
      //     verificationToken: token,
      //     clientType: "existing",
      //   },
      // }

      // console.log("[v0] Client payload:", JSON.stringify(clientPayload, null, 2))

      // const clientResponse = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/client`, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: `Bearer ${authToken}`,
      //   },
      //   body: JSON.stringify(clientPayload),
      // })

      // console.log("[v0] Client response status:", clientResponse.status)

      // if (!clientResponse.ok) {
      //   const errorText = await clientResponse.text()
      //   console.error("[v0] Client creation failed:", errorText)
      //   throw new Error("Erreur lors de la création du profil client. Veuillez réessayer.")
      // }

      // const clientData = await clientResponse.json()
      // const clientId = clientData.id || clientData.data?.id
      // console.log("[v0] Client profile created successfully, clientId:", clientId)

      // console.log("[v0] VERIFICATION: userId =", userId, ", clientId =", clientId)
      // console.log("[v0] VERIFICATION: Client was created with userid =", userId)
      // console.log("[v0] VERIFICATION: Accounts will be created with clientId =", userId, "(userId)")

      // if (!clientId) {
      //   console.error("[v0] No clientId returned from client creation")
      //   throw new Error("Erreur lors de la récupération de l'ID client")
      // }
      console.log("[v0] Step 3: Upserting client profile for existing BNG client...")

const codeClientFromBd = String(pendingData.numClient || "").trim()
if (!codeClientFromBd || codeClientFromBd.startsWith("CLI-")) {
  throw new Error("Code client BNG invalide (numClient attendu depuis BdClientBng).")
}

// 1) Chercher si un client existe déjà (priorité: codeClient BdClientBng)
const findByCodeUrl =
  `${API_BASE_URL}/tenant/${TENANT_ID}/client?filter=codeClient||$eq||${encodeURIComponent(codeClientFromBd)}`

const existingByCodeRes = await fetch(findByCodeUrl, {
  method: "GET",
  headers: { Authorization: `Bearer ${authToken}` },
})

let existingClient: any = null
if (existingByCodeRes.ok) {
  const data = await safeJson(existingByCodeRes)
  existingClient = extractRows(data)[0] ?? null
}

// 2) Fallback: chercher par userid (si ton API supporte) sinon par email
if (!existingClient) {
  const findByUserUrl =
    `${API_BASE_URL}/tenant/${TENANT_ID}/client?filter=userid||$eq||${encodeURIComponent(String(userId))}`
  const byUserRes = await fetch(findByUserUrl, {
    method: "GET",
    headers: { Authorization: `Bearer ${authToken}` },
  })

  if (byUserRes.ok) {
    const data = await safeJson(byUserRes)
    existingClient = extractRows(data)[0] ?? null
  }
}

if (!existingClient) {
  const findByEmailUrl =
    `${API_BASE_URL}/tenant/${TENANT_ID}/client?filter=email||$eq||${encodeURIComponent(String(pendingData.email))}`
  const byEmailRes = await fetch(findByEmailUrl, {
    method: "GET",
    headers: { Authorization: `Bearer ${authToken}` },
  })

  if (byEmailRes.ok) {
    const data = await safeJson(byEmailRes)
    existingClient = extractRows(data)[0] ?? null
  }
}

// 3) Si existe déjà => on ne POST PAS (zéro double insertion)
let clientId: string | null = null

if (existingClient?.id) {
  clientId = String(existingClient.id)
  console.log("[v0] Client already exists -> skipping creation. clientId:", clientId)
} else {
  // Important: on met userid pour lier proprement et éviter d'autres créations ailleurs
  const clientPayload = {
    data: {
      nomComplet: String(pendingData.fullName || pendingData.email),
      email: String(pendingData.email),
      telephone: String(pendingData.phone || ""),
      adresse: String(pendingData.address || ""),
      codeClient: codeClientFromBd,     // ✅ BdClientBng (pas CLI-...)
      userid: String(userId),           // ✅ lien explicite
      verificationToken: token,
      clientType: "existing",
    },
  }

  console.log("[v0] Creating client (not found). payload:", JSON.stringify(clientPayload, null, 2))

  const clientResponse = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/client`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(clientPayload),
  })

  if (!clientResponse.ok) {
    const err = await clientResponse.text()
    console.error("[v0] Client creation failed:", err)
    throw new Error("Erreur lors de la création du profil client. Veuillez réessayer.")
  }

  const created = await safeJson(clientResponse)
  clientId = String(created?.id || created?.data?.id || "")
  console.log("[v0] Client created successfully, clientId:", clientId)
}

if (!clientId) {
  throw new Error("Impossible de déterminer l'ID client (créé ou existant).")
}


      console.log("[v0] Step 4: Fetching accounts from CompteBng using numClient:", pendingData.numClient)

      const compteBngUrl = `${API_BASE_URL}/tenant/${TENANT_ID}/compte-bng?filter=clientId||$eq||${encodeURIComponent(pendingData.numClient)}`
      console.log("[v0] CompteBng URL:", compteBngUrl)

      const compteBngResponse = await fetch(compteBngUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      })

      console.log("[v0] CompteBng response status:", compteBngResponse.status)

      if (!compteBngResponse.ok) {
        const errorText = await compteBngResponse.text()
        console.error("[v0] CompteBng fetch failed:", errorText)
        throw new Error("Erreur lors de la récupération des comptes BNG. Veuillez réessayer.")
      }

      const compteBngData = await compteBngResponse.json()
      console.log("[v0] CompteBng raw data:", JSON.stringify(compteBngData, null, 2))

      let comptesArray = []
      if (Array.isArray(compteBngData)) {
        comptesArray = compteBngData
      } else if (compteBngData.rows && Array.isArray(compteBngData.rows)) {
        comptesArray = compteBngData.rows
      } else if (compteBngData.data && Array.isArray(compteBngData.data)) {
        comptesArray = compteBngData.data
      } else if (compteBngData.value && Array.isArray(compteBngData.value)) {
        comptesArray = compteBngData.value
      }

      console.log("[v0] Total accounts found in CompteBng:", comptesArray.length)

      comptesArray = comptesArray.filter((compte: any) => {
        const compteClientId = String(compte.clientId || "")
        const racine = String(pendingData.numClient || "")
        const matches = compteClientId === racine
        console.log(
          `[v0] Checking account ${compte.numCompte}: clientId=${compteClientId}, racine=${racine}, matches=${matches}`,
        )
        return matches
      })

      console.log("[v0] Found", comptesArray.length, "account(s) matching racine", pendingData.numClient)

      if (comptesArray.length === 0) {
        console.warn("[v0] ⚠️ WARNING: No accounts found in CompteBng for numClient:", pendingData.numClient)
        console.warn("[v0] User will be created but will have no accounts linked")
      } else {
        console.log("[v0] Step 5: Creating accounts in compte table...")

        let accountsCreated = 0
        let accountsFailed = 0

        for (const compteBng of comptesArray) {
          console.log("[v0] =====================================")
          console.log("[v0] Processing CompteBng account:", compteBng.numCompte)
          console.log("[v0] CompteBng account data:", JSON.stringify(compteBng, null, 2))

          const mappedType = compteBng.typeCompte || "CURRENT"

          const accountNumber = String(compteBng.numCompte || "")
          let codeBanque = String(compteBng.codeBanque || "")
          let codeAgence = String(compteBng.codeAgence || "")
          let cleRib = String(compteBng.cleRib || "")

          // Extract from account number format: BBBAAAAACCCCCCCCCCCCK (B=banque, A=agence, C=compte, K=clé)
          if (!codeBanque && accountNumber.length >= 3) {
            codeBanque = accountNumber.substring(0, 3)
            console.log("[v0] Extracted codeBanque from account number:", codeBanque)
          }

          if (!codeAgence && accountNumber.length >= 9) {
            codeAgence = accountNumber.substring(3, 9)
            console.log("[v0] Extracted codeAgence from account number:", codeAgence)
          }

          if (!cleRib && accountNumber.length >= 14) {
            cleRib = accountNumber.substring(13, 15)
            console.log("[v0] Extracted cleRib from account number:", cleRib)
          }

          const comptePayload = {
            data: {
              accountId: accountNumber,
              accountNumber: accountNumber,
              accountName: String(compteBng.accountName || compteBng.typeCompte || "Compte"),
              type: mappedType,
              currency: String(compteBng.devise || "GNF"),
              bookBalance: String(compteBng.bookBalance || "0"),
              availableBalance: String(compteBng.availableBalance || "0"),
              status: "ACTIF",
              codeAgence: codeAgence || "001",
              clientId: String(userId), // Link to user ID, not client record ID
              codeBanque: codeBanque || "BNG",
              cleRib: cleRib || "00",
            },
          }

          console.log("[v0] Compte creation payload:", JSON.stringify(comptePayload, null, 2))

          const compteUrl = `${API_BASE_URL}/tenant/${TENANT_ID}/compte`
          console.log("[v0] Compte creation URL:", compteUrl)

          const compteResponse = await fetch(compteUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify(comptePayload),
          })

          console.log("[v0] Compte creation response status:", compteResponse.status)

          if (!compteResponse.ok) {
            const responseText = await compteResponse.text()
            console.error("[v0] ❌ Compte creation FAILED for account:", compteBng.numCompte)
            console.error("[v0] Error response:", responseText)
            accountsFailed++
            continue
          }

          const compteCreatedData = await compteResponse.json()
          const createdAccountId = compteCreatedData.id || compteCreatedData.data?.id
          console.log("[v0] ✅ Compte created successfully!")
          console.log("[v0] Account number:", compteBng.numCompte)
          console.log("[v0] Created compte ID:", createdAccountId)
          accountsCreated++
        }

        console.log("[v0] =====================================")
        console.log(`[v0] Account creation summary: ${accountsCreated} succeeded, ${accountsFailed} failed`)
      }

      await setSecureCookie("user", JSON.stringify(userData))
      console.log("[v0] User info stored in cookie")

      cookieStore.delete("pending_signup_data")

      console.log("[v0] Existing BNG client signup completed successfully!")

      return {
        success: true,
        message: "Votre accès en ligne a été activé avec succès !",
      }
    } else {
      console.log("[v0] Processing NEW client signup...")

      console.log("[v0] Step 1: Creating auth account via /auth/sign-up...")

      const signupPayload = {
        email: String(pendingData.email),
        password: String(password),
        tenantId: String(TENANT_ID),
      }

      console.log("[v0] Signup payload:", JSON.stringify({ ...signupPayload, password: "***" }))

      const signupResponse = await fetch(`${API_BASE_URL}/auth/sign-up`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupPayload),
      })

      console.log("[v0] Signup response status:", signupResponse.status)
      const signupResponseText = await signupResponse.text()

      if (!signupResponse.ok) {
        let errorData: any = {}
        try {
          errorData = JSON.parse(signupResponseText)
        } catch (e) {
          errorData = { message: signupResponseText || `HTTP ${signupResponse.status}` }
        }
        console.error("[v0] Signup failed:", errorData)

        if (errorData.message?.includes("Email is already in use") || errorData.message?.includes("already exists")) {
          throw new Error("Ce compte existe déjà. Veuillez vous connecter avec vos identifiants.")
        }

        throw new Error(errorData.message || "Erreur lors de la création du compte")
      }

      let authToken: string
      if (signupResponseText.startsWith("eyJ")) {
        authToken = signupResponseText
        console.log("[v0] Received JWT token directly")
      } else {
        const signupData = JSON.parse(signupResponseText)
        authToken = signupData.token || signupData.data?.token || signupData
        console.log("[v0] Extracted token from JSON response")
      }

      if (!authToken) {
        console.error("[v0] No token received from server")
        throw new Error("Aucun token reçu du serveur")
      }

      console.log("[v0] Auth account created successfully")

      console.log("[v0] Step 2: Getting authenticated user info...")

      const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (!meResponse.ok) {
        const errorData = await meResponse.json().catch(() => ({}))
        console.error("[v0] Failed to get user info:", errorData)
        throw new Error("Erreur lors de la récupération des informations utilisateur")
      }

      const userData = await meResponse.json()
      const userId = userData.id
      console.log("[v0] User info retrieved successfully, userId:", userId)

      await setSecureCookie("user", JSON.stringify(userData))
      console.log("[v0] User info stored in cookie")

      console.log("[v0] Step 3: Creating client profile for new client...")

      if (pendingDataCookie) {
        const clientRequestBody = {
          data: {
            nomComplet: String(pendingData.fullName),
            email: String(pendingData.email),
            telephone: String(pendingData.phone),
            adresse: String(pendingData.address),
            codeClient: String(pendingData.codeClient),
            userid: String(userId),
          },
        }

        console.log("[v0] Client request body:", JSON.stringify(clientRequestBody))

        const clientResponse = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/client`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(clientRequestBody),
        })

        console.log("[v0] Client response status:", clientResponse.status)

        if (!clientResponse.ok) {
          const clientResponseText = await clientResponse.text()
          console.error("[v0] Client creation failed:", clientResponseText)

          let errorData: any = {}
          try {
            errorData = JSON.parse(clientResponseText)
          } catch (e) {
            errorData = { message: clientResponseText || `HTTP ${clientResponse.status}` }
          }

          throw new Error(errorData.message || "Erreur lors de la création du profil client")
        }

        console.log("[v0] Client profile created successfully")

        cookieStore.delete("pending_signup_data")
      } else {
        console.log("[v0] Skipping client profile creation due to missing pending signup data")
      }

      console.log("[v0] New client signup completed successfully!")

      return {
        success: true,
        message: "Votre compte a été créé avec succès !",
      }
    }
  } catch (error: any) {
    console.error("[v0] Signup completion error:", error)
    return {
      success: false,
      message: error.message || "Une erreur est survenue lors de la finalisation de l'inscription",
    }
  }
}
