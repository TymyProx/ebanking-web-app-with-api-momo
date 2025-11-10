"use client"

import { useState } from "react"
import { Bell, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNotifications } from "@/contexts/notification-context"
import { useRouter } from "next/navigation"

export function NotificationDropdown() {
  const { unreadCount, getRecentNotifications, markAsRead, markAllAsRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const recentNotifications = getRecentNotifications(5)

  const formatAmount = (amount?: number) => {
    if (!amount) return ""
    const formatted = new Intl.NumberFormat("fr-FR").format(Math.abs(amount))
    return amount >= 0 ? `+${formatted}` : `-${formatted}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "À l'instant"
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
  }

  const handleNotificationClick = (notificationId: number) => {
    markAsRead(notificationId)
  }

  const handleViewAll = () => {
    setIsOpen(false)
    router.push("/notifications")
  }

  const handleMarkAllRead = () => {
    markAllAsRead()
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <div className="flex items-center justify-between p-4">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs">
              <CheckCheck className="h-3 w-3 mr-1" />
              Tout marquer lu
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        {recentNotifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Aucune notification</div>
        ) : (
          <>
            {recentNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-4 cursor-pointer ${!notification.read ? "bg-blue-50" : ""}`}
                onClick={() => handleNotificationClick(notification.id)}
              >
                <div className="flex items-start space-x-3 w-full">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      notification.type === "credit"
                        ? "bg-green-500"
                        : notification.type === "debit"
                          ? "bg-red-500"
                          : "bg-blue-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{notification.title}</p>
                      {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{notification.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">{formatDate(notification.date)}</span>
                      {notification.amount && (
                        <span
                          className={`text-xs font-medium ${
                            notification.amount >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {formatAmount(notification.amount)} GNF
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleViewAll} className="p-4 text-center">
              <Button variant="ghost" size="sm" className="w-full">
                Voir toutes les notifications
              </Button>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
