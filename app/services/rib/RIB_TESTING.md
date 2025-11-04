# Guide de Test - Feature RIB (F-10)

## Checklist de Validation

### Test 1: Chargement de la Page
**Endpoint**: `/services/rib`
**Actions**:
1. Accéder à la page `/services/rib`
2. Attendre le chargement des données

**Résultats Attendus**:
- ✓ Page charge correctement
- ✓ Profil utilisateur récupéré et affiché
- ✓ Liste des comptes affichée
- ✓ Premier compte sélectionné par défaut

**Logs Attendus**:
```
[RIB] Profil utilisateur récupéré: [email_de_l'utilisateur]
[RIB] Comptes récupérés: [nombre_de_comptes]
[RIB] Comptes actifs avec données complètes: [nombre_de_comptes_actifs]
```

---

### Test 2: Affichage des Informations Utilisateur
**Cas**: Vérifier que les infos utilisateur réelles s'affichent

**Actions**:
1. Ouvrir la page RIB
2. Vérifier le titulaire du compte dans la section "Informations bancaires"

**Résultats Attendus**:
- ✓ Titulaire = `{firstName} {lastName}` de l'utilisateur connecté
- ✓ Pas de données codées en dur ("DIALLO Mamadou" ne doit pas s'afficher si c'est un autre utilisateur)
- ✓ Email disponible dans le profil récupéré

**Exemple**:
```
Titulaire du compte: Jean DUPONT  ← Au lieu de "DIALLO Mamadou"
```

---

### Test 3: Champs RIB Complets
**Cas**: Vérifier que tous les champs RIB sont présents

**Champs à Vérifier**:
- [ ] Titulaire du compte : `{firstName} {lastName}`
- [ ] Numéro de compte : `accountNumber` de l'API
- [ ] Code banque : `codeBanque` de l'API
- [ ] Code agence : `codeAgence` de l'API
- [ ] RIB : Combinaison formatée
- [ ] IBAN : Format `GN82 [BANK_CODE] [AGENCY_CODE] [ACCOUNT_NUMBER]`
- [ ] Code SWIFT : `BNGNGNCX`

**Exemple de RIB Complet**:
```
Titulaire: Jean DUPONT
Numéro: 0001234567890
Code Banque: BNG
Code Agence: 001
RIB: BNG 001 0001234567890
IBAN: GN82 BNG 001 0001234567890
SWIFT: BNGNGNCX
```

---

### Test 4: Multi-Comptes
**Cas**: Tester la sélection et l'affichage de plusieurs comptes

**Prérequis**: L'utilisateur doit avoir au moins 2 comptes

**Actions**:
1. Accéder à `/services/rib`
2. Vérifier que tous les comptes s'affichent dans le dropdown
3. Sélectionner un compte différent
4. Vérifier que les informations changent

**Résultats Attendus**:
- ✓ Tous les comptes actifs s'affichent
- ✓ Infos RIB changent au changement de sélection
- ✓ Solde correct pour chaque compte

---

### Test 5: Pré-sélection d'Compte via URL
**Cas**: Tester le paramètre `accountId` en URL

**Actions**:
1. Accéder à `/services/rib?accountId=xxx` (remplacer `xxx` par un ID de compte)
2. Attendre le chargement

**Résultats Attendus**:
- ✓ Compte pré-sélectionné automatiquement
- ✓ Message "Compte pré-sélectionné" s'affiche
- ✓ Badge "Suggéré" visible dans le dropdown

---

### Test 6: Téléchargement PDF
**Cas**: Générer et télécharger un RIB en PDF

**Actions**:
1. Sélectionner un compte
2. Cliquer sur "Télécharger PDF"
3. Attendre quelques secondes
4. Vérifier le téléchargement

**Résultats Attendus**:
- ✓ Un fichier PDF est téléchargé
- ✓ Nom du fichier : `RIB_[NUMERO_COMPTE]_[DATE].pdf`
- ✓ Exemple : `RIB_0001234567890_2024-11-03.pdf`

**Contenu PDF Attendu**:
```
=== En-tête ===
RELEVÉ D'IDENTITÉ BANCAIRE
Banque Nationale de Guinée
Date de génération

=== Tableau d'Infos ===
Titulaire: Jean DUPONT
Numéro de compte: 0001234567890
Code banque: BNG
Code agence: 001
IBAN: GN82 BNG 001 0001234567890
SWIFT: BNGNGNCX
Type: Courant
Devise: GNF

=== Pied de page ===
Document valide pour les échanges bancaires
```

---

### Test 7: Export TXT (Fallback)
**Cas**: Tester le fallback TXT si la génération PDF échoue

**Comment Forcer**:
1. Ouvrir DevTools (F12)
2. Aller dans Console
3. Exécuter:
```javascript
window.jsPDF = undefined; // Simuler l'absence de jsPDF
```
4. Cliquer sur "Télécharger PDF"

