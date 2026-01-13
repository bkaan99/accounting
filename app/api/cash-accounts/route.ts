import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CashAccountSchema } from '@/lib/validations'
import { handleApiError, ApiErrors } from '@/lib/error-handler'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return ApiErrors.unauthorized()
    }

    const cashAccountSelect = {
      id: true,
      companyId: true,
      name: true,
      type: true,
      initialBalance: true,
      balance: true,
      isActive: true,
      description: true,
      createdAt: true,
      updatedAt: true,
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
    }

    // Süperadmin tüm kasaları görebilir
    if (session.user.role === 'SUPERADMIN') {
      const cashAccounts = await prisma.cashAccount.findMany({
        select: cashAccountSelect,
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json(cashAccounts)
    }

    // Admin ve User sadece kendi şirketinin kasalarını görebilir
    if (session.user.companyId) {
      const cashAccounts = await prisma.cashAccount.findMany({
        where: { 
          companyId: session.user.companyId
          // isActive filtresini kaldırdık - hem aktif hem pasif kasaları göster
        },
        select: cashAccountSelect,
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json(cashAccounts)
    }

    return NextResponse.json([])
  } catch (error) {
    return handleApiError(error, 'GET /api/cash-accounts')
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return ApiErrors.unauthorized()
    }

    const body = await request.json()
    
    // Zod validation
    const validatedData = CashAccountSchema.parse(body)
    const { name, type, description, initialBalance = 0 } = validatedData

    // Kullanıcının şirketi yoksa kasa oluşturamaz
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

    const initialBalanceValue = typeof initialBalance === 'number' ? initialBalance : parseFloat(initialBalance) || 0
    
    const cashAccount = await prisma.cashAccount.create({
      data: {
        companyId: session.user.companyId,
        name,
        type,
        initialBalance: initialBalanceValue,
        balance: initialBalanceValue, // Başlangıçta ikisi de aynı
        description: description || null,
      },
    })

    return NextResponse.json(cashAccount, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'POST /api/cash-accounts')
  }
}
