import * as React from "react"

interface OtpEmailProps {
  otpCode: string
  userName?: string
  purpose?: string
  validityMinutes?: number
}

export function OtpEmail({ otpCode, userName = "Client", purpose = "votre opération", validityMinutes = 5 }: OtpEmailProps) {
  const greeting = userName ? `Bonjour ${userName}` : "Bonjour"
  const formattedCode = otpCode.replace(/(.)/g, "$1 ").trim()

  return (
    <html>
      <body style={{ margin: 0, padding: 0, backgroundColor: "#f4f6f8", fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: "#f4f6f8", padding: "32px 16px" }}>
          <tbody>
            <tr>
              <td align="center">
                <table width="100%" cellPadding={0} cellSpacing={0} style={{ maxWidth: "560px", background: "#ffffff", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <tr>
                    <td style={{ background: "linear-gradient(135deg, #0f5132 0%, #0d4429 100%)", padding: "28px 32px", textAlign: "center" }}>
                      <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.15em", color: "rgba(255,255,255,0.9)", textTransform: "uppercase" }}>BNG eBanking</div>
                      <div style={{ fontSize: "18px", fontWeight: 600, color: "#ffffff" }}>Code de vérification</div>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "32px" }}>
                      <p style={{ margin: "0 0 20px", fontSize: "14px", color: "#374151", lineHeight: 1.6 }}>{greeting},</p>
                      <p style={{ fontSize: "14px", color: "#374151", lineHeight: 1.7 }}>
                        Pour sécuriser {purpose}, nous avons généré un code de vérification unique.
                      </p>
                      <div style={{ background: "linear-gradient(135deg, #0f5132 0%, #0d4429 100%)", borderRadius: "8px", padding: "24px", margin: "24px 0", textAlign: "center" }}>
                        <p style={{ margin: "0 0 8px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", color: "rgba(255,255,255,0.9)", textTransform: "uppercase" }}>Votre code de vérification</p>
                        <p style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: "#ffffff", letterSpacing: "0.2em", fontVariantNumeric: "tabular-nums" }}>{formattedCode}</p>
                      </div>
                      <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "6px", borderLeft: "4px solid #0f5132", margin: "20px 0" }}>
                        <p style={{ margin: "0 0 8px", fontSize: "12px", fontWeight: 600, color: "#0f5132" }}>Informations importantes</p>
                        <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#374151", lineHeight: 1.8 }}>
                          <li>Ce code est valide pendant <strong>{validityMinutes} minutes</strong></li>
                          <li>Utilisez-le uniquement pour l'opération en cours</li>
                          <li><strong>3 tentatives maximum</strong> pour entrer le code</li>
                          <li>Ne partagez jamais ce code avec qui que ce soit</li>
                        </ul>
                      </div>
                      <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: 1.6 }}>
                        Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail et contactez notre service client.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "20px 32px", borderTop: "1px solid #e5e7eb", fontSize: "11px", color: "#9ca3af", textAlign: "center" }}>
                      Banque Nationale de Guinée - Tous droits réservés
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  )
}
