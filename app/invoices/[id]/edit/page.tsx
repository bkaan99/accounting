'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import Link from 'next/link'

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
}

interface InvoiceItem {
  id?: string
  description: string
  quantity: number
  price: number
  total: number
}

interface Invoice {
  id: string
  number: string
  clientId: string
  issueDate: string
  dueDate: string
  status: string
  totalAmount: number
  notes?: string
  client: Client
  items: InvoiceItem[]
}

interface InvoiceForm {
  clientId: string
  issueDate: string
  dueDate: string
  status: string
  notes: string
  items: Omit<InvoiceItem, 'id' | 'total'>[]
}

export default function EditInvoicePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [clients, setClients] = useState<Client[]>([])
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<InvoiceForm>({
    clientId: '',
    issueDate: '',
    dueDate: '',
    status: 'DRAFT',
    notes: '',
    items: [{ description: '', quantity: 1, price: 0 }],
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (params.id) {
      fetchInvoice()
      fetchClients()
    }
  }, [params.id])

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setInvoice(data)

        // Form'u mevcut verilerle doldur
        setForm({
          clientId: data.clientId,
          issueDate: data.issueDate.split('T')[0],
          dueDate: data.dueDate.split('T')[0],
          status: data.status,
          notes: data.notes || '',
          items: data.items.map((item: InvoiceItem) => ({
            description: item.description,
            quantity: item.quantity,
            price: item.price,
          })),
        })
      } else if (response.status === 404) {
        router.push('/invoices')
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
    } finally {
      setLoading(false)
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

  const handleItemChange = (
    index: number,
    field: keyof Omit<InvoiceItem, 'id' | 'total'>,
    value: string | number
  ) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }))
  }

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, price: 0 }],
    }))
  }

  const removeItem = (index: number) => {
    if (form.items.length > 1) {
      setForm((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }))
    }
  }

  const calculateTotal = () => {
    return form.items.reduce((sum, item) => sum + item.quantity * item.price, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/invoices/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          items: form.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
        }),
      })

      if (response.ok) {
        router.push(`/invoices/${params.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Fatura güncellenirken hata oluştu')
      }
    } catch (error) {
      console.error('Error updating invoice:', error)
      alert('Fatura güncellenirken hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Yükleniyor...</div>
        </div>
      </MainLayout>
    )
  }

  if (!invoice) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Fatura bulunamadı
            </h2>
            <Link href="/invoices">
              <Button>Faturalara Dön</Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href={`/invoices/${params.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Fatura Düzenle: {invoice.number}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Fatura bilgilerini güncelleyin
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Müşteri Seçimi */}
          <Card>
            <CardHeader>
              <CardTitle>Müşteri Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="client">Müşteri</Label>
                <select
                  id="client"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                  value={form.clientId}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, clientId: e.target.value }))
                  }
                  required
                >
                  <option value="">Müşteri seçiniz...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Fatura Detayları */}
          <Card>
            <CardHeader>
              <CardTitle>Fatura Detayları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="issueDate">Fatura Tarihi</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={form.issueDate}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        issueDate: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Vade Tarihi</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={form.dueDate}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, dueDate: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Durum</Label>
                  <select
                    id="status"
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                    value={form.status}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, status: e.target.value }))
                    }
                  >
                    <option value="DRAFT">Taslak</option>
                    <option value="SENT">Gönderildi</option>
                    <option value="PAID">Ödendi</option>
                    <option value="OVERDUE">Gecikmiş</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notlar</Label>
                <textarea
                  id="notes"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                  rows={3}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Fatura ile ilgili notlar..."
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
              <div className="space-y-4">
                {form.items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="md:col-span-2">
                      <Label htmlFor={`description-${index}`}>Açıklama</Label>
                      <Input
                        id={`description-${index}`}
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(index, 'description', e.target.value)
                        }
                        placeholder="Ürün/hizmet açıklaması"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`quantity-${index}`}>Miktar</Label>
                      <Input
                        id={`quantity-${index}`}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            'quantity',
                            parseInt(e.target.value) || 1
                          )
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`price-${index}`}>Birim Fiyat (₺)</Label>
                      <Input
                        id={`price-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            'price',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        required
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="flex-1">
                        <Label>Toplam</Label>
                        <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded-md text-right font-medium">
                          ₺{(item.quantity * item.price).toFixed(2)}
                        </div>
                      </div>
                      {form.items.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    Genel Toplam: ₺{calculateTotal().toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <Link href={`/invoices/${params.id}`}>
              <Button type="button" variant="outline">
                İptal
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}
