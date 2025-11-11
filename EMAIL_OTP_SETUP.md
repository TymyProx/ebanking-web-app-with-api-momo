# 📧 Configuration OTP par Email - Guide Rapide

## ✅ Changements Effectués

Le système OTP a été configuré pour **envoyer les codes par email** par défaut.

### Modifications:

1. ✅ **Template email OTP créé** (`backendebanking/email-templates/otpVerification.html`)
2. ✅ **Service d'envoi amélioré** avec labels en français
3. ✅ **Frontend configuré** pour utiliser EMAIL par défaut
4. ✅ **Mode développement** avec affichage console du code

---

## 🚀 Utilisation

### Par défaut - Email automatique

```tsx
// Le composant OTP utilise maintenant EMAIL par défaut
<OtpModal
  open={showOtp}
  onOpenChange={setShowOtp}
  onVerified={handleVerified}
  purpose="TRANSFER"
  // deliveryMethod="EMAIL" est déjà par défaut
/>
```

### Options de livraison

```tsx
// Email uniquement (défaut)
<OtpModal deliveryMethod="EMAIL" ... />

// SMS uniquement
<OtpModal deliveryMethod="SMS" ... />

// Les deux
<OtpModal deliveryMethod="BOTH" ... />
```

---

## 🔧 Configuration SendGrid

### Étape 1: Créer un compte SendGrid

