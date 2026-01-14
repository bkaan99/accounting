import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ClientSchema } from '@/lib/validations'
import { createNotification } from '@/lib/notifications'
import { parsePaginationParams, type PaginationResponse } from '@/lib/utils'
import { handleApiError } from '@/lib/error-handler'
import { requireAuth, requireValidCompany, isSuperAdmin } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ('response' in authResult) {
      return authResult.response
    }
    const { session } = authResult

    // Pagination parametrelerini al
    const searchParams = request.nextUrl.searchParams
    const { page, limit, skip, take } = parsePaginationParams(searchParams, 10)

    const clientSelect = {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      taxId: true,
      companyId: true,
      userId: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true,
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
    }

    // Şirket erişim kontrolü için where clause oluştur
    const companyWhere = isSuperAdmin(session) 
      ? {} 
      : session.user.companyId 
        ? { companyId: session.user.companyId }
        : { id: 'never-match' } // Hiçbir tedarikçi eşleşmeyecek
    
    const where = {
      ...companyWhere,
      ...(session.user.role !== 'SUPERADMIN' && { isDeleted: false }), // Soft delete edilmemiş tedarikçiler (sadece admin/user için)
    }
    
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        select: clientSelect,
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
  } catch (error) {
    return handleApiError(error, 'GET /api/clients')
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireValidCompany()
    if ('response' in authResult) {
      return authResult.response
    }
    const { session, company } = authResult

    const body = await request.json()
    const validatedData = ClientSchema.parse(body)

    const client = await prisma.client.create({
      data: {
        ...validatedData,
        userId: session.user.id,
        companyId: company.id,
      },
    })

    // Yeni tedarikçi eklendiğinde bildirim gönder (tercih açıksa)
    createNotification({
      userId: session.user.id,
      companyId: company.id,
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
    return handleApiError(error, 'POST /api/clients')
  }
} 