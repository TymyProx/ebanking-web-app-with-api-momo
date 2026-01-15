"use client"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { getPendingOperations, cancelOperation, retryOperation, getOperationDetails } from "./actions"

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
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedOperation, setSelectedOperation] = useState<any>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "processing" | "failed" | "approval_required">("all")

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

  const handleViewDetails = async (operation: PendingOperation) => {
    setIsDetailsModalOpen(true)
    setIsLoadingDetails(true)
    setSelectedOperation(null)

    try {
      const result = await getOperationDetails(operation.id)
      if (result.success) {
        setSelectedOperation(result.data)
      } else {
        setActionState({ success: false, error: result.error })
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des détails:", error)
      setActionState({ success: false, error: "Erreur lors de la récupération des détails" })
    } finally {
      setIsLoadingDetails(false)
    }
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

  // Filtrer les opérations en fonction de l'onglet actif
  const filteredOperations = operations.filter((operation) => {
    if (activeFilter === "all") return true
    return operation.status === activeFilter
  })

  return (
   <div className="mt-6 space-y-6" lang="fr">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-primary">Opérations en attente</h1>
          <p className="text-gray-600">Suivi de vos transactions en cours de traitement</p>
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

      {/* Onglets de catégories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Toutes les opérations */}
        <button
          onClick={() => setActiveFilter("all")}
          className={`relative group p-4 rounded-xl border-2 transition-all duration-300 text-left ${
            activeFilter === "all"
              ? "border-primary bg-primary/5 shadow-lg shadow-primary/20"
              : "border-border bg-card hover:border-primary/50 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Total</h3>
                <p className="text-xl font-bold text-primary">{statusCounts.total}</p>
              </div>
            </div>
            {activeFilter === "all" && (
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
            )}
          </div>
          {activeFilter === "all" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 rounded-b-xl"></div>
          )}
        </button>

        {/* En attente */}
        <button
          onClick={() => setActiveFilter("pending")}
          className={`relative group p-4 rounded-xl border-2 transition-all duration-300 text-left ${
            activeFilter === "pending"
              ? "border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20 shadow-lg shadow-yellow-500/20"
              : "border-border bg-card hover:border-yellow-500/50 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">En attente</h3>
                <p className="text-xl font-bold text-yellow-600">{statusCounts.pending}</p>
              </div>
            </div>
            {activeFilter === "pending" && (
              <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></div>
            )}
          </div>
          {activeFilter === "pending" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500/0 via-yellow-500 to-yellow-500/0 rounded-b-xl"></div>
          )}
        </button>

        {/* En cours */}
        <button
          onClick={() => setActiveFilter("processing")}
          className={`relative group p-4 rounded-xl border-2 transition-all duration-300 text-left ${
            activeFilter === "processing"
              ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-lg shadow-blue-500/20"
              : "border-border bg-card hover:border-blue-500/50 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                <RefreshCw className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">En cours</h3>
                <p className="text-xl font-bold text-blue-600">{statusCounts.processing}</p>
              </div>
            </div>
            {activeFilter === "processing" && (
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
            )}
          </div>
          {activeFilter === "processing" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/0 via-blue-500 to-blue-500/0 rounded-b-xl"></div>
          )}
        </button>

        {/* Échouées */}
        <button
          onClick={() => setActiveFilter("failed")}
          className={`relative group p-4 rounded-xl border-2 transition-all duration-300 text-left ${
            activeFilter === "failed"
              ? "border-red-500 bg-red-50/50 dark:bg-red-950/20 shadow-lg shadow-red-500/20"
              : "border-border bg-card hover:border-red-500/50 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/10 to-red-500/5">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Échouées</h3>
                <p className="text-xl font-bold text-red-600">{statusCounts.failed}</p>
              </div>
            </div>
            {activeFilter === "failed" && (
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
            )}
          </div>
          {activeFilter === "failed" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500/0 via-red-500 to-red-500/0 rounded-b-xl"></div>
          )}
        </button>

        {/* Approbation */}
        <button
          onClick={() => setActiveFilter("approval_required")}
          className={`relative group p-4 rounded-xl border-2 transition-all duration-300 text-left ${
            activeFilter === "approval_required"
              ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 shadow-lg shadow-orange-500/20"
              : "border-border bg-card hover:border-orange-500/50 hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-500/5">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Approbation</h3>
                <p className="text-xl font-bold text-orange-600">{statusCounts.approval}</p>
              </div>
            </div>
            {activeFilter === "approval_required" && (
              <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></div>
            )}
          </div>
          {activeFilter === "approval_required" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500/0 via-orange-500 to-orange-500/0 rounded-b-xl"></div>
          )}
        </button>
      </div>

      {/* Liste des opérations */}
      {!isLoaded ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
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
      ) : filteredOperations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeFilter === "all" ? "Aucune opération en attente" : `Aucune opération ${activeFilter === "pending" ? "en attente" : activeFilter === "processing" ? "en cours" : activeFilter === "failed" ? "échouée" : "nécessitant une approbation"}`}
            </h3>
            <p className="text-gray-600 text-center">
              {activeFilter === "all" ? "Toutes vos opérations ont été traitées avec succès." : "Aucune opération ne correspond à ce filtre."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOperations.map((operation) => (
            <Card
              key={operation.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onDoubleClick={() => handleViewDetails(operation)}
            >
              <CardContent className="p-4">
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Informations supplémentaires */}
      {isLoaded && filteredOperations.length > 0 && (
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

      {/* Modal des détails */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Détails de l'opération
            </DialogTitle>
          </DialogHeader>
          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <Clock className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : selectedOperation ? (
            <div className="space-y-6">
              {/* Informations principales */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Référence</p>
                  <p className="font-semibold">{selectedOperation.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-semibold">{getOperationTypeLabel(selectedOperation.type)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Montant</p>
                  <p className="font-semibold text-lg">
                    {formatAmount(selectedOperation.amount, selectedOperation.currency)} {selectedOperation.currency}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Statut</p>
                  {getStatusBadge(selectedOperation.status)}
                </div>
                {selectedOperation.recipient && (
                  <div>
                    <p className="text-sm text-gray-600">Bénéficiaire</p>
                    <p className="font-semibold">{selectedOperation.recipient}</p>
                  </div>
                )}
                {selectedOperation.recipientAccount && (
                  <div>
                    <p className="text-sm text-gray-600">Compte bénéficiaire</p>
                    <p className="font-semibold font-mono text-sm">{selectedOperation.recipientAccount}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Date de création</p>
                  <p className="font-semibold">{new Date(selectedOperation.createdAt).toLocaleString("fr-FR")}</p>
                </div>
                {selectedOperation.estimatedCompletion && (
                  <div>
                    <p className="text-sm text-gray-600">Finalisation estimée</p>
                    <p className="font-semibold">
                      {new Date(selectedOperation.estimatedCompletion).toLocaleString("fr-FR")}
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <p className="text-sm text-gray-600 mb-1">Description</p>
                <p className="text-gray-900">{selectedOperation.description}</p>
              </div>

              {/* Étapes de traitement */}
              {selectedOperation.steps && selectedOperation.steps.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-3">Suivi du traitement</p>
                  <div className="space-y-3">
                    {selectedOperation.steps.map((step: any, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {step.status === "completed" ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : step.status === "in_progress" ? (
                            <Clock className="w-5 h-5 text-blue-600 animate-spin" />
                          ) : step.status === "failed" ? (
                            <XCircle className="w-5 h-5 text-red-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{step.step}</p>
                          <p className="text-xs text-gray-600">{step.description}</p>
                          {step.timestamp && (
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(step.timestamp).toLocaleString("fr-FR")}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                {selectedOperation.canRetry && selectedOperation.status === "failed" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleRetryOperation(selectedOperation.id)
                      setIsDetailsModalOpen(false)
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Relancer
                  </Button>
                )}
                {selectedOperation.canCancel &&
                  (selectedOperation.status === "pending" || selectedOperation.status === "approval_required") && (
                    <Button
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        handleCancelOperation(selectedOperation.id)
                        setIsDetailsModalOpen(false)
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Annuler l'opération
                    </Button>
                  )}
                <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">Aucun détail disponible</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
