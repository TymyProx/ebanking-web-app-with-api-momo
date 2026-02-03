"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Camera, Upload, X, CheckCircle, AlertCircle, Info, Trash2, RotateCcw } from "lucide-react"
import { submitCheckDeposit } from "./actions"
import { useActionState } from "react"

interface CheckImage {
  file: File
  preview: string
  id: string
}

export default function CheckDepositPage() {
  const [state, formAction, isPending] = useActionState(submitCheckDeposit, null)
  const [checkImage, setCheckImage] = useState<CheckImage | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleImageUpload = (file: File) => {
    // Validation du fichier
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]

    if (!allowedTypes.includes(file.type)) {
      alert("Format non supporté. Utilisez JPG, PNG ou WebP.")
      return
    }

    if (file.size > maxSize) {
      alert("Fichier trop volumineux. Maximum 5MB.")
      return
    }

    const preview = URL.createObjectURL(file)
    const id = Math.random().toString(36).substr(2, 9)

    setCheckImage({ file, preview, id })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleImageUpload(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleImageUpload(files[0])
    }
  }

  const removeImage = () => {
    if (checkImage) {
      URL.revokeObjectURL(checkImage.preview)
      setCheckImage(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6 space-y-2">
        <h1 className="text-3xl font-heading font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Remise de chèque
        </h1>
        <p className="text-sm text-muted-foreground">Déposez vos chèques en toute sécurité avec une photo de qualité</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire principal */}
        <div className="lg:col-span-2">
          <form action={formAction} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Photo du chèque
                </CardTitle>
                <CardDescription>Prenez une photo claire et nette de votre chèque</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!checkImage ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                    }`}
                    onDrop={handleDrop}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragActive(true)
                    }}
                    onDragLeave={() => setDragActive(false)}
                  >
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <Upload className="h-8 w-8 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">Glissez votre image ici</p>
                        <p className="text-sm text-gray-500 mt-1">ou cliquez pour sélectionner un fichier</p>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="check-image"
                        name="checkImage"
                        required
                      />
                      <label htmlFor="check-image">
                        <Button type="button" variant="outline" className="cursor-pointer bg-transparent">
                          <Camera className="h-4 w-4 mr-2" />
                          Choisir une photo
                        </Button>
                      </label>
                      <p className="text-xs text-gray-400">JPG, PNG ou WebP • Maximum 5MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={checkImage.preview || "/placeholder.svg"}
                        alt="Aperçu du chèque"
                        className="w-full h-64 object-contain bg-gray-50 rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-900">{checkImage.file.name}</p>
                          <p className="text-xs text-green-700">{formatFileSize(checkImage.file.size)}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = document.getElementById("check-image") as HTMLInputElement
                            input?.click()
                          }}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Changer
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={removeImage}>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Supprimer
                        </Button>
                      </div>
                    </div>

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="check-image"
                      name="checkImage"
                      required
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informations du chèque</CardTitle>
                <CardDescription>Renseignez les détails de votre chèque</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkNumber">Numéro du chèque *</Label>
                    <Input id="checkNumber" name="checkNumber" placeholder="Ex: 1234567" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Montant (GNF) *</Label>
                    <Input 
                      id="amount" 
                      name="amount" 
                      type="text" 
                      inputMode="numeric"
                      placeholder="Ex: 500000"
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, "")
                        e.target.value = cleaned
                      }}
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payerName">Nom du tireur *</Label>
                  <Input
                    id="payerName"
                    name="payerName"
                    placeholder="Nom de la personne qui a émis le chèque"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankName">Banque émettrice</Label>
                  <Select name="bankName">
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez la banque" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bcrg">BCRG</SelectItem>
                      <SelectItem value="bicigui">BICIGUI</SelectItem>
                      <SelectItem value="sgbg">SGBG</SelectItem>
                      <SelectItem value="uib">UIB</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depositAccount">Compte de dépôt *</Label>
                  <Select name="depositAccount" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisissez le compte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acc_001">Compte Courant - ****1234</SelectItem>
                      <SelectItem value="acc_002">Compte Épargne - ****5678</SelectItem>
                      <SelectItem value="acc_003">Compte Professionnel - ****9012</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optionnel)</Label>
                  <Textarea id="notes" name="notes" placeholder="Informations complémentaires..." rows={3} />
                </div>
              </CardContent>
            </Card>

            {state?.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            {state?.success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{state.message}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline">
                Annuler
              </Button>
              <Button type="submit" disabled={isPending || !checkImage} className="min-w-[120px]">
                {isPending ? "Traitement..." : "Déposer le chèque"}
              </Button>
            </div>
          </form>
        </div>

        {/* Panel d'aide */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                Conseils photo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Éclairage optimal</p>
                    <p className="text-xs text-gray-600">Utilisez un bon éclairage naturel</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Chèque entier visible</p>
                    <p className="text-xs text-gray-600">Tous les bords doivent être visibles</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Surface plane</p>
                    <p className="text-xs text-gray-600">Posez le chèque sur une surface plate</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Texte lisible</p>
                    <p className="text-xs text-gray-600">Assurez-vous que tout est net</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium text-red-600">À éviter :</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Photos floues ou sombres</li>
                  <li>• Reflets ou ombres</li>
                  <li>• Chèque plié ou abîmé</li>
                  <li>• Doigts sur l'objectif</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Formats acceptés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">JPG/JPEG</span>
                  <Badge variant="secondary">✓</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">PNG</span>
                  <Badge variant="secondary">✓</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">WebP</span>
                  <Badge variant="secondary">✓</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm">Taille max</span>
                  <Badge>5 MB</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Sécurité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs text-gray-600">
                <p>🔒 Vos images sont chiffrées</p>
                <p>🗑️ Suppression automatique après traitement</p>
                <p>✅ Conformité RGPD</p>
                <p>🛡️ Stockage sécurisé temporaire</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
