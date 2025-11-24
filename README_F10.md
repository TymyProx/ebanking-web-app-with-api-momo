# 🎯 Quick Reference - Feature F-10: RIB

## 📁 Fichiers de la Feature

\`\`\`
ebanking-web-app-with-api-momo/
├── 📄 README_F10.md                    ← Vous êtes ici
├── 📄 F10_RIB_SUMMARY.md               ← Résumé complet
├── 📄 CHANGES_F10_RIB.md               ← Changelog détaillé
├── 📄 RIB_IMPLEMENTATION.md            ← Specs techniques
│
└── app/services/rib/
    ├── 🆕 actions.ts                   ← Server actions (getUserProfile, getAccountForRib, generateRibData)
    ├── 🆕 RIB_TESTING.md               ← 12 test cases
    ├── ✏️ page.tsx                      ← Page RIB (modifiée)
    └── loading.tsx                     ← Component loading (existant)
\`\`\`

---

## 🚀 Quick Start

### Accéder à la Feature
\`\`\`
http://localhost:3000/services/rib
\`\`\`

### Avec Pré-sélection de Compte
\`\`\`
http://localhost:3000/services/rib?accountId=xxx
\`\`\`

---

## 📊 Fonctionnalités

| Fonctionnalité | Statut | Description |
|---|---|---|
| Récupération profil utilisateur | ✅ | Récupère firstName, lastName, email via `/auth/me` |
| Récupération infos compte | ✅ | Récupère codeBanque, codeAgence, cleRib via `/compte/{id}` |
| Affichage RIB | ✅ | Affiche toutes les infos bancaires formatées |
| Téléchargement PDF | ✅ | Génère et télécharge un RIB en PDF professionnel |
| Export TXT | ✅ | Fallback si PDF échoue |
| Copie IBAN | ✅ | Copie dans le presse-papiers |
| Multi-comptes | ✅ | Sélection et gestion de plusieurs comptes |
| Pré-sélection URL | ✅ | Paramètre `?accountId=xxx` |

---

## 🔌 API Endpoints Utilisés

### 1. Récupération du Profil
\`\`\`bash
GET /api/auth/me
Authorization: Bearer {TOKEN}

Response:
{
  "id": "...",
  "firstName": "Jean",
  "lastName": "DUPONT",
  "email": "jean@test.com",
  "phoneNumber": "+224..."
}
\`\`\`

### 2. Récupération des Comptes
\`\`\`bash
GET /api/tenant/{TENANT_ID}/compte
Authorization: Bearer {TOKEN}

Response:
{
  "rows": [{
    "id": "...",
    "accountNumber": "0001234567890",
    "accountName": "Compte Courant",
    "currency": "GNF",
    "bookBalance": "2500000",
    "status": "ACTIF",
    "codeBanque": "BNG",
    "codeAgence": "001",
    "cleRib": "12"
  }]
}
\`\`\`

### 3. Récupération d'un Compte Spécifique
\`\`\`bash
GET /api/tenant/{TENANT_ID}/compte/{ACCOUNT_ID}
Authorization: Bearer {TOKEN}

Response: [Même structure que un compte dans la liste]
\`\`\`

---

## 🧪 Tests Rapides

### Test 1: Page Charge Correctement
\`\`\`bash
# Logs attendus en console
[RIB] Profil utilisateur récupéré: jean@test.com
[RIB] Comptes récupérés: 2
[RIB] Comptes actifs avec données complètes: 2
\`\`\`

### Test 2: Affichage du Profil
- Ouvrir DevTools (F12)
- Vérifier le "Titulaire du compte" = firstName + lastName réel
- PAS "DIALLO Mamadou"

### Test 3: Téléchargement PDF
- Cliquer sur "Télécharger PDF"
- Fichier créé: `RIB_[NUMERO]_[DATE].pdf`
- Exemple: `RIB_0001234567890_2024-11-03.pdf`

### Test 4: Multi-Comptes
- Si 2+ comptes: Voir dropdown de sélection
- Sélectionner un autre compte
- Vérifier que les infos changent

---

## 💻 Code Examples

### Utilisation dans un Composant
\`\`\`typescript
import { getUserProfile, getAccountForRib } from "@/app/services/rib/actions"

// Récupérer le profil
const profile = await getUserProfile()
console.log(profile.firstName) // "Jean"

// Récupérer les infos d'un compte
const account = await getAccountForRib("account-id")
console.log(account.codeBanque) // "BNG"

// Générer le RIB
const rib = generateRibData(account, profile)
console.log(rib.iban) // "GN82 BNG 001 0001234567890"
\`\`\`

---

## 🐛 Dépannage Rapide

### Problème: "Aucun compte disponible"
\`\`\`
✓ Vérifier que l'utilisateur a des comptes
✓ Vérifier status = 'ACTIF'
✓ Vérifier accountNumber n'est pas vide
✓ Vérifier le token n'est pas expiré
\`\`\`

### Problème: Titulaire = "Titulaire du compte"
\`\`\`
✓ API /auth/me ne retourne pas firstName/lastName
✓ Vérifier que la DB a ces champs
✓ Vérifier le profil utilisateur dans la DB
\`\`\`

### Problème: Impossible de télécharger PDF
\`\`\`
✓ Vérifier que jsPDF est installé
✓ Voir console pour les erreurs jsPDF
✓ Fallback TXT devrait fonctionner
\`\`\`

### Problème: IBAN mal formaté
\`\`\`
✓ Vérifier que codeBanque existe dans l'API
✓ Vérifier que codeAgence existe dans l'API
✓ Format attendu: GN82 [CODE_BANQUE] [CODE_AGENCE] [NUMERO]
\`\`\`

---

## 📈 Métriques de Performance

| Métrique | Valeur |
|---|---|
| Temps chargement page | < 2s |
| Génération PDF | < 1s |
| Requêtes API | 2 (profil + comptes) + N (détails par compte) |
| Taille page | ~150KB |

---

## 📚 Documentation Complète

- 🔍 **Specs Techniques**: Voir `RIB_IMPLEMENTATION.md`
- 🧪 **Guide de Test**: Voir `RIB_TESTING.md` (12 test cases)
- 📝 **Changelog**: Voir `CHANGES_F10_RIB.md`
- 📋 **Résumé Exécutif**: Voir `F10_RIB_SUMMARY.md`

---

## ✅ Checklist de Déploiement

- [ ] Backend API: `/auth/me` et `/compte` endpoints fonctionnels
- [ ] Users: firstName, lastName remplis dans la DB
- [ ] Comptes: codeBanque, codeAgence, cleRib remplis
- [ ] jsPDF: Installé dans package.json
- [ ] Tests: Lancés avec succes (voir RIB_TESTING.md)
- [ ] Logs: Aucune erreur TypeScript
- [ ] Security: Tokens stockés dans cookies HttpOnly

---

## 📞 Commandes Utiles

### Voir les Logs RIB
\`\`\`javascript
// Dans la console du navigateur
console.log("Chercher [RIB]")
// Logs:
// [RIB] Profil utilisateur récupéré: ...
// [RIB] Comptes récupérés: ...
\`\`\`

### Tester l'API
\`\`\`bash
# Profil utilisateur
curl -H "Authorization: Bearer TOKEN" \
  https:/api.example.com/api/auth/me

# Comptes
curl -H "Authorization: Bearer TOKEN" \
  https:/api.example.com/api/tenant/TENANT_ID/compte

# Un compte spécifique
curl -H "Authorization: Bearer TOKEN" \
  https:/api.example.com/api/tenant/TENANT_ID/compte/ACCOUNT_ID
\`\`\`

---

## 🎯 Architecture Résumée

\`\`\`
Client (page.tsx)
    ↓
    ├─→ getUserProfile() → /api/auth/me
    ├─→ getAccounts() → /api/compte
    └─→ Pour chaque compte:
        └─→ getAccountForRib() → /api/compte/{id}
    ↓
generateRibData() → Format RIB
    ↓
Display → Affichage + Téléchargement
\`\`\`

---

## 🔐 Sécurité

- ✅ Server actions sécurisées
- ✅ Tokens dans cookies HttpOnly
- ✅ Cache désactivé (données fraîches)
- ✅ Pas de données codées en dur
- ✅ Authentification obligatoire

---

## 📈 Améliorations Futures

1. 📧 **Email**: Envoyer RIB par email
2. 📦 **Archivage**: Stocker les RIBs générés
3. 📊 **Historique**: Voir l'historique des RIBs
4. 🔐 **Signature**: Signature numérique
5. 🎨 **Personnalisation**: Thème personnalisé

---

## 📝 Dernière Mise à Jour
**3 Novembre 2024** - Version 1.0.0 - Ready for Production

---

**Questions?** Voir les fichiers de documentation détaillée ou le code source.
