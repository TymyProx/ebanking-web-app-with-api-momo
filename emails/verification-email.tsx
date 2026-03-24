import * as React from "react"

interface VerificationEmailProps {
  verificationLink: string
  userName?: string
}

export function VerificationEmail({ verificationLink, userName }: VerificationEmailProps) {
  const greeting = userName ? `Bonjour ${userName}` : "Bonjour"

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
                      <div style={{ fontSize: "18px", fontWeight: 600, color: "#ffffff" }}>Vérification de votre adresse e-mail</div>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "32px" }}>
                      <p style={{ margin: "0 0 20px", fontSize: "14px", color: "#374151", lineHeight: 1.6 }}>{greeting},</p>
                      <p style={{ fontSize: "14px", color: "#374151", lineHeight: 1.7 }}>
                        Merci de vous être inscrit. Pour finaliser l'activation de votre compte, veuillez confirmer votre adresse e-mail en cliquant sur le bouton ci-dessous.
                      </p>
                      <table width="100%" cellPadding={0} cellSpacing={0} style={{ margin: "24px 0" }}>
                        <tr>
                          <td align="center">
                            <a
                              href={verificationLink}
                              style={{
                                display: "inline-block",
                                background: "linear-gradient(135deg, #0f5132 0%, #0d4429 100%)",
                                color: "#ffffff",
                                fontSize: "14px",
                                fontWeight: 600,
                                padding: "14px 32px",
                                borderRadius: "6px",
                                textDecoration: "none",
                              }}
                            >
                              Vérifier mon adresse e-mail
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style={{ fontSize: "12px", color: "#6b7280", lineHeight: 1.6 }}>
                        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br />
                        <span style={{ wordBreak: "break-all", color: "#111827" }}>{verificationLink}</span>
                      </p>
                      <p style={{ fontSize: "12px", color: "#9ca3af", lineHeight: 1.6 }}>
                        Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.
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
