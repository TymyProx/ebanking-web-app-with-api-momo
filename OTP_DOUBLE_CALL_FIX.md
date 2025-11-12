# Fix: Erreur 400 - Double Appel de Vérification OTP

## Problème Signalé

```
AxiosError: Request failed with status code 400
    at async OtpService.verify
    at async handleVerifyOtp

LORS DE LA VALIDATION DE L'OTP, LA CONFIRMATION PASSE ET 
IMMEDIATEMENT APRES UNE ERREUR A APPARAIT
```

## Cause Racine

Le code de vérification OTP était appelé **deux fois successivement** :

### Flux Problématique :

1. ✅ L'utilisateur entre le 6ème chiffre
2. ✅ `OtpInput` détecte que les 6 chiffres sont complets
3. ✅ `onComplete(value)` est appelé → appelle `handleVerifyOtp()`
4. ✅ **Première vérification API** → Succès ✅
5. ✅ L'OTP est marqué comme "vérifié" dans la base de données
6. 🔄 Le composant se re-render (à cause du changement de state)
7. 🔄 Le `useEffect` de `OtpInput` se redéclenche (car `onComplete` change)
8. ❌ **Deuxième vérification API** avec le même code
9. ❌ Backend retourne erreur 400 : "otp.alreadyVerified"
10. ❌ L'utilisateur voit l'erreur malgré le succès initial

### Pourquoi Ça Se Produisait :

#### Dans `otp-input.tsx` :
```typescript
// AVANT (PROBLÉMATIQUE)
React.useEffect(() => {
  if (value.length === length && onComplete) {
    onComplete(value)  // ← Appelé à chaque re-render si value === 6
  }
}, [value, length, onComplete])  // ← onComplete change à chaque render
```

#### Dans `otp-modal.tsx` :
```typescript
// AVANT (PAS DE PROTECTION)
const handleVerifyOtp = async () => {
  if (otpValue.length !== 6) return
  
  setIsVerifying(true)
  // Pas de vérification si déjà en cours ou déjà vérifié
  const result = await OtpService.verify({...})
  // ...
}
```

## Solution Implémentée

### 1. Protection contre les Appels Multiples dans le Modal

**Fichier :** `/components/otp-modal.tsx`

```typescript
const handleVerifyOtp = async () => {
  if (otpValue.length !== 6) {
    setError("Veuillez entrer le code complet à 6 chiffres")
    return
  }

  // ✅ NOUVEAU : Prevent multiple calls
  if (isVerifying || success) {
    return  // ← Sort immédiatement si déjà en cours ou déjà réussi
  }

  setIsVerifying(true)
  setError("")

  try {
    const result = await OtpService.verify({
      code: otpValue,
      purpose,
      referenceId,
    })

    if (result.verified) {
      setSuccess(true)
      setTimeout(() => {
        onVerified()
        handleClose()
      }, 1000)
    }
  } catch (err: any) {
    setError(err.message || "Code OTP invalide")
    setOtpValue("")
  } finally {
    setIsVerifying(false)
  }
}
```

**Avantages :**
- ✅ Si une vérification est déjà en cours (`isVerifying === true`), ignore les nouveaux appels
- ✅ Si déjà vérifié avec succès (`success === true`), ignore les appels supplémentaires
- ✅ Protection simple et efficace au niveau du handler

### 2. Tracking de la Valeur Complétée dans OtpInput

**Fichier :** `/components/ui/otp-input.tsx`

```typescript
// ✅ NOUVEAU : Track if onComplete has been called for this value
const completedValueRef = React.useRef<string>("")

// Check if OTP is complete
React.useEffect(() => {
  if (value.length === length && onComplete && value !== completedValueRef.current) {
    completedValueRef.current = value  // ← Enregistre la valeur complétée
    onComplete(value)                  // ← N'appelle qu'une fois par valeur unique
  }
}, [value, length, onComplete])

// ✅ NOUVEAU : Reset completed value when value is cleared
React.useEffect(() => {
  if (value.length === 0) {
    completedValueRef.current = ""  // ← Réinitialise quand l'input est vidé
  }
}, [value])
```

**Avantages :**
- ✅ `onComplete` n'est appelé qu'**une seule fois** par valeur complète unique
- ✅ Si le même code "123456" est complété, puis effacé, puis re-saisi, il sera rappelé (comportement correct)
- ✅ Empêche les appels multiples causés par les re-renders
- ✅ Utilise une `ref` (ne cause pas de re-render)

