import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CompanySchema } from '@/lib/validations'
import { handleApiError, ApiErrors } from '@/lib/error-handler'
import { requireAuth, requireSuperAdmin, isSuperAdmin } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ('response' in authResult) {
      return authResult.response
    }
    const { session } = authResult

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

    // Şirket erişim kontrolü için where clause oluştur
    const where = isSuperAdmin(session) 
      ? {} 
      : session.user.companyId 
        ? { companyId: session.user.companyId }
        : { id: 'never-match' } // Hiçbir şirket eşleşmeyecek
    
    const companies = await prisma.company.findMany({
      where,
      select: companySelect,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(companies)
  } catch (error) {
    return handleApiError(error, 'GET /api/companies')
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin()
    if ('response' in authResult) {
      return authResult.response
    }
    const { session } = authResult

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
  } catch (error) {
    return handleApiError(error, 'POST /api/companies')
  }
}
