# User Stories - Astra eBanking BNG

## 🏦 Fonctionnalités Principales

### 1. Authentification et Sécurité
- **US001**: Connexion avec authentification forte
- **US002**: Gestion du profil utilisateur
- **US003**: Changement de mot de passe
- **US004**: Gestion des sessions

### 2. Consultation des Comptes
- **US005**: Consultation des soldes
- **US006**: Historique des transactions
- **US007**: Téléchargement des relevés
- **US008**: Recherche dans les transactions

### 3. Virements
- **US009**: Virement BNG vers BNG
- **US010**: Virement vers banques confrères
- **US011**: Virement international
- **US012**: Gestion des bénéficiaires
- **US013**: Virements programmés

### 4. Paiements
- **US014**: Paiement de factures (EDG, SEG, etc.)
- **US015**: Recharge mobile
- **US016**: Paiement commerçant
- **US017**: Paiement de masse

### 5. Placements et Investissements
- **US022**: Ouverture de compte épargne
- **US023**: Placement à terme
- **US024**: Suivi des placements
- **US015**: Consultation du portefeuille de placements
- **US016**: Effectuer un placement financier en ligne
- **US017**: Simulation de rendement de placement
- **US018**: Suivi des échéances de placement

### 6. Services Bancaires
- **US018**: Génération du RIB
- **US019**: Demande de chéquier
- **US020**: Remise de chèques
- **US021**: Opposition sur moyens de paiement

### 7. Crédit
- **US025**: Demande de crédit
- **US026**: Suivi des crédits
- **US027**: Simulation de crédit

### 8. Support Client
- **US028**: Chat en direct
- **US029**: Réclamations
- **US030**: Localisation des agences

## 📋 Critères d'Acceptation Généraux

### Sécurité
- Authentification à deux facteurs obligatoire
- Chiffrement des données sensibles
- Logs d'audit pour toutes les opérations
- Timeout de session après inactivité

### Interface Utilisateur
- Design responsive (mobile, tablette, desktop)
- Interface en français
- Accessibilité WCAG 2.1 AA
- Temps de chargement < 3 secondes

### Fonctionnalités
- Validation côté client et serveur
- Messages d'erreur explicites
- Confirmations pour les opérations sensibles
- Historique des actions utilisateur

### Conformité
- Respect des réglementations BCRG
- Standards bancaires internationaux
- Protection des données personnelles
- Traçabilité complète des opérations

## US016 - Effectuer un placement financier en ligne

**Titre**: Permettre à un utilisateur d'investir dans un produit financier via la plateforme

**Rôle**: Client connecté (particulier ou entreprise)

**Besoin**: En tant qu'investisseur, je souhaite souscrire à un placement financier en ligne, afin de faire fructifier mon capital dans un produit adapté (actions, obligations, fonds, etc.)

**Critères d'acceptation**:
- Formulaire avec validation côté client et serveur
- Types de placement : Actions, Obligations, Fonds communs, Épargne à terme
- Montant minimum : 100,000 GNF
- Durée flexible : prédéfinie ou personnalisée (1-120 mois)
- Calcul automatique du rendement estimé
- Profil de risque requis
- Confirmation avec récapitulatif détaillé
- Génération d'une référence unique
- Email de confirmation automatique
- Suivi du statut dans l'espace client