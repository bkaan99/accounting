'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Filter, X, FileText, User, Calendar, DollarSign } from 'lucide-react'

interface Invoice {
  id: string
  invoiceNumber: string
  clientName: string
  clientEmail: string
  amount: number
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE'
  date: string
  dueDate: string
  createdAt: string
  updatedAt: string
}

interface Filters {
  client: string
  status: 'ALL' | 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE'
  dateFrom: string
  dateTo: string
  dueDateFrom: string
  dueDateTo: string
  amountMin: string
  amountMax: string
  invoiceNumber: string
}

interface InvoiceFiltersProps {
  invoices: Invoice[]
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

const statusLabels = {
  ALL: 'Tümü',
  DRAFT: 'Taslak',
  SENT: 'Gönderildi',
  PAID: 'Ödendi',
  OVERDUE: 'Gecikmiş',
}

const statusColors = {
  DRAFT:
    'text-gray-600 border-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:border-gray-400',
  SENT: 'text-blue-600 border-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-400',
  PAID: 'text-green-600 border-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400',
  OVERDUE:
    'text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400',
}

export function InvoiceFilters({
  invoices,
  filters,
  onFiltersChange,
}: InvoiceFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)

  // Get unique clients
  const clients = Array.from(new Set(invoices.map((i) => i.clientName))).sort()

  const updateFilter = (key: keyof Filters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      client: '',
      status: 'ALL',
      dateFrom: '',
      dateTo: '',
      dueDateFrom: '',
      dueDateTo: '',
      amountMin: '',
      amountMax: '',
      invoiceNumber: '',
    })
  }

  const hasActiveFilters = () => {
    return (
      filters.client ||
      filters.status !== 'ALL' ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.dueDateFrom ||
      filters.dueDateTo ||
      filters.amountMin ||
      filters.amountMax ||
      filters.invoiceNumber
    )
  }

  const getFilterCount = () => {
    let count = 0
    if (filters.client) count++
    if (filters.status !== 'ALL') count++
    if (filters.dateFrom || filters.dateTo) count++
    if (filters.dueDateFrom || filters.dueDateTo) count++
    if (filters.amountMin || filters.amountMax) count++
    if (filters.invoiceNumber) count++
    return count
  }

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2"
        >
          <Filter className="h-4 w-4" />
          <span>Filtreler</span>
          {hasActiveFilters() && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200">
              {getFilterCount()}
            </span>
          )}
        </Button>

        {hasActiveFilters() && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            Temizle
          </Button>
        )}
      </div>

      {/* Quick Status Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filters.status === 'ALL' ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateFilter('status', 'ALL')}
        >
          <FileText className="h-4 w-4 mr-1" />
          Tümü
        </Button>
        {(['DRAFT', 'SENT', 'PAID', 'OVERDUE'] as const).map((status) => (
          <Button
            key={status}
            variant={filters.status === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilter('status', status)}
            className={filters.status !== status ? statusColors[status] : ''}
          >
            {statusLabels[status]}
          </Button>
        ))}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gelişmiş Filtreler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Client Filter */}
              <div className="space-y-2">
                <Label
                  htmlFor="client"
                  className="flex items-center text-sm font-medium"
                >
                  <User className="h-4 w-4 mr-1" />
                  Müşteri
                </Label>
                <select
                  id="client"
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 text-sm"
                  value={filters.client}
                  onChange={(e) => updateFilter('client', e.target.value)}
                >
                  <option value="">Tüm müşteriler</option>
                  {clients.map((client) => (
                    <option key={client} value={client}>
                      {client}
                    </option>
                  ))}
                </select>
              </div>

              {/* Invoice Number */}
              <div className="space-y-2">
                <Label
                  htmlFor="invoiceNumber"
                  className="flex items-center text-sm font-medium"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Fatura No
                </Label>
                <Input
                  id="invoiceNumber"
                  type="text"
                  className="h-10"
                  value={filters.invoiceNumber}
                  onChange={(e) =>
                    updateFilter('invoiceNumber', e.target.value)
                  }
                  placeholder="Fatura numarası ara..."
                />
              </div>

              {/* Invoice Date From */}
              <div className="space-y-2">
                <Label
                  htmlFor="dateFrom"
                  className="flex items-center text-sm font-medium"
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Fatura Tarihi (Başlangıç)
                </Label>
                <Input
                  id="dateFrom"
                  type="date"
                  className="h-10"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter('dateFrom', e.target.value)}
                />
              </div>

              {/* Invoice Date To */}
              <div className="space-y-2">
                <Label
                  htmlFor="dateTo"
                  className="flex items-center text-sm font-medium"
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Fatura Tarihi (Bitiş)
                </Label>
                <Input
                  id="dateTo"
                  type="date"
                  className="h-10"
                  value={filters.dateTo}
                  onChange={(e) => updateFilter('dateTo', e.target.value)}
                />
              </div>

              {/* Due Date From */}
              <div className="space-y-2">
                <Label
                  htmlFor="dueDateFrom"
                  className="flex items-center text-sm font-medium"
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Vade Tarihi (Başlangıç)
                </Label>
                <Input
                  id="dueDateFrom"
                  type="date"
                  className="h-10"
                  value={filters.dueDateFrom}
                  onChange={(e) => updateFilter('dueDateFrom', e.target.value)}
                />
              </div>

              {/* Due Date To */}
              <div className="space-y-2">
                <Label
                  htmlFor="dueDateTo"
                  className="flex items-center text-sm font-medium"
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Vade Tarihi (Bitiş)
                </Label>
                <Input
                  id="dueDateTo"
                  type="date"
                  className="h-10"
                  value={filters.dueDateTo}
                  onChange={(e) => updateFilter('dueDateTo', e.target.value)}
                />
              </div>

              {/* Amount Min */}
              <div className="space-y-2">
                <Label
                  htmlFor="amountMin"
                  className="flex items-center text-sm font-medium"
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Min. Tutar (₺)
                </Label>
                <Input
                  id="amountMin"
                  type="number"
                  min="0"
                  step="0.01"
                  className="h-10"
                  value={filters.amountMin}
                  onChange={(e) => updateFilter('amountMin', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {/* Amount Max */}
              <div className="space-y-2">
                <Label
                  htmlFor="amountMax"
                  className="flex items-center text-sm font-medium"
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Maks. Tutar (₺)
                </Label>
                <Input
                  id="amountMax"
                  type="number"
                  min="0"
                  step="0.01"
                  className="h-10"
                  value={filters.amountMax}
                  onChange={(e) => updateFilter('amountMax', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
