"use server"
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
import { cookies } from "next/headers"
import { config } from "@/lib/config"
import type { UserProfile, RibInfo } from "./rib-utils"

interface SendRibEmailAttachment {
  filename: string
  content: string
  contentType?: string
}

interface SendRibEmailPayload {
  to: string
  subject: string
  html: string
  text: string
  attachment: SendRibEmailAttachment
}

import { getApiBaseUrl, TENANT_ID } from "@/lib/api-url"

const API_BASE_URL = getApiBaseUrl()

/**
 * Récupère le profil utilisateur complet
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const cookieToken = (await cookies()).get("token")?.value

  if (!cookieToken) {
    console.log("[RIB] Token manquant pour récupérer le profil utilisateur")
    return null
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookieToken}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      console.error("[RIB] Erreur lors de la récupération du profil:", response.status)
      return null
    }

    const userData = await response.json()
    console.log("[RIB] Profil utilisateur récupéré:", userData.email)

    return {
      id: userData.id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      fullName: userData.fullName,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
    }
  } catch (error) {
    console.error("[RIB] Erreur lors de la récupération du profil utilisateur:", error)
    return null
  }
}

/**
 * Récupère les informations détaillées d'un compte pour le RIB
 */
export async function getAccountForRib(accountId: string): Promise<RibInfo | null> {
  const cookieToken = (await cookies()).get("token")?.value

  if (!cookieToken) {
    console.log("[RIB] Token manquant pour récupérer le compte")
    return null
  }

  try {
    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/compte/${accountId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookieToken}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      console.error("[RIB] Erreur lors de la récupération du compte:", response.status)
      return null
    }

    const accountData = await response.json()
    const account = accountData.data || accountData

    return {
      id: account.id,
      accountId: account.accountId,
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      currency: account.currency,
      bookBalance: account.bookBalance,
      availableBalance: account.availableBalance,
      status: account.status,
      type: account.type,
      codeAgence: account.codeAgence,
      codeBanque: account.codeBanque,
      cleRib: account.cleRib,
      clientId: account.clientId,
    }
  } catch (error) {
    console.error("[RIB] Erreur lors de la récupération du compte:", error)
    return null
  }
}

export async function sendRibEmail(payload: SendRibEmailPayload) {
  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "BNG eBanking <no-reply@bngebanking.com>"

  if (!resendApiKey) {
    console.error("[RIB] RESEND_API_KEY manquante. Impossible d'envoyer l'email.")
    return {
      success: false,
      error: "Clé API Resend manquante",
    }
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        attachments: [
          {
            filename: payload.attachment.filename,
            content: payload.attachment.content,
            content_type: payload.attachment.contentType ?? "application/pdf",
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null)
      const message = errorBody?.message || errorBody?.error || response.statusText
      throw new Error(message || "Requête Resend échouée")
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error("[RIB] Erreur lors de l'envoi de l'email via Resend:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    }
  }
}
