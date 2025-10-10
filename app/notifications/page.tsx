"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { updateNotificationSettings, markAsRead, exportNotifications } from "./actions"

// Icônes SVG inline
const BellIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-12" />
  </svg>
)

const SettingsIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const DownloadIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
)

const CheckIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const MailIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
)

const SmartphoneIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
    />
  </svg>
)

const MonitorIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
)

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [settings, setSettings] = useState({
    email: true,
    sms: true,
    push: true,
    debitNotifications: true,
    creditNotifications: true,
    minAmount: 1000,
  })
  const [unreadCount, setUnreadCount] = useState(0)

  // Données simulées des notifications
  useEffect(() => {
    const mockNotifications = [
      {
        id: 1,
        type: "debit",
        title: "Débit automatique",
        message:
          "Vous avez été débité de 25,000 GNF le 22/07/2025 pour un paiement à ORANGE CI. Solde actuel : 125,000 GNF.",
        amount: -25000,
        date: "2024-01-15T10:30:00Z",
        read: false,
        channels: ["email", "sms", "push"],
        account: "0001-234567-89",
        recipient: "ORANGE CI",
      },
      {
        id: 2,
        type: "credit",
        title: "Crédit reçu",
        message:
          "Vous avez reçu un crédit de 50,000 GNF le 22/07/2025 de la part de SOTRAGUI. Solde actuel : 180,000 GNF.",
        amount: 50000,
        date: "2024-01-14T14:15:00Z",
        read: false,
        channels: ["email", "push"],
        account: "0001-234567-89",
        sender: "SOTRAGUI",
      },
      {
        id: 3,
        type: "debit",
        title: "Débit automatique",
        message: "Vous avez été débité de 15,000 GNF le 21/07/2025 pour un paiement à EDG. Solde actuel : 130,000 GNF.",
        amount: -15000,
        date: "2024-01-13T09:45:00Z",
        read: true,
        channels: ["email", "sms"],
        account: "0001-234567-89",
        recipient: "EDG",
      },
      {
        id: 4,
        type: "credit",
        title: "Virement reçu",
        message:
          "Vous avez reçu un crédit de 100,000 GNF le 20/07/2025 de la part de Aissatou Bah. Solde actuel : 145,000 GNF.",
        amount: 100000,
        date: "2024-01-12T16:20:00Z",
        read: true,
        channels: ["email", "push"],
        account: "0001-234567-89",
        sender: "Aissatou Bah",
      },
      {
        id: 5,
        type: "debit",
        title: "Paiement facture",
        message: "Vous avez été débité de 35,000 GNF le 19/07/2025 pour un paiement à MTN. Solde actuel : 45,000 GNF.",
        amount: -35000,
        date: "2024-01-11T11:10:00Z",
        read: true,
        channels: ["sms", "push"],
        account: "0001-234567-89",
        recipient: "MTN",
      },
    ]

    setNotifications(mockNotifications)
    setUnreadCount(mockNotifications.filter((n) => !n.read).length)
  }, [])

  const formatAmount = (amount: number) => {
    const formatted = new Intl.NumberFormat("fr-FR").format(Math.abs(amount))
    return amount >= 0 ? `+${formatted}` : `-${formatted}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email":
        return <MailIcon />
      case "sms":
        return <SmartphoneIcon />
      case "push":
        return <MonitorIcon />
      default:
        return <BellIcon />
    }
  }

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsRead(notificationId)
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Erreur lors du marquage comme lu:", error)
    }
  }

  const handleSettingsUpdate = async (newSettings: typeof settings) => {
    try {
      await updateNotificationSettings(newSettings)
      setSettings(newSettings)
      alert("Paramètres mis à jour avec succès")
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error)
      alert("Erreur lors de la mise à jour des paramètres")
    }
  }

  const handleExport = async (format: string) => {
    try {
      await exportNotifications(format)
      alert(`Export ${format.toUpperCase()} en cours de téléchargement...`)
    } catch (error) {
      console.error("Erreur lors de l'export:", error)
      alert("Erreur lors de l'export")
    }
  }

  return (
    <div className="space-y-8">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 rounded-2xl blur-3xl -z-10" />
        <div className="flex items-center justify-between p-6 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-border/50 shadow-lg">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              Notifications
            </h1>
            <p className="text-muted-foreground mt-1">Gérez vos notifications de débit et crédit automatiques</p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {unreadCount} non lues
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <BellIcon />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <SettingsIcon />
            <span>Paramètres</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-2 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Historique des notifications</h3>
                <div className="flex space-x-2">
                  <Button onClick={() => handleExport("pdf")} variant="outline" size="sm" className="bg-white/50">
                    <DownloadIcon />
                    <span className="ml-1">PDF</span>
                  </Button>
                  <Button onClick={() => handleExport("csv")} variant="outline" size="sm" className="bg-white/50">
                    <DownloadIcon />
                    <span className="ml-1">CSV</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`border-2 shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  !notification.read ? "border-primary/50 bg-primary/5" : "hover:border-primary/30"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full mt-1 ${
                          notification.type === "credit" ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <CardTitle className="text-base">{notification.title}</CardTitle>
                          <Badge variant={notification.type === "credit" ? "default" : "destructive"}>
                            {notification.type === "credit" ? "CRÉDIT" : "DÉBIT"}
                          </Badge>
                          {!notification.read && (
                            <Badge variant="secondary" className="text-xs">
                              NOUVEAU
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${notification.amount >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatAmount(notification.amount)} GNF
                      </div>
                      <p className="text-xs text-gray-500">{formatDate(notification.date)}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Envoyé via:</span>
                      {notification.channels.map((channel) => (
                        <div key={channel} className="flex items-center space-x-1">
                          {getChannelIcon(channel)}
                          <span className="text-xs capitalize">{channel}</span>
                        </div>
                      ))}
                    </div>
                    {!notification.read && (
                      <Button
                        onClick={() => handleMarkAsRead(notification.id)}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        <CheckIcon />
                        <span className="ml-1">Marquer comme lu</span>
                      </Button>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Compte: {notification.account}
                    {notification.sender && ` • De: ${notification.sender}`}
                    {notification.recipient && ` • Vers: ${notification.recipient}`}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="border-2 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-secondary mr-3">
                  <BellIcon />
                </div>
                Canaux de notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MailIcon />
                  <Label htmlFor="email-notifications">Notifications par email</Label>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.email}
                  onCheckedChange={(checked) => handleSettingsUpdate({ ...settings, email: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <SmartphoneIcon />
                  <Label htmlFor="sms-notifications">Notifications par SMS</Label>
                </div>
                <Switch
                  id="sms-notifications"
                  checked={settings.sms}
                  onCheckedChange={(checked) => handleSettingsUpdate({ ...settings, sms: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MonitorIcon />
                  <Label htmlFor="push-notifications">Notifications push</Label>
                </div>
                <Switch
                  id="push-notifications"
                  checked={settings.push}
                  onCheckedChange={(checked) => handleSettingsUpdate({ ...settings, push: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-secondary mr-3">
                  <BellIcon />
                </div>
                Types de notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative">
              <div className="flex items-center justify-between">
                <Label htmlFor="debit-notifications">Notifications de débit</Label>
                <Switch
                  id="debit-notifications"
                  checked={settings.debitNotifications}
                  onCheckedChange={(checked) => handleSettingsUpdate({ ...settings, debitNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="credit-notifications">Notifications de crédit</Label>
                <Switch
                  id="credit-notifications"
                  checked={settings.creditNotifications}
                  onCheckedChange={(checked) => handleSettingsUpdate({ ...settings, creditNotifications: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-secondary mr-3">
                  <BellIcon />
                </div>
                Seuils de notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative">
              <div>
                <Label htmlFor="min-amount">Montant minimum pour déclencher une notification (GNF)</Label>
                <Input
                  id="min-amount"
                  type="number"
                  value={settings.minAmount}
                  onChange={(e) =>
                    handleSettingsUpdate({ ...settings, minAmount: Number.parseInt(e.target.value) || 0 })
                  }
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Les transactions inférieures à ce montant ne déclencheront pas de notification
                </p>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <BellIcon />
            <AlertDescription>
              Les paramètres de notification sont appliqués immédiatement. Vous recevrez des notifications selon vos
              préférences pour toutes les futures transactions.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  )
}
