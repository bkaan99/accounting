import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Mevcut kullanıcıların bildirim tercihlerini günceller
 * clientAdded'i true yapar (eski kullanıcılar için)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Sadece SUPERADMIN bu işlemi yapabilir
    if (!session?.user?.id || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Tüm kullanıcıların tercihlerini güncelle (clientAdded'i true yap)
    const result = await prisma.notificationPreference.updateMany({
      where: {
        clientAdded: false, // Sadece false olanları güncelle
      },
      data: {
        clientAdded: true,
      },
    })

    return NextResponse.json({
      message: 'Bildirim tercihleri güncellendi',
      updated: result.count,
    })
  } catch (error) {
    console.error('Tercih güncelleme hatası:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

