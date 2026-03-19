"use server"
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { getApiBaseUrl, TENANT_ID } from "@/lib/api-url"

const API_BASE_URL = getApiBaseUrl()
const BANK_NAME = "BNG E-Banking"

function generateAccountOpeningRecapHtml(params: {
  clientName: string
  accountName: string
  accountType: string
  accountNumber?: string | null
}) {
  const ebankingUrl = process.env.NEXT_PUBLIC_EBANKING_URL || "http://localhost:3000"
  const accountNumber = params.accountNumber ? String(params.accountNumber) : null

  return `
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Demande reçue - ${BANK_NAME}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        line-height: 1.6;
        color: #111827;
        background-color: #f5f5f5;
        padding: 20px;
      }
      .email-wrapper {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        border-radius: 14px;
        overflow: hidden;
      }
      .email-header {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        padding: 34px 28px;
        text-align: center;
      }
      .brand {
        color: #ffffff;
        font-size: 28px;
        font-weight: 800;
        letter-spacing: 1px;
        margin-bottom: 6px;
        text-transform: uppercase;
      }
      .subtitle {
        color: rgba(255,255,255,0.95);
        font-size: 13px;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: rgba(255,255,255,0.18);
        margin: 18px auto 0;
        font-size: 32px;
      }
      .email-body { padding: 30px 28px; }
      .title {
        font-size: 22px;
        font-weight: 800;
        color: #065f46;
        margin-bottom: 10px;
      }
      .text { color: #047857; font-size: 15px; margin-bottom: 16px; }
      .card {
        background: #f0fdf4;
        border-left: 5px solid #10b981;
        padding: 18px;
        border-radius: 10px;
        margin: 18px 0;
      }
      .row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 8px 0;
        border-bottom: 1px solid rgba(16,185,129,0.15);
      }
      .row:last-child { border-bottom: none; }
      .label { color: #6b7280; font-size: 13px; }
      .value { color: #0f172a; font-weight: 700; font-size: 14px; text-align: right; }
      .next {
        margin-top: 18px;
        background: #fffbeb;
        border-left: 5px solid #f59e0b;
        padding: 16px 18px;
        border-radius: 10px;
      }
      .next h3 {
        font-size: 15px;
        margin-bottom: 8px;
        color: #92400e;
      }
      .next ul { padding-left: 18px; }
      .next li { margin: 6px 0; color: #92400e; font-size: 14px; }
      .cta {
        display: inline-block;
        margin-top: 18px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: #ffffff;
        padding: 12px 22px;
        border-radius: 10px;
        text-decoration: none;
        font-weight: 700;
      }
      .footer {
        background-color: #111827;
        color: #ffffff;
        padding: 18px 22px;
        text-align: center;
      }
      .footer small { color: #9ca3af; display: block; margin-top: 8px; }
    </style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="email-header">
        <div class="brand">${BANK_NAME}</div>
        <div class="subtitle">Votre banque en ligne sécurisée</div>
        <div class="badge">✅</div>
      </div>
      <div class="email-body">
        <div class="title">Demande bien prise en compte</div>
        <div class="text">Bonjour <strong>${params.clientName}</strong>, nous avons enregistré votre demande d'ouverture de compte.</div>

        <div class="card">
          <div class="row"><span class="label">Intitulé du compte</span><span class="value">${params.accountName}</span></div>
          <div class="row"><span class="label">Type de compte</span><span class="value">${params.accountType}</span></div>
          <div class="row"><span class="label">Statut</span><span class="value">EN ATTENTE</span></div>
          ${
            accountNumber
              ? `<div class="row"><span class="label">Numéro de compte</span><span class="value">${accountNumber}</span></div>`
              : ""
          }
        </div>

        <div class="next">
          <h3>Prochaines étapes</h3>
          <ul>
            <li>Nous traiterons votre demande et mettrons à jour le statut lorsque c'est validé.</li>
            <li>Vous recevrez un e-mail dès que le statut de votre compte changera.</li>
          </ul>
        </div>

        <a class="cta" href="${ebankingUrl}/login">Accéder à mon espace</a>
      </div>

      <div class="footer">
        <div style="font-weight:800">${BANK_NAME}</div>
        <small>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</small>
      </div>
    </div>
  </body>
</html>
  `
}

