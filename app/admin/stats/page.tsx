import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate, formatCurrency } from '@/lib/utils'
import {
  BarChart3,
  Users,
  Building2,
  TrendingUp,
  TrendingDown,
  FileText,
  DollarSign,
} from 'lucide-react'

async function getGlobalStats() {
  const [
    totalUsers,
    totalClients,
    totalInvoices,
    totalTransactions,
    totalIncome,
    totalExpenses,
    recentUsers,
    topCompanies,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.client.count(),
    prisma.invoice.count(),
    prisma.transaction.count(),
    prisma.transaction.aggregate({
      where: { type: 'INCOME' },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: 'EXPENSE' },
      _sum: { amount: true },
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.user.findMany({
      where: { company: { not: null } },
      select: {
        company: true,
        _count: {
          select: {
            invoices: true,
            transactions: true,
            clients: true,
          },
        },
      },
      orderBy: {
        invoices: {
          _count: 'desc',
        },
      },
      take: 5,
    }),
  ])

  return {
    totalUsers,
    totalClients,
    totalInvoices,
    totalTransactions,
    totalIncome: totalIncome._sum.amount || 0,
    totalExpenses: totalExpenses._sum.amount || 0,
    recentUsers,
    topCompanies,
  }
}

export default async function AdminStatsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.role !== 'SUPERADMIN') {
    redirect('/dashboard')
  }

  const stats = await getGlobalStats()
  const netIncome = stats.totalIncome - stats.totalExpenses

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <span>Global İstatistikler</span>
          </h1>
          <p className="text-gray-600">
            Sistemdeki tüm kullanıcılar ve iş verilerinin özeti
          </p>
        </div>

        {/* Genel Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Toplam Kullanıcı
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalUsers}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Toplam Tedarikçi
              </CardTitle>
              <Building2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.totalClients}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Toplam Fatura
              </CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.totalInvoices}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Toplam İşlem
              </CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.totalTransactions}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mali Durum */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Toplam Gelir
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalIncome)}
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
                {formatCurrency(stats.totalExpenses)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Net Kar/Zarar
              </CardTitle>
              <DollarSign
                className={`h-4 w-4 ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}
              />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {formatCurrency(netIncome)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Son Kayıt Olan Kullanıcılar */}
          <Card>
            <CardHeader>
              <CardTitle>Son Kayıt Olan Kullanıcılar</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>Şirket</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Tarih</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-600">
                            {user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.company && (
                          <div className="text-sm flex items-center">
                            <Building2 className="h-3 w-3 mr-1" />
                            {user.company}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            user.role === 'SUPERADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : user.role === 'ADMIN'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.role === 'SUPERADMIN'
                            ? 'Süperadmin'
                            : user.role === 'ADMIN'
                              ? 'Admin'
                              : 'Kullanıcı'}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* En Aktif Şirketler */}
          <Card>
            <CardHeader>
              <CardTitle>En Aktif Şirketler</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Şirket</TableHead>
                    <TableHead>Tedarikçi</TableHead>
                    <TableHead>Fatura</TableHead>
                    <TableHead>İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topCompanies.map((company, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="font-medium flex items-center">
                          <Building2 className="h-4 w-4 mr-2" />
                          {company.company}
                        </div>
                      </TableCell>
                      <TableCell>{company._count.clients}</TableCell>
                      <TableCell>{company._count.invoices}</TableCell>
                      <TableCell>{company._count.transactions}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
