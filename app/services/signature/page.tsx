"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  FileText,
  PenTool,
  Download,
  Eye,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Mail,
  CreditCard,
} from "lucide-react"
import { generateDocument, signDocument, sendOTP } from "./actions"

interface DocumentData {
  type: string
  accountId: string
  amount?: string
  purpose?: string
  recipient?: string
  additionalInfo?: string
}

interface GeneratedDocument {
  id: string
  type: string
  content: string
  createdAt: string
  status: "generated" | "signed"
  downloadUrl?: string
}

const documentTypes = [
  {
    id: "attestation_solde",
    name: "Attestation de solde",
    description: "Document certifiant le solde de votre compte",
    fields: ["accountId", "purpose"],
    price: "5,000 GNF",
  },
  {
    id: "attestation_compte",
    name: "Attestation de compte",
    description: "Document certifiant l'existence de votre compte",
    fields: ["accountId", "purpose"],
    price: "3,000 GNF",
  },
  {
    id: "demande_credit",
    name: "Demande de crédit",
    description: "Formulaire de demande de crédit personnel",
    fields: ["accountId", "amount", "purpose", "additionalInfo"],
    price: "Gratuit",
  },
  {
    id: "contrat_epargne",
    name: "Contrat d'épargne",
    description: "Contrat d'ouverture de compte épargne",
    fields: ["accountId", "amount", "additionalInfo"],
    price: "Gratuit",
  },
]

const accounts = [
  { id: "ACC001", name: "Compte Courant - 1234567890", balance: "2,450,000 GNF" },
  { id: "ACC002", name: "Compte Épargne - 0987654321", balance: "5,780,000 GNF" },
  { id: "ACC003", name: "Compte Professionnel - 1122334455", balance: "12,300,000 GNF" },
]

