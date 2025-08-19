# User Stories - Localisation des Agences

## US030: Consultation des agences
**En tant que** client de la banque  
**Je veux** consulter la liste des agences BNG  
**Afin de** trouver l'agence la plus proche de moi

### Critères d'acceptation:
- [ ] Liste complète des agences avec informations détaillées
- [ ] Affichage: nom, adresse, commune, téléphone
- [ ] Horaires d'ouverture pour chaque agence
- [ ] Services disponibles dans chaque agence
- [ ] Interface responsive et accessible

## US031: Recherche et filtrage des agences
**En tant que** client de la banque  
**Je veux** rechercher et filtrer les agences  
**Afin de** trouver rapidement l'agence qui correspond à mes besoins

### Critères d'acceptation:
- [ ] Barre de recherche par nom, adresse ou commune
- [ ] Filtre par commune avec liste déroulante
- [ ] Résultats mis à jour en temps réel
- [ ] Message informatif si aucun résultat
- [ ] Réinitialisation facile des filtres

## US032: Géolocalisation et calcul de distance
**En tant que** client de la banque  
**Je veux** utiliser ma position géographique  
**Afin de** voir les agences triées par distance

### Critères d'acceptation:
- [ ] Bouton "Me localiser" avec demande d'autorisation
- [ ] Calcul automatique des distances
- [ ] Tri des agences par proximité
- [ ] Affichage de la distance en kilomètres
- [ ] Gestion des erreurs de géolocalisation

## US033: Navigation vers les agences
**En tant que** client de la banque  
**Je veux** obtenir un itinéraire vers une agence  
**Afin de** m'y rendre facilement

### Critères d'acceptation:
- [ ] Bouton "Itinéraire" pour chaque agence
- [ ] Ouverture de Google Maps avec destination
- [ ] Bouton d'appel direct vers l'agence
- [ ] Intégration native avec les applications de navigation
- [ ] Fonctionnement sur mobile et desktop

## US034: Informations détaillées des agences
**En tant que** client de la banque  
**Je veux** consulter les informations détaillées de chaque agence  
**Afin de** connaître les services disponibles et horaires

### Critères d'acceptation:
- [ ] Horaires détaillés (semaine, samedi, dimanche)
- [ ] Liste des services disponibles avec badges
- [ ] Coordonnées complètes (téléphone, email)
- [ ] Adresse précise avec commune
- [ ] Présentation claire et organisée

## US035: Contact direct avec les agences
**En tant que** client de la banque  
**Je veux** contacter directement une agence  
**Afin d'** obtenir des informations ou prendre rendez-vous

### Critères d'acceptation:
- [ ] Bouton d'appel direct depuis l'interface
- [ ] Numéro de téléphone cliquable sur mobile
- [ ] Adresse email visible et accessible
- [ ] Intégration avec l'application téléphone
- [ ] Confirmation avant lancement de l'appel

## Titre
Permettre à un utilisateur de localiser les agences Astra BNG les plus proches

## Rôle
Utilisateur de l'application (client ou prospect)

## Besoin
En tant qu'utilisateur, je souhaite pouvoir localiser facilement les agences Astra BNG près de chez moi, afin de me rendre sur place pour des opérations nécessitant un déplacement.

## Objectif métier
Faciliter l'accès aux services physiques de la banque et améliorer l'expérience client en fournissant des informations pratiques sur les agences.

## Fonctionnalités implémentées

### 1. Localisation automatique
- **Géolocalisation GPS** : Détection automatique de la position de l'utilisateur
- **Calcul des distances** : Tri des agences par proximité
- **Gestion des erreurs** : Message informatif si la géolocalisation échoue

### 2. Recherche et filtrage
- **Recherche textuelle** : Par nom d'agence, commune ou adresse
- **Filtre par commune** : Sélection d'une commune spécifique
- **Résultats en temps réel** : Mise à jour automatique des résultats

### 3. Informations détaillées par agence
- **Nom et localisation** : Nom de l'agence et commune
- **Adresse complète** : Adresse détaillée avec ville
- **Coordonnées** : Numéro de téléphone
- **Horaires d'ouverture** : Horaires détaillés (semaine, samedi, dimanche)
- **Services disponibles** : Liste des services proposés
- **Distance** : Affichage de la distance si géolocalisation activée

### 4. Actions pratiques
- **Itinéraire Google Maps** : Bouton pour ouvrir l'itinéraire dans Google Maps
- **Appel direct** : Bouton pour appeler l'agence directement
- **Interface responsive** : Adaptation mobile et desktop

### 5. Agences disponibles
1. **Agence Plateau** - Avenue Chardy, Immeuble SCIAM
2. **Agence Cocody** - Boulevard Lagunaire, Riviera Golf
3. **Agence Marcory** - Boulevard VGE, Zone 4C
4. **Agence Treichville** - Avenue 7, près du marché
5. **Agence Adjamé** - Boulevard Nangui Abrogoua

### 6. Services par agence
- **Guichets automatiques** : Disponibles dans toutes les agences
- **Conseillers** : Service conseil personnalisé
- **Services spécialisés** : Coffres-forts, Change, Western Union, Espace entreprises, Microfinance

## Interface utilisateur
- **Page dédiée** : `/agences` accessible depuis la navigation
- **Carte de recherche** : Filtres et barre de recherche
- **Grille d'agences** : Affichage en cartes avec toutes les informations
- **Badges visuels** : Distance, services, statut
- **Boutons d'action** : Itinéraire et appel téléphonique

## Gestion des erreurs
- **Géolocalisation refusée** : Message informatif, fonctionnalité dégradée
- **Aucun résultat** : Message d'aide pour modifier les critères
- **Erreurs de connexion** : Gestion gracieuse des erreurs réseau

## Statut
✅ **Implémenté** - Interface complète avec géolocalisation, recherche et informations détaillées

## Intégration
- **Navigation** : Lien ajouté dans la sidebar sous "Trouver une agence"
- **Footer** : Lien vers les agences dans la section support
- **Responsive** : Interface adaptée mobile et desktop
- **Accessibilité** : Icônes et labels appropriés pour les lecteurs d'écran