1. Allez sur [SendGrid](https://sendgrid.com)
2. Inscrivez-vous (gratuit jusqu'à 100 emails/jour)
3. Vérifiez votre email

### Étape 2: Obtenir la clé API

1. Connectez-vous à SendGrid
2. **Settings** → **API Keys**
3. **Create API Key**
4. Nom: `otp-service`
5. Permissions: **Full Access**
6. Copiez la clé (format: `SG.xxxxxxxxxxxxx`)

### Étape 3: Vérifier l'expéditeur

1. **Settings** → **Sender Authentication**
2. **Verify a Single Sender**
3. Entrez votre email professionnel
4. Vérifiez l'email reçu

### Étape 4: Configurer l'application

Éditez `.env` dans `backendebanking/`:

```env
SENDGRID_KEY=SG.votre_cle_api_ici
SENDGRID_EMAIL_FROM=noreply@votredomaine.com
```

**C'est tout!** Le système utilisera automatiquement le template HTML intégré.

---

## 🧪 Test en Mode Développement

### Sans SendGrid configuré:

Quand vous générez un OTP, le **code s'affiche dans la console** backend:

```
============================================================
🔐 OTP GÉNÉRÉ (MODE DÉVELOPPEMENT)
============================================================
Code: 123456
Utilisateur: user@example.com
Opération: Virement bancaire
Expire dans: 5 minutes
Méthode: EMAIL
============================================================
```

**Avantage:** Vous pouvez tester sans configurer SendGrid!

### Tester l'exemple:

```bash
# Terminal 1 - Backend
cd backendebanking
npm run dev

# Terminal 2 - Frontend
cd ebanking-web-app-with-api-momo
npm run dev

# Ouvrir: http://localhost:3000/transfers/new-with-otp
```

1. Remplissez le formulaire
2. Cliquez "Valider le virement"
3. La modale OTP s'ouvre
4. **Regardez la console backend** pour le code
5. Entrez le code dans la modale
6. ✅ Succès!

---

## 📧 Le Template Email

### Aperçu:

L'email OTP comprend:
- 🔐 Code OTP en gros et en couleur
- ⏱️ Durée de validité (5 minutes)
- 🎯 Type d'opération (virement, paiement, etc.)
- ⚠️ Avertissements de sécurité
- 🏦 Nom de votre banque

### Exemple de code:

```html
[Header avec logo]

🔐 Code de vérification OTP

Bonjour,

Vous avez demandé un code de vérification pour:
┌─────────────────────────┐
│   Virement bancaire     │
└─────────────────────────┘

╔════════════════════╗
║     123456         ║
╚════════════════════╝

ℹ️ Informations importantes:
• Valide pendant 5 minutes
• 3 tentatives maximum
• Ne partagez jamais ce code

⚠️ Si vous n'avez pas demandé ce code, 
contactez notre support.
```

### Personnalisation:

Le fichier est ici: `backendebanking/email-templates/otpVerification.html`

Modifiez:
- Les couleurs
- Le logo (ajoutez le vôtre)
- Les textes
- Le footer

---

## 🎯 Labels des Opérations

Les codes d'opération sont automatiquement traduits en français:

| Code | Label dans l'email |
|------|-------------------|
| `TRANSFER` | Virement bancaire |
| `PAYMENT` | Paiement |
| `BENEFICIARY_ADD` | Ajout de bénéficiaire |
| `BENEFICIARY_MODIFY` | Modification de bénéficiaire |
| `ACCOUNT_MODIFY` | Modification de compte |
| `CARD_REQUEST` | Demande de carte |
| `LOAN_REQUEST` | Demande de crédit |
| `WITHDRAWAL` | Retrait |

---

## 🔍 Vérification

### Vérifier que SendGrid est configuré:

```bash
# Démarrer le backend
cd backendebanking
npm run dev

# Dans les logs, vous devriez voir:
✓ SendGrid configured
✓ Email sender initialized
```

### Vérifier l'envoi d'email:

```bash
# Générer un OTP (remplacez TOKEN par votre token)
curl -X POST http://localhost:8080/api/otp/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "purpose": "TEST",
    "deliveryMethod": "EMAIL"
  }'

# Dans les logs:
[OTP EMAIL] ✉️ Code OTP envoyé à user@example.com pour Test
```

---

## 🚨 Dépannage

### "Email non reçu"

1. **Vérifier les spams**
2. **Vérifier la console backend** (en dev, le code y est affiché)
3. **Vérifier SendGrid Dashboard** → Activity
4. **Vérifier que l'email expéditeur est vérifié** dans SendGrid

### "Email provider is not configured"

1. Vérifiez `.env`:
   ```env
   SENDGRID_KEY=SG.xxxxx
   SENDGRID_EMAIL_FROM=xxx@xxx.com
   ```
2. Redémarrez le backend
3. **En développement:** le code s'affiche quand même dans la console

### "Template error"

Le système utilise un fallback automatique. Si vous n'avez pas de template SendGrid personnalisé, ça fonctionne quand même!

---

## 📊 Statistiques

### Dans SendGrid Dashboard:

- Nombre d'emails envoyés
- Taux de livraison
- Emails ouverts
- Bounces / Erreurs

### Dans votre base de données:

```sql
-- OTPs envoyés par email aujourd'hui
SELECT COUNT(*) 
FROM otps 
WHERE DATE(created_at) = CURRENT_DATE
AND delivery_method IN ('EMAIL', 'BOTH');

-- Taux de vérification
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN verified THEN 1 ELSE 0 END) as verified,
  ROUND(SUM(CASE WHEN verified THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 2) as success_rate
FROM otps
WHERE delivery_method IN ('EMAIL', 'BOTH');
```

---

## ✨ Fonctionnalités

### Envoi automatique
- ✅ Email envoyé automatiquement à l'ouverture de la modale
- ✅ Template HTML professionnel
- ✅ Labels en français

### Sécurité
- ✅ Code haché en base de données
- ✅ Expiration après 5 minutes
- ✅ Maximum 3 tentatives
- ✅ Avertissements de sécurité dans l'email

### UX
- ✅ Email au design moderne
- ✅ Responsive (mobile-friendly)
- ✅ Bouton "Renvoyer" avec cooldown
- ✅ Timer dans la modale

---

## 📚 Voir Aussi

- **CONFIGURATION_EMAIL_OTP.md** (backend) - Guide complet SendGrid
- **OTP_QUICK_START.md** - Guide d'utilisation général
- **docs/OTP_MODULE_GUIDE.md** - Documentation complète

---

## ✅ Checklist de Configuration

- [ ] Compte SendGrid créé
- [ ] Clé API générée
- [ ] Email expéditeur vérifié
- [ ] `.env` configuré avec les clés
- [ ] Backend redémarré
- [ ] Test effectué (voir console ou email reçu)
- [ ] Template personnalisé (optionnel)

---

## 🎉 Résultat

Maintenant, quand un utilisateur soumet une opération sensible:

1. 📧 Il reçoit un email avec le code OTP
2. ⏱️ Il a 5 minutes pour entrer le code
3. 🔒 L'opération est sécurisée
4. ✅ Expérience utilisateur fluide

**Les OTPs sont maintenant envoyés par email!** 🚀

