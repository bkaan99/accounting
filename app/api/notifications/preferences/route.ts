import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let preference = await prisma.notificationPreference.findUnique({
      where: { userId: session.user.id },
    })

    // Eğer tercih yoksa varsayılan oluştur
    if (!preference) {
      preference = await prisma.notificationPreference.create({
        data: {
          userId: session.user.id,
          companyId: session.user.companyId || null,
        },
      })
    }

    return NextResponse.json(preference)
  } catch (error) {
    console.error('Notification preferences fetch error:', error)
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

    // Önce tercih var mı kontrol et
    let preference = await prisma.notificationPreference.findUnique({
      where: { userId: session.user.id },
    })

    if (!preference) {
      // Yoksa oluştur
      preference = await prisma.notificationPreference.create({
        data: {
          userId: session.user.id,
          companyId: session.user.companyId || null,
          ...body,
        },
      })
    } else {
      // Varsa güncelle
      preference = await prisma.notificationPreference.update({
        where: { userId: session.user.id },
        data: body,
      })
    }

    return NextResponse.json(preference)
  } catch (error) {
    console.error('Notification preferences update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

