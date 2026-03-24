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

export interface OtpVerificationPayload {
  otpId?: string | null
  referenceId?: string
}

export interface OtpModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerified: (payload: OtpVerificationPayload) => void
  onCancel?: () => void
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
  onCancel,
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
  const [isCancelled, setIsCancelled] = React.useState(false)
  const [otpId, setOtpId] = React.useState<string | null>(null)
  const [expiresAt, setExpiresAt] = React.useState<Date | null>(null)
  const [timeRemaining, setTimeRemaining] = React.useState<number | null>(null)
  const [canResend, setCanResend] = React.useState(false)
  const [attemptCount, setAttemptCount] = React.useState(0)
  const [cancelCountdown, setCancelCountdown] = React.useState<number | null>(null)
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
      'otp.invalid': 'Code incorrect.',
      'otp.expired': 'Ce code a expiré. Un nouveau code va être envoyé.',
      'otp.blocked': 'Code bloqué après 3 tentatives échouées. L\'opération est annulée.',
      'otp.maxAttemptsReached': '3 tentatives échouées. L\'opération est annulée par sécurité.',
      'otp.alreadyVerified': 'Ce code a déjà été utilisé.',
      'otp.notFound': 'Code introuvable. Demandez un nouveau code.',
      'Forbidden': 'Session expirée. Veuillez vous reconnecter.',
      'An error occurred': 'Code incorrect.',
    }

    for (const [key, message] of Object.entries(errorMap)) {
      if (errorMsg.includes(key) || errorMsg === key) {
        return message
      }
    }

    return 'Code invalide. Vérifiez le code reçu par email.'
  }

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) {
      setError("Veuillez entrer le code complet à 6 chiffres")
      return
    }

    // Prevent multiple calls or attempts after max reached
    if (isVerifying || success || attemptCount >= maxAttempts) {
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
          onVerified({ otpId, referenceId })
          handleClose()
        }, 1000)
      }
    } catch (err: any) {
      const errorMsg = err.message || ""
      const errorData = err.response?.data || {}
      
      // Debug logs
      console.log('🔍 [OTP Error Debug]', {
        errorMsg,
        errorData,
        attempts: errorData.attempts,
        maxAttempts,
      })
      
      // Update attempt count from backend if available (but cap at maxAttempts)
      let currentAttempts = attemptCount
      if (errorData.attempts !== undefined) {
        currentAttempts = Math.min(errorData.attempts, maxAttempts)
        setAttemptCount(currentAttempts)
      } else {
        currentAttempts = Math.min(attemptCount + 1, maxAttempts)
        setAttemptCount(currentAttempts)
      }
      
      // Check if max attempts reached AFTER updating counter
      const hasReachedMax = currentAttempts >= maxAttempts ||
                            errorMsg.includes('maxAttempts') || 
                            errorMsg.includes('blocked') ||
                            errorData.message?.includes('maxAttempts') ||
                            errorData.message?.includes('blocked')
      
      console.log('🔍 [OTP Check]', { currentAttempts, hasReachedMax })
      
      // Get friendly message
      let friendlyMessage = getErrorMessage(errorMsg)
      
      // Add attempt counter for invalid codes using backend data
      if (errorMsg.includes('invalid') && !hasReachedMax) {
        const remaining = errorData.remainingAttempts !== undefined 
          ? errorData.remainingAttempts 
          : maxAttempts - (errorData.attempts || attemptCount + 1)
          
        if (remaining > 0) {
          friendlyMessage += ` (${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''})`
        }
      }
      
      setError(friendlyMessage)
      
      // ✅ Vider les champs OTP après CHAQUE erreur
      setOtpValue("")

      if (hasReachedMax) {
        // Max attempts reached - show cancellation state
        console.log('🚫 [OTP] Max attempts reached - showing cancellation message')
        setIsCancelled(true)
        setError('') // Clear error to show only cancellation message
        setCancelCountdown(3) // Start countdown
        
        // Countdown timer
        let secondsLeft = 3
        const countdownInterval = setInterval(() => {
          secondsLeft--
          setCancelCountdown(secondsLeft)
          if (secondsLeft <= 0) {
            clearInterval(countdownInterval)
          }
        }, 1000)
        
        // Cancel the operation after showing feedback
        setTimeout(() => {
          console.log('🚫 [OTP] Closing modal and calling onCancel')
          if (onCancel) {
            onCancel()
          }
          handleClose()
        }, 3000) // 3 seconds to read the message
        return
      }

      // Auto-resend for expired codes only
      if (errorMsg.includes('expired')) {
        setTimeout(() => {
          handleResendOtp()
        }, 2000)
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
    setIsCancelled(false)
    setCancelCountdown(null)
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

  const isExpiryError = (error || "").toLowerCase().includes("expir")
  const isSuccessInfo = (error || "").toLowerCase().includes("déjà été utilisé")

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md border-2 border-border/50 shadow-xl">
        <div className="rounded-lg bg-gradient-to-b from-primary/5 to-transparent -m-6 mb-0 px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-lg font-semibold">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {getDeliveryIcon()}
              </div>
              {title}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-1">
              {description} Le code a été envoyé {getDeliveryText()}.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col items-center gap-4 py-4">
          {isGenerating ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Envoi du code en cours...</span>
            </div>
          ) : (
            <>
              {!otpId && (
                <div className="text-center text-sm text-muted-foreground py-4">
                  Cliquez sur "Envoyer le code" pour recevoir votre OTP
                </div>
              )}
              
              {otpId && (
                <>
                  <div className="text-center text-sm text-muted-foreground mb-2">
                    Entrez le code à 6 chiffres reçu :
                  </div>
                  <OtpInput
                    length={6}
                    value={otpValue}
                    onChange={setOtpValue}
                    disabled={isVerifying || success || isCancelled}
                    autoFocus={true}
                    onComplete={handleVerifyOtp}
                  />
                  
                  <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                    {timeRemaining !== null && timeRemaining > 0 && (
                      <div>
                        Expire dans : <span className="font-semibold">{formatTime(timeRemaining)}</span>
                      </div>
                    )}
                    <div>
                      Tentatives : <span className="font-semibold">{attemptCount}/{maxAttempts}</span>
                    </div>
                  </div>
                </>
              )}

              {error && (
                <Alert 
                  variant={isExpiryError || isSuccessInfo ? 'default' : 'destructive'}
                  className={`w-full ${
                    isExpiryError ? 'bg-amber-50/80 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800' :
                    isSuccessInfo ? 'bg-blue-50/80 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800' :
                    ''
                  }`}
                >
                  <AlertDescription className="text-sm leading-relaxed">
                    {error}
                    {isExpiryError && (
                      <div className="mt-2 text-xs opacity-80">
                        Vérifiez l'heure de réception du code dans votre messagerie.
                      </div>
                    )}
                    {error.toLowerCase().includes('incorrect') && !error.includes('tentatives') && (
                      <div className="mt-2 text-xs opacity-80">
                        Assurez-vous de recopier correctement les 6 chiffres.
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {success && otpValue.length === 6 && (
                <Alert className="w-full border-primary/30 bg-primary/5">
                  <AlertDescription className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Code vérifié avec succès
                  </AlertDescription>
                </Alert>
              )}

              {isCancelled && (
                <Alert variant="destructive" className="w-full">
                  <AlertDescription className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">Opération annulée</div>
                      {cancelCountdown !== null && cancelCountdown > 0 && (
                        <div className="text-xs bg-destructive/20 px-2 py-1 rounded">
                          Fermeture dans {cancelCountdown}s
                        </div>
                      )}
                    </div>
                    <div className="text-sm">
                      Nombre maximum de tentatives atteint.
                      L'opération a été annulée par mesure de sécurité.
                    </div>
                    <div className="text-xs opacity-90 pt-2 border-t border-destructive/20">
                      Vous pouvez réessayer en créant une nouvelle opération.
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2 border-t pt-4">
          <Button
            onClick={handleVerifyOtp}
            disabled={otpValue.length !== 6 || isVerifying || success || isGenerating || isCancelled}
            className="w-full"
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Vérification...
              </>
            ) : (
              "Vérifier le code"
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleResendOtp}
            disabled={!canResend || isGenerating || isVerifying || isCancelled}
            className="w-full"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            {canResend ? "Renvoyer le code" : "Renvoyer (disponible dans 30s)"}
          </Button>

          {!isCancelled && (
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={isVerifying}
              className="w-full"
            >
              Annuler
            </Button>
          )}
          
          {isCancelled && (
            <Button
              variant="ghost"
              onClick={handleClose}
              className="w-full"
            >
              Fermer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
