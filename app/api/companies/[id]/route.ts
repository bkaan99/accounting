import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CompanyUpdateSchema } from '@/lib/validations'
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
    return handleApiError(error, 'GET /api/companies/[id]')
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
    const { name, taxId, address, phone, email, website, logo } = body

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
    return handleApiError(error, 'POST /api/companies/[id]')
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireSuperAdmin()
    if ('response' in authResult) {
      return authResult.response
    }
    const { session } = authResult

    const body = await request.json()
    
    // Zod validation
    const validatedData = CompanyUpdateSchema.parse(body)
    const { name, taxId, address, phone, email, website, logo } = validatedData

    // TaxId benzersizliği kontrolü (kendi ID'si hariç)
    if (taxId) {
      const existingCompany = await prisma.company.findFirst({
        where: { 
          taxId,
          id: { not: params.id }
        }
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

    const company = await prisma.company.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(taxId !== undefined && { taxId }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(website !== undefined && { website }),
        ...(logo !== undefined && { logo }),
      },
      select: companySelect,
    })

    return NextResponse.json(company)
  } catch (error) {
    return handleApiError(error, 'PUT /api/companies/[id]')
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireSuperAdmin()
    if ('response' in authResult) {
      return authResult.response
    }
    const { session } = authResult

    // Şirketin var olup olmadığını kontrol et
    const company = await prisma.company.findUnique({
      where: { id: params.id },
    })

    if (!company) {
      return ApiErrors.notFound('Şirket bulunamadı')
    }

    // Şirketi sil (cascade delete ile bağlı veriler otomatik silinir)
    await prisma.company.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Şirket ve bağlı tüm veriler başarıyla silindi' })
  } catch (error) {
    return handleApiError(error, 'DELETE /api/companies/[id]')
  }
}
