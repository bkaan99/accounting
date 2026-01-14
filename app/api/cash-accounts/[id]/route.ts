import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CashAccountUpdateSchema } from '@/lib/validations'
import { handleApiError, ApiErrors } from '@/lib/error-handler'
import { checkCashAccountAccess } from '@/lib/auth-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accessResult = await checkCashAccountAccess(params.id)
    if ('response' in accessResult) {
      return accessResult.response
    }
    const { session } = accessResult

    const cashAccount = await prisma.cashAccount.findUnique({
      where: { id: params.id },
      select: {
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
            category: true,
            amount: true,
            description: true,
            date: true,
            isPaid: true,
            invoiceId: true,
            user: {
              select: {
                id: true,
                name: true,
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
          },
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!cashAccount) {
      return ApiErrors.notFound('Kasa bulunamadı')
    }

    return NextResponse.json(cashAccount)
  } catch (error) {
    return handleApiError(error, 'GET /api/cash-accounts/[id]')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accessResult = await checkCashAccountAccess(params.id)
    if ('response' in accessResult) {
      return accessResult.response
    }
    const { session, cashAccount: existingCashAccount } = accessResult

    const body = await request.json()
    
    // Zod validation
    const validatedData = CashAccountUpdateSchema.parse(body)
    const { name, type, description, isActive } = validatedData

    // Aynı isimde başka kasa var mı kontrol et
    if (name && name !== existingCashAccount.name) {
      const duplicateCashAccount = await prisma.cashAccount.findFirst({
        where: {
          companyId: existingCashAccount.companyId,
          name: name,
          isActive: true,
          id: { not: params.id },
        },
      })

      if (duplicateCashAccount) {
        return NextResponse.json(
          { error: 'Bu isimde bir kasa zaten mevcut' },
          { status: 400 }
        )
      }
    }

    const updatedCashAccount = await prisma.cashAccount.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(description !== undefined && { description: description === null ? null : description }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json(updatedCashAccount)
  } catch (error) {
    return handleApiError(error, 'PUT /api/cash-accounts/[id]')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accessResult = await checkCashAccountAccess(params.id)
    if ('response' in accessResult) {
      return accessResult.response
    }
    const { session } = accessResult

    const existingCashAccount = await prisma.cashAccount.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        companyId: true,
        transactions: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!existingCashAccount) {
      return ApiErrors.notFound('Kasa bulunamadı')
    }

    // Eğer kasa ile ilişkili işlemler varsa, kasayı pasif yap ve işlemleri temizle
    if (existingCashAccount.transactions.length > 0) {
      await prisma.$transaction(async (tx) => {
        // Kasa ile ilişkili işlemlerin cashAccountId'sini null yap
        await tx.transaction.updateMany({
          where: { cashAccountId: params.id },
          data: { 
            cashAccountId: null,
            isPaid: false // Ödeme durumunu da sıfırla
          },
        })

        // Kasayı pasif yap
        await tx.cashAccount.update({
          where: { id: params.id },
          data: { isActive: false },
        })
      })

      return NextResponse.json({ 
        message: 'Kasa pasif hale getirildi ve ilişkili işlemler temizlendi',
        affectedTransactions: existingCashAccount.transactions.length
      })
    }

    // İlişkili işlem yoksa kasayı sil
    await prisma.cashAccount.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Kasa başarıyla silindi' })
  } catch (error) {
    return handleApiError(error, 'DELETE /api/cash-accounts/[id]')
  }
}
