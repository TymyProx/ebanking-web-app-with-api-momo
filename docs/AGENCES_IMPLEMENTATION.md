# Implémentation de la page Localisation des Agences

## Vue d'ensemble

La page de localisation des agences est une interface complète permettant aux clients de trouver et consulter les informations des agences BNG. Elle offre deux modes de visualisation (Liste/Carte), des filtres avancés, et une gestion des rôles pour les Responsables réseau.

## Architecture

### 1. Hook personnalisé: `useAgences`
**Fichier:** `/hooks/use-agences.ts`

#### Fonctionnalités
- **Cache intelligent:** Les données sont mises en cache pendant 5 minutes côté client
- **Fallback automatique:** En cas d'indisponibilité de l'API, le système bascule sur un fichier JSON de backup fourni par l'équipe Marketing
- **Pagination:** Support de la pagination avec 25 agences par page
- **Filtres multiples:** Recherche textuelle, filtres par ville, pays et statut

#### API
```typescript
const { 
  agences,           // Liste paginée des agences filtrées
  loading,           // État de chargement
  error,             // Message d'erreur (null si OK)
  totalCount,        // Nombre total d'agences
  totalPages,        // Nombre total de pages
  currentPage,       // Page actuelle
  refetch,           // Fonction pour recharger
  setQuery           // Fonction pour modifier les filtres
} = useAgences({
  search: "Yaoundé",
  city: "all",
  country: "all",
  status: "open",
  page: 1,
  limit: 25
})
```

#### Fonction utilitaire: `getAgenceStatus`
Retourne le statut d'une agence avec des informations visuelles:
```typescript
const status = getAgenceStatus(agence)
// Retourne: { status: "open" | "closed" | "exceptional" | "holiday", label: string, color: string }
```

### 2. Composant `AgenceCard`
**Fichier:** `/components/agence-card.tsx`

#### Fonctionnalités
- Affichage complet des informations d'une agence
- Badges de statut colorés (vert=ouvert, rouge=fermé, jaune=jour férié)
- Horaires d'ouverture détaillés
- Services disponibles
- Actions rapides: Appeler, Email, Itinéraire
- **Accessibilité AA:** Contrastes conformes, focus visible, ARIA labels

#### Props
```typescript
interface AgenceCardProps {
  agence: Agence
  onGetDirections?: (agence: Agence) => void
}
```

#### Badges spéciaux
- **Fermeture exceptionnelle:** Badge rouge avec la raison
- **Jour férié:** Badge jaune
- **Fermé temporairement:** Badge gris

### 3. Composant `AgenceMap`
**Fichier:** `/components/agence-map.tsx`

#### Fonctionnalités
- Carte interactive SVG avec marqueurs personnalisés
- Clustering visuel automatique des agences proches
- Popups au survol/clic avec informations détaillées
- Géolocalisation de l'utilisateur
- Marqueurs colorés selon le statut
- Bouton "Obtenir l'itinéraire" intégré
- **Chargement paresseux** pour optimiser les performances

#### Props
```typescript
interface AgenceMapProps {
  agences: Agence[]
  selectedAgence?: Agence | null
  onAgenceSelect?: (agence: Agence) => void
  onGetDirections?: (agence: Agence) => void
  className?: string
}
```

#### Légende de la carte
- 🟢 Vert: Agence ouverte
- ⚫ Gris: Agence fermée
- 🔴 Rouge: Fermeture exceptionnelle
- 🟡 Jaune: Jour férié

### 4. Page principale: `AgencesPage`
**Fichier:** `/app/agences/page.tsx`

#### Fonctionnalités

##### Gestion des rôles
- **Client:** Lecture seule, aucun bouton d'administration
- **Responsable réseau:** Bouton "Mettre à jour les agences" qui redirige vers le Back-Office

