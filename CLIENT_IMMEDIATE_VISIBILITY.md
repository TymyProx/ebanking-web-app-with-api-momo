# Visibilité Immédiate des Clients dans le Back Office

## 📋 Résumé

Les clients apparaissent maintenant **immédiatement** dans le back office dès leur inscription sur le portail e-banking, **avant même** la vérification de leur email.

## ✅ Modifications Effectuées

### 1. Création Immédiate du Client (`app/signup/actions.ts`)

#### `initiateSignup` (Nouveaux clients)
- ✅ Le client est créé immédiatement lors de l'inscription
- ✅ Création avec `emailVerified: false` et `status: 0` (restreint)
- ✅ Le `clientId` est stocké dans le cookie pour la mise à jour ultérieure

#### `initiateExistingClientSignup` (Clients existants BNG)
- ✅ Le client existant est créé immédiatement dans la base
- ✅ Utilise les données de `BdClientBng`
- ✅ Même système de statut et vérification

### 2. Mise à Jour après Vérification (`app/auth/verify-email/actions.ts`)

#### `completeSignup`
- ✅ Met à jour le client existant au lieu d'en créer un nouveau
- ✅ Active le client (`status: 1`) après vérification
- ✅ Marque l'email comme vérifié (`emailVerified: true`)
- ✅ Associe le `userid` créé lors du sign-up
- ✅ Fallback vers l'ancienne logique si pas de `clientId` dans le cookie

### 3. Affichage dans le Back Office (`app/clients/page.tsx`)

#### Badge de Vérification
- ✅ Nouvelle colonne "Vérification" dans la liste des clients
- ✅ Badge jaune "Email non vérifié" pour les clients non vérifiés
- ✅ Aucun badge si l'email est vérifié

## 🔄 Flux Complet

### Nouveau Client

\`\`\`
1. Client s'inscrit sur le e-portal
   ↓
2. [NOUVEAU] Client créé immédiatement dans la base
   - emailVerified: false
   - status: 0 (Restreint)
   - userid: null
   ↓
3. Email de vérification envoyé
   ↓
4. [VISIBLE] Client apparaît dans le back office avec badge "Email non vérifié"
   ↓
5. Client clique sur le lien de vérification
   ↓
6. Client mis à jour:
   - emailVerified: true
   - status: 1 (Actif)
   - userid: [ID de l'utilisateur créé]
   ↓
7. Badge "Email non vérifié" disparaît dans le back office
\`\`\`

### Client Existant (BNG)

\`\`\`
1. Client s'inscrit avec son numClient
   ↓
2. Données récupérées depuis BdClientBng
   ↓
3. [NOUVEAU] Client créé immédiatement dans la base
   - Données depuis BdClientBng
   - emailVerified: false
   - status: 0 (Restreint)
   ↓
4. Email d'activation envoyé
   ↓
5. [VISIBLE] Client apparaît dans le back office
   ↓
6. Client vérifie son email
   ↓
7. Client activé (status: 1, emailVerified: true)
\`\`\`

## 🎨 Interface Back Office

### Avant
\`\`\`
Code Client | Nom | Email | Téléphone | Statut | Date création | Actions
\`\`\`

### Après
\`\`\`
Code Client | Nom | Email | Téléphone | Statut | Vérification | Date création | Actions
                                                    [Email non vérifié]  ← Badge jaune
\`\`\`

## 🔐 Sécurité

- ✅ Les clients non vérifiés ont un statut "Restreint" (0)
- ✅ Ils ne peuvent pas se connecter avant vérification
- ✅ Le back office peut les voir et les gérer
- ✅ Badge visuel pour identifier facilement les clients non vérifiés

## 📊 Avantages

1. **Visibilité immédiate** : Les administrateurs voient les nouvelles inscriptions instantanément
2. **Meilleur suivi** : Possibilité de relancer les clients qui n'ont pas vérifié leur email
3. **Gestion proactive** : Les administrateurs peuvent contacter les clients même avant vérification
4. **Transparence** : État de vérification clairement visible

## 🔧 Configuration Backend Requise

Le backend doit supporter:
- ✅ Champ `emailVerified` (boolean) dans le modèle Client
- ✅ Possibilité de créer un client avec `userid: null`
- ✅ Endpoint PATCH pour mettre à jour un client existant

## 🧪 Tests Recommandés

1. Inscription d'un nouveau client
   - Vérifier l'apparition immédiate dans le back office
   - Vérifier le badge "Email non vérifié"
   
2. Vérification de l'email
   - Vérifier la disparition du badge
   - Vérifier le changement de statut (Restreint → Actif)

3. Inscription d'un client existant
   - Vérifier la récupération des données BdClientBng
   - Vérifier l'apparition dans le back office

## 📝 Notes Techniques

- Le `clientId` est stocké dans le cookie `pending_signup_data`
- Timeout du cookie : 24 heures
- Fallback vers l'ancienne logique si pas de `clientId`
- Support token utilisé pour la création initiale du client

## ⚠️ Points d'Attention

1. Les clients non vérifiés ont `status: 0` (Restreint)
2. Le `userid` est mis à jour uniquement après vérification
3. Les erreurs de création de client sont loggées mais n'empêchent pas l'envoi de l'email
