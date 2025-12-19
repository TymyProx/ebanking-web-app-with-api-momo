"use server"
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

import { cookies } from "next/headers"
import { config } from "@/lib/config"

const normalize = (u?: string) => (u ? u.replace(/\/$/, "") : "")
const API_BASE_URL = `${normalize(config.API_BASE_URL)}/api`
const TENANT_ID = config.TENANT_ID

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  address: string
  city: string
  postalCode: string
  country: string
  profession: string
  employer: string
  monthlyIncome: string
  codeClient: string
  nomComplet: string
  clientType: string
}

export async function getUserProfileData(): Promise<{ success: boolean; data?: ProfileData; message?: string }> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return { success: false, message: "Token manquant" }
    }

    // 1. Get user data from auth/me
    const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!userResponse.ok) {
      console.error("[Profile] Failed to fetch user:", userResponse.status)
      return { success: false, message: "Erreur lors de la récupération du profil utilisateur" }
    }

    const userData = await userResponse.json()
    const userId = userData.id || userData.data?.id

    if (!userId) {
      return { success: false, message: "ID utilisateur introuvable" }
    }

    // 2. Get client data (where userid = user.id)
    const clientUrl = `${API_BASE_URL}/tenant/${TENANT_ID}/client?filter=userid||$eq||${userId}`
    const clientResponse = await fetch(clientUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    let clientData: any = null
    if (clientResponse.ok) {
      const clientResponseData = await clientResponse.json()
      let clientRecords = []

      if (Array.isArray(clientResponseData)) {
        clientRecords = clientResponseData
      } else if (clientResponseData.rows && Array.isArray(clientResponseData.rows)) {
        clientRecords = clientResponseData.rows
      } else if (clientResponseData.data && Array.isArray(clientResponseData.data)) {
        clientRecords = clientResponseData.data
      } else if (clientResponseData.value && Array.isArray(clientResponseData.value)) {
        clientRecords = clientResponseData.value
      }

      clientData = clientRecords.find((c: any) => c.userid === userId) || clientRecords[0]
    }

    // 3. Get ClientAdditionalInfo (where clientId = user.id)
    const additionalInfoUrl = `${API_BASE_URL}/tenant/${TENANT_ID}/ClientAdditionalInfo?filter=clientId||$eq||${userId}`
    const additionalInfoResponse = await fetch(additionalInfoUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    let additionalInfoData: any = null
    if (additionalInfoResponse.ok) {
      const additionalInfoResponseData = await additionalInfoResponse.json()
      let additionalInfoRecords = []

      if (Array.isArray(additionalInfoResponseData)) {
        additionalInfoRecords = additionalInfoResponseData
      } else if (additionalInfoResponseData.rows && Array.isArray(additionalInfoResponseData.rows)) {
        additionalInfoRecords = additionalInfoResponseData.rows
      } else if (additionalInfoResponseData.data && Array.isArray(additionalInfoResponseData.data)) {
        additionalInfoRecords = additionalInfoResponseData.data
      } else if (additionalInfoResponseData.value && Array.isArray(additionalInfoResponseData.value)) {
        additionalInfoRecords = additionalInfoResponseData.value
      }

      additionalInfoData = additionalInfoRecords.find((a: any) => a.clientId === userId) || additionalInfoRecords[0]
    }

    // 4. Combine all data into ProfileData
    const profileData: ProfileData = {
      // From user table
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      email: userData.email || "",
      phone: clientData?.telephone || "",

      // From client table
      nomComplet: clientData?.nomComplet || "",
      codeClient: clientData?.codeClient || "",
      clientType: clientData?.clientType || "",
      address: clientData?.adresse || "",

      // From ClientAdditionalInfo table
      dateOfBirth: additionalInfoData?.dateOfBirth || additionalInfoData?.dateNaissance || "",
      city: additionalInfoData?.city || additionalInfoData?.ville || "",
      postalCode: additionalInfoData?.postalCode || additionalInfoData?.codePostal || "",
      country: additionalInfoData?.country || additionalInfoData?.pays || "Guinée",
      profession: additionalInfoData?.profession || additionalInfoData?.metier || "",
      employer: additionalInfoData?.employer || additionalInfoData?.employeur || "",
      monthlyIncome: additionalInfoData?.monthlyIncome || additionalInfoData?.revenuMensuel || "",
    }

    return { success: true, data: profileData }
  } catch (error) {
    console.error("[Profile] Error fetching profile data:", error)
    return { success: false, message: "Erreur lors de la récupération des données de profil" }
  }
}

