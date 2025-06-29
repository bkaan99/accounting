'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/loading'
import { MonthlyChart } from '@/components/charts/monthly-chart'
import { CategoryChart } from '@/components/charts/category-chart'
import { StatusChart } from '@/components/charts/status-chart'
import { ClientChart } from '@/components/charts/client-chart'
import { formatCurrency } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  Calendar,
  RefreshCw,
  Download,
} from 'lucide-react'
import { toast } from 'sonner'

interface ReportsData {
  monthlyData: Array<{
    month: string
    income: number
    expense: number
    profit: number
  }>
  categoryData: Array<{
    category: string
    amount: number
  }>
  statusData: Array<{
    status: string
    count: number
    amount: number
  }>
  clientData: Array<{
    clientName: string
    revenue: number
  }>
  trends: {
    incomeChange: number
    expenseChange: number
    profitChange: {
      current: number
      previous: number
    }
  }
  summary: {
    totalIncome: number
    totalExpense: number
    totalProfit: number
    averageMonthlyIncome: number
    averageMonthlyExpense: number
  }
}

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('6') // months

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const fetchReports = async (months: string = selectedPeriod) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reports?months=${months}`)
      if (!response.ok) {
        throw new Error('Rapor verileri yüklenemedi')
      }
      const reportsData = await response.json()
      setData(reportsData)
    } catch (error) {
      console.error('Reports fetch error:', error)
      toast.error('Rapor verileri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchReports()
    }
  }, [session?.user?.id, selectedPeriod])

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value)
    fetchReports(value)
  }

  const handleRefresh = () => {
    fetchReports()
    toast.success('Raporlar güncellendi')
  }

  const getProfitChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getProfitChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <DollarSign className="h-4 w-4 text-gray-600" />
  }

  if (status === 'loading' || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    )
  }

  if (!data) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Rapor verileri yüklenemedi</p>
            <Button onClick={() => fetchReports()}>Tekrar Dene</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Finansal Raporlar
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              İşletmenizin detaylı finansal analizi
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-40">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Son 3 Ay</SelectItem>
                <SelectItem value="6">Son 6 Ay</SelectItem>
                <SelectItem value="12">Son 12 Ay</SelectItem>
                <SelectItem value="24">Son 24 Ay</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Yenile
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">
                Toplam Gelir
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {formatCurrency(data.summary.totalIncome)}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Ort. Aylık: {formatCurrency(data.summary.averageMonthlyIncome)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">
                Toplam Gider
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                {formatCurrency(data.summary.totalExpense)}
              </div>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                Ort. Aylık: {formatCurrency(data.summary.averageMonthlyExpense)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Net Kar
              </CardTitle>
              {getProfitChangeIcon(data.summary.totalProfit)}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getProfitChangeColor(data.summary.totalProfit)} dark:text-blue-300`}>
                {formatCurrency(data.summary.totalProfit)}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Bu Ay: {formatCurrency(data.trends.profitChange.current)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">
                Değişim Oranı
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                Gelir: {data.trends.incomeChange > 0 ? '+' : ''}{data.trends.incomeChange.toFixed(1)}%
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                Gider: {data.trends.expenseChange > 0 ? '+' : ''}{data.trends.expenseChange.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Aylık Gelir-Gider Trendi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyChart data={data.monthlyData} />
            </CardContent>
          </Card>

          {/* Expense Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-orange-600" />
                Gider Kategorileri
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.categoryData.length > 0 ? (
                <CategoryChart data={data.categoryData} />
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-500">
                  Bu dönemde gider kaydı bulunmuyor
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Fatura Durumu
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.statusData.length > 0 ? (
                <StatusChart data={data.statusData} />
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-500">
                  Fatura kaydı bulunmuyor
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Clients */}
          {data.clientData.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  En İyi Müşteriler (Ödenen Faturalar)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ClientChart data={data.clientData} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-gray-600" />
              Rapor İndirme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" disabled>
                <Download className="h-4 w-4 mr-2" />
                PDF Rapor (Yakında)
              </Button>
              <Button variant="outline" disabled>
                <Download className="h-4 w-4 mr-2" />
                Excel Rapor (Yakında)
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Detaylı raporları PDF ve Excel formatında indirme özelliği yakında eklenecek.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
} 