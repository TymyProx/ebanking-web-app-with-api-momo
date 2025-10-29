"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react"
import { verifyEmail } from "./actions"

function VerifyEmailContent() {
  const [status, setStatus] = useState<"pending" | "verifying" | "success" | "error">("pending")
  const [message, setMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  useEffect(() => {
    if (token) {
      handleVerification(token)
    }
  }, [token])

  const handleVerification = async (verificationToken: string) => {
    setStatus("verifying")
    const result = await verifyEmail(verificationToken)

    if (result.success) {
      setStatus("success")
      setMessage(result.message)
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push("/dashboard")
      }, 3000)
    } else {
      setStatus("error")
      setMessage(result.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <Image src="/images/logo-bng.png" alt="BNG Logo" width={150} height={50} className="object-contain" />
          </div>

          {/* Status Content */}
          <div className="text-center space-y-4">
            {status === "pending" && (
              <>
                <div className="flex justify-center">
                  <Mail className="h-16 w-16 text-[hsl(123,38%,57%)]" />
                </div>
                <h1 className="text-2xl font-bold text-[hsl(220,13%,13%)]">Vérifiez votre email</h1>
                <p className="text-[hsl(220,13%,46%)]">
                  Un email de vérification a été envoyé à <strong>{email}</strong>
                </p>
                <p className="text-sm text-[hsl(220,13%,46%)]">
                  Veuillez cliquer sur le lien dans l'email pour activer votre compte.
                </p>
              </>
            )}

            {status === "verifying" && (
              <>
                <div className="flex justify-center">
                  <Loader2 className="h-16 w-16 text-[hsl(123,38%,57%)] animate-spin" />
                </div>
                <h1 className="text-2xl font-bold text-[hsl(220,13%,13%)]">Vérification en cours...</h1>
                <p className="text-[hsl(220,13%,46%)]">Veuillez patienter pendant que nous vérifions votre email.</p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold text-[hsl(220,13%,13%)]">Email vérifié !</h1>
                <p className="text-[hsl(220,13%,46%)]">{message}</p>
                <p className="text-sm text-[hsl(220,13%,46%)]">Redirection vers votre tableau de bord...</p>
              </>
            )}

            {status === "error" && (
              <>
                <div className="flex justify-center">
                  <XCircle className="h-16 w-16 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-[hsl(220,13%,13%)]">Erreur de vérification</h1>
                <p className="text-[hsl(220,13%,46%)]">{message}</p>
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full bg-[hsl(123,38%,57%)] hover:bg-[hsl(123,38%,47%)] text-white"
                >
                  Retour à la connexion
                </Button>
              </>
            )}
          </div>

          {/* Footer */}
          {status === "pending" && (
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-[hsl(220,13%,46%)]">
                Vous n'avez pas reçu l'email ?{" "}
                <button className="text-[hsl(123,38%,57%)] hover:underline font-semibold">Renvoyer</button>
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm font-semibold text-[hsl(220,13%,46%)]">BNG BANK INTERNATIONAL 2025 ©</p>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(123,38%,57%)]" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
