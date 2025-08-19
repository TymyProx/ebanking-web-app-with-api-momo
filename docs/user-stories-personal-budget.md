# User Story US021 - Gérer mon budget personnel mensuel

## Titre
Permettre à un utilisateur de planifier, suivre et analyser son budget mensuel à partir de ses revenus et dépenses

## Rôle
Client connecté (particulier ou entreprise)

## Besoin
En tant qu'utilisateur, je souhaite définir un budget mensuel et suivre mes revenus et mes dépenses par catégorie, afin de mieux contrôler mes finances et respecter mes objectifs d'épargne ou de dépenses.

## Objectif métier
Offrir un module de gestion budgétaire proactive intégré à l'application bancaire, pour améliorer l'engagement client et favoriser une meilleure santé financière.

## Pré-conditions
- L'utilisateur est authentifié
- Il dispose d'un compte actif
- Il a déjà enregistré au moins un revenu et une dépense

## Déclencheur
L'utilisateur accède à la section "Mon Budget / PFM" depuis son tableau de bord

## Flux principal

### 1. Configuration initiale du budget
L'utilisateur accède à la page de configuration budgétaire et saisit :
- Nom complet (pré-rempli)
- Numéro de compte bancaire
- Adresse e-mail
- Numéro de téléphone
- Revenu mensuel
- Objectif de dépense mensuel (plafond à ne pas dépasser)
- Objectif d'épargne mensuel

### 2. Ajout des dépenses
Il ajoute ses dépenses manuellement ou via catégorisation automatique :
- Catégorie de dépense (Logement, Alimentation, Transport, etc.)
- Montant de la dépense
- Date de la dépense
- Description de la dépense

### 3. Contrôles système
Le système effectue les contrôles suivants :
- Numéro de compte valide
- Email et téléphone bien formatés
- Revenu mensuel et objectif de dépense sont des montants positifs
- Catégorie bien sélectionnée
- Montant de dépense positif
- Date de la dépense antérieure ou égale à la date du jour
- Cohérence budgétaire (budget + épargne ≤ revenus)

### 4. Mise à jour et alertes
Le système enregistre les données et :
- Affiche un graphique d'évolution des dépenses vs budget
- Indique la part restante du budget mensuel
- Suit les objectifs d'épargne
- Alerte si l'objectif est dépassé

## Flux alternatifs / erreurs
- ❌ Email invalide → "Veuillez saisir une adresse email valide."
- ❌ Montant ou revenu négatif → "Le montant doit être supérieur à 0."
- ❌ Catégorie non sélectionnée → "Choisissez une catégorie de dépense."
- ❌ Objectif inférieur au total des dépenses → "Votre objectif est déjà dépassé."
- ❌ Budget + épargne > revenus → "La somme du budget et de l'objectif d'épargne dépasse vos revenus mensuels."

## Feedback utilisateur
- ✅ "Votre budget a été mis à jour avec succès. Vous avez utilisé 48% de votre objectif mensuel."
- ✅ "Dépense ajoutée à la catégorie 'Transport'. Il vous reste 100,000 GNF pour ce mois."
- ⚠️ "Attention : vous avez dépassé votre budget mensuel de 20%."
- 💰 "Excellent progrès ! Vous avez atteint 75% de votre objectif d'épargne."

## Post-conditions
L'utilisateur peut consulter :
- Le graphique de suivi du budget
- Un rapport budgétaire mensuel ou hebdomadaire (PDF, CSV, Excel)
- Une alerte proactive lorsqu'il approche ou dépasse un seuil défini
- Le suivi de ses objectifs d'épargne
- Les données sauvegardées pour analyses futures

## Données techniques à prévoir
- Suivi des revenus, des dépenses et des objectifs mensuels
- Catégorisation automatique des transactions (libellés, types de marchands)
- Visualisation dynamique (graphiques circulaires, barres, jauges)
- Notifications (push, email, SMS) lors de dépassement de seuil
- Export mensuel et archivage des rapports
- Recommandations personnalisées basées sur les habitudes

## Fonctionnalités implémentées

### ✅ Configuration budgétaire complète
- **Paramétrage initial** avec revenus, budget et objectifs d'épargne
- **Validation logique** : cohérence entre revenus, budget et épargne
- **Interface intuitive** avec formulaires guidés et validation en temps réel
- **Recommandations automatiques** basées sur les bonnes pratiques financières

### ✅ Suivi budgétaire avancé
- **4 KPI principaux** : Revenus, Budget, Dépenses, Épargne
- **Jauges de progression** pour budget et objectifs d'épargne
- **Calculs automatiques** des pourcentages d'utilisation
- **Alertes visuelles** avec codes couleur selon les seuils

### ✅ Gestion par catégories détaillée
- **10 catégories prédéfinies** avec budgets suggérés par pourcentage
- **Suivi individuel** : dépensé vs budget alloué par catégorie
- **Badges de statut** : On track, Over budget, Under budget
- **Visualisation claire** avec barres de progression et codes couleur

