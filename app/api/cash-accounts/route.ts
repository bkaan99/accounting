import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CashAccountSchema } from '@/lib/validations'
import { handleApiError, ApiErrors } from '@/lib/error-handler'
import { requireAuth, requireValidCompany, isSuperAdmin } from '@/lib/auth-helpers'

export async function GET() {
  try {
    const authResult = await requireAuth()
    if ('response' in authResult) {
      return authResult.response
    }
    const { session } = authResult

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
        orderBy: { date: 'desc' as const },
        take: 5, // Son 5 işlem
      },
    }

    // Şirket erişim kontrolü için where clause oluştur
    const where = isSuperAdmin(session) 
      ? {} 
      : session.user.companyId 
        ? { companyId: session.user.companyId }
        : { id: 'never-match' } // Hiçbir kasa eşleşmeyecek

    const cashAccounts = await prisma.cashAccount.findMany({
      where,
      select: cashAccountSelect,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(cashAccounts)
  } catch (error) {
    return handleApiError(error, 'GET /api/cash-accounts')
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
    
    // Zod validation
    const validatedData = CashAccountSchema.parse(body)
    const { name, type, description, initialBalance = 0 } = validatedData

    // Aynı isimde kasa var mı kontrol et
    const existingCashAccount = await prisma.cashAccount.findFirst({
      where: {
        companyId: company.id,
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
        companyId: company.id,
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