export default function ElectronicSignaturePage() {
  const [isPending, startTransition] = useTransition()
  const [selectedType, setSelectedType] = useState("")
  const [documentData, setDocumentData] = useState<DocumentData>({
    type: "",
    accountId: "",
    amount: "",
    purpose: "",
    recipient: "",
    additionalInfo: "",
  })
  const [generatedDocument, setGeneratedDocument] = useState<GeneratedDocument | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showSignature, setShowSignature] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [signatureMethod, setSignatureMethod] = useState<"otp" | "biometric">("otp")
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const selectedDocType = documentTypes.find((doc) => doc.id === selectedType)

  const handleGenerateDocument = () => {
    startTransition(async () => {
      try {
        const formData = new FormData()
        Object.entries(documentData).forEach(([key, value]) => {
          formData.append(key, value)
        })

        const response = await generateDocument(formData)

        if (response.success) {
          setGeneratedDocument({
            id: `DOC-${Date.now()}`,
            type: selectedType,
            content: response.content || "",
            createdAt: new Date().toISOString(),
            status: "generated",
          })
          setShowPreview(true)
          setResult({ success: true, message: "Document généré avec succès !" })
        } else {
          setResult({ success: false, message: response.message })
        }
      } catch (error) {
        setResult({ success: false, message: "Erreur lors de la génération du document" })
      }
    })
  }

  const handleSendOTP = () => {
    startTransition(async () => {
      try {
        const response = await sendOTP()
        if (response.success) {
          setOtpSent(true)
          setResult({ success: true, message: "Code OTP envoyé par SMS" })
        } else {
          setResult({ success: false, message: response.message })
        }
      } catch (error) {
        setResult({ success: false, message: "Erreur lors de l'envoi du code OTP" })
      }
    })
  }

  const handleSignDocument = () => {
    if (!generatedDocument) return

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append("documentId", generatedDocument.id)
        formData.append("method", signatureMethod)
        if (signatureMethod === "otp") {
          formData.append("otpCode", otpCode)
        }

        const response = await signDocument(formData)

        if (response.success) {
          setGeneratedDocument({
            ...generatedDocument,
            status: "signed",
            downloadUrl: `/documents/${generatedDocument.id}.pdf`,
          })
          setShowSignature(false)
          setResult({
            success: true,
            message:
              "Votre document a été généré et signé avec succès. Vous pouvez le télécharger ou l'envoyer par email.",
          })
        } else {
          setResult({ success: false, message: response.message })
        }
      } catch (error) {
        setResult({
          success: false,
          message:
            "Erreur lors de la signature. Veuillez vérifier le code de confirmation ou réessayer ultérieurement.",
        })
      }
    })
  }

  const resetForm = () => {
    setSelectedType("")
    setDocumentData({
      type: "",
      accountId: "",
      amount: "",
      purpose: "",
      recipient: "",
      additionalInfo: "",
    })
    setGeneratedDocument(null)
    setShowPreview(false)
    setShowSignature(false)
    setOtpSent(false)
    setOtpCode("")
    setResult(null)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Signature Électronique</h1>
          <p className="text-gray-600 mt-2">Générez et signez vos documents bancaires en toute sécurité</p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-green-600" />
          <span className="text-sm text-green-600 font-medium">Sécurisé eIDAS</span>
        </div>
      </div>

      {result && (
        <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <div className="flex items-center space-x-2">
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
              {result.message}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire de génération */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Générer un Document</span>
              </CardTitle>
              <CardDescription>
                Sélectionnez le type de document et remplissez les informations requises
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sélection du type de document */}
              <div className="space-y-3">
                <Label>Type de document</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {documentTypes.map((docType) => (
                    <div
                      key={docType.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedType === docType.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => {
                        setSelectedType(docType.id)
                        setDocumentData({ ...documentData, type: docType.id })
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-sm">{docType.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {docType.price}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">{docType.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedDocType && (
                <>
                  <Separator />

                  {/* Champs du formulaire */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Informations du document</h3>

                    {selectedDocType.fields.includes("accountId") && (
                      <div className="space-y-2">
                        <Label htmlFor="accountId">Compte concerné *</Label>
                        {accounts.length === 0 ? (
                          <div className="text-center py-8">
                            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">Aucun compte</p>
                            <p className="text-gray-400 text-sm">
                              Aucun compte n'est disponible pour générer ce document
                            </p>
                          </div>
                        ) : (
                          <Select
                            value={documentData.accountId}
                            onValueChange={(value) => setDocumentData({ ...documentData, accountId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un compte" />
                            </SelectTrigger>
                            <SelectContent>
                              {accounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  <div className="flex flex-col">
                                    <span>{account.name}</span>
                                    <span className="text-xs text-gray-500">{account.balance}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}

                    {selectedDocType.fields.includes("amount") && (
                      <div className="space-y-2">
                        <Label htmlFor="amount">Montant (GNF) *</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="Ex: 1000000"
                          value={documentData.amount}
                          onChange={(e) => setDocumentData({ ...documentData, amount: e.target.value })}
                        />
                      </div>
                    )}

                    {selectedDocType.fields.includes("purpose") && (
                      <div className="space-y-2">
                        <Label htmlFor="purpose">Motif / Objet *</Label>
                        <Select
                          value={documentData.purpose}
                          onValueChange={(value) => setDocumentData({ ...documentData, purpose: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un motif" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="visa">Demande de visa</SelectItem>
                            <SelectItem value="pret">Demande de prêt</SelectItem>
                            <SelectItem value="emploi">Recherche d'emploi</SelectItem>
                            <SelectItem value="location">Location immobilière</SelectItem>
                            <SelectItem value="etudes">Études à l'étranger</SelectItem>
                            <SelectItem value="autre">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedDocType.fields.includes("recipient") && (
                      <div className="space-y-2">
                        <Label htmlFor="recipient">Destinataire</Label>
                        <Input
                          id="recipient"
                          placeholder="Nom de l'organisme ou personne"
                          value={documentData.recipient}
                          onChange={(e) => setDocumentData({ ...documentData, recipient: e.target.value })}
                        />
                      </div>
                    )}

                    {selectedDocType.fields.includes("additionalInfo") && (
                      <div className="space-y-2">
                        <Label htmlFor="additionalInfo">Informations complémentaires</Label>
                        <Textarea
                          id="additionalInfo"
                          placeholder="Précisions supplémentaires..."
                          value={documentData.additionalInfo}
                          onChange={(e) => setDocumentData({ ...documentData, additionalInfo: e.target.value })}
                          rows={3}
                        />
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleGenerateDocument}
                    disabled={isPending || !documentData.accountId || accounts.length === 0}
                    className="w-full"
                  >
                    {isPending ? "Génération..." : "Générer le document"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar récapitulatif */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedDocType ? (
                <>
                  <div>
                    <p className="font-medium">{selectedDocType.name}</p>
                    <p className="text-sm text-gray-600">{selectedDocType.description}</p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Prix:</span>
                    <span className="font-medium">{selectedDocType.price}</span>
                  </div>
                  {documentData.accountId && (
                    <div>
                      <p className="text-sm text-gray-600">Compte sélectionné:</p>
                      <p className="text-sm font-medium">
                        {accounts.find((acc) => acc.id === documentData.accountId)?.name}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">Sélectionnez un type de document pour voir le récapitulatif</p>
              )}
            </CardContent>
          </Card>

          {generatedDocument && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Document généré</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Statut:</span>
                  <Badge variant={generatedDocument.status === "signed" ? "default" : "secondary"}>
                    {generatedDocument.status === "signed" ? "Signé" : "En attente"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Créé le:</span>
                  <span className="text-sm">{new Date(generatedDocument.createdAt).toLocaleDateString("fr-FR")}</span>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                    onClick={() => setShowPreview(true)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Aperçu
                  </Button>

                  {generatedDocument.status === "generated" && (
                    <Button size="sm" className="w-full" onClick={() => setShowSignature(true)}>
                      <PenTool className="h-4 w-4 mr-2" />
                      Signer
                    </Button>
                  )}

                  {generatedDocument.status === "signed" && (
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sécurité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <Shield className="h-4 w-4 text-green-600" />
                <span>Signature conforme eIDAS</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>Horodatage sécurisé</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Intégrité garantie</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog Aperçu */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aperçu du document</DialogTitle>
            <DialogDescription>Vérifiez les informations avant de procéder à la signature</DialogDescription>
          </DialogHeader>

          {generatedDocument && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold">BANQUE NATIONALE DE GUINÉE</h2>
                  <p className="text-sm text-gray-600">AstraBanking - Services Numériques</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-center">{selectedDocType?.name.toUpperCase()}</h3>

                  <div className="space-y-2">
                    <p>
                      <strong>Référence:</strong> {generatedDocument.id}
                    </p>
                    <p>
                      <strong>Date d'émission:</strong> {new Date().toLocaleDateString("fr-FR")}
                    </p>
                    <p>
                      <strong>Titulaire:</strong> Utilisateur Demo
                    </p>
                    <p>
                      <strong>Compte:</strong> {accounts.find((acc) => acc.id === documentData.accountId)?.name}
                    </p>
                    {documentData.amount && (
                      <p>
                        <strong>Montant:</strong> {Number.parseInt(documentData.amount).toLocaleString()} GNF
                      </p>
                    )}
                    {documentData.purpose && (
                      <p>
                        <strong>Motif:</strong> {documentData.purpose}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      Ce document est généré automatiquement par le système AstraBanking. Une fois signé
                      électroniquement, il aura la même valeur légale qu'un document papier signé.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Fermer
                </Button>
                <Button
                  onClick={() => {
                    setShowPreview(false)
                    setShowSignature(true)
                  }}
                >
                  Procéder à la signature
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Signature */}
      <Dialog open={showSignature} onOpenChange={setShowSignature}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signature Électronique</DialogTitle>
            <DialogDescription>Choisissez votre méthode de signature sécurisée</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Méthode de signature */}
            <div className="space-y-3">
              <Label>Méthode de signature</Label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    signatureMethod === "otp" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSignatureMethod("otp")}
                >
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-4 w-4" />
                    <span className="text-sm font-medium">Code OTP</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Via SMS</p>
                </div>

                <div
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    signatureMethod === "biometric"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSignatureMethod("biometric")}
                >
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">Biométrie</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Empreinte/Face ID</p>
                </div>
              </div>
            </div>

            {signatureMethod === "otp" && (
              <div className="space-y-4">
                {!otpSent ? (
                  <Button onClick={handleSendOTP} disabled={isPending} className="w-full">
                    {isPending ? "Envoi..." : "Envoyer le code OTP"}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Label htmlFor="otpCode">Code de vérification</Label>
                    <Input
                      id="otpCode"
                      placeholder="Entrez le code à 6 chiffres"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      maxLength={6}
                    />
                    <p className="text-xs text-gray-600">Code envoyé au +224 XXX XXX 789</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowSignature(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleSignDocument}
                disabled={isPending || (signatureMethod === "otp" && (!otpSent || otpCode.length !== 6))}
              >
                {isPending ? "Signature..." : "Signer le document"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Actions rapides */}
      {generatedDocument && generatedDocument.status === "signed" && (
        <Card>
          <CardHeader>
            <CardTitle>Actions disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Télécharger PDF
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Envoyer par email
              </Button>
              <Button variant="outline" size="sm" onClick={resetForm}>
                <FileText className="h-4 w-4 mr-2" />
                Nouveau document
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
