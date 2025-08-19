# User Story US020 - Gestion budgétaire avec suivi des revenus et objectifs

## Titre
Permettre à l'utilisateur de gérer son budget avec suivi des revenus, objectifs de dépenses et alertes de dépassement

## Rôle
Client particulier ou entreprise utilisant l'application bancaire

## Besoin
En tant qu'utilisateur, je souhaite définir mes revenus mensuels et objectifs de dépenses, puis suivre mes dépenses par catégorie avec des alertes automatiques, afin de mieux contrôler mon budget et éviter les dépassements.

## Objectif métier
Fournir un outil de gestion financière personnelle (PFM) complet avec alertes proactives pour encourager une gestion responsable des finances et réduire les découverts.

## Pré-conditions
- L'utilisateur est connecté à son compte
- Il dispose d'informations sur ses revenus mensuels
- Il souhaite définir des objectifs budgétaires

## Déclencheur
L'utilisateur clique sur "Gestion budgétaire" dans le tableau de bord

## Flux principal

### 1. Configuration initiale du budget
L'utilisateur renseigne ses informations budgétaires :
- Nom complet (pré-rempli)
- Numéro de compte bancaire
- Adresse e-mail
- Numéro de téléphone
- Revenu mensuel
- Objectif de dépense mensuel (plafond à ne pas dépasser)

### 2. Ajout des dépenses
Il ajoute ses dépenses manuellement ou via catégorisation automatique :
- Catégorie de dépense (ex. : Logement, Alimentation, Transport…)
- Montant de la dépense
- Date de la dépense

### 3. Contrôles système
Le système effectue les contrôles suivants :
- Numéro de compte valide
- Email et téléphone bien formatés
- Revenu mensuel et objectif de dépense sont des montants positifs
- Catégorie bien sélectionnée
- Montant de dépense positif
- Date de la dépense antérieure ou égale à la date du jour

### 4. Mise à jour et alertes
Le système enregistre les données et :
- Affiche un graphique d'évolution des dépenses vs budget
- Indique la part restante du budget mensuel
- Alerte si l'objectif est dépassé

## Flux alternatifs / erreurs
- ❌ Email invalide → "Veuillez saisir une adresse email valide."
- ❌ Montant ou revenu négatif → "Le montant doit être supérieur à 0."
- ❌ Catégorie non sélectionnée → "Choisissez une catégorie de dépense."
- ❌ Objectif inférieur au total des dépenses → "Votre objectif est déjà dépassé."

## Feedback utilisateur
- ✅ "Votre budget a été mis à jour avec succès. Vous avez utilisé 48% de votre objectif mensuel."
- ✅ "Dépense ajoutée à la catégorie 'Transport'. Il vous reste 100,000 GNF pour ce mois."
- ⚠️ "Attention : vous avez dépassé votre budget mensuel de 20%."

## Post-conditions
L'utilisateur peut consulter :
- Le graphique de suivi du budget
- Un rapport budgétaire mensuel ou hebdomadaire (PDF, CSV)
- Une alerte proactive lorsqu'il approche ou dépasse un seuil défini
- Les données sont sauvegardées pour analyses futures

## Données techniques à prévoir
- Suivi des revenus, des dépenses et des objectifs mensuels
- Catégorisation automatique des transactions (libellés, types de marchands)
- Visualisation dynamique (graphiques circulaires, barres, jauges)
- Notifications (push, email) lors de dépassement de seuil
- Export mensuel et archivage des rapports

## Fonctionnalités implémentées

### ✅ Configuration budgétaire
- Paramétrage des revenus mensuels et objectifs de dépenses
- Validation des montants et cohérence budgétaire
- Interface de configuration intuitive

### ✅ Suivi en temps réel
- Jauge de progression budgétaire avec code couleur
- Calcul automatique du pourcentage d'utilisation du budget
- Alertes visuelles pour dépassements et seuils critiques
- Mise à jour instantanée lors d'ajout de dépenses

### ✅ Visualisations avancées
- Graphique Budget vs Dépenses par mois
- Répartition des dépenses par catégorie avec budgets alloués
- Évolution mensuelle des habitudes de consommation
- Indicateurs de performance budgétaire

### ✅ Système d'alertes intelligent
- Alertes à 80% d'utilisation du budget
- Notifications de dépassement avec pourcentage
- Messages contextuels selon l'état budgétaire
- Recommandations d'ajustement automatiques

### ✅ Gestion par catégories
- 9 catégories prédéfinies avec budgets individuels
- Suivi détaillé par poste de dépense
- Comparaison budget alloué vs dépenses réelles
- Identification des catégories en dépassement

### ✅ Rapports et exports
- Export PDF, CSV et Excel des données budgétaires
- Rapports mensuels avec analyses détaillées
- Historique complet des transactions
- Statistiques de performance budgétaire

### ✅ Interface utilisateur optimisée
- Design responsive avec codes couleur intuitifs
- Formulaires de saisie avec validation en temps réel
- Navigation par onglets pour différentes vues
- Feedback immédiat sur les actions utilisateur

## Critères d'acceptation validés
- [x] Configuration des revenus et objectifs budgétaires
- [x] Ajout manuel des dépenses avec catégorisation
- [x] Validation complète des données saisies
- [x] Calcul automatique des pourcentages d'utilisation
- [x] Alertes visuelles et notifications de dépassement
- [x] Visualisations graphiques Budget vs Dépenses
- [x] Suivi détaillé par catégorie avec budgets alloués
- [x] Export des rapports budgétaires multi-formats
- [x] Interface intuitive avec feedback contextuel
- [x] Gestion des seuils d'alerte personnalisables

## Messages de feedback implémentés

### ✅ Succès
- "Votre budget a été mis à jour avec succès. Vous avez utilisé X% de votre objectif mensuel."
- "Dépense ajoutée à la catégorie 'Transport'. Il vous reste X GNF pour ce mois."

### ⚠️ Alertes
- "Attention : vous approchez de votre limite budgétaire (X% utilisé)."
- "Attention : vous avez dépassé votre budget mensuel de X%."

### ❌ Erreurs spécifiques
- "Veuillez saisir une adresse email valide."
- "Le montant doit être supérieur à 0."
- "Choisissez une catégorie de dépense."
- "Votre objectif est déjà dépassé par vos dépenses actuelles."

La solution offre une gestion budgétaire complète avec suivi proactif, alertes intelligentes et visualisations avancées pour une meilleure maîtrise des finances personnelles.
