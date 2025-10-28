import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const transaction = await prisma.transaction.findUnique({
      where: { 
        id: params.id,
        userId: session.user.id,
      }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Transaction fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, category, amount, description, date, cashAccountId, isPaid } = body

    // Validation
    if (!type || !category || !amount || !date) {
      return NextResponse.json(
        { error: 'Tüm gerekli alanları doldurunuz' },
        { status: 400 }
      )
    }

    if (!['INCOME', 'EXPENSE'].includes(type)) {
      return NextResponse.json(
        { error: 'Geçersiz işlem türü' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Tutar pozitif olmalıdır' },
        { status: 400 }
      )
    }

    // Mevcut işlemi getir
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: params.id },
      include: { cashAccount: true },
    })

    if (!existingTransaction) {
      return NextResponse.json({ error: 'İşlem bulunamadı' }, { status: 404 })
    }

    // Yetki kontrolü
    if (session.user.role !== 'SUPERADMIN' && existingTransaction.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Bu işlemi düzenleme yetkiniz yok' }, { status: 403 })
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

      // İşlemi güncelle
      const updatedTransaction = await tx.transaction.update({
        where: { id: params.id },
        data: {
          type,
          category,
          amount: parseFloat(amount),
          description: description || null,
          date: new Date(date),
          cashAccountId: cashAccountId || null,
          isPaid: isPaid !== undefined ? isPaid : existingTransaction.isPaid,
          updatedAt: new Date(),
        }
      })

      // Yeni kasa bakiyesini güncelle (eğer ödenmişse)
      if (cashAccountId && updatedTransaction.isPaid) {
        const newBalanceChange = updatedTransaction.type === 'INCOME' 
          ? updatedTransaction.amount 
          : -updatedTransaction.amount
        
        await tx.cashAccount.update({
          where: { id: cashAccountId },
          data: {
            balance: {
              increment: newBalanceChange
            }
          }
        })
      }

      return updatedTransaction
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Transaction update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mevcut işlemi getir
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: params.id },
      include: { cashAccount: true },
    })

    if (!existingTransaction) {
      return NextResponse.json({ error: 'İşlem bulunamadı' }, { status: 404 })
    }

    // Yetki kontrolü
    if (session.user.role !== 'SUPERADMIN' && existingTransaction.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Bu işlemi silme yetkiniz yok' }, { status: 403 })
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

      // Eğer işlem bir faturaya bağlıysa, faturayı da sil
      if (existingTransaction.invoiceId) {
        // Önce fatura item'larını sil
        await tx.invoiceItem.deleteMany({
          where: { invoiceId: existingTransaction.invoiceId }
        })
        
        // Sonra faturayı sil
        await tx.invoice.delete({
          where: { id: existingTransaction.invoiceId }
        })
      }

      // İşlemi sil
      await tx.transaction.delete({
        where: { id: params.id }
      })
    })

    return NextResponse.json({ message: 'İşlem başarıyla silindi' })
  } catch (error) {
    console.error('Transaction delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 