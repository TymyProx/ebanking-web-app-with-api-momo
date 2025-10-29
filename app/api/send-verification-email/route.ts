import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "bng@astratechnologie.com"
const APP_URL = process.env.NEXT_PUBLIC_EBANKING_URL || "http://localhost:3000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, token } = body

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
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Vérification d'email</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">BNG E-Banking</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Bienvenue chez BNG E-Banking !</h2>
              
              <p style="font-size: 16px; color: #555;">
                Merci de vous être inscrit. Pour activer votre compte et commencer à utiliser nos services, 
                veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 15px 40px; 
                          text-decoration: none; 
                          border-radius: 5px; 
                          font-weight: bold; 
                          display: inline-block;
                          font-size: 16px;">
                  Vérifier mon email
                </a>
              </div>
              
              <p style="font-size: 14px; color: #777; margin-top: 30px;">
                Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
              </p>
              <p style="font-size: 12px; color: #999; word-break: break-all; background: white; padding: 10px; border-radius: 5px;">
                ${verificationUrl}
              </p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              
              <p style="font-size: 12px; color: #999; text-align: center;">
                Si vous n'avez pas créé de compte BNG E-Banking, vous pouvez ignorer cet email.
              </p>
            </div>
          </body>
        </html>
      `,
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
