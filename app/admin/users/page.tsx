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

interface User {
  id: string
  name: string
  email: string
  company?: string
  phone?: string
  role: 'USER' | 'ADMIN' | 'SUPERADMIN'
  createdAt: string
  _count: {
    clients: number
    invoices: number
    transactions: number
  }
}

export default function AdminUsersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    role: 'USER' as 'USER' | 'ADMIN' | 'SUPERADMIN',
  })

  // Yetki kontrolü
  useEffect(() => {
    if (session && session.user.role !== 'SUPERADMIN') {
      router.push('/dashboard')
    }
  }, [session, router])

  useEffect(() => {
    if (session?.user.role === 'SUPERADMIN') {
      fetchUsers()
    }
  }, [session])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        toast.error('Kullanıcılar yüklenirken hata oluştu')
      }
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error)
      toast.error('Bağlantı hatası oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const loadingToastId = toast.loading(
      editingUser ? 'Kullanıcı güncelleniyor...' : 'Kullanıcı kaydediliyor...'
    )
    
    try {
      const method = editingUser ? 'PUT' : 'POST'
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchUsers()
        setIsDialogOpen(false)
        setEditingUser(null)
        setFormData({
          name: '',
          email: '',
          company: '',
          phone: '',
          role: 'USER',
        })
        
        toast.success_update(
          loadingToastId,
          editingUser ? 'Kullanıcı başarıyla güncellendi!' : 'Kullanıcı başarıyla kaydedildi!'
        )
      } else {
        const errorData = await response.json()
        toast.error_update(loadingToastId, errorData.error || 'Bir hata oluştu')
      }
    } catch (error) {
      console.error('Kullanıcı kaydedilirken hata:', error)
      toast.error_update(loadingToastId, 'Bağlantı hatası oluştu')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      company: user.company || '',
      phone: user.phone || '',
      role: user.role,
    })
    setIsDialogOpen(true)
  }

  const handleResetPassword = async (userId: string) => {
    const loadingToastId = toast.loading('Şifre sıfırlanıyor...')
    
    try {
      const response = await fetch(`/api/users/${userId}/reset-password`, {
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

  const handleDelete = async (userId: string): Promise<boolean> => {
    setIsDeletingId(userId)
    const loadingToastId = toast.loading('Kullanıcı siliniyor...')
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchUsers()
        toast.success_update(loadingToastId, 'Kullanıcı başarıyla silindi!')
        return true // Başarılı silme - dialog kapatılacak
      } else {
        const errorData = await response.json()
        toast.error_update(loadingToastId, errorData.error || 'Silme işlemi başarısız')
        return false // Hata durumu - dialog açık kalacak
      }
    } catch (error) {
      console.error('Kullanıcı silinirken hata:', error)
      toast.error_update(loadingToastId, 'Bağlantı hatası oluştu')
      return false // Hata durumu - dialog açık kalacak
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
              <UserCog className="h-8 w-8 text-blue-600" />
              <span>Kullanıcı Yönetimi</span>
            </h1>
            <p className="text-gray-600">
              Tüm kullanıcıları görüntüleyin ve yönetin
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Yeni Kullanıcı</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
                </DialogTitle>
                <DialogDescription>
                  Kullanıcı bilgilerini girin ve kaydedin.
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
                    <Label htmlFor="company" className="text-right">
                      Şirket
                    </Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) =>
                        setFormData({ ...formData, company: e.target.value })
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
                    <Label htmlFor="role" className="text-right">
                      Rol *
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: 'USER' | 'ADMIN' | 'SUPERADMIN') =>
                        setFormData({ ...formData, role: value })
                      }
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">Kullanıcı</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="SUPERADMIN">Süperadmin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <LoadingButton 
                    type="submit"
                    loading={isSubmitting}
                    loadingText={editingUser ? 'Güncelleniyor...' : 'Kaydediliyor...'}
                  >
                    {editingUser ? 'Güncelle' : 'Kaydet'}
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
                Toplam Kullanıcı
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {users.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Süperadmin</CardTitle>
              <UserCog className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {users.filter((u: User) => u.role === 'SUPERADMIN').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Aktif Şirket
              </CardTitle>
              <Building2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {users.filter((u: User) => u.company).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tüm Kullanıcılar</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton rows={5} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>İletişim</TableHead>
                    <TableHead>Şirket</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>İstatistikler</TableHead>
                    <TableHead>Kayıt Tarihi</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Henüz kullanıcı bulunmuyor
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-600 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.phone && (
                            <div className="text-sm text-gray-600 flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {user.phone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.company && (
                            <div className="text-sm flex items-center">
                              <Building2 className="h-3 w-3 mr-1" />
                              {user.company}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              user.role === 'SUPERADMIN'
                                ? 'bg-purple-100 text-purple-800'
                                : user.role === 'ADMIN'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {user.role === 'SUPERADMIN'
                              ? 'Süperadmin'
                              : user.role === 'ADMIN'
                                ? 'Admin'
                                : 'Kullanıcı'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div>{user._count.clients} müşteri</div>
                            <div>{user._count.invoices} fatura</div>
                            <div>{user._count.transactions} işlem</div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(user)}
                              disabled={isDeletingId === user.id}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <ConfirmDialog
                              title="Şifre Sıfırla"
                              description={`"${user.name}" isimli kullanıcının şifresini sıfırlamak istediğinizden emin misiniz? Yeni şifre otomatik oluşturulacak ve gösterilecektir.`}
                              confirmText="Sıfırla"
                              cancelText="İptal"
                              onConfirm={() => handleResetPassword(user.id)}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700"
                                disabled={isDeletingId === user.id}
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                            </ConfirmDialog>
                            <ConfirmDialog
                              title="Kullanıcı Sil"
                              description={`"${user.name}" isimli kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.${
                                user.id === session?.user.id 
                                  ? '\n\nDikkat: Kendi hesabınızı silemezsiniz.' 
                                  : user._count.clients > 0 || user._count.invoices > 0 || user._count.transactions > 0
                                    ? '\n\nDikkat: Bu kullanıcıya ait veriler var.'
                                    : ''
                              }`}
                              confirmText="Sil"
                              cancelText="İptal"
                              onConfirm={() => handleDelete(user.id)}
                              isLoading={isDeletingId === user.id}
                              variant="destructive"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                disabled={isDeletingId === user.id || user.id === session?.user.id}
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
