# Configuration des variables d'environnement

## Fichier .env.local

Créer un fichier `.env.local` à la racine du projet avec les variables suivantes:

```env
# URL du backend API (obligatoire)
NEXT_PUBLIC_API_URL=https://35.184.98.9:4000

# ID du tenant (obligatoire)
NEXT_PUBLIC_TENANT_ID=aa1287f6-06af-45b7-a905-8c57363565c2

# URL du portail e-banking client (pour les liens d'invitation)
NEXT_PUBLIC_EBANKING_URL=https://35.184.98.9:4000

# URL du back-office (optionnel, défaut: https://back-office.bng.cm)
# Utilisé par les Responsables réseau pour gérer les agences
NEXT_PUBLIC_BACK_OFFICE_URL=https://back-office.bng.cm
```

## Variables pour la page Agences

### NEXT_PUBLIC_API_URL
**Obligatoire** | **Type:** URL

URL du serveur backend API. Utilisée pour récupérer les données des agences.

**Endpoint utilisé:**
```
GET {NEXT_PUBLIC_API_URL}/api/portal/{NEXT_PUBLIC_TENANT_ID}/agences
```

**Exemple:**
```env
NEXT_PUBLIC_API_URL=https://35.184.98.9:4000
```

### NEXT_PUBLIC_TENANT_ID
**Obligatoire** | **Type:** UUID

Identifiant unique du tenant (organisation) dans le système multi-tenant.

**Exemple:**
```env
NEXT_PUBLIC_TENANT_ID=aa1287f6-06af-45b7-a905-8c57363565c2
```

### NEXT_PUBLIC_BACK_OFFICE_URL
**Optionnel** | **Type:** URL | **Défaut:** `https://back-office.bng.cm`

URL du Back-Office de gestion. Utilisée par les Responsables réseau pour accéder à l'interface de gestion des agences.

**Exemple:**
```env
NEXT_PUBLIC_BACK_OFFICE_URL=https://back-office.bng.cm
```

**Comportement:**
- Si définie: Le bouton "Mettre à jour les agences" redirige vers cette URL
- Si non définie: Utilise la valeur par défaut `https://back-office.bng.cm`

## Configuration par environnement

### Développement local
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_TENANT_ID=aa1287f6-06af-45b7-a905-8c57363565c2
NEXT_PUBLIC_BACK_OFFICE_URL=http://localhost:3000
```

### Staging
```env
NEXT_PUBLIC_API_URL=https://staging-api.bng.cm
NEXT_PUBLIC_TENANT_ID=aa1287f6-06af-45b7-a905-8c57363565c2
NEXT_PUBLIC_BACK_OFFICE_URL=https://staging-backoffice.bng.cm
```

### Production
```env
NEXT_PUBLIC_API_URL=https://api.bng.cm
NEXT_PUBLIC_TENANT_ID=aa1287f6-06af-45b7-a905-8c57363565c2
NEXT_PUBLIC_BACK_OFFICE_URL=https://back-office.bng.cm
```

## Vérification de la configuration

Pour vérifier que les variables sont correctement configurées:

1. **Ouvrir la console du navigateur**
2. **Exécuter:**
   ```javascript
   console.log({
     API_URL: process.env.NEXT_PUBLIC_API_URL,
     TENANT_ID: process.env.NEXT_PUBLIC_TENANT_ID,
     BACK_OFFICE_URL: process.env.NEXT_PUBLIC_BACK_OFFICE_URL
   })
   ```

3. **Vérifier que toutes les valeurs sont définies**

## Notes importantes

### Variables NEXT_PUBLIC_*
Les variables préfixées par `NEXT_PUBLIC_` sont exposées au client (navigateur).
**Ne jamais y mettre de secrets ou clés privées.**

### Rechargement requis
Après modification du fichier `.env.local`, redémarrer le serveur de développement:
```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

### Production (Vercel)
Dans Vercel, configurer les variables d'environnement dans:
**Settings > Environment Variables**

### Production (autres)
Selon la plateforme de déploiement, configurer les variables via:
- Fichier `.env.production`
- Interface d'administration de la plateforme
- Pipeline CI/CD

## Dépannage

### Erreur: "API_BASE_URL environment variable is required"
- Vérifier que `NEXT_PUBLIC_API_URL` est définie
- Redémarrer le serveur de développement
- Vérifier qu'il n'y a pas de faute de frappe

### Le bouton "Mettre à jour" pointe vers la mauvaise URL
- Vérifier `NEXT_PUBLIC_BACK_OFFICE_URL`
- Redémarrer le serveur
- Vider le cache du navigateur

### Les agences ne se chargent pas
- Vérifier `NEXT_PUBLIC_API_URL` et `NEXT_PUBLIC_TENANT_ID`
- Tester l'endpoint manuellement:
  ```bash
  curl https://35.184.98.9:4000/api/portal/aa1287f6-06af-45b7-a905-8c57363565c2/agences
  ```
- Vérifier que le fichier backup existe: `/public/data/agences-backup.json`
