'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Search, Edit, Trash2, Mail, Phone, MapPin } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import { LoadingButton, TableSkeleton } from '@/components/ui/loading'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  taxId?: string
  createdAt: string
}

export default function ClientsPage() {
  const { data: session } = useSession()
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
  })

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      } else {
        toast.error('Müşteriler yüklenirken hata oluştu')
      }
    } catch (error) {
      console.error('Müşteriler yüklenirken hata:', error)
      toast.error('Bağlantı hatası oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const loadingToastId = toast.loading(
      editingClient ? 'Müşteri güncelleniyor...' : 'Müşteri kaydediliyor...'
    )
    
    try {
      const method = editingClient ? 'PUT' : 'POST'
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchClients()
        setIsDialogOpen(false)
        setEditingClient(null)
        setFormData({
          name: '',
          email: '',
          phone: '',
          address: '',
          taxId: '',
        })
        
        toast.success_update(
          loadingToastId,
          editingClient ? 'Müşteri başarıyla güncellendi!' : 'Müşteri başarıyla kaydedildi!'
        )
      } else {
        const errorData = await response.json()
        toast.error_update(loadingToastId, errorData.error || 'Bir hata oluştu')
      }
    } catch (error) {
      console.error('Müşteri kaydedilirken hata:', error)
      toast.error_update(loadingToastId, 'Bağlantı hatası oluştu')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      taxId: client.taxId || '',
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (clientId: string): Promise<boolean> => {
    setIsDeletingId(clientId)
    const loadingToastId = toast.loading('Müşteri siliniyor...')
    
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchClients()
        toast.success_update(loadingToastId, 'Müşteri başarıyla silindi!')
        return true // Başarılı silme - dialog kapatılacak
      } else {
        const errorData = await response.json()
        toast.error_update(loadingToastId, errorData.error || 'Silme işlemi başarısız')
        return false // Hata durumu - dialog açık kalacak
      }
    } catch (error) {
      console.error('Müşteri silinirken hata:', error)
      toast.error_update(loadingToastId, 'Bağlantı hatası oluştu')
      return false // Hata durumu - dialog açık kalacak
    } finally {
      setIsDeletingId(null)
    }
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Şirket Carileri</h1>
            <p className="text-gray-600">Şirketinizin müşterilerini (carilerini) yönetin</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Yeni Cari</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? 'Cari Düzenle' : 'Yeni Cari'}
                </DialogTitle>
                <DialogDescription>
                  Cari bilgilerini girin ve kaydedin.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Ad *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      E-posta
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">
                      Telefon
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="address" className="text-right">
                      Adres
                    </Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="taxId" className="text-right">
                      Vergi No
                    </Label>
                    <Input
                      id="taxId"
                      value={formData.taxId}
                      onChange={(e) =>
                        setFormData({ ...formData, taxId: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <LoadingButton 
                    type="submit"
                    loading={isSubmitting}
                    loadingText={editingClient ? 'Güncelleniyor...' : 'Kaydediliyor...'}
                  >
                    {editingClient ? 'Güncelle' : 'Kaydet'}
                  </LoadingButton>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton rows={5} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cari Adı</TableHead>
                    <TableHead>İletişim</TableHead>
                    <TableHead>Adres</TableHead>
                    <TableHead>Vergi No</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        {searchTerm
                          ? 'Arama kriterinize uygun cari bulunamadı'
                          : 'Henüz cari eklenmemiş'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          {client.name}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {client.email && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail className="h-3 w-3 mr-1" />
                                {client.email}
                              </div>
                            )}
                            {client.phone && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="h-3 w-3 mr-1" />
                                {client.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.address && (
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-3 w-3 mr-1" />
                              {client.address}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{client.taxId}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(client)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <ConfirmDialog
                              title="Cari Sil"
                              description={`"${client.name}" isimli cariyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
                              confirmText="Sil"
                              cancelText="İptal"
                              onConfirm={() => handleDelete(client.id)}
                              isLoading={isDeletingId === client.id}
                              variant="destructive"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                disabled={isDeletingId === client.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </ConfirmDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
} 