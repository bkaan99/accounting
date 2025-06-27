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
import { formatDate } from '@/lib/utils'
import { UserCog, Users, Building2, Mail, Phone } from 'lucide-react'

async function getAllUsers() {
  return await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      phone: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          clients: true,
          invoices: true,
          transactions: true,
        },
      },
    },
  })
}

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.role !== 'SUPERADMIN') {
    redirect('/dashboard')
  }

  const users = await getAllUsers()

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <UserCog className="h-8 w-8 text-blue-600" />
            <span>Kullanıcı Yönetimi</span>
          </h1>
          <p className="text-gray-600">
            Tüm kullanıcıları görüntüleyin ve yönetin
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Toplam Kullanıcı
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {users.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Süperadmin</CardTitle>
              <UserCog className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {users.filter((u) => u.role === 'SUPERADMIN').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Aktif Şirket
              </CardTitle>
              <Building2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {users.filter((u) => u.company).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tüm Kullanıcılar</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>İletişim</TableHead>
                  <TableHead>Şirket</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>İstatistikler</TableHead>
                  <TableHead>Kayıt Tarihi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-600 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.phone && (
                        <div className="text-sm text-gray-600 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {user.phone}
                        </div>
                      )}
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
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div>{user._count.clients} müşteri</div>
                        <div>{user._count.invoices} fatura</div>
                        <div>{user._count.transactions} işlem</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
