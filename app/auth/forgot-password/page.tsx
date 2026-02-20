"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import AuthService from "@/lib/auth-service"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setIsLoading(true)
    try {
      await AuthService.sendPasswordResetEmail(email.trim().toLowerCase())
      setMessage({
        type: "success",
        text: "Email envoyé. Vérifiez votre boîte de réception pour le lien de réinitialisation.",
      })
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Erreur lors de l'envoi de l'email" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <Link href="/login" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la connexion
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-[#34763E]/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-[#34763E]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mot de passe oublié</h1>
              <p className="text-sm text-gray-600">Recevez un lien sécurisé par email</p>
            </div>
          </div>

          {message && (
            <Alert className={`mb-4 ${message.type === "success" ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}>
              {message.type === "success" ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="exemple@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full bg-[#34763E] hover:bg-[#2a5f32]" disabled={isLoading || !email.trim()}>
              {isLoading ? "Envoi..." : "Envoyer le lien"}
            </Button>
          </form>

          <div className="mt-4 text-xs text-gray-500">
            Si vous ne recevez rien, vérifiez vos spams ou contactez le support.
          </div>
        </div>
      </div>
    </div>
  )
}


