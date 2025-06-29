'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, User, Building2, Upload, X } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import { LoadingButton } from '@/components/ui/loading'

interface UserSettings {
  id: string
  name?: string
  email: string
  phone?: string
  address?: string
  company?: string
  companyLogo?: string
}

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUpdatingCompany, setIsUpdatingCompany] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    address: '',
  })

  const [companyForm, setCompanyForm] = useState({
    company: '',
    companyLogo: '',
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Yetki kontrolü
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const fetchUserSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      
      if (response.status === 401) {
        toast.error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.')
        router.push('/login')
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        setUserSettings(data)
        setProfileForm({
          name: data.name || '',
          phone: data.phone || '',
          address: data.address || '',
        })
        setCompanyForm({
          company: data.company || '',
          companyLogo: data.companyLogo || '',
        })
        setLogoPreview(data.companyLogo || null)
      } else {
        const errorData = await response.json()
        console.error('API Hatası:', errorData)
        toast.error(errorData.error || 'Ayarlar yüklenirken hata oluştu')
      }
    } catch (error) {
      console.error('Ayarlar yüklenirken hata:', error)
      toast.error('Bağlantı hatası oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      console.log('Session mevcut, ayarları yüklüyorum...', session.user)
      fetchUserSettings()
    } else if (status === 'authenticated') {
      console.log('Session authenticated ama user.id yok:', session)
      toast.error('Kullanıcı bilgileri eksik')
    }
  }, [status, session])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingProfile(true)
    
    const loadingToastId = toast.loading('Profil güncelleniyor...')
    
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileForm),
      })

      if (response.ok) {
        const updatedData = await response.json()
        setUserSettings(updatedData)
        // Session'ı güncelleyerek navbar'daki kullanıcı bilgilerini yenile
        await update()
        toast.success_update(loadingToastId, 'Profil başarıyla güncellendi!')
      } else {
        const errorData = await response.json()
        toast.error_update(loadingToastId, errorData.error || 'Güncelleme başarısız')
      }
    } catch (error) {
      console.error('Profil güncellenirken hata:', error)
      toast.error_update(loadingToastId, 'Bağlantı hatası oluştu')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Dosya boyutu kontrolü (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo dosyası 2MB\'dan küçük olmalıdır')
      return
    }

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      toast.error('Sadece resim dosyaları kabul edilir')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // Canvas oluştur ve resmi sıkıştır
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // Maksimum boyutlar
        const maxWidth = 400
        const maxHeight = 400
        
        let { width, height } = img
        
        // Orantılı küçültme
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Resmi çiz ve sıkıştır
        ctx?.drawImage(img, 0, 0, width, height)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8) // %80 kalite
        
        setLogoPreview(compressedBase64)
        setCompanyForm({ ...companyForm, companyLogo: compressedBase64 })
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleLogoRemove = () => {
    setLogoPreview(null)
    setCompanyForm({ ...companyForm, companyLogo: '' })
  }

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingCompany(true)
    
    const loadingToastId = toast.loading('Şirket bilgileri güncelleniyor...')
    
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyForm),
      })

      if (response.ok) {
        const updatedData = await response.json()
        setUserSettings(updatedData)
        // Session'ı güncelleyerek navbar'daki şirket adını ve logoyu yenile
        await update()
        
        // Navbar'ı logo güncellemesi için bilgilendir
        window.dispatchEvent(new CustomEvent('logoUpdated'))
        
        toast.success_update(loadingToastId, 'Şirket bilgileri başarıyla güncellendi!')
      } else {
        const errorData = await response.json()
        toast.error_update(loadingToastId, errorData.error || 'Güncelleme başarısız')
      }
    } catch (error) {
      console.error('Şirket bilgileri güncellenirken hata:', error)
      toast.error_update(loadingToastId, 'Bağlantı hatası oluştu')
    } finally {
      setIsUpdatingCompany(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Yeni şifre en az 6 karakter olmalıdır')
      return
    }

    setIsChangingPassword(true)
    
    const loadingToastId = toast.loading('Şifre değiştiriliyor...')
    
    try {
      const response = await fetch('/api/settings/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      if (response.ok) {
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        toast.success_update(loadingToastId, 'Şifre başarıyla değiştirildi!')
      } else {
        const errorData = await response.json()
        toast.error_update(loadingToastId, errorData.error || 'Şifre değiştirme başarısız')
      }
    } catch (error) {
      console.error('Şifre değiştirilirken hata:', error)
      toast.error_update(loadingToastId, 'Bağlantı hatası oluştu')
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Yükleniyor...</div>
        </div>
      </MainLayout>
    )
  }

  if (!userSettings) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Ayarlar yüklenemedi</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ayarlar</h1>
          <p className="text-gray-600">Hesap ve şirket bilgilerinizi yönetin</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Kullanıcı Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Kullanıcı Bilgileri</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Ad Soyad</Label>
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, name: e.target.value })
                      }
                      placeholder="Adınızı giriniz"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-posta</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userSettings.email}
                      placeholder="E-posta adresiniz"
                      disabled
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input 
                    id="phone" 
                    value={profileForm.phone}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, phone: e.target.value })
                    }
                    placeholder="+90 532 123 45 67" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Adres</Label>
                  <Input 
                    id="address" 
                    value={profileForm.address}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, address: e.target.value })
                    }
                    placeholder="Adresinizi giriniz" 
                  />
                </div>
                <LoadingButton 
                  type="submit"
                  className="w-full"
                  loading={isUpdatingProfile}
                  loadingText="Güncelleniyor..."
                >
                  Kullanıcı Bilgilerini Güncelle
                </LoadingButton>
              </form>
            </CardContent>
          </Card>

          {/* Şirket Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Şirket Bilgileri</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCompanySubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Şirket Adı</Label>
                  <Input
                    id="company"
                    value={companyForm.company}
                    onChange={(e) =>
                      setCompanyForm({ ...companyForm, company: e.target.value })
                    }
                    placeholder="Şirket adınız"
                  />
                </div>

                {/* Logo Yükleme */}
                <div className="space-y-2">
                  <Label>Şirket Logosu</Label>
                  <div className="flex items-center space-x-4">
                    {logoPreview ? (
                      <div className="relative group">
                        <div className="w-16 h-16 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 flex items-center justify-center">
                          <img 
                            src={logoPreview} 
                            alt="Logo önizleme" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleLogoRemove}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                        <Building2 className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <input
                        type="file"
                        id="logo-upload"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Upload className="h-4 w-4" />
                        <span>Logo Yükle</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG veya SVG. Maksimum 2MB.
                      </p>
                    </div>
                  </div>
                </div>

                <LoadingButton 
                  type="submit"
                  className="w-full"
                  loading={isUpdatingCompany}
                  loadingText="Güncelleniyor..."
                >
                  Şirket Bilgilerini Güncelle
                </LoadingButton>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Güvenlik Ayarları */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Güvenlik Ayarları</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mevcut Şifre</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                    }
                    placeholder="Mevcut şifrenizi giriniz"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Yeni Şifre</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                    placeholder="Yeni şifrenizi giriniz"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  placeholder="Yeni şifrenizi tekrar giriniz"
                  required
                />
              </div>
              <LoadingButton 
                type="submit"
                variant="outline" 
                className="w-full md:w-auto"
                loading={isChangingPassword}
                loadingText="Değiştiriliyor..."
              >
                Şifre Değiştir
              </LoadingButton>
            </form>
          </CardContent>
        </Card>

        {/* Uygulama Ayarları */}
        <Card>
          <CardHeader>
            <CardTitle>Uygulama Ayarları</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Koyu Tema</h3>
                  <p className="text-sm text-gray-600">
                    Uygulamayı koyu temada kullan
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Aktif
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">E-posta Bildirimleri</h3>
                  <p className="text-sm text-gray-600">
                    Önemli güncellemeler için e-posta al
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Aktif
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Otomatik Yedekleme</h3>
                  <p className="text-sm text-gray-600">
                    Verilerinizi otomatik olarak yedekle
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Yakında
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