##### Filtres avancés
- **Recherche textuelle:** Nom, adresse, ville
- **Filtre ville:** Dropdown avec toutes les villes uniques
- **Filtre pays:** Dropdown avec tous les pays uniques
- **Filtre statut:** Tous / Ouvert maintenant / Fermé
- **Bouton réinitialiser:** Efface tous les filtres

##### Vues
- **Vue Liste:** Grille responsive (1-3 colonnes) avec pagination
- **Vue Carte:** Carte interactive avec tous les marqueurs
- **Bascule Liste/Carte:** Tabs avec icônes

##### Pagination
- 25 agences par page
- Navigation: Précédent / Pages / Suivant
- Scroll automatique vers le haut lors du changement de page
- Ellipsis pour les grandes listes

##### États
- **Chargement:** Spinner avec message "Chargement..."
- **Vide:** Message et illustration "Aucune agence trouvée"
- **Erreur API:** Alert avec fallback sur le backup JSON
- **Fallback mode:** Message "Mode hors ligne - Données de sauvegarde"

##### Accessibilité (AA)
- Langue définie: `lang="fr"`
- ARIA labels sur tous les contrôles
- Focus visible sur tous les éléments interactifs
- Contraste minimum 4.5:1
- Navigation clavier complète
- Textes alternatifs sur les icônes (`aria-hidden="true"`)
- Rôles ARIA: `region`, `tablist`, `button`, `navigation`

##### Performance
- Cache 5 minutes côté client
- Lazy loading de la carte (chargement uniquement quand sélectionnée)
- Requêtes paginées (25 agences max par requête)
- Optimisation du rendu avec filtres côté client

## Fichiers de données

### Backup JSON Marketing
**Fichier:** `/public/data/agences-backup.json`

Structure:
```json
{
  "agences": [
    {
      "id": "agence-001",
      "agenceName": "Agence Centrale Yaoundé",
      "address": "Avenue Kennedy, Immeuble BNG",
      "city": "Yaoundé",
      "country": "Cameroun",
      "postalCode": "BP 1234",
      "latitude": 3.8667,
      "longitude": 11.5167,
      "telephone": "+237 222 123 456",
      "email": "yaounde.central@bng.cm",
      "branchManagerName": "Marie NKOTTO",
      "branchManagerPhone": "+237 699 123 456",
      "services": ["Comptes courants", "Épargne", "Crédits", "..."],
      "openingHours": {
        "mon": { "open": "08:00", "close": "16:00", "closed": false },
        "tue": { "open": "08:00", "close": "16:00", "closed": false },
        ...
      },
      "exceptionalClosures": [
        { "date": "2025-12-24", "reason": "Réveillon de Noël" }
      ],
      "publicHolidays": ["2025-12-25", "2026-01-01"],
      "isTemporarilyClosed": false
    }
  ]
}
```

Ce fichier est automatiquement utilisé si l'API principale est indisponible.

## API Backend

### Endpoint principal
```
GET /api/portal/{tenantId}/agences
```

Réponse attendue:
```json
{
  "rows": [
    { /* agence object */ }
  ]
}
```

## Variables d'environnement

### Required
- `NEXT_PUBLIC_API_URL`: URL du backend API
- `NEXT_PUBLIC_TENANT_ID`: ID du tenant

### Optional
- `NEXT_PUBLIC_BACK_OFFICE_URL`: URL du Back-Office (défaut: `https://back-office.bng.cm`)

## États spéciaux

### Fermeture exceptionnelle
Une agence en fermeture exceptionnelle affiche:
- Badge rouge dans la carte
- Marqueur rouge sur la carte
- Raison de la fermeture dans le détail

### Jour férié
Une agence fermée pour jour férié affiche:
- Badge jaune dans la carte
- Marqueur jaune sur la carte
- Label "Fermé - Jour férié"

### Fermeture temporaire
Une agence temporairement fermée (`isTemporarilyClosed: true`) affiche:
- Badge gris
- Marqueur gris
- Label "Fermé temporairement"

## Gestion des rôles

