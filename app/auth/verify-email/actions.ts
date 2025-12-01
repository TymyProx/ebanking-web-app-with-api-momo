"use server"

import { cookies } from "next/headers"
import { setSecureCookie } from "@/lib/cookie-config"
import { config } from "@/lib/config"

const normalize = (u?: string) => (u ? u.replace(/\/$/, "") : "")
const API_BASE_URL = `${normalize(config.API_BASE_URL)}/api`
const TENANT_ID = config.TENANT_ID

export async function completeSignup(token: string, password: string, emailFallback?: string) {
  try {
    console.log("[v0] Starting signup completion process...")

    const cookieStore = await cookies()
    const pendingDataCookie = cookieStore.get("pending_signup_data")

    let pendingData: any | null = null
    if (!pendingDataCookie) {
      console.warn("[v0] No pending signup data found - using email fallback and skipping client profile creation")
      if (!emailFallback) {
        throw new Error("Données d'inscription manquantes ou expirées")
      }
      pendingData = {
        email: emailFallback,
        fullName: emailFallback.split("@")[0],
        phone: "",
        address: "",
        codeClient: `CLI-${Date.now()}`,
        verificationToken: token,
      }
    } else {
      pendingData = JSON.parse(pendingDataCookie.value)
    }

    // Verify the token matches
    if (pendingData.verificationToken !== token) {
      console.error("[v0] Token mismatch")
      throw new Error("Token de vérification invalide")
    }

    console.log("[v0] Token verified successfully")

    const isExistingClient = pendingData.isExistingClient === true

    if (isExistingClient) {
      console.log("[v0] Processing existing BNG client signup with transaction...")

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

      console.log("[v0] Step 3: Creating client profile...")

      const clientPayload = {
        data: {
          nomComplet: String(pendingData.fullName || pendingData.email),
          email: String(pendingData.email),
          telephone: String(pendingData.phone || ""),
          adresse: String(pendingData.address || ""),
          codeClient: String(pendingData.codeClient || pendingData.numClient),
          userid: String(userId), // userId from auth/me
        },
      }

      console.log("[v0] Client payload:", JSON.stringify(clientPayload, null, 2))

      const clientResponse = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/client`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(clientPayload),
      })

      console.log("[v0] Client response status:", clientResponse.status)

      if (!clientResponse.ok) {
        const errorText = await clientResponse.text()
        console.error("[v0] Client creation failed:", errorText)

        console.log("[v0] ROLLBACK: Client creation failed, attempting to clean up user account...")
        throw new Error("Erreur lors de la création du profil client. Veuillez réessayer.")
      }

      const clientData = await clientResponse.json()
      const clientId = clientData.id || clientData.data?.id
      console.log("[v0] Client profile created successfully, clientId:", clientId)

      console.log("[v0] Step 4: Fetching accounts from CompteBng using clientId:", pendingData.numClient)

      const compteBngUrl = `${API_BASE_URL}/tenant/${TENANT_ID}/compte-bng?filter=clientId||$eq||${pendingData.numClient}`
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

        console.log("[v0] ROLLBACK: CompteBng fetch failed, transaction incomplete...")
        throw new Error("Erreur lors de la récupération des comptes BNG. Veuillez réessayer.")
      }

      const compteBngData = await compteBngResponse.json()
      console.log("[v0] CompteBng data received:", JSON.stringify(compteBngData, null, 2))

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

      comptesArray = comptesArray.filter((compte: any) => {
        const compteClientId = String(compte.clientId || "")
        const racine = String(pendingData.numClient || "")
        return compteClientId === racine
      })

      console.log("[v0] Found", comptesArray.length, "account(s) matching racine", pendingData.numClient)

      if (comptesArray.length === 0) {
        console.warn("[v0] No accounts found in CompteBng for this client")
      } else {
        console.log("[v0] Step 5: Creating accounts in compte table...")

        for (const compteBng of comptesArray) {
          console.log("[v0] ===== Processing CompteBng Account =====")
          console.log("[v0] Raw CompteBng data:", JSON.stringify(compteBng, null, 2))
          console.log("[v0] Available fields:", Object.keys(compteBng))
          console.log("[v0] - numCompte:", compteBng.numCompte)
          console.log("[v0] - accountName:", compteBng.accountName)
          console.log("[v0] - typeCompte:", compteBng.typeCompte)
          console.log("[v0] - devise:", compteBng.devise)
          console.log("[v0] - bookBalance:", compteBng.bookBalance)
          console.log("[v0] - availableBalance:", compteBng.availableBalance)
          console.log("[v0] - clientId:", compteBng.clientId)

          const comptePayload = {
            data: {
              accountId: String(compteBng.numCompte || ""),
              accountNumber: String(compteBng.numCompte || ""),
              accountName: String(compteBng.accountName || "Compte"),
              type: String(compteBng.typeCompte || "CURRENT"),
              currency: String(compteBng.devise || "GNF"),
              bookBalance: String(compteBng.bookBalance || "0"),
              availableBalance: String(compteBng.availableBalance || "0"),
              status: "ACTIF",
              codeAgence: "N/A",
              clientId: String(userId),
              codeBanque: "N/A",
              cleRib: "N/A",
            },
          }

          console.log("[v0] ===== Compte Payload to Send =====")
          console.log("[v0] Full payload:", JSON.stringify(comptePayload, null, 2))
          console.log("[v0] Payload size:", JSON.stringify(comptePayload).length, "bytes")

          const compteUrl = `${API_BASE_URL}/tenant/${TENANT_ID}/compte`
          console.log("[v0] POST URL:", compteUrl)
          console.log("[v0] Authorization token present:", authToken ? "YES" : "NO")

          const compteResponse = await fetch(compteUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify(comptePayload),
          })

          console.log("[v0] ===== Compte Creation Response =====")
          console.log("[v0] Status:", compteResponse.status)
          console.log("[v0] Status text:", compteResponse.statusText)
          console.log("[v0] Headers:", JSON.stringify(Object.fromEntries(compteResponse.headers.entries()), null, 2))

          const responseText = await compteResponse.text()
          console.log("[v0] Response body:", responseText)

          let responseData: any = null
          try {
            responseData = JSON.parse(responseText)
            console.log("[v0] Parsed response:", JSON.stringify(responseData, null, 2))
          } catch (e) {
            console.log("[v0] Response is not JSON, raw text:", responseText)
          }

          if (!compteResponse.ok) {
            console.error("[v0] ===== Compte Creation Failed =====")
            console.error("[v0] Status:", compteResponse.status)
            console.error("[v0] Error response:", responseText)

            if (responseData && responseData.message) {
              console.error("[v0] Error message:", responseData.message)
            }
            if (responseData && responseData.error) {
              console.error("[v0] Error details:", JSON.stringify(responseData.error, null, 2))
            }

            console.log("[v0] ROLLBACK: Compte creation failed, transaction incomplete...")
            throw new Error("Erreur lors de la création des comptes. Veuillez réessayer.")
          }

          console.log("[v0] ===== Compte Created Successfully =====")
          console.log("[v0] Account number:", compteBng.numCompte)
          console.log("[v0] Response data:", JSON.stringify(responseData, null, 2))
        }
      }

      await setSecureCookie("user", JSON.stringify(userData))
      console.log("[v0] User info stored in cookie")

      cookieStore.delete("pending_signup_data")

      console.log("[v0] Existing BNG client signup completed successfully with transaction!")

      return {
        success: true,
        message: "Votre accès en ligne a été activé avec succès !",
      }
    }

    console.log("[v0] Processing new client signup...")

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
    console.log("[v0] Signup response body:", signupResponseText.substring(0, 200) + "...")

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

    console.log("[v0] Step 3: Creating client profile...")

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
      const clientResponseText = await clientResponse.text()
      console.log("[v0] Client response body:", clientResponseText.substring(0, 200) + "...")

      if (!clientResponse.ok) {
        let errorData: any = {}
        try {
          errorData = JSON.parse(clientResponseText)
        } catch (e) {
          errorData = { message: clientResponseText || `HTTP ${clientResponse.status}` }
        }
        console.error("[v0] Client creation failed:", errorData)
        throw new Error(errorData.message || "Erreur lors de la création du profil client")
      }

      console.log("[v0] Client profile created successfully")

      cookieStore.delete("pending_signup_data")
    } else {
      console.log("[v0] Skipping client profile creation due to missing pending signup data")
    }

    console.log("[v0] Signup completion successful!")

    return {
      success: true,
      message: "Votre compte a été créé avec succès !",
    }
  } catch (error: any) {
    console.error("[v0] Signup completion error:", error)
    return {
      success: false,
      message: error.message || "Une erreur est survenue lors de la finalisation de l'inscription",
    }
  }
}
