# Configuration E-banking Portal

## Variables d'environnement requises

Créez un fichier `.env.local` dans le dossier racine de l'application e-banking avec les variables suivantes :

```bash
# URL du serveur backend de production
NEXT_PUBLIC_API_URL=https://35.184.98.9:4000

# ID du tenant (à configurer selon votre environnement)
NEXT_PUBLIC_TENANT_ID=aa1287f6-06af-45b7-a905-8c57363565c2

# URL du portail e-banking client (pour les liens d'invitation)
NEXT_PUBLIC_EBANKING_URL=https://35.184.98.9:4000
```

## Processus d'activation des clients

1. **Invitation depuis le back-office** : Un utilisateur du back-office peut envoyer une invitation e-banking à un client via le bouton "Envoyer invitation e-banking" dans le formulaire de client.

2. **Lien d'activation** : Le client reçoit un email avec un lien d'activation qui pointe vers `/auth/accept-invite` avec les paramètres :
   - `token` : Token d'invitation
   - `email` : Email du client
   - `firstName` : Prénom (optionnel)
   - `lastName` : Nom (optionnel)

3. **Page d'activation** : Le client accède à la page d'activation où :
   - L'email est pré-rempli et verrouillé
   - Le client doit saisir son prénom, nom et mot de passe
   - Après validation, le compte est activé et le client est redirigé vers le tableau de bord

## Fonctionnalités implémentées

- ✅ Page d'activation `/auth/accept-invite`
- ✅ Middleware permettant l'accès sans authentification
- ✅ Configuration centralisée dans `lib/config.ts`
- ✅ Service d'authentification mis à jour
- ✅ Design cohérent avec l'application e-banking
- ✅ Gestion des erreurs et validation des formulaires
- ✅ Stockage automatique du token après activation
- ✅ Redirection vers le tableau de bord après activation réussie
