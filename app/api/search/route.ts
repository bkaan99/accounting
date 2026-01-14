import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, getCompanyWhereClause, isSuperAdmin } from '@/lib/auth-helpers'
import { handleApiError } from '@/lib/error-handler'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ('response' in authResult) {
      return authResult.response
    }
    const { session } = authResult

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '5', 10)

    if (!query || query.length < 2) {
      return NextResponse.json({
        invoices: [],
        clients: [],
        transactions: [],
        cashAccounts: [],
      })
    }

    const searchTerm = query.toLowerCase()
    const companyWhere = getCompanyWhereClause(session)

    // Faturalar
    const invoices = await prisma.invoice.findMany({
      where: {
        ...companyWhere,
        OR: [
          { number: { contains: searchTerm, mode: 'insensitive' } },
          {
            client: {
              name: { contains: searchTerm, mode: 'insensitive' },
            },
          },
        ],
        ...(session.user.role !== 'SUPERADMIN' && { isDeleted: false }),
      },
      select: {
        id: true,
        number: true,
        totalAmount: true,
        status: true,
        client: {
          select: {
            name: true,
          },
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    // Tedarikçiler
    const clients = await prisma.client.findMany({
      where: {
        ...companyWhere,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } },
        ],
        ...(session.user.role !== 'SUPERADMIN' && { isDeleted: false }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    // İşlemler
    const transactions = await prisma.transaction.findMany({
      where: {
        ...companyWhere,
        OR: [
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { category: { contains: searchTerm, mode: 'insensitive' } },
        ],
        ...(session.user.role !== 'SUPERADMIN' && { isDeleted: false }),
      },
      select: {
        id: true,
        type: true,
        category: true,
        amount: true,
        description: true,
        date: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    // Kasalar
    const cashAccounts = await prisma.cashAccount.findMany({
      where: {
        ...companyWhere,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        type: true,
        balance: true,
        description: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      invoices: invoices.map((inv) => ({
        id: inv.id,
        number: inv.number,
        amount: inv.totalAmount,
        status: inv.status,
        clientName: inv.client.name,
        type: 'invoice',
      })),
      clients: clients.map((client) => ({
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        type: 'client',
      })),
      transactions: transactions.map((txn) => ({
        id: txn.id,
        transactionType: txn.type,
        category: txn.category,
        amount: txn.amount,
        description: txn.description,
        date: txn.date,
        type: 'transaction',
      })),
      cashAccounts: cashAccounts.map((account) => ({
        id: account.id,
        name: account.name,
        accountType: account.type,
        balance: account.balance,
        description: account.description,
        type: 'cashAccount',
      })),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