### ✅ Système d'alertes intelligent
- **Alertes à 85%** d'utilisation du budget global
- **Notifications de dépassement** par catégorie et globalement
- **Messages contextuels** selon l'état budgétaire
- **Multi-canal** : email, push, SMS pour les cas critiques

### ✅ Visualisations graphiques avancées
- **Graphique en secteurs** : répartition budgétaire par catégorie
- **Graphique linéaire** : évolution Budget vs Dépenses vs Épargne
- **Graphique en barres** : analyse des tendances revenus/dépenses
- **Tooltips informatifs** avec détails complets

### ✅ Suivi des objectifs d'épargne
- **Objectif d'épargne mensuel** configurable
- **Jauge de progression** dédiée à l'épargne
- **Calcul du taux d'épargne** en pourcentage des revenus
- **Recommandations d'optimisation** de l'épargne

### ✅ Historique et traçabilité
- **Historique complet** des dépenses avec badges (Manuel/Auto)
- **Filtrage avancé** par catégorie, période, type
- **Détails enrichis** : description, compte, mode de saisie
- **Traçabilité complète** avec logs d'audit

### ✅ Rapports et analytics
- **Export multi-format** : PDF, CSV, Excel
- **Rapports détaillés** avec analyses et recommandations
- **Analytics avancées** : variance par catégorie, tendances
- **Recommandations personnalisées** basées sur les habitudes

### ✅ Expérience utilisateur optimisée
- **Interface responsive** avec navigation par onglets
- **États de chargement** avec skeletons animés
- **Feedback immédiat** sur toutes les actions
- **Messages d'erreur explicites** avec solutions suggérées

## Critères d'acceptation validés

### Configuration et paramétrage
- [x] Configuration initiale du budget avec revenus et objectifs
- [x] Validation de la cohérence budgétaire (budget + épargne ≤ revenus)
- [x] Paramétrage des objectifs d'épargne mensuels
- [x] Recommandations automatiques selon les bonnes pratiques

### Suivi et contrôle
- [x] Ajout manuel des dépenses avec catégorisation
- [x] Calcul automatique des pourcentages d'utilisation
- [x] Suivi des objectifs d'épargne avec progression
- [x] Alertes proactives à 85% et en cas de dépassement

### Visualisation et analyse
- [x] Graphiques interactifs pour la répartition budgétaire
- [x] Évolution temporelle Budget vs Dépenses vs Épargne
- [x] Analyse détaillée par catégorie avec variance
- [x] Jauges de progression pour budget et épargne

### Rapports et exports
- [x] Export des rapports en PDF, CSV et Excel
- [x] Rapports détaillés avec recommandations personnalisées
- [x] Analytics avancées avec tendances et projections
- [x] Historique complet avec traçabilité

### Alertes et notifications
- [x] Système d'alertes multi-niveau (info, warning, critical)
- [x] Notifications multi-canal (email, push, SMS)
- [x] Messages contextuels selon l'état budgétaire
- [x] Alertes par catégorie en cas de dépassement

## Messages de feedback implémentés

### ✅ Configuration réussie
- "Votre budget personnel a été configuré avec succès !"
- "Vos paramètres budgétaires ont été mis à jour avec succès."

### ✅ Ajout de dépenses
- "Votre budget a été mis à jour avec succès. Vous avez utilisé X% de votre objectif mensuel."
- "Dépense ajoutée à la catégorie 'Transport'. Il vous reste X GNF pour ce mois."

### ⚠️ Alertes budgétaires
- "Attention : vous approchez de votre limite budgétaire (X% utilisé)."
- "Attention : vous avez dépassé votre budget mensuel de X%."
- "Vous avez dépassé votre budget Alimentation de X%."

### 💰 Objectifs d'épargne
- "Excellent progrès ! Vous avez atteint X% de votre objectif d'épargne."
- "Encore X GNF pour atteindre votre objectif d'épargne mensuel."

### ❌ Erreurs spécifiques
- "Veuillez saisir une adresse email valide."
- "Le montant doit être supérieur à 0."
- "Choisissez une catégorie de dépense."
- "La somme du budget et de l'objectif d'épargne dépasse vos revenus mensuels."
- "Votre objectif est déjà dépassé par vos dépenses actuelles."

## Recommandations personnalisées implémentées

### 💡 Optimisation budgétaire
- "Excellente gestion globale du budget avec X% d'utilisation"
- "Attention au budget Alimentation qui dépasse de X%"
- "Opportunité d'augmenter l'épargne avec les économies réalisées"
- "Maintenir la discipline budgétaire pour atteindre les objectifs"

### 📊 Analytics et tendances
- Calcul automatique des variances par catégorie
- Identification des catégories sur/sous-budgétées
- Projections basées sur les tendances actuelles
- Recommandations d'ajustement personnalisées

La solution offre une gestion budgétaire personnelle complète avec suivi proactif, alertes intelligentes, objectifs d'épargne et recommandations personnalisées pour une maîtrise optimale des finances personnelles.
