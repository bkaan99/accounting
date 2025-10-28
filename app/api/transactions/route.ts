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

    // Süperadmin tüm işlemleri görebilir
    if (session.user.role === 'SUPERADMIN') {
      const transactions = await prisma.transaction.findMany({
        include: {
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
            }
          },
          invoice: {
            select: {
              id: true,
              number: true,
              client: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: { date: 'desc' },
      })

      return NextResponse.json(transactions)
    }

    // Admin ve User sadece kendi şirketinin işlemlerini görebilir
    if (session.user.companyId) {
      const transactions = await prisma.transaction.findMany({
        where: { companyId: session.user.companyId },
        include: {
          user: {
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
            }
          },
          invoice: {
            select: {
              id: true,
              number: true,
              client: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: { date: 'desc' },
      })

      return NextResponse.json(transactions)
    }

    return NextResponse.json([])
  } catch (error) {
    console.error('Transaction fetch error:', error)
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
    const { type, category, amount, description, date, cashAccountId, isPaid = false } = body

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

    // Kullanıcının şirketi yoksa işlem oluşturamaz
    if (!session.user.companyId) {
      return NextResponse.json(
        { error: 'Şirket bilgisi bulunamadı' },
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
          companyId: session.user.companyId,
          cashAccountId: cashAccountId || null,
          type,
          category,
          amount: parseFloat(amount),
          description: description || null,
          date: new Date(date),
          isPaid,
        }
      })

      // Eğer kasa seçildiyse ve işlem ödendiyse kasa bakiyesini güncelle
      if (cashAccountId && isPaid) {
        const balanceChange = type === 'INCOME' ? parseFloat(amount) : -parseFloat(amount)
        
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

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('Transaction creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 