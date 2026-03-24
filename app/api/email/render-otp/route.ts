/**
 * Rendu du template email OTP unifié (même style que réclamations, RIB, etc.)
 * Le backend externe peut appeler cette API pour obtenir le HTML de l'email OTP.
 *
 * POST /api/email/render-otp
 * Body: { userName?: string, code: string, purpose?: string, validityMinutes?: number }
 * Response: { html: string, text: string }
 */
import { NextRequest, NextResponse } from "next/server"
import { buildOtpEmailHtml, buildOtpEmailText } from "@/lib/email-template"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userName, code, purpose, validityMinutes } = body

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, error: "Le paramètre 'code' est requis" },
        { status: 400 },
      )
    }

    const html = buildOtpEmailHtml({
      userName: userName ?? "Client",
      otpCode: code,
      purpose: purpose ?? "votre opération",
      validityMinutes: validityMinutes ?? 5,
    })

    const text = buildOtpEmailText({
      userName: userName ?? "Client",
      otpCode: code,
      purpose: purpose ?? "votre opération",
      validityMinutes: validityMinutes ?? 5,
    })

    return NextResponse.json({ html, text })
  } catch (error: unknown) {
    console.error("[render-otp] Erreur:", error)
    return NextResponse.json(
      { success: false, error: "Erreur lors du rendu de l'email OTP" },
      { status: 500 },
    )
  }
}
