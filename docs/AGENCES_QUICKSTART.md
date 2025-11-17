# Guide rapide - Page Localisation des Agences

## Configuration

### 1. Variables d'environnement

Créer ou modifier le fichier `.env.local` :

\`\`\`env
# URL du backend API (obligatoire)
NEXT_PUBLIC_API_URL=https://astra-apps.net:4000/

# ID du tenant (obligatoire)
NEXT_PUBLIC_TENANT_ID=aa1287f6-06af-45b7-a905-8c57363565c2

# URL du back-office (optionnel, défaut: https://back-office.bng.cm)
NEXT_PUBLIC_BACK_OFFICE_URL=https://back-office.bng.cm
\`\`\`

### 2. Fichier backup

Le fichier de backup JSON est déjà configuré dans `/public/data/agences-backup.json`.

Il contient 6 agences de démonstration. Pour le mettre à jour:
1. Modifier le fichier JSON
2. Redémarrer le serveur de développement (si nécessaire)

## Utilisation

### Pour les Clients

1. **Accéder à la page:**
   - URL: `/agences`
   - Lien dans le menu: "Nos Agences" ou "Localisation"

2. **Rechercher une agence:**
   - Utiliser la barre de recherche pour chercher par nom, adresse ou ville
   - Utiliser les filtres pour affiner par ville, pays ou statut

3. **Consulter les informations:**
   - **Vue Liste:** Cartes avec toutes les informations
   - **Vue Carte:** Carte interactive avec marqueurs
   - Cliquer sur un marqueur pour voir les détails
   - Utiliser "Itinéraire" pour obtenir la navigation GPS

4. **Contacter une agence:**
   - Bouton "Appeler" pour appeler directement
   - Bouton "Email" pour envoyer un email
   - Bouton "Itinéraire" pour ouvrir Google Maps

### Pour les Responsables réseau

En plus des fonctionnalités clients, les Responsables réseau ont accès à:

1. **Bouton "Mettre à jour les agences"**
   - Situé en haut à droite de la page
   - Redirige vers le Back-Office
   - Permet de gérer toutes les agences

2. **Gestion dans le Back-Office**
   - Créer de nouvelles agences
   - Modifier les informations existantes
   - Définir les horaires et fermetures
   - Gérer les services disponibles

## Fonctionnalités

### 🔍 Recherche et filtres
- **Recherche textuelle:** Cherche dans le nom, l'adresse et la ville
- **Filtre ville:** Sélectionne une ville spécifique
- **Filtre pays:** Sélectionne un pays spécifique
- **Filtre statut:** Affiche uniquement les agences ouvertes ou fermées

### 📋 Vue Liste
- Grille responsive (1-3 colonnes)
- Pagination (25 agences par page)
- Cartes avec toutes les informations
- Actions rapides (Appeler, Email, Itinéraire)

### 🗺️ Vue Carte
- Carte interactive SVG
- Marqueurs colorés selon le statut
- Popups au survol/clic
- Bouton "Me localiser" pour se géolocaliser
- Légende pour comprendre les couleurs

### 🏷️ Badges de statut
- **🟢 Ouvert:** L'agence est ouverte maintenant
- **⚫ Fermé:** L'agence est fermée maintenant
- **🔴 Fermeture exceptionnelle:** Fermée pour raison exceptionnelle
- **🟡 Jour férié:** Fermée pour jour férié

### ⏰ Horaires
- Horaires détaillés par jour de la semaine
- Indication des jours fermés
- Fermetures exceptionnelles à venir
- Jours fériés marqués

### 📞 Contact
- Téléphone cliquable (appel direct)
- Email cliquable (envoi d'email)
- Nom et téléphone du responsable d'agence
- Adresse complète avec code postal

### 🛣️ Itinéraire
- Ouverture dans Google Maps
- Navigation GPS vers l'agence
- Utilise les coordonnées GPS si disponibles
- Sinon utilise l'adresse textuelle

## Gestion des rôles

Le système détecte automatiquement le rôle de l'utilisateur connecté:

- **Client (par défaut):** Lecture seule, aucun bouton d'administration
- **Responsable réseau:** Bouton "Mettre à jour les agences" visible

Pour attribuer le rôle "Responsable réseau":
1. Aller dans le Back-Office
2. Section "Utilisateurs" ou "Gestion des accès"
3. Modifier le rôle de l'utilisateur
4. Ajouter le rôle "Responsable réseau"

## États spéciaux

### Fermeture exceptionnelle

Une agence peut être fermée exceptionnellement pour diverses raisons:
- Travaux
- Événement spécial
- Formation du personnel
- Etc.

**Affichage:**
- Badge rouge avec la raison
- Marqueur rouge sur la carte
- Message dans la liste des fermetures à venir

**Configuration dans le Back-Office:**
\`\`\`json
{
  "exceptionalClosures": [
    {
      "date": "2025-12-24",
      "reason": "Réveillon de Noël"
    }
  ]
}
\`\`\`

### Jour férié

Les agences peuvent être fermées pour les jours fériés nationaux.

**Affichage:**
- Badge jaune "Fermé - Jour férié"
- Marqueur jaune sur la carte

**Configuration dans le Back-Office:**
\`\`\`json
{
  "publicHolidays": [
    "2025-12-25",
    "2026-01-01"
  ]
}
\`\`\`

### Fermeture temporaire

Une agence peut être temporairement fermée pour une durée indéterminée.

**Affichage:**
- Badge gris "Fermé temporairement"
- Marqueur gris sur la carte

**Configuration dans le Back-Office:**
\`\`\`json
{
  "isTemporarilyClosed": true
}
\`\`\`

## Fallback et cache

### Cache (5 minutes)

Les données des agences sont mises en cache pendant 5 minutes côté client pour:
- Réduire la charge serveur
- Améliorer les performances
- Accélérer la navigation

**Comportement:**
- Premier chargement: Appel API
- Chargements suivants (< 5 min): Cache
- Après 5 min: Nouvel appel API

### Fallback automatique

Si l'API est indisponible, le système bascule automatiquement sur le backup JSON:

**Comportement:**
1. Tentative d'appel à l'API principale
2. Si échec: Chargement du backup JSON
3. Affichage d'un message "Mode hors ligne - Données de sauvegarde"
4. Les données du backup sont également mises en cache

**Message affiché:**
\`\`\`
ℹ️ Mode hors ligne - Données de sauvegarde
\`\`\`

## Accessibilité

La page respecte les normes WCAG 2.1 niveau AA:

### Navigation clavier
- **Tab:** Avancer entre les éléments
- **Shift+Tab:** Reculer entre les éléments
- **Enter/Space:** Activer un bouton
- **Flèches:** Naviguer dans les dropdowns

### Lecteurs d'écran
- Tous les éléments ont des labels appropriés
- Les icônes décoratives sont masquées (`aria-hidden`)
- Les rôles ARIA sont définis correctement
- La langue est définie (`lang="fr"`)

### Contrastes
- Texte normal: minimum 4.5:1
- Texte large: minimum 3:1
- Éléments interactifs: minimum 3:1

### Focus visible
- Ring bleu de 2px sur tous les éléments focusables
- Visible sur tous les navigateurs
- Pas de suppression du focus

## Performances

### Optimisations appliquées
- ✅ Cache 5 minutes côté client
- ✅ Lazy loading de la carte
- ✅ Pagination (25 agences/page)
- ✅ Filtrage côté client (rapide)
- ✅ Images optimisées
- ✅ Pas de librairies lourdes

### Métriques attendues
- **FCP (First Contentful Paint):** < 1.5s
- **LCP (Largest Contentful Paint):** < 2.5s
- **CLS (Cumulative Layout Shift):** < 0.1
- **FID (First Input Delay):** < 100ms

## Dépannage

### La page ne charge pas

1. Vérifier les variables d'environnement
2. Vérifier que l'API est accessible
3. Vérifier le fichier backup JSON
4. Vérifier la console du navigateur

### Les agences ne s'affichent pas

1. Vérifier que l'API retourne des données
2. Vérifier le format des données (doit correspondre à l'interface `Agence`)
3. Vérifier les filtres appliqués
4. Essayer de réinitialiser les filtres

### Le bouton "Mettre à jour" n'apparaît pas

1. Vérifier que l'utilisateur a le rôle "Responsable réseau"
2. Vérifier que l'utilisateur est connecté
3. Vérifier le `TENANT_ID` dans les variables d'environnement
4. Vérifier le localStorage (`user` doit contenir les infos de l'utilisateur)

### La carte ne s'affiche pas

1. Vérifier que les agences ont des coordonnées (`latitude` et `longitude`)
2. Vérifier la console pour les erreurs JavaScript
3. Essayer de recharger la page
4. Vérifier que la vue "Carte" est bien sélectionnée

### Les itinéraires ne fonctionnent pas

1. Vérifier que l'agence a des coordonnées GPS ou une adresse
2. Vérifier que Google Maps est accessible
3. Essayer avec une autre agence
4. Vérifier la console pour les erreurs

## Support

Pour toute question ou problème:
- Contacter l'équipe technique BNG
- Consulter la documentation complète: `/docs/AGENCES_IMPLEMENTATION.md`
- Ouvrir un ticket de support

## Changelog

### Version 1.0.0 (2025-11-03)
- ✨ Implémentation initiale
- ✨ Vue Liste et Carte
- ✨ Filtres avancés
- ✨ Gestion des rôles
- ✨ Fallback automatique
- ✨ Cache 5 minutes
- ✨ Accessibilité AA
- ✨ Documentation complète
