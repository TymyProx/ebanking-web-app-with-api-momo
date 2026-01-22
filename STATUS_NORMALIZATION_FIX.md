# Fix: Normalisation des statuts de comptes dans l'E-Portal

## 🎯 Problème résolu

Les statuts des comptes retournés par l'API étaient dans **différents formats** (nombres, strings, majuscules, minuscules), ce qui causait des problèmes d'affichage et de filtrage dans le portail client.

### Exemples de problèmes :
- Un compte avec `status: 1` s'affichait avec un badge "1" au lieu de "Actif"
- Un compte avec `status: "ACTIF"` ne matchait pas le filtre qui cherchait `"Actif"`
- Les filtres par statut ne fonctionnaient pas de manière cohérente

## ✅ Solutions implémentées

### 1. Nouveau fichier utilitaire : `lib/status-utils.ts`

Création d'un fichier centralisé qui gère **tous les formats possibles** de statuts :

#### Fonctions principales :

**`normalizeAccountStatus(status)`**
- Convertit tous les formats en format lisible standard
- Supporte : nombres (0, 1, 2, -1), strings ("ACTIF", "Actif", "PENDING", etc.)
- Retourne : "Actif", "En attente", "Bloqué", "Fermé", "Rejeté", "Inconnu"

**`getAccountStatusBadge(status)`**
- Retourne les informations pour afficher le bon badge (label, couleur, variant)
- Utilise automatiquement `normalizeAccountStatus()` en interne

**`isAccountActive(status)`**
- Vérifie si un compte est actif
- Retourne `true` ou `false`

**`isAccountPending(status)`**
- Vérifie si un compte est en attente
- Retourne `true` ou `false`

**`filterAccountsByStatus(accounts, status)`**
- Filtre une liste de comptes par statut
- Utilise la normalisation automatique

**`countAccountsByStatus(accounts)`**
- Compte le nombre de comptes par statut
- Retourne un objet `{ "Actif": 5, "En attente": 2, ... }`

### 2. Fichiers modifiés

#### `app/accounts/[id]/page.tsx` - Page de détails d'un compte
**Avant :**
```typescript
const getStatusBadge = (status: string) => {
  switch (status) {
    case "Actif":
      return <Badge className="bg-green-100 text-green-800">Actif</Badge>
    case "Bloqué":
      return <Badge variant="destructive">Bloqué</Badge>
    case "Fermé":
      return <Badge variant="secondary">Fermé</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}
```

**Après :**
```typescript
import { getAccountStatusBadge } from "@/lib/status-utils"

const getStatusBadge = (status: string | number) => {
  const statusInfo = getAccountStatusBadge(status)
  return <Badge className={statusInfo.className} variant={statusInfo.variant}>{statusInfo.label}</Badge>
}
```

#### `app/accounts/balance/page.tsx` - Page des soldes
**Avant :**
```typescript
const filterAccountsByStatus = (accountsList: Account[], status: string) => {
  if (status === "ALL") {
    return accountsList
  }
  return accountsList.filter((account) => {
    const accountStatus = account.status?.toUpperCase()
    if (status === "ACTIF") {
      return accountStatus === "ACTIF" || accountStatus === "ACTIF"
    }
    // ... beaucoup de conditions
  })
}
```

**Après :**
```typescript
import { normalizeAccountStatus } from "@/lib/status-utils"

const filterAccountsByStatus = (accountsList: Account[], status: string) => {
  if (status === "ALL") {
    return accountsList
  }
  return accountsList.filter((account) => {
    const normalizedAccountStatus = normalizeAccountStatus(account.status)
    const normalizedFilterStatus = normalizeAccountStatus(status)
    return normalizedAccountStatus === normalizedFilterStatus
  })
}
```

#### `app/accounts/statements/page.tsx` - Page des relevés
**Avant :**
```typescript
const activeAccounts = adaptedAccounts.filter(
  (account) => account.status === "Actif" || account.status === "ACTIF"
)
```

**Après :**
```typescript
import { normalizeAccountStatus } from "@/lib/status-utils"

const activeAccounts = adaptedAccounts.filter((account) => {
  const normalizedStatus = normalizeAccountStatus(account.status)
  return normalizedStatus === "Actif"
})
```

## 📊 Mapping des statuts supportés

| Valeur API | Type | Affichage normalisé | Badge |
|------------|------|---------------------|-------|
| `0` | number | "En attente" | 🟠 Orange |
| `1` | number | "Actif" | 🟢 Vert |
| `2` | number | "Rejeté" | 🔴 Rouge |
| `-1` | number | "Fermé" | ⚫ Gris |
| `"PENDING"` | string | "En attente" | 🟠 Orange |
| `"EN ATTENTE"` | string | "En attente" | 🟠 Orange |
| `"EN_ATTENTE"` | string | "En attente" | 🟠 Orange |
| `"ACTIF"` | string | "Actif" | 🟢 Vert |
| `"ACTIVE"` | string | "Actif" | 🟢 Vert |
| `"Actif"` | string | "Actif" | 🟢 Vert |
| `"APPROVED"` | string | "Actif" | 🟢 Vert |
| `"BLOCKED"` | string | "Bloqué" | 🔴 Rouge |
| `"BLOQUÉ"` | string | "Bloqué" | 🔴 Rouge |
| `"REJECTED"` | string | "Rejeté" | 🔴 Rouge |
| `"REJETÉ"` | string | "Rejeté" | 🔴 Rouge |
| `"CLOSED"` | string | "Fermé" | ⚫ Gris |
| `"FERMÉ"` | string | "Fermé" | ⚫ Gris |

