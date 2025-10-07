"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertTriangle,
  CreditCard,
  FileText,
  DollarSign,
  HelpCircle,
  Send,
  Paperclip,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  ArrowLeft,
} from "lucide-react"
import { getComplaints, createComplaint, getComplaintMessages, sendComplaintMessage } from "./actions"
import type { Complaint, ComplaintMessage } from "./actions"

const complaintTypes = [
  { value: "transaction", label: "Problème de transaction", icon: FileText },
  { value: "card", label: "Carte bancaire", icon: CreditCard },
  { value: "checkbook", label: "Chéquier", icon: FileText },
  { value: "credit", label: "Crédit", icon: DollarSign },
  { value: "other", label: "Autres", icon: HelpCircle },
]

const statusConfig = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  in_progress: { label: "En cours", color: "bg-blue-100 text-blue-800", icon: MessageSquare },
  resolved: { label: "Résolue", color: "bg-green-100 text-green-800", icon: CheckCircle },
  rejected: { label: "Rejetée", color: "bg-red-100 text-red-800", icon: XCircle },
}

export default function ComplaintsPage() {
  const [activeTab, setActiveTab] = useState("new")
  const [isLoading, setIsLoading] = useState(false)
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [messages, setMessages] = useState<ComplaintMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const [formData, setFormData] = useState({
    type: "",
    title: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    attachment: null as File | null,
  })

  useEffect(() => {
    loadComplaints()
  }, [])

  useEffect(() => {
    if (selectedComplaint) {
      loadMessages(selectedComplaint.id)
    }
  }, [selectedComplaint])

  const loadComplaints = async () => {
    setIsLoading(true)
    try {
      const data = await getComplaints()
      setComplaints(data)
    } catch (error) {
      console.error("Erreur lors du chargement des réclamations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMessages = async (complaintId: string) => {
    try {
      const data = await getComplaintMessages(complaintId)
      setMessages(data)
    } catch (error) {
      console.error("Erreur lors du chargement des messages:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setAlert(null)

    try {
      const result = await createComplaint(formData)

      if (result.success) {
        setAlert({ type: "success", message: result.message })
        setFormData({
          type: "",
          title: "",
          date: new Date().toISOString().split("T")[0],
          description: "",
          attachment: null,
        })
        await loadComplaints()
        setTimeout(() => setActiveTab("list"), 2000)
      } else {
        setAlert({ type: "error", message: result.message })
      }
    } catch (error) {
      setAlert({ type: "error", message: "Une erreur est survenue" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedComplaint || !newMessage.trim()) return

    setIsSubmitting(true)
    try {
      const result = await sendComplaintMessage(selectedComplaint.id, newMessage)

      if (result.success) {
        setNewMessage("")
        await loadMessages(selectedComplaint.id)
      } else {
        setAlert({ type: "error", message: result.message })
      }
    } catch (error) {
      setAlert({ type: "error", message: "Erreur lors de l'envoi du message" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, attachment: file })
    }
  }

  if (selectedComplaint) {
    const StatusIcon = statusConfig[selectedComplaint.status].icon

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => setSelectedComplaint(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>{selectedComplaint.title}</span>
                </CardTitle>
                <CardDescription>Référence: {selectedComplaint.reference}</CardDescription>
              </div>
              <Badge className={statusConfig[selectedComplaint.status].color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig[selectedComplaint.status].label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Type</p>
                <p className="font-medium">{complaintTypes.find((t) => t.value === selectedComplaint.type)?.label}</p>
              </div>
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-medium">{new Date(selectedComplaint.date).toLocaleDateString("fr-FR")}</p>
              </div>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Description</p>
              <p className="mt-1">{selectedComplaint.description}</p>
            </div>

            {selectedComplaint.attachment && (
              <div className="flex items-center space-x-2 text-sm text-blue-600">
                <Paperclip className="w-4 h-4" />
                <span>{selectedComplaint.attachment}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Conversation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "client" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.sender === "client" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${msg.sender === "client" ? "text-blue-100" : "text-gray-500"}`}>
                        {new Date(msg.timestamp).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {selectedComplaint.status !== "resolved" && selectedComplaint.status !== "rejected" && (
              <div className="mt-4 flex space-x-2">
                <Input
                  placeholder="Votre message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={isSubmitting}
                />
                <Button onClick={handleSendMessage} disabled={isSubmitting || !newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}

            {(selectedComplaint.status === "resolved" || selectedComplaint.status === "rejected") && (
              <Alert className="mt-4">
                <AlertDescription>
                  Cette réclamation est clôturée. Vous ne pouvez plus envoyer de messages.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {alert && (
          <Alert className={alert.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
            <AlertDescription className={alert.type === "error" ? "text-red-800" : "text-green-800"}>
              {alert.message}
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Réclamations</h1>
        <p className="text-gray-600">Soumettez et suivez vos réclamations</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new">Nouvelle réclamation</TabsTrigger>
          <TabsTrigger value="list">Mes réclamations</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Créer une réclamation
              </CardTitle>
              <CardDescription>Décrivez votre problème de manière claire et précise</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="type">Type de réclamation *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {complaintTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center space-x-2">
                            <type.icon className="w-4 h-4" />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    placeholder="Résumé de votre réclamation"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez votre problème en détail..."
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attachment">Pièce jointe (facultatif)</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="attachment"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                    {formData.attachment && (
                      <Badge variant="outline" className="flex items-center space-x-1">
                        <Paperclip className="w-3 h-3" />
                        <span>{formData.attachment.name}</span>
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Formats acceptés: images, PDF (max 5 Mo)</p>
                </div>

                {alert && (
                  <Alert
                    className={alert.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}
                  >
                    <AlertDescription className={alert.type === "error" ? "text-red-800" : "text-green-800"}>
                      {alert.message}
                    </AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Envoi en cours..." : "Soumettre la réclamation"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ) : complaints.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune réclamation pour le moment</p>
                  <Button variant="outline" className="mt-4 bg-transparent" onClick={() => setActiveTab("new")}>
                    Créer une réclamation
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {complaints.map((complaint) => {
                const StatusIcon = statusConfig[complaint.status].icon
                const TypeIcon = complaintTypes.find((t) => t.value === complaint.type)?.icon || HelpCircle

                return (
                  <Card
                    key={complaint.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedComplaint(complaint)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <TypeIcon className="w-4 h-4 text-gray-500" />
                            <h3 className="font-semibold">{complaint.title}</h3>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{complaint.description.substring(0, 100)}...</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Réf: {complaint.reference}</span>
                            <span>•</span>
                            <span>{new Date(complaint.date).toLocaleDateString("fr-FR")}</span>
                          </div>
                        </div>
                        <Badge className={statusConfig[complaint.status].color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[complaint.status].label}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
