import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"

const API_BASE_URL = process.env.API_BASE_URL || "https://35.184.98.9:4000/api"

// Create axios instance with SSL certificate bypass for server-side requests
const serverAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] API Route: Received sign-in request")

    const body = await request.json()
    const { email, password, TENANT_ID, invitationToken } = body

    console.log("[v0] API Route: Forwarding to backend:", {
      url: `${API_BASE_URL}/auth/sign-in`,
      email,
      TENANT_ID,
      hasPassword: !!password,
    })

    // Forward the request to the backend API
    const response = await serverAxios.post("/auth/sign-in", {
      email,
      password,
      TENANT_ID,
      invitationToken: invitationToken || "",
    })

    console.log("[v0] API Route: Backend response status:", response.status)
    console.log("[v0] API Route: Backend response data:", response.data)

    // Return the token from backend
    return NextResponse.json(response.data, { status: 200 })
  } catch (error: any) {
    console.error("[v0] API Route: Error occurred:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      isAxiosError: error.isAxiosError,
    })

    // Handle different error types
    if (error.code === "ECONNREFUSED") {
      return NextResponse.json(
        { error: "Le serveur backend n'est pas accessible. Vérifiez que le serveur est démarré." },
        { status: 503 },
      )
    }

    if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
      return NextResponse.json(
        { error: "Le serveur met trop de temps à répondre. Réessayez plus tard." },
        { status: 504 },
      )
    }

    if (error.response) {
      // Backend returned an error response
      const errorMessage =
        error.response.data?.message ||
        error.response.data?.error ||
        error.response.data?.msg ||
        (typeof error.response.data === "string" ? error.response.data : null) ||
        "Erreur d'authentification"

      return NextResponse.json({ error: errorMessage }, { status: error.response.status })
    }

    // Network or other error
    return NextResponse.json(
      { error: "Erreur de connexion au serveur. Vérifiez votre connexion réseau." },
      { status: 500 },
    )
  }
}
