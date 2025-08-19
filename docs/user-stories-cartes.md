# User Stories - Gestion des Cartes Bancaires

## US023: Consultation des cartes bancaires
**En tant que** client de la banque  
**Je veux** consulter la liste de mes cartes bancaires  
**Afin de** voir leurs statuts, plafonds et informations principales

### Critères d'acceptation:
- [ ] Affichage de toutes les cartes du client
- [ ] Informations visibles: numéro masqué, type, statut, date d'expiration
- [ ] Possibilité de révéler/masquer le numéro complet
- [ ] Affichage des plafonds journaliers et mensuels
- [ ] Dernière transaction visible pour chaque carte

## US024: Blocage/déblocage de carte
**En tant que** client de la banque  
**Je veux** pouvoir bloquer ou débloquer mes cartes  
**Afin de** sécuriser mes comptes en cas de perte ou vol

### Critères d'acceptation:
- [ ] Bouton de blocage pour les cartes actives
- [ ] Confirmation avant blocage avec dialog d'alerte
- [ ] Bouton de déblocage pour les cartes bloquées
- [ ] Notification de confirmation après action
- [ ] Mise à jour immédiate du statut

## US025: Modification des plafonds
**En tant que** client de la banque  
**Je veux** modifier les plafonds de mes cartes  
**Afin d'** adapter mes limites de dépense à mes besoins

### Critères d'acceptation:
- [ ] Interface de modification des plafonds journaliers et mensuels
- [ ] Validation des montants saisis
- [ ] Sauvegarde des nouveaux plafonds
- [ ] Notification de confirmation
- [ ] Respect des limites maximales autorisées

## US026: Historique des transactions par carte
**En tant que** client de la banque  
**Je veux** consulter l'historique des transactions de mes cartes  
**Afin de** suivre mes dépenses et vérifier les opérations

### Critères d'acceptation:
- [ ] Liste des transactions récentes par carte
- [ ] Informations: date, description, montant, type d'opération
- [ ] Identification de la carte utilisée
- [ ] Tri par date (plus récent en premier)
- [ ] Différenciation visuelle des débits/crédits

## US027: Paramètres de sécurité des cartes
**En tant que** client de la banque  
**Je veux** configurer les paramètres de sécurité de mes cartes  
**Afin de** contrôler les types de transactions autorisées

### Critères d'acceptation:
- [ ] Activation/désactivation des notifications SMS
- [ ] Autorisation des paiements en ligne
- [ ] Autorisation des paiements à l'étranger
- [ ] Interface simple avec boutons toggle
- [ ] Sauvegarde immédiate des préférences

## US028: Actions d'urgence
**En tant que** client de la banque  
**Je veux** avoir accès à des actions d'urgence  
**Afin de** réagir rapidement en cas de problème

### Critères d'acceptation:
- [ ] Bouton d'opposition sur toutes les cartes
- [ ] Confirmation obligatoire avant opposition générale
- [ ] Signalement de transaction frauduleuse
- [ ] Contact direct avec le service client
- [ ] Actions disponibles 24h/24

## US029: Demande de nouvelle carte
**En tant que** client de la banque  
**Je veux** pouvoir demander une nouvelle carte  
**Afin de** remplacer une carte perdue ou obtenir une carte supplémentaire

### Critères d'acceptation:
- [ ] Formulaire de demande de nouvelle carte
- [ ] Choix du type de carte (Visa, MasterCard, etc.)
- [ ] Motif de la demande (perte, vol, carte supplémentaire)
- [ ] Validation et soumission de la demande
- [ ] Suivi du statut de la demande
