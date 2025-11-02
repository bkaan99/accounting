'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, User, Building2, Upload, X, Bell, Lock, AppWindow } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import { LoadingButton } from '@/components/ui/loading'

interface UserSettings {
  id: string
  name?: string
  email: string
  phone?: string
  address?: string
  companyId?: string
  company?: {
    id: string
    name: string
    logo?: string
  }
}

type SettingsCategory = 'profile' | 'company' | 'security' | 'notifications' | 'app'

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('profile')
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

  const [notificationPreferences, setNotificationPreferences] = useState({
    invoiceCreated: true,
    invoiceSent: true,
    invoicePaid: true,
    invoiceDueSoon: true,
    invoiceOverdue: true,
    invoiceStatusChanged: true,
    invoiceEdited: false,
    largeTransaction: true,
    largeTransactionLimit: 10000,
    lowBalance: true,
    lowBalanceLimit: 1000,
    negativeBalance: true,
    transactionDeleted: true,
    transactionEdited: false,
    userAdded: true,
    passwordChanged: true,
    suspiciousLogin: true,
    systemUpdate: true,
    clientAdded: false,
    bulkTransaction: true,
    reportGenerated: false,
  })
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true)
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)

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
          company: data.company?.name || '',
          companyLogo: data.company?.logo || '',
        })
        setLogoPreview(data.company?.logo || null)
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

  const fetchNotificationPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences')
      if (response.ok) {
        const data = await response.json()
        setNotificationPreferences(data)
      }
    } catch (error) {
      console.error('Bildirim tercihleri yüklenirken hata:', error)
    } finally {
      setIsLoadingPreferences(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      console.log('Session mevcut, ayarları yüklüyorum...', session.user)
      fetchUserSettings()
      fetchNotificationPreferences()
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
      if (!userSettings?.companyId && !userSettings?.company?.id) {
        toast.error_update(loadingToastId, 'Şirket bilgisi bulunamadı')
        setIsUpdatingCompany(false)
        return
      }

      // Settings API'sini kullanarak şirket bilgilerini güncelle
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company: companyForm.company,
          companyLogo: companyForm.companyLogo,
        }),
      })

      if (response.ok) {
        const updatedData = await response.json()
        setUserSettings(updatedData)
        setCompanyForm({
          company: updatedData.company?.name || '',
          companyLogo: updatedData.company?.logo || '',
        })
        setLogoPreview(updatedData.company?.logo || null)
        
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

  const categories = [
    { id: 'profile' as SettingsCategory, label: 'Profil', icon: User },
    { id: 'company' as SettingsCategory, label: 'Şirket', icon: Building2 },
    { id: 'security' as SettingsCategory, label: 'Güvenlik', icon: Lock },
    { id: 'notifications' as SettingsCategory, label: 'Bildirimler', icon: Bell },
    { id: 'app' as SettingsCategory, label: 'Uygulama', icon: AppWindow },
  ]

  const getCategoryTitle = (category: SettingsCategory) => {
    const cat = categories.find(c => c.id === category)
    return cat?.label || 'Ayarlar'
  }

  return (
    <MainLayout>
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        {/* Sol Sidebar - Kategoriler */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
            <div className="space-y-1">
              {categories.map((category) => {
                const Icon = category.icon
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeCategory === category.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{category.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Sağ İçerik Alanı */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {getCategoryTitle(activeCategory)}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {activeCategory === 'profile' && 'Kişisel bilgilerinizi yönetin'}
                {activeCategory === 'company' && 'Şirket bilgilerinizi güncelleyin'}
                {activeCategory === 'security' && 'Hesap güvenliğinizi koruyun'}
                {activeCategory === 'notifications' && 'Bildirim tercihlerinizi ayarlayın'}
                {activeCategory === 'app' && 'Uygulama ayarlarını yapılandırın'}
              </p>
            </div>

            <div className="space-y-6">
              {/* Profil Kategorisi */}
              {activeCategory === 'profile' && (
                <Card className="border-0 shadow-none">
                  <CardContent className="p-0">
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <div className="pt-4">
                        <LoadingButton 
                          type="submit"
                          className="w-full md:w-auto"
                          loading={isUpdatingProfile}
                          loadingText="Güncelleniyor..."
                        >
                          Değişiklikleri Kaydet
                        </LoadingButton>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Şirket Kategorisi */}
              {activeCategory === 'company' && (
                <Card className="border-0 shadow-none">
                  <CardContent className="p-0">
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

                      <div className="pt-4">
                        <LoadingButton 
                          type="submit"
                          className="w-full md:w-auto"
                          loading={isUpdatingCompany}
                          loadingText="Güncelleniyor..."
                        >
                          Değişiklikleri Kaydet
                        </LoadingButton>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Güvenlik Kategorisi */}
              {activeCategory === 'security' && (
                <Card className="border-0 shadow-none">
                  <CardContent className="p-0">
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                      <div className="space-y-4">
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
                      </div>
                      <div className="pt-4">
                        <LoadingButton 
                          type="submit"
                          variant="outline" 
                          className="w-full md:w-auto"
                          loading={isChangingPassword}
                          loadingText="Değiştiriliyor..."
                        >
                          Şifre Değiştir
                        </LoadingButton>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Bildirimler Kategorisi */}
              {activeCategory === 'notifications' && (
                <div className="space-y-6">
                  {isLoadingPreferences ? (
                    <div className="text-center py-8">Yükleniyor...</div>
                  ) : (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault()
                        setIsSavingPreferences(true)
                        try {
                          const response = await fetch('/api/notifications/preferences', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(notificationPreferences),
                          })
                          if (response.ok) {
                            toast.success('Bildirim tercihleri güncellendi')
                          } else {
                            toast.error('Güncelleme başarısız')
                          }
                        } catch (error) {
                          console.error('Tercihler güncellenirken hata:', error)
                          toast.error('Bir hata oluştu')
                        } finally {
                          setIsSavingPreferences(false)
                        }
                      }}
                      className="space-y-6"
                    >
                      {/* Fatura Bildirimleri */}
                      <div>
                        <h3 className="font-semibold mb-3 text-lg">Fatura Bildirimleri</h3>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                            <div>
                              <span className="font-medium">Fatura Oluşturuldu</span>
                              <p className="text-sm text-gray-500">Yeni fatura oluşturulduğunda bildirim al</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationPreferences.invoiceCreated}
                              onChange={(e) =>
                                setNotificationPreferences({
                                  ...notificationPreferences,
                                  invoiceCreated: e.target.checked,
                                })
                              }
                              className="w-5 h-5"
                            />
                          </label>
                          <label className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                            <div>
                              <span className="font-medium">Fatura Gönderildi</span>
                              <p className="text-sm text-gray-500">Fatura gönderildiğinde bildirim al</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationPreferences.invoiceSent}
                              onChange={(e) =>
                                setNotificationPreferences({
                                  ...notificationPreferences,
                                  invoiceSent: e.target.checked,
                                })
                              }
                              className="w-5 h-5"
                            />
                          </label>
                          <label className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                            <div>
                              <span className="font-medium">Fatura Ödendi</span>
                              <p className="text-sm text-gray-500">Fatura ödendiğinde bildirim al</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationPreferences.invoicePaid}
                              onChange={(e) =>
                                setNotificationPreferences({
                                  ...notificationPreferences,
                                  invoicePaid: e.target.checked,
                                })
                              }
                              className="w-5 h-5"
                            />
                          </label>
                          <label className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                            <div>
                              <span className="font-medium">Vade Yaklaşıyor</span>
                              <p className="text-sm text-gray-500">Fatura vadesi yaklaştığında bildirim al</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationPreferences.invoiceDueSoon}
                              onChange={(e) =>
                                setNotificationPreferences({
                                  ...notificationPreferences,
                                  invoiceDueSoon: e.target.checked,
                                })
                              }
                              className="w-5 h-5"
                            />
                          </label>
                          <label className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                            <div>
                              <span className="font-medium">Gecikmiş Fatura</span>
                              <p className="text-sm text-gray-500">Fatura geciktiğinde bildirim al</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationPreferences.invoiceOverdue}
                              onChange={(e) =>
                                setNotificationPreferences({
                                  ...notificationPreferences,
                                  invoiceOverdue: e.target.checked,
                                })
                              }
                              className="w-5 h-5"
                            />
                          </label>
                          <label className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                            <div>
                              <span className="font-medium">Fatura Düzenlendi</span>
                              <p className="text-sm text-gray-500">Fatura düzenlendiğinde bildirim al</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationPreferences.invoiceEdited}
                              onChange={(e) =>
                                setNotificationPreferences({
                                  ...notificationPreferences,
                                  invoiceEdited: e.target.checked,
                                })
                              }
                              className="w-5 h-5"
                            />
                          </label>
                        </div>
                      </div>

                      {/* İşlem Bildirimleri */}
                      <div>
                        <h3 className="font-semibold mb-3 text-lg">İşlem Bildirimleri</h3>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                            <div className="flex-1">
                              <span className="font-medium">Büyük İşlemler</span>
                              <p className="text-sm text-gray-500">
                                Belirli tutarın üzerindeki işlemlerde bildirim al
                              </p>
                              <Input
                                type="number"
                                value={notificationPreferences.largeTransactionLimit}
                                onChange={(e) =>
                                  setNotificationPreferences({
                                    ...notificationPreferences,
                                    largeTransactionLimit: parseFloat(e.target.value) || 10000,
                                  })
                                }
                                className="mt-2 w-32"
                                disabled={!notificationPreferences.largeTransaction}
                              />
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationPreferences.largeTransaction}
                              onChange={(e) =>
                                setNotificationPreferences({
                                  ...notificationPreferences,
                                  largeTransaction: e.target.checked,
                                })
                              }
                              className="w-5 h-5 ml-4"
                            />
                          </label>
                          <label className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                            <div className="flex-1">
                              <span className="font-medium">Düşük Bakiye Uyarısı</span>
                              <p className="text-sm text-gray-500">Kasa bakiyesi düştüğünde bildirim al</p>
                              <Input
                                type="number"
                                value={notificationPreferences.lowBalanceLimit}
                                onChange={(e) =>
                                  setNotificationPreferences({
                                    ...notificationPreferences,
                                    lowBalanceLimit: parseFloat(e.target.value) || 1000,
                                  })
                                }
                                className="mt-2 w-32"
                                disabled={!notificationPreferences.lowBalance}
                              />
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationPreferences.lowBalance}
                              onChange={(e) =>
                                setNotificationPreferences({
                                  ...notificationPreferences,
                                  lowBalance: e.target.checked,
                                })
                              }
                              className="w-5 h-5 ml-4"
                            />
                          </label>
                          <label className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                            <div>
                              <span className="font-medium">Negatif Bakiye</span>
                              <p className="text-sm text-gray-500">Kasa bakiyesi eksiye düştüğünde bildirim al</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationPreferences.negativeBalance}
                              onChange={(e) =>
                                setNotificationPreferences({
                                  ...notificationPreferences,
                                  negativeBalance: e.target.checked,
                                })
                              }
                              className="w-5 h-5"
                            />
                          </label>
                          <label className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                            <div>
                              <span className="font-medium">İşlem Silindi</span>
                              <p className="text-sm text-gray-500">İşlem silindiğinde bildirim al</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationPreferences.transactionDeleted}
                              onChange={(e) =>
                                setNotificationPreferences({
                                  ...notificationPreferences,
                                  transactionDeleted: e.target.checked,
                                })
                              }
                              className="w-5 h-5"
                            />
                          </label>
                        </div>
                      </div>

                      {/* Sistem Bildirimleri */}
                      <div>
                        <h3 className="font-semibold mb-3 text-lg">Sistem Bildirimleri</h3>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                            <div>
                              <span className="font-medium">Şifre Değiştirildi</span>
                              <p className="text-sm text-gray-500">Şifre değiştiğinde bildirim al</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationPreferences.passwordChanged}
                              onChange={(e) =>
                                setNotificationPreferences({
                                  ...notificationPreferences,
                                  passwordChanged: e.target.checked,
                                })
                              }
                              className="w-5 h-5"
                            />
                          </label>
                          {session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN' ? (
                            <label className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                              <div>
                                <span className="font-medium">Yeni Kullanıcı Eklendi</span>
                                <p className="text-sm text-gray-500">Yeni kullanıcı eklendiğinde bildirim al</p>
                              </div>
                              <input
                                type="checkbox"
                                checked={notificationPreferences.userAdded}
                                onChange={(e) =>
                                  setNotificationPreferences({
                                    ...notificationPreferences,
                                    userAdded: e.target.checked,
                                  })
                                }
                                className="w-5 h-5"
                              />
                            </label>
                          ) : null}
                        </div>
                      </div>

                      {/* Kullanıcı Aktivite Bildirimleri */}
                      <div>
                        <h3 className="font-semibold mb-3 text-lg">Kullanıcı Aktivite Bildirimleri</h3>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                            <div>
                              <span className="font-medium">Yeni Tedarikçi Eklendi</span>
                              <p className="text-sm text-gray-500">Tedarikçi eklendiğinde veya silindiğinde bildirim al</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationPreferences.clientAdded}
                              onChange={(e) =>
                                setNotificationPreferences({
                                  ...notificationPreferences,
                                  clientAdded: e.target.checked,
                                })
                              }
                              className="w-5 h-5"
                            />
                          </label>
                          <label className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                            <div>
                              <span className="font-medium">Toplu İşlem</span>
                              <p className="text-sm text-gray-500">Toplu işlem yapıldığında bildirim al</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationPreferences.bulkTransaction}
                              onChange={(e) =>
                                setNotificationPreferences({
                                  ...notificationPreferences,
                                  bulkTransaction: e.target.checked,
                                })
                              }
                              className="w-5 h-5"
                            />
                          </label>
                          <label className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                            <div>
                              <span className="font-medium">Rapor Oluşturuldu</span>
                              <p className="text-sm text-gray-500">Rapor oluşturulduğunda bildirim al</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={notificationPreferences.reportGenerated}
                              onChange={(e) =>
                                setNotificationPreferences({
                                  ...notificationPreferences,
                                  reportGenerated: e.target.checked,
                                })
                              }
                              className="w-5 h-5"
                            />
                          </label>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t">
                        <Button type="submit" disabled={isSavingPreferences}>
                          {isSavingPreferences ? 'Kaydediliyor...' : 'Tercihleri Kaydet'}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Uygulama Kategorisi */}
              {activeCategory === 'app' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div>
                      <h3 className="font-medium">Koyu Tema</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Uygulamayı koyu temada kullan
                      </p>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      Aktif
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div>
                      <h3 className="font-medium">Otomatik Yedekleme</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Verilerinizi otomatik olarak yedekle
                      </p>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      Yakında
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
