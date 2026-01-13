import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateInvoiceStatus } from '@/lib/invoice-status'
import { createNotification } from '@/lib/notifications'
import { TransactionUpdateSchema } from '@/lib/validations'
import { handleApiError, ApiErrors } from '@/lib/error-handler'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return ApiErrors.unauthorized()
    }

    const transaction = await prisma.transaction.findUnique({
      where: { 
        id: params.id,
        userId: session.user.id,
      }
    })

    if (!transaction) {
      return ApiErrors.notFound('İşlem bulunamadı')
    }

    return NextResponse.json(transaction)
  } catch (error) {
    return handleApiError(error, 'GET /api/transactions/[id]')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return ApiErrors.unauthorized()
    }

    const body = await request.json()
    
    // Mevcut işlemi getir
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        invoiceId: true,
        cashAccount: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!existingTransaction) {
      return ApiErrors.notFound('İşlem bulunamadı')
    }

    // Faturaya bağlı işlemler için sadece kasa ve ödeme durumu güncellenebilir
    const isInvoiceTransaction = !!existingTransaction.invoiceId

    // Zod validation - Faturaya bağlı işlemler için sadece cashAccountId ve isPaid validate edilir
    let validatedData
    if (isInvoiceTransaction) {
      // Faturaya bağlı işlemler için sadece kasa ve ödeme durumu
      validatedData = TransactionUpdateSchema.pick({ cashAccountId: true, isPaid: true }).parse(body)
    } else {
      // Normal işlemler için tüm alanlar
      validatedData = TransactionUpdateSchema.parse(body)
    }
    
    const { type, category, amount, description, date, cashAccountId, isPaid } = validatedData

    // Yetki kontrolü
    if (session.user.role !== 'SUPERADMIN' && existingTransaction.companyId !== session.user.companyId) {
      return ApiErrors.forbidden('Bu işlemi düzenleme yetkiniz yok')
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

    // İşlem güncelle ve kasa bakiyesini ayarla
    const transaction = await prisma.$transaction(async (tx) => {
      // Eski kasa bakiyesini geri al (eğer ödenmişse)
      if (existingTransaction.cashAccountId && existingTransaction.isPaid) {
        const oldBalanceChange = existingTransaction.type === 'INCOME' 
          ? -existingTransaction.amount 
          : existingTransaction.amount
        
        await tx.cashAccount.update({
          where: { id: existingTransaction.cashAccountId },
          data: {
            balance: {
              increment: oldBalanceChange
            }
          }
        })
      }

      // İşlemi güncelle - Faturaya bağlı işlemler için sadece kasa ve ödeme durumu
      const updateData: any = {
        cashAccountId: cashAccountId || null,
        isPaid: isPaid !== undefined ? isPaid : existingTransaction.isPaid,
        updatedAt: new Date(),
      }

      // Faturaya bağlı değilse diğer alanları da güncelle
      if (!isInvoiceTransaction) {
        if (type) updateData.type = type
        if (category) updateData.category = category
        if (amount !== undefined) {
          updateData.amount = typeof amount === 'number' ? amount : parseFloat(amount)
        }
        if (description !== undefined) updateData.description = description || null
        if (date) {
          updateData.date = date instanceof Date ? date : new Date(date)
        }
      }

      const updatedTransaction = await tx.transaction.update({
        where: { id: params.id },
        data: updateData
      })

      // Yeni kasa bakiyesini güncelle (eğer ödenmişse)
      if (cashAccountId && updatedTransaction.isPaid) {
        const amountValue = updatedTransaction.amount
        const newBalanceChange = updatedTransaction.type === 'INCOME' 
          ? amountValue 
          : -amountValue
        
        await tx.cashAccount.update({
          where: { id: cashAccountId },
          data: {
            balance: {
              increment: newBalanceChange
            }
          }
        })
      }

      // Faturaya bağlı işlemse fatura durumunu güncelle
      if (updatedTransaction.invoiceId) {
        const invoice = await tx.invoice.findUnique({
          where: { id: updatedTransaction.invoiceId }
        })
        
        if (invoice) {
          await updateInvoiceStatus(
            updatedTransaction.invoiceId,
            updatedTransaction.isPaid,
            invoice.dueDate,
            tx
          )
        }
      }

      return updatedTransaction
    }, {
      timeout: 10000, // 10 saniye timeout
    })

    // İşlem düzenlendiğinde bildirim gönder (sadece faturaya bağlı değilse)
    if (!existingTransaction.invoiceId) {
      createNotification({
        userId: session.user.id,
        companyId: session.user.companyId,
        type: 'TRANSACTION_EDITED',
        priority: 'LOW',
        title: 'İşlem Düzenlendi',
        message: `${transaction.type === 'INCOME' ? 'Gelir' : 'Gider'} işlemi güncellendi. Kategori: ${transaction.category}, Tutar: ₺${transaction.amount.toFixed(2)}`,
        link: `/transactions`,
        metadata: {
          transactionId: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          category: transaction.category,
        },
      }).catch((err) => console.error('İşlem düzenlendi bildirimi hatası:', err))
    }

    return NextResponse.json(transaction)
  } catch (error) {
    return handleApiError(error, 'PUT /api/transactions/[id]')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return ApiErrors.unauthorized()
    }

    // Mevcut işlemi getir
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        invoiceId: true,
        cashAccount: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!existingTransaction) {
      return ApiErrors.notFound('İşlem bulunamadı')
    }

    // Yetki kontrolü
    if (session.user.role !== 'SUPERADMIN' && existingTransaction.companyId !== session.user.companyId) {
      return ApiErrors.forbidden('Bu işlemi silme yetkiniz yok')
    }

    // İşlemi sil ve kasa bakiyesini geri al
    await prisma.$transaction(async (tx) => {
      // Eğer işlem ödenmişse ve kasa ile ilişkiliyse kasa bakiyesini geri al
      if (existingTransaction.cashAccountId && existingTransaction.isPaid) {
        const balanceChange = existingTransaction.type === 'INCOME' 
          ? -existingTransaction.amount 
          : existingTransaction.amount
        
        await tx.cashAccount.update({
          where: { id: existingTransaction.cashAccountId },
          data: {
            balance: {
              increment: balanceChange
            }
          }
        })
      }

      // Eğer işlem bir faturaya bağlıysa, faturayı da soft delete yap
      if (existingTransaction.invoiceId) {
        // Faturayı soft delete yap
        await tx.invoice.update({
          where: { id: existingTransaction.invoiceId },
          data: { isDeleted: true }
        })
      }

      // İşlemi soft delete yap
      await tx.transaction.update({
        where: { id: params.id },
        data: { isDeleted: true }
      })
    })

    // İşlem silindiğinde bildirim gönder
    if (!existingTransaction.invoiceId) {
      createNotification({
        userId: session.user.id,
        companyId: session.user.companyId,
        type: 'TRANSACTION_DELETED',
        priority: 'MEDIUM',
        title: 'İşlem Silindi',
        message: `${existingTransaction.type === 'INCOME' ? 'Gelir' : 'Gider'} işlemi silindi. Kategori: ${existingTransaction.category}, Tutar: ₺${existingTransaction.amount.toFixed(2)}`,
        link: '/transactions',
        metadata: {
          transactionId: existingTransaction.id,
          type: existingTransaction.type,
          amount: existingTransaction.amount,
          category: existingTransaction.category,
        },
      }).catch((err) => console.error('İşlem silindi bildirimi hatası:', err))
    }

    return NextResponse.json({ message: 'İşlem başarıyla silindi' })
  } catch (error) {
    console.error('Transaction delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 