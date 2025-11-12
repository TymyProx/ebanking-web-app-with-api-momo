"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { OtpInput } from "@/components/ui/otp-input"
import { OtpService, type OtpGenerateOptions } from "@/lib/otp-service"
import { Loader2, Mail, MessageSquare, RefreshCw, ShieldCheck } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export interface OtpModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerified: () => void
  purpose: string
  referenceId?: string
  title?: string
  description?: string
  deliveryMethod?: 'SMS' | 'EMAIL' | 'BOTH'
  autoGenerate?: boolean
}

export function OtpModal({
  open,
  onOpenChange,
  onVerified,
  purpose,
  referenceId,
  title = "Vérification OTP",
  description = "Veuillez entrer le code de vérification que nous vous avons envoyé.",
  deliveryMethod = 'EMAIL',
  autoGenerate = true,
}: OtpModalProps) {
  const [otpValue, setOtpValue] = React.useState("")
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [isVerifying, setIsVerifying] = React.useState(false)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState(false)
  const [otpId, setOtpId] = React.useState<string | null>(null)
  const [expiresAt, setExpiresAt] = React.useState<Date | null>(null)
  const [timeRemaining, setTimeRemaining] = React.useState<number | null>(null)
  const [canResend, setCanResend] = React.useState(false)
  const [attemptCount, setAttemptCount] = React.useState(0)
  const maxAttempts = 3

  // Generate OTP when modal opens
  React.useEffect(() => {
    if (open && autoGenerate && !otpId) {
      handleGenerateOtp()
    }
  }, [open, autoGenerate, otpId])

  // Countdown timer
  React.useEffect(() => {
    if (!expiresAt) return

    const interval = setInterval(() => {
      const now = new Date()
      const expires = new Date(expiresAt)
      const diff = Math.max(0, Math.floor((expires.getTime() - now.getTime()) / 1000))
      
      setTimeRemaining(diff)
      
      if (diff === 0) {
        setError("Le code OTP a expiré. Veuillez en demander un nouveau.")
        setCanResend(true)
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt])

  // Enable resend after 30 seconds
  React.useEffect(() => {
    if (!expiresAt) return

    const timer = setTimeout(() => {
      setCanResend(true)
    }, 30000) // 30 seconds

    return () => clearTimeout(timer)
  }, [expiresAt])

  const handleGenerateOtp = async () => {
    setIsGenerating(true)
    setError("")
    setSuccess(false)

    try {
      const result = await OtpService.generate({
        purpose,
        referenceId,
        deliveryMethod,
        expiresInMinutes: 5,
      })

      setOtpId(result.otpId)
      setExpiresAt(new Date(result.expiresAt))
      // Don't set success here - only after verification
    } catch (err: any) {
      setError(err.message || "Erreur lors de la génération du code OTP")
    } finally {
      setIsGenerating(false)
    }
  }

  // Map backend error messages to user-friendly French messages
  const getErrorMessage = (errorMsg: string): string => {
    const errorMap: Record<string, string> = {
      'otp.invalid': '❌ Code incorrect. Veuillez vérifier et réessayer.',
      'otp.expired': '⏰ Ce code a expiré. Demandez-en un nouveau.',
      'otp.blocked': '🔒 Trop de tentatives échouées. Demandez un nouveau code.',
      'otp.maxAttemptsReached': '🔒 Nombre maximum de tentatives atteint. Un nouveau code a été demandé.',
      'otp.alreadyVerified': '✓ Ce code a déjà été utilisé.',
      'otp.notFound': '🔍 Code introuvable. Demandez un nouveau code.',
      'Forbidden': '🔐 Session expirée. Veuillez vous reconnecter.',
      'An error occurred': '❌ Code incorrect. Veuillez vérifier et réessayer.',
    }

    // Check for exact match
    for (const [key, message] of Object.entries(errorMap)) {
      if (errorMsg.includes(key) || errorMsg === key) {
        return message
      }
    }

    // Default message with more context
    return `❌ Code invalide. Vérifiez le code reçu par email.`
  }

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) {
      setError("⚠️ Veuillez entrer le code complet à 6 chiffres")
      return
    }

    // Prevent multiple calls
    if (isVerifying || success) {
      return
    }

    setIsVerifying(true)
    setError("")

    try {
      const result = await OtpService.verify({
        code: otpValue,
        purpose,
        referenceId,
      })

      if (result.verified) {
        setSuccess(true)
        // Wait a bit to show success state
        setTimeout(() => {
          onVerified()
          handleClose()
        }, 1000)
      }
    } catch (err: any) {
      const errorMsg = err.message || ""
      setAttemptCount(prev => prev + 1)
      
      // Get friendly message
      let friendlyMessage = getErrorMessage(errorMsg)
      
      // Add attempt counter for invalid codes
      if (errorMsg.includes('invalid') && attemptCount < maxAttempts - 1) {
        const remaining = maxAttempts - attemptCount - 1
        friendlyMessage += ` (${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''})`
      }
      
      setError(friendlyMessage)
      
      // Clear input for certain errors
      if (errorMsg.includes('invalid') || errorMsg.includes('blocked') || errorMsg.includes('maxAttempts')) {
        setOtpValue("")
      }

      // Auto-resend for expired or blocked codes
      if (errorMsg.includes('expired') || errorMsg.includes('blocked') || errorMsg.includes('maxAttempts')) {
        setTimeout(() => {
          if (errorMsg.includes('maxAttempts') || errorMsg.includes('blocked')) {
            // Auto-resend after showing error
            setTimeout(() => {
              handleResendOtp()
            }, 2000)
          }
        }, 100)
      }
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendOtp = async () => {
    setOtpValue("")
    setError("")
    setCanResend(false)
    setAttemptCount(0) // Reset attempt counter on resend
    await handleGenerateOtp()
  }

  const handleClose = () => {
    setOtpValue("")
    setError("")
    setSuccess(false)
    setOtpId(null)
    setExpiresAt(null)
    setTimeRemaining(null)
    setCanResend(false)
    setAttemptCount(0)
    onOpenChange(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getDeliveryIcon = () => {
    if (deliveryMethod === 'EMAIL') return <Mail className="w-4 h-4" />
    if (deliveryMethod === 'SMS') return <MessageSquare className="w-4 h-4" />
    return <ShieldCheck className="w-4 h-4" />
  }

  const getDeliveryText = () => {
    if (deliveryMethod === 'EMAIL') return "par email"
    if (deliveryMethod === 'SMS') return "par SMS"
    return "par SMS et email"
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getDeliveryIcon()}
            {title}
          </DialogTitle>
          <DialogDescription>
            {description} Le code a été envoyé {getDeliveryText()}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {isGenerating ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Envoi du code en cours...</span>
            </div>
          ) : (
            <>
              {!otpId && (
                <div className="text-center text-sm text-muted-foreground">
                  Cliquez sur "Envoyer le code" pour recevoir votre OTP
                </div>
              )}
              
              {otpId && (
                <>
                  <div className="text-center text-sm text-green-600 mb-2">
                    ✓ Code envoyé ! Entrez-le ci-dessous :
                  </div>
                  <OtpInput
                    length={6}
                    value={otpValue}
                    onChange={setOtpValue}
                    disabled={isVerifying || success}
                    autoFocus={true}
                    onComplete={handleVerifyOtp}
                  />
                  
                  {timeRemaining !== null && timeRemaining > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Code valide pendant: <span className="font-semibold">{formatTime(timeRemaining)}</span>
                    </div>
                  )}
                </>
              )}

              {error && (
                <Alert 
                  variant={
                    error.includes('⏰') || error.includes('🔍') ? 'default' :
                    error.includes('✓') ? 'default' :
                    'destructive'
                  } 
                  className={`w-full ${
                    error.includes('⏰') || error.includes('🔍') ? 'bg-amber-50 border-amber-200 text-amber-800' :
                    error.includes('✓') ? 'bg-blue-50 border-blue-200 text-blue-800' :
                    ''
                  }`}
                >
                  <AlertDescription className="text-sm leading-relaxed">
                    {error}
                    {error.includes('⏰') && (
                      <div className="mt-2 text-xs opacity-80">
                        💡 Conseil : Vérifiez l'heure de réception du code dans votre email.
                      </div>
                    )}
                    {error.includes('❌') && !error.includes('tentatives') && (
                      <div className="mt-2 text-xs opacity-80">
                        💡 Conseil : Assurez-vous de bien recopier les 6 chiffres.
                      </div>
                    )}
                    {error.includes('🔒') && (
                      <div className="mt-2 text-xs opacity-80">
                        ℹ️ Un nouveau code est en cours d'envoi...
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {success && otpValue.length === 6 && (
                <Alert className="w-full border-green-500 bg-green-50 text-green-800">
                  <AlertDescription className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Code vérifié avec succès !
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            onClick={handleVerifyOtp}
            disabled={otpValue.length !== 6 || isVerifying || success || isGenerating}
            className="w-full"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Vérification...
              </>
            ) : (
              "Vérifier le code"
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleResendOtp}
            disabled={!canResend || isGenerating || isVerifying}
            className="w-full"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            {canResend ? "Renvoyer le code" : "Renvoyer (disponible dans 30s)"}
          </Button>

          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isVerifying}
            className="w-full"
          >
            Annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

