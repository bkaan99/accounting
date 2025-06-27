'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
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
  Edit3,
  Trash2,
  FileText,
  Download,
  Send,
  CheckCircle,
} from 'lucide-react'
import Link from 'next/link'

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
}

interface Invoice {
  id: string
  number: string
  issueDate: string
  dueDate: string
  status: string
  totalAmount: number
  subtotal: number
  taxAmount: number
  notes?: string
  clientInfo: Client
  items: InvoiceItem[]
  createdAt: string
  updatedAt: string
}

export default function InvoiceDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (params.id) {
      fetchInvoice()
    }
  }, [params.id])

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

  const updateInvoiceStatus = async (newStatus: string) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/invoices/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          notes: invoice?.notes,
        }),
      })

      if (response.ok) {
        const updatedInvoice = await response.json()
        setInvoice(updatedInvoice)
      }
    } catch (error) {
      console.error('Error updating invoice:', error)
    } finally {
      setUpdating(false)
    }
  }

  const deleteInvoice = async () => {
    if (confirm('Bu faturayı silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/invoices/${params.id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          router.push('/invoices')
        }
      } catch (error) {
        console.error('Error deleting invoice:', error)
      }
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
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getStatusText = (status: string) => {
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

  if (status === 'loading' || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Yükleniyor...</div>
        </div>
      </MainLayout>
    )
  }

  if (!invoice) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Fatura bulunamadı
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Aradığınız fatura mevcut değil veya silinmiş olabilir.
            </p>
            <Link href="/invoices">
              <Button>Faturalara Dön</Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/invoices">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Geri
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Fatura {invoice.number}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {formatDate(invoice.issueDate)} tarihinde oluşturuldu
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(invoice.status)}`}
            >
              {getStatusText(invoice.status)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ana İçerik */}
          <div className="lg:col-span-2 space-y-6">
            {/* Fatura Bilgileri */}
            <Card>
              <CardHeader>
                <CardTitle>Fatura Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Fatura No
                    </p>
                    <p className="text-lg font-semibold">{invoice.number}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Durum
                    </p>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}
                    >
                      {getStatusText(invoice.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Fatura Tarihi
                    </p>
                    <p className="text-lg">{formatDate(invoice.issueDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Vade Tarihi
                    </p>
                    <p className="text-lg">{formatDate(invoice.dueDate)}</p>
                  </div>
                </div>
                {invoice.notes && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Notlar
                    </p>
                    <p className="text-sm mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {invoice.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Müşteri Bilgileri */}
            <Card>
              <CardHeader>
                <CardTitle>Müşteri Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    {invoice.clientInfo.name}
                  </h3>
                  {invoice.clientInfo.email && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      📧 {invoice.clientInfo.email}
                    </p>
                  )}
                  {invoice.clientInfo.phone && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      📞 {invoice.clientInfo.phone}
                    </p>
                  )}
                  {invoice.clientInfo.address && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      📍 {invoice.clientInfo.address}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Fatura Kalemleri */}
            <Card>
              <CardHeader>
                <CardTitle>Fatura Kalemleri</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Açıklama</TableHead>
                      <TableHead className="text-center">Miktar</TableHead>
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
                        <TableCell className="text-center">
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

                <div className="mt-6 space-y-2">
                  <div className="flex justify-between items-center border-t pt-4">
                    <span className="text-xl font-semibold">Genel Toplam</span>
                    <span className="text-xl font-bold">
                      {formatCurrency(invoice.totalAmount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Yan Panel - İşlemler */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>İşlemler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {invoice.status === 'DRAFT' && (
                  <Button
                    onClick={() => updateInvoiceStatus('SENT')}
                    disabled={updating}
                    className="w-full"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {updating ? 'Güncelleniyor...' : 'Gönder'}
                  </Button>
                )}

                {invoice.status === 'SENT' && (
                  <Button
                    onClick={() => updateInvoiceStatus('PAID')}
                    disabled={updating}
                    className="w-full"
                    variant="outline"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {updating ? 'Güncelleniyor...' : 'Ödendi Olarak İşaretle'}
                  </Button>
                )}

                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  PDF İndir
                </Button>

                <Button variant="outline" className="w-full">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Düzenle
                </Button>

                <Button
                  variant="outline"
                  onClick={deleteInvoice}
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Sil
                </Button>
              </CardContent>
            </Card>

            {/* Özet */}
            <Card>
              <CardHeader>
                <CardTitle>Özet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Toplam Kalem
                  </span>
                  <span>{invoice.items.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Oluşturulma
                  </span>
                  <span>{formatDate(invoice.createdAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Son Güncelleme
                  </span>
                  <span>{formatDate(invoice.updatedAt)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-3">
                  <span>Toplam Tutar</span>
                  <span>{formatCurrency(invoice.totalAmount)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
