"use server"

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
  console.log(`Email de confirmation envoyé à ${data.email}`)

  // Simulation de notification au back-office
  console.log(`Nouvelle session de chat créée: ${sessionId}`)
  console.log(`Agent assigné: ${availableAgent.name}`)
  console.log(`Sujet: ${data.subject}`)

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
  console.log(`Message envoyé dans la session ${sessionId}:`, messageData)

  return messageData
}

export async function endChatSession(sessionId: string, rating?: number, feedback?: string) {
  // Simulation de fin de session
  await new Promise((resolve) => setTimeout(resolve, 500))

  const endTime = new Date()

  // Simulation de sauvegarde des données de session
  console.log(`Session ${sessionId} terminée à ${endTime.toISOString()}`)

  if (rating) {
    console.log(`Évaluation reçue: ${rating}/5 étoiles`)
    if (feedback) {
      console.log(`Commentaire: ${feedback}`)
    }
  }

  // Simulation de génération et envoi de transcription
  const transcriptEmail = {
    to: "client@example.com", // Récupéré depuis les données de session
    subject: `Transcription de votre conversation - Session ${sessionId}`,
    body: "Votre transcription de chat est en pièce jointe.",
  }

  console.log("Transcription envoyée par email:", transcriptEmail)

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

  console.log("Évaluation sauvegardée:", ratingData)

  // Simulation de notification au service qualité
  if (rating <= 2) {
    console.log(`Alerte qualité: Session ${sessionId} évaluée à ${rating}/5`)
  }

  return {
    success: true,
    message: "Merci pour votre évaluation. Votre retour nous aide à améliorer notre service.",
  }
}

export async function getChatHistory(accountNumber: string) {
  // Simulation de récupération de l'historique
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const mockHistory = [
    {
      id: "CHAT-1704067200000",
      date: new Date("2024-01-01T10:00:00"),
      subject: "Problème de transaction",
      agentName: "Sarah Camara",
      duration: "15 minutes",
      status: "resolved" as const,
      rating: 5,
      transcript: "Transcription disponible",
    },
    {
      id: "CHAT-1703980800000",
      date: new Date("2023-12-30T14:30:00"),
      subject: "Question sur mon compte",
      agentName: "Ibrahim Diallo",
      duration: "8 minutes",
      status: "resolved" as const,
      rating: 4,
      transcript: "Transcription disponible",
    },
  ]

  return mockHistory
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
