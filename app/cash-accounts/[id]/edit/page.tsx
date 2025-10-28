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
import { ArrowLeft, Save, Wallet, CreditCard, Building2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/toast'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

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
}

export default function EditCashAccountPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [cashAccount, setCashAccount] = useState<CashAccount | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    isActive: true,
  })

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
        setFormData({
          name: data.name,
          type: data.type,
          description: data.description || '',
          isActive: data.isActive,
        })
      } else if (response.status === 404) {
        router.push('/cash-accounts')
      }
    } catch (error) {
      console.error('Error fetching cash account:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.type) {
      alert('Kasa adı ve türü gereklidir')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/cash-accounts/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          description: formData.description || null,
          isActive: formData.isActive,
        }),
      })

      if (response.ok) {
        router.push(`/cash-accounts/${params.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Kasa güncellenirken hata oluştu')
      }
    } catch (error) {
      console.error('Error updating cash account:', error)
      alert('Kasa güncellenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (): Promise<boolean> => {
    setDeleting(true)
    const loadingToastId = toast.loading('Kasa siliniyor...')
    
    try {
      const response = await fetch(`/api/cash-accounts/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success_update(loadingToastId, 'Kasa başarıyla silindi!')
        router.push('/cash-accounts')
        return true // Başarılı silme - dialog kapatılacak
      } else {
        const errorData = await response.json()
        toast.error_update(loadingToastId, errorData.error || 'Kasa silinirken hata oluştu')
        return false // Hata durumu - dialog açık kalacak
      }
    } catch (error) {
      console.error('Error deleting cash account:', error)
      toast.error_update(loadingToastId, 'Bağlantı hatası oluştu')
      return false // Hata durumu - dialog açık kalacak
    } finally {
      setDeleting(false)
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

  if (status === 'loading' || !cashAccount) {
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
        <div className="flex items-center space-x-4">
          <Link href={`/cash-accounts/${params.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Kasa Düzenle
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {cashAccount.name} kasasını düzenleyin - {cashAccount.company?.name || 'Şirketiniz'}
            </p>
          </div>
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
                <Label htmlFor="isActive">Durum</Label>
                <Select
                  value={formData.isActive ? 'true' : 'false'}
                  onValueChange={(value) => setFormData({ ...formData, isActive: value === 'true' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Aktif</SelectItem>
                    <SelectItem value="false">Pasif</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Pasif kasalar yeni işlemlerde görünmez
                </p>
              </div>

              <div className="flex items-center justify-between">
                <ConfirmDialog
                  title="Kasa Sil"
                  description={`"${cashAccount.name}" kasasını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve kasa ile ilgili tüm işlemler de silinecektir.`}
                  confirmText="Sil"
                  cancelText="İptal"
                  onConfirm={handleDelete}
                  isLoading={deleting}
                  variant="destructive"
                >
                  <Button
                    type="button"
                    variant="outline"
                    disabled={deleting}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deleting ? 'Siliniyor...' : 'Kasayı Sil'}
                  </Button>
                </ConfirmDialog>
                
                <div className="flex items-center space-x-4">
                  <Link href={`/cash-accounts/${params.id}`}>
                    <Button type="button" variant="outline">
                      İptal
                    </Button>
                  </Link>
                  <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Mevcut Kasa Bilgileri */}
        <Card>
          <CardHeader>
            <CardTitle>Mevcut Kasa Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {getCashAccountIcon(cashAccount.type)}
                <div className="flex-1">
                  <h3 className="font-medium">{cashAccount.name}</h3>
                  <p className="text-sm text-gray-600">
                    {formData.type === 'CASH' && 'Nakit Kasa'}
                    {formData.type === 'CREDIT_CARD' && 'Kredi Kartı'}
                    {formData.type === 'BANK_ACCOUNT' && 'Banka Hesabı'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Mevcut Bakiye: ₺{cashAccount.balance.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    Oluşturulma: {new Date(cashAccount.createdAt).toLocaleDateString('tr-TR')}
                  </p>
                  <p className="text-sm text-gray-500">
                    Son Güncelleme: {new Date(cashAccount.updatedAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
