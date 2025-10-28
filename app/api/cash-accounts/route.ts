import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Süperadmin tüm kasaları görebilir
    if (session.user.role === 'SUPERADMIN') {
      const cashAccounts = await prisma.cashAccount.findMany({
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          transactions: {
            select: {
              id: true,
              type: true,
              amount: true,
              date: true,
            },
            orderBy: { date: 'desc' },
            take: 5, // Son 5 işlem
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json(cashAccounts)
    }

    // Admin ve User sadece kendi şirketinin kasalarını görebilir
    if (session.user.companyId) {
      const cashAccounts = await prisma.cashAccount.findMany({
        where: { 
          companyId: session.user.companyId,
          isActive: true 
        },
        include: {
          transactions: {
            select: {
              id: true,
              type: true,
              amount: true,
              date: true,
            },
            orderBy: { date: 'desc' },
            take: 5, // Son 5 işlem
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json(cashAccounts)
    }

    return NextResponse.json([])
  } catch (error) {
    console.error('Cash accounts fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, description, initialBalance = 0 } = body

    // Validation
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Kasa adı ve türü gereklidir' },
        { status: 400 }
      )
    }

    if (!['CASH', 'CREDIT_CARD', 'BANK_ACCOUNT'].includes(type)) {
      return NextResponse.json(
        { error: 'Geçersiz kasa türü' },
        { status: 400 }
      )
    }

    // Kullanıcının şirketi yoksa kasa oluşturamaz
    if (!session.user.companyId) {
      return NextResponse.json(
        { error: 'Şirket bilgisi bulunamadı' },
        { status: 400 }
      )
    }

    // Aynı isimde kasa var mı kontrol et
    const existingCashAccount = await prisma.cashAccount.findFirst({
      where: {
        companyId: session.user.companyId,
        name: name,
        isActive: true,
      },
    })

    if (existingCashAccount) {
      return NextResponse.json(
        { error: 'Bu isimde bir kasa zaten mevcut' },
        { status: 400 }
      )
    }

    const cashAccount = await prisma.cashAccount.create({
      data: {
        companyId: session.user.companyId,
        name,
        type,
        initialBalance: parseFloat(initialBalance),
        balance: parseFloat(initialBalance), // Başlangıçta ikisi de aynı
        description: description || null,
      },
    })

    return NextResponse.json(cashAccount, { status: 201 })
  } catch (error) {
    console.error('Cash account creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
