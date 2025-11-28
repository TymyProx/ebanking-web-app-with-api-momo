"use server"

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

import { cookies } from "next/headers"
import { config } from "@/lib/config"

const normalize = (u?: string) => (u ? u.replace(/\/$/, "") : "")
const API_BASE_URL = `${normalize(config.API_BASE_URL)}/api`
const TENANT_ID = config.TENANT_ID

interface ChatSessionData {
  fullName: string
  accountNumber: string
  email: string
  phone: string
  subject: string
}

interface Message {
  id: string
  content: string
  sender: "user" | "agent"
  timestamp: Date
  senderName: string
}

export async function startChatSession(data: ChatSessionData) {
  // Simulation de validation et création de session
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Validation du numéro de compte
  const accountRegex = /^(GN\d{15}|\d{10,16})$/
  if (!accountRegex.test(data.accountNumber.replace(/\s/g, ""))) {
    throw new Error("Le numéro de compte saisi est incorrect.")
  }

  // Validation email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.email)) {
    throw new Error("Veuillez saisir une adresse e-mail valide.")
  }

  // Validation téléphone
  const phoneRegex = /^\+?[\d\s-]{8,15}$/
  if (!phoneRegex.test(data.phone)) {
    throw new Error("Numéro de téléphone invalide.")
  }

  // Validation sujet
  if (!data.subject.trim()) {
    throw new Error("Merci d'indiquer le sujet de votre demande.")
  }

  // Génération d'un ID de session
  const sessionId = `CHAT-${Date.now()}`

  // Simulation de l'assignation d'un agent
  const agents = [
    { id: "agent-001", name: "Sarah Camara", available: true },
    { id: "agent-002", name: "Ibrahim Diallo", available: true },
    { id: "agent-003", name: "Fatoumata Sylla", available: false },
  ]

  const availableAgent = agents.find((agent) => agent.available)

  if (!availableAgent) {
    throw new Error("Aucun conseiller n'est disponible pour le moment. Veuillez réessayer plus tard.")
  }

  // Simulation de l'envoi d'email de confirmation
  //console.log(`Email de confirmation envoyé à ${data.email}`)

  // Simulation de notification au back-office
  //console.log(`Nouvelle session de chat créée: ${sessionId}`)
  //console.log(`Agent assigné: ${availableAgent.name}`)
  //console.log(`Sujet: ${data.subject}`)

  return {
    sessionId,
    agentId: availableAgent.id,
    agentName: availableAgent.name,
    status: "waiting" as const,
    message: "Vous êtes maintenant en ligne avec un conseiller. Merci de patienter quelques instants.",
  }
}

export async function sendMessage(sessionId: string, message: string, sender: "user" | "agent") {
  // Simulation d'envoi de message
  await new Promise((resolve) => setTimeout(resolve, 500))

  const messageData = {
    id: Date.now().toString(),
    content: message,
    sender,
    timestamp: new Date(),
    sessionId,
  }

  // Simulation de sauvegarde en base
  //console.log(`Message envoyé dans la session ${sessionId}:`, messageData)

  return messageData
}

export async function endChatSession(sessionId: string, rating?: number, feedback?: string) {
  // Simulation de fin de session
  await new Promise((resolve) => setTimeout(resolve, 500))

  const endTime = new Date()

  // Simulation de sauvegarde des données de session
  //console.log(`Session ${sessionId} terminée à ${endTime.toISOString()}`)

  if (rating) {
    //console.log(`Évaluation reçue: ${rating}/5 étoiles`)
    if (feedback) {
      //console.log(`Commentaire: ${feedback}`)
    }
  }

  // Simulation de génération et envoi de transcription
  const transcriptEmail = {
    to: "client@example.com", // Récupéré depuis les données de session
    subject: `Transcription de votre conversation - Session ${sessionId}`,
    body: "Votre transcription de chat est en pièce jointe.",
  }

  //console.log("Transcription envoyée par email:", transcriptEmail)

  return {
    success: true,
    message: "Votre conversation a bien été enregistrée. Une copie vous a été envoyée par e-mail.",
    transcriptSent: true,
  }
}

