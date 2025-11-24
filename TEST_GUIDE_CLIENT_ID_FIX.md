# 🧪 Guide de Test - Correction clientId

## 🎯 Objectif

Vérifier que l'e-portal utilise maintenant le bon `clientId` (client.id au lieu de user.id)

---

## ⚙️ Prérequis

1. **Serveur Backend** en cours d'exécution sur `https://35.184.98.9:4000`
2. **E-portal** en cours d'exécution sur `http://localhost:3000`
3. **Back-office** en cours d'exécution sur `http://localhost:3001`
4. Un **compte user** existant pour tester

---

## 📋 Tests à Effectuer

### Test 1: Vérification en Base de Données

**But**: S'assurer qu'un client existe pour votre user

```sql
-- 1. Trouver votre user
SELECT id, email, firstName, lastName 
FROM "user" 
WHERE email = 'VOTRE_EMAIL@example.com';
-- Notez le user.id

-- 2. Vérifier que le client existe
SELECT id, userid, nomComplet, email, codeClient
FROM client 
WHERE userid = 'USER_ID_DE_L_ETAPE_1';
-- Notez le client.id (il est différent du user.id !)

-- 3. Si le client n'existe pas, vérifiez que AuthService l'a créé
-- Le client devrait avoir été créé automatiquement lors du signup
```

**✅ Résultat attendu**: Le client existe avec `userid = user.id`

---

### Test 2: Création d'un Nouveau Compte

#### Étapes:

1. **Ouvrez le navigateur** avec DevTools (F12)
2. **Allez dans l'onglet Console**
3. **Connectez-vous** à l'e-portal: http://localhost:3000
4. **Cliquez** sur "Ouvrir un compte"
5. **Remplissez** le formulaire:
   - Type de compte: Compte Courant
   - Nom du compte: "Mon nouveau compte"
   - Montant initial: 50000
6. **Remplissez** les infos KYC (étape 2)
7. **Soumettez** le formulaire

#### ✅ Vérifications:

**Dans la Console du navigateur**, vous devriez voir:
```
[CreateAccount] User ID: 6c6cac8f-ecde-43d8-afe2-ff48c1ad6320
[CreateAccount] Client ID found: 12345678-abcd-efgh-ijkl-mnopqrstuvwx
[CreateAccount] Client name: Jean Dupont
```

**Points importants**:
- ✅ `User ID` et `Client ID` sont **différents**
- ✅ `Client name` correspond à votre nom

**En base de données**:
```sql
-- Vérifier le compte créé
SELECT 
  id,
  "accountNumber",
  "clientId",
  status,
  "createdAt"
FROM compte 
ORDER BY "createdAt" DESC 
LIMIT 1;
```

**✅ Résultat attendu**: Le `clientId` doit être l'ID du client (12345678-...), **PAS** l'ID du user (6c6cac8f-...)

---

### Test 3: Validation dans le Back-Office

#### Étapes:

1. **Connectez-vous** au back-office: http://localhost:3001
2. **Allez** sur "Comptes": http://localhost:3001/comptes
3. **Trouvez** le compte que vous venez de créer (status "En attente")
4. **Cliquez** sur le bouton vert "Valider"

#### ✅ Vérifications:

**Le modal devrait s'ouvrir** et afficher:
- ✅ Les informations du compte
- ✅ Les informations du client (nom, email, téléphone)
- ✅ L'adresse complète
- ✅ Les détails de la pièce d'identité
- ✅ Les images de la pièce d'identité (si uploadées)
- ✅ Les boutons "Approuver" et "Rejeter"

**❌ PAS d'erreur 404** dans la console !

---

### Test 4: Liste des Comptes (E-Portal)

#### Étapes:

1. **Ouvrez** DevTools (F12) → Console
2. **Allez** sur "Mes comptes": http://localhost:3000/accounts

#### ✅ Vérifications:

**Dans la Console**:
```
[GetAccounts] Client ID for filtering: 12345678-abcd-efgh-ijkl-mnopqrstuvwx
```

**Sur la page**:
- ✅ Vous voyez uniquement **VOS** comptes
- ✅ Pas de comptes d'autres utilisateurs
- ✅ Le compte que vous venez de créer apparaît dans la liste

---

### Test 5: Approbation du Compte

#### Étapes:

1. **Dans le back-office**, avec le modal ouvert (Test 3)
2. **Vérifiez** les informations du client
3. **Cliquez** sur "Approuver le compte"

#### ✅ Vérifications:

**À l'écran**:
- ✅ Message de succès: "Compte approuvé avec succès. Le client sera notifié par email."
- ✅ Le modal se ferme
- ✅ Le compte disparaît de la liste des comptes "En attente"

**En base de données**:
```sql
SELECT id, "accountNumber", status, "clientId"
FROM compte 
WHERE "accountNumber" = 'VOTRE_NUMERO_DE_COMPTE';
```

**✅ Résultat attendu**: 
- `status` = 1 (Actif)
- `clientId` est toujours le client.id (pas changé)

