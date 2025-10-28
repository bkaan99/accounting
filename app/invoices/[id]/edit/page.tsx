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
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/toast'

interface InvoiceItem {
  id?: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
}

interface Invoice {
  id: string
  number: string
  issueDate: string
  dueDate: string
  status: 'UNPAID' | 'PAID' | 'OVERDUE'
  notes?: string
  client: Client
  items: InvoiceItem[]
}

export default function EditInvoicePage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [formData, setFormData] = useState({
    clientId: '',
    issueDate: '',
    dueDate: '',
    status: 'UNPAID' as 'UNPAID' | 'PAID' | 'OVERDUE',
    notes: '',
    items: [] as InvoiceItem[],
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchInvoice()
      fetchClients()
    }
  }, [status, params.id])

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setInvoice(data)
        setFormData({
          clientId: data.clientId,
          issueDate: new Date(data.issueDate).toISOString().split('T')[0],
          dueDate: new Date(data.dueDate).toISOString().split('T')[0],
          status: data.status,
          notes: data.notes || '',
          items: data.items.map((item: any) => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.price,
            total: item.total,
          })),
        })
      } else if (response.status === 404) {
        router.push('/invoices')
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
    }
  }

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0,
      }]
    }))
  }

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.items]
      newItems[index] = { ...newItems[index], [field]: value }
      
      // Calculate total
      if (field === 'quantity' || field === 'unitPrice') {
        newItems[index].total = newItems[index].quantity * newItems[index].unitPrice
      }
      
      return { ...prev, items: newItems }
    })
  }

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.clientId || formData.items.length === 0) {
      toast.error('Müşteri seçimi ve en az bir kalem gereklidir')
      return
    }

    // Validate items
    for (const item of formData.items) {
      if (!item.description || item.quantity <= 0 || item.unitPrice <= 0) {
        toast.error('Tüm kalemlerin açıklama, miktar ve birim fiyatı dolu olmalıdır')
        return
      }
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/invoices/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: formData.clientId,
          issueDate: formData.issueDate,
          dueDate: formData.dueDate,
          status: formData.status,
          notes: formData.notes,
          items: formData.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        }),
      })

      if (response.ok) {
        toast.success('Fatura başarıyla güncellendi!')
        router.push('/invoices')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Fatura güncellenirken hata oluştu')
      }
    } catch (error) {
      console.error('Error updating invoice:', error)
      toast.error('Fatura güncellenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || !invoice) {
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/invoices">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Fatura Düzenle
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {invoice.number} numaralı faturayı düzenleyin
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fatura Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle>Fatura Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientId">Müşteri *</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Müşteri seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Durum</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNPAID">Ödenmemiş</SelectItem>
                      <SelectItem value="PAID">Ödenmiş</SelectItem>
                      <SelectItem value="OVERDUE">Gecikmiş</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="issueDate">Fatura Tarihi *</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="dueDate">Vade Tarihi *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notlar</Label>
                <textarea
                  id="notes"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Fatura notları (opsiyonel)"
                />
              </div>
            </CardContent>
          </Card>

          {/* Fatura Kalemleri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Fatura Kalemleri</span>
                <Button type="button" onClick={addItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Kalem Ekle
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {formData.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Henüz kalem eklenmemiş. Kalem eklemek için yukarıdaki butona tıklayın.
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 items-end">
                      <div className="col-span-5">
                        <Label>Açıklama *</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          placeholder="Kalem açıklaması"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Miktar *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Birim Fiyat *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Toplam</Label>
                        <Input
                          value={item.total.toFixed(2)}
                          disabled
                          className="bg-gray-50 dark:bg-gray-800"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Toplam */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-end">
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    Toplam: ₺{calculateTotal().toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <Link href="/invoices">
              <Button type="button" variant="outline">
                İptal
              </Button>
            </Link>
            <Button type="submit" disabled={loading || formData.items.length === 0}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}