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
  AlertTriangle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

async function getDashboardData(userId: string, companyId?: string, userRole?: string) {
  const now = new Date()
  
  // Süperadmin tüm verileri görebilir, diğerleri şirket bazlı
  const transactionWhere: any = { isDeleted: false }
  const invoiceWhere: any = { isDeleted: false }
  const clientWhere: any = {}
  const cashAccountWhere: any = { isActive: true }

  if (userRole !== 'SUPERADMIN') {
    if (companyId) {
      transactionWhere.companyId = companyId
      invoiceWhere.companyId = companyId
      clientWhere.companyId = companyId
      cashAccountWhere.companyId = companyId
    } else {
      // Şirketi yoksa boş sonuç döndür
      transactionWhere.companyId = null
      invoiceWhere.companyId = null
      clientWhere.companyId = null
      cashAccountWhere.companyId = null
    }
  }
  
  const [
    totalIncome,
    totalExpenses,
    totalInvoices,
    totalClients,
    recentTransactions,
    recentInvoices,
    overdueInvoices,
    dueSoonInvoices,
    cashAccounts,
  ] = await Promise.all([
    prisma.transaction.aggregate({
      where: { ...transactionWhere, type: 'INCOME' },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...transactionWhere, type: 'EXPENSE' },
      _sum: { amount: true },
    }),
    prisma.invoice.count({
      where: invoiceWhere,
    }),
    prisma.client.count({
      where: clientWhere,
    }),
    prisma.transaction.findMany({
      where: transactionWhere,
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.invoice.findMany({
      where: invoiceWhere,
      select: {
        id: true,
        number: true,
        clientId: true,
        totalAmount: true,
        status: true,
        dueDate: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    // Gecikmiş faturalar
    prisma.invoice.findMany({
      where: {
        ...invoiceWhere,
        status: { in: ['DRAFT', 'SENT', 'UNPAID'] },
        dueDate: { lt: now },
      },
      select: {
        id: true,
        number: true,
        clientId: true,
        totalAmount: true,
        status: true,
        dueDate: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    }),
    // Vadesi yaklaşan faturalar (7 gün içinde)
    prisma.invoice.findMany({
      where: {
        ...invoiceWhere,
        status: { in: ['DRAFT', 'SENT', 'UNPAID'] },
        dueDate: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
      },
      select: {
        id: true,
        number: true,
        clientId: true,
        totalAmount: true,
        status: true,
        dueDate: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    }),
    // Kasa hesapları (düşük bakiye kontrolü için)
    prisma.cashAccount.findMany({
      where: cashAccountWhere,
    }),
  ])

  // Düşük ve negatif bakiyeleri kontrol et
  const lowBalanceAccounts = cashAccounts.filter((acc: any) => acc.balance < 1000 && acc.balance >= 0)
  const negativeBalanceAccounts = cashAccounts.filter((acc: any) => acc.balance < 0)

  return {
    totalIncome: totalIncome._sum.amount || 0,
    totalExpenses: totalExpenses._sum.amount || 0,
    totalInvoices,
    totalClients,
    recentTransactions,
    recentInvoices,
    overdueInvoices,
    dueSoonInvoices,
    lowBalanceAccounts,
    negativeBalanceAccounts,
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  const dashboardData = await getDashboardData(session.user.id, session.user.companyId, session.user.role)
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
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

        {/* Kritik Uyarılar Widget */}
        {(dashboardData.overdueInvoices.length > 0 ||
          dashboardData.dueSoonInvoices.length > 0 ||
          dashboardData.negativeBalanceAccounts.length > 0 ||
          dashboardData.lowBalanceAccounts.length > 0) && (
          <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Kritik Uyarılar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Gecikmiş Faturalar */}
              {dashboardData.overdueInvoices.length > 0 && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-300 dark:border-red-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="font-semibold text-red-800 dark:text-red-300">
                        {dashboardData.overdueInvoices.length} Gecikmiş Fatura
                      </span>
                    </div>
                    <Link href="/invoices?filter=overdue">
                      <Button variant="outline" size="sm" className="text-xs">
                        Görüntüle <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-400">
                    {dashboardData.overdueInvoices.slice(0, 3).map((invoice: any) => (
                      <div key={invoice.id} className="flex items-center justify-between py-1">
                        <span>{invoice.number}</span>
                        <span className="font-medium">{formatCurrency(invoice.totalAmount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vadesi Yaklaşan Faturalar */}
              {dashboardData.dueSoonInvoices.length > 0 && (
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg border border-orange-300 dark:border-orange-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      <span className="font-semibold text-orange-800 dark:text-orange-300">
                        {dashboardData.dueSoonInvoices.length} Fatura Vadesi Yaklaşıyor
                      </span>
                    </div>
                    <Link href="/invoices">
                      <Button variant="outline" size="sm" className="text-xs">
                        Görüntüle <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                  <div className="text-sm text-orange-700 dark:text-orange-400">
                    {dashboardData.dueSoonInvoices.slice(0, 3).map((invoice: any) => (
                      <div key={invoice.id} className="flex items-center justify-between py-1">
                        <span>
                          {invoice.number} - {formatDate(invoice.dueDate)}
                        </span>
                        <span className="font-medium">{formatCurrency(invoice.totalAmount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Negatif Bakiye */}
              {dashboardData.negativeBalanceAccounts.length > 0 && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-300 dark:border-red-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="font-semibold text-red-800 dark:text-red-300">
                        {dashboardData.negativeBalanceAccounts.length} Kasa Negatif Bakiyede
                      </span>
                    </div>
                    <Link href="/cash-accounts">
                      <Button variant="outline" size="sm" className="text-xs">
                        Görüntüle <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-400">
                    {dashboardData.negativeBalanceAccounts.slice(0, 3).map((account: any) => (
                      <div key={account.id} className="flex items-center justify-between py-1">
                        <span>{account.name}</span>
                        <span className="font-medium text-red-600">
                          {formatCurrency(account.balance)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Düşük Bakiye */}
              {dashboardData.lowBalanceAccounts.length > 0 && (
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-300 dark:border-yellow-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="font-semibold text-yellow-800 dark:text-yellow-300">
                        {dashboardData.lowBalanceAccounts.length} Kasa Düşük Bakiyede
                      </span>
                    </div>
                    <Link href="/cash-accounts">
                      <Button variant="outline" size="sm" className="text-xs">
                        Görüntüle <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-400">
                    {dashboardData.lowBalanceAccounts.slice(0, 3).map((account: any) => (
                      <div key={account.id} className="flex items-center justify-between py-1">
                        <span>{account.name}</span>
                        <span className="font-medium">{formatCurrency(account.balance)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Son İşlemler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recentTransactions.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    Henüz işlem bulunmuyor
                  </p>
                ) : (
                  dashboardData.recentTransactions.map((transaction: any) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{transaction.category}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {formatDate(transaction.date)}
                        </p>
                      </div>
                      <div
                        className={`font-bold ${
                          transaction.type === 'INCOME'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
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
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    Henüz fatura bulunmuyor
                  </p>
                ) : (
                  dashboardData.recentInvoices.map((invoice: any) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{invoice.number}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {invoice.client.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {formatDate(invoice.dueDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-gray-100">
                          {formatCurrency(invoice.totalAmount)}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            invoice.status === 'PAID'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : invoice.status === 'SENT'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                : invoice.status === 'OVERDUE'
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
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
