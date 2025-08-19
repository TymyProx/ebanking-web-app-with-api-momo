"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

// Données simulées des réclamations
const mockComplaints = [
  {
    id: "RCLM-20250122-001",
    type: "Transaction",
    description: "Débit non autorisé sur mon compte courant",
    status: "pending",
    priority: "high",
    createdAt: "2025-01-22T10:30:00Z",
    updatedAt: "2025-01-22T10:30:00Z",
    amount: 150000,
  },
  {
    id: "RCLM-20250120-045",
    type: "Service",
    description: "Délai trop long pour traitement de virement",
    status: "in_progress",
    priority: "normal",
    createdAt: "2025-01-20T14:15:00Z",
    updatedAt: "2025-01-21T09:20:00Z",
    amount: null,
  },
  {
    id: "RCLM-20250118-032",
    type: "Frais",
    description: "Contestation de frais de tenue de compte",
    status: "resolved",
    priority: "low",
    createdAt: "2025-01-18T16:45:00Z",
    updatedAt: "2025-01-19T11:30:00Z",
    amount: 25000,
  },
  {
    id: "RCLM-20250115-018",
    type: "Carte",
    description: "Carte bancaire bloquée sans raison apparente",
    status: "resolved",
    priority: "urgent",
    createdAt: "2025-01-15T08:20:00Z",
    updatedAt: "2025-01-16T14:10:00Z",
    amount: null,
  },
]

const statusConfig = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
  in_progress: { label: "En cours", color: "bg-blue-100 text-blue-800" },
  resolved: { label: "Résolue", color: "bg-green-100 text-green-800" },
  rejected: { label: "Rejetée", color: "bg-red-100 text-red-800" },
}

const priorityConfig = {
  low: { label: "Faible", color: "bg-gray-100 text-gray-800" },
  normal: { label: "Normal", color: "bg-blue-100 text-blue-800" },
  high: { label: "Élevé", color: "bg-orange-100 text-orange-800" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-800" },
}

export default function ComplaintsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredComplaints = mockComplaints.filter((complaint) => {
    const matchesSearch =
      complaint.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.type.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const stats = {
    total: mockComplaints.length,
    pending: mockComplaints.filter((c) => c.status === "pending").length,
    inProgress: mockComplaints.filter((c) => c.status === "in_progress").length,
    resolved: mockComplaints.filter((c) => c.status === "resolved").length,
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatAmount = (amount: number | null) => {
    if (!amount) return "N/A"
    return new Intl.NumberFormat("fr-FR").format(amount) + " GNF"
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes réclamations</h1>
          <p className="text-gray-600 mt-2">Consultez et suivez l'état de vos réclamations</p>
        </div>
        <Link href="/complaints/new">
          <Button className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nouvelle réclamation
          </Button>
        </Link>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Résolues</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Rechercher et filtrer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par référence, type ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                size="sm"
              >
                Toutes
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                onClick={() => setStatusFilter("pending")}
                size="sm"
              >
                En attente
              </Button>
              <Button
                variant={statusFilter === "in_progress" ? "default" : "outline"}
                onClick={() => setStatusFilter("in_progress")}
                size="sm"
              >
                En cours
              </Button>
              <Button
                variant={statusFilter === "resolved" ? "default" : "outline"}
                onClick={() => setStatusFilter("resolved")}
                size="sm"
              >
                Résolues
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des réclamations */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des réclamations</CardTitle>
          <CardDescription>
            {filteredComplaints.length} réclamation{filteredComplaints.length > 1 ? "s" : ""} trouvée
            {filteredComplaints.length > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredComplaints.length === 0 ? (
            <div className="text-center py-8">
              <svg
                className="w-12 h-12 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-500">Aucune réclamation trouvée</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComplaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{complaint.id}</h3>
                        <Badge className={statusConfig[complaint.status as keyof typeof statusConfig].color}>
                          {statusConfig[complaint.status as keyof typeof statusConfig].label}
                        </Badge>
                        <Badge className={priorityConfig[complaint.priority as keyof typeof priorityConfig].color}>
                          {priorityConfig[complaint.priority as keyof typeof priorityConfig].label}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Type</p>
                          <p className="font-medium">{complaint.type}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Montant</p>
                          <p className="font-medium">{formatAmount(complaint.amount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Créée le</p>
                          <p className="font-medium">{formatDate(complaint.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Mise à jour</p>
                          <p className="font-medium">{formatDate(complaint.updatedAt)}</p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="text-gray-500 text-sm">Description</p>
                        <p className="text-gray-900">{complaint.description}</p>
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col gap-2">
                      <Button variant="outline" size="sm">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        Détails
                      </Button>

                      {complaint.status === "resolved" && (
                        <Button variant="outline" size="sm">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Export PDF
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
