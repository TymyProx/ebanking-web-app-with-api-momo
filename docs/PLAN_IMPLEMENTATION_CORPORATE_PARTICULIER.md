# BNG Connect — eBanking Corporate (Individuel & Entreprise)
## Plan d'implémentation basé sur le code existant et la procédure d'abonnement BNG

Version 1.5 — 10/09/2026 — Proxyma Technologies
(v1.5 : terminologie BNG « Entreprise individuelle » / « Société » §13.7, correction étape B multi-utilisateurs ; v1.4 : identité visuelle par espace §13.6 et instructions de déploiement §13.7 ; v1.3 : décision « deux applications Corporate distinctes », monorepo et état d'implémentation — voir §13 ; v1.2 : alignement sur la « Procédure d'inscription d'abonné eBanking BNG » transmise par le chef de projet ; v1.1 : ajout du segment Corporate Entreprise)

---

## 1. Synthèse

L'application Particulier existante est une application **Next.js 15 (App Router) + TypeScript + shadcn/ui**, avec des *server actions* qui appellent le backend Astra (`/api/tenant/{TENANT_ID}/...`, `/api/auth/...`). L'authentification repose sur un cookie `token` (JWT) et `/auth/me` ; l'entité `Client` porte déjà un champ `clientType`.

La procédure BNG fixe trois points structurants :

1. **L'abonnement se fait exclusivement en agence.** Le client dépose un formulaire signé et cacheté ; l'agent BNG le traite dans le **back-office BNGConnect** à partir des données KYC de **T24** (non modifiables). Il n'y a **pas d'auto-inscription ni de dossier KYC en ligne** — ce qui confirme et renforce la désactivation actuelle de `/signup`.
2. **L'échange avec T24 se fait par fichiers FTP** (fichier d'abonné déposé dans `IN`, relevés des 3 derniers mois et fichier client mis à jour récupérés dans `OUT`), avec deux notifications e-mail au client : prise en charge, puis lien de création des identifiants.
3. **Le Corporate Entreprise repose sur des profils à poids de signature** : `Saisir Ordre`, `Val1`, `Val2`, `Val3`, `Val4` (réservé au DG, **obligatoire** sur tout ordre), avec trois combinaisons de validation admises et un plafond optionnel par profil. Ces profils s'appliquent aux **virements, bénéficiaires et réclamations**.

**Terminologie retenue (BNG, 10/09/2026)** : les segments s'appellent désormais **« Entreprise individuelle »** (anciennement « Corporate Particulier ») et **« Société »** (anciennement « Corporate Entreprise »). Ce changement ne porte que sur les libellés affichés ; les codes techniques `CORPORATE_INDIVIDUEL` et `CORPORATE_ENTREPRISE` restent inchangés en base, dans les API et dans les noms de dossiers et de variables d'environnement.

Segments cibles :

| Segment (code technique) | Libellé BNG | Qui | Abonnement | Caractéristique structurante |
|---|---|---|---|
| `PARTICULIER` | **Particulier** | Personne physique | Existant | 1 utilisateur = 1 client (existant) |
| `CORPORATE_INDIVIDUEL` | **Entreprise individuelle** | Entrepreneur, commerçant, profession libérale | **Idem Particulier** (formulaire Particulier / entreprise individuelle) | Formats de relevés pro (AFB120…), plafonds, 1 utilisateur |
| `CORPORATE_ENTREPRISE` | **Société** | Société (DG signataire) | Formulaire Société listant les utilisateurs habilités (nom + e-mail) et leurs profils | **N utilisateurs pour 1 client**, profils `Saisir Ordre` / `Val1..Val4`, circuit de validation |

