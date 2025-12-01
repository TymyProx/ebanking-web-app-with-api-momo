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

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] API Route /me: Received request")

    // Get token from Authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      console.log("[v0] API Route /me: No authorization header")
      return NextResponse.json({ error: "Token d'authentification manquant" }, { status: 401 })
    }

    console.log("[v0] API Route /me: Forwarding to backend with token")

    // Forward the request to the backend API with the token
    const response = await serverAxios.get("/auth/me", {
      headers: {
        Authorization: authHeader,
      },
    })

    console.log("[v0] API Route /me: Backend response status:", response.status)

    return NextResponse.json(response.data, { status: 200 })
  } catch (error: any) {
    console.error("[v0] API Route /me: Error occurred:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
    })

    if (error.response) {
      return NextResponse.json(
        { error: error.response.data?.message || "Erreur lors de la récupération des informations" },
        { status: error.response.status },
      )
    }

    return NextResponse.json({ error: "Erreur de connexion au serveur" }, { status: 500 })
  }
}