export async function updateProfile(data: ProfileData) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return {
        success: false,
        message: "Token manquant",
      }
    }

    // Validate required fields
    const requiredFields = ["firstName", "lastName", "email", "phone", "address", "city", "country"]
    for (const field of requiredFields) {
      if (!data[field as keyof ProfileData]?.trim()) {
        return {
          success: false,
          message: "Tous les champs obligatoires doivent être remplis",
        }
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return {
        success: false,
        message: "Format d'email invalide",
      }
    }

    // Get user ID
    const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!userResponse.ok) {
      return {
        success: false,
        message: "Erreur lors de la récupération du profil utilisateur",
      }
    }

    const userData = await userResponse.json()
    const userId = userData.id || userData.data?.id

    if (!userId) {
      return {
        success: false,
        message: "ID utilisateur introuvable",
      }
    }

    const updateUserResponse = await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phone,
      }),
    })

    if (!updateUserResponse.ok) {
      console.error("[Profile] Failed to update user:", updateUserResponse.status)
    }

    const clientUrl = `${API_BASE_URL}/tenant/${TENANT_ID}/client?filter=userid||$eq||${userId}`
    const clientResponse = await fetch(clientUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (clientResponse.ok) {
      const clientData = await clientResponse.json()
      let clientRecords = []

      if (Array.isArray(clientData)) {
        clientRecords = clientData
      } else if (clientData.rows && Array.isArray(clientData.rows)) {
        clientRecords = clientData.rows
      } else if (clientData.data && Array.isArray(clientData.data)) {
        clientRecords = clientData.data
      } else if (clientData.value && Array.isArray(clientData.value)) {
        clientRecords = clientData.value
      }

      const client = clientRecords.find((c: any) => c.userid === userId) || clientRecords[0]

      if (client && client.id) {
        await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/client/${client.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nomComplet: `${data.firstName} ${data.lastName}`.trim(),
            adresse: data.address,
            telephone: data.phone,
            email: data.email,
          }),
        })
      }
    }

    const additionalInfoUrl = `${API_BASE_URL}/tenant/${TENANT_ID}/ClientAdditionalInfo?filter=clientId||$eq||${userId}`
    const additionalInfoResponse = await fetch(additionalInfoUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    const additionalInfoData = {
      clientId: userId,
      dateOfBirth: data.dateOfBirth,
      city: data.city,
      postalCode: data.postalCode,
      country: data.country,
      profession: data.profession,
      employer: data.employer,
      monthlyIncome: data.monthlyIncome,
    }

    if (additionalInfoResponse.ok) {
      const additionalInfoResult = await additionalInfoResponse.json()
      let additionalInfoRecords = []

      if (Array.isArray(additionalInfoResult)) {
        additionalInfoRecords = additionalInfoResult
      } else if (additionalInfoResult.rows && Array.isArray(additionalInfoResult.rows)) {
        additionalInfoRecords = additionalInfoResult.rows
      } else if (additionalInfoResult.data && Array.isArray(additionalInfoResult.data)) {
        additionalInfoRecords = additionalInfoResult.data
      } else if (additionalInfoResult.value && Array.isArray(additionalInfoResult.value)) {
        additionalInfoRecords = additionalInfoResult.value
      }

      const additionalInfo = additionalInfoRecords.find((a: any) => a.clientId === userId) || additionalInfoRecords[0]

      if (additionalInfo && additionalInfo.id) {
        // Update existing
        await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/ClientAdditionalInfo/${additionalInfo.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(additionalInfoData),
        })
      } else {
        // Create new
        await fetch(`${API_BASE_URL}/tenant/${TENANT_ID}/ClientAdditionalInfo`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ data: additionalInfoData }),
        })
      }
    }

    return {
      success: true,
      message: "Informations mises à jour avec succès",
    }
  } catch (error) {
    console.error("[Profile] Error updating profile:", error)
    return {
      success: false,
      message: "Erreur lors de la mise à jour du profil",
    }
  }
}
