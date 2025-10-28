'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'
import { Building2, Users, Mail, Phone, Edit, Trash2, Plus, FileText, TrendingUp } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import { LoadingButton, TableSkeleton } from '@/components/ui/loading'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface Company {
  id: string
  name: string
  taxId?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  logo?: string
  createdAt: string
  _count: {
    users: number
    clients: number
    invoices: number
    transactions: number
  }
}

export default function AdminCompaniesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    taxId: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logo: '',
  })

  // Yetki kontrolü
  useEffect(() => {
    if (session && session.user.role !== 'SUPERADMIN') {
      router.push('/dashboard')
    }
  }, [session, router])

  useEffect(() => {
    if (session?.user.role === 'SUPERADMIN') {
      fetchCompanies()
    }
  }, [session])

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      if (response.ok) {
        const data = await response.json()
        setCompanies(data)
      } else {
        toast.error('Şirketler yüklenirken hata oluştu')
      }
    } catch (error) {
      console.error('Şirketler yüklenirken hata:', error)
      toast.error('Bağlantı hatası oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const loadingToastId = toast.loading(
      editingCompany ? 'Şirket güncelleniyor...' : 'Şirket kaydediliyor...'
    )
    
    try {
      const method = editingCompany ? 'PUT' : 'POST'
      const url = editingCompany ? `/api/companies/${editingCompany.id}` : '/api/companies'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchCompanies()
        setIsDialogOpen(false)
        setEditingCompany(null)
        setFormData({
          name: '',
          taxId: '',
          address: '',
          phone: '',
          email: '',
          website: '',
          logo: '',
        })
        
        toast.success_update(
          loadingToastId,
          editingCompany ? 'Şirket başarıyla güncellendi!' : 'Şirket başarıyla kaydedildi!'
        )
      } else {
        const errorData = await response.json()
        toast.error_update(loadingToastId, errorData.error || 'Bir hata oluştu')
      }
    } catch (error) {
      console.error('Şirket kaydedilirken hata:', error)
      toast.error_update(loadingToastId, 'Bağlantı hatası oluştu')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (company: Company) => {
    setEditingCompany(company)
    setFormData({
      name: company.name,
      taxId: company.taxId || '',
      address: company.address || '',
      phone: company.phone || '',
      email: company.email || '',
      website: company.website || '',
      logo: company.logo || '',
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (companyId: string): Promise<boolean> => {
    setIsDeletingId(companyId)
    const loadingToastId = toast.loading('Şirket siliniyor...')
    
    try {
      const response = await fetch(`/api/companies/${companyId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchCompanies()
        toast.success_update(loadingToastId, 'Şirket başarıyla silindi!')
        return true
      } else {
        const errorData = await response.json()
        toast.error_update(loadingToastId, errorData.error || 'Silme işlemi başarısız')
        return false
      }
    } catch (error) {
      console.error('Şirket silinirken hata:', error)
      toast.error_update(loadingToastId, 'Bağlantı hatası oluştu')
      return false
    } finally {
      setIsDeletingId(null)
    }
  }

  if (session?.user.role !== 'SUPERADMIN') {
    return null
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-green-600" />
              <span>Şirket Yönetimi</span>
            </h1>
            <p className="text-gray-600">
              Tüm şirketleri görüntüleyin ve yönetin
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Yeni Şirket</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingCompany ? 'Şirket Düzenle' : 'Yeni Şirket'}
                </DialogTitle>
                <DialogDescription>
                  Şirket bilgilerini girin ve kaydedin.
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
                    <Label htmlFor="website" className="text-right">
                      Website
                    </Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) =>
                        setFormData({ ...formData, website: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="logo" className="text-right">
                      Logo URL
                    </Label>
                    <Input
                      id="logo"
                      value={formData.logo}
                      onChange={(e) =>
                        setFormData({ ...formData, logo: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <LoadingButton 
                    type="submit"
                    loading={isSubmitting}
                    loadingText={editingCompany ? 'Güncelleniyor...' : 'Kaydediliyor...'}
                  >
                    {editingCompany ? 'Güncelle' : 'Kaydet'}
                  </LoadingButton>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Toplam Şirket
              </CardTitle>
              <Building2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {companies.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admin Şirket</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {companies.filter((c: Company) => c.role === 'ADMIN').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Toplam Fatura
              </CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {companies.reduce((sum, c) => sum + c._count.invoices, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Toplam İşlem
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {companies.reduce((sum, c) => sum + c._count.transactions, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tüm Şirketler</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton rows={5} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Şirket</TableHead>
                    <TableHead>İletişim</TableHead>
                    <TableHead>Adres</TableHead>
                    <TableHead>Vergi No</TableHead>
                    <TableHead>İstatistikler</TableHead>
                    <TableHead>Kayıt Tarihi</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Henüz şirket bulunmuyor
                      </TableCell>
                    </TableRow>
                  ) : (
                    companies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{company.name}</div>
                            {company.email && (
                              <div className="text-sm text-gray-600 flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {company.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {company.phone && (
                            <div className="text-sm text-gray-600 flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {company.phone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {company.address}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {company.taxId}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div>{company._count.users} kullanıcı</div>
                            <div>{company._count.clients} müşteri</div>
                            <div>{company._count.invoices} fatura</div>
                            <div>{company._count.transactions} işlem</div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(company.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(company)}
                              disabled={isDeletingId === company.id}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <ConfirmDialog
                              title="Şirket Sil"
                              description={`"${company.name}" isimli şirketi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.${
                                company._count.users > 0 || company._count.clients > 0 || company._count.invoices > 0 || company._count.transactions > 0
                                  ? '\n\nDikkat: Bu şirkete ait veriler var.'
                                  : ''
                              }`}
                              confirmText="Sil"
                              cancelText="İptal"
                              onConfirm={() => handleDelete(company.id)}
                              isLoading={isDeletingId === company.id}
                              variant="destructive"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                disabled={isDeletingId === company.id}
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
