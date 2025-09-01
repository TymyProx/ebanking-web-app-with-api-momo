"use server"; 
// Indique à Next.js que ce fichier contient du code côté serveur

import { cookies } from "next/headers";
// Importation de la méthode cookies() pour accéder aux cookies côté serveur

// URL de base de l’API et ID du tenant (identifiant du client dans l’API)
const API_BASE_URL = "http://192.168.1.200:8080/api";
const tenantId = "11cacc69-5a49-4f01-8b16-e8f473746634";

// Fonction asynchrone pour soumettre une demande de crédit
export async function submitCreditRequest(formData: {
  applicant_name: string;   // Nom du demandeur
  loan_amount: string;      // Montant du crédit demandé
  loan_duration: string;    // Durée du crédit en mois
  loan_purpose: string;     // Objet / raison du crédit
}) {  
  try {
    // 🔑 Récupération du token JWT stocké dans les cookies
    const cookieToken = (await cookies()).get("token")?.value;
    const usertoken = cookieToken;

    // Si aucun token n’est trouvé → erreur
    if (!cookieToken) throw new Error("Token introuvable.");

    // Envoi de la requête POST vers l’API backend
    const response = await fetch(`${API_BASE_URL}/tenant/${tenantId}/demande-credit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",        // Type de contenu JSON
        Authorization: `Bearer ${usertoken}`,      // Authentification via Bearer token
      },
      body: JSON.stringify({
        data: {
          //  Mapping des données du formulaire vers les champs attendus par l’API
          applicantName: formData.applicant_name,
          creditAmount: formData.loan_amount,
          durationMonths: formData.loan_duration,
          purpose: formData.loan_purpose,
        },
      }),
    });

    // Vérifie si la réponse est valide
    if (!response.ok) {
      const errorData = await response.json();
      // Si le backend renvoie un message d’erreur, on le propage
      throw new Error(errorData.message || "Erreur lors de la soumission");
    }

    // Récupération des données de la réponse (JSON)
    const data = await response.json();
    return data;
  } catch (error: any) {
    // Gestion d’erreur (propagation du message d’erreur)
    throw new Error(error.message);
  }
}
