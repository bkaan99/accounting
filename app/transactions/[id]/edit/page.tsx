'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, TrendingUp, TrendingDown, Wallet, CreditCard, Building2 } from 'lucide-react'
import Link from 'next/link'

interface TransactionForm {
  type: 'INCOME' | 'EXPENSE' | ''
  category: string
  amount: string
  description: string
  date: string
  cashAccountId: string
  isPaid: boolean
}

interface CashAccount {
  id: string
  name: string
  type: 'CASH' | 'CREDIT_CARD' | 'BANK_ACCOUNT'
  balance: number
  isActive: boolean
}

interface Transaction {
  id: string
  type: 'INCOME' | 'EXPENSE'
  category: string
  amount: number
  description?: string
  date: string
  cashAccountId?: string
  isPaid: boolean
  invoiceId?: string
  cashAccount?: {
    id: string
    name: string
    type: 'CASH' | 'CREDIT_CARD' | 'BANK_ACCOUNT'
  }
  invoice?: {
    id: string
    number: string
  }
}

// Predefined categories
const INCOME_CATEGORIES = [
  'Satış Geliri',
  'Hizmet Geliri',
  'Faiz Geliri',
  'Kira Geliri',
  'Komisyon Geliri',
  'Diğer Gelirler',
]

const EXPENSE_CATEGORIES = [
  'Kira Gideri',
  'Maaş Gideri',
  'Elektrik Gideri',
  'Su Gideri',
  'Telefon Gideri',
  'İnternet Gideri',
  'Yakıt Gideri',
  'Kırtasiye Gideri',
  'Yemek Gideri',
  'Ulaşım Gideri',
  'Vergi Gideri',
  'Sigorta Gideri',
  'Bakım-Onarım',
  'Pazarlama Gideri',
  'Danışmanlık Gideri',
  'Diğer Giderler',
]

