"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { submitComplaint } from "./actions"
import { useActionState } from "react"

const complaintTypes = [
  { value: "transaction", label: "Transaction", description: "Débit non autorisé, montant incorrect" },
  { value: "service", label: "Service", description: "Accueil, délais, information" },
  { value: "fees", label: "Frais", description: "Contestation de commissions" },
  { value: "card", label: "Carte", description: "Dysfonctionnement, fraude" },
  { value: "transfer", label: "Virement", description: "Retard, erreur de destinataire" },
  { value: "other", label: "Autre", description: "Cas spécifiques" },
]

const priorityLevels = [
  { value: "low", label: "Faible", color: "bg-gray-100 text-gray-800" },
  { value: "normal", label: "Normal", color: "bg-blue-100 text-blue-800" },
  { value: "high", label: "Élevé", color: "bg-orange-100 text-orange-800" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-800" },
]

export default function NewComplaintPage() {
  const [state, action, isPending] = useActionState(submitComplaint, null)
  const [includeTransaction, setIncludeTransaction] = useState(false)
  const [selectedPriority, setSelectedPriority] = useState("normal")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Nouvelle réclamation</h1>
        <p className="text-gray-600 mt-2">
          Signalez un problème ou une insatisfaction concernant nos services bancaires
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                Formulaire de réclamation
              </CardTitle>
              <CardDescription>
                Remplissez tous les champs obligatoires pour soumettre votre réclamation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={action} className="space-y-6">
                {/* Informations personnelles */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Informations personnelles</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Nom complet *</Label>
                      <Input id="fullName" name="fullName" defaultValue="Mamadou Diallo" required className="mt-1" />
                    </div>

                    <div>
                      <Label htmlFor="accountNumber">Numéro de compte *</Label>
                      <Input
                        id="accountNumber"
                        name="accountNumber"
                        placeholder="GN123456789012345 ou format interne"
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Adresse e-mail *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="exemple@domaine.com"
                        required
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Numéro de téléphone *</Label>
                      <Input id="phone" name="phone" placeholder="+224 XXX XXX XXX" required className="mt-1" />
                    </div>
                  </div>
                </div>

                {/* Détails de la réclamation */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Détails de la réclamation</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="complaintType">Type de réclamation *</Label>
                      <Select name="complaintType" required>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Sélectionnez un type" />
                        </SelectTrigger>
                        <SelectContent>
                          {complaintTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-sm text-gray-500">{type.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="priority">Priorité *</Label>
                      <Select name="priority" value={selectedPriority} onValueChange={setSelectedPriority} required>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              <div className="flex items-center gap-2">
                                <Badge className={level.color}>{level.label}</Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description de la réclamation *</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Décrivez précisément votre réclamation (minimum 20 caractères)..."
                      required
                      rows={4}
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Soyez le plus précis possible pour accélérer le traitement
                    </p>
                  </div>
                </div>

                {/* Transaction concernée (optionnel) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="includeTransaction"
                      checked={includeTransaction}
                      onChange={(e) => setIncludeTransaction(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="includeTransaction" className="text-base">
                      Cette réclamation concerne une transaction spécifique
                    </Label>
                  </div>

                  {includeTransaction && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label htmlFor="transactionDate">Date de la transaction</Label>
                        <Input
                          id="transactionDate"
                          name="transactionDate"
                          type="date"
                          max={new Date().toISOString().split("T")[0]}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="transactionAmount">Montant (GNF)</Label>
                        <Input
                          id="transactionAmount"
                          name="transactionAmount"
                          type="number"
                          min="1"
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="transactionReference">Référence</Label>
                        <Input
                          id="transactionReference"
                          name="transactionReference"
                          placeholder="REF123456"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Pièces jointes */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Pièces jointes (optionnel)</h3>
                  <div>
                    <Label htmlFor="attachments">Documents justificatifs</Label>
                    <Input
                      id="attachments"
                      name="attachments"
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Formats acceptés : PDF, JPG, PNG, DOC, DOCX (max 5 Mo par fichier)
                    </p>
                  </div>
                </div>

                {/* Messages d'erreur */}
                {state?.error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-red-800 font-medium">Erreur de validation</p>
                    </div>
                    <p className="text-red-700 mt-1">{state.error}</p>
                  </div>
                )}

                {/* Message de succès */}
                {state?.success && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-green-800 font-medium">Réclamation soumise avec succès</p>
                    </div>
                    <p className="text-green-700 mt-1">
                      Référence : <strong>{state.reference}</strong>
                    </p>
                    <p className="text-green-700">Vous recevrez une réponse sous 72h ouvrées.</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button type="submit" disabled={isPending} className="flex-1">
                    {isPending ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Soumission en cours...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                        Soumettre la réclamation
                      </>
                    )}
                  </Button>

                  <Button type="button" variant="outline" onClick={() => window.history.back()}>
                    Annuler
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Informations utiles */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Délais de traitement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Accusé de réception</p>
                  <p className="text-sm text-gray-600">Immédiat</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Première réponse</p>
                  <p className="text-sm text-gray-600">72h ouvrées</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Résolution finale</p>
                  <p className="text-sm text-gray-600">15 jours ouvrés</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Besoin d'aide ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">Service réclamations</p>
                <p className="text-sm text-gray-600">+224 30 45 67 89</p>
                <p className="text-sm text-gray-600">reclamations@bng.gov.gn</p>
              </div>
              <div>
                <p className="font-medium">Horaires</p>
                <p className="text-sm text-gray-600">Lun-Ven : 8h-17h</p>
                <p className="text-sm text-gray-600">Sam : 8h-12h</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conseils</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Soyez précis dans votre description</li>
                <li>• Joignez tous les documents utiles</li>
                <li>• Conservez votre numéro de référence</li>
                <li>• Vérifiez vos coordonnées</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