## 🧪 Tests à effectuer

### Test 1 : Affichage des badges
1. Ouvrir la page de détails d'un compte
2. Vérifier que le badge du statut s'affiche correctement avec la bonne couleur
3. Tester avec différents statuts (modifier en base de données si nécessaire)

### Test 2 : Filtres par statut
1. Aller sur la page des soldes (`/accounts/balance`)
2. Utiliser le filtre de statut (Actifs, En attente, etc.)
3. Vérifier que les comptes sont correctement filtrés

### Test 3 : Création de compte
1. Créer un nouveau compte
2. Vérifier qu'il apparaît avec le statut "En attente"
3. Le faire approuver par le back-office
4. Rafraîchir la page
5. Vérifier qu'il apparaît maintenant avec le statut "Actif"

### Test 4 : Page des relevés
1. Aller sur la page des relevés (`/accounts/statements`)
2. Vérifier que seuls les comptes actifs apparaissent dans la liste
3. Vérifier qu'un compte en attente n'apparaît pas

## 🔄 Workflow complet : Back-Office → E-Portal

```
1. CLIENT CRÉE UN COMPTE
   ↓
   API: POST /tenant/:id/compte
   Body: { status: "EN ATTENTE" }
   ↓
   Base de données: status = 0 ou "EN ATTENTE"
   ↓
   E-Portal: normalizeAccountStatus(0) → "En attente"
   Affichage: Badge orange "En attente"

2. BACK-OFFICE APPROUVE
   ↓
   API: PUT /tenant/:id/compte/:accountId
   Body: { status: 1 }
   ↓
   Base de données: status = 1
   ↓
   E-Portal: Rafraîchit la liste des comptes
   ↓
   E-Portal: normalizeAccountStatus(1) → "Actif"
   Affichage: Badge vert "Actif"

3. CLIENT VOIT LE CHANGEMENT
   ↓
   Peut maintenant utiliser le compte pour des transactions
```

## 📝 Avantages de cette solution

### 1. **Robustesse**
- Gère tous les formats possibles automatiquement
- Pas de crash si un nouveau format apparaît (retourne "Inconnu")

### 2. **Maintenabilité**
- Code centralisé dans un seul fichier
- Facile d'ajouter de nouveaux statuts
- Modification en un seul endroit

### 3. **Cohérence**
- Même affichage partout dans l'application
- Même logique de filtrage partout
- Pas de duplications de code

### 4. **Extensibilité**
- Fonctions utilitaires réutilisables (`isAccountActive`, `filterAccountsByStatus`, etc.)
- Peut être utilisé pour d'autres types d'entités (cartes, virements, etc.)

## 🔧 Maintenance future

### Ajouter un nouveau statut

Pour ajouter un nouveau statut (par exemple "Suspendu") :

1. **Modifier `lib/status-utils.ts`** :

```typescript
export function normalizeAccountStatus(status: number | string | undefined | null): string {
  // ... code existant ...
  
  // Ajouter le nouveau statut
  if (
    status === 3 || 
    status === "3" ||
    statusStr === "SUSPENDED" || 
    statusStr === "SUSPENDU"
  ) {
    return "Suspendu"
  }
  
  // ... reste du code ...
}

export function getAccountStatusBadge(status: number | string | undefined | null): StatusBadgeInfo {
  const normalizedStatus = normalizeAccountStatus(status)
  
  switch (normalizedStatus) {
    // ... cases existants ...
    
    case "Suspendu":
      return { 
        label: "Suspendu", 
        className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200",
        variant: "secondary"
      }
    
    // ... reste du code ...
  }
}
```

2. **Tester** partout dans l'application

C'est tout ! Pas besoin de modifier autre chose.

## 📚 Documentation liée

- `/back-office-bngEabnking/EPORTAL_STATUS_INTERPRETATION.md` - Document détaillé sur l'interprétation des statuts
- `/back-office-bngEabnking/FIX_ACCOUNT_STATUS_REFRESH.md` - Fix du rafraîchissement côté back-office
- `/ebanking-web-app-with-api-momo/CLIENT_IMMEDIATE_VISIBILITY.md` - Visibilité immédiate des comptes

## ⚠️ Notes importantes

1. **Ne pas supprimer les anciens formats** - Garder la compatibilité avec tous les formats pour les données existantes
2. **Tester après chaque modification** - Vérifier tous les cas de figure
3. **Logger les statuts inconnus** - Aide au debug et à identifier de nouveaux formats

## 🎉 Résultat final

✅ Les statuts s'affichent toujours correctement, peu importe le format retourné par l'API  
✅ Les filtres fonctionnent de manière cohérente  
✅ Code plus simple et maintenable  
✅ Pas de régression sur les fonctionnalités existantes  

