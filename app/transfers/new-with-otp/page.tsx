"use client"

/**
 * EXAMPLE: Transfer Page with OTP Verification
 * 
 * This is a complete example showing how to integrate OTP verification
 * into your transfer submission flow.
 * 
 * Integration Steps:
 * 1. User fills out transfer form
 * 2. User clicks "Submit Transfer"
 * 3. OTP modal opens and generates OTP
 * 4. User enters OTP code
 * 5. Upon successful verification, transfer is executed
 */

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { OtpModal } from "@/components/otp-modal"
import { CheckCircle2, Send, Loader2 } from "lucide-react"
import { executeTransfer } from "../new/actions"

export default function TransferWithOtpExample() {
  // Form states
  const [sourceAccount, setSourceAccount] = useState("")
  const [targetAccount, setTargetAccount] = useState("")
  const [amount, setAmount] = useState("")
  const [purpose, setPurpose] = useState("")

  // OTP states
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpReferenceId, setOtpReferenceId] = useState<string | null>(null)
  const [otpVerified, setOtpVerified] = useState(false)

  // Transfer states
  const [isPending, startTransition] = useTransition()
  const [transferResult, setTransferResult] = useState<any>(null)
  const [error, setError] = useState("")

  /**
   * Step 1: Handle form submission
   * Instead of submitting directly, open OTP modal
   */
  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!sourceAccount || !targetAccount || !amount || !purpose) {
      setError("Veuillez remplir tous les champs")
      return
    }

    if (parseFloat(amount) <= 0) {
      setError("Le montant doit être supérieur à 0")
      return
    }

    setError("")
    
    // Generate a unique reference for this transaction
    const referenceId = `TRANSFER-${Date.now()}`
    setOtpReferenceId(referenceId)
    
    // Open OTP modal
    setShowOtpModal(true)
  }

  /**
   * Step 2: Handle OTP verification success
   * Execute the transfer only after OTP is verified
   */
  const handleOtpVerified = async () => {
    setOtpVerified(true)
    
    // Now execute the transfer
    const formData = new FormData()
    formData.append("sourceAccount", sourceAccount)
    formData.append("transferType", "account-to-account")
    formData.append("targetAccount", targetAccount)
    formData.append("amount", amount)
    formData.append("purpose", purpose)
    formData.append("transferDate", new Date().toISOString().split("T")[0])
    
    startTransition(async () => {
      try {
        const result = await executeTransfer(null, formData)
        
        if (result.success) {
          setTransferResult(result)
          // Reset form
          setSourceAccount("")
          setTargetAccount("")
          setAmount("")
          setPurpose("")
          setOtpVerified(false)
          setOtpReferenceId(null)
        } else {
          setError(result.error || "Erreur lors du virement")
        }
      } catch (err: any) {
        setError(err.message || "Erreur lors du virement")
      }
    })
  }

  /**
   * Reset transfer result to allow new transfer
   */
  const handleNewTransfer = () => {
    setTransferResult(null)
    setError("")
  }

  // Show success message after transfer
  if (transferResult?.success) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card className="border-green-500 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle2 className="w-6 h-6" />
              Virement réussi !
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Référence:</span>
                <span className="font-semibold">{transferResult.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Montant:</span>
                <span className="font-semibold">{transferResult.amount} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Exécuté le:</span>
                <span className="font-semibold">
                  {new Date(transferResult.executedAt).toLocaleString('fr-FR')}
                </span>
              </div>
            </div>
            <Button onClick={handleNewTransfer} className="w-full">
              Faire un nouveau virement
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Nouveau Virement (avec OTP)</CardTitle>
          <CardDescription>
            Exemple d'intégration de la vérification OTP dans un formulaire de virement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitClick} className="space-y-6">
            {/* Source Account */}
            <div className="space-y-2">
              <Label htmlFor="sourceAccount">Compte à débiter *</Label>
              <Input
                id="sourceAccount"
                placeholder="Ex: 12345678901234567890"
                value={sourceAccount}
                onChange={(e) => setSourceAccount(e.target.value)}
                required
                disabled={isPending}
              />
            </div>

            {/* Target Account */}
            <div className="space-y-2">
              <Label htmlFor="targetAccount">Compte bénéficiaire *</Label>
              <Input
                id="targetAccount"
                placeholder="Ex: 09876543210987654321"
                value={targetAccount}
                onChange={(e) => setTargetAccount(e.target.value)}
                required
                disabled={isPending}
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Montant (FCFA) *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Ex: 10000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="1"
                step="0.01"
                disabled={isPending}
              />
            </div>

            {/* Purpose */}
            <div className="space-y-2">
              <Label htmlFor="purpose">Motif du virement *</Label>
              <Input
                id="purpose"
                placeholder="Ex: Paiement facture"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
                disabled={isPending}
              />
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isPending || !sourceAccount || !targetAccount || !amount || !purpose}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Traitement en cours...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Valider le virement
                </>
              )}
            </Button>

            {/* Info Card */}
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-sm text-blue-800">
                <strong>Comment ça marche :</strong>
                <ol className="list-decimal ml-4 mt-2 space-y-1">
                  <li>Remplissez le formulaire de virement</li>
                  <li>Cliquez sur "Valider le virement"</li>
                  <li>Un code OTP sera envoyé par SMS</li>
                  <li>Entrez le code pour confirmer le virement</li>
                  <li>Le virement sera exécuté une fois le code vérifié</li>
                </ol>
              </AlertDescription>
            </Alert>
          </form>
        </CardContent>
      </Card>

      {/* OTP Modal */}
      <OtpModal
        open={showOtpModal}
        onOpenChange={setShowOtpModal}
        onVerified={handleOtpVerified}
        purpose="TRANSFER"
        referenceId={otpReferenceId || undefined}
        title="Confirmer le virement"
        description={`Entrez le code OTP pour confirmer le virement de ${amount} FCFA`}
        deliveryMethod="EMAIL"
        autoGenerate={true}
      />
    </div>
  )
}
