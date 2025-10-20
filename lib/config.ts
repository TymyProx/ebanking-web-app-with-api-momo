// Configuration pour l'application e-banking BNG
export const config = {
  // URL du serveur backend de production
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || "https://35.184.98.9:4000",
  
  // ID du tenant (à configurer selon votre environnement)
  TENANT_ID: process.env.NEXT_PUBLIC_TENANT_ID || "aa1287f6-06af-45b7-a905-8c57363565c2",
  
  // URL du portail e-banking client (pour les liens d'invitation)
  EBANKING_URL: process.env.NEXT_PUBLIC_EBANKING_URL || "https://proxyma1-bngebanking.vercel.app/",
}
