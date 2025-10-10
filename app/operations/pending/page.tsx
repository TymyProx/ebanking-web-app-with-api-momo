"use client"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Banknote,
  Send,
  Download,
  Eye,
  RotateCcw,
  X,
} from "lucide-react"
import { getPendingOperations, cancelOperation, retryOperation } from "./actions"

interface PendingOperation {
  id: string
  type: "transfer" | "payment" | "deposit" | "withdrawal"
  description: string
  amount: number
  currency: string
  recipient?: string
  status: "pending" | "processing" | "failed" | "approval_required"
  createdAt: string
  estimatedCompletion?: string
  failureReason?: string
  canCancel: boolean
  canRetry: boolean
}

export default function PendingOperationsPage() {
  const [operations, setOperations] = useState<PendingOperation[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [actionState, setActionState] = useState<any>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Charger les opérations au montage du composant
  useEffect(() => {
    const loadOperations = () => {
      startTransition(async () => {
        try {
          const result = await getPendingOperations()
          if (result.success) {
            setOperations(result.data || [])
          }
          setIsLoaded(true)
        } catch (error) {
          console.error("Erreur lors du chargement des opérations:", error)
          setIsLoaded(true)
        }
      })
    }
    loadOperations()
  }, [])

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const result = await getPendingOperations()
        if (result.success) {
          setOperations(result.data || [])
          setLastRefresh(new Date())
          setActionState({ success: true, message: "Opérations actualisées avec succès" })
        }
      } catch (error) {
        console.error("Erreur lors du rafraîchissement:", error)
        setActionState({ success: false, error: "Erreur lors de l'actualisation" })
      }
    })
  }

  const handleCancelOperation = async (operationId: string) => {
    startTransition(async () => {
      try {
        const result = await cancelOperation(operationId)
        if (result.success) {
          // Mettre à jour la liste des opérations
          setOperations((prev) => prev.filter((op) => op.id !== operationId))
          setActionState({ success: true, message: "Opération annulée avec succès" })
        } else {
          setActionState({ success: false, error: result.error })
        }
      } catch (error) {
        setActionState({ success: false, error: "Erreur lors de l'annulation" })
      }
    })
  }

  const handleRetryOperation = async (operationId: string) => {
    startTransition(async () => {
      try {
        const result = await retryOperation(operationId)
        if (result.success) {
          // Mettre à jour le statut de l'opération
          setOperations((prev) =>
            prev.map((op) =>
              op.id === operationId ? { ...op, status: "pending" as const, failureReason: undefined } : op,
            ),
          )
          setActionState({ success: true, message: "Opération relancée avec succès" })
        } else {
          setActionState({ success: false, error: result.error })
        }
      } catch (error) {
        setActionState({ success: false, error: "Erreur lors de la relance" })
      }
    })
  }

  const formatAmount = (amount: number, currency: string) => {
    if (currency === "GNF") {
      return new Intl.NumberFormat("fr-FR").format(amount)
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  const getOperationIcon = (type: string) => {
    switch (type) {
      case "transfer":
        return <Send className="h-5 w-5 text-blue-600" />
      case "payment":
        return <CreditCard className="h-5 w-5 text-purple-600" />
      case "deposit":
        return <ArrowDownRight className="h-5 w-5 text-green-600" />
      case "withdrawal":
        return <ArrowUpRight className="h-5 w-5 text-red-600" />
      default:
        return <Banknote className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            En attente
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            En cours
          </Badge>
        )
      case "failed":
        return <Badge variant="destructive">Échoué</Badge>
      case "approval_required":
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            Approbation requise
          </Badge>
        )
      default:
        return <Badge variant="secondary">Inconnu</Badge>
    }
  }

  const getOperationTypeLabel = (type: string) => {
    switch (type) {
      case "transfer":
        return "Virement"
      case "payment":
        return "Paiement"
      case "deposit":
        return "Dépôt"
      case "withdrawal":
        return "Retrait"
      default:
        return "Opération"
    }
  }

  const getStatusCounts = () => {
    return {
      total: operations.length,
      pending: operations.filter((op) => op.status === "pending").length,
      processing: operations.filter((op) => op.status === "processing").length,
      failed: operations.filter((op) => op.status === "failed").length,
      approval: operations.filter((op) => op.status === "approval_required").length,
    }
  }

  const statusCounts = getStatusCounts()

  return (
    <div className="space-y-6 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            Opérations en attente
          </h1>
          <p className="text-gray-600 mt-1">Suivi de vos transactions en cours de traitement</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleRefresh} disabled={isPending} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? "animate-spin" : ""}`} />
            {isPending ? "Actualisation..." : "Actualiser"}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Messages de feedback */}
      {actionState?.success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">✅ {actionState.message}</AlertDescription>
        </Alert>
      )}

      {actionState?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>❌ {actionState.error}</AlertDescription>
        </Alert>
      )}

      {/* Résumé des opérations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-2 hover:border-primary/30 transition-all bg-white/80 backdrop-blur-sm">
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.total}</p>
                <p className="text-xs text-gray-600">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/30 transition-all bg-white/80 backdrop-blur-sm">
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.pending}</p>
                <p className="text-xs text-gray-600">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/30 transition-all bg-white/80 backdrop-blur-sm">
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.processing}</p>
                <p className="text-xs text-gray-600">En cours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/30 transition-all bg-white/80 backdrop-blur-sm">
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.failed}</p>
                <p className="text-xs text-gray-600">Échouées</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/30 transition-all bg-white/80 backdrop-blur-sm">
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.approval}</p>
                <p className="text-xs text-gray-600">Approbation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des opérations */}
      {!isLoaded ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : operations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune opération en attente</h3>
            <p className="text-gray-600 text-center">Toutes vos opérations ont été traitées avec succès.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {operations.map((operation) => (
            <Card
              key={operation.id}
              className="border-2 hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-xl bg-white/80 backdrop-blur-sm"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">{getOperationIcon(operation.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium text-gray-900">{getOperationTypeLabel(operation.type)}</p>
                        {getStatusBadge(operation.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{operation.description}</p>
                      {operation.recipient && <p className="text-xs text-gray-500">Vers: {operation.recipient}</p>}
                      {operation.failureReason && (
                        <p className="text-xs text-red-600 mt-1">
                          <AlertCircle className="h-3 w-3 inline mr-1" />
                          {operation.failureReason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {formatAmount(operation.amount, operation.currency)} {operation.currency}
                    </p>
                    <p className="text-xs text-gray-500">
                      Créé le {new Date(operation.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                    {operation.estimatedCompletion && (
                      <p className="text-xs text-gray-500">
                        Finalisation estimée: {new Date(operation.estimatedCompletion).toLocaleDateString("fr-FR")}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-2 mt-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3 mr-1" />
                        Détails
                      </Button>

                      {operation.canRetry && operation.status === "failed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetryOperation(operation.id)}
                          disabled={isPending}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Relancer
                        </Button>
                      )}

                      {operation.canCancel &&
                        (operation.status === "pending" || operation.status === "approval_required") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelOperation(operation.id)}
                            disabled={isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Annuler
                          </Button>
                        )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Informations supplémentaires */}
      {isLoaded && operations.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">Informations importantes</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Les opérations en attente sont traitées dans l'ordre de réception</li>
                  <li>• Les virements importants peuvent nécessiter une approbation manuelle</li>
                  <li>• Vous pouvez annuler une opération tant qu'elle n'est pas en cours de traitement</li>
                  <li>• Les opérations échouées peuvent être relancées après correction du problème</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
