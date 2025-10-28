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
    const { type, category, amount, description, date } = body

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

    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        companyId: session.user.companyId,
        type,
        category,
        amount: parseFloat(amount),
        description: description || null,
        date: new Date(date),
      }
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