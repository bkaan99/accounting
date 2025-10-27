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
import { UserCog, Users, Building2, Mail, Phone, Edit, Trash2, Plus, Key } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import { LoadingButton, TableSkeleton } from '@/components/ui/loading'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface Employee {
  id: string
  name: string
  email: string
  phone?: string
  role: 'USER' | 'ADMIN'
  createdAt: string
  _count: {
    clients: number
    invoices: number
    transactions: number
  }
}

export default function AdminEmployeesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'USER' as 'USER' | 'ADMIN',
  })

  // Yetki kontrolü - sadece ADMIN ve SUPERADMIN
  useEffect(() => {
    if (session && !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      router.push('/dashboard')
    }
  }, [session, router])

  useEffect(() => {
    if (session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN') {
      fetchEmployees()
    }
  }, [session])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/admin/employees')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
      } else {
        toast.error('Çalışanlar yüklenirken hata oluştu')
      }
    } catch (error) {
      console.error('Çalışanlar yüklenirken hata:', error)
      toast.error('Bağlantı hatası oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const loadingToastId = toast.loading(
      editingEmployee ? 'Çalışan güncelleniyor...' : 'Çalışan kaydediliyor...'
    )
    
    try {
      const method = editingEmployee ? 'PUT' : 'POST'
      const url = editingEmployee ? `/api/admin/employees/${editingEmployee.id}` : '/api/admin/employees'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchEmployees()
        setIsDialogOpen(false)
        setEditingEmployee(null)
        setFormData({
          name: '',
          email: '',
          phone: '',
          role: 'USER',
        })
        
        toast.success_update(
          loadingToastId,
          editingEmployee ? 'Çalışan başarıyla güncellendi!' : 'Çalışan başarıyla kaydedildi!'
        )
      } else {
        const errorData = await response.json()
        toast.error_update(loadingToastId, errorData.error || 'Bir hata oluştu')
      }
    } catch (error) {
      console.error('Çalışan kaydedilirken hata:', error)
      toast.error_update(loadingToastId, 'Bağlantı hatası oluştu')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone || '',
      role: employee.role,
    })
    setIsDialogOpen(true)
  }

  const handleResetPassword = async (employeeId: string) => {
    const loadingToastId = toast.loading('Şifre sıfırlanıyor...')
    
    try {
      const response = await fetch(`/api/admin/employees/${employeeId}/reset-password`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        toast.success_update(loadingToastId, `Şifre sıfırlandı! Yeni şifre: ${data.newPassword}`)
      } else {
        const errorData = await response.json()
        toast.error_update(loadingToastId, errorData.error || 'Şifre sıfırlama başarısız')
      }
    } catch (error) {
      console.error('Şifre sıfırlanırken hata:', error)
      toast.error_update(loadingToastId, 'Bağlantı hatası oluştu')
    }
  }

  const handleDelete = async (employeeId: string): Promise<boolean> => {
    setIsDeletingId(employeeId)
    const loadingToastId = toast.loading('Çalışan siliniyor...')
    
    try {
      const response = await fetch(`/api/admin/employees/${employeeId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchEmployees()
        toast.success_update(loadingToastId, 'Çalışan başarıyla silindi!')
        return true
      } else {
        const errorData = await response.json()
        toast.error_update(loadingToastId, errorData.error || 'Silme işlemi başarısız')
        return false
      }
    } catch (error) {
      console.error('Çalışan silinirken hata:', error)
      toast.error_update(loadingToastId, 'Bağlantı hatası oluştu')
      return false
    } finally {
      setIsDeletingId(null)
    }
  }

  if (!['ADMIN', 'SUPERADMIN'].includes(session?.user.role || '')) {
    return null
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <UserCog className="h-8 w-8 text-green-600" />
              <span>Çalışan Yönetimi</span>
            </h1>
            <p className="text-gray-600">
              Şirketinizdeki çalışanları görüntüleyin ve yönetin
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Yeni Çalışan</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingEmployee ? 'Çalışan Düzenle' : 'Yeni Çalışan'}
                </DialogTitle>
                <DialogDescription>
                  Çalışan bilgilerini girin ve kaydedin.
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
                      E-posta *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="col-span-3"
                      required
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
                    <Label htmlFor="role" className="text-right">
                      Rol *
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: 'USER' | 'ADMIN') =>
                        setFormData({ ...formData, role: value })
                      }
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">Çalışan</SelectItem>
                        <SelectItem value="ADMIN">Yönetici</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <LoadingButton 
                    type="submit"
                    loading={isSubmitting}
                    loadingText={editingEmployee ? 'Güncelleniyor...' : 'Kaydediliyor...'}
                  >
                    {editingEmployee ? 'Güncelle' : 'Kaydet'}
                  </LoadingButton>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Toplam Çalışan
              </CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {employees.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Yönetici</CardTitle>
              <UserCog className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {employees.filter((e: Employee) => e.role === 'ADMIN').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Aktif Çalışan
              </CardTitle>
              <Building2 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {employees.filter((e: Employee) => e._count.transactions > 0).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Çalışan Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton rows={5} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Çalışan</TableHead>
                    <TableHead>İletişim</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>İstatistikler</TableHead>
                    <TableHead>Kayıt Tarihi</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Henüz çalışan bulunmuyor
                      </TableCell>
                    </TableRow>
                  ) : (
                    employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-sm text-gray-600 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {employee.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {employee.phone && (
                            <div className="text-sm text-gray-600 flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {employee.phone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              employee.role === 'ADMIN'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {employee.role === 'ADMIN' ? 'Yönetici' : 'Çalışan'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div>{employee._count.clients} müşteri</div>
                            <div>{employee._count.invoices} fatura</div>
                            <div>{employee._count.transactions} işlem</div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(employee.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(employee)}
                              disabled={isDeletingId === employee.id}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <ConfirmDialog
                              title="Şifre Sıfırla"
                              description={`"${employee.name}" isimli çalışanın şifresini sıfırlamak istediğinizden emin misiniz? Yeni şifre otomatik oluşturulacak ve gösterilecektir.`}
                              confirmText="Sıfırla"
                              cancelText="İptal"
                              onConfirm={() => handleResetPassword(employee.id)}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700"
                                disabled={isDeletingId === employee.id}
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                            </ConfirmDialog>
                            <ConfirmDialog
                              title="Çalışan Sil"
                              description={`"${employee.name}" isimli çalışanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.${
                                employee.id === session?.user.id 
                                  ? '\n\nDikkat: Kendi hesabınızı silemezsiniz.' 
                                  : employee._count.clients > 0 || employee._count.invoices > 0 || employee._count.transactions > 0
                                    ? '\n\nDikkat: Bu çalışana ait veriler var.'
                                    : ''
                              }`}
                              confirmText="Sil"
                              cancelText="İptal"
                              onConfirm={() => handleDelete(employee.id)}
                              isLoading={isDeletingId === employee.id}
                              variant="destructive"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                disabled={isDeletingId === employee.id || employee.id === session?.user.id}
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