async function sendAccountOpeningRecapEmail(payload: {
  to: string
  clientName: string
  accountName: string
  accountType: string
  accountNumber?: string | null
}) {
  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "no-reply@bngebanking.com"

  if (!resendApiKey) {
    console.error("[Account Opening Email] RESEND_API_KEY manquante")
    return { success: false as const, error: "RESEND_API_KEY manquante" }
  }

  const html = generateAccountOpeningRecapHtml({
    clientName: payload.clientName,
    accountName: payload.accountName,
    accountType: payload.accountType,
    accountNumber: payload.accountNumber ?? null,
  })

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: payload.to,
      subject: `✅ Votre demande d'ouverture de compte est prise en compte`,
      html,
      text: `Votre demande d'ouverture de compte a été prise en compte. Intitulé: ${payload.accountName}, type: ${payload.accountType}.`,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    const message = errorBody?.message || errorBody?.error || response.statusText
    throw new Error(message || "Erreur lors de l'envoi de l'email")
  }

  return { success: true as const }
}

export interface Account {
  id: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
  createdById?: string
  updatedById?: string
  importHash?: string
  tenantId?: string
  accountId: string
  accountNumber: string
  accountName: string
  currency: string
  bookBalance: string
  availableBalance: string
  status: string
  type: string
  codeAgence?: string
  clientId?: string
  codeBanque?: string
  cleRib?: string
  minorFirstName?: string
  minorLastName?: string
  minorDateOfBirth?: string
}

interface AccountsResponse {
  rows: Account[]
  count: number
}

