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

    const cashAccount = await prisma.cashAccount.findUnique({
      where: { id: params.id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        transactions: {
          include: {
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
      return NextResponse.json({ error: 'Kasa bulunamadı' }, { status: 404 })
    }

    // Yetki kontrolü
    if (session.user.role !== 'SUPERADMIN' && cashAccount.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Bu kasaya erişim yetkiniz yok' }, { status: 403 })
    }

    return NextResponse.json(cashAccount)
  } catch (error) {
    console.error('Cash account fetch error:', error)
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
    const { name, type, description, isActive } = body

    const existingCashAccount = await prisma.cashAccount.findUnique({
      where: { id: params.id },
    })

    if (!existingCashAccount) {
      return NextResponse.json({ error: 'Kasa bulunamadı' }, { status: 404 })
    }

    // Yetki kontrolü
    if (session.user.role !== 'SUPERADMIN' && existingCashAccount.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Bu kasayı düzenleme yetkiniz yok' }, { status: 403 })
    }

    // Validation
    if (type && !['CASH', 'CREDIT_CARD', 'BANK_ACCOUNT'].includes(type)) {
      return NextResponse.json(
        { error: 'Geçersiz kasa türü' },
        { status: 400 }
      )
    }

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
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json(updatedCashAccount)
  } catch (error) {
    console.error('Cash account update error:', error)
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

    const existingCashAccount = await prisma.cashAccount.findUnique({
      where: { id: params.id },
      include: {
        transactions: true,
      },
    })

    if (!existingCashAccount) {
      return NextResponse.json({ error: 'Kasa bulunamadı' }, { status: 404 })
    }

    // Yetki kontrolü
    if (session.user.role !== 'SUPERADMIN' && existingCashAccount.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Bu kasayı silme yetkiniz yok' }, { status: 403 })
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
    console.error('Cash account delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