export default function EditTransactionPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([])
  const [isInvoiceTransaction, setIsInvoiceTransaction] = useState(false)
  const [form, setForm] = useState<TransactionForm>({
    type: '',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    cashAccountId: '',
    isPaid: false,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchTransaction()
      fetchCashAccounts()
    }
  }, [status, params.id])

  const fetchTransaction = async () => {
    try {
      const response = await fetch(`/api/transactions/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setTransaction(data)
        setIsInvoiceTransaction(!!data.invoiceId)
        setForm({
          type: data.type,
          category: data.category,
          amount: data.amount.toString(),
          description: data.description || '',
          date: new Date(data.date).toISOString().split('T')[0],
          cashAccountId: data.cashAccountId || '',
          isPaid: data.isPaid,
        })
      } else if (response.status === 404) {
        router.push('/transactions')
      }
    } catch (error) {
      console.error('Error fetching transaction:', error)
    }
  }

  const fetchCashAccounts = async () => {
    try {
      const response = await fetch('/api/cash-accounts')
      if (response.ok) {
        const data = await response.json()
        setCashAccounts(data.filter((account: CashAccount) => account.isActive))
      }
    } catch (error) {
      console.error('Error fetching cash accounts:', error)
    }
  }

  const getCategories = () => {
    return form.type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  }

  const handleTypeChange = (type: 'INCOME' | 'EXPENSE') => {
    setForm((prev) => ({
      ...prev,
      type,
      category: '', // Reset category when type changes
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/transactions/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Faturaya bağlı işlemler için sadece kasa ve ödeme durumunu güncelle
          ...(isInvoiceTransaction ? {} : {
            type: form.type,
            category: form.category,
            amount: parseFloat(form.amount),
            description: form.description,
            date: form.date,
          }),
          cashAccountId: form.cashAccountId && form.cashAccountId !== 'none' ? form.cashAccountId : null,
          isPaid: form.isPaid,
        }),
      })

      if (response.ok) {
        router.push('/transactions')
      } else {
        const error = await response.json()
        alert(error.error || 'İşlem güncellenirken hata oluştu')
      }
    } catch (error) {
      console.error('Error updating transaction:', error)
      alert('İşlem güncellenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || !transaction) {
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
        <div className="flex items-center space-x-4">
          <Link href="/transactions">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {isInvoiceTransaction ? 'Fatura İşlemi Düzenle' : 'İşlem Düzenle'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isInvoiceTransaction 
                ? 'Faturaya bağlı işlem için sadece kasa ve ödeme durumunu güncelleyebilirsiniz'
                : 'İşlem bilgilerini güncelleyin'
              }
            </p>
            {isInvoiceTransaction && transaction?.invoice && (
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Fatura: {transaction.invoice.number}
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          {/* İşlem Türü - Faturaya bağlı işlemler için devre dışı */}
          {!isInvoiceTransaction && (
            <Card>
              <CardHeader>
                <CardTitle>İşlem Türü</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('INCOME')}
                    className={`p-6 border-2 rounded-lg transition-all ${
                      form.type === 'INCOME'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                    }`}
                  >
                  <div className="text-center">
                    <TrendingUp
                      className={`h-8 w-8 mx-auto mb-2 ${
                        form.type === 'INCOME'
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }`}
                    />
                    <div
                      className={`font-semibold ${
                        form.type === 'INCOME'
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      Gelir
                    </div>
                    <div className="text-sm text-gray-500">
                      Para giriş işlemi
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange('EXPENSE')}
                  className={`p-6 border-2 rounded-lg transition-all ${
                    form.type === 'EXPENSE'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-red-300'
                  }`}
                >
                  <div className="text-center">
                    <TrendingDown
                      className={`h-8 w-8 mx-auto mb-2 ${
                        form.type === 'EXPENSE'
                          ? 'text-red-600'
                          : 'text-gray-400'
                      }`}
                    />
                    <div
                      className={`font-semibold ${
                        form.type === 'EXPENSE'
                          ? 'text-red-700 dark:text-red-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      Gider
                    </div>
                    <div className="text-sm text-gray-500">
                      Para çıkış işlemi
                    </div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
          )}

          {/* İşlem Detayları - Faturaya bağlı işlemler için devre dışı */}
          {form.type && !isInvoiceTransaction && (
            <Card>
              <CardHeader>
                <CardTitle>İşlem Detayları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Kategori</Label>
                    <select
                      id="category"
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                      value={form.category}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value="">Kategori seçiniz...</option>
                      {getCategories().map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="amount">Tutar (₺)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.amount}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, amount: e.target.value }))
                      }
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="date">Tarih</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, date: e.target.value }))
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Açıklama</Label>
                  <textarea
                    id="description"
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="İşlem açıklaması (opsiyonel)"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cashAccount">Kasa Seçimi</Label>
                    <Select
                      value={form.cashAccountId}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, cashAccountId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kasa seçiniz (opsiyonel)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500">Kasa seçmeyin</span>
                          </div>
                        </SelectItem>
                        {cashAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="flex items-center space-x-2">
                              {account.type === 'CASH' && <Wallet className="h-4 w-4 text-green-600" />}
                              {account.type === 'CREDIT_CARD' && <CreditCard className="h-4 w-4 text-blue-600" />}
                              {account.type === 'BANK_ACCOUNT' && <Building2 className="h-4 w-4 text-purple-600" />}
                              <span>{account.name}</span>
                              <span className="text-sm text-gray-500">
                                (₺{account.balance.toFixed(2)})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 mt-1">
                      Kasa seçilirse işlem bu kasaya kaydedilir
                    </p>
                  </div>

                  {form.cashAccountId && form.cashAccountId !== 'none' && (
                    <div>
                      <Label htmlFor="isPaid">Ödeme Durumu</Label>
                      <Select
                        value={form.isPaid ? 'true' : 'false'}
                        onValueChange={(value) =>
                          setForm((prev) => ({ ...prev, isPaid: value === 'true' }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">Ödenmedi</SelectItem>
                          <SelectItem value="true">Ödendi</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500 mt-1">
                        Ödendi seçilirse kasa bakiyesi güncellenir
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Faturaya bağlı işlemler için sadece kasa ve ödeme durumu */}
          {isInvoiceTransaction && (
            <Card>
              <CardHeader>
                <CardTitle>Kasa ve Ödeme Durumu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cashAccount">Kasa</Label>
                    <Select
                      value={form.cashAccountId}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, cashAccountId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kasa seçiniz (opsiyonel)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500">Kasa seçmeyin</span>
                          </div>
                        </SelectItem>
                        {cashAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="flex items-center space-x-2">
                              {account.type === 'CASH' && <Wallet className="h-4 w-4 text-green-600" />}
                              {account.type === 'CREDIT_CARD' && <CreditCard className="h-4 w-4 text-blue-600" />}
                              {account.type === 'BANK_ACCOUNT' && <Building2 className="h-4 w-4 text-purple-600" />}
                              <span>{account.name}</span>
                              <span className="text-sm text-gray-500">
                                (₺{account.balance.toFixed(2)})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 mt-1">
                      Kasa seçilirse işlem bu kasaya kaydedilir
                    </p>
                  </div>

                  {form.cashAccountId && form.cashAccountId !== 'none' && (
                    <div>
                      <Label htmlFor="isPaid">Ödeme Durumu</Label>
                      <Select
                        value={form.isPaid ? 'true' : 'false'}
                        onValueChange={(value) =>
                          setForm((prev) => ({ ...prev, isPaid: value === 'true' }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">Ödenmedi</SelectItem>
                          <SelectItem value="true">Ödendi</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500 mt-1">
                        Ödendi seçilirse kasa bakiyesi güncellenir
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Özet */}
          {form.type && form.amount && (
            <Card>
              <CardHeader>
                <CardTitle>İşlem Özeti</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Tür:</span>
                    <span
                      className={`flex items-center ${
                        form.type === 'INCOME'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {form.type === 'INCOME' ? (
                        <>
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Gelir
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-4 w-4 mr-1" />
                          Gider
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Kategori:</span>
                    <span>{form.category || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Tutar:</span>
                    <span
                      className={`font-bold text-lg ${
                        form.type === 'INCOME'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {form.type === 'INCOME' ? '+' : '-'}₺
                      {parseFloat(form.amount || '0').toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Tarih:</span>
                    <span>
                      {new Date(form.date).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  {form.cashAccountId && form.cashAccountId !== 'none' && (
                    <div className="flex justify-between">
                      <span className="font-medium">Kasa:</span>
                      <span>
                        {cashAccounts.find(a => a.id === form.cashAccountId)?.name || '-'}
                      </span>
                    </div>
                  )}
                  {form.cashAccountId && form.cashAccountId !== 'none' && (
                    <div className="flex justify-between">
                      <span className="font-medium">Ödeme Durumu:</span>
                      <span className={form.isPaid ? 'text-green-600' : 'text-orange-600'}>
                        {form.isPaid ? 'Ödendi' : 'Ödenmedi'}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <Link href="/transactions">
              <Button type="button" variant="outline">
                İptal
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading || !form.type || !form.category || !form.amount}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}