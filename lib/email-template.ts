/**
 * Template email unifié pour BNG E-Banking
 * Style professionnel, sans emojis
 */

export interface EmailTemplateParams {
  title: string
  greeting?: string
  content: string
  primaryButton?: { label: string; href: string }
  footerText?: string
  brandName?: string
}

const DEFAULT_BRAND = "BNG eBanking"
const DEFAULT_FOOTER = "Banque Nationale de Guinée - Tous droits réservés"

export function buildEmailHtml(params: EmailTemplateParams): string {
  const {
    title,
    greeting = "Bonjour",
    content,
    primaryButton,
    footerText = DEFAULT_FOOTER,
    brandName = DEFAULT_BRAND,
  } = params

  const buttonHtml = primaryButton
    ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td align="center">
          <a href="${primaryButton.href}" style="
            display: inline-block;
            background: linear-gradient(135deg, #0f5132 0%, #0d4429 100%);
            color: #ffffff;
            font-size: 14px;
            font-weight: 600;
            padding: 14px 32px;
            border-radius: 6px;
            text-decoration: none;
            letter-spacing: 0.02em;
          ">${primaryButton.label}</a>
        </td>
      </tr>
    </table>
  `
    : ""

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f8; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #0f5132 0%, #0d4429 100%); padding: 28px 32px; text-align: center;">
              <div style="font-size: 11px; font-weight: 600; letter-spacing: 0.15em; color: rgba(255,255,255,0.9); text-transform: uppercase; margin-bottom: 4px;">${brandName}</div>
              <div style="font-size: 18px; font-weight: 600; color: #ffffff;">${title}</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 20px; font-size: 14px; color: #374151; line-height: 1.6;">${greeting},</p>
              <div style="font-size: 14px; color: #374151; line-height: 1.7;">
                ${content}
              </div>
              ${buttonHtml}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center;">
              ${footerText}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim()
}

export function buildEmailText(params: Omit<EmailTemplateParams, "primaryButton">): string {
  const { title, greeting = "Bonjour", content, footerText = DEFAULT_FOOTER } = params
  const plainContent = content
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return `${title}\n\n${greeting},\n\n${plainContent}\n\n---\n${footerText}`
}

export interface OtpEmailParams {
  userName?: string
  otpCode: string
  purpose?: string
  validityMinutes?: number
}

/** Template OTP unifié — même style que les autres emails (réclamations, RIB, etc.) */
export function buildOtpEmailHtml(params: OtpEmailParams): string {
  const {
    userName = "Client",
    otpCode,
    purpose = "votre opération",
    validityMinutes = 5,
  } = params

  const formattedCode = otpCode.replace(/(.)/g, "$1 ").trim()

  const content = `
    <p>Pour sécuriser ${purpose}, nous avons généré un code de vérification unique.</p>
    <div style="background: linear-gradient(135deg, #0f5132 0%, #0d4429 100%); border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 8px; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; color: rgba(255,255,255,0.9); text-transform: uppercase;">Votre code de vérification</p>
      <p style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: 0.2em; font-variant-numeric: tabular-nums;">${formattedCode}</p>
    </div>
    <div style="background: #f8fafc; padding: 16px; border-radius: 6px; border-left: 4px solid #0f5132; margin: 20px 0;">
      <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #0f5132;">Informations importantes</p>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #374151; line-height: 1.8;">
        <li>Ce code est valide pendant <strong>${validityMinutes} minutes</strong></li>
        <li>Utilisez-le uniquement pour l'opération en cours</li>
        <li><strong>3 tentatives maximum</strong> pour entrer le code</li>
        <li>Ne partagez jamais ce code avec qui que ce soit</li>
      </ul>
    </div>
    <p style="font-size: 13px; color: #6b7280;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail et contactez notre service client.</p>
  `

  return buildEmailHtml({
    title: "Code de vérification",
    greeting: userName,
    content,
  })
}

export function buildOtpEmailText(params: OtpEmailParams): string {
  const { userName = "Client", otpCode, purpose = "votre opération", validityMinutes = 5 } = params
  return buildEmailText({
    title: "Code de vérification",
    greeting: userName,
    content: `Pour sécuriser ${purpose}, votre code de vérification est : ${otpCode}. Valide ${validityMinutes} min, 3 tentatives max. Ne partagez jamais ce code.`,
  })
}
