import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
} from '@/lib/notifications'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const filter = searchParams.get('filter') // 'all', 'unread', 'read'
    const priority = searchParams.get('priority') // 'LOW', 'MEDIUM', 'HIGH', 'URGENT'

    const where: any = {
      userId: session.user.id,
    }

    if (filter === 'unread') {
      where.isRead = false
    } else if (filter === 'read') {
      where.isRead = true
    }

    if (priority) {
      where.priority = priority
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
      getUnreadNotificationCount(session.user.id),
    ])

    // metadata'yı parse et
    const parsedNotifications = notifications.map((notification) => ({
      ...notification,
      metadata: notification.metadata ? JSON.parse(notification.metadata) : null,
    }))

    return NextResponse.json({
      notifications: parsedNotifications,
      total,
      unreadCount,
      hasMore: offset + limit < total,
    })
  } catch (error) {
    console.error('Notifications fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'markAllAsRead') {
      await markAllNotificationsAsRead(session.user.id)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Notifications update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

