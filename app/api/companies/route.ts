import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    // Süperadmin tüm şirketleri görebilir
    if (session.user.role === 'SUPERADMIN') {
      const companies = await prisma.company.findMany({
        include: {
          _count: {
            select: {
              users: true,
              clients: true,
              invoices: true,
              transactions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json(companies)
    }

    // Admin ve User sadece kendi şirketlerini görebilir
    if (session.user.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: session.user.companyId },
        include: {
          _count: {
            select: {
              users: true,
              clients: true,
              invoices: true,
              transactions: true,
            },
          },
        },
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
      include: {
        _count: {
          select: {
            users: true,
            clients: true,
            invoices: true,
            transactions: true,
          },
        },
      },
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
