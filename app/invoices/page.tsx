import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, FileText } from 'lucide-react'
import { InvoiceActions } from '@/components/invoice-actions'
import Link from 'next/link'

async function getInvoices(userId: string) {
  return await prisma.invoice.findMany({
    where: { userId },
    include: {
      clientInfo: true,
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function InvoicesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  const invoices = await getInvoices(session.user.id)

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Faturalar
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Faturalarınızı yönetin
            </p>
          </div>
          <Link href="/invoices/new">
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Yeni Fatura</span>
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Tüm Faturalar</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Henüz fatura yok
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  İlk faturanızı oluşturmak için aşağıdaki butona tıklayın.
                </p>
                <Link href="/invoices/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Fatura Oluştur
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fatura No</TableHead>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Vade</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.number}
                      </TableCell>
                      <TableCell>{invoice.clientInfo.name}</TableCell>
                      <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(invoice.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
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
                      </TableCell>
                      <TableCell className="text-right">
                        <InvoiceActions invoice={invoice} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