Principe technique (révisé v1.3, décision du chef d'équipe) :

> **Une seule base de code partagée, mais trois applications déployées séparément** (Particulier, Corporate Particulier, Corporate Entreprise). Chaque application ne sert qu'un segment ; le « profil utilisateur » est résolu à la connexion et les règles de gestion sont pilotées par le segment et le profil (UI *et* server actions).

Effort estimé pour le **périmètre de lancement** (§8) : **~11 à 13 semaines** front + backend Astra + intégration T24/FTP, détaillé en §9. Les fonctions hors lancement (paiements de masse, international, MT940 intraday, multi-entités…) sont listées en §10 pour une phase 2.

---

## 2. État de l'existant (constat code)

| Module | Fichiers clés | Ce qui existe | Limites relevées |
|---|---|---|---|
| Auth / session | `middleware.ts`, `lib/auth-service.ts`, `app/api/auth/*`, `app/auth/accept-invite/page.tsx` | Cookie `token`, `/auth/me`, rôles dans `user.tenants[].roles`, **activation par lien d'invitation** (déjà conforme au 2ᵉ e-mail de la procédure), idle timeout | Aucune notion de segment ni de profil `Saisir Ordre`/`Val` ; lien implicite `user.id = client.userid` |
| Navigation | `lib/portal-navigation-data.ts`, `components/layout/sidebar.tsx` | Menu statique unique | Pas de filtrage par segment / profil |
| Comptes / relevés | `app/accounts/statements/*`, `app/api/pdf/statement/route.ts`, `lib/statement-period-utils.ts` | **PDF** (backend `/pdf/statement`) et **Excel** (ExcelJS) ; soldes `/sttm` ; e-mail Resend | `generateStatement()` partiellement simulé ; pas de CSV, AFB120, MT940 ; pas d'avis de débit/crédit |
| Virements | `app/transfers/new/*` | 3 parcours BNG (compte-à-compte, bénéficiaire, ponctuel 18 chiffres), OTP, contrôle de propriété, solde, POST `/epayments` (`PENDING`) | Aucun plafond, pas de circuit `Saisir Ordre` → `Val`, frais/validation bénéficiaire simulés |
| Bénéficiaires | `app/transfers/beneficiaries/actions.ts` | CRUD, `create-and-activate`, favoris | Activation immédiate, pas de validation |
| Réclamations | `app/services/reclamation/*`, `app/complaints/*` | Saisie et suivi | Pas de validation par profil |
| Inscription | `app/signup/*`, `app/auth/verify-email/actions.ts` | Parcours en ligne (désactivé dans `middleware.ts`) | À **conserver désactivé** conformément à la procédure ; le code `signup` devient hors périmètre |
| Profil | `app/profile/actions.ts` | `user` + `client` + `ClientAdditionalInfo` | Champs personne physique uniquement |
| Back-office | dépôt séparé (`back-office-bngEbanking`) | Création des accès clients, invitations | À étendre : racine/compte, affichage KYC T24, validation, gestion des profils, génération du fichier d'abonné |

---

## 3. Architecture cible

### 3.1 Modèle de données (backend Astra)

```
Client
  segment            : "PARTICULIER" | "CORPORATE_INDIVIDUEL" | "CORPORATE_ENTREPRISE"
  racine             : racine client T24 (clé de rapprochement)
  kycSource          : "T24"  — données KYC en lecture seule (nomComplet, adresse, tel, DG…)
  subscription       : { status : "SAISIE" | "VALIDE_AGENCE" | "FICHIER_DEPOSE" | "ACTIVE_T24" | "ACTIF",
                         fichierAbonneRef, dateDepotIn, dateRetourOut }

ClientUser           (N utilisateurs ↔ 1 client)
  clientId, userId, email, nom
  profil             : "SAISIR_ORDRE" | "VAL1" | "VAL2" | "VAL3" | "VAL4"
  montantLimite      : nullable  — « poids lié au montant » optionnel, saisi par le client sur le formulaire
  status             : "PENDING_INVITE" | "ACTIVE" | "SUSPENDED"

ValidationRule       (par client Entreprise — issue du formulaire)
  combinaison        : "SO_V1_V2_V3_V4" | "SO_V1ouV2ouV3_V4" | "SO_V4"

Order                (objet générique soumis à validation : virement, bénéficiaire, réclamation)
  type, clientId, payload, montant?, status,
  initiatedBy, validations[] : [{ userId, profil, date, otpRef }]
  status : "SAISI" | "EN_VALIDATION" | "VALIDE" | "REJETE" | "TRANSMIS" | "EXECUTE" | "ECHEC"

SegmentPolicy        (tenantId, segment, key, value) — formats de relevés, plafonds par défaut
```

Un client **Particulier** ou **Corporate Individuel** possède un seul `ClientUser` implicite cumulant `SAISIR_ORDRE + VAL4` : l'ordre est validé en une étape avec OTP (comportement actuel). Le moteur de validation est donc le même pour les trois segments, avec une règle triviale pour les deux premiers.

`/auth/me` (ou `GET /tenant/{id}/client/me`) renvoie `segment`, `profil`, `montantLimite`, `subscription.status`.

**Impact transverse** : les actions qui comparent `extractAccountOwnerId(account) === currentUser.id` ou appellent `client/by-userid/{userId}` (`transfers/new/actions.ts`, `beneficiaries/actions.ts`, `accounts/actions.ts`, `mes-virements/actions.ts`) doivent passer par `ClientUser` : l'utilisateur agit *pour le compte* du client.

### 3.2 Moteur de validation (règle BNG)

| Combinaison (formulaire) | Ordre transmis lorsque… |
|---|---|
| `Saisir Ordre + Val1 + Val2 + Val3 + Val4` | Val1, Val2, Val3 **et** Val4 ont chacun validé (ordre libre, Val4 en dernier recommandé) |
| `Saisir Ordre + (Val1 ou Val2 ou Val3) + Val4` | Un des Val1/2/3 **puis** Val4 |
| `Saisir Ordre + Val4` | Val4 seul |

Règles communes : Val4 est **toujours** obligatoire ; un utilisateur ne peut pas valider un ordre qu'il a saisi ; si `montantLimite` est défini pour un profil, un validateur ne peut valider un ordre dont le montant dépasse sa limite ; un rejet à n'importe quelle étape clôt l'ordre (`REJETE`) avec motif ; chaque validation est confirmée par OTP. Implémentation : `lib/validation/engine.ts` (pur, testable) partagé par les server actions ; endpoints backend `POST /orders/{id}/validate|reject`, `GET /orders?status=EN_VALIDATION&profil=...`.

### 3.3 Côté front

| Fichier | Rôle |
|---|---|
| `lib/segment/types.ts` | `ClientSegment`, `UserProfil`, `SegmentPolicy` |
| `lib/segment/policies.ts` | Politiques par défaut des 3 segments |
| `lib/segment/get-client-context.ts` | Server-side : `{ segment, policy, profil, montantLimite, subscriptionStatus }` (`React.cache`) |
| `contexts/client-context.tsx` | `ClientProvider` + `useClientSegment()`, `useUserProfil()` |
| `components/segment/segment-gate.tsx` | `<SegmentGate>` / `<ProfilGate allow={["SAISIR_ORDRE"]}>` |
| `lib/validation/engine.ts` | Moteur de combinaisons (§3.2) |

Règle d'or : **toute règle de gestion est appliquée dans les server actions** à partir de `getClientContext()`.

### 3.4 Navigation par profil

`getNavigationData(segment, profil)` : `Saisir Ordre` voit « Effectuer un virement », « Ajouter un bénéficiaire », « Nouvelle réclamation » ; `Val1..Val4` voient « Ordres à valider » (virements / bénéficiaires / réclamations, avec détails) et n'ont pas les écrans de saisie ; tous voient dashboard, soldes, RIB, relevés, avis, agences, notifications.

---

## 4. Abonnement (remplace le chapitre « Onboarding » des versions précédentes)

### 4.1 Processus Corporate Individuel — identique au Particulier

1. Client en agence : formulaire rempli, signé, cacheté.
2. Agent → back-office BNGConnect : saisie racine/compte → affichage KYC T24 (lecture seule) → vérification.
3. **Conforme** : validation → BNGConnect Service génère le **fichier d'abonné** → dépôt FTP `IN` → e-mail 1 (prise en charge) → T24 consomme → T24 dépose le **relevé des 3 derniers mois** dans `OUT` → e-mail 2 avec **lien de création des identifiants** (`accept-invite`) → connexion.
4. **Non conforme** : formulaire de modification → l'agent met à jour T24 → T24 dépose le fichier client mis à jour dans `OUT` → BNGConnect consomme et met à jour → l'agent valide → suite identique.

### 4.2 Processus Corporate Entreprise

Identique, avec en plus : formulaire transmis par mail/courrier, signé par le **DG** ; le formulaire liste les utilisateurs habilités (nom, e-mail, profil `Saisir Ordre`/`Val1..4`, limite de montant optionnelle) ; l'agent **saisit les informations manquantes (e-mails)** ; les **2 e-mails sont envoyés à chaque utilisateur** ; chaque utilisateur crée ses propres identifiants.

### 4.3 Composants à réaliser

| Composant | Où | Contenu |
|---|---|---|
| Recherche racine/compte + affichage KYC T24 | Back-office | Écran de souscription ; données non modifiables ; comparaison visuelle formulaire / T24 ; statut de conformité |
| Saisie des utilisateurs et profils (Entreprise) | Back-office | Tableau utilisateurs (nom, e-mail, profil, limite), choix de la combinaison de validation, contrôle « au moins un Val4 » et « au moins un Saisir Ordre » |
| Génération du fichier d'abonné | Backend (BNGConnect Service) | Format à définir avec l'équipe T24 (cf. §11) ; dépôt FTP `IN` ; journal des dépôts |
| Consommation des fichiers `OUT` | Backend (job) | Relevés 3 mois (stockés et exposés dans « Relevés bancaires » dès la première connexion) ; fichier client mis à jour ; passage `subscription.status` → `ACTIVE_T24` |
| Notifications | Backend + templates `emails/` | E-mail 1 « prise en charge », e-mail 2 « activation + lien » (réutilise `accept-invite` et le template OTP existant) |
| Activation front | `app/auth/accept-invite` | Vérifier que l'invitation porte `clientId` + `profil` ; CGU par segment ; redirection vers le dashboard |
| Blocage tant que non actif | `components/auth/subscription-guard.tsx` | Si `subscription.status !== "ACTIF"` : message d'attente, pas d'accès aux opérations |

Le code `app/signup/*` reste désactivé (`middleware.ts`) et peut être retiré ou conservé en dormance.

---

## 5. Module Relevés — évolutions

| Règle | Particulier | Corporate Individuel | Corporate Entreprise |
|---|---|---|---|
| Formats | PDF, Excel | + **AFB120**, **CSV** | **MT940, AFB120, Excel, CSV, PDF — tous obligatoires au lancement** |
| Relevé initial | — | 3 derniers mois déposés par T24 à l'abonnement | idem |
| **Avis de débit / crédit** | — | Sur demande du client, **activation de la réception par e-mail** par chaque utilisateur (préférence dans le profil) | idem, pour tous les utilisateurs |
| Accès | propriétaire | propriétaire | **tous les utilisateurs** du client, quel que soit le profil |

### 5.1 AFB120 (CFONB 120)

Lignes fixes de 120 caractères : `01` ancien solde, `04` mouvement, `05` complément, `07` nouveau solde (code banque 5, guichet 5, devise 3, nb décimales 1 — **0 pour le GNF** —, compte 11, dates JJMMAA, montants 14 avec signe codé dans le dernier caractère). Table `txnType`/`productCode` → **codes opérations interbancaires** à fournir par BNG.

### 5.2 MT940

Message SWIFT : `:20:` référence, `:25:` compte, `:28C:` n° relevé, `:60F:` solde d'ouverture, `:61:` lignes de mouvement (date valeur, date opération, D/C, montant, code opération `N…`, référence), `:86:` libellé, `:62F:` solde de clôture, `:64:` solde disponible. Devise GNF sans décimales.

### 5.3 Implémentation

- **Backend Astra** : `POST /tenant/{id}/statement/export` `{ accountId, startDate, endDate, format: "PDF"|"EXCEL"|"CSV"|"AFB120"|"MT940" }` — un *writer* par format sur la même source (transactions + `/sttm`). Option : T24 fournit-il déjà MT940/AFB120 ? Si oui, simple relais du fichier `OUT` (à valider §11).
- **Front** : proxy `app/api/statements/export/route.ts` (pattern de `app/api/pdf/statement/route.ts`) ; sélecteur de formats piloté par `policy.statementFormats` ; dé-simulation de `generateStatement()` ; écran « Avis de débit/crédit » avec activation e-mail.
- **Jeu de fichiers de référence** AFB120 et MT940 validé par BNG et testé sur un ERP client avant mise en production.

---

## 6. Module Virements, bénéficiaires et réclamations — circuit de validation

### 6.1 Périmètre de lancement

**Virement BNG uniquement** (compte-à-compte, bénéficiaire enregistré, bénéficiaire ponctuel) — les parcours existants. Confrère et international : phase 2.

### 6.2 Règles par segment

| Règle | Particulier / Corporate Individuel | Corporate Entreprise |
|---|---|---|
| Saisie | l'utilisateur unique | profil **`Saisir Ordre`** uniquement (virement, bénéficiaire, réclamation) |
| Validation | OTP de l'utilisateur (= `Val4` implicite) | profils **`Val1..Val4`** selon la combinaison du client ; Val4 obligatoire ; écran « Ordres à valider » avec **détails complets** de l'ordre ; OTP à chaque validation |
| Limite par profil | — | si `montantLimite` défini : le validateur ne peut valider au-delà |
| Plafonds client | paramétrables par `SegmentPolicy` (par opération / jour / mois) — valeurs à fournir par BNG | idem |
| Bénéficiaires | activation immédiate (existant) → à conserver | création par `Saisir Ordre`, **activation après validation** ; un bénéficiaire non validé n'est pas utilisable dans un virement |
| Réclamations | saisie directe | saisie par `Saisir Ordre`, **transmission après validation** |
| Suivi | « Mes virements » | « Mes ordres » : statut, historique des validations (qui/quand), motif de rejet ; **notifications** de suivi visibles par tous |
| Transmission | POST `/epayments` immédiat | POST `/epayments` uniquement lorsque l'ordre est `VALIDE` (après la dernière signature) |

### 6.3 Changements techniques

**Backend** : entité `Order` + moteur de validation ; `epayments` créé seulement à l'état `VALIDE` ; `beneficiaire.status = PENDING_VALIDATION` ; `reclamation.status = EN_VALIDATION` ; endpoints `POST /orders`, `POST /orders/{id}/validate`, `POST /orders/{id}/reject`, `GET /orders`.

**Front**
- `transfers/new/actions.ts` → `prevalidateAndPrepareTransfer()` : `checkProfil("SAISIR_ORDRE")`, `checkLimits()`, `checkSubscriptionActive()` ; pour l'Entreprise `executeTransfer()` crée un `Order` au lieu d'appeler `/epayments`.
- `transfers/new/page.tsx` (1 900 lignes) : découper (`TransferTypeSelector`, `BeneficiaryPicker`, `AmountBlock`, `TransferSummary`) avant d'insérer les blocs par profil.
- Nouvelle page **`app/orders/pending/page.tsx`** (« Ordres à valider ») : liste filtrée par profil, fiche détaillée (virement / bénéficiaire / réclamation), boutons Valider (OTP) / Rejeter (motif). `app/operations/pending` existant peut servir de base.
- `app/orders/page.tsx` (« Mes ordres ») : historique et statuts ; remplace/complète `mes-virements` pour l'Entreprise.
- `beneficiaries/actions.ts` : `addBeneficiaryAndActivate` → `addBeneficiary` + ordre de validation pour l'Entreprise.
- `services/reclamation/actions.ts` : idem.

---

## 7. Fonctions transverses du lancement

| Fonction | Statut | Notes |
|---|---|---|
| Dashboard | Réutilisé | accès à tous les utilisateurs ; widget « ordres en attente » pour les validateurs |
| Consultation de solde, RIB | Réutilisé | accès à tous |
| Connexion / déconnexion, déconnexion automatique | Réutilisé (`idle-timeout.tsx`) | |
| Authentification forte | Réutilisé (OTP e-mail) | OTP à la connexion et à chaque validation ; option SMS si T24/opérateur disponible |
| Localisation des agences | Réutilisé | affichage seul |
| Alertes / rappels | Adapté (`notifications`) | statut des demandes, ordre en attente depuis > n h, avis de débit/crédit |
| Reporting bio (back-office) | Nouveau, côté BO | à préciser avec le chef de projet (reporting des abonnés / connexions ?) |

---

## 8. Matrice réutilisé / adapté / nouveau — périmètre de lancement

| Fonctionnalité | Statut | Segments | Effort |
|---|---|---|---|
| Auth, OTP, sessions, idle timeout, accept-invite | Réutilisé | tous | — |
| Dashboard, soldes, RIB, agences, notifications, support | Réutilisé (menu filtré) | tous | XS |
| Couche segment + profil + contexte client + gates + navigation | **Nouveau** | tous | M |
| `ClientUser` (N users ↔ 1 client) + refonte des contrôles de propriété | **Nouveau** (transverse) | Entreprise | M |
| Abonnement back-office : racine/compte, KYC T24, utilisateurs/profils, validation | **Nouveau** (BO) | Corporate | L |
| Fichier d'abonné → FTP `IN` ; consommation `OUT` (relevés 3 mois, client maj) ; 2 notifications | **Nouveau** (backend / intégration) | Corporate | L |
| Relevés PDF / Excel (dé-simulation) | Adapté | tous | S |
| CSV, AFB120, MT940 | **Nouveau** (backend + proxy) | Corporate | M–L |
| Avis de débit / crédit + activation e-mail | **Nouveau** | Corporate | M |
| Moteur de validation (combinaisons, Val4, limites, OTP) | **Nouveau** | Entreprise | L |
| Page « Ordres à valider » + « Mes ordres » | **Nouveau** | Entreprise | M |
| Virement BNG : profil, plafonds, création d'ordre | Adapté | Corporate | M |
| Bénéficiaires avec validation | Adapté | Entreprise | S–M |
| Réclamations avec validation | Adapté | Entreprise | S |
| Profil utilisateur (segment, profil, préférences avis) | Adapté | tous | S |

(XS < 1 j · S 1–3 j · M 1–2 sem · L 2–4 sem)

---

## 9. Découpage en lots et planning indicatif

| Lot | Contenu | Durée |
|---|---|---|
| **Lot 0 – Fondations** | `segment`/`profil`/`ClientUser` backend, `/auth/me` enrichi, contexte front, gates, navigation par profil, `SubscriptionGuard`, refonte des contrôles de propriété | 2 sem |
| **Lot 1 – Abonnement & T24** | Écrans back-office (racine/compte, KYC, utilisateurs/profils), fichier d'abonné, FTP `IN`/`OUT`, jobs de consommation, notifications, activation | 3 sem (dépend des spécifications de fichiers T24) |
| **Lot 2 – Relevés & avis** | CSV / AFB120 / MT940, dé-simulation, sélecteur par politique, relevés initiaux 3 mois, avis de débit/crédit | 2,5 sem |
| **Lot 3 – Circuit de validation** | Moteur de validation, `Order`, ordres à valider / mes ordres, virement BNG par profil, bénéficiaires et réclamations avec validation, plafonds | 3 sem |
| **Recette & MEP** | Extension de `TESTS_FONCTIONNALITES_PORTAIL_CLIENT.csv`, validation AFB120/MT940 par BNG, test des 3 combinaisons de validation, non-régression Particulier, test bout-en-bout agence → T24 → activation | 2 sem |

Lots 1, 2 et 3 parallélisables après le lot 0. **Total ≈ 11–13 semaines.**

---

## 10. Phase 2 (hors lancement)

Virements confrères et internationaux (pièces justificatives, change) ; paiements de masse / salaires par fichier (`app/payments/bulk`) ; virements programmés / récurrents ; multi-entités (maison mère / filiales) et trésorerie consolidée ; délégations temporaires de pouvoir ; camt.053 / dépôt automatique SFTP vers l'ERP ; journal d'audit exportable ; 2FA TOTP / restriction IP ; API host-to-host.

---

## 11. Points à valider (bloquants)

1. **Spécification du fichier d'abonné** (format, champs, nommage, encodage) et du **fichier client mis à jour** attendus/produits par T24 ; protocole exact (FTP/SFTP, fréquence de scrutation, accusés).
2. Format des **relevés des 3 derniers mois** déposés par T24 : fichiers finaux (PDF/MT940/AFB120) ou données brutes à mettre en forme par BNGConnect ?
3. Table des **codes opérations** AFB120 / MT940 et convention de signe ; T24 peut-il produire ces formats nativement ?
4. **Plafonds** par défaut par segment (opération / jour / mois) et conditions d'application des limites par profil.
5. Détail de l'ordre des validations dans la combinaison complète (Val1→Val2→Val3→Val4 séquentiel ou libre) et **délai d'expiration** d'un ordre non validé.
6. Contenu et déclencheur des **avis de débit / crédit** (chaque mouvement ? seuil ?) ; canal e-mail uniquement ?
7. Signification exacte du **« Reporting bio (back-office) »**.
8. OTP : e-mail seul (existant) ou SMS via T24/opérateur au lancement ?
9. Un utilisateur peut-il cumuler plusieurs profils (ex. `Saisir Ordre` + `Val1`) ? Un même e-mail peut-il être rattaché à plusieurs entreprises ?
10. Maquette du **formulaire de souscription Entreprise** (source des champs à saisir en back-office).

---

## 12. Dette technique à traiter en passant

- `generateStatement()` : valeurs simulées (`fileSize`, `downloadUrl`, `openingBalance: 1500000`).
- `validateBeneficiary()` et `calculateTransferFees()` : simulations à remplacer ou retirer.
- `NODE_TLS_REJECT_UNAUTHORIZED = "0"` forcé dans plusieurs actions/routes : à retirer avant production.
- `app/transfers/new/page.tsx` (1 918 lignes) et `app/accounts/statements/page.tsx` (2 418 lignes, ~1 000 commentées) : découpage nécessaire.
- Lien implicite `user.id = client.userid` : à remplacer par `ClientUser`.
- `app/signup/*` : à retirer ou isoler (hors périmètre selon la procédure).
- Fichiers résiduels : `page.tsx.backup`, `back-office-bngEbanking.code-workspace`, `tmp.js` ; dépendances `latest` à figer ; numéros d'US dupliqués dans `user-stories.md`.


---

## 13. État d'implémentation et interfaces Corporate (v1.3 — 09/09/2026)

### 13.1 Organisation du code

| Dépôt | Rôle | Contenu livré |
|---|---|---|
| `bngconnect` (monorepo pnpm) | Les trois applications clients | `apps/particulier` (port 3000), `apps/corporate-particulier` (3001, segment `CORPORATE_INDIVIDUEL`), `apps/corporate-entreprise` (3002, segment `CORPORATE_ENTREPRISE`), `packages/core` (code partagé : composants, lib, server actions, pages `features/`, couche segment, moteur de validation) |
| `backendebanking` | Backend Astra | Segments et profils sur `clients` / `clientUsers`, API `client-user`, lien d'activation par segment, abonnement T24 existant réutilisé |
| `back-office-bngEabnking` | Back-office agence | Écran d'abonnement avec choix du segment et saisie des utilisateurs habilités (Entreprise) |

Chaque application est une coquille fine : ses routes ré-exportent les pages de `packages/core/features`. Les alias `@/lib`, `@/components`, `@/app`… pointent vers `packages/core`, si bien que le code Particulier fonctionne sans modification. Une page propre à un segment n'est routée que dans l'application concernée.

### 13.2 Interface Corporate Particulier (`apps/corporate-particulier`)

Reprend l'intégralité de l'interface Particulier (dashboard, soldes, RIB, relevés, virements BNG, bénéficiaires, réclamations, agences, notifications, profil) avec les ajouts suivants :

| Écran | Route | Description |
|---|---|---|
| Relevés — formats bancaires | `/accounts/statements` | Bloc « Formats bancaires (comptabilité / ERP) » : **CSV** et **AFB120** (formats pilotés par la politique du segment), téléchargés via `/api/statements/export` → backend `POST /statement/export` |
| Avis de débit / crédit | `/accounts/advices` | Liste des avis (backend `avis-debit-credit`), téléchargement PDF, activation de la réception par e-mail |
| Menu | — | « Avis de débit / crédit » ajouté dans « Gérer vos comptes » |
| Garde d'abonnement | toutes | Opérations bloquées tant que `subscriptionStatus ≠ ACTIF` ; écran de redirection si le client appartient à un autre segment |

Un utilisateur unique cumule implicitement les profils « Saisir Ordre » et « Val4 » : les ordres sont exécutés directement avec OTP, comme pour le Particulier.

### 13.3 Interface Corporate Entreprise (`apps/corporate-entreprise`)

Tout ce qui précède, plus :

| Écran | Route | Profils | Description |
|---|---|---|---|
| Ordres à valider | `/orders/pending` | Val1, Val2, Val3, Val4 | File des ordres `EN_VALIDATION` (virement, bénéficiaire, réclamation) avec **détail complet**, validations déjà apposées, profils encore attendus ; boutons **Valider (OTP)** et **Rejeter (motif obligatoire)**. Le moteur local applique les trois combinaisons BNG (Val4 toujours obligatoire, initiateur ≠ validateur, limite de montant par profil) avant l'appel backend |
| Mes ordres | `/orders` | tous | Suivi par onglets (en cours / terminés / rejetés) avec l'historique des validations et le motif de rejet |
| Relevés — MT940 | `/accounts/statements` | tous | Format **MT940** en plus de CSV / AFB120 |
| Menu par profil | — | — | « Saisir Ordre » voit les écrans de saisie (virement, bénéficiaires, réclamation) ; « Val1..Val4 » voient « Ordres à valider » ; tous voient dashboard, soldes, RIB, relevés, avis, agences, notifications |

Contrat backend attendu pour ces écrans : `GET/POST /tenant/{id}/orders`, `POST /orders/{id}/validate|reject|cancel` (spécifié dans `bngconnect/docs/API_CONTRATS_BACKEND.md`). Tant que l'endpoint n'existe pas, l'écran affiche « service en cours de mise en place ».

### 13.4 Abonnement (inscription) — implémenté

| Étape | Où | État |
|---|---|---|
| Choix du type d'abonnement (Particulier / Corporate Particulier / Corporate Entreprise) | Back-office `/clients/nouveau` | ✅ |
| Entreprise : combinaison de validation + utilisateurs habilités (nom, e-mail, profil, limite GNF), contrôles « ≥ 1 Saisir Ordre » et « ≥ 1 Val4 » | Back-office | ✅ |
| Création client avec `segment`, `combinaisonValidation`, `subscriptionStatus` ; rattachement `clientUsers` (profils, limite) | Backend | ✅ (migration `npm run db:migrate:corporate-segment`) |
| E-mail 1 « prise en charge » + fichier Type N → FTP IN (une fois par racine) | Backend (existant, paramètre `skipT24Deposit`) | ✅ |
| E-mail 2 avec lien de création des identifiants vers **l'application du segment** (`EBANKING_URL_CORPORATE_INDIVIDUEL` / `EBANKING_URL_CORPORATE_ENTREPRISE`) | Backend (étape B existante) | ✅ |
| Création des identifiants (`accept-invite`) sans client fantôme pour les utilisateurs rattachés | Apps + backend | ✅ |
| Résolution du segment / profils à la connexion, redirection si mauvaise application | Apps (`packages/core/segment`) | ✅ |

### 13.5 Identité visuelle par espace (page de connexion et en-tête)

Objectif : l'utilisateur reconnaît son espace sans lire l'URL. Tout est centralisé dans `packages/core/segment/branding.ts`.

| Élément | Particulier | Corporate Particulier | Corporate Entreprise |
|---|---|---|---|
| Badge de la page de connexion | BNG CONNECT | **BNG CONNECT ENTREPRISE INDIVIDUELLE** | **BNG CONNECT SOCIÉTÉ** |
| Libellé d'espace (pastille au-dessus de « Connexion », en-tête et sidebar après connexion) | Espace Particulier | **Espace Entreprise Individuelle** | **Espace Société** (+ profil de l'utilisateur, ex. « Val4 (DG) ») |
| Couleur dominante (fond, champs, surfaces) | vert BNG `#2d6e3e` (inchangé) | bleu-canard `#0f4c5c` | bleu marine `#1f3a5f` |
| Sous-titre du formulaire | Vos comptes personnels, en toute sécurité | Entrepreneurs, commerçants et professions libérales | Accès réservé aux utilisateurs habilités par votre société |
| Messages d'accueil défilants | existants | relevés comptables, avis par e-mail, virements | profils et validation, circuit de signatures, MT940/AFB120, traçabilité |
| Carrousel « Fonctionnalités » | menu Particulier | menu du segment | menu du segment (tous profils) |
| Liens de réorientation sous le formulaire | vers Pro et Entreprise | vers Particulier et Entreprise | vers Particulier et Pro |
| Titre d'onglet | BNG CONNECT | BNG CONNECT Entreprise Individuelle | BNG CONNECT Société |
| Sidebar | vert BNG | fond bleu-canard + bandeau d'espace (replié : « EI ») | fond bleu marine + bandeau d'espace et profil (replié : « SOC ») |