**Email** (si Resend est configuré):
- ✅ Le client reçoit un email d'approbation

---

### Test 6: Vérification de l'Intégrité des Données

```sql
-- Cette requête vérifie que TOUS les comptes utilisent le bon clientId
SELECT 
  c.id AS compte_id,
  c."accountNumber",
  c."clientId" AS compte_clientId,
  c.status,
  cl.id AS client_id,
  cl.userid,
  u.id AS user_id,
  CASE 
    WHEN c."clientId" = cl.id AND cl.userid = u.id 
      THEN '✅ OK'
    WHEN c."clientId" = u.id 
      THEN '❌ ERREUR'
    ELSE '⚠️ AUTRE'
  END AS diagnostic
FROM compte c
LEFT JOIN client cl ON c."clientId" = cl.id
LEFT JOIN "user" u ON cl.userid = u.id OR c."clientId" = u.id
WHERE c."tenantId" = 'aa1287f6-06af-45b7-a905-8c57363565c2'
ORDER BY c."createdAt" DESC;
```

**✅ Résultat attendu**: 
- Tous les **nouveaux** comptes (créés après la correction) ont `✅ OK`
- Les **anciens** comptes (créés avant) peuvent avoir `❌ ERREUR` (à corriger avec le SQL)

---

## 🔧 Si un Test Échoue

### Erreur: "No client found for user"

**Cause**: Le client n'existe pas pour ce user  
**Solution**: 
```sql
-- Créer manuellement le client
INSERT INTO client (
  id,
  "nomComplet",
  email,
  "codeClient",
  userid,
  "tenantId",
  "createdAt",
  "updatedAt"
) 
SELECT 
  gen_random_uuid(),
  CONCAT(u."firstName", ' ', u."lastName"),
  u.email,
  CONCAT('CLI-', EXTRACT(EPOCH FROM NOW())::BIGINT),
  u.id,
  'aa1287f6-06af-45b7-a905-8c57363565c2',
  NOW(),
  NOW()
FROM "user" u
WHERE u.email = 'VOTRE_EMAIL@example.com';
```

### Erreur 404 dans le Back-Office

**Cause**: Les anciens comptes ont encore userId dans clientId  
**Solution**: Exécutez le script SQL de correction
```bash
# Fichier: back-office-bngEbanking/FIX_CLIENT_ID_QUICK.sql
psql -d votre_database -f FIX_CLIENT_ID_QUICK.sql
```

### Le compte n'apparaît pas dans "Mes comptes"

**Cause**: Le filtrage par clientId ne fonctionne pas  
**Vérification**:
```sql
-- Vérifier le clientId du compte
SELECT "clientId" FROM compte WHERE "accountNumber" = 'VOTRE_NUMERO';

-- Vérifier le client.id pour votre user
SELECT cl.id FROM client cl
INNER JOIN "user" u ON cl.userid = u.id
WHERE u.email = 'VOTRE_EMAIL@example.com';

-- Les deux devraient être identiques
```

---

## ✅ Checklist Finale

### Tests de Base
- [ ] Le client existe pour mon user (SQL)
- [ ] Création d'un nouveau compte fonctionne
- [ ] Les logs montrent userId et clientId différents
- [ ] Le compte est créé avec le bon clientId (SQL)

### Tests du Back-Office
- [ ] Le bouton "Valider" ouvre le modal
- [ ] Les infos du client s'affichent (pas d'erreur 404)
- [ ] Les infos KYC s'affichent
- [ ] L'approbation fonctionne
- [ ] Le statut passe à "Actif"

### Tests de l'E-Portal
- [ ] La liste "Mes comptes" affiche uniquement mes comptes
- [ ] Les logs montrent le bon clientId pour le filtrage
- [ ] Pas de comptes d'autres utilisateurs visibles

### Nettoyage
- [ ] Corriger les anciens comptes avec le SQL (si nécessaire)
- [ ] Vérifier l'intégrité des données (requête SQL Test 6)
- [ ] Tous les comptes ont `✅ OK` dans le diagnostic

---

## 📊 Tableau de Bord de Test

| Test | Status | Notes |
|------|--------|-------|
| 1. Vérification BDD | ⬜ | Client existe ? |
| 2. Création compte | ⬜ | Logs OK ? clientId correct ? |
| 3. Validation back-office | ⬜ | Modal s'ouvre ? Pas d'erreur 404 ? |
| 4. Liste comptes | ⬜ | Filtrage OK ? |
| 5. Approbation | ⬜ | Status devient Actif ? |
| 6. Intégrité données | ⬜ | Tous ✅ OK ? |

---

## 🚀 Après les Tests

Si tous les tests passent ✅ :

1. **Committez** les changements
2. **Déployez** en production
3. **Exécutez** le SQL de correction sur la prod (si anciens comptes)
4. **Testez** de nouveau en prod

---

**Date**: 24 Novembre 2025  
**Version**: 1.0.0  
**Status**: Guide de test complet

