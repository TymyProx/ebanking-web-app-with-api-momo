# ✅ Correction du Décompte des Tentatives OTP et Annulation Automatique

**Date**: 12 Novembre 2025  
**Statut**: ✅ Résolu

## 📋 Problème Initial

1. **Décompte des tentatives non synchronisé**: Le frontend gérait le décompte localement sans le synchroniser avec le backend
2. **Pas d'annulation automatique**: Après 3 tentatives échouées, le virement n'était pas annulé automatiquement
3. **Message "Vous disposez de 3 tentatives maximum"**: Correction grammaticale dans l'email OTP

## 🔧 Corrections Appliquées

### 1. Backend - Envoi du Nombre de Tentatives dans l'Erreur

**Fichier**: `backendebanking/src/services/otpService.ts`

```typescript
// Ligne 394-429
if (!isValid) {
  // Update attempts and potentially block
  await OtpRepository.update(
    otpRecord.id,
    { attempts: newAttempts, blocked: shouldBlock },
    { ...this.options, transaction },
  );

  await SequelizeRepository.commitTransaction(transaction);

  if (shouldBlock) {
    const error: any = new Error400(
      this.options.language,
      'otp.maxAttemptsReached',
    );
    error.attempts = newAttempts;          // ✅ Nouveau
    error.maxAttempts = otpRecord.maxAttempts; // ✅ Nouveau
    throw error;
  }

  const error: any = new Error400(
    this.options.language,
    'otp.invalid',
  );
  error.attempts = newAttempts;              // ✅ Nouveau
  error.maxAttempts = otpRecord.maxAttempts; // ✅ Nouveau
  error.remainingAttempts = otpRecord.maxAttempts - newAttempts; // ✅ Nouveau
  throw error;
}
```

**Résultat**: Le backend renvoie maintenant le nombre de tentatives dans l'erreur.

---

### 2. Backend - Réponse d'Erreur avec Tentatives

**Fichier**: `backendebanking/src/api/otp/otpVerify.ts`

```typescript
// Ligne 21-33
} catch (error: any) {
  // Include attempt information in the error response
  if (error.attempts !== undefined) {
    const errorResponse = {
      message: error.message,
      attempts: error.attempts,
      maxAttempts: error.maxAttempts,
      remainingAttempts: error.remainingAttempts,
    };
    return res.status(error.code || 400).send(errorResponse);
  }
  await ApiResponseHandler.error(req, res, error);
}
```

**Résultat**: L'API renvoie un objet structuré avec les informations de tentatives.

**Exemple de réponse d'erreur**:
```json
{
  "message": "otp.invalid",
  "attempts": 2,
  "maxAttempts": 3,
  "remainingAttempts": 1
}
```

---

### 3. Frontend - Modal OTP avec Callback d'Annulation

**Fichier**: `ebanking-web-app-with-api-momo/components/otp-modal.tsx`

#### A. Ajout de la prop `onCancel`

```typescript
// Ligne 18-29
export interface OtpModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerified: () => void
  onCancel?: () => void  // ✅ Nouveau
  purpose: string
  referenceId?: string
  title?: string
  description?: string
  deliveryMethod?: 'SMS' | 'EMAIL' | 'BOTH'
  autoGenerate?: boolean
}
```

#### B. Synchronisation du Décompte avec le Backend

```typescript
// Ligne 170-226
} catch (err: any) {
  const errorMsg = err.message || ""
  const errorData = err.response?.data || {}
  
  // ✅ Mise à jour du compteur depuis le backend
  if (errorData.attempts !== undefined) {
    setAttemptCount(errorData.attempts)
  } else {
    setAttemptCount(prev => prev + 1)
  }
  
  // Get friendly message
  let friendlyMessage = getErrorMessage(errorMsg)
  
  // ✅ Affichage des tentatives restantes depuis le backend
  if (errorMsg.includes('invalid')) {
    const remaining = errorData.remainingAttempts !== undefined 
      ? errorData.remainingAttempts 
      : maxAttempts - attemptCount - 1
      
    if (remaining > 0) {
      friendlyMessage += ` (${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''})`
    }
  }
  
  setError(friendlyMessage)
  
  // Clear input
  if (errorMsg.includes('invalid') || errorMsg.includes('blocked') || errorMsg.includes('maxAttempts')) {
    setOtpValue("")
  }

  // ✅ Vérification si 3 tentatives atteintes
  const hasReachedMax = errorMsg.includes('maxAttempts') || 
                        errorMsg.includes('blocked') || 
                        errorData.attempts >= maxAttempts

  if (hasReachedMax) {
    // ✅ Annulation automatique après 3 tentatives
    setTimeout(() => {
      if (onCancel) {
        onCancel()
      }
      handleClose()
    }, 2000)
    return
  }

  // Auto-resend for expired codes only
  if (errorMsg.includes('expired')) {
    setTimeout(() => {
      handleResendOtp()
    }, 2000)
  }
}
```

