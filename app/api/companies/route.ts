import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CompanySchema } from '@/lib/validations'
import { handleApiError, ApiErrors } from '@/lib/error-handler'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return ApiErrors.unauthorized()
    }

    const companySelect = {
      id: true,
      name: true,
      taxId: true,
      address: true,
      phone: true,
      email: true,
      website: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          users: true,
          clients: true,
          invoices: true,
          transactions: true,
        },
      },
    }

    // Süperadmin tüm şirketleri görebilir
    if (session.user.role === 'SUPERADMIN') {
      const companies = await prisma.company.findMany({
        select: companySelect,
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json(companies)
    }

    // Admin ve User sadece kendi şirketlerini görebilir
    if (session.user.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: session.user.companyId },
        select: companySelect,
      })

      return NextResponse.json(company ? [company] : [])
    }

    return NextResponse.json([])
  } catch (error) {
    return handleApiError(error, 'GET /api/companies')
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Sadece süperadmin şirket oluşturabilir
    if (!session?.user?.id || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const body = await request.json()
    
    // Zod validation
    const validatedData = CompanySchema.parse(body)
    const { name, taxId, address, phone, email, website, logo } = validatedData

    // TaxId benzersizliği kontrolü
    if (taxId) {
      const existingCompany = await prisma.company.findUnique({
        where: { taxId }
      })

      if (existingCompany) {
        return NextResponse.json(
          { error: 'Bu vergi numarası zaten kullanılıyor' },
          { status: 400 }
        )
      }
    }

    const companySelect = {
      id: true,
      name: true,
      taxId: true,
      address: true,
      phone: true,
      email: true,
      website: true,
      logo: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          users: true,
          clients: true,
          invoices: true,
          transactions: true,
        },
      },
    }

    const company = await prisma.company.create({
      data: {
        name,
        taxId,
        address,
        phone,
        email,
        website,
        logo,
      },
      select: companySelect,
    })

    return NextResponse.json(company, { status: 201 })
  } catch (error: any) {
    console.error('Şirket oluşturulurken hata:', error)
    
    return handleApiError(error, 'POST /api/companies')
  }
}
