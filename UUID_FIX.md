# Configuration E-banking - Variables d'environnement

## Problème résolu : UUID avec guillemets

L'erreur `invalid input syntax for type uuid: ""aa1287f6-06af-45b7-a905-8c57363565c2""` était causée par des guillemets supplémentaires dans le tenantId.

## Solution implémentée

1. **Fonction de nettoyage** dans `lib/config.ts` :
   ```typescript
   const cleanEnvValue = (value: string | undefined, defaultValue: string): string => {
     if (!value) return defaultValue
     // Enlever les guillemets simples et doubles au début et à la fin
     return value.replace(/^["']|["']$/g, '').trim()
   }
   ```

2. **Configuration nettoyée** :
   - Toutes les variables d'environnement sont automatiquement nettoyées
   - Suppression des guillemets supplémentaires
   - Suppression des espaces en début/fin

## Variables d'environnement requises

Créez un fichier `.env.local` dans le dossier racine de l'application e-banking :

```bash
# URL du serveur backend de production
NEXT_PUBLIC_API_URL=https://35.184.98.9:4000

# ID du tenant (IMPORTANT: sans guillemets)
NEXT_PUBLIC_TENANT_ID=aa1287f6-06af-45b7-a905-8c57363565c2

# URL du portail e-banking client
NEXT_PUBLIC_EBANKING_URL=https://proxyma1-bngebanking.vercel.app/
```

## Points importants

- **Pas de guillemets** dans les valeurs des variables d'environnement
- **Pas d'espaces** avant ou après les valeurs
- Le système nettoie automatiquement les valeurs même si elles contiennent des guillemets

## Test

Après avoir configuré les variables d'environnement, l'activation des comptes clients devrait fonctionner sans l'erreur UUID.