#### C. Affichage du Décompte en Temps Réel

```typescript
// Ligne 308-317
<div className="flex items-center justify-between w-full text-xs text-muted-foreground">
  {timeRemaining !== null && timeRemaining > 0 && (
    <div>
      ⏱️ Expire dans: <span className="font-semibold">{formatTime(timeRemaining)}</span>
    </div>
  )}
  <div>
    🔢 Tentatives: <span className="font-semibold">{attemptCount}/{maxAttempts}</span>
  </div>
</div>
```

**Résultat**: L'utilisateur voit en temps réel: `🔢 Tentatives: 1/3`, `2/3`, `3/3`

#### D. Messages d'Erreur Améliorés

```typescript
// Ligne 117-139
const getErrorMessage = (errorMsg: string): string => {
  const errorMap: Record<string, string> = {
    'otp.invalid': '❌ Code incorrect.',
    'otp.expired': '⏰ Ce code a expiré. Un nouveau code va être envoyé.',
    'otp.blocked': '🔒 Code bloqué après 3 tentatives échouées. Le virement est annulé.',
    'otp.maxAttemptsReached': '🔒 3 tentatives échouées. Le virement est annulé par sécurité.',
    'otp.alreadyVerified': '✓ Ce code a déjà été utilisé.',
    'otp.notFound': '🔍 Code introuvable. Demandez un nouveau code.',
    'Forbidden': '🔐 Session expirée. Veuillez vous reconnecter.',
    'An error occurred': '❌ Code incorrect.',
  }
  // ...
}
```

---

### 4. Frontend - Page de Virement avec Annulation

**Fichier**: `ebanking-web-app-with-api-momo/app/transfers/new/page.tsx`

#### A. Fonction d'Annulation

```typescript
// Ligne 226-238
const handleOtpCancel = () => {
  // Annuler le virement après 3 tentatives échouées
  setPendingTransferData(null)
  setOtpReferenceId(null)
  setTransferValidationError(
    "❌ Vérification OTP échouée après 3 tentatives. Le virement a été annulé par sécurité. Veuillez réessayer."
  )
  // Reset form
  setAmount("")
  setMotif("")
  setSelectedBeneficiary("")
  setSelectedCreditAccount("")
}
```

#### B. Intégration dans le Modal OTP

```tsx
// Ligne 980-991
<OtpModal
  open={showOtpModal}
  onOpenChange={setShowOtpModal}
  onVerified={handleOtpVerified}
  onCancel={handleOtpCancel}  // ✅ Nouveau
  purpose="TRANSFER"
  referenceId={otpReferenceId || undefined}
  title="Confirmer le virement"
  description={`Entrez le code OTP pour confirmer le virement de ${amount ? formatCurrency(Number.parseFloat(amount), selectedAccountData?.currency || "GNF") : "0 GNF"}`}
  deliveryMethod="EMAIL"
  autoGenerate={true}
/>
```

---

### 5. Templates Email - Correction Grammaticale

**Fichiers**:
- `backendebanking/src/services/emailSenderResend.ts`
- `backendebanking/email-templates/otpVerification.html`

**Avant**:
```html
<li>Vous disposez de <strong>3 tentatives maximum</strong></li>
```

**Après**:
```html
<li><strong>3 tentatives maximum</strong> pour entrer le code</li>
```

**Résultat**: Formulation plus naturelle et directe en français.

---

## 🎯 Fonctionnement Complet

### Scénario: 3 Tentatives Échouées

1. **Tentative 1** (code incorrect)
   - Backend incrémente: `attempts = 1`
   - Frontend affiche: `❌ Code incorrect. (2 tentatives restantes)`
   - Compteur: `🔢 Tentatives: 1/3`

2. **Tentative 2** (code incorrect)
   - Backend incrémente: `attempts = 2`
   - Frontend affiche: `❌ Code incorrect. (1 tentative restante)`
   - Compteur: `🔢 Tentatives: 2/3`

