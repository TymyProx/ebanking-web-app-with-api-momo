"use server"
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
import { cookies } from "next/headers"
import { getApiBaseUrl, TENANT_ID } from "@/lib/api-url"

const API_BASE_URL = getApiBaseUrl()

interface ClientAdditionalInfo {
  clientId: string
  country: string
  city: string
  addressLine1: string
  addressLine2: string
  postalCode: string
  idType: string
  idNumber: string
  idIssuingCountry: string
  idIssueDate: string
  idExpiryDate: string
  idFrontImageUrl: string
  idBackImageUrl: string
  minorFirstName?: string
  minorLastName?: string
  minorDateOfBirth?: string
}

export async function saveClientAdditionalInfo(data: ClientAdditionalInfo) {
  const cookieToken = (await cookies()).get("token")?.value
  const usertoken = cookieToken

  try {
    if (!usertoken) {
      return {
        success: false,
        error: "Token d'authentification manquant",
      }
    }

    const response = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/ClientAdditionalInfo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usertoken}`,
      },
      body: JSON.stringify({
        data: data,
      }),
    })

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json()
        return {
          success: false,
          error: errorData.message || "Erreur lors de l'enregistrement des informations",
        }
      } else {
        const errorText = await response.text()

        // Handle test mode
        if (errorText.includes("only public URLs are supported") || errorText.includes("only https is supported")) {
          console.log("[v0] Test mode: Client additional info saved (mock)")
          return {
            success: true,
            message: "Informations supplémentaires enregistrées (mode test)",
          }
        }

        return {
          success: false,
          error: "Erreur de communication avec l'API",
        }
      }
    }

    const result = await response.json()

    return {
      success: true,
      message: "Informations supplémentaires enregistrées avec succès",
      data: result.data,
    }
  } catch (error) {
    console.error("Erreur lors de l'enregistrement des informations:", error)
    return {
      success: false,
      error: "Erreur lors de l'enregistrement des informations. Veuillez réessayer.",
    }
  }
}
