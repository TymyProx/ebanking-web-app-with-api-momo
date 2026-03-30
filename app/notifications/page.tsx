"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useNotifications } from "@/contexts/notification-context"

const TYPE_CONFIG: Record<string, { color: string; label: string; badge: string }> = {
  client_update: { color: "bg-blue-500", label: "CLIENT", badge: "default" },
  account_update: { color: "bg-orange-500", label: "COMPTE", badge: "secondary" },
  transaction: { color: "bg-emerald-500", label: "TRANSACTION", badge: "default" },
  transfer: { color: "bg-purple-500", label: "VIREMENT", badge: "destructive" },
  beneficiary: { color: "bg-cyan-500", label: "BÉNÉFICIAIRE", badge: "secondary" },
  reclamation_status: { color: "bg-amber-500", label: "RÉCLAMATION", badge: "secondary" },
  commande_status: { color: "bg-indigo-500", label: "COMMANDE", badge: "secondary" },
}

const PAGE_SIZE = 8

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications()
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [settings, setSettings] = useState({
    email: true,
    sms: true,
    push: true,
    debitNotifications: true,
    creditNotifications: true,
    minAmount: 1000,
  })

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "all") return notifications
    if (activeFilter === "unread") return notifications.filter((n) => !n.read)
    return notifications.filter((n) => n.type === activeFilter)
  }, [notifications, activeFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeFilter])

  const totalFiltered = filteredNotifications.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))

  useEffect(() => {
    setCurrentPage((p) => Math.min(p, totalPages))
  }, [totalPages, totalFiltered])

  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredNotifications.slice(start, start + PAGE_SIZE)
  }, [filteredNotifications, currentPage])

  const rangeStart = totalFiltered === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalFiltered)

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
    <div className="mt-6 space-y-8" lang="fr">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-primary">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Demandes d&apos;ouverture de compte, statuts, comptes, transactions et informations personnelles
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
          </Badge>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
              <CheckCheck className="h-4 w-4 mr-1" />
              Tout marquer lu
            </Button>
          )}
        </div>
      </div>

      <section className="space-y-4" aria-labelledby="notifications-list-heading">
        <h2 id="notifications-list-heading" className="sr-only">
          Liste des notifications
        </h2>
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
              <p className="text-xs mt-2 max-w-md mx-auto">
                Après une demande d&apos;ouverture de compte, vous verrez ici la prise en compte et chaque changement de statut
                (validation, refus, etc.).
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {paginatedNotifications.map((notification) => {
              const cfg = TYPE_CONFIG[notification.type] || {
                color: "bg-gray-500",
                label: "AUTRE",
                badge: "secondary",
              }

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
                            <Badge variant={cfg.badge as "default" | "secondary" | "destructive"} className="text-[10px]">
                              {cfg.label}
                            </Badge>
                            {!notification.read && (
                              <Badge variant="secondary" className="text-[10px]">
                                NOUVEAU
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {notification.amount != null && notification.amount !== 0 && (
                          <div
                            className={`text-lg font-bold ${notification.amount >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
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

            {totalFiltered > PAGE_SIZE && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-border/60">
                <p className="text-sm text-muted-foreground">
                  Affichage{" "}
                  <span className="font-medium text-foreground">
                    {rangeStart}–{rangeEnd}
                  </span>{" "}
                  sur <span className="font-medium text-foreground">{totalFiltered}</span>
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    aria-label="Page précédente"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                  <span className="text-sm text-muted-foreground tabular-nums px-1 min-w-[5.5rem] text-center">
                    Page {currentPage} / {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Page suivante"
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {totalFiltered > 0 && totalFiltered <= PAGE_SIZE && (
              <p className="text-sm text-muted-foreground pt-1">
                {totalFiltered} notification{totalFiltered > 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}
      </section>

      {/* <section className="space-y-4 border-t pt-8" aria-labelledby="notifications-settings-heading">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" aria-hidden />
          <h2 id="notifications-settings-heading" className="text-lg font-semibold text-foreground">
            Paramètres
          </h2>
        </div>

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
            Les paramètres de notification sont appliqués immédiatement. Vous recevrez des notifications selon vos préférences
            pour toutes les futures transactions.
          </AlertDescription>
        </Alert>
      </section> */}
    </div>
  )
}
