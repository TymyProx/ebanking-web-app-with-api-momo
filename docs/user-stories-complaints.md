# US022 – Soumettre une réclamation sur un service bancaire

## Titre
Permettre à un utilisateur de soumettre une réclamation en ligne concernant une transaction ou un service bancaire

## Rôle
Client connecté (particulier ou entreprise)

## Besoin
En tant qu'utilisateur, je souhaite pouvoir signaler un problème ou une insatisfaction concernant un service bancaire ou une transaction, afin de recevoir une réponse, un suivi et une résolution rapide de ma réclamation.

## Objectif métier
Mettre en place un canal formel de gestion des réclamations pour améliorer la satisfaction client, assurer la traçabilité des plaintes et respecter les délais de traitement réglementaires.

## Pré-conditions
- L'utilisateur est connecté
- Il possède un compte actif

## Déclencheur
L'utilisateur accède à la section "Réclamations" dans l'application (E-Services > Réclamations), puis clique sur "Soumettre une réclamation"

## Flux principal

### 1. Accès au formulaire
- L'utilisateur navigue vers E-Services > Réclamations
- Il clique sur "Nouvelle réclamation"
- Le formulaire de réclamation s'affiche

### 2. Saisie des informations
L'utilisateur remplit le formulaire avec :

#### Informations personnelles (obligatoires)
- Nom complet (pré-rempli)
- Numéro de compte bancaire
- Adresse e-mail
- Numéro de téléphone

#### Détails de la réclamation (obligatoires)
- Type de réclamation (Transaction, Service, Frais, Carte, Virement, Autre)
- Priorité (Faible, Normal, Élevé, Urgent)
- Description détaillée (minimum 20 caractères)

#### Transaction concernée (optionnel)
- Date de la transaction
- Montant de la transaction
- Référence de la transaction

#### Pièces jointes (optionnel)
- Documents justificatifs (PDF, JPG, PNG, DOC, DOCX)

### 3. Validation des données
Le système applique les contrôles suivants :

#### Validations obligatoires
- **Numéro de compte** : Format IBAN Guinée (GN + 15 chiffres) ou format interne (10-15 chiffres)
- **Email** : Format valide (exemple@domaine.com)
- **Téléphone** : 8-15 chiffres (support international)
- **Description** : Non vide et minimum 20 caractères

#### Validations optionnelles (si transaction mentionnée)
- **Date** : Antérieure ou égale à aujourd'hui
- **Montant** : Strictement positif

### 4. Enregistrement et confirmation
Si toutes les validations passent :
- Le système enregistre la réclamation
- Un numéro de dossier unique est généré (format : RCLM-AAAAMMJJ-XXX)
- L'utilisateur reçoit un accusé de réception
- Une notification est envoyée au back-office

## Flux alternatifs / Erreurs

### Messages d'erreur spécifiques
- ❌ **Compte invalide** : "Le numéro de compte saisi est incorrect."
- ❌ **Email invalide** : "Merci de saisir une adresse e-mail valide."
- ❌ **Téléphone invalide** : "Le numéro de téléphone doit contenir entre 8 et 15 chiffres."
- ❌ **Description vide** : "Veuillez décrire précisément votre réclamation (minimum 20 caractères)."
- ❌ **Montant invalide** : "Le montant de la transaction doit être supérieur à zéro."
- ❌ **Date future** : "La date de la transaction ne peut pas être dans le futur."

## Feedback utilisateur

### Messages de succès
- ✅ **Soumission réussie** : "Votre réclamation a été prise en compte. Référence : RCLM-20250722-001. Vous recevrez une réponse sous 72h ouvrées."

### Messages d'information
- ℹ️ **Délais de traitement** :
  - Accusé de réception : Immédiat
  - Première réponse : 72h ouvrées
  - Résolution finale : 15 jours ouvrés

## Post-conditions

### Suivi des réclamations
- La réclamation est visible dans l'espace utilisateur avec statuts :
  - **En attente** → **En cours** → **Résolue** / **Rejetée**
- L'utilisateur peut consulter l'historique complet
- Possibilité d'ajouter des commentaires ou documents

### Notifications automatiques
- **Email de confirmation** immédiat après soumission
- **Notification back-office** pour traitement
- **Alertes de suivi** selon l'évolution du dossier

### Tableau de bord
- **Statistiques rapides** : Total, En attente, En cours, Résolues
- **Recherche avancée** par référence, type, description
- **Filtres par statut** et période
- **Export PDF** pour réclamations résolues

## Données techniques

### Stockage sécurisé
- Base de données avec timestamp, auteur, contenu, statut
- Traçabilité complète des modifications
- Archivage automatique après résolution

### Génération automatique
- **Format de référence** : RCLM-AAAAMMJJ-XXX
- **Numérotation séquentielle** par jour
- **Unicité garantie** pour chaque réclamation

### Workflow de traitement
- **Attribution automatique** selon le type de réclamation
- **Escalade** selon la priorité et les délais
- **Notifications multi-canal** (email, SMS, push)

### Analytics et reporting
- **Métriques de performance** : délais de traitement, taux de résolution
- **Rapports périodiques** pour amélioration continue
- **Satisfaction client** post-résolution

## Types de réclamations supportés

1. **Transaction** : Débit non autorisé, montant incorrect, transaction non reconnue
2. **Service** : Accueil, délais de traitement, qualité d'information
3. **Frais** : Contestation de commissions, frais non justifiés
4. **Carte** : Dysfonctionnement, fraude, blocage injustifié
5. **Virement** : Retard d'exécution, erreur de destinataire
6. **Autre** : Cas spécifiques non couverts par les catégories précédentes

## Niveaux de priorité

1. **Faible** : Demande d'information, amélioration suggérée
2. **Normal** : Problème standard sans impact critique
3. **Élevé** : Impact financier ou opérationnel significatif
4. **Urgent** : Sécurité compromise, perte financière importante

## Conformité réglementaire

- **Délais légaux** respectés (72h première réponse, 15 jours résolution)
- **Traçabilité complète** pour audits
- **Confidentialité** des données personnelles
- **Droit de recours** et escalade vers autorités de régulation

## Intégration système

- **CRM** pour gestion centralisée des réclamations
- **Système de notifications** multi-canal
- **Base de connaissances** pour résolutions types
- **Reporting** automatisé pour direction et régulateurs

Cette user story garantit un processus de réclamation transparent, efficace et conforme aux exigences réglementaires, tout en améliorant l'expérience client et la satisfaction globale.
