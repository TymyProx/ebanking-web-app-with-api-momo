# 🔍 Erreur 403 OTP - Guide de Dépannage

## ❌ Erreur Actuelle

```
Request failed with status code 403 (Forbidden)
```

## 🔍 Cause

L'erreur 403 signifie que le backend ne trouve pas de token d'authentification valide dans la requête.

**Raisons possibles:**
1. ❌ L'utilisateur n'est pas connecté
2. ❌ Le token n'existe pas dans localStorage
3. ❌ Le token est expiré ou invalide
4. ❌ Le token n'est pas envoyé correctement

---

## ✅ Solutions

### Solution 1: Vérifier si Vous Êtes Connecté

**Ouvrez la console du navigateur (F12) et tapez:**

```javascript
// Vérifier le token
console.log("Token:", localStorage.getItem("token"));

// Vérifier l'utilisateur
console.log("User:", localStorage.getItem("user"));
```

**Résultats attendus:**
- ✅ **Token existe** → Devrait commencer par "eyJ" (JWT)
- ✅ **User existe** → Doit contenir vos infos utilisateur

**Si NULL ou undefined:**
- ❌ Vous n'êtes PAS connecté
- 👉 **Solution:** Connectez-vous d'abord

---

### Solution 2: Se Connecter

**Page de connexion:**
```
http://localhost:3000/login
```

**Après connexion:**
1. Vérifiez que vous êtes bien sur la page d'accueil/dashboard
2. Vérifiez le token dans la console:
   ```javascript
   localStorage.getItem("token")
   ```
3. Essayez à nouveau l'OTP

---

### Solution 3: Tester avec un Utilisateur Test

Si vous n'avez pas de compte, créez-en un:

**Endpoint API pour test:**
```javascript
// Créer un utilisateur test (en console backend)
// Ou via l'interface de signup
```

**Credentials de test (si configuré):**
- Email: `test@example.com`
- Password: `password123`

---

### Solution 4: Vérifier l'État de Connexion

**Script de debug à copier dans la console navigateur:**

```javascript
// Debug OTP - Vérifier l'authentification
(function debugOTP() {
  console.log("=".repeat(60));
  console.log("🔍 DEBUG OTP - État de Connexion");
  console.log("=".repeat(60));
  
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  
  console.log("1. Token présent:", token ? "✅ OUI" : "❌ NON");
  if (token) {
    console.log("   Token (premiers 20 char):", token.substring(0, 20) + "...");
  }
  
  console.log("2. User présent:", user ? "✅ OUI" : "❌ NON");
  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log("   Email:", userData.email);
      console.log("   ID:", userData.id);
    } catch (e) {
      console.error("   ❌ Erreur parsing user data");
    }
  }
  
  console.log("\n📋 Résumé:");
  if (token && user) {
    console.log("✅ Vous êtes connecté - L'OTP devrait fonctionner");
    console.log("   Si erreur 403, le token est peut-être expiré");
    console.log("   👉 Reconnectez-vous");
  } else {
    console.log("❌ Vous n'êtes PAS connecté");
    console.log("   👉 Allez sur /login et connectez-vous");
  }
  console.log("=".repeat(60));
})();
```

---

## 🧪 Test Complet

### Étape par Étape:

1. **Ouvrir la console (F12)**

2. **Vérifier l'authentification:**
   ```javascript
   localStorage.getItem("token") // Doit retourner une chaîne
   ```

3. **Si pas de token → Se connecter:**
   - Aller sur `/login`
   - Se connecter avec vos identifiants
   - Vérifier à nouveau le token

4. **Une fois connecté, tester l'OTP:**
   - Aller sur `/transfers/new-with-otp`
   - Remplir le formulaire
   - Cliquer "Valider"
   - La modale OTP devrait s'ouvrir sans erreur 403

---

## 🔧 Corrections Appliquées

J'ai amélioré le service OTP pour mieux logger les erreurs:

```typescript
// Maintenant, si pas de token:
console.warn("⚠️ [OTP Service] Pas de token trouvé dans localStorage");

// Si erreur 403/401:
console.error("❌ [OTP Service] Erreur d'authentification");
// + redirection automatique vers /login
```

---

## 📊 Comprendre les Codes d'Erreur

| Code | Signification | Solution |
|------|---------------|----------|
| 403 | Forbidden - Pas de token | Se connecter |
| 401 | Unauthorized - Token invalide/expiré | Se reconnecter |
| 500 | Erreur serveur | Vérifier backend |

---

## ✅ Checklist de Vérification

Avant d'utiliser l'OTP:

- [ ] Backend est démarré (`npm run dev`)
- [ ] Frontend est démarré (`npm run dev`)
- [ ] Vous êtes sur la page (ex: `/transfers/new-with-otp`)
- [ ] **Vous êtes CONNECTÉ** (crucial!)
- [ ] Token existe dans localStorage
- [ ] Console du navigateur ouverte pour voir les messages

---

## 🎯 Test Rapide

**Dans la console navigateur:**

```javascript
// Test 1: Vérifier connexion
if (localStorage.getItem("token")) {
  console.log("✅ CONNECTÉ - OTP devrait fonctionner");
} else {
  console.log("❌ PAS CONNECTÉ - Allez sur /login");
}

// Test 2: Tester l'API directement
fetch('/api/auth/me', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem("token")
  }
})
.then(r => r.json())
.then(data => console.log("✅ User connecté:", data))
.catch(err => console.log("❌ Pas connecté ou token invalide"));
```

---

## 🚀 Workflow Correct

```
1. Démarrer backend ✅
2. Démarrer frontend ✅
3. Ouvrir http://localhost:3000 ✅
4. Se CONNECTER via /login ✅ ← IMPORTANT!
5. Aller sur /transfers/new-with-otp ✅
6. Utiliser l'OTP ✅
```

---

## 💡 Astuce

Si vous avez déjà un compte mais l'erreur 403 persiste:
1. Déconnectez-vous (bouton logout)
2. Reconnectez-vous
3. Vérifiez le token dans localStorage
4. Réessayez l'OTP

---

## 📞 Si Toujours Erreur 403

Après avoir vérifié que vous êtes bien connecté:

1. **Redémarrer le backend:**
   ```bash
   # Ctrl+C puis
   npm run dev
   ```

2. **Vider le cache navigateur:**
   - F12 → Application → Storage → Clear all
   - Ou Ctrl+Shift+Delete

3. **Se reconnecter:**
   - Allez sur `/login`
   - Entrez vos identifiants
   - Vérifiez le nouveau token

4. **Réessayer l'OTP**

---

## ✅ Résolution

**La cause principale de l'erreur 403 est:**
- ❌ **Utilisateur non connecté**
- ❌ **Token manquant ou expiré**

**Solution:**
- ✅ **Se connecter via `/login`**
- ✅ **Vérifier le token dans localStorage**
- ✅ **Réessayer l'OTP**

---

**🎯 Testez avec le script de debug ci-dessus pour identifier le problème exact!**

