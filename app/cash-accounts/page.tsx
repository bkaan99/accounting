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
import { Plus, Wallet, CreditCard, Building2, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'

interface CashAccount {
  id: string
  name: string
  type: 'CASH' | 'CREDIT_CARD' | 'BANK_ACCOUNT'
  initialBalance: number
  balance: number
  isActive: boolean
  description?: string
  createdAt: string
  updatedAt: string
  company?: {
    id: string
    name: string
  }
  transactions?: Array<{
    id: string
    type: 'INCOME' | 'EXPENSE'
    amount: number
    date: string
  }>
}

export default function CashAccountsPage() {
  const { data: session, status } = useSession()
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCashAccounts()
    }
  }, [status])

  const fetchCashAccounts = async () => {
    try {
      const response = await fetch('/api/cash-accounts')
      if (response.ok) {
        const data = await response.json()
        setCashAccounts(data)
      }
    } catch (error) {
      console.error('Error fetching cash accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCashAccountIcon = (type: string) => {
    switch (type) {
      case 'CASH':
        return <Wallet className="h-5 w-5 text-green-600" />
      case 'CREDIT_CARD':
        return <CreditCard className="h-5 w-5 text-blue-600" />
      case 'BANK_ACCOUNT':
        return <Building2 className="h-5 w-5 text-purple-600" />
      default:
        return <Wallet className="h-5 w-5 text-gray-600" />
    }
  }

  const getCashAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'CASH':
        return 'Nakit Kasa'
      case 'CREDIT_CARD':
        return 'Kredi Kartı'
      case 'BANK_ACCOUNT':
        return 'Banka Hesabı'
      default:
        return type
    }
  }

  const calculateTotalBalance = () => {
    return cashAccounts
      .filter(account => account.isActive)
      .reduce((sum, account) => sum + account.balance, 0)
  }

  const getTotalIncome = () => {
    return cashAccounts
      .filter(account => account.isActive)
      .reduce((sum, account) => {
        const income = account.transactions?.filter(t => t.type === 'INCOME')
          .reduce((tSum, t) => tSum + t.amount, 0) || 0
        return sum + income
      }, 0)
  }

  const getTotalExpenses = () => {
    return cashAccounts
      .filter(account => account.isActive)
      .reduce((sum, account) => {
        const expenses = account.transactions?.filter(t => t.type === 'EXPENSE')
          .reduce((tSum, t) => tSum + t.amount, 0) || 0
        return sum + expenses
      }, 0)
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

  const totalBalance = calculateTotalBalance()
  const totalIncome = getTotalIncome()
  const totalExpenses = getTotalExpenses()

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Kasa Yönetimi
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Nakit kasalarınızı ve kredi kartı kasalarınızı yönetin
            </p>
          </div>
          <Link href="/cash-accounts/new">
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Yeni Kasa</span>
            </Button>
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Toplam Bakiye
              </CardTitle>
              <Wallet className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                totalBalance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(totalBalance)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {cashAccounts.filter(a => a.isActive).length} aktif kasa
              </p>
            </CardContent>
          </Card>

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
                Tüm kasalardan
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
                Tüm kasalardan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Net Akış
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                (totalIncome - totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(totalIncome - totalExpenses)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Gelir - Gider
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Tüm Kasalar</span>
              <span className="text-sm font-normal text-gray-500">
                {cashAccounts.length} kasa
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cashAccounts.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Henüz kasa yok
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  İlk kasanızı oluşturmak için aşağıdaki butona tıklayın.
                </p>
                <Link href="/cash-accounts/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Kasa Oluştur
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kasa Adı</TableHead>
                    <TableHead>Şirket</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead className="text-right">Bakiye</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getCashAccountIcon(account.type)}
                          <span className="font-medium">{account.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {account.company?.name || 'Bilinmiyor'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {getCashAccountTypeLabel(account.type)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          account.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {account.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {account.description || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-medium ${
                          account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(account.balance)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link href={`/cash-accounts/${account.id}`}>
                            <Button variant="outline" size="sm">
                              Detay
                            </Button>
                          </Link>
                          <Link href={`/cash-accounts/${account.id}/edit`}>
                            <Button variant="outline" size="sm">
                              Düzenle
                            </Button>
                          </Link>
                        </div>
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
