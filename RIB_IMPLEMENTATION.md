# Feature F-10 : Relevé d'Identité Bancaire (RIB)

## Description
Génération et téléchargement automatiques du Relevé d'Identité Bancaire (RIB) pour chaque compte bancaire de l'utilisateur.

## Fonctionnalités

### 1. Génération Automatique du RIB
- Récupération automatique des informations utilisateur et des comptes via l'API
- Génération des informations complètes du RIB incluant :
  - Titulaire du compte (prénom + nom de l'utilisateur)
  - Numéro de compte
  - Code banque (codeBanque)
  - Code agence (codeAgence)
  - IBAN formaté
  - Clé RIB (cleRib)
  - Code SWIFT de la banque

### 2. Téléchargement du Document
- Export en PDF professionnel avec mise en page bancaire standard
- Export en TXT comme fallback si la génération PDF échoue
- Format de fichier : `RIB_[NUMERO_COMPTE]_[DATE].pdf`

### 3. Gestion Multi-Comptes
- Sélection du compte pour affichage et génération du RIB
- Support de plusieurs types de comptes : Courant, Épargne, Devise
- Pré-sélection automatique du compte si disponible en URL (paramètre `accountId`)

## Architecture

### Fichiers Modifiés/Créés

#### 1. `/app/services/rib/actions.ts` (Nouveau)
Server actions pour récupérer les données du backend :
- `getUserProfile()` : Récupère les infos utilisateur (firstName, lastName, email, etc.)
- `getAccountForRib(accountId)` : Récupère les infos complètes du compte
- `generateRibData()` : Génère la structure RIB formatée

#### 2. `/app/services/rib/page.tsx` (Modifié)
Page client pour afficher et télécharger le RIB :
- Chargement des profils utilisateur et des comptes
- Enrichissement des données de compte avec les infos RIB
- Interface interactive de sélection et téléchargement
- Génération PDF avec jsPDF

### Flux de Données

\`\`\`
API Backend
    ↓
[getUserProfile()] → Récupère firstName, lastName, email, etc.
[getAccounts()] → Récupère la liste des comptes
[getAccountForRib()] → Récupère les détails du compte (codeBanque, codeAgence, cleRib, etc.)
    ↓
[generateRibData()] → Formate les données en structure RIB
    ↓
Page RIB → Affiche et permet téléchargement
\`\`\`

## Champs API Utilisés

### De `getUserProfile()` (endpoint: `/auth/me`)
\`\`\`typescript
{
  id: string
  firstName?: string
  lastName?: string
  fullName?: string
  email: string
  phoneNumber?: string
}
\`\`\`

### De `getAccountForRib()` (endpoint: `/tenant/{TENANT_ID}/compte/{accountId}`)
\`\`\`typescript
{
  id: string
  accountId: string
  accountNumber: string
  accountName: string
  currency: string
  bookBalance: string
  availableBalance: string
  status: string
  type: string
  codeAgence?: string
  codeBanque?: string
  cleRib?: string
  clientId: string
}
\`\`\`

## Exemples

### Affichage des Informations RIB
\`\`\`
TITULAIRE : DIALLO Mamadou
IBAN : GN82 BNG 001 0001234567890
RIB : BNG 001 0001234567890[CLÉRIB]
SWIFT : BNGNGNCX
Agence : Agence Kaloum
\`\`\`

### Téléchargement du PDF
- Clic sur le bouton "Télécharger PDF"
- Le fichier est généré avec un design professionnel
- Formatage automatique : RIB_0001234567890_2024-11-03.pdf

## Gestion des Erreurs

### Cas 1 : API indisponible
- Fallback automatique avec données de test
- Interface reste fonctionnelle

### Cas 2 : Génération PDF échoue
- Export en fichier TXT comme format alternatif
- Message utilisateur explicite

### Cas 3 : Pas de profil utilisateur
- Utilisation de "TITULAIRE DU COMPTE"
- Les infos du compte sont toujours affichées

## Améliorations Futures

1. **Envoi par email** : Générer le RIB et l'envoyer via SMTP
2. **Impression** : Support de l'impression directe depuis le navigateur
3. **Archivage** : Stocker les RIB générés avec horodatage
4. **Historique** : Afficher l'historique des RIB générés
5. **Signature numérique** : Ajouter une signature numérique au PDF
6. **Multi-devise** : Support de plusieurs devises pour l'IBAN

## Tests Recommandés

- [ ] Téléchargement PDF pour compte simple
- [ ] Sélection multi-comptes
- [ ] Vérification des informations utilisateur affichées
- [ ] Export en TXT (fallback)
- [ ] Pré-sélection d'un compte via URL
- [ ] Comportement sans profil utilisateur
- [ ] Gestion des comptes en devise

## Notes Techniques

- Les données sont chargées via server actions pour la sécurité
- Cache désactivé (`cache: "no-store"`) pour toujours avoir les données fraîches
- Support du format IBAN international (GN82 BNG 001 ...)
- Format du RIB : `codeBanque + codeAgence + accountNumber + cleRib`
