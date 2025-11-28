"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, Download, Search, Star, Clock, User } from "lucide-react"
import { getChatHistory } from "../actions"
import type { PortalChatHistoryEntry } from "../actions"

export default function ChatHistoryPage() {
  const [history, setHistory] = useState<PortalChatHistoryEntry[]>([])
  const [filteredHistory, setFilteredHistory] = useState<PortalChatHistoryEntry[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = history.filter(
        (item) =>
          item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.id.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredHistory(filtered)
    } else {
      setFilteredHistory(history)
    }
  }, [searchTerm, history])

  const loadHistory = async () => {
    try {
      const data = await getChatHistory()
      setHistory(data)
      setFilteredHistory(data)
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <Badge className="bg-green-100 text-green-800">Résolu</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>
      case "escalated":
        return <Badge className="bg-red-100 text-red-800">Escaladé</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const renderStars = (rating?: number) => {
    if (!rating) return null

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className={`w-4 h-4 ${rating >= star ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating}/5)</span>
      </div>
    )
  }

  const downloadTranscript = (chatId: string) => {
    // Simulation de téléchargement de transcription
    const transcript = `Transcription de la conversation ${chatId}\n\nCette fonctionnalité sera implémentée avec l'intégration du système de chat réel.`
    const blob = new Blob([transcript], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transcript-${chatId}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-96"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Historique des conversations
            </CardTitle>
            <CardDescription>
              Consultez l'historique de vos conversations avec nos conseillers et téléchargez les transcriptions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher par sujet, conseiller ou référence..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? "Aucun résultat trouvé" : "Aucune conversation"}
                </h3>
                <p className="text-gray-600">
                  {searchTerm
                    ? "Essayez avec d'autres mots-clés"
                    : "Vous n'avez pas encore eu de conversation avec nos conseillers."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHistory.map((chat) => (
                  <Card key={chat.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-gray-900">{chat.subject}</h3>
                            {getStatusBadge(chat.status)}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span>{chat.agentName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{chat.duration}</span>
                            </div>
                            <div>
                              <span>
                                {chat.date.toLocaleDateString("fr-FR")} à{" "}
                                {chat.date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-500">Réf: {chat.id}</span>
                              {renderStars(chat.rating)}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadTranscript(chat.id)}
                              className="flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Transcription
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Besoin d'aide ?</h4>
              <p className="text-sm text-blue-800 mb-3">
                Si vous ne trouvez pas la réponse à votre question dans l'historique, n'hésitez pas à démarrer une
                nouvelle conversation.
              </p>
              <Button asChild>
                <a href="/support/chat">Nouvelle conversation</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
