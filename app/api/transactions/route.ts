import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { TransactionCreateSchema } from '@/lib/validations'
import { parsePaginationParams, type PaginationResponse } from '@/lib/utils'
import { handleApiError, ApiErrors } from '@/lib/error-handler'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return ApiErrors.unauthorized()
    }

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

    // Süperadmin tüm işlemleri görebilir
    if (session.user.role === 'SUPERADMIN') {
      const where = {}
      
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
    }

    // Admin ve User sadece kendi şirketinin işlemlerini görebilir
    if (session.user.companyId) {
      const where = { 
        companyId: session.user.companyId!,
        isDeleted: false // Soft delete edilmemiş işlemler
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
    }

    const emptyResponse: PaginationResponse<never> = {
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    }

    return NextResponse.json(emptyResponse)
  } catch (error) {
    return handleApiError(error, 'GET /api/transactions')
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
    const validatedData = TransactionCreateSchema.parse(body)
    const { type, category, amount, description, date, cashAccountId, isPaid = false } = validatedData

    // Kullanıcının şirketi yoksa işlem oluşturamaz
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

    // Kasa seçildiyse kasa kontrolü yap
    if (cashAccountId) {
      const cashAccount = await prisma.cashAccount.findUnique({
        where: { id: cashAccountId },
      })

      if (!cashAccount) {
        return NextResponse.json(
          { error: 'Kasa bulunamadı' },
          { status: 400 }
        )
      }

      if (cashAccount.companyId !== session.user.companyId) {
        return NextResponse.json(
          { error: 'Bu kasaya erişim yetkiniz yok' },
          { status: 403 }
        )
      }

      if (!cashAccount.isActive) {
        return NextResponse.json(
          { error: 'Bu kasa aktif değil' },
          { status: 400 }
        )
      }
    }

    // İşlem oluştur ve kasa bakiyesini güncelle
    const transaction = await prisma.$transaction(async (tx) => {
      // İşlemi oluştur
      const newTransaction = await tx.transaction.create({
        data: {
          userId: session.user.id,
          companyId: session.user.companyId!,
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
        companyId: session.user.companyId,
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
            companyId: session.user.companyId!,
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
            companyId: session.user.companyId!,
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