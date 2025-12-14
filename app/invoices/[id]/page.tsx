'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
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
import { 
  ArrowLeft, 
  Edit, 
  Download, 
  FileText, 
  User, 
  Calendar, 
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle
} from 'lucide-react'
import Link from 'next/link'
import { downloadInvoicePDF } from '@/lib/pdf-generator'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  price: number
  total: number
}

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  taxId?: string
}

interface Invoice {
  id: string
  number: string
  issueDate: string
  dueDate: string
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE'
  subtotal: number
  taxAmount: number
  totalAmount: number
  notes?: string
  client: Client
  items: InvoiceItem[]
  createdAt: string
  updatedAt: string
}

export default function InvoiceDetailPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchInvoice()
    }
  }, [status, params.id])

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setInvoice(data)
      } else if (response.status === 404) {
        router.push('/invoices')
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'SENT':
        return <Clock className="h-5 w-5 text-blue-600" />
      case 'OVERDUE':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <XCircle className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Ödendi'
      case 'SENT':
        return 'Gönderildi'
      case 'OVERDUE':
        return 'Gecikmiş'
      default:
        return 'Taslak'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'SENT':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'OVERDUE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const handleDownloadPDF = () => {
    if (invoice) {
      downloadInvoicePDF({
        number: invoice.number,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        status: invoice.status,
        totalAmount: invoice.totalAmount,
        notes: invoice.notes,
        clientInfo: {
          name: invoice.client.name,
          email: invoice.client.email,
          phone: invoice.client.phone,
          address: invoice.client.address,
        },
        items: invoice.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
      })
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Yükleniyor...</div>
        </div>
      </MainLayout>
    )
  }

  if (!invoice) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Fatura bulunamadı
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Aradığınız fatura mevcut değil veya erişim yetkiniz yok.
            </p>
            <Link href="/invoices">
              <Button>Faturaları Görüntüle</Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/invoices">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Geri
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {invoice.number}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Fatura Detayları
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link href={`/invoices/${invoice.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Düzenle
              </Button>
            </Link>
            <Button onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF İndir
            </Button>
          </div>
        </div>

        {/* Fatura Bilgileri */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Tedarikçi Bilgileri */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Tedarikçi Bilgileri</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {invoice.client.name}
                    </span>
                  </div>
                  {invoice.client.email && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      📧 {invoice.client.email}
                    </div>
                  )}
                  {invoice.client.phone && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      📞 {invoice.client.phone}
                    </div>
                  )}
                  {invoice.client.address && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      📍 {invoice.client.address}
                    </div>
                  )}
                  {invoice.client.taxId && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      🆔 Vergi No: {invoice.client.taxId}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Fatura Kalemleri */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Fatura Kalemleri</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Açıklama</TableHead>
                      <TableHead className="text-right">Miktar</TableHead>
                      <TableHead className="text-right">Birim Fiyat</TableHead>
                      <TableHead className="text-right">Toplam</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.description}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.price)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Notlar */}
            {invoice.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notlar</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">
                    {invoice.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sağ Panel - Fatura Özeti */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Fatura Özeti</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Ara Toplam:</span>
                  <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">KDV:</span>
                  <span className="font-medium">{formatCurrency(invoice.taxAmount)}</span>
                </div>
                <hr className="border-gray-200 dark:border-gray-700" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Toplam:</span>
                  <span className="text-blue-600">{formatCurrency(invoice.totalAmount)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Fatura Bilgileri</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Fatura Tarihi</div>
                  <div className="font-medium">{formatDate(invoice.issueDate)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Vade Tarihi</div>
                  <div className="font-medium">{formatDate(invoice.dueDate)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Durum</div>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusIcon(invoice.status)}
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Oluşturulma</div>
                  <div className="font-medium">{formatDate(invoice.createdAt)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Son Güncelleme</div>
                  <div className="font-medium">{formatDate(invoice.updatedAt)}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}