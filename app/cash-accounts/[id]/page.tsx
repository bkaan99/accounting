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
  Wallet, 
  CreditCard, 
  Building2, 
  TrendingUp, 
  TrendingDown,
  Plus,
  DollarSign
} from 'lucide-react'
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
  transactions: Array<{
    id: string
    type: 'INCOME' | 'EXPENSE'
    amount: number
    date: string
    description?: string
    category: string
    isPaid: boolean
    user: {
      id: string
      name: string
    }
    invoice?: {
      id: string
      number: string
      client: {
        name: string
      }
    }
  }>
}

export default function CashAccountDetailPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const [cashAccount, setCashAccount] = useState<CashAccount | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCashAccount()
    }
  }, [status, params.id])

  const fetchCashAccount = async () => {
    try {
      const response = await fetch(`/api/cash-accounts/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setCashAccount(data)
      } else if (response.status === 404) {
        router.push('/cash-accounts')
      }
    } catch (error) {
      console.error('Error fetching cash account:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCashAccountIcon = (type: string) => {
    switch (type) {
      case 'CASH':
        return <Wallet className="h-6 w-6 text-green-600" />
      case 'CREDIT_CARD':
        return <CreditCard className="h-6 w-6 text-blue-600" />
      case 'BANK_ACCOUNT':
        return <Building2 className="h-6 w-6 text-purple-600" />
      default:
        return <Wallet className="h-6 w-6 text-gray-600" />
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

  const calculateStats = () => {
    if (!cashAccount) return { totalIncome: 0, totalExpenses: 0, transactionCount: 0 }
    
    const totalIncome = cashAccount.transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalExpenses = cashAccount.transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)
    
    return {
      totalIncome,
      totalExpenses,
      transactionCount: cashAccount.transactions.length
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

  if (!cashAccount) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Kasa bulunamadı
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Aradığınız kasa mevcut değil veya erişim yetkiniz yok.
            </p>
            <Link href="/cash-accounts">
              <Button>Kasaları Görüntüle</Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    )
  }

  const stats = calculateStats()

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/cash-accounts">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Geri
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              {getCashAccountIcon(cashAccount.type)}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {cashAccount.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {getCashAccountTypeLabel(cashAccount.type)} - {cashAccount.company?.name || 'Bilinmiyor'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link href={`/cash-accounts/${cashAccount.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Düzenle
              </Button>
            </Link>
            <Link href="/transactions/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yeni İşlem
              </Button>
            </Link>
          </div>
        </div>

        {/* Kasa Bilgileri */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Başlangıç Bakiyesi
              </CardTitle>
              <Wallet className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                cashAccount.initialBalance >= 0 ? 'text-gray-600' : 'text-red-600'
              }`}>
                {formatCurrency(cashAccount.initialBalance)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                İlk kurulum bakiyesi
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Mevcut Bakiye
              </CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                cashAccount.balance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(cashAccount.balance)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Güncel bakiye
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
                {formatCurrency(stats.totalIncome)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {cashAccount.transactions.filter(t => t.type === 'INCOME').length} işlem
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
                {formatCurrency(stats.totalExpenses)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {cashAccount.transactions.filter(t => t.type === 'EXPENSE').length} işlem
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Toplam İşlem
              </CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.transactionCount}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Tüm işlemler
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Kasa Detayları */}
        <Card>
          <CardHeader>
            <CardTitle>Kasa Detayları</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Genel Bilgiler
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Kasa Adı:</span>
                    <span className="font-medium">{cashAccount.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tür:</span>
                    <span className="font-medium">{getCashAccountTypeLabel(cashAccount.type)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Durum:</span>
                    <span className={`font-medium ${
                      cashAccount.isActive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {cashAccount.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Oluşturulma:</span>
                    <span className="font-medium">{formatDate(cashAccount.createdAt)}</span>
                  </div>
                </div>
              </div>
              
              {cashAccount.description && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Açıklama
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {cashAccount.description}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* İşlemler */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Kasa İşlemleri</span>
              <span className="text-sm font-normal text-gray-500">
                {cashAccount.transactions.length} işlem
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cashAccount.transactions.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Henüz işlem yok
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Bu kasaya henüz hiç işlem kaydedilmemiş.
                </p>
                <Link href="/transactions/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    İlk İşlemi Ekle
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>Ödeme</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashAccount.transactions.map((transaction) => (
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
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {transaction.description || '-'}
                        </div>
                        {transaction.invoice && (
                          <div className="text-xs text-blue-600 mt-1">
                            Fatura: {transaction.invoice.number}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{transaction.user.name}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.isPaid 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {transaction.isPaid ? 'Ödendi' : 'Ödenmedi'}
                        </span>
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
