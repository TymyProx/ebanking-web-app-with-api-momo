// emails/verification-email.tsx
import * as React from "react";

interface VerificationEmailProps {
  verificationLink: string;
  userName?: string;
}

export function VerificationEmail({
  verificationLink,
  userName,
}: VerificationEmailProps) {
  return (
    <html>
      <body
        style={{
          fontFamily:
            "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif",
          backgroundColor: "#f9fafb",
          padding: "24px",
          color: "#111827",
        }}
      >
        <table
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{
            maxWidth: "480px",
            margin: "0 auto",
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "24px",
          }}
        >
          <tbody>
            <tr>
              <td style={{ textAlign: "center", paddingBottom: "16px" }}>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  Vérification de votre adresse e-mail
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                    marginTop: "4px",
                  }}
                >
                  Astra eBanking
                </div>
              </td>
            </tr>

            {userName && (
              <tr>
                <td
                  style={{
                    fontSize: "14px",
                    color: "#111827",
                    paddingBottom: "12px",
                  }}
                >
                  Bonjour {userName},
                </td>
              </tr>
            )}

            {!userName && (
              <tr>
                <td
                  style={{
                    fontSize: "14px",
                    color: "#111827",
                    paddingBottom: "12px",
                  }}
                >
                  Bonjour,
                </td>
              </tr>
            )}

            <tr>
              <td
                style={{
                  fontSize: "14px",
                  color: "#111827",
                  lineHeight: "20px",
                  paddingBottom: "16px",
                }}
              >
                Merci de vous être inscrit. Pour finaliser l’activation de votre
                compte, veuillez confirmer votre adresse e-mail en cliquant sur
                le bouton ci-dessous :
              </td>
            </tr>

            <tr>
              <td style={{ textAlign: "center", paddingBottom: "20px" }}>
                <a
                  href={verificationLink}
                  style={{
                    display: "inline-block",
                    backgroundColor: "#111827",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: 600,
                    lineHeight: "20px",
                    padding: "12px 20px",
                    borderRadius: "6px",
                    textDecoration: "none",
                  }}
                >
                  Vérifier mon adresse e-mail
                </a>
              </td>
            </tr>

            <tr>
              <td
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  lineHeight: "18px",
                  paddingBottom: "12px",
                }}
              >
                Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre
                navigateur :
                <br />
                <span style={{ wordBreak: "break-all", color: "#111827" }}>
                  {verificationLink}
                </span>
              </td>
            </tr>

            <tr>
              <td
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  lineHeight: "18px",
                }}
              >
                Si vous n’êtes pas à l’origine de cette demande, vous pouvez
                ignorer cet e-mail.
              </td>
            </tr>

            <tr>
              <td
                style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                  lineHeight: "18px",
                  paddingTop: "24px",
                  borderTop: "1px solid #e5e7eb",
                  textAlign: "center",
                }}
              >
                © {new Date().getFullYear()} Astra eBanking. Tous droits
                réservés.
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