export async function rateChatSession(sessionId: string, rating: number, feedback?: string) {
  // Simulation de sauvegarde de l'évaluation
  await new Promise((resolve) => setTimeout(resolve, 500))

  const ratingData = {
    sessionId,
    rating,
    feedback,
    timestamp: new Date(),
  }

  //console.log("Évaluation sauvegardée:", ratingData)

  // Simulation de notification au service qualité
  if (rating <= 2) {
    //console.log(`Alerte qualité: Session ${sessionId} évaluée à ${rating}/5`)
  }

  return {
    success: true,
    message: "Merci pour votre évaluation. Votre retour nous aide à améliorer notre service.",
  }
}

interface SessionChatRecord {
  id: string
  chatId?: string | null
  clientId?: string | null
  subject?: string | null
  openedAt?: string | null
  closedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

interface SessionChatListResponse {
  rows?: SessionChatRecord[]
  count?: number
}

export interface PortalChatHistoryEntry {
  id: string
  date: Date
  subject: string
  agentName: string
  duration: string
  status: "resolved" | "pending" | "escalated"
  rating?: number
  transcript: string
}

const formatDuration = (openedAt?: Date | null, closedAt?: Date | null) => {
  if (!openedAt) {
    return "--"
  }

  if (!closedAt) {
    return "En cours"
  }

  const diffMs = closedAt.getTime() - openedAt.getTime()
  if (diffMs <= 0) {
    return "Moins d'une minute"
  }

  const totalMinutes = Math.round(diffMs / 60000)

  if (totalMinutes < 1) {
    return "Moins d'une minute"
  }

  if (totalMinutes < 60) {
    return `${totalMinutes} minute${totalMinutes > 1 ? "s" : ""}`
  }

  const totalHours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60

  if (totalHours < 24) {
    return remainingMinutes
      ? `${totalHours}h${remainingMinutes.toString().padStart(2, "0")}`
      : `${totalHours}h`
  }

  const days = Math.floor(totalHours / 24)
  const remainingHours = totalHours % 24

  if (!remainingHours) {
    return `${days}j`
  }

  return `${days}j${remainingHours}h`
}

export async function getChatHistory(): Promise<PortalChatHistoryEntry[]> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      console.warn("[LiveChat] Aucun token trouvé pour récupérer l'historique")
      return []
    }

    let clientId: string | null = null

    try {
      const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      })

      if (meResponse.ok) {
        const user = await meResponse.json()
        clientId = user?.id ?? null
      } else {
        console.warn("[LiveChat] Impossible de récupérer le profil utilisateur pour l'historique")
      }
    } catch (error) {
      console.error("[LiveChat] Erreur lors de la récupération de l'utilisateur:", error)
    }

    const params = new URLSearchParams()
    params.set("orderBy", "openedAt_DESC")
    params.set("limit", "50")
    if (clientId) {
      params.set("filter[clientId]", clientId)
    }

    const historyResponse = await fetch(
      `${API_BASE_URL}/tenant/${TENANT_ID}/session-chat?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    )

    if (!historyResponse.ok) {
      const errorText = await historyResponse.text()
      console.error("[LiveChat] Erreur API historique:", historyResponse.status, errorText)
      return []
    }

    const payload: SessionChatListResponse | SessionChatRecord[] = await historyResponse.json()
    const rows: SessionChatRecord[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.rows)
        ? payload.rows
        : []

    return rows.map((row) => {
      const openedAt = row.openedAt ? new Date(row.openedAt) : row.createdAt ? new Date(row.createdAt) : null
      const closedAt = row.closedAt ? new Date(row.closedAt) : null
      const safeOpened = openedAt ?? new Date()
      const subject = row.subject?.trim() || "Assistance client"
      const chatId = row.chatId?.trim() || row.id

      return {
        id: chatId,
        date: safeOpened,
        subject,
        agentName: "Service client BNG",
        duration: formatDuration(safeOpened, closedAt),
        status: closedAt ? "resolved" : "pending",
        transcript: chatId ? `Référence ${chatId}` : "Transcription disponible",
      }
    })
  } catch (error) {
    console.error("[LiveChat] Erreur imprévue lors de la récupération de l'historique:", error)
    return []
  }
}

export async function getAgentAvailability() {
  // Simulation de vérification de disponibilité des agents
  await new Promise((resolve) => setTimeout(resolve, 500))

  const currentHour = new Date().getHours()
  const isBusinessHours = currentHour >= 8 && currentHour < 18

  return {
    available: isBusinessHours,
    estimatedWaitTime: isBusinessHours ? "2-3 minutes" : null,
    nextAvailableTime: isBusinessHours ? null : "8h00 demain",
    onlineAgents: isBusinessHours ? 3 : 0,
  }
}
