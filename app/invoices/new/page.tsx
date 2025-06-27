'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Plus, Trash2, FileText } from 'lucide-react'
import Link from 'next/link'

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
}

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
}

interface InvoiceForm {
  clientId: string
  clientInfo: {
    name: string
    email: string
    phone: string
    address: string
  }
  issueDate: string
  dueDate: string
  notes: string
  items: InvoiceItem[]
}

export default function NewInvoicePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<InvoiceForm>({
    clientId: '',
    clientInfo: {
      name: '',
      email: '',
      phone: '',
      address: '',
    },
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    notes: '',
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    fetchClients()
  }, [])

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

  const handleClientSelect = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    if (client) {
      setSelectedClient(client)
      setForm((prev) => ({
        ...prev,
        clientId: client.id,
        clientInfo: {
          name: client.name,
          email: client.email || '',
          phone: client.phone || '',
          address: client.address || '',
        },
      }))
    }
  }

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
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
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0 }],
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
    return form.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Remove clientInfo from form data since we don't need it for API
      const { clientInfo, ...invoiceData } = form

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      })

      if (response.ok) {
        router.push('/invoices')
      } else {
        const error = await response.json()
        alert(error.error || 'Fatura oluşturulurken hata oluştu')
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('Fatura oluşturulurken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return <div>Yükleniyor...</div>
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/invoices">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Yeni Fatura
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Yeni bir fatura oluşturun
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
                <Label htmlFor="client">Müşteri Seçin</Label>
                <select
                  id="client"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                  value={form.clientId}
                  onChange={(e) => handleClientSelect(e.target.value)}
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

              {selectedClient && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <Label htmlFor="clientName">Müşteri Adı</Label>
                    <Input
                      id="clientName"
                      value={form.clientInfo.name}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          clientInfo: {
                            ...prev.clientInfo,
                            name: e.target.value,
                          },
                        }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientEmail">E-posta</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={form.clientInfo.email}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          clientInfo: {
                            ...prev.clientInfo,
                            email: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientPhone">Telefon</Label>
                    <Input
                      id="clientPhone"
                      value={form.clientInfo.phone}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          clientInfo: {
                            ...prev.clientInfo,
                            phone: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientAddress">Adres</Label>
                    <Input
                      id="clientAddress"
                      value={form.clientInfo.address}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          clientInfo: {
                            ...prev.clientInfo,
                            address: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fatura Detayları */}
          <Card>
            <CardHeader>
              <CardTitle>Fatura Detayları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <Label htmlFor={`unitPrice-${index}`}>
                        Birim Fiyat (₺)
                      </Label>
                      <Input
                        id={`unitPrice-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            'unitPrice',
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
                          ₺{(item.quantity * item.unitPrice).toFixed(2)}
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
            <Link href="/invoices">
              <Button type="button" variant="outline">
                İptal
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Oluşturuluyor...' : 'Fatura Oluştur'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}
