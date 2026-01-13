import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ClientSchema } from '@/lib/validations'
import { createNotification } from '@/lib/notifications'
import { parsePaginationParams, type PaginationResponse } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    // Pagination parametrelerini al
    const searchParams = request.nextUrl.searchParams
    const { page, limit, skip, take } = parsePaginationParams(searchParams, 10)

    // Süperadmin tüm tedarikçileri görebilir
    if (session.user.role === 'SUPERADMIN') {
      const where = {}
      
      const [clients, total] = await Promise.all([
        prisma.client.findMany({
          where,
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
          skip,
          take,
        }),
        prisma.client.count({ where })
      ])

      const response: PaginationResponse<typeof clients[0]> = {
        data: clients,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      }

      return NextResponse.json(response)
    }

    // Admin ve User sadece kendi şirketinin tedarikçilerini görebilir
    if (session.user.companyId) {
      const where = { 
        companyId: session.user.companyId,
        isDeleted: false // Soft delete edilmemiş tedarikçiler
      }
      
      const [clients, total] = await Promise.all([
        prisma.client.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.client.count({ where })
      ])

      const response: PaginationResponse<typeof clients[0]> = {
        data: clients,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      }

      return NextResponse.json(response)
    }

    const emptyResponse: PaginationResponse<never> = {
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    }

    return NextResponse.json(emptyResponse)
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

    // Şirketin var olup olmadığını kontrol et
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Şirket bulunamadı. Lütfen sistem yöneticisi ile iletişime geçin.' },
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
  } catch (error: any) {
    console.error('Tedarikçi oluşturulurken hata:', error)
    
    // Zod validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Geçersiz veri', details: error.errors },
        { status: 400 }
      )
    }
    
    // Foreign key constraint error
    if (error.code === 'P2003') {
      const fieldName = error.meta?.field_name || 'bilinmeyen alan'
      return NextResponse.json(
        { error: `Veritabanı hatası: ${fieldName}. Lütfen sistem yöneticisi ile iletişime geçin.` },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Tedarikçi oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
} 