import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { TransactionCreateSchema } from '@/lib/validations'
import { parsePaginationParams, type PaginationResponse } from '@/lib/utils'
import { handleApiError } from '@/lib/error-handler'
import { requireAuth, getCompanyWhereClause, requireValidCompany, checkCashAccountAccessAndActive } from '@/lib/auth-helpers'

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

    const transactionSelect = {
      id: true,
      userId: true,
      companyId: true,
      cashAccountId: true,
      type: true,
      category: true,
      amount: true,
      description: true,
      date: true,
      invoiceId: true,
      isPaid: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      cashAccount: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      invoice: {
        select: {
          id: true,
          number: true,
          client: {
            select: {
              name: true,
            },
          },
        },
      },
    }

    // Şirket erişim kontrolü için where clause oluştur
    const companyWhere = getCompanyWhereClause(session)
    const where = {
      ...companyWhere,
      ...(session.user.role !== 'SUPERADMIN' && { isDeleted: false }), // Soft delete edilmemiş işlemler (sadece admin/user için)
    }
    
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        select: transactionSelect,
        orderBy: { date: 'desc' },
        skip,
        take,
      }),
      prisma.transaction.count({ where })
    ])

    const response: PaginationResponse<typeof transactions[0]> = {
      data: transactions,
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
    return handleApiError(error, 'GET /api/transactions')
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
    const validatedData = TransactionCreateSchema.parse(body)
    const { type, category, amount, description, date, cashAccountId, isPaid = false } = validatedData

    // Kasa seçildiyse kasa kontrolü yap
    if (cashAccountId) {
      const cashAccountResult = await checkCashAccountAccessAndActive(cashAccountId)
      if ('response' in cashAccountResult) {
        return cashAccountResult.response
      }
    }

    // İşlem oluştur ve kasa bakiyesini güncelle
    const transaction = await prisma.$transaction(async (tx) => {
      // İşlemi oluştur
      const newTransaction = await tx.transaction.create({
        data: {
          userId: session.user.id,
          companyId: company.id,
          cashAccountId: cashAccountId || null,
          type,
          category,
          amount: typeof amount === 'number' ? amount : parseFloat(amount),
          description: description || null,
          date: date instanceof Date ? date : new Date(date),
          isPaid,
        }
      })

      // Eğer kasa seçildiyse ve işlem ödendiyse kasa bakiyesini güncelle
      if (cashAccountId && isPaid) {
        const amountValue = typeof amount === 'number' ? amount : parseFloat(amount)
        const balanceChange = type === 'INCOME' ? amountValue : -amountValue
        
        await tx.cashAccount.update({
          where: { id: cashAccountId },
          data: {
            balance: {
              increment: balanceChange
            }
          }
        })
      }

      return newTransaction
    })

    // Bildirim gönder
    // 1. Büyük işlem kontrolü
    const preference = await prisma.notificationPreference.findUnique({
      where: { userId: session.user.id },
    })

    const largeTransactionLimit = preference?.largeTransactionLimit || 10000
    const amountValue = typeof amount === 'number' ? amount : parseFloat(amount)
    if (amountValue >= largeTransactionLimit) {
      createNotification({
        userId: session.user.id,
        companyId: company.id,
        type: 'LARGE_TRANSACTION',
        priority: 'HIGH',
        title: 'Büyük İşlem Tespit Edildi',
        message: `${type === 'INCOME' ? 'Gelir' : 'Gider'} işlemi: ${category} - ₺${amountValue.toFixed(2)}`,
        link: `/transactions`,
        metadata: {
          transactionId: transaction.id,
          type,
          amount: amountValue,
          category,
        },
      }).catch((err) => console.error('Büyük işlem bildirimi hatası:', err))
    }

    // 2. Kasa bakiyesi kontrolü (eğer kasa seçildiyse ve işlem ödendiyse)
    if (cashAccountId && isPaid) {
      const updatedCashAccount = await prisma.cashAccount.findUnique({
        where: { id: cashAccountId },
      })

      if (updatedCashAccount) {
        const lowBalanceLimit = preference?.lowBalanceLimit || 1000

        // Negatif bakiye kontrolü
        if (updatedCashAccount.balance < 0) {
          createNotification({
            userId: session.user.id,
            companyId: company.id,
            type: 'NEGATIVE_BALANCE',
            priority: 'URGENT',
            title: 'Kasa Negatif Bakiyede!',
            message: `"${updatedCashAccount.name}" kasasının bakiyesi negatif: ₺${updatedCashAccount.balance.toFixed(2)}`,
            link: `/cash-accounts/${cashAccountId}`,
            metadata: {
              cashAccountId: cashAccountId,
              cashAccountName: updatedCashAccount.name,
              balance: updatedCashAccount.balance,
            },
          }).catch((err) => console.error('Negatif bakiye bildirimi hatası:', err))
        }
        // Düşük bakiye kontrolü
        else if (updatedCashAccount.balance < lowBalanceLimit && updatedCashAccount.balance >= 0) {
          createNotification({
            userId: session.user.id,
            companyId: company.id,
            type: 'LOW_BALANCE',
            priority: 'MEDIUM',
            title: 'Düşük Bakiye Uyarısı',
            message: `"${updatedCashAccount.name}" kasasının bakiyesi düşük: ₺${updatedCashAccount.balance.toFixed(2)}`,
            link: `/cash-accounts/${cashAccountId}`,
            metadata: {
              cashAccountId: cashAccountId,
              cashAccountName: updatedCashAccount.name,
              balance: updatedCashAccount.balance,
              limit: lowBalanceLimit,
            },
          }).catch((err) => console.error('Düşük bakiye bildirimi hatası:', err))
        }
      }
    }

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'POST /api/transactions')
  }
} 