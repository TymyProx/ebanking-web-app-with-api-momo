"use client"

import { useState } from "react"
import { Bell, CheckCheck, Loader2, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNotifications } from "@/contexts/notification-context"
import { useRouter } from "next/navigation"

const DOT_COLOR: Record<string, string> = {
  client_update:      "bg-blue-500",
  account_update:     "bg-orange-500",
  transaction:        "bg-emerald-500",
  transfer:           "bg-purple-500",
  beneficiary:        "bg-cyan-500",
  reclamation_status: "bg-amber-500",
  commande_status:    "bg-indigo-500",
}

export function NotificationDropdown() {
  const { unreadCount, getRecentNotifications, markAsRead, markAllAsRead, loading } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const recentNotifications = getRecentNotifications(5)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMin = Math.floor((now.getTime() - date.getTime()) / 60_000)
    if (diffMin < 1) return "À l'instant"
    if (diffMin < 60) return `${diffMin}min`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `${diffH}h`
    const diffD = Math.floor(diffH / 24)
    if (diffD < 7) return `${diffD}j`
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
  }

  const formatAmount = (amount?: number) => {
    if (!amount) return ""
    const formatted = new Intl.NumberFormat("fr-FR").format(Math.abs(amount))
    return amount >= 0 ? `+${formatted}` : `-${formatted}`
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative rounded-full">
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground ring-2 ring-background">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-[360px] rounded-xl border shadow-xl p-0 overflow-hidden"
        align="end"
        sideOffset={8}
        forceMount
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold tracking-tight">Notifications</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium rounded-full">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Tout lire
            </button>
          )}
        </div>

        {/* Body */}
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 px-4 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Aucune notification pour le moment</p>
              <p className="text-xs text-muted-foreground/80 leading-relaxed">
                Les mises à jour de votre demande d&apos;ouverture de compte et le changement de statut apparaîtront ici.
              </p>
            </div>
          ) : (
            recentNotifications.map((notification, idx) => {
              const dotColor = DOT_COLOR[notification.type] || "bg-gray-400"

              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={`
                    px-5 py-3.5 cursor-pointer rounded-none focus:bg-accent/50
                    transition-colors duration-150
                    ${!notification.read ? "bg-primary/[0.03] dark:bg-primary/[0.06]" : ""}
                    ${idx < recentNotifications.length - 1 ? "border-b border-border/50" : ""}
                  `}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3 w-full">
                    {/* Dot indicator */}
                    <div className="pt-1.5 flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full ${dotColor} ${!notification.read ? "ring-[3px] ring-offset-1 ring-offset-background" : "opacity-50"}`}
                        style={!notification.read ? { boxShadow: `0 0 6px 1px var(--tw-ring-color, currentColor)` } : {}}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-[13px] leading-tight truncate ${!notification.read ? "font-semibold text-foreground" : "font-medium text-muted-foreground"}`}>
                          {notification.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground/70 whitespace-nowrap flex-shrink-0">
                          {formatDate(notification.date)}
                        </span>
                      </div>

                      <p className="text-[12px] leading-relaxed text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>

                      {notification.amount != null && notification.amount !== 0 && (
                        <p className={`text-[12px] font-semibold tabular-nums ${notification.amount >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                          {formatAmount(notification.amount)} GNF
                        </p>
                      )}
                    </div>

                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="pt-1.5 flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      </div>
                    )}
                  </div>
                </DropdownMenuItem>
              )
            })
          )}
        </div>

        {/* Footer */}
        {recentNotifications.length > 0 && (
          <div className="border-t bg-muted/30">
            <button
              onClick={() => { setIsOpen(false); router.push("/notifications") }}
              className="flex items-center justify-center gap-1.5 w-full py-3 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Voir toutes les notifications
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
