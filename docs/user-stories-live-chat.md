# US023 – Contacter un conseiller via Live Chat

## Description
Permettre à un utilisateur d'initier une conversation en temps réel avec un agent du service client via le module de chat.

## Rôle
Client connecté (particulier ou entreprise)

## Besoin
En tant qu'utilisateur, je souhaite pouvoir discuter en temps réel avec un conseiller clientèle, afin de poser une question, signaler un problème ou obtenir une assistance rapide sur mes opérations bancaires.

## Objectif métier
Offrir un canal d'assistance instantanée pour réduire la charge des appels téléphoniques, accélérer la résolution des demandes simples et améliorer la satisfaction client.

## Pré-conditions
- L'utilisateur est connecté à son espace client
- Le service Live Chat est en ligne et des agents sont disponibles

## Déclencheur
L'utilisateur clique sur "Assistance" ou "Live Chat" dans l'application/web, puis sélectionne "Démarrer une conversation"

## Flux principal

### 1. Formulaire de pré-chat
L'utilisateur saisit les informations suivantes :
- **Nom complet** (pré-rempli depuis le profil)
- **Numéro de compte bancaire** (IBAN Guinée ou format interne)
- **Adresse e-mail** (pré-remplie depuis le profil)
- **Numéro de téléphone** (format international accepté)
- **Sujet de la discussion** (menu déroulant avec 8 options + "Autre")

### 2. Validation des données
Le système valide :
- **Numéro de compte** : Format IBAN Guinée (GN + 15 chiffres) ou interne (10-16 chiffres)
- **Adresse e-mail** : Format correct (regex validation)
- **Téléphone** : 8 à 15 chiffres, format international accepté
- **Sujet** : Obligatoire, si "Autre" sélectionné, description requise

### 3. Démarrage de la session
Si toutes les informations sont valides :
- Une session de chat est ouverte avec ID unique (CHAT-timestamp)
- Un conseiller est affecté automatiquement selon disponibilité
- Le sujet est transmis à l'agent pour contextualisation
- Message de confirmation affiché à l'utilisateur

### 4. Interface de chat
- **Zone de messages** avec historique en temps réel
- **Indicateur de frappe** quand l'agent écrit
- **Statut de connexion** (En attente / En ligne / Hors ligne)
- **Informations agent** (nom, photo, statut)
- **Boutons d'action** (Télécharger transcription, Terminer chat)

### 5. Fin de conversation
À la fin de la conversation, l'utilisateur peut :
- **Recevoir une transcription** par e-mail automatiquement
- **Noter la qualité** de l'assistance (1-5 étoiles + commentaire)
- **Télécharger la transcription** immédiatement
- **Démarrer une nouvelle conversation** si nécessaire

## Flux alternatifs / erreurs

### Erreurs de validation
- ❌ **Numéro de compte invalide** → "Le numéro de compte saisi est incorrect."
- ❌ **Email incorrect** → "Veuillez saisir une adresse e-mail valide."
- ❌ **Téléphone mal formaté** → "Numéro de téléphone invalide."
- ❌ **Sujet vide** → "Merci d'indiquer le sujet de votre demande."

### Indisponibilité du service
- ❌ **Aucun agent disponible** → "Aucun conseiller n'est disponible pour le moment. Veuillez réessayer plus tard."
- ❌ **Hors horaires** → "Le service Live Chat est disponible de 8h à 18h, du lundi au vendredi."

## Feedback utilisateur

### Messages de succès
- ✅ **Connexion réussie** → "Vous êtes maintenant en ligne avec un conseiller. Merci de patienter quelques instants."
- ✅ **Transcription envoyée** → "Votre conversation a bien été enregistrée. Une copie vous a été envoyée par e-mail."
- ✅ **Évaluation reçue** → "Merci pour votre évaluation. Votre retour nous aide à améliorer notre service."

### Messages d'erreur
- ❌ **Erreur générale** → "Impossible de démarrer le chat. Veuillez vérifier les informations saisies."
- ❌ **Connexion perdue** → "La connexion avec le conseiller a été interrompue. Reconnexion en cours..."

## Post-conditions
- La session de chat est enregistrée pour archivage et audit
- Le client peut accéder à son historique de conversations
- Les performances du chat sont suivies en back-office (temps de réponse, satisfaction)
- Transcription automatiquement envoyée par e-mail
- Données de satisfaction collectées pour amélioration continue

## Données techniques

### Fonctionnalités implémentées
1. **Formulaire de pré-chat** avec validation complète
2. **Interface de chat temps réel** avec simulation d'agent
3. **Système de notation** avec étoiles et commentaires
4. **Historique des conversations** avec recherche
5. **Téléchargement de transcriptions** en format texte
6. **Gestion des statuts** (En attente, Connecté, Terminé)
7. **Validation robuste** de tous les champs
8. **Messages de feedback** conformes aux spécifications

### Sujets de discussion disponibles
- Problème de transaction
- Question sur mon compte
- Assistance carte bancaire
- Virement en attente
- Frais bancaires
- Problème technique
- Demande d'information
- Autre (avec précision requise)

### Horaires de service
- **Disponibilité** : 8h à 18h, du lundi au vendredi
- **Temps d'attente moyen** : 2-3 minutes
- **Agents en ligne** : Affiché en temps réel

### Intégrations prévues
- Service de chat en temps réel (Zendesk Chat, Twilio, Firebase)
- Système de gestion des agents avec routage intelligent
- Base de données pour archivage des conversations
- Service d'email pour envoi automatique des transcriptions
- Système de métriques pour suivi des performances

## Navigation
**Support** → **Live Chat**

## Statut
✅ **Implémenté** - Interface complète avec simulation fonctionnelle
🔄 **En attente** - Intégration avec service de chat réel
📋 **À prévoir** - Formation des agents et procédures de support
