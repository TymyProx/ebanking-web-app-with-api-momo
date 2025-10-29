import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { VerificationEmail } from "@/emails/verification-email"

const resend = new Resend(process.env.RESEND_API_KEY || "re_NdcxUQii_54sRnXtfjKgHcXdr2XZf5FzP")
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "bng@astratechnologie.com"
const APP_URL = process.env.NEXT_PUBLIC_EBANKING_URL || "http://localhost:3000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, token, userName } = body

    if (!email) {
      return NextResponse.json({ success: false, message: "Email requis" }, { status: 400 })
    }

    if (!token) {
      return NextResponse.json({ success: false, message: "Token requis" }, { status: 400 })
    }

    console.log("[v0] Sending verification email to:", email)

    const verificationUrl = `${APP_URL}/auth/verify-email?token=${token}`

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Vérifiez votre adresse email - BNG E-Banking",
      react: VerificationEmail({
        userName: userName || email.split("@")[0],
        verificationLink: verificationUrl,
      }),
    })

    if (error) {
      console.error("[v0] Resend error:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    console.log("[v0] Email sent successfully:", data)

    return NextResponse.json({ success: true, message: "Email envoyé avec succès", data })
  } catch (error: any) {
    console.error("[v0] Error sending email:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Erreur lors de l'envoi de l'email" },
      { status: 500 },
    )
  }
}