Le système vérifie le rôle de l'utilisateur dans `user.tenants[].roles`:
- Si le rôle contient "Responsable réseau" ou "network_manager", le bouton "Mettre à jour les agences" s'affiche
- Le bouton ouvre le Back-Office dans un nouvel onglet sur `/agences`

## Fonctionnalités d'accessibilité

### Contrastes (WCAG AA)
- Texte normal: minimum 4.5:1
- Texte large: minimum 3:1
- Contrôles interactifs: minimum 3:1

### Navigation clavier
- Tab/Shift+Tab: Navigation entre les éléments
- Enter/Space: Activation des boutons
- Flèches: Navigation dans les dropdowns

### Lecteurs d'écran
- ARIA labels sur tous les contrôles
- ARIA roles appropriés
- ARIA live regions pour les mises à jour dynamiques
- Textes alternatifs pour les images et icônes

### Focus visible
- Ring bleu de 2px sur tous les éléments focusables
- Offset de 2px pour éviter le chevauchement

## Tests suggérés

### Tests fonctionnels
1. Vérifier que les agences se chargent depuis l'API
2. Vérifier le fallback sur le backup JSON en cas d'erreur API
3. Tester les filtres (recherche, ville, pays, statut)
4. Tester la pagination (page suivante, précédente, numéro)
5. Tester la bascule Liste/Carte
6. Vérifier l'affichage des badges de statut
7. Tester les actions (Appeler, Email, Itinéraire)
8. Vérifier le bouton "Mettre à jour" pour les Responsables réseau

### Tests d'accessibilité
1. Navigation complète au clavier
2. Test avec lecteur d'écran (NVDA, JAWS, VoiceOver)
3. Vérification des contrastes avec un outil (axe DevTools)
4. Test de zoom 200%
5. Test sans CSS

### Tests de performance
1. Vérifier le cache (5 minutes)
2. Mesurer le temps de chargement initial
3. Tester avec 100+ agences
4. Vérifier le lazy loading de la carte

## Maintenance

### Mise à jour du backup JSON
L'équipe Marketing peut mettre à jour le fichier `/public/data/agences-backup.json` à tout moment. Le fichier sera automatiquement utilisé en fallback.

### Ajout de nouveaux services
Pour ajouter de nouveaux services aux agences, il suffit de les inclure dans le tableau `services` de chaque agence dans l'API ou le backup JSON.

### Modification des horaires
Les horaires sont définis par jour de la semaine. Pour modifier:
1. Mettre à jour `openingHours` dans l'API/backup
2. Utiliser `closed: true` pour les jours fermés
3. Format horaire: "HH:MM" (24h)

## Dépendances

### Composants UI (shadcn/ui)
- Card
- Button
- Input
- Select
- Badge
- Tabs
- Alert
- Pagination (créé)
- Tooltip
- Sheet

### Icônes (lucide-react)
- MapPin, Phone, Clock, Navigation, Mail, Users
- Search, Filter, List, Map
- Settings, ExternalLink
- Loader2, AlertCircle

### Utilitaires
- `use-toast`: Pour les notifications
- `auth-service`: Pour la gestion des utilisateurs et rôles
- `config`: Pour les URLs d'API

## Améliorations futures possibles

1. **Clustering avancé:** Implémenter react-leaflet pour un clustering automatique
2. **Géolocalisation en temps réel:** Tri automatique par distance
3. **Favoris:** Permettre aux utilisateurs de sauvegarder leurs agences favorites
4. **Rendez-vous:** Intégration d'un système de prise de rendez-vous
5. **Temps d'attente:** Affichage du temps d'attente en temps réel
6. **Notes et avis:** Permettre aux clients de noter les agences
7. **Services en ligne:** Indiquer quels services sont disponibles en ligne
8. **Notifications:** Alertes pour les fermetures exceptionnelles des agences favorites

## Support

Pour toute question sur l'implémentation, contacter l'équipe technique BNG.