**Résultats Attendus**:
- ✓ Fichier TXT téléchargé à la place
- ✓ Contenu en texte brut avec toutes les infos
- ✓ Pas d'erreur en console

---

### Test 8: Copie IBAN
**Cas**: Tester la copie de l'IBAN dans le presse-papiers

**Actions**:
1. Sélectionner un compte
2. Cliquer sur "Copier IBAN"
3. Attendre le message "Copié !"
4. Coller quelque part (Ctrl+V)

**Résultats Attendus**:
- ✓ Bouton affiche "Copié !" pendant 2 secondes
- ✓ IBAN est dans le presse-papiers
- ✓ Revient à "Copier IBAN" après 2s

---

### Test 9: Gestion des Erreurs API
**Cas**: Tester le comportement quand l'API est indisponible

**Comment Simuler**:
1. Arrêter le serveur backend
2. Accéder à `/services/rib`

**Résultats Attendus**:
- ✓ Page charge quand même
- ✓ Données de test s'affichent
- ✓ Console affiche les erreurs API
- ✓ Les boutons de téléchargement restent fonctionnels

---

### Test 10: Sélection de Type de Compte
**Cas**: Vérifier que les types de comptes sont correctement affichés

**Comptes à Tester**:
- [ ] Compte Courant → Icône Wallet
- [ ] Compte Épargne → Icône PiggyBank
- [ ] Compte Devise → Icône DollarSign

---

### Test 11: Formatage des Montants
**Cas**: Vérifier le formatage des soldes

**Actions**:
1. Vérifier le "Solde actuel" en bas à droite

**Résultats Attendus**:
```
Montants GNF:
- Affichage français : "2 500 000 GNF"
- Séparateur : espace

Montants USD/autres:
- Format international
- Symbole monétaire
- Exemple: "$1,234.50"
```

---

### Test 12: Cas Sans Profil Utilisateur
**Cas**: Si l'API `/auth/me` retourne une erreur

**Résultats Attendus**:
- ✓ Titulaire affiche "Titulaire du compte"
- ✓ Les autres infos restent intactes
- ✓ Page reste fonctionnelle

---

## Données de Test Recommandées

```sql
-- Créer un utilisateur de test avec infos complètes
INSERT INTO users (
  id, firstName, lastName, email, phoneNumber, createdAt, updatedAt
) VALUES (
  'test-user-1', 'Jean', 'DUPONT', 'jean.dupont@test.com', '+224622123456', NOW(), NOW()
);

-- Créer des comptes de test
INSERT INTO comptes (
  id, accountId, accountNumber, accountName, currency, 
  bookBalance, availableBalance, status, type, 
  codeAgence, codeBanque, cleRib, clientId, tenantId
) VALUES 
(
  'acc-1', 'ACC001', '0001234567890', 'Compte Courant Principal', 'GNF',
  '2500000', '2350000', 'ACTIF', 'CURRENT',
  '001', 'BNG', '12', 'test-user-1', 'tenant-1'
),
(
  'acc-2', 'ACC002', '0001234567891', 'Compte Épargne', 'GNF',
  '5000000', '5000000', 'ACTIF', 'SAVINGS',
  '001', 'BNG', '23', 'test-user-1', 'tenant-1'
);
```

---

## Validation Finale

**Checklist Complète**:
- [ ] Test 1: Chargement ✓
- [ ] Test 2: Infos Utilisateur ✓
- [ ] Test 3: Champs RIB ✓
- [ ] Test 4: Multi-Comptes ✓
- [ ] Test 5: Pré-sélection URL ✓
- [ ] Test 6: Téléchargement PDF ✓
- [ ] Test 7: Fallback TXT ✓
- [ ] Test 8: Copie IBAN ✓
- [ ] Test 9: Erreurs API ✓
- [ ] Test 10: Types de Comptes ✓
- [ ] Test 11: Formatage Montants ✓
- [ ] Test 12: Sans Profil ✓

**Statut**: 🟢 Feature Complète et Testée

---

## Commandes Utiles

### Logs en Console
```javascript
// Voir les logs RIB
console.log("Chercher 'RIB' dans la console");

// Vérifier les données chargées
localStorage.getItem('user'); // Infos utilisateur
```

### Requêtes API à Tester
```bash
# Récupérer le profil utilisateur
curl -H "Authorization: Bearer TOKEN" \
  https://api.example.com/api/auth/me

# Récupérer les comptes
curl -H "Authorization: Bearer TOKEN" \
  https://api.example.com/api/tenant/TENANT_ID/compte

# Récupérer un compte spécifique
curl -H "Authorization: Bearer TOKEN" \
  https://api.example.com/api/tenant/TENANT_ID/compte/ACCOUNT_ID
```

---

## Notes de Performance

- Temps de chargement attendu: < 2s
- Génération PDF: < 1s
- Téléchargement: Dépend de la connexion
- Pas de requêtes N+1 (une requête par compte)
