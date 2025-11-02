import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ClientSchema } from '@/lib/validations'
import { createNotification } from '@/lib/notifications'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    // Süperadmin tüm tedarikçileri görebilir
    if (session.user.role === 'SUPERADMIN') {
      const clients = await prisma.client.findMany({
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json(clients)
    }

    // Admin ve User sadece kendi şirketinin tedarikçilerini görebilir
    if (session.user.companyId) {
      const clients = await prisma.client.findMany({
        where: { 
          companyId: session.user.companyId,
          isDeleted: false // Soft delete edilmemiş tedarikçiler
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json(clients)
    }

    return NextResponse.json([])
  } catch (error) {
    console.error('Tedarikçiler alınırken hata:', error)
    return NextResponse.json(
      { error: 'Tedarikçiler alınırken hata oluştu' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = ClientSchema.parse(body)

    // Kullanıcının şirketi yoksa tedarikçi oluşturamaz
    if (!session.user.companyId) {
      return NextResponse.json(
        { error: 'Şirket bilgisi bulunamadı' },
        { status: 400 }
      )
    }

    const client = await prisma.client.create({
      data: {
        ...validatedData,
        userId: session.user.id,
        companyId: session.user.companyId,
      },
    })

    // Yeni tedarikçi eklendiğinde bildirim gönder (tercih açıksa)
    createNotification({
      userId: session.user.id,
      companyId: session.user.companyId,
      type: 'CLIENT_ADDED',
      priority: 'LOW',
      title: 'Yeni Tedarikçi Eklendi',
      message: `"${validatedData.name}" adlı tedarikçi sisteme eklendi.`,
      link: '/clients',
      metadata: {
        clientId: client.id,
        clientName: validatedData.name,
      },
    }).then((notification) => {
      if (notification) {
        console.log('✅ Tedarikçi eklendi bildirimi gönderildi:', notification.id)
      } else {
        console.log('⚠️ Tedarikçi eklendi bildirimi gönderilmedi (tercih kapalı olabilir)')
      }
    }).catch((err) => console.error('❌ Tedarikçi eklendi bildirimi hatası:', err))

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Tedarikçi oluşturulurken hata:', error)
    return NextResponse.json(
      { error: 'Tedarikçi oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
} 