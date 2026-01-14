'use client'

import { useState, useEffect, useMemo } from 'react'
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
import { getInvoiceStatusColor, getInvoiceStatusText } from '@/lib/invoice-status'
import {
  Plus,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from 'lucide-react'
import { InvoiceActions } from '@/components/invoice-actions'
import { InvoiceFilters } from '@/components/invoice-filters'
import { Pagination } from '@/components/ui/pagination'
import Link from 'next/link'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  price: number
}

interface ClientInfo {
  id: string
  name: string
  email: string
  address?: string
  phone?: string
}

interface Invoice {
  id: string
  number: string
  issueDate: string
  dueDate: string
  totalAmount: number
  status: 'DRAFT' | 'SENT' | 'UNPAID' | 'PAID' | 'OVERDUE'
  client: ClientInfo
  items: InvoiceItem[]
  notes?: string
  createdAt: string
  updatedAt: string
}

interface FilteredInvoice {
  id: string
  invoiceNumber: string
  clientName: string
  clientEmail: string
  amount: number
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'UNPAID'
  date: string
  dueDate: string
  createdAt: string
  updatedAt: string
}

export default function InvoicesPage() {
  const { data: session, status } = useSession()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })

  // Separate state for filter values instead of filtered results
  const [filters, setFilters] = useState({
    client: '',
    status: 'ALL' as 'ALL' | 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE',
    dateFrom: '',
    dateTo: '',
    dueDateFrom: '',
    dueDateTo: '',
    amountMin: '',
    amountMax: '',
    invoiceNumber: '',
  })

  useEffect(() => {
    if (status === 'authenticated') {
      fetchInvoices()
    }
  }, [status, page, limit])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/invoices?page=${page}&limit=${limit}`)
      if (response.ok) {
        const result = await response.json()
        // Pagination response formatı: { data: [...], pagination: {...} }
        if (result.pagination) {
          const invoices = result.data || []
          setInvoices(invoices)
          setPagination(result.pagination)
        } else {
          // Eski format (geriye uyumluluk)
          setInvoices(result)
        }
      } else {
        // Hata durumunda loglama
        const errorData = await response.json().catch(() => ({}))
        console.error('Error fetching invoices:', response.status, errorData)
        setInvoices([])
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  // Transform invoices to filter format
  const transformedInvoices: FilteredInvoice[] = useMemo(() => {
    return invoices.map((invoice: Invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.number,
      clientName: invoice.client.name,
      clientEmail: invoice.client.email,
      amount: invoice.totalAmount,
      status: invoice.status,
      date: invoice.issueDate,
      dueDate: invoice.dueDate,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    }))
  }, [invoices])

  // Apply filters with memoization
  const filteredInvoices = useMemo(() => {
    let filtered = [...transformedInvoices]

    // Client filter
    if (filters.client) {
      filtered = filtered.filter((i) => i.clientName === filters.client)
    }

    // Status filter
    if (filters.status !== 'ALL') {
      filtered = filtered.filter((i) => i.status === filters.status)
    }

    // Invoice date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(
        (i) => new Date(i.date) >= new Date(filters.dateFrom)
      )
    }
    if (filters.dateTo) {
      filtered = filtered.filter(
        (i) => new Date(i.date) <= new Date(filters.dateTo)
      )
    }

    // Due date range filter
    if (filters.dueDateFrom) {
      filtered = filtered.filter(
        (i) => new Date(i.dueDate) >= new Date(filters.dueDateFrom)
      )
    }
    if (filters.dueDateTo) {
      filtered = filtered.filter(
        (i) => new Date(i.dueDate) <= new Date(filters.dueDateTo)
      )
    }

    // Amount range filter
    if (filters.amountMin) {
      filtered = filtered.filter(
        (i) => i.amount >= parseFloat(filters.amountMin)
      )
    }
    if (filters.amountMax) {
      filtered = filtered.filter(
        (i) => i.amount <= parseFloat(filters.amountMax)
      )
    }

    // Invoice number filter
    if (filters.invoiceNumber) {
      filtered = filtered.filter((i) =>
        i.invoiceNumber
          .toLowerCase()
          .includes(filters.invoiceNumber.toLowerCase())
      )
    }

    return filtered
  }, [transformedInvoices, filters])

  // Get matching original invoices for display
  const matchingInvoices = useMemo(() => {
    const filteredIds = new Set(filteredInvoices.map((f) => f.id))
    return invoices.filter((invoice) => filteredIds.has(invoice.id))
  }, [invoices, filteredInvoices])

  // Calculate summary
  const summary = useMemo(() => {
    const totalAmount = matchingInvoices.reduce(
      (sum, invoice) => sum + invoice.totalAmount,
      0
    )
    const paidAmount = matchingInvoices
      .filter((invoice) => invoice.status === 'PAID')
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0)
    const pendingAmount = matchingInvoices
      .filter(
        (invoice) => invoice.status === 'SENT' || invoice.status === 'UNPAID' || invoice.status === 'OVERDUE'
      )
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0)

    return { totalAmount, paidAmount, pendingAmount }
  }, [matchingInvoices])

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters)
  }

  const handleInvoiceDelete = async () => {
    // Faturaları yeniden yükle
    await fetchInvoices()
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Toplam Tutar
              </CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(summary.totalAmount)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {filteredInvoices.length} fatura
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ödenen Tutar
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.paidAmount)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {filteredInvoices.filter((i) => i.status === 'PAID').length}{' '}
                ödenen fatura
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Bekleyen Tutar
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(summary.pendingAmount)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {
                  filteredInvoices.filter(
                    (i) => i.status === 'SENT' || i.status === 'UNPAID' || i.status === 'OVERDUE'
                  ).length
                }{' '}
                bekleyen fatura
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <InvoiceFilters
          invoices={transformedInvoices}
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Tüm Faturalar</span>
              </div>
              {filteredInvoices.length !== invoices.length && (
                <span className="text-sm font-normal text-gray-500">
                  {filteredInvoices.length} / {invoices.length} fatura
                  gösteriliyor
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {invoices.length === 0
                    ? 'Henüz fatura yok'
                    : 'Filtreye uygun fatura bulunamadı'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {invoices.length === 0
                    ? 'İlk faturanızı oluşturmak için aşağıdaki butona tıklayın.'
                    : 'Filtre kriterlerinizi değiştirmeyi deneyin.'}
                </p>
                {invoices.length === 0 && (
                  <Link href="/invoices/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Yeni Fatura Oluştur
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fatura No</TableHead>
                    <TableHead>Tedarikçi</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Vade</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matchingInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.number}
                      </TableCell>
                      <TableCell>{invoice.client.name}</TableCell>
                      <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(invoice.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getInvoiceStatusColor(invoice.status)}`}
                        >
                          {getInvoiceStatusText(invoice.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <InvoiceActions 
                          invoice={{
                            id: invoice.id,
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
                              total: item.quantity * item.price,
                            })),
                          }} 
                          onDelete={handleInvoiceDelete} 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          {pagination.total > 0 && (
            <Pagination
              page={pagination.page}
              limit={pagination.limit}
              total={pagination.total}
              totalPages={pagination.totalPages}
              hasNext={pagination.hasNext}
              hasPrev={pagination.hasPrev}
              onPageChange={(newPage) => {
                setPage(newPage)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onLimitChange={(newLimit) => {
                setLimit(newLimit)
                setPage(1) // Limit değiştiğinde ilk sayfaya dön
              }}
            />
          )}
        </Card>
      </div>
    </MainLayout>
  )
}
