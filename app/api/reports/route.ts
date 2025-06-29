import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get('months') || '6') // Default 6 months

    // Get date range for the last N months
    const endDate = new Date()
    const startDate = subMonths(endDate, months - 1)

    // Monthly Income/Expense Data
    const monthlyData = []
    for (let i = 0; i < months; i++) {
      const monthDate = subMonths(endDate, months - 1 - i)
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)

      const [income, expense] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            userId: session.user.id,
            type: 'INCOME',
            date: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            userId: session.user.id,
            type: 'EXPENSE',
            date: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
          _sum: { amount: true },
        }),
      ])

      monthlyData.push({
        month: format(monthDate, 'MMM yyyy'),
        income: income._sum.amount || 0,
        expense: expense._sum.amount || 0,
        profit: (income._sum.amount || 0) - (expense._sum.amount || 0),
      })
    }

    // Expense Categories Distribution
    const expenseCategories = await prisma.transaction.groupBy({
      by: ['category'],
      where: {
        userId: session.user.id,
        type: 'EXPENSE',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { amount: true },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
    })

    const categoryData = expenseCategories.map((item) => ({
      category: item.category,
      amount: item._sum.amount || 0,
    }))

    // Invoice Status Distribution
    const invoiceStatus = await prisma.invoice.groupBy({
      by: ['status'],
      where: {
        userId: session.user.id,
      },
      _count: { id: true },
      _sum: { totalAmount: true },
    })

    const statusData = invoiceStatus.map((item) => ({
      status: item.status,
      count: item._count.id,
      amount: item._sum.totalAmount || 0,
    }))

    // Top Clients by Revenue
    const topClients = await prisma.invoice.groupBy({
      by: ['clientId'],
      where: {
        userId: session.user.id,
        status: 'PAID',
      },
      _sum: { totalAmount: true },
      orderBy: {
        _sum: {
          totalAmount: 'desc',
        },
      },
      take: 10,
    })

    // Get client names
    const clientIds = topClients.map((item) => item.clientId)
    const clients = await prisma.client.findMany({
      where: {
        id: { in: clientIds },
      },
      select: {
        id: true,
        name: true,
      },
    })

    const clientMap = clients.reduce((acc, client) => {
      acc[client.id] = client.name
      return acc
    }, {} as Record<string, string>)

    const clientData = topClients.map((item) => ({
      clientName: clientMap[item.clientId] || 'Bilinmeyen Müşteri',
      revenue: item._sum.totalAmount || 0,
    }))

    // Recent Trends (compare current month with previous month)
    const currentMonth = new Date()
    const previousMonth = subMonths(currentMonth, 1)

    const [currentMonthStats, previousMonthStats] = await Promise.all([
      Promise.all([
        prisma.transaction.aggregate({
          where: {
            userId: session.user.id,
            type: 'INCOME',
            date: {
              gte: startOfMonth(currentMonth),
              lte: endOfMonth(currentMonth),
            },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            userId: session.user.id,
            type: 'EXPENSE',
            date: {
              gte: startOfMonth(currentMonth),
              lte: endOfMonth(currentMonth),
            },
          },
          _sum: { amount: true },
        }),
      ]),
      Promise.all([
        prisma.transaction.aggregate({
          where: {
            userId: session.user.id,
            type: 'INCOME',
            date: {
              gte: startOfMonth(previousMonth),
              lte: endOfMonth(previousMonth),
            },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            userId: session.user.id,
            type: 'EXPENSE',
            date: {
              gte: startOfMonth(previousMonth),
              lte: endOfMonth(previousMonth),
            },
          },
          _sum: { amount: true },
        }),
      ]),
    ])

    const currentIncome = currentMonthStats[0]._sum.amount || 0
    const currentExpense = currentMonthStats[1]._sum.amount || 0
    const previousIncome = previousMonthStats[0]._sum.amount || 0
    const previousExpense = previousMonthStats[1]._sum.amount || 0

    const trends = {
      incomeChange: previousIncome > 0 ? ((currentIncome - previousIncome) / previousIncome) * 100 : 0,
      expenseChange: previousExpense > 0 ? ((currentExpense - previousExpense) / previousExpense) * 100 : 0,
      profitChange: {
        current: currentIncome - currentExpense,
        previous: previousIncome - previousExpense,
      },
    }

    return NextResponse.json({
      monthlyData,
      categoryData,
      statusData,
      clientData,
      trends,
      summary: {
        totalIncome: monthlyData.reduce((sum, month) => sum + month.income, 0),
        totalExpense: monthlyData.reduce((sum, month) => sum + month.expense, 0),
        totalProfit: monthlyData.reduce((sum, month) => sum + month.profit, 0),
        averageMonthlyIncome: monthlyData.reduce((sum, month) => sum + month.income, 0) / months,
        averageMonthlyExpense: monthlyData.reduce((sum, month) => sum + month.expense, 0) / months,
      },
    })
  } catch (error) {
    console.error('Reports API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 