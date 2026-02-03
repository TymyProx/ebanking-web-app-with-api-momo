"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  FileSpreadsheet,
  Upload,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  Shield,
  Clock,
  Users,
  DollarSign,
  FileCheck,
} from "lucide-react"
import { uploadBulkPaymentFile, validateBulkPayment, processBulkPayment } from "./actions"

interface BulkPaymentData {
  companyName: string
  companyAccount: string
  totalAmount: number
  beneficiaryCount: number
  paymentDate: string
  description: string
  file?: File
}

interface BeneficiaryData {
  nom: string
  prenom: string
  rib: string
  montant: number
  reference: string
}

export default function BulkPaymentPage() {
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState<BulkPaymentData>({
    companyName: "AstraBNG Entreprise",
    companyAccount: "",
    totalAmount: 0,
    beneficiaryCount: 0,
    paymentDate: "",
    description: "",
  })
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [fileValidation, setFileValidation] = useState<{
    isValid: boolean
    errors: string[]
    beneficiaries: BeneficiaryData[]
  } | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [result, setResult] = useState<{ success: boolean; message: string; reference?: string } | null>(null)

  const handleInputChange = (field: keyof BulkPaymentData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Vérifier l'extension du fichier
    const allowedExtensions = [".xlsx", ".xls"]
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))

    if (!allowedExtensions.includes(fileExtension)) {
      setResult({
        success: false,
        message: "Erreur : Le fichier doit être au format Excel (.xlsx ou .xls)",
      })
      return
    }

    setUploadedFile(file)
    setFormData((prev) => ({ ...prev, file }))

    // Simuler la validation du fichier
    startTransition(async () => {
      try {
        const formDataToSend = new FormData()
        formDataToSend.append("file", file)
        formDataToSend.append("companyAccount", formData.companyAccount)
        formDataToSend.append("totalAmount", formData.totalAmount.toString())
        formDataToSend.append("beneficiaryCount", formData.beneficiaryCount.toString())
        formDataToSend.append("paymentDate", formData.paymentDate)

        const validationResult = await uploadBulkPaymentFile(formDataToSend)

        if (validationResult.success && validationResult.data) {
          setFileValidation({
            isValid: true,
            errors: [],
            beneficiaries: validationResult.data.beneficiaries,
          })
        } else {
          setFileValidation({
            isValid: false,
            errors: validationResult.errors || [validationResult.message],
            beneficiaries: [],
          })
        }
      } catch (error) {
        setFileValidation({
          isValid: false,
          errors: ["Erreur lors de la validation du fichier"],
          beneficiaries: [],
        })
      }
    })
  }

  const handleValidatePayment = () => {
    if (!fileValidation?.isValid) return
    setShowPreview(true)
  }

  const handleConfirmPayment = async () => {
    setShowPreview(false)
    setShowConfirmation(true)

    // Simuler l'envoi d'OTP
    startTransition(async () => {
      const otpResult = await validateBulkPayment(new FormData())
      // OTP envoyé automatiquement
    })
  }

  const handleFinalizePayment = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setResult({
        success: false,
        message: "Veuillez saisir un code OTP valide à 6 chiffres",
      })
      return
    }

    startTransition(async () => {
      try {
        const finalFormData = new FormData()
        finalFormData.append("companyName", formData.companyName)
        finalFormData.append("companyAccount", formData.companyAccount)
        finalFormData.append("totalAmount", formData.totalAmount.toString())
        finalFormData.append("beneficiaryCount", formData.beneficiaryCount.toString())
        finalFormData.append("paymentDate", formData.paymentDate)
        finalFormData.append("description", formData.description)
        finalFormData.append("otpCode", otpCode)
        if (uploadedFile) {
          finalFormData.append("file", uploadedFile)
        }

        const processResult = await processBulkPayment(finalFormData)
        setResult(processResult)
        setShowConfirmation(false)

        if (processResult.success) {
          // Réinitialiser le formulaire
          setFormData({
            companyName: "AstraBNG Entreprise",
            companyAccount: "",
            totalAmount: 0,
            beneficiaryCount: 0,
            paymentDate: "",
            description: "",
          })
          setUploadedFile(null)
          setFileValidation(null)
          setOtpCode("")
        }
      } catch (error) {
        setResult({
          success: false,
          message: "Une erreur est survenue lors du traitement du paiement",
        })
        setShowConfirmation(false)
      }
    })
  }

  const downloadTemplate = () => {
    // Simuler le téléchargement du modèle Excel
    const link = document.createElement("a")
    link.href = "/template-paiement-masse.xlsx"
    link.download = "modele-paiement-masse.xlsx"
    link.click()
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Paiement de Masse</h1>
        <p className="text-gray-600">Effectuez des paiements multiples à partir d'un fichier Excel</p>
      </div>

      {result && (
        <Alert className={`mb-6 ${result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
          <div className="flex items-center">
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={`ml-2 ${result.success ? "text-green-800" : "text-red-800"}`}>
              {result.message}
              {result.reference && <div className="mt-2 font-mono text-sm">Référence : {result.reference}</div>}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileSpreadsheet className="h-5 w-5 mr-2" />
                Informations du Paiement
              </CardTitle>
              <CardDescription>Renseignez les détails du paiement de masse</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Nom de l'entreprise</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                    placeholder="Nom de votre entreprise"
                  />
                </div>
                <div>
                  <Label htmlFor="companyAccount">Compte entreprise</Label>
                  <Select onValueChange={(value) => handleInputChange("companyAccount", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un compte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GN001234567890123456">
                        GN001234567890123456 - Compte Principal (2,450,000 GNF)
                      </SelectItem>
                      <SelectItem value="GN001234567890123457">
                        GN001234567890123457 - Compte Salaires (5,200,000 GNF)
                      </SelectItem>
                      <SelectItem value="GN001234567890123458">
                        GN001234567890123458 - Compte Fournisseurs (1,800,000 GNF)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="totalAmount">Montant total (GNF)</Label>
                  <Input
                    id="totalAmount"
                    type="text"
                    inputMode="numeric"
                    value={formData.totalAmount || ""}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, "")
                      handleInputChange("totalAmount", Number.parseFloat(cleaned) || 0)
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="beneficiaryCount">Nombre de bénéficiaires</Label>
                  <Input
                    id="beneficiaryCount"
                    type="text"
                    inputMode="numeric"
                    value={formData.beneficiaryCount || ""}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, "")
                      handleInputChange("beneficiaryCount", Number.parseInt(cleaned) || 0)
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentDate">Date de paiement</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => handleInputChange("paymentDate", e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Salaires janvier 2025, primes trimestrielles..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Fichier Excel des Bénéficiaires
              </CardTitle>
              <CardDescription>Téléversez votre fichier Excel contenant la liste des bénéficiaires</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-dashed border-gray-300 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium">Modèle Excel requis</p>
                    <p className="text-sm text-gray-500">Colonnes : Nom, Prénom, RIB, Montant, Référence</p>
                  </div>
                </div>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger le modèle
                </Button>
              </div>

              <div>
                <Label htmlFor="file">Fichier Excel (.xlsx, .xls)</Label>
                <Input id="file" type="file" accept=".xlsx,.xls" onChange={handleFileUpload} disabled={isPending} />
              </div>

              {uploadedFile && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileCheck className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">{uploadedFile.name}</p>
                        <p className="text-sm text-blue-700">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    {isPending && (
                      <div className="flex items-center text-blue-600">
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Validation...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {fileValidation && (
                <div
                  className={`p-4 border rounded-lg ${
                    fileValidation.isValid ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                  }`}
                >
                  {fileValidation.isValid ? (
                    <div className="flex items-center text-green-800">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <div>
                        <p className="font-medium">Fichier validé avec succès</p>
                        <p className="text-sm">{fileValidation.beneficiaries.length} bénéficiaires détectés</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-red-800">
                      <div className="flex items-center mb-2">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <p className="font-medium">Erreurs détectées</p>
                      </div>
                      <ul className="text-sm space-y-1">
                        {fileValidation.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {fileValidation?.isValid && (
            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setShowPreview(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Aperçu
              </Button>
              <Button onClick={handleValidatePayment} disabled={isPending}>
                <Shield className="h-4 w-4 mr-2" />
                Valider le paiement
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar récapitulatif */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                  <span className="text-sm">Montant total</span>
                </div>
                <Badge variant="secondary">{formData.totalAmount.toLocaleString()} GNF</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-blue-600" />
                  <span className="text-sm">Bénéficiaires</span>
                </div>
                <Badge variant="secondary">{formData.beneficiaryCount}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-orange-600" />
                  <span className="text-sm">Date prévue</span>
                </div>
                <Badge variant="secondary">{formData.paymentDate || "Non définie"}</Badge>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Statut de validation</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Informations</span>
                    <Badge variant={formData.companyAccount && formData.totalAmount > 0 ? "default" : "secondary"}>
                      {formData.companyAccount && formData.totalAmount > 0 ? "✓" : "○"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Fichier Excel</span>
                    <Badge variant={uploadedFile ? "default" : "secondary"}>{uploadedFile ? "✓" : "○"}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Validation</span>
                    <Badge variant={fileValidation?.isValid ? "default" : "secondary"}>
                      {fileValidation?.isValid ? "✓" : "○"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sécurité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm">
                <Shield className="h-4 w-4 mr-2 text-green-600" />
                <span>Signature électronique requise</span>
              </div>
              <div className="flex items-center text-sm">
                <FileCheck className="h-4 w-4 mr-2 text-blue-600" />
                <span>Validation automatique des données</span>
              </div>
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-2 text-orange-600" />
                <span>Traçabilité complète</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog Aperçu */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aperçu du Paiement de Masse</DialogTitle>
            <DialogDescription>Vérifiez les détails avant de procéder au paiement</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Entreprise</p>
                <p className="text-sm text-gray-600">{formData.companyName}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Compte débiteur</p>
                <p className="text-sm text-gray-600">{formData.companyAccount}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Montant total</p>
                <p className="text-sm text-gray-600">{formData.totalAmount.toLocaleString()} GNF</p>
              </div>
              <div>
                <p className="text-sm font-medium">Date de paiement</p>
                <p className="text-sm text-gray-600">{formData.paymentDate}</p>
              </div>
            </div>

            {fileValidation?.beneficiaries && (
              <div>
                <h4 className="font-medium mb-2">Liste des bénéficiaires ({fileValidation.beneficiaries.length})</h4>
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Prénom</TableHead>
                        <TableHead>RIB</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Référence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fileValidation.beneficiaries.slice(0, 10).map((beneficiary, index) => (
                        <TableRow key={index}>
                          <TableCell>{beneficiary.nom}</TableCell>
                          <TableCell>{beneficiary.prenom}</TableCell>
                          <TableCell className="font-mono text-xs">{beneficiary.rib}</TableCell>
                          <TableCell>{beneficiary.montant.toLocaleString()} GNF</TableCell>
                          <TableCell>{beneficiary.reference}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {fileValidation.beneficiaries.length > 10 && (
                    <div className="p-2 text-center text-sm text-gray-500 border-t">
                      ... et {fileValidation.beneficiaries.length - 10} autres bénéficiaires
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Annuler
            </Button>
            <Button onClick={handleConfirmPayment}>Confirmer et signer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmation OTP */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signature Électronique</DialogTitle>
            <DialogDescription>Un code de confirmation a été envoyé à votre téléphone et email</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center text-blue-800">
                <Shield className="h-5 w-5 mr-2" />
                <div>
                  <p className="font-medium">Paiement de masse sécurisé</p>
                  <p className="text-sm">
                    Montant : {formData.totalAmount.toLocaleString()} GNF pour {formData.beneficiaryCount} bénéficiaires
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="otpCode">Code de confirmation (6 chiffres)</Label>
              <Input
                id="otpCode"
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="text-center text-lg tracking-widest"
              />
              <p className="text-xs text-gray-500 mt-1">Code valide pendant 5 minutes</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>
              Annuler
            </Button>
            <Button onClick={handleFinalizePayment} disabled={isPending || otpCode.length !== 6}>
              {isPending ? "Traitement..." : "Finaliser le paiement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
