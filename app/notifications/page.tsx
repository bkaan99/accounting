'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/loading'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  AlertCircle,
  Filter,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

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

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all') // all, unread, read
  const [priorityFilter, setPriorityFilter] = useState<string>('all') // all, LOW, MEDIUM, HIGH, URGENT
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const limit = 20

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications()
    }
  }, [session?.user?.id, filter, priorityFilter, page])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
        ...(filter !== 'all' && { filter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
      })

      const response = await fetch(`/api/notifications?${params}`)
      if (response.ok) {
        const data = await response.json()
        if (page === 1) {
          setNotifications(data.notifications || [])
        } else {
          setNotifications((prev) => [...prev, ...(data.notifications || [])])
        }
        setHasMore(data.hasMore || false)
      } else {
        toast.error('Bildirimler yüklenemedi')
      }
    } catch (error) {
      console.error('Bildirimler yüklenirken hata:', error)
      toast.error('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

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
        toast.success('Bildirim okundu olarak işaretlendi')
      }
    } catch (error) {
      console.error('Bildirim okundu işaretlenirken hata:', error)
      toast.error('Bir hata oluştu')
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
        toast.success('Tüm bildirimler okundu olarak işaretlendi')
        fetchNotifications() // Listeyi yenile
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

  const clearFilters = () => {
    setFilter('all')
    setPriorityFilter('all')
    setPage(1)
  }

  const activeFiltersCount = [
    filter !== 'all',
    priorityFilter !== 'all',
  ].filter(Boolean).length

  if (status === 'loading' || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    )
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Bildirimler
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Tüm bildirimlerinizi buradan görüntüleyebilir ve yönetebilirsiniz
            </p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline">
              <CheckCheck className="h-4 w-4 mr-2" />
              Tümünü Okundu İşaretle
            </Button>
          )}
        </div>

        {/* Filtreler */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtreler
              </CardTitle>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Temizle ({activeFiltersCount})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Durum
                </label>
                <Select value={filter} onValueChange={(value) => {
                  setFilter(value)
                  setPage(1)
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="unread">Okunmamış</SelectItem>
                    <SelectItem value="read">Okunmuş</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Öncelik
                </label>
                <Select value={priorityFilter} onValueChange={(value) => {
                  setPriorityFilter(value)
                  setPage(1)
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="URGENT">Acil</SelectItem>
                    <SelectItem value="HIGH">Yüksek</SelectItem>
                    <SelectItem value="MEDIUM">Orta</SelectItem>
                    <SelectItem value="LOW">Düşük</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bildirimler Listesi */}
        <Card>
          <CardHeader>
            <CardTitle>
              Bildirimler ({notifications.length})
              {unreadCount > 0 && (
                <span className="ml-2 text-sm font-normal text-red-600 dark:text-red-400">
                  ({unreadCount} okunmamış)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="p-12 text-center">
                <Bell className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400">
                  {filter !== 'all' || priorityFilter !== 'all'
                    ? 'Filtre kriterlerine uygun bildirim bulunamadı'
                    : 'Henüz bildirim yok'}
                </p>
                {(filter !== 'all' || priorityFilter !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="mt-4"
                  >
                    Filtreleri Temizle
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border-l-4 transition-colors ${
                      notification.isRead
                        ? 'bg-white dark:bg-gray-900 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                        : getPriorityColor(notification.priority)
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {getPriorityIcon(notification.priority)}
                          <h3
                            className={`font-medium ${
                              notification.isRead
                                ? 'text-gray-700 dark:text-gray-300'
                                : 'text-gray-900 dark:text-white font-semibold'
                            }`}
                          >
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                          <span>
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale: tr,
                            })}
                          </span>
                          {notification.link && (
                            <Link
                              href={notification.link}
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Detayları görüntüle →
                            </Link>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMarkAsRead(notification.id)
                            }}
                            title="Okundu işaretle"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(notification.id)
                          }}
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {hasMore && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setPage((prev) => prev + 1)}
                      disabled={loading}
                    >
                      Daha Fazla Yükle
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

