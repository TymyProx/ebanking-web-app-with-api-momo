"use server"

import { cookies } from "next/headers"

const API_BASE_URL = process.env.API_BASE_URL
const TENANT_ID = process.env.TENANT_ID

export interface Complaint {
  id: string
  reference: string
  type: "transaction" | "card" | "checkbook" | "credit" | "other"
  title: string
  description: string
  date: string
  status: "pending" | "in_progress" | "resolved" | "rejected"
  attachment?: string
  createdAt: string
  updatedAt: string
}

export interface ComplaintMessage {
  id: string
  complaintId: string
  sender: "client" | "agent"
  message: string
  timestamp: string
}

export async function getComplaints(): Promise<Complaint[]> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      throw new Error("Non authentifié")
    }

    const response = await fetch(`${API_BASE_URL}/reclamations`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Tenant-ID": TENANT_ID || "",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des réclamations")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Erreur getComplaints:", error)
    return []
  }
}

export async function createComplaint(formData: {
  type: string
  title: string
  description: string
  date: string
  attachment?: File
}): Promise<{ success: boolean; message: string; complaint?: Complaint }> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return { success: false, message: "Non authentifié" }
    }

    // Vérifier s'il y a déjà une réclamation active
    const existingComplaints = await getComplaints()
    const activeComplaint = existingComplaints.find((c) => c.status === "pending" || c.status === "in_progress")

    if (activeComplaint) {
      return {
        success: false,
        message: "Vous avez déjà une réclamation active. Veuillez attendre sa clôture avant d'en créer une nouvelle.",
      }
    }

    // Vérifier le délai de 10 jours depuis la dernière réclamation
    const lastComplaint = existingComplaints[0]
    if (lastComplaint) {
      const lastComplaintDate = new Date(lastComplaint.createdAt)
      const daysSinceLastComplaint = Math.floor((Date.now() - lastComplaintDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysSinceLastComplaint < 10) {
        return {
          success: false,
          message: `Vous devez attendre ${10 - daysSinceLastComplaint} jour(s) avant de créer une nouvelle réclamation.`,
        }
      }
    }

    const body: any = {
      type: formData.type,
      title: formData.title,
      description: formData.description,
      date: formData.date,
      status: "pending",
    }

    // Gérer l'upload de fichier si présent
    if (formData.attachment) {
      // TODO: Implémenter l'upload de fichier vers le serveur
      // Pour l'instant, on stocke juste le nom du fichier
      body.attachment = formData.attachment.name
    }

    const response = await fetch(`${API_BASE_URL}/reclamations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Tenant-ID": TENANT_ID || "",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Erreur lors de la création de la réclamation")
    }

    const complaint = await response.json()

    return {
      success: true,
      message: "Réclamation créée avec succès",
      complaint,
    }
  } catch (error) {
    console.error("Erreur createComplaint:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erreur lors de la création de la réclamation",
    }
  }
}

export async function getComplaintMessages(complaintId: string): Promise<ComplaintMessage[]> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      throw new Error("Non authentifié")
    }

    const response = await fetch(`${API_BASE_URL}/reclamations/${complaintId}/messages`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Tenant-ID": TENANT_ID || "",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des messages")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Erreur getComplaintMessages:", error)
    return []
  }
}

export async function sendComplaintMessage(
  complaintId: string,
  message: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return { success: false, message: "Non authentifié" }
    }

    // Récupérer la réclamation pour vérifier son statut
    const complaints = await getComplaints()
    const complaint = complaints.find((c) => c.id === complaintId)

    if (!complaint) {
      return { success: false, message: "Réclamation introuvable" }
    }

    if (complaint.status === "resolved" || complaint.status === "rejected") {
      return {
        success: false,
        message: "Cette réclamation est clôturée. Vous ne pouvez plus envoyer de messages.",
      }
    }

    // Vérifier si le dernier message est du client et n'a pas encore reçu de réponse
    const messages = await getComplaintMessages(complaintId)
    const lastMessage = messages[messages.length - 1]

    if (lastMessage && lastMessage.sender === "client") {
      return {
        success: false,
        message: "Votre dernière réponse est en attente de traitement par un agent.",
      }
    }

    const response = await fetch(`${API_BASE_URL}/reclamations/${complaintId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Tenant-ID": TENANT_ID || "",
      },
      body: JSON.stringify({
        message,
        sender: "client",
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Erreur lors de l'envoi du message")
    }

    return {
      success: true,
      message: "Message envoyé avec succès",
    }
  } catch (error) {
    console.error("Erreur sendComplaintMessage:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erreur lors de l'envoi du message",
    }
  }
}
