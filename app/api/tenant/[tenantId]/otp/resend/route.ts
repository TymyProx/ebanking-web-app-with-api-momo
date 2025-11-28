process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

import { NextResponse } from "next/server"
import { config } from "@/lib/config"

const normalizeBase = (url: string) => (url ? url.replace(/\/api\/?$/, "").replace(/\/$/, "") : "")

const resolveApiBaseUrl = () => {
  const raw = (
    process.env.INTERNAL_API_URL ||
    process.env.API_INTERNAL_URL ||
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    config.API_BASE_URL
  )

  return `${normalizeBase(raw)}/api`
}

const API_BASE_URL = resolveApiBaseUrl()

const forwardResponse = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "application/json"
  const rawBody = await response.text()

  if (contentType.includes("application/json")) {
    const data = rawBody ? JSON.parse(rawBody) : null
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "content-type": "application/json",
      },
    })
  }

  return new NextResponse(rawBody, {
    status: response.status,
    headers: {
      "content-type": contentType,
    },
  })
}

export async function POST(request: Request, { params }: { params: { tenantId: string } }) {
  const { tenantId } = params

  if (!tenantId) {
    return NextResponse.json(
      {
        success: false,
        error: "Tenant ID requis pour renvoyer un OTP",
      },
      { status: 400 },
    )
  }

  try {
    const body = await request.text()
    const backendResponse = await fetch(`${API_BASE_URL}/tenant/${tenantId}/otp/resend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: request.headers.get("authorization") || "",
        Cookie: request.headers.get("cookie") || "",
      },
      body,
      cache: "no-store",
    })

    return await forwardResponse(backendResponse)
  } catch (error: any) {
    console.error("[OTP Proxy] resend error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Erreur lors du renvoi de l'OTP",
      },
      { status: 500 },
    )
  }
}
