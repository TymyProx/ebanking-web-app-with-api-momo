"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Bell,
  Settings,
  Check,
  Mail,
  Smartphone,
  Monitor,
  Loader2,
  CheckCheck,
} from "lucide-react"
import { useNotifications } from "@/contexts/notification-context"

const TYPE_CONFIG: Record<string, { color: string; label: string; badge: string }> = {
  client_update:  { color: "bg-blue-500",   label: "CLIENT",      badge: "default" },
  account_update: { color: "bg-orange-500", label: "COMPTE",      badge: "secondary" },
  transaction:    { color: "bg-emerald-500", label: "TRANSACTION", badge: "default" },
  transfer:       { color: "bg-purple-500",  label: "VIREMENT",    badge: "destructive" },
  beneficiary:    { color: "bg-cyan-500",    label: "BÉNÉFICIAIRE", badge: "secondary" },
  reclamation_status: { color: "bg-amber-500", label: "RÉCLAMATION", badge: "secondary" },
  commande_status: { color: "bg-indigo-500", label: "COMMANDE", badge: "secondary" },
}

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications()
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [settings, setSettings] = useState({
    email: true,
    sms: true,
    push: true,
    debitNotifications: true,
    creditNotifications: true,
    minAmount: 1000,
  })

  const filteredNotifications = activeFilter === "all"
    ? notifications
    : activeFilter === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications.filter((n) => n.type === activeFilter)

  const formatAmount = (amount?: number) => {
    if (!amount) return ""
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

  const handleSettingsUpdate = (newSettings: typeof settings) => {
    setSettings(newSettings)
  }

  return (
    <div className="mt-6 space-y-6" lang="fr">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-primary">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Suivez les modifications de vos comptes, transactions et informations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">{unreadCount} non lue{unreadCount > 1 ? "s" : ""}</Badge>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
              <CheckCheck className="h-4 w-4 mr-1" />
              Tout marquer lu
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Paramètres</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: "all", label: "Toutes" },
              { key: "unread", label: "Non lues" },
              { key: "client_update", label: "Client" },
              { key: "account_update", label: "Compte" },
              { key: "transaction", label: "Transactions" },
              { key: "transfer", label: "Virements" },
              { key: "beneficiary", label: "Bénéficiaires" },
              { key: "reclamation_status", label: "Réclamations" },
              { key: "commande_status", label: "Commandes" },
            ].map((f) => (
              <Button
                key={f.key}
                variant={activeFilter === f.key ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>Aucune notification pour le moment.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => {
                const cfg = TYPE_CONFIG[notification.type] || { color: "bg-gray-500", label: "AUTRE", badge: "secondary" }

                return (
                  <Card
                    key={notification.id}
                    className={`transition-colors ${!notification.read ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30" : ""}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start space-x-3 min-w-0">
                          <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${cfg.color}`} />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <CardTitle className="text-base">{notification.title}</CardTitle>
                              <Badge variant={cfg.badge as any} className="text-[10px]">
                                {cfg.label}
                              </Badge>
                              {!notification.read && (
                                <Badge variant="secondary" className="text-[10px]">NOUVEAU</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {notification.amount != null && notification.amount !== 0 && (
                            <div className={`text-lg font-bold ${notification.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {formatAmount(notification.amount)} GNF
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">{formatDate(notification.date)}</p>
                        </div>
                      </div>
                    </CardHeader>
                    {!notification.read && (
                      <CardContent className="pt-0">
                        <div className="flex justify-end">
                          <Button
                            onClick={() => markAsRead(notification.id)}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Marquer comme lu
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Canaux de notification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
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
                  <Smartphone className="h-4 w-4" />
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
                  <Monitor className="h-4 w-4" />
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

          <Card>
            <CardHeader>
              <CardTitle>Seuils de notification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="min-amount">Montant minimum pour déclencher une notification (GNF)</Label>
                <Input
                  id="min-amount"
                  type="text"
                  inputMode="numeric"
                  value={settings.minAmount}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, "")
                    handleSettingsUpdate({ ...settings, minAmount: Number.parseInt(cleaned) || 0 })
                  }}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Les transactions inférieures à ce montant ne déclencheront pas de notification
                </p>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <Bell className="h-4 w-4" />
            <AlertDescription>
              Les paramètres de notification sont appliqués immédiatement. Vous recevrez des notifications
              selon vos préférences pour toutes les futures transactions.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  )
}
