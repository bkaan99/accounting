import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ClientSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    // Süperadmin tüm müşterileri görebilir
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

    // Admin ve User sadece kendi şirketinin müşterilerini görebilir
    if (session.user.companyId) {
      const clients = await prisma.client.findMany({
        where: { companyId: session.user.companyId },
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
    console.error('Müşteriler alınırken hata:', error)
    return NextResponse.json(
      { error: 'Müşteriler alınırken hata oluştu' },
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

    // Kullanıcının şirketi yoksa müşteri oluşturamaz
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

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Müşteri oluşturulurken hata:', error)
    return NextResponse.json(
      { error: 'Müşteri oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
} 