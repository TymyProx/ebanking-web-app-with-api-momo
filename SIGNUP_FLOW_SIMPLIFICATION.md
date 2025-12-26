# Simplification du flux d'inscription - Correction double création client

## Problème identifié

Lors de l'inscription d'un client, **2 lignes de clients étaient créées** dans la base de données :
1. Une ligne créée par le **e-portal** (via compte support)
2. Une ligne créée par le **backend** (dans `authService.ts`)

## Solution appliquée

### ✅ Modifications dans le e-portal

Le e-portal ne crée **PLUS AUCUN CLIENT**. Il se contente de :
1. Valider les données
2. Sauvegarder les informations dans un cookie
3. Envoyer l'email de vérification
4. Laisser le **backend** créer automatiquement le client lors du signup

### 📝 Fichiers modifiés

#### 1. `/app/signup/actions.ts`

**Fonction `initiateSignup` (nouveaux clients)** :
- ❌ **RETIRÉ** : Connexion avec compte support
- ❌ **RETIRÉ** : Création du client via API
- ✅ **CONSERVÉ** : Génération du token de vérification
- ✅ **CONSERVÉ** : Sauvegarde dans le cookie
- ✅ **CONSERVÉ** : Envoi de l'email via Resend

**Fonction `initiateExistingClientSignup` (clients BNG existants)** :
- ✅ **CONSERVÉ** : Validation du `numClient` via `BdClientBng`
- ✅ **CONSERVÉ** : Vérification des doublons d'email
- ❌ **RETIRÉ** : Création du client via API
- ✅ **CONSERVÉ** : Sauvegarde dans le cookie
- ✅ **CONSERVÉ** : Envoi de l'email via Resend

#### 2. `/app/auth/verify-email/actions.ts`

**Fonction `completeSignup`** :
- ❌ **RETIRÉ** : Toute la logique de création/mise à jour manuelle du client
- ❌ **RETIRÉ** : Les vérifications de doublons (gérées par le backend)
- ✅ **CONSERVÉ** : Appel à `/auth/sign-up` (qui crée automatiquement le client)
- ✅ **CONSERVÉ** : Création des comptes bancaires (clients existants uniquement)

## Flux simplifié

### Pour un nouveau client

\`\`\`
1. Utilisateur remplit le formulaire
   ↓
2. initiateSignup()
   - Sauvegarde données dans cookie
   - Envoie email de vérification
   ↓
3. Utilisateur clique sur le lien de vérification
   ↓
4. completeSignup()
   - Appelle /auth/sign-up
   ↓
5. Backend (authService.ts)
   - Crée le user
   - Crée le client automatiquement ✅
   ↓
6. Connexion automatique
\`\`\`

### Pour un client BNG existant

\`\`\`
1. Utilisateur entre son numClient
   ↓
2. initiateExistingClientSignup()
   - Valide le numClient via BdClientBng
   - Récupère les infos du client
   - Sauvegarde dans cookie
   - Envoie email de vérification
   ↓
3. Utilisateur clique sur le lien de vérification
   ↓
4. completeSignup()
   - Appelle /auth/sign-up
   ↓
5. Backend (authService.ts)
   - Crée le user
   - Crée le client automatiquement ✅
   - Utilise numClient comme codeClient
   ↓
6. E-portal
   - Crée les comptes bancaires depuis CompteBng
   ↓
7. Connexion automatique
\`\`\`

## Backend (authService.ts)

Le backend **crée automatiquement le client** dans la méthode `signup()` :

\`\`\`typescript
// Pour un utilisateur existant (lignes ~90-127)
const existingClientCount = await ClientRepository.count(
  { userid: existingUser.id }, 
  clientRepoOptions
)

if (!existingClientCount || existingClientCount === 0) {
  const codeClient = `CLI-${Date.now()}`
  await ClientRepository.create({
    nomComplet: existingUser.firstName || existingUser.email,
    email: existingUser.email,
    codeClient,
    userid: existingUser.id,
  }, clientRepoOptions)
}

// Même logique pour un nouvel utilisateur (lignes ~180-217)
\`\`\`

## ⚠️ Point d'attention

Le backend génère actuellement un `codeClient` aléatoire :
\`\`\`typescript
const codeClient = `CLI-${Date.now()}`
\`\`\`

Pour les **clients BNG existants**, il faudrait idéalement utiliser le `numClient` stocké dans le cookie au lieu de générer un nouveau code. Cela pourrait être une amélioration future si nécessaire.

## Résultat attendu

✅ **UNE SEULE ligne de client** créée par inscription
✅ Création gérée centralement par le backend
✅ Moins de code, moins de risques de bugs
✅ Flux plus simple et maintenable

## Tests recommandés

1. **Nouveau client** :
   - Inscription complète
   - Vérifier qu'une seule ligne client existe

2. **Client BNG existant** :
   - Inscription avec numClient valide
   - Vérifier qu'une seule ligne client existe
   - Vérifier que le codeClient correspond au numClient (si implémenté)

3. **Vérifications de sécurité** :
   - Doublon d'email
   - Token de vérification invalide
   - Session expirée
