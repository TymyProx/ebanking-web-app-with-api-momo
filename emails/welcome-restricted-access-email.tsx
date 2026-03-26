import * as React from "react"

interface WelcomeRestrictedAccessEmailProps {
  userName?: string
  loginUrl: string
}

export function WelcomeRestrictedAccessEmail({ userName, loginUrl }: WelcomeRestrictedAccessEmailProps) {
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
                      <div style={{ fontSize: "18px", fontWeight: 600, color: "#ffffff" }}>Votre compte est créé</div>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "32px" }}>
                      <p style={{ margin: "0 0 20px", fontSize: "14px", color: "#374151", lineHeight: 1.6 }}>{greeting},</p>
                      <p style={{ fontSize: "14px", color: "#374151", lineHeight: 1.7 }}>
                        Votre inscription est terminée : <strong>vos identifiants ont bien été créés</strong>. Vous pouvez dès maintenant vous connecter à la plateforme e-banking BNG.
                      </p>
                      <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "8px", padding: "16px 18px", margin: "22px 0" }}>
                        <p style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 600, color: "#92400e" }}>Accès avec restrictions</p>
                        <p style={{ margin: 0, fontSize: "13px", color: "#78350f", lineHeight: 1.75 }}>
                          Pour l’instant, votre accès est <strong>limité</strong> : certaines fonctionnalités ne sont pas disponibles tant qu’un compte bancaire n’est pas associé à votre profil.
                        </p>
                      </div>
                      <p style={{ fontSize: "14px", color: "#374151", lineHeight: 1.7 }}>
                        <strong>Accès complet</strong> : effectuez une <strong>demande d’ouverture de compte</strong> depuis l’application. Lorsque votre demande sera <strong>validée par la banque</strong>, vous pourrez utiliser l’ensemble des services e-banking.
                      </p>
                      <table width="100%" cellPadding={0} cellSpacing={0} style={{ margin: "26px 0" }}>
                        <tr>
                          <td align="center">
                            <a
                              href={loginUrl}
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
                              Se connecter à la plateforme
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style={{ fontSize: "12px", color: "#6b7280", lineHeight: 1.6 }}>
                        Lien direct :{" "}
                        <a href={loginUrl} style={{ color: "#0f5132", wordBreak: "break-all" }}>
                          {loginUrl}
                        </a>
                      </p>
                      <p style={{ fontSize: "12px", color: "#9ca3af", lineHeight: 1.6, marginTop: "20px" }}>
                        Pour toute question, contactez le support client BNG.
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
