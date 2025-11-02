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
  UserCog,
} from 'lucide-react'

async function getCompanyStats(userId: string, userRole: string, userCompanyId: string | undefined) {
  let whereClause = {}

  // ADMIN ise sadece kendi şirketindeki verileri getir
  if (userRole === 'ADMIN') {
    whereClause = { userId }
  }

  // SUPERADMIN ise tüm verileri getir
  if (userRole === 'SUPERADMIN') {
    whereClause = {}
  }

  const [
    totalEmployees,
    totalClients,
    totalInvoices,
    totalTransactions,
    totalIncome,
    totalExpenses,
    recentEmployees,
    topEmployees,
  ] = await Promise.all([
    // Çalışan sayısı
    prisma.user.count({
      where: userRole === 'ADMIN' 
        ? { role: 'USER', companyId: userCompanyId } // ADMIN için sadece kendi şirketindeki USER'lar
        : { role: { in: ['USER', 'ADMIN'] } } // SUPERADMIN için USER ve ADMIN
    } as any),
    
    // Tedarikçi sayısı
    prisma.client.count({
      where: userRole === 'ADMIN' ? { userId } : {}
    }),
    
    // Fatura sayısı
    prisma.invoice.count({
      where: userRole === 'ADMIN' ? { userId } : {}
    }),
    
    // İşlem sayısı
    prisma.transaction.count({
      where: userRole === 'ADMIN' ? { userId } : {}
    }),
    
    // Toplam gelir
    prisma.transaction.aggregate({
      where: {
        type: 'INCOME',
        ...(userRole === 'ADMIN' ? { userId } : {})
      },
      _sum: { amount: true },
    }),
    
    // Toplam gider
    prisma.transaction.aggregate({
      where: {
        type: 'EXPENSE',
        ...(userRole === 'ADMIN' ? { userId } : {})
      },
      _sum: { amount: true },
    }),
    
    // Son eklenen çalışanlar
    prisma.user.findMany({
      where: userRole === 'ADMIN' 
        ? { role: 'USER', companyId: userCompanyId } // ADMIN için sadece kendi şirketindeki USER'lar
        : { role: { in: ['USER', 'ADMIN'] } }, // SUPERADMIN için USER ve ADMIN
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            invoices: true,
            transactions: true,
            clients: true,
          },
        },
      },
    } as any),
    
    // En aktif çalışanlar
    prisma.user.findMany({
      where: userRole === 'ADMIN' 
        ? { role: 'USER', companyId: userCompanyId } // ADMIN için sadece kendi şirketindeki USER'lar
        : { role: { in: ['USER', 'ADMIN'] } }, // SUPERADMIN için USER ve ADMIN
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: {
          select: {
            invoices: true,
            transactions: true,
            clients: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    } as any),
  ])

  return {
    totalEmployees,
    totalClients,
    totalInvoices,
    totalTransactions,
    totalIncome: totalIncome._sum.amount || 0,
    totalExpenses: totalExpenses._sum.amount || 0,
    recentEmployees,
    topEmployees,
  }
}

export default async function AdminCompanyStatsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || !session.user.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
    redirect('/dashboard')
  }

  const stats = await getCompanyStats(session.user.id, session.user.role, session.user.companyId)
  const netIncome = stats.totalIncome - stats.totalExpenses

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <span>
              {session.user.role === 'ADMIN' ? 'Şirket İstatistikleri' : 'Global İstatistikler'}
            </span>
          </h1>
          <p className="text-gray-600">
            {session.user.role === 'ADMIN' 
              ? 'Şirketinizin çalışanları ve iş verilerinin özeti'
              : 'Sistemdeki tüm kullanıcılar ve iş verilerinin özeti'
            }
          </p>
        </div>

        {/* Genel Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {session.user.role === 'ADMIN' ? 'Toplam Çalışan' : 'Toplam Kullanıcı'}
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalEmployees}
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
          {/* Son Eklenen Çalışanlar */}
          <Card>
            <CardHeader>
              <CardTitle>Son Eklenen Çalışanlar</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Çalışan</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Tarih</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-sm text-gray-600">
                            {employee.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            employee.role === 'ADMIN'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {employee.role === 'ADMIN' ? 'Yönetici' : 'Çalışan'}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(employee.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* En Aktif Çalışanlar */}
          <Card>
            <CardHeader>
              <CardTitle>En Aktif Çalışanlar</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Çalışan</TableHead>
                    <TableHead>Tedarikçi</TableHead>
                    <TableHead>Fatura</TableHead>
                    <TableHead>İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="font-medium flex items-center">
                          <UserCog className="h-4 w-4 mr-2" />
                          {employee.name}
                        </div>
                      </TableCell>
                      <TableCell>{(employee as any)._count.clients}</TableCell>
                      <TableCell>{(employee as any)._count.invoices}</TableCell>
                      <TableCell>{(employee as any)._count.transactions}</TableCell>
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
