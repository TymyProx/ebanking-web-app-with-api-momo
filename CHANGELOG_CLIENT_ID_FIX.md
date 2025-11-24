# 🔧 Correction: Utilisation du bon clientId

## 📋 Problème Résolu

**Avant**: L'e-portal utilisait `user.id` comme `clientId` dans les comptes  
**Après**: L'e-portal utilise maintenant `client.id` (le vrai clientId)

---

## 🔄 Modifications Apportées

### Fichier: `app/accounts/actions.ts`

#### 1. Fonction `createAccount()` - Lignes 177-193

**AVANT** ❌:
```typescript
let clientId = "CUSTOMER_ID_PLACEHOLDER"
try {
  const userResponse = await fetch(`${API_BASE_URL}/auth/me`, ...)
  
  if (userResponse.ok) {
    const userData = await userResponse.json()
    clientId = userData.id  // ← userId utilisé comme clientId (FAUX)
  }
}
```

**APRÈS** ✅:
```typescript
let clientId = "CUSTOMER_ID_PLACEHOLDER"
try {
  // Étape 1: Récupérer l'ID du user connecté
  const userResponse = await fetch(`${API_BASE_URL}/auth/me`, ...)
  
  if (userResponse.ok) {
    const userData = await userResponse.json()
    const userId = userData.id
    
    console.log("[CreateAccount] User ID:", userId)

    // Étape 2: Trouver le client correspondant via le champ userid
    const clientResponse = await fetch(
      `${API_BASE_URL}/tenant/${TENANT_ID}/client?filter[userid]=${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${usertoken}`,
        },
      }
    )

    if (clientResponse.ok) {
      const clientData = await clientResponse.json()
      
      if (clientData.rows && clientData.rows.length > 0) {
        // Utiliser le client.id (pas le user.id !)
        clientId = clientData.rows[0].id  // ← Maintenant utilise client.id (CORRECT)
        console.log("[CreateAccount] Client ID found:", clientId)
      }
    }
  }
}
```

#### 2. Fonction `getAccounts()` - Lignes 48-65

**AVANT** ❌:
```typescript
let currentUserId: string | null = null
try {
  const userResponse = await fetch(`${API_BASE_URL}/auth/me`, ...)
  
  if (userResponse.ok) {
    const userData = await userResponse.json()
    currentUserId = userData.id  // ← userId
  }
}

// Plus tard...
if (currentUserId) {
  accounts = accounts.filter((account) => account.clientId === currentUserId)
  // ← Filtrait par userId (FAUX)
}
```

**APRÈS** ✅:
```typescript
let currentClientId: string | null = null
try {
  // Étape 1: Récupérer le userId
  const userResponse = await fetch(`${API_BASE_URL}/auth/me`, ...)
  
  if (userResponse.ok) {
    const userData = await userResponse.json()
    const userId = userData.id
    
    // Étape 2: Trouver le client correspondant
    const clientResponse = await fetch(
      `${API_BASE_URL}/tenant/${TENANT_ID}/client?filter[userid]=${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${usertoken}`,
        },
        next: { revalidate: 60 },
      }
    )

    if (clientResponse.ok) {
      const clientData = await clientResponse.json()
      if (clientData.rows && clientData.rows.length > 0) {
        currentClientId = clientData.rows[0].id  // ← Maintenant utilise client.id
      }
    }
  }
}

// Plus tard...
if (currentClientId) {
  accounts = accounts.filter((account) => account.clientId === currentClientId)
  // ← Filtre maintenant par clientId (CORRECT)
}
```

---

## 🔍 Comprendre la Différence

### Structure des Tables

```
Table user (Authentification)
┌─────────────────────────────────────┐
│ id: "6c6cac8f-..."                  │ ← userId (UUID A)
│ email: "user@example.com"           │
│ firstName: "Jean"                    │
│ lastName: "Dupont"                   │
└─────────────────────────────────────┘
          │
          │ Lors du signup, un client est créé automatiquement
          ▼
Table client (Informations bancaires)
┌─────────────────────────────────────┐
│ id: "12345678-..."                  │ ← clientId (UUID B - DIFFÉRENT!)
│ userid: "6c6cac8f-..."              │ ← Référence vers user.id
│ nomComplet: "Jean Dupont"           │
│ email: "user@example.com"           │
│ codeClient: "CLI-12345"             │
│ tenantId: "aa1287f6-..."            │
└─────────────────────────────────────┘
          │
          │ Le compte doit référencer client.id
          ▼
Table compte (Comptes bancaires)
┌─────────────────────────────────────┐
│ id: "abc-123..."                    │
│ accountNumber: "1234567890"         │
│ clientId: "12345678-..."            │ ← Doit être client.id (UUID B)
│ status: "EN ATTENTE"                │
│ type: "COURANT_CHEQUE"              │
└─────────────────────────────────────┘
```

---

## ✅ Bénéfices de cette Correction

1. **✅ Le back-office peut maintenant charger le client correctement**
   - GET `/api/tenant/.../client/{clientId}` fonctionne
   - Le bouton "Valider" ouvre le modal avec les infos KYC

2. **✅ Les comptes sont correctement associés aux clients**
   - La relation `compte.clientId` → `client.id` est respectée
   - L'intégrité référentielle est maintenue

3. **✅ Le workflow d'approbation fonctionne de bout en bout**
   - E-portal crée un compte avec le bon clientId
   - Back-office peut charger le client et ses infos KYC
   - L'agent peut approuver/rejeter la demande
   - Le client reçoit un email de notification (via Resend)

4. **✅ Logs améliorés pour le débogage**
   - Console logs montrent userId et clientId clairement
   - Plus facile de diagnostiquer les problèmes

---

## 🧪 Tests à Effectuer

### Test 1: Création d'un Nouveau Compte

1. Connectez-vous à l'e-portal: http://localhost:3000
2. Allez sur "Ouvrir un compte": http://localhost:3000/accounts/new
3. Remplissez le formulaire et soumettez
4. Vérifiez dans la console browser (F12) les logs:
   ```
   [CreateAccount] User ID: 6c6cac8f-...
   [CreateAccount] Client ID found: 12345678-...
   [CreateAccount] Client name: Jean Dupont
   ```
5. Vérifiez en base de données:
   ```sql
   SELECT id, accountNumber, clientId, status 
   FROM compte 
   ORDER BY "createdAt" DESC 
   LIMIT 1;
   
   -- clientId doit être l'ID du client, pas l'ID du user
   ```

### Test 2: Validation dans le Back-Office

1. Connectez-vous au back-office: http://localhost:3001
2. Allez sur "Comptes": http://localhost:3001/comptes
3. Trouvez un compte "EN ATTENTE"
4. Cliquez sur "Valider"
5. ✅ Le modal devrait s'ouvrir avec les infos du client (pas d'erreur 404)
6. Vérifiez que les infos KYC s'affichent correctement
7. Testez l'approbation ou le rejet

### Test 3: Liste des Comptes dans l'E-Portal

1. Connectez-vous à l'e-portal
2. Allez sur "Mes comptes": http://localhost:3000/accounts
3. ✅ Vous devriez voir uniquement VOS comptes (pas ceux des autres users)
4. Vérifiez dans la console:
   ```
   [GetAccounts] Client ID for filtering: 12345678-...
   ```

---

## 🔧 Si Vous Avez Déjà des Comptes avec le Mauvais clientId

Si vous avez créé des comptes AVANT cette correction, ils ont le `userId` dans `clientId`.

**Solution**: Exécutez le script SQL de correction:

```sql
-- Fichier: FIX_CLIENT_ID_QUICK.sql dans back-office-bngEbanking
UPDATE compte c
SET "clientId" = cl.id
FROM "user" u
INNER JOIN client cl ON cl.userid = u.id
WHERE c."clientId" = u.id
  AND cl.userid = u.id;
```

---

## 📊 Requête de Vérification

Pour vérifier que tout fonctionne correctement:

```sql
SELECT 
  'Vérification compte → client → user' AS info,
  c.id AS compte_id,
  c."accountNumber",
  c."clientId",
  c.status,
  '→' AS sep1,
  cl.id AS client_id,
  cl.userid,
  cl.nomComplet,
  '→' AS sep2,
  u.id AS user_id,
  u.email,
  CASE 
    WHEN c."clientId" = cl.id AND cl.userid = u.id 
      THEN '✅ CORRECT: compte → client → user'
    WHEN c."clientId" = u.id 
      THEN '❌ ERREUR: compte.clientId = user.id (pas client.id)'
    ELSE '⚠️ AUTRE PROBLÈME'
  END AS diagnostic
FROM compte c
LEFT JOIN client cl ON c."clientId" = cl.id
LEFT JOIN "user" u ON cl.userid = u.id OR c."clientId" = u.id
WHERE c.status IN ('EN ATTENTE', 'PENDING')
ORDER BY c."createdAt" DESC;
```

**Résultat attendu**: Tous les comptes doivent avoir `✅ CORRECT`

---

## 🚀 Déploiement

### En Développement

```bash
# E-portal
cd /Users/gib/Documents/project/ebanking-web-app-with-api-momo
# Le fichier est déjà modifié, redémarrez juste le serveur si nécessaire
npm run dev
```

### En Production

1. Committez les changements:
   ```bash
   git add app/accounts/actions.ts
   git commit -m "fix: use client.id instead of user.id for account.clientId"
   ```

2. Corrigez les données existantes avec le SQL:
   ```sql
   -- Exécutez FIX_CLIENT_ID_QUICK.sql
   ```

3. Déployez la nouvelle version de l'e-portal

4. Testez le workflow complet

---

## 📚 Documentation Associée

- `REAL_PROBLEM_USER_VS_CLIENT_ID.md` - Explication détaillée du problème
- `FIX_CLIENT_ID_QUICK.sql` - Script SQL de correction
- `E_PORTAL_CLIENT_ID_ANALYSIS.md` - Analyse initiale du problème

---

## ✅ Checklist de Vérification

- [x] Modifier `createAccount()` pour récupérer client.id
- [x] Modifier `getAccounts()` pour filtrer par client.id
- [x] Ajouter des logs pour faciliter le débogage
- [ ] Tester la création d'un nouveau compte
- [ ] Tester la validation dans le back-office
- [ ] Tester la liste des comptes dans l'e-portal
- [ ] Corriger les comptes existants avec le SQL
- [ ] Déployer en production

---

**Date**: 24 Novembre 2025  
**Version**: 1.0.0  
**Status**: ✅ Corrections appliquées - Prêt à tester

