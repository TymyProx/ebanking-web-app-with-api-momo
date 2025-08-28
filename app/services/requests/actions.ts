"use server";

import { cookies } from "next/headers";

const API_BASE_URL = "http://192.168.1.200:8080/api";
const tenantId = "11cacc69-5a49-4f01-8b16-e8f473746634";

export async function submitCreditRequest(formData: {
  applicant_name: string;
  loan_amount: string;
  loan_duration: string;
  loan_purpose: string;
}) {
  try {
    // Récupérer le token depuis les cookies
    const cookieToken = (await cookies()).get("token")?.value
    const usertoken = cookieToken

    if (!cookieToken) throw new Error("Token introuvable.");

    const response = await fetch(`${API_BASE_URL}/tenant/${tenantId}/demande-credit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${usertoken}`,
      },
      body: JSON.stringify({
        data: {
          applicantName: formData.applicant_name,
          creditAmount: formData.loan_amount,
          durationMonths: formData.loan_duration,
          purpose: formData.loan_purpose,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Erreur lors de la soumission");
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    throw new Error(error.message);
  }
}