export async function getAccounts(): Promise<Account[]> {
  const cookieToken = (await cookies()).get("token")?.value
  const usertoken = cookieToken

  try {
    if (!usertoken) {
      return []
    }

    let currentUserId: string | null = null
    try {
      const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${usertoken}`,
        },
        next: { revalidate: 60 },
      })

      if (userResponse.ok) {
        const userData = await userResponse.json()
        currentUserId = userData.id
      }
    } catch (error) {
      console.error("Error fetching user ID:", error)
    }

    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/compte`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usertoken}`,
      },
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      const contentType = response.headers.get("content-type")

      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Erreur lors de la récupération des comptes")
      } else {
        const errorText = await response.text()

        if (errorText.includes("only public URLs are supported") || errorText.includes("only https is supported")) {
          return [
            {
              id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
              accountId: "ACC001",
              clientId: "CUST001",
              accountNumber: "0001234567890",
              accountName: "Compte Courant Principal",
              currency: "GNF",
              bookBalance: "2500000",
              availableBalance: "2350000",
              status: "ACTIF",
              type: "CURRENT",
              codeAgence: "Agence Centrale",
              createdAt: "2023-01-15T10:00:00Z",
              tenantId: TENANT_ID,
            },
            {
              id: "3fa85f64-5717-4562-b3fc-2c963f66afa7",
              accountId: "ACC002",
              clientId: "CUST001",
              accountNumber: "0001234567891",
              accountName: "Compte Épargne",
              currency: "GNF",
              bookBalance: "5000000",
              availableBalance: "5000000",
              status: "ACTIF",
              type: "SAVINGS",
              codeAgence: "Agence Centrale",
              createdAt: "2023-03-20T10:00:00Z",
              tenantId: TENANT_ID,
            },
            {
              id: "3fa85f64-5717-4562-b3fc-2c963f66afa8",
              accountId: "ACC003",
              clientId: "CUST001",
              accountNumber: "0001234567892",
              accountName: "Compte USD",
              currency: "USD",
              bookBalance: "1200",
              availableBalance: "1150",
              status: "ACTIF",
              type: "CURRENT",
              codeAgence: "Agence Internationale",
              createdAt: "2023-06-10T10:00:00Z",
              tenantId: TENANT_ID,
            },
          ]
        } else {
          // Log error for debugging but return empty array instead of throwing
          console.error("Error fetching accounts:", errorText)
          throw new Error("Erreur de communication avec l'API")
        }

      }
    }

    const responseData = await response.json()

    let accounts: Account[] = []

    if (responseData.rows && Array.isArray(responseData.rows)) {
      accounts = responseData.rows
    } else if (responseData.data) {
      if (Array.isArray(responseData.data)) {
        accounts = responseData.data
      } else if (typeof responseData.data === "object") {
        accounts = [responseData.data]
      }
    } else if (Array.isArray(responseData)) {
      accounts = responseData
    }

    if (currentUserId) {
      accounts = accounts.filter((account) => account.clientId === currentUserId)
    }

    return accounts
  } catch (error) {
    console.error("Error in getAccounts:", error)
    return []
  }
}

export async function createAccount(prevState: any, formData: FormData) {
  const cookieToken = (await cookies()).get("token")?.value
  const usertoken = cookieToken
  try {
    if (!usertoken) {
      return {
        success: false,
        error: "Token d'authentification manquant",
      }
    }

    let clientId = "CUSTOMER_ID_PLACEHOLDER"
    let userEmail: string | null = null
    let userFullName: string | null = null
    try {
      const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${usertoken}`,
        },
      })

      if (userResponse.ok) {
        const userData = await userResponse.json()
        clientId = userData.id || "CUSTOMER_ID_PLACEHOLDER"
        userEmail = userData.email ?? null
        userFullName = userData.fullName ?? null
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du client ID:", error)
    }

    const accountType = (formData.get("accountType") as string) || "CURRENT"
    const accountData: any = {
      // Le backend générera automatiquement accountId, accountNumber, codeBanque, codeAgence, cleRib
      accountName: formData.get("accountName") as string,
      currency: formData.get("currency") as string,
      bookBalance: (formData.get("bookBalance") as string) || "0",
      availableBalance: (formData.get("availableBalance") as string) || "0",
      status: "EN ATTENTE",
      type: accountType,
      clientId: clientId,
    }

    if (accountType === "MINEUR") {
      accountData.minorFirstName = formData.get("minorFirstName") as string
      accountData.minorLastName = formData.get("minorLastName") as string
      accountData.minorDateOfBirth = formData.get("minorDateOfBirth") as string
    }

    if (!accountData.accountName || !accountData.currency) {
      return {
        success: false,
        error: "Le nom du compte et la devise sont requis",
      }
    }

    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/compte`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usertoken}`,
      },
      body: JSON.stringify({
        data: accountData,
      }),
    })

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json()
        return {
          success: false,
          error: errorData.message || "Erreur lors de la création du compte",
        }
      } else {
        const errorText = await response.text()

        if (errorText.includes("only public URLs are supported") || errorText.includes("only https is supported")) {
          revalidatePath("/accounts")
          return {
            success: true,
            message: "Demande d'ouverture de compte soumise avec succès (mode test)",
          }
        }

        return {
          success: false,
          error: "Erreur de communication avec l'API",
        }
      }
    }

    const result = await response.json()

    // Envoi d'un mail de récapitulatif au moment où la demande est prise en compte
    try {
      const returnedData = result?.data ?? result
      const accountNumber = returnedData?.accountNumber ?? returnedData?.id

      if (userEmail && (userFullName || userEmail)) {
        await sendAccountOpeningRecapEmail({
          to: userEmail,
          clientName: userFullName || userEmail.split("@")[0] || "Client",
          accountName: String(accountData.accountName ?? ""),
          accountType: String(accountData.type ?? accountType ?? ""),
          accountNumber: accountNumber ? String(accountNumber) : null,
        })
      }
    } catch (emailError) {
      // On ne bloque pas la création du compte si l'e-mail échoue
      console.error("[Account Opening Email] Erreur d'envoi:", emailError)
    }

    revalidatePath("/accounts")

    return {
      success: true,
      message: "Compte créé avec succès",
      data: result.data,
    }
  } catch (error) {
    console.error("Erreur lors de la création du compte:", error)
    return {
      success: false,
      error: "Erreur lors de la création du compte. Veuillez réessayer.",
    }
  }
}

export async function getAccountById(accountId: string) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return { data: null }
    }

    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/compte/${accountId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Erreur lors de la récupération du compte")
      } else {
        const errorText = await response.text()

        if (errorText.includes("only public URLs are supported") || errorText.includes("only https is supported")) {
          return {
            data: {
              id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
              accountId: accountId,
              customerId: "CUST001",
              accountNumber: "0001234567890",
              accountName: "Compte Courant Principal",
              currency: "GNF",
              bookBalance: "2500000",
              availableBalance: "2350000",
              status: "ACTIF",
              type: "CURRENT",
              agency: "Agence Centrale",
              createdAt: "2023-01-15T10:00:00Z",
              TENANT_ID: TENANT_ID,
            },
          }
        }

        throw new Error("Erreur de communication avec l'API")
      }
    }

    const data = await response.json()

    return { data: data.data || data }
  } catch (error) {
    console.error("Erreur lors de la récupération du compte:", error)
    return { data: null }
  }
}