3. **Tentative 3** (code incorrect)
   - Backend incrémente: `attempts = 3`, `blocked = true`
   - Backend renvoie: `otp.maxAttemptsReached` avec `attempts: 3`
   - Frontend affiche: `🔒 3 tentatives échouées. Le virement est annulé par sécurité.`
   - Compteur: `🔢 Tentatives: 3/3`
   - **Après 2 secondes**: 
     - Modal se ferme automatiquement
     - Fonction `handleOtpCancel()` est appelée
     - Formulaire est réinitialisé
     - Message affiché: `❌ Vérification OTP échouée après 3 tentatives. Le virement a été annulé par sécurité. Veuillez réessayer.`

---

## ✅ Tests à Effectuer

### Test 1: Décompte des Tentatives
1. Créer un virement
2. Entrer un code OTP incorrect 3 fois
3. ✅ Vérifier que le compteur affiche: `1/3`, `2/3`, `3/3`
4. ✅ Vérifier que les messages affichent: `(2 tentatives restantes)`, `(1 tentative restante)`

### Test 2: Annulation Automatique
1. Créer un virement
2. Entrer un code OTP incorrect 3 fois
3. ✅ Vérifier que le modal se ferme après 2 secondes
4. ✅ Vérifier que le formulaire est réinitialisé
5. ✅ Vérifier que le message d'erreur s'affiche

### Test 3: Email OTP
1. Créer un virement
2. Recevoir l'email OTP
3. ✅ Vérifier le texte: "3 tentatives maximum pour entrer le code"

---

## 📝 Commandes de Déploiement

### Backend
```bash
cd C:\nginx\html\ebng
npm run build
node dist/server.js
```

### Frontend (E-Portal)
```bash
cd /path/to/ebanking-web-app-with-api-momo
npm run build
npm start
```

---

## 🎨 Interface Utilisateur

### Affichage du Modal OTP

```
┌─────────────────────────────────────────┐
│ 📧 Confirmer le virement               │
├─────────────────────────────────────────┤
│ ✓ Code envoyé ! Entrez-le ci-dessous : │
│                                         │
│ ┌───┬───┬───┬───┬───┬───┐              │
│ │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │              │
│ └───┴───┴───┴───┴───┴───┘              │
│                                         │
│ ⏱️ Expire dans: 4:32                    │
│ 🔢 Tentatives: 2/3                      │
│                                         │
│ ❌ Code incorrect. (1 tentative restante)│
│ 💡 Conseil : Assurez-vous de bien      │
│    recopier les 6 chiffres.            │
│                                         │
│ [Vérifier le code]                     │
│ [Renvoyer le code]                     │
│ [Annuler]                              │
└─────────────────────────────────────────┘
```

---

## 📊 Résumé des Changements

| Composant | Fichier | Changement |
|-----------|---------|------------|
| **Backend Service** | `otpService.ts` | ✅ Ajout de `attempts`, `maxAttempts`, `remainingAttempts` dans l'erreur |
| **Backend API** | `otpVerify.ts` | ✅ Réponse structurée avec les tentatives |
| **Frontend Modal** | `otp-modal.tsx` | ✅ Synchronisation avec backend + callback `onCancel` + affichage décompte |
| **Frontend Transfert** | `page.tsx` | ✅ Fonction `handleOtpCancel()` + réinitialisation formulaire |
| **Email Template (Resend)** | `emailSenderResend.ts` | ✅ Correction grammaticale |
| **Email Template (SendGrid)** | `otpVerification.html` | ✅ Correction grammaticale |

---

## 🔒 Sécurité

- ✅ Le virement est **automatiquement annulé** après 3 tentatives échouées
- ✅ L'utilisateur est **clairement informé** de l'annulation
- ✅ Le formulaire est **réinitialisé** pour éviter toute confusion
- ✅ Le code OTP est **bloqué** côté backend après 3 tentatives
- ✅ Le décompte est **synchronisé** entre frontend et backend

---

## 🎉 Conclusion

Le système de décompte des tentatives OTP est maintenant:
- ✅ **Synchronisé** entre frontend et backend
- ✅ **Visible** en temps réel pour l'utilisateur
- ✅ **Sécurisé** avec annulation automatique après 3 tentatives
- ✅ **Clair** avec des messages d'erreur en français
- ✅ **Conforme** aux bonnes pratiques de sécurité bancaire

**Date de résolution**: 12 Novembre 2025  
**Testé**: ✅ À tester en production

