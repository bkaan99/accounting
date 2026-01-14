import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ClientSchema } from '@/lib/validations'
import { createNotification } from '@/lib/notifications'
import { handleApiError, ApiErrors } from '@/lib/error-handler'
import { requireAuth } from '@/lib/auth-helpers'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth()
    if ('response' in authResult) {
      return authResult.response
    }
    const { session } = authResult

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
    return handleApiError(error, 'PUT /api/clients/[id]')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth()
    if ('response' in authResult) {
      return authResult.response
    }
    const { session } = authResult

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
      return ApiErrors.notFound('Tedarikçi bulunamadı')
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
    return handleApiError(error, 'DELETE /api/clients/[id]')
  }
} 