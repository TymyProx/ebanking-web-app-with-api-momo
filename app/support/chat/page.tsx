"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MessageCircle, Send, User, Clock, Star, Download, X } from "lucide-react"

interface Message {
  id: string
  content: string
  sender: "user" | "agent"
  timestamp: Date
  senderName: string
}

interface ChatSession {
  id: string
  agentName: string
  agentId: string
  status: "waiting" | "connected" | "ended"
  startTime: Date
  subject: string
}

export default function LiveChatPage() {
  const [step, setStep] = useState<"form" | "chat" | "ended">("form")
  const [formData, setFormData] = useState({
    fullName: "Mamadou Diallo",
    accountNumber: "",
    email: "mamadou.diallo@email.com",
    phone: "",
    subject: "",
    customSubject: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [chatSession, setChatSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const subjects = [
    "Problème de transaction",
    "Question sur mon compte",
    "Assistance carte bancaire",
    "Virement en attente",
    "Frais bancaires",
    "Problème technique",
    "Demande d'information",
    "Autre (préciser)",
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Simulation de messages de l'agent
  useEffect(() => {
    if (chatSession && chatSession.status === "connected" && messages.length === 1) {
      setTimeout(() => {
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          content: `Bonjour ${formData.fullName} ! Je suis ${chatSession.agentName}, votre conseiller. Je vois que vous souhaitez discuter de : "${chatSession.subject}". Comment puis-je vous aider aujourd'hui ?`,
          sender: "agent",
          timestamp: new Date(),
          senderName: chatSession.agentName,
        }
        setMessages((prev) => [...prev, welcomeMessage])
      }, 2000)
    }
  }, [chatSession, messages.length, formData.fullName])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validation numéro de compte (IBAN Guinée ou format interne)
    if (!formData.accountNumber) {
      newErrors.accountNumber = "Le numéro de compte est obligatoire"
    } else if (!/^(GN\d{15}|\d{10,16})$/.test(formData.accountNumber.replace(/\s/g, ""))) {
      newErrors.accountNumber = "Le numéro de compte saisi est incorrect."
    }

    // Validation email
    if (!formData.email) {
      newErrors.email = "L'adresse e-mail est obligatoire"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Veuillez saisir une adresse e-mail valide."
    }

    // Validation téléphone
    if (!formData.phone) {
      newErrors.phone = "Le numéro de téléphone est obligatoire"
    } else if (!/^\+?[\d\s-]{8,15}$/.test(formData.phone)) {
      newErrors.phone = "Numéro de téléphone invalide."
    }

    // Validation sujet
    if (!formData.subject) {
      newErrors.subject = "Merci d'indiquer le sujet de votre demande."
    } else if (formData.subject === "Autre (préciser)" && !formData.customSubject.trim()) {
      newErrors.customSubject = "Veuillez préciser le sujet de votre demande"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleStartChat = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const finalSubject = formData.subject === "Autre (préciser)" ? formData.customSubject : formData.subject

      // Simulation de démarrage de session
      const session: ChatSession = {
        id: `CHAT-${Date.now()}`,
        agentName: "Sarah Camara",
        agentId: "agent-001",
        status: "waiting",
        startTime: new Date(),
        subject: finalSubject,
      }

      setChatSession(session)

      // Message initial de l'utilisateur
      const initialMessage: Message = {
        id: Date.now().toString(),
        content: `Bonjour, j'aimerais discuter de : ${finalSubject}`,
        sender: "user",
        timestamp: new Date(),
        senderName: formData.fullName,
      }

      setMessages([initialMessage])
      setStep("chat")

      // Simulation de connexion avec un agent
      setTimeout(() => {
        setChatSession((prev) => (prev ? { ...prev, status: "connected" } : null))
      }, 3000)
    } catch (error) {
      console.error("Erreur lors du démarrage du chat:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatSession) return

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: "user",
      timestamp: new Date(),
      senderName: formData.fullName,
    }

    setMessages((prev) => [...prev, message])
    setNewMessage("")

    // Simulation de réponse de l'agent
    setIsTyping(true)
    setTimeout(() => {
      const responses = [
        "Je comprends votre préoccupation. Laissez-moi vérifier cela pour vous.",
        "Merci pour ces informations. Je vais examiner votre dossier.",
        "C'est une excellente question. Voici ce que je peux vous dire...",
        "Je vais vous aider à résoudre ce problème rapidement.",
        "Permettez-moi de consulter votre compte pour vous donner une réponse précise.",
      ]

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responses[Math.floor(Math.random() * responses.length)],
        sender: "agent",
        timestamp: new Date(),
        senderName: chatSession.agentName,
      }

      setMessages((prev) => [...prev, agentMessage])
      setIsTyping(false)
    }, 2000)
  }

  const handleEndChat = () => {
    if (chatSession) {
      setChatSession((prev) => (prev ? { ...prev, status: "ended" } : null))
      setStep("ended")
      setShowRating(true)
    }
  }

  const handleRating = async () => {
    if (rating > 0) {
      // Simulation de sauvegarde de la notation
      //console.log("Rating:", rating, "Feedback:", feedback)
      setShowRating(false)
    }
  }

  const handleDownloadTranscript = () => {
    const transcript = messages
      .map((msg) => `[${msg.timestamp.toLocaleTimeString()}] ${msg.senderName}: ${msg.content}`)
      .join("\n")

    const blob = new Blob([transcript], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `chat-transcript-${chatSession?.id}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (step === "form") {
    return (
      <div className="container mx-auto py-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Assistance Live Chat
              </CardTitle>
              <CardDescription>
                Discutez en temps réel avec un de nos conseillers. Veuillez remplir les informations ci-dessous pour
                démarrer la conversation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                    className={errors.fullName ? "border-red-500" : ""}
                  />
                  {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Numéro de compte</Label>
                  <Input
                    id="accountNumber"
                    placeholder="GN123456789012345 ou 1234567890"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, accountNumber: e.target.value }))}
                    className={errors.accountNumber ? "border-red-500" : ""}
                  />
                  {errors.accountNumber && <p className="text-sm text-red-500">{errors.accountNumber}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse e-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Numéro de téléphone</Label>
                  <Input
                    id="phone"
                    placeholder="+224 123 456 789"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Sujet de la discussion</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, subject: value }))}
                >
                  <SelectTrigger className={errors.subject ? "border-red-500" : ""}>
                    <SelectValue placeholder="Sélectionnez le sujet de votre demande" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.subject && <p className="text-sm text-red-500">{errors.subject}</p>}
              </div>

              {formData.subject === "Autre (préciser)" && (
                <div className="space-y-2">
                  <Label htmlFor="customSubject">Précisez votre demande</Label>
                  <Textarea
                    id="customSubject"
                    placeholder="Décrivez brièvement votre demande..."
                    value={formData.customSubject}
                    onChange={(e) => setFormData((prev) => ({ ...prev, customSubject: e.target.value }))}
                    className={errors.customSubject ? "border-red-500" : ""}
                  />
                  {errors.customSubject && <p className="text-sm text-red-500">{errors.customSubject}</p>}
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Informations importantes :</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Temps d'attente moyen : 2-3 minutes</li>
                  <li>• Service disponible de 8h à 18h, du lundi au vendredi</li>
                  <li>• Une transcription vous sera envoyée par e-mail</li>
                  <li>• Vos données sont sécurisées et confidentielles</li>
                </ul>
              </div>

              <Button onClick={handleStartChat} disabled={isLoading} className="w-full">
                {isLoading ? "Connexion en cours..." : "Démarrer la conversation"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (step === "chat") {
    return (
      <div className="container mx-auto py-6">
        <div className="max-w-4xl mx-auto">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {chatSession?.status === "waiting" ? "Connexion en cours..." : chatSession?.agentName}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      {chatSession?.status === "waiting" ? (
                        <>
                          <Clock className="w-4 h-4" />
                          Recherche d'un conseiller disponible...
                        </>
                      ) : (
                        <>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            En ligne
                          </Badge>
                          Sujet: {chatSession?.subject}
                        </>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownloadTranscript}>
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleEndChat}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${message.sender === "user" ? "text-blue-100" : "text-gray-500"}`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Tapez votre message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={chatSession?.status !== "connected"}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || chatSession?.status !== "connected"}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <Dialog open={showRating} onOpenChange={setShowRating}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Évaluez votre expérience</DialogTitle>
              <DialogDescription>Comment évalueriez-vous la qualité de l'assistance reçue ?</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`p-1 ${rating >= star ? "text-yellow-400" : "text-gray-300"}`}
                  >
                    <Star className="w-8 h-8 fill-current" />
                  </button>
                ))}
              </div>

              <Textarea
                placeholder="Commentaires additionnels (optionnel)"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRating(false)}>
                Passer
              </Button>
              <Button onClick={handleRating} disabled={rating === 0}>
                Envoyer l'évaluation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-2xl mx-auto text-center">
        <Card>
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Conversation terminée</h2>
            <p className="text-gray-600 mb-6">
              Merci d'avoir utilisé notre service de chat. Une transcription de votre conversation a été envoyée à votre
              adresse e-mail.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={handleDownloadTranscript} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Télécharger la transcription
              </Button>
              <Button onClick={() => setStep("form")}>Nouvelle conversation</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
