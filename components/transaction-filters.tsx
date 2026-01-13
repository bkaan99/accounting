'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Filter,
  X,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
} from 'lucide-react'

interface Transaction {
  id: string
  type: 'INCOME' | 'EXPENSE'
  category: string
  amount: number
  description?: string
  date: string
  createdAt: string
  updatedAt: string
  isPaid: boolean
  invoiceId?: string
  cashAccountId?: string
}

interface TransactionFiltersProps {
  transactions: Transaction[]
  onFilteredTransactions: (filtered: Transaction[]) => void
}

interface Filters {
  type: 'ALL' | 'INCOME' | 'EXPENSE'
  category: string
  dateFrom: string
  dateTo: string
  amountMin: string
  amountMax: string
  description: string
}

export function TransactionFilters({
  transactions,
  onFilteredTransactions,
}: TransactionFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    type: 'ALL',
    category: '',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
    description: '',
  })

  // Get unique categories
  const categories = Array.from(
    new Set(transactions.map((t) => t.category))
  ).sort()

  useEffect(() => {
    applyFilters()
  }, [filters, transactions])

  const applyFilters = () => {
    let filtered = [...transactions]

    // Type filter
    if (filters.type !== 'ALL') {
      filtered = filtered.filter((t) => t.type === filters.type)
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter((t) => t.category === filters.category)
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(
        (t) => new Date(t.date) >= new Date(filters.dateFrom)
      )
    }
    if (filters.dateTo) {
      filtered = filtered.filter(
        (t) => new Date(t.date) <= new Date(filters.dateTo)
      )
    }

    // Amount range filter
    if (filters.amountMin) {
      filtered = filtered.filter(
        (t) => t.amount >= parseFloat(filters.amountMin)
      )
    }
    if (filters.amountMax) {
      filtered = filtered.filter(
        (t) => t.amount <= parseFloat(filters.amountMax)
      )
    }

    // Description filter
    if (filters.description) {
      filtered = filtered.filter((t) =>
        t.description?.toLowerCase().includes(filters.description.toLowerCase())
      )
    }

    onFilteredTransactions(filtered)
  }

  const clearFilters = () => {
    setFilters({
      type: 'ALL',
      category: '',
      dateFrom: '',
      dateTo: '',
      amountMin: '',
      amountMax: '',
      description: '',
    })
  }

  const hasActiveFilters = () => {
    return (
      filters.type !== 'ALL' ||
      filters.category ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.amountMin ||
      filters.amountMax ||
      filters.description
    )
  }

  const getFilterCount = () => {
    let count = 0
    if (filters.type !== 'ALL') count++
    if (filters.category) count++
    if (filters.dateFrom || filters.dateTo) count++
    if (filters.amountMin || filters.amountMax) count++
    if (filters.description) count++
    return count
  }

  return (
    <div className="space-y-4">
      {/* Quick Filters and Filter Toggle Button */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filters.type === 'ALL' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilters((prev) => ({ ...prev, type: 'ALL' }))}
          >
            Tümü
          </Button>
          <Button
            variant={filters.type === 'INCOME' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilters((prev) => ({ ...prev, type: 'INCOME' }))}
            className="text-green-600 border-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400"
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Gelir
          </Button>
          <Button
            variant={filters.type === 'EXPENSE' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilters((prev) => ({ ...prev, type: 'EXPENSE' }))}
            className="text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400"
          >
            <TrendingDown className="h-4 w-4 mr-1" />
            Gider
          </Button>
        </div>

        {/* Filter Toggle Button */}
        <div className="flex items-center gap-2">
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
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gelişmiş Filtreler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Category Filter */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  Kategori
                </Label>
                <select
                  id="category"
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 text-sm"
                  value={filters.category}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                >
                  <option value="">Tüm kategoriler</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div className="space-y-2">
                <Label
                  htmlFor="dateFrom"
                  className="flex items-center text-sm font-medium"
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Başlangıç Tarihi
                </Label>
                <Input
                  id="dateFrom"
                  type="date"
                  className="h-10"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      dateFrom: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <Label
                  htmlFor="dateTo"
                  className="flex items-center text-sm font-medium"
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Bitiş Tarihi
                </Label>
                <Input
                  id="dateTo"
                  type="date"
                  className="h-10"
                  value={filters.dateTo}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                  }
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
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      amountMin: e.target.value,
                    }))
                  }
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
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      amountMax: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Açıklama Ara
                </Label>
                <Input
                  id="description"
                  type="text"
                  className="h-10"
                  value={filters.description}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Açıklama içinde ara..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
