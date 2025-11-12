# Debug: Gestion des Erreurs OTP 400

## Problème Actuel

L'utilisateur voit:
```
AxiosError: Request failed with status code 400
```

Mais le message d'erreur détaillé n'est pas affiché correctement.

## Investigation

### Format d'Erreur Backend

Dans `/backendebanking/src/api/apiResponseHandler.ts`:

```typescript
static async error(req, res, error) {
  if ([400, 401, 403, 404].includes(error.code)) {
    res.status(error.code).send(error.message); // ← Envoie STRING directement
  }
}
```

**Donc:** `error.response.data` est une **string** contenant "otp.invalid", "otp.expired", etc.

### Amélioration Frontend

Dans `/ebanking-web-app-with-api-momo/lib/otp-service.ts`:

```typescript
catch (error: any) {
  console.error("Erreur lors de la vérification de l'OTP:", error);
  console.error("Response data:", error.response?.data); // ← Debug
  console.error("Response status:", error.response?.status);
  
  let errorMessage = "otp.invalid";

  if (error.response?.data) {
    if (typeof error.response.data === "string") {
      errorMessage = error.response.data; // ← Capture la string
    } else if (error.response.data.error) {
      errorMessage = error.response.data.error;
    }
    // ... autres formats
  }

  console.log("Final error message:", errorMessage); // ← Debug
  throw new Error(errorMessage);
}
```

## Comment Tester

### 1. Ouvrez la Console du Navigateur (F12)

### 2. Entrez un Code Invalide

Par exemple: `111111`

### 3. Regardez les Logs

Vous devriez voir:

```javascript
Erreur lors de la vérification de l'OTP: AxiosError {...}
Response data: "otp.invalid"  // ← La string du backend
Response status: 400
Final error message: "otp.invalid"  // ← Capturé correctement
```

### 4. Le Message Affiché Devrait Être

```
❌ Code incorrect. Veuillez vérifier et réessayer. (2 tentatives restantes)
💡 Conseil : Assurez-vous de bien recopier les 6 chiffres.
```

## Scénarios de Test

### Test 1: Code Invalide
```
Input: "111111"
Backend Response: 400 "otp.invalid"
Frontend Capture: "otp.invalid"
Message Affiché: "❌ Code incorrect. (X tentatives restantes)"
```

### Test 2: Code Expiré
```
Input: "123456" (expiré)
Backend Response: 400 "otp.expired"
Frontend Capture: "otp.expired"
Message Affiché: "⏰ Ce code a expiré. Demandez-en un nouveau."
```

### Test 3: Code Bloqué
```
Input: "999999" (après 3 tentatives)
Backend Response: 400 "otp.blocked"
Frontend Capture: "otp.blocked"
Message Affiché: "🔒 Trop de tentatives échouées."
```

### Test 4: Tentatives Max
```
Input: "555555" (3ème tentative)
Backend Response: 400 "otp.maxAttemptsReached"
Frontend Capture: "otp.maxAttemptsReached"
Message Affiché: "🔒 Nombre maximum de tentatives atteint."
Action: Auto-resend après 2s
```

## Si le Message Ne S'Affiche Toujours Pas

### Vérifiez dans la Console

```javascript
// 1. Vérifiez que l'erreur est bien capturée
console.error("Response data:", error.response?.data)
→ Devrait afficher: "otp.invalid"

// 2. Vérifiez le message final
console.log("Final error message:", errorMessage)
→ Devrait afficher: "otp.invalid"

// 3. Vérifiez le mapping dans otp-modal.tsx
getErrorMessage("otp.invalid")
→ Devrait retourner: "❌ Code incorrect. Veuillez vérifier et réessayer."
```

### Checklist de Debug

- [ ] Backend envoie bien `res.status(400).send("otp.invalid")`
- [ ] Frontend capture `error.response.data === "otp.invalid"`
- [ ] Service OTP throw `new Error("otp.invalid")`
- [ ] Modal capture `err.message === "otp.invalid"`
- [ ] `getErrorMessage()` mappe correctement
- [ ] `setError()` affiche le message
- [ ] Alert s'affiche dans le modal

## Flux Complet d'Erreur

```
[Backend]
1. OTP invalide détecté
2. throw new Error400('otp.invalid')
3. apiResponseHandler.error() capturé
4. res.status(400).send('otp.invalid') ← STRING

[Network]
5. HTTP 400 avec body: "otp.invalid"

[Frontend - Service]
6. axios.post() catch
7. error.response.data = "otp.invalid" ← STRING
8. throw new Error("otp.invalid")

[Frontend - Modal]
9. handleVerifyOtp() catch
10. err.message = "otp.invalid"
11. getErrorMessage("otp.invalid")
12. return "❌ Code incorrect..."
13. setError("❌ Code incorrect...")
14. <Alert> affiche le message ✓
```

## Solution si Ça Ne Marche Toujours Pas

### Option 1: Vérifier le Format Backend

Dans `/backendebanking/src/api/apiResponseHandler.ts`, temporairement:

```typescript
static async error(req, res, error) {
  console.log("[API ERROR]", {
    code: error.code,
    message: error.message,
    type: typeof error.message
  });
  
  if ([400, 401, 403, 404].includes(error.code)) {
    res.status(error.code).send(error.message);
  }
}
```

### Option 2: Logger Plus dans Frontend

Dans `/ebanking-web-app-with-api-momo/components/otp-modal.tsx`:

```typescript
catch (err: any) {
  console.log("[OTP MODAL] Error caught:", err);
  console.log("[OTP MODAL] Error message:", err.message);
  
  const errorMsg = err.message || "";
  console.log("[OTP MODAL] Error msg extracted:", errorMsg);
  
  let friendlyMessage = getErrorMessage(errorMsg);
  console.log("[OTP MODAL] Friendly message:", friendlyMessage);
  
  setError(friendlyMessage);
}
```

## Résultat Attendu

Après les corrections:

1. ✅ Code invalide → Message clair avec tentatives restantes
2. ✅ Code expiré → Message avec conseil
3. ✅ Tentatives max → Auto-resend
4. ✅ Logs détaillés pour debug
5. ✅ Pas d'erreur technique visible

Si vous voyez encore l'AxiosError brut dans l'interface, c'est que:
- Le catch ne fonctionne pas
- L'erreur est throw avant d'être mappée
- Le message n'est pas dans le bon format

Utilisez les logs pour identifier exactement où ça bloque! 🔍

