import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, User, Building2 } from 'lucide-react'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
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
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Ad Soyad</Label>
                  <Input
                    id="name"
                    defaultValue={session.user.name || ''}
                    placeholder="Adınızı giriniz"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={session.user.email || ''}
                    placeholder="E-posta adresiniz"
                    disabled
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" placeholder="+90 532 123 45 67" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adres</Label>
                <Input id="address" placeholder="Adresinizi giriniz" />
              </div>
              <Button className="w-full">Kullanıcı Bilgilerini Güncelle</Button>
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
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company">Şirket Adı</Label>
                <Input
                  id="company"
                  defaultValue={session.user.company || ''}
                  placeholder="Şirket adınız"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxId">Vergi Numarası</Label>
                <Input id="taxId" placeholder="1234567890" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyAddress">Şirket Adresi</Label>
                <Input
                  id="companyAddress"
                  placeholder="Şirket adresini giriniz"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Web Sitesi</Label>
                <Input id="website" placeholder="https://www.ornek.com" />
              </div>
              <Button className="w-full">Şirket Bilgilerini Güncelle</Button>
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
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mevcut Şifre</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="Mevcut şifrenizi giriniz"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Yeni Şifre</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Yeni şifrenizi giriniz"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Yeni şifrenizi tekrar giriniz"
                />
              </div>
              <Button variant="outline" className="w-full md:w-auto">
                Şifre Değiştir
              </Button>
            </div>
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
                  Yakında
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
