import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Users,
  Clock,
} from 'lucide-react'

async function getDashboardData(userId: string, companyId?: string) {
  const whereClause = companyId ? { companyId } : { userId }
  
  const [
    totalIncome,
    totalExpenses,
    totalInvoices,
    totalClients,
    recentTransactions,
    recentInvoices,
  ] = await Promise.all([
    prisma.transaction.aggregate({
      where: { ...whereClause, type: 'INCOME' },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...whereClause, type: 'EXPENSE' },
      _sum: { amount: true },
    }),
    prisma.invoice.count({
      where: whereClause,
    }),
    prisma.client.count({
      where: whereClause,
    }),
    prisma.transaction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.invoice.findMany({
      where: whereClause,
      include: { client: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  return {
    totalIncome: totalIncome._sum.amount || 0,
    totalExpenses: totalExpenses._sum.amount || 0,
    totalInvoices,
    totalClients,
    recentTransactions,
    recentInvoices,
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  const dashboardData = await getDashboardData(session.user.id, session.user.companyId)
  const profit = dashboardData.totalIncome - dashboardData.totalExpenses

  // Calculate uptime (assuming app started when this process started)
  const startTime = process.uptime()
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (days > 0) {
      return `${days}g ${hours}s ${minutes}d`
    } else if (hours > 0) {
      return `${hours}s ${minutes}d`
    } else {
      return `${minutes}d`
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            İşletmenizin genel durumunu görüntüleyin
          </p>
        </div>

        {/* Stats Cards */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${
            session.user.role === 'SUPERADMIN'
              ? 'lg:grid-cols-5'
              : 'lg:grid-cols-4'
          }`}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Toplam Gelir
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(dashboardData.totalIncome)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Toplam Gider
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(dashboardData.totalExpenses)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Kar</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  profit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(profit)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Toplam Tedarikçi
              </CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {dashboardData.totalClients}
              </div>
            </CardContent>
          </Card>

          {session.user.role === 'SUPERADMIN' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Çalışma Süresi
                </CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatUptime(startTime)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Uygulama başlangıcından beri
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Son İşlemler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recentTransactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Henüz işlem bulunmuyor
                  </p>
                ) : (
                  dashboardData.recentTransactions.map((transaction: any) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{transaction.category}</p>
                        <p className="text-sm text-gray-600">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(transaction.date)}
                        </p>
                      </div>
                      <div
                        className={`font-bold ${
                          transaction.type === 'INCOME'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          <Card>
            <CardHeader>
              <CardTitle>Son Faturalar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recentInvoices.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Henüz fatura bulunmuyor
                  </p>
                ) : (
                  dashboardData.recentInvoices.map((invoice: any) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{invoice.number}</p>
                        <p className="text-sm text-gray-600">
                          {invoice.client.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(invoice.dueDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {formatCurrency(invoice.totalAmount)}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            invoice.status === 'PAID'
                              ? 'bg-green-100 text-green-800'
                              : invoice.status === 'SENT'
                                ? 'bg-blue-100 text-blue-800'
                                : invoice.status === 'OVERDUE'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {invoice.status === 'PAID'
                            ? 'Ödendi'
                            : invoice.status === 'SENT'
                              ? 'Gönderildi'
                              : invoice.status === 'OVERDUE'
                                ? 'Gecikmiş'
                                : 'Taslak'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