## Flux Corrigé

1. ✅ L'utilisateur entre le 6ème chiffre
2. ✅ `completedValueRef.current` est vide
3. ✅ `onComplete` est appelé avec "123456"
4. ✅ `completedValueRef.current = "123456"`
5. ✅ `handleVerifyOtp()` vérifie : `isVerifying === false`, `success === false` → Continue
6. ✅ `setIsVerifying(true)`
7. ✅ **API call** → Succès
8. ✅ `setSuccess(true)`
9. 🔄 Re-render du modal
10. 🔄 `useEffect` de `OtpInput` se redéclenche
11. ✅ **Mais** : `value === completedValueRef.current` → N'appelle PAS `onComplete`
12. ✅ Même si appelé : `handleVerifyOtp()` vérifie : `success === true` → Sort immédiatement
13. ✅ **Aucune erreur !**

## Tests de Validation

### Scénario 1 : Complétion Normale
1. ✅ Entrer 6 chiffres
2. ✅ Vérification automatique
3. ✅ Succès affiché
4. ✅ Aucune erreur 400

### Scénario 2 : Code Invalide puis Correct
1. ✅ Entrer code invalide "111111"
2. ✅ Erreur affichée
3. ✅ Input vidé automatiquement
4. ✅ `completedValueRef` réinitialisé
5. ✅ Entrer code correct "123456"
6. ✅ Vérification fonctionne
7. ✅ Succès

### Scénario 3 : Clic Manuel sur Vérifier
1. ✅ Entrer 5 chiffres
2. ✅ Clic sur "Vérifier" → Erreur "code incomplet"
3. ✅ Entrer 6ème chiffre
4. ✅ Auto-vérification
5. ✅ Succès

### Scénario 4 : Réseau Lent
1. ✅ Entrer 6 chiffres
2. ✅ `isVerifying = true` immédiatement
3. 🔄 Réseau lent (2 secondes)
4. 🔄 Utilisateur clique sur "Vérifier" pendant l'attente
5. ✅ **Bloqué** par `if (isVerifying) return`
6. ✅ Première requête revient avec succès
7. ✅ Aucun double appel

## Avantages de la Solution

### 🛡️ Double Protection
- **Niveau 1 :** `OtpInput` - Ne rappelle pas `onComplete` pour la même valeur
- **Niveau 2 :** `handleVerifyOtp` - Vérifie les états avant d'appeler l'API

### ⚡ Performance
- Utilise `useRef` (pas de re-render supplémentaire)
- Évite les appels API inutiles
- Réduit la charge serveur

### 🎯 UX Améliorée
- Aucune erreur visible pour l'utilisateur
- Comportement prévisible et cohérent
- Feedback immédiat et précis

### 🔧 Maintenabilité
- Code simple et lisible
- Commentaires explicites
- Facile à déboguer

## Fichiers Modifiés

1. ✅ `/ebanking-web-app-with-api-momo/components/otp-modal.tsx`
   - Ajout protection `if (isVerifying || success) return`

2. ✅ `/ebanking-web-app-with-api-momo/components/ui/otp-input.tsx`
   - Ajout `completedValueRef` pour tracker les valeurs complétées
   - Ajout reset quand l'input est vidé

## Vérification

Après déploiement, vous devriez voir dans les logs backend :

**Avant (2 appels) :**
```
POST /api/tenant/.../otp/verify ← Premier appel
✅ OTP verified successfully
POST /api/tenant/.../otp/verify ← Deuxième appel
❌ Error 400: otp.alreadyVerified
```

**Après (1 seul appel) :**
```
POST /api/tenant/.../otp/verify ← Un seul appel
✅ OTP verified successfully
```

## Résultat

✅ **Problème résolu**
✅ **Pas d'erreur 400 après validation**
✅ **Une seule requête de vérification par code OTP**
✅ **UX fluide et sans accrocs**

---

## Note Technique

Cette erreur était un cas classique de "race condition" dans React :
- Les `useEffect` avec des fonctions en dépendances se redéclenchent fréquemment
- Les états asynchrones (`isVerifying`) ne sont pas toujours à jour immédiatement
- La solution nécessite une combinaison de refs et de guards de state

La double protection (ref + state check) assure une robustesse maximale.

