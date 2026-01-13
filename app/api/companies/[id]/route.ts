import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CompanyUpdateSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    // Süperadmin tüm şirketleri görebilir
    if (session.user.role === 'SUPERADMIN') {
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

      const companies = await prisma.company.findMany({
        select: companySelect,
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json(companies)
    }

    // Admin ve User sadece kendi şirketlerini görebilir
    if (session.user.companyId) {
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

      const company = await prisma.company.findUnique({
        where: { id: session.user.companyId },
        select: companySelect,
      })

      return NextResponse.json(company ? [company] : [])
    }

    return NextResponse.json([])
  } catch (error) {
    console.error('Şirketler alınırken hata:', error)
    return NextResponse.json(
      { error: 'Şirketler alınırken hata oluştu' },
      { status: 500 }
    )
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
    console.error('Şirket oluşturulurken hata:', error)
    return NextResponse.json(
      { error: 'Şirket oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    // Sadece süperadmin şirket güncelleyebilir
    if (!session?.user?.id || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

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
  } catch (error: any) {
    console.error('Şirket güncellenirken hata:', error)
    
    // Zod validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Geçersiz veri', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Şirket güncellenirken hata oluştu' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    // Sadece süperadmin şirket silebilir
    if (!session?.user?.id || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    // Şirketin var olup olmadığını kontrol et
    const company = await prisma.company.findUnique({
      where: { id: params.id },
    })

    if (!company) {
      return NextResponse.json({ error: 'Şirket bulunamadı' }, { status: 404 })
    }

    // Şirketi sil (cascade delete ile bağlı veriler otomatik silinir)
    await prisma.company.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Şirket ve bağlı tüm veriler başarıyla silindi' })
  } catch (error) {
    console.error('Şirket silinirken hata:', error)
    return NextResponse.json(
      { error: 'Şirket silinirken hata oluştu' },
      { status: 500 }
    )
  }
}
