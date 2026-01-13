'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Check, CheckCheck, Trash2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Notification {
  id: string
  type: string
  priority: string
  title: string
  message: string
  link: string | null
  isRead: boolean
  createdAt: string
  metadata: any
}

interface NotificationDropdownProps {
  userId?: string
}

export function NotificationDropdown({ userId }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchNotifications = async () => {
    try {
      const [notificationsRes, countRes] = await Promise.all([
        fetch('/api/notifications?limit=10&filter=all'),
        fetch('/api/notifications/unread-count'),
      ])

      if (notificationsRes.ok) {
        const data = await notificationsRes.json()
        setNotifications(data.notifications || [])
      } else {
        console.error('Bildirimler alınamadı:', notificationsRes.status)
      }

      if (countRes.ok) {
        const countData = await countRes.json()
        setUnreadCount(countData.count || 0)
      } else {
        console.error('Okunmamış sayı alınamadı:', countRes.status)
      }
    } catch (error) {
      console.error('Bildirimler yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    // İlk yüklemede fetch et
    fetchNotifications().catch((error) => {
      console.error('Bildirimler ilk yüklemede hata:', error)
      setLoading(false)
    })

    // Her 30 saniyede bir güncelle
    intervalRef.current = setInterval(() => {
      fetchNotifications().catch((error) => {
        console.error('Bildirimler güncellenirken hata:', error)
      })
    }, 30000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAsRead' }),
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Bildirim okundu işaretlenirken hata:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllAsRead' }),
      })

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
        setUnreadCount(0)
        toast.success('Tüm bildirimler okundu olarak işaretlendi')
      }
    } catch (error) {
      console.error('Tüm bildirimler okundu işaretlenirken hata:', error)
      toast.error('Bir hata oluştu')
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const notification = notifications.find((n) => n.id === notificationId)
        if (notification && !notification.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
        toast.success('Bildirim silindi')
      }
    } catch (error) {
      console.error('Bildirim silinirken hata:', error)
      toast.error('Bir hata oluştu')
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id)
    }

    if (notification.link) {
      router.push(notification.link)
      setIsOpen(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700'
      case 'HIGH':
        return 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700'
      case 'MEDIUM':
        return 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
      case 'LOW':
        return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
      default:
        return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
    }
  }

  const getPriorityIcon = (priority: string) => {
    if (priority === 'URGENT' || priority === 'HIGH') {
      return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
    }
    return null
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative modern-button hover:bg-blue-500/10 dark:hover:bg-blue-400/10 overflow-visible"
          aria-label="Bildirimler"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 min-w-[20px] h-[20px] px-1.5 rounded-full bg-red-500 text-white text-[11px] font-semibold flex items-center justify-center leading-tight shadow-md z-20 border-2 border-white dark:border-gray-900 translate-x-1/2 -translate-y-1/2">
              {unreadCount > 99 ? '99+' : unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 max-h-[500px] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg z-[100]"
        sideOffset={8}
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">Bildirimler</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs h-auto p-1"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Tümünü okundu işaretle
              </Button>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {unreadCount} okunmamış bildirim
            </p>
          )}
        </div>

        {loading ? (
          <div className="p-4 text-center text-gray-500">Yükleniyor...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Henüz bildirim yok</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors border-l-4 ${
                  notification.isRead
                    ? 'bg-white dark:bg-gray-900 border-transparent'
                    : getPriorityColor(notification.priority)
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getPriorityIcon(notification.priority)}
                      <h4
                        className={`text-sm font-medium ${
                          notification.isRead
                            ? 'text-gray-700 dark:text-gray-300'
                            : 'text-gray-900 dark:text-white font-semibold'
                        }`}
                      >
                        {notification.title}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMarkAsRead(notification.id)
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(notification.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {notifications.length > 0 && (
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => {
                router.push('/notifications')
                setIsOpen(false)
              }}
            >
              Tüm bildirimleri görüntüle
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

