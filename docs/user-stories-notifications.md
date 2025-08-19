# User Stories - Notifications Automatiques

## 🟦 US018 – Avis de débit automatique après transaction

**Titre :** Notification automatique de débit sur un compte bancaire

**Rôle :** Client titulaire d'un compte bancaire

**Besoin :** En tant qu'utilisateur, je souhaite recevoir un avis de débit avec tous les détails dès qu'une transaction de retrait ou de paiement est effectuée sur mon compte, afin de rester informé en temps réel de l'activité sur mon compte.

**Objectif métier :** Améliorer la transparence et renforcer la confiance client à travers des notifications automatiques de débit.

### Pré-conditions :
- Le client est inscrit au service de notification
- Le système de monitoring des transactions est actif

### Flux principal :
1. Lorsqu'une transaction de débit est validée sur un compte utilisateur
2. Le système collecte automatiquement les informations suivantes :
   - Nom complet du titulaire
   - Numéro de compte bancaire
   - Adresse e-mail
   - Numéro de téléphone
   - Montant de la transaction
   - Date de la transaction
   - Nom du bénéficiaire
3. Le système valide les données :
   - Numéro de compte formaté et reconnu
   - Adresse e-mail valide
   - Numéro de téléphone valide
   - Montant positif
   - Date au bon format
4. Une notification (email, SMS, ou push) est envoyée automatiquement à l'utilisateur avec les détails
5. L'avis de débit est archivé dans l'espace client (historique des notifications)

### Feedback utilisateur :
✅ "Vous avez été débité de 25 000 GNF le 22/07/2025 pour un paiement à ORANGE CI. Solde actuel : 125 000 GNF."

### Post-conditions :
- Notification visible dans l'historique
- Données conservées pour audit ou preuve

---

## 🟦 US019 – Avis de crédit automatique lors de réception de fonds

**Titre :** Notification automatique de crédit reçu sur un compte bancaire

**Rôle :** Client titulaire d'un compte bancaire

**Besoin :** En tant qu'utilisateur, je souhaite être notifié dès qu'un crédit est effectué sur mon compte bancaire, afin de rester informé des rentrées d'argent (virements, versements, salaires, etc.).

**Objectif métier :** Renforcer la transparence des opérations bancaires et améliorer l'expérience client avec une communication proactive sur les crédits reçus.

### Pré-conditions :
- Le compte est actif
- Le service de notification est activé

### Flux principal :
1. Lorsqu'un crédit est détecté sur un compte client
2. Le système collecte automatiquement :
   - Nom complet du bénéficiaire
   - Numéro de compte bancaire
   - Adresse e-mail
   - Numéro de téléphone
   - Montant du crédit
   - Date du crédit
   - Origine du crédit (libellé, employeur, banque, etc.)
3. Les contrôles sont appliqués :
   - Numéro de compte valide
   - Email valide
   - Téléphone bien formaté
   - Montant positif
   - Date de crédit correcte
4. Une notification est générée automatiquement
5. L'utilisateur reçoit un message (email, SMS ou notification push)

### Feedback utilisateur :
✅ "Vous avez reçu un crédit de 50 000 GNF le 22/07/2025 de la part de SOTRAGUI. Solde actuel : 180 000 GNF."

### Post-conditions :
- L'avis de crédit est enregistré dans l'espace client
- Historique téléchargeable en PDF ou CSV

---

## Fonctionnalités implémentées

### ✅ Interface de gestion des notifications
- **Consultation des notifications** : Liste chronologique avec statut lu/non lu
- **Filtrage par type** : Débits, crédits, tous types
- **Marquage comme lu** : Action individuelle sur chaque notification
- **Badges de notification** : Compteur de notifications non lues

### ✅ Paramètres de notification
- **Canaux de communication** : Email, SMS, Push
- **Types de notifications** : Débits, crédits
- **Seuils personnalisables** : Montant minimum pour notification
- **Activation/désactivation** : Contrôle granulaire par type et canal

### ✅ Notifications automatiques
- **Débit automatique** : Envoi immédiat lors d'une transaction de débit
- **Crédit automatique** : Notification instantanée lors de réception de fonds
- **Multi-canal** : Envoi simultané sur email, SMS et push
- **Formatage intelligent** : Messages adaptés au canal de communication

### ✅ Historique et export
- **Archivage complet** : Toutes les notifications sont conservées
- **Export PDF/CSV** : Téléchargement de l'historique
- **Audit trail** : Traçabilité complète des envois
- **Recherche et filtrage** : Outils de consultation avancés

### ✅ Sécurité et conformité
- **Validation des données** : Contrôles de format et cohérence
- **Logs d'audit** : Traçabilité complète des actions
- **Gestion des erreurs** : Retry automatique et alertes
- **Protection des données** : Chiffrement des informations sensibles

## Critères d'acceptation

### US018 - Avis de débit
- [x] Détection automatique des transactions de débit
- [x] Collecte des informations complètes de transaction
- [x] Validation des données avant envoi
- [x] Envoi multi-canal (email, SMS, push)
- [x] Message formaté avec tous les détails requis
- [x] Archivage dans l'historique client
- [x] Gestion des erreurs d'envoi

### US019 - Avis de crédit
- [x] Détection automatique des crédits reçus
- [x] Identification de l'origine du crédit
- [x] Validation des informations de crédit
- [x] Notification immédiate multi-canal
- [x] Message personnalisé selon l'origine
- [x] Sauvegarde dans l'espace client
- [x] Export de l'historique disponible

## Tests et validation

### Scénarios de test
1. **Transaction de débit** : Vérification de l'envoi automatique
2. **Réception de crédit** : Validation de la notification immédiate
3. **Paramètres utilisateur** : Respect des préférences de canal
4. **Gestion d'erreurs** : Comportement en cas d'échec d'envoi
5. **Performance** : Temps de traitement des notifications
6. **Sécurité** : Protection des données sensibles

### Métriques de succès
- **Taux de livraison** : > 99% des notifications envoyées
- **Temps de traitement** : < 30 secondes après validation transaction
- **Satisfaction client** : Feedback positif sur la transparence
- **Réduction des appels** : Moins de demandes d'information sur les transactions
