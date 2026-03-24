# Template email OTP unifié

Les emails OTP utilisent désormais le **même template** que les réclamations, RIB et autres emails BNG eBanking (style sobre, vert #0f5132).

## Utilisation côté Backend

Si le backend envoie lui-même les emails OTP, deux options :

### Option 1 : Appeler l’API de rendu (recommandé)

Avant d’envoyer l’email, appeler l’API Next.js pour récupérer le HTML :

```
POST /api/email/render-otp
Content-Type: application/json

{
  "userName": "yologomy03",
  "code": "274987",
  "purpose": "le virement",
  "validityMinutes": 5
}

Réponse :
{
  "html": "<!DOCTYPE html>...",
  "text": "Code de vérification\n\nBonjour yologomy03..."
}
```

Utiliser ensuite `html` et `text` pour envoyer l’email (SendGrid, Resend, etc.).

### Option 2 : Copier le template dans le backend

Le template HTML est généré par `lib/email-template.ts` via `buildOtpEmailHtml()`. Si le backend ne peut pas appeler l’API, la même structure HTML peut être dupliquée dans `backendebanking/email-templates/otpVerification.html`.

Fichiers concernés :
- `lib/email-template.ts` – fonctions `buildOtpEmailHtml`, `buildOtpEmailText`
- `emails/otp-email.tsx` – composant React équivalent
- `app/api/email/render-otp/route.ts` – route API
