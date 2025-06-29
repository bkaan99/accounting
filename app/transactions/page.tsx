'use client'

import { useState, useEffect } from 'react'
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
import { Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { TransactionActions } from '@/components/transaction-actions'
import { TransactionFilters } from '@/components/transaction-filters'
import Link from 'next/link'

interface Transaction {
  id: string
  type: 'INCOME' | 'EXPENSE'
  category: string
  amount: number
  description?: string
  date: string
  createdAt: string
  updatedAt: string
  invoiceId?: string
  invoice?: {
    id: string
    number: string
    clientInfo: {
      name: string
    }
  }
}

export default function TransactionsPage() {
  const { data: session, status } = useSession()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTransactions()
    }
  }, [status])

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
        setFilteredTransactions(data)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateSummary = (txns: Transaction[]) => {
    const totalIncome = txns
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpenses = txns
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
    }
  }

  const { totalIncome, totalExpenses, netProfit } =
    calculateSummary(filteredTransactions)

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
              İşlemler
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gelir ve giderlerinizi takip edin
            </p>
          </div>
          <Link href="/transactions/new">
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Yeni İşlem</span>
            </Button>
          </Link>
        </div>

        {/* Summary Cards */}
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
                {formatCurrency(totalIncome)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {filteredTransactions.filter((t) => t.type === 'INCOME').length}{' '}
                işlem
              </p>
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
                {formatCurrency(totalExpenses)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {
                  filteredTransactions.filter((t) => t.type === 'EXPENSE')
                    .length
                }{' '}
                işlem
              </p>
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
                  netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(netProfit)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {filteredTransactions.length} toplam işlem
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <TransactionFilters
          transactions={transactions}
          onFilteredTransactions={setFilteredTransactions}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Tüm İşlemler</span>
              {filteredTransactions.length !== transactions.length && (
                <span className="text-sm font-normal text-gray-500">
                  {filteredTransactions.length} / {transactions.length} işlem
                  gösteriliyor
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {transactions.length === 0
                    ? 'Henüz işlem yok'
                    : 'Filtreye uygun işlem bulunamadı'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {transactions.length === 0
                    ? 'İlk işleminizi eklemek için aşağıdaki butona tıklayın.'
                    : 'Filtre kriterlerinizi değiştirmeyi deneyin.'}
                </p>
                {transactions.length === 0 && (
                  <Link href="/transactions/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Yeni İşlem Ekle
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Fatura/Kaynak</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDate(transaction.date)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {transaction.type === 'INCOME' ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span
                            className={
                              transaction.type === 'INCOME'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }
                          >
                            {transaction.type === 'INCOME' ? 'Gelir' : 'Gider'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        {transaction.invoice ? (
                          <div className="flex flex-col">
                            <Link 
                              href={`/invoices/${transaction.invoice.id}`}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {transaction.invoice.number}
                            </Link>
                            <span className="text-xs text-gray-500">
                              {transaction.invoice.clientInfo.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">
                            Manuel İşlem
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-medium ${
                            transaction.type === 'INCOME'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {transaction.type === 'INCOME' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <TransactionActions 
                          transactionId={transaction.id} 
                          onDelete={fetchTransactions}
                        />
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
