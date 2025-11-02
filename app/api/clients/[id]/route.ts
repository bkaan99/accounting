import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ClientSchema } from '@/lib/validations'
import { createNotification } from '@/lib/notifications'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = ClientSchema.parse(body)

    const client = await prisma.client.update({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      data: validatedData,
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error('Tedarikçi güncellenirken hata:', error)
    return NextResponse.json(
      { error: 'Tedarikçi güncellenirken hata oluştu' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    // Önce tedarikçi bilgilerini al (bildirim için)
    const client = await prisma.client.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Tedarikçi bulunamadı' }, { status: 404 })
    }

    // Tedarikçiyi sil
    await prisma.client.update({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      data: { isDeleted: true }
    })

    // Tedarikçi silindiğinde bildirim gönder (tercih açıksa)
    createNotification({
      userId: session.user.id,
      companyId: session.user.companyId,
      type: 'CLIENT_DELETED',
      priority: 'LOW',
      title: 'Tedarikçi Silindi',
      message: `"${client.name}" adlı tedarikçi silindi.`,
      link: '/clients',
      metadata: {
        clientId: client.id,
        clientName: client.name,
        action: 'deleted',
      },
    }).then((notification) => {
      if (notification) {
        console.log('✅ Tedarikçi silindi bildirimi gönderildi:', notification.id)
      } else {
        console.log('⚠️ Tedarikçi silindi bildirimi gönderilmedi (tercih kapalı olabilir)')
      }
    }).catch((err) => console.error('❌ Tedarikçi silindi bildirimi hatası:', err))

    return NextResponse.json({ message: 'Tedarikçi silindi' })
  } catch (error) {
    console.error('Tedarikçi silinirken hata:', error)
    return NextResponse.json(
      { error: 'Tedarikçi silinirken hata oluştu' },
      { status: 500 }
    )
  }
} 