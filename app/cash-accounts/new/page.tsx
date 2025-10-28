'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Wallet, CreditCard, Building2 } from 'lucide-react'

export default function NewCashAccountPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    initialBalance: '0',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.type) {
      alert('Kasa adı ve türü gereklidir')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/cash-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          description: formData.description || null,
          initialBalance: parseFloat(formData.initialBalance) || 0,
        }),
      })

      if (response.ok) {
        router.push('/cash-accounts')
      } else {
        const error = await response.json()
        alert(error.error || 'Kasa oluşturulurken hata oluştu')
      }
    } catch (error) {
      console.error('Error creating cash account:', error)
      alert('Kasa oluşturulurken hata oluştu')
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

  if (status === 'loading') {
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
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Yeni Kasa Oluştur
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Şirketiniz için yeni bir kasa hesabı oluşturun
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Kasa Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Kasa Adı *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Örn: Nakit Kasa, Kredi Kartı Kasası"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Kasa Türü *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kasa türünü seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">
                      <div className="flex items-center space-x-2">
                        <Wallet className="h-4 w-4 text-green-600" />
                        <span>Nakit Kasa</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="CREDIT_CARD">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        <span>Kredi Kartı</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="BANK_ACCOUNT">
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-purple-600" />
                        <span>Banka Hesabı</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="Kasa hakkında açıklama (opsiyonel)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="initialBalance">Başlangıç Bakiyesi</Label>
                <Input
                  id="initialBalance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.initialBalance}
                  onChange={(e) => setFormData({ ...formData, initialBalance: e.target.value })}
                />
                <p className="text-sm text-gray-500">
                  Kasa oluşturulduğunda bu miktar bakiyeye eklenecek
                </p>
              </div>

              <div className="flex items-center justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  İptal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Oluşturuluyor...' : 'Kasa Oluştur'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview */}
        {formData.name && formData.type && (
          <Card>
            <CardHeader>
              <CardTitle>Önizleme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {getCashAccountIcon(formData.type)}
                <div>
                  <h3 className="font-medium">{formData.name}</h3>
                  <p className="text-sm text-gray-600">
                    {formData.type === 'CASH' && 'Nakit Kasa'}
                    {formData.type === 'CREDIT_CARD' && 'Kredi Kartı'}
                    {formData.type === 'BANK_ACCOUNT' && 'Banka Hesabı'}
                  </p>
                  {formData.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.description}
                    </p>
                  )}
                  <p className="text-sm font-medium text-green-600 mt-1">
                    Başlangıç Bakiyesi: ₺{parseFloat(formData.initialBalance || '0').toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