Les liens de réorientation n'apparaissent que si les URLs des autres espaces sont configurées (`NEXT_PUBLIC_URL_*`). Un client connecté sur le mauvais espace voit en plus l'écran bloquant de redirection (§13.2).

### 13.6 Déploiement

Trois projets Vercel sur le dépôt `bngconnect` (Root Directory = `apps/<app>`, option « Include source files outside of the Root Directory »), variables d'environnement par projet, migration backend `db:migrate:corporate-segment` et variables `EBANKING_URL_CORPORATE_*`, DNS des deux nouveaux sous-domaines, recette de bout en bout : la procédure détaillée, rédigée pour être exécutée par Cursor, est dans `bngconnect/docs/DEPLOIEMENT_CURSOR.md`.

### 13.7 Correction : 2ᵉ notification non reçue par tous les utilisateurs d'une société (10/09/2026)

Défaut constaté en recette : sur un abonnement Société, seul le premier utilisateur recevait l'e-mail contenant le lien de création des identifiants. Trois causes cumulées, toutes corrigées côté backend :

1. **Archivage prématuré des fichiers T24.** Le cron de l'étape B traitait les utilisateurs un par un et déplaçait `{racine}.RL` / `{racine}.INFO` vers `archives/` dès le premier envoi ; les suivants ne trouvaient plus les fichiers et restaient bloqués. Désormais : présence T24 vérifiée **une fois par racine** (cache local), envoi à tous les utilisateurs, archivage **après** la boucle ; une racine déjà archivée est considérée comme traitée (le cron peut être relancé sans risque).
2. **Client non résolu pour les utilisateurs rattachés.** `buildClientRow()` cherchait le client par `clients.userid`, ce qui ne renvoie rien pour les utilisateurs 2..N d'une société : le journal d'activation était écrit sans `clientId`. La résolution passe maintenant aussi par `clientUsers`.
3. **Racine absente du journal.** Si le dossier d'abonnement n'a pas transmis la racine dans le snapshot, l'étape B abandonnait avec « racine manquante ». Elle est désormais résolue en repli depuis le client rattaché.

À vérifier en recette : un abonnement Société à cinq utilisateurs doit produire **un seul** fichier Type N dans le FTP IN et **cinq** e-mails d'activation après le retour T24, chacun pointant vers l'espace Société.

### 13.8 Reste à faire (par ordre de priorité)

1. Backend : endpoints `/orders` (moteur de validation à porter à l'identique) et `/statement/export` (CSV, AFB120, MT940).
2. Front Entreprise : brancher la saisie de virement, de bénéficiaire et de réclamation sur la création d'un `Order` au lieu de l'exécution directe ; plafonds (`checkLimits`) ; champs structurés Corporate (référence, motif).
3. Refactor `transfers/new/page.tsx` et `statements/page.tsx` (pages monolithiques).
4. Recette bout-en-bout agence → T24 → activation → validation d'un ordre sur les trois combinaisons.
