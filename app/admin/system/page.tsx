import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Shield,
  Database,
  Server,
  HardDrive,
  Zap,
  Activity,
  Clock,
  CheckCircle,
} from 'lucide-react'

export default async function AdminSystemPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.role !== 'SUPERADMIN') {
    redirect('/dashboard')
  }

  const systemInfo = {
    version: '1.0.0',
    database: 'PostgreSQL',
    uptime: '2 gün 14 saat',
    lastBackup: '2024-01-15 09:30:00',
    environment: 'Development',
    nodeVersion: process.version,
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <span>Sistem Yönetimi</span>
          </h1>
          <p className="text-gray-600">Sistem durumu ve yönetim araçları</p>
        </div>

        {/* Sistem Durumu */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Sistem Durumu
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Çevrimiçi</div>
              <p className="text-xs text-gray-600">Tüm servisler çalışıyor</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {systemInfo.uptime}
              </div>
              <p className="text-xs text-gray-600">Kesintisiz çalışma süresi</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Veritabanı</CardTitle>
              <Database className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold text-purple-600">
                {systemInfo.database}
              </div>
              <p className="text-xs text-gray-600">Bağlantı durumu: Aktif</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Node.js</CardTitle>
              <Server className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold text-green-600">
                {systemInfo.nodeVersion}
              </div>
              <p className="text-xs text-gray-600">Runtime sürümü</p>
            </CardContent>
          </Card>
        </div>

        {/* Sistem Bilgileri */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Sistem Bilgileri</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Uygulama Versiyonu:</span>
                <span className="text-sm text-gray-600">
                  {systemInfo.version}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Ortam:</span>
                <span className="text-sm text-gray-600">
                  {systemInfo.environment}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Veritabanı:</span>
                <span className="text-sm text-gray-600">
                  {systemInfo.database}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Son Yedekleme:</span>
                <span className="text-sm text-gray-600">
                  {systemInfo.lastBackup}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Performans</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>CPU Kullanımı</span>
                  <span>15%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: '15%' }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Bellek Kullanımı</span>
                  <span>32%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: '32%' }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Disk Kullanımı</span>
                  <span>68%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full"
                    style={{ width: '68%' }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Yönetim Araçları */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HardDrive className="h-5 w-5" />
              <span>Yönetim Araçları</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <Database className="h-8 w-8 text-blue-600 mb-2" />
                <h3 className="font-medium">Veritabanı Yedekleme</h3>
                <p className="text-sm text-gray-600">
                  Veritabanının yedeğini al
                </p>
              </div>

              <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <Activity className="h-8 w-8 text-green-600 mb-2" />
                <h3 className="font-medium">Sistem Logları</h3>
                <p className="text-sm text-gray-600">
                  Sistem loglarını görüntüle
                </p>
              </div>

              <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <Zap className="h-8 w-8 text-yellow-600 mb-2" />
                <h3 className="font-medium">Cache Temizle</h3>
                <p className="text-sm text-gray-600">
                  Uygulama cache&apos;ini temizle
                </p>
              </div>

              <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <Shield className="h-8 w-8 text-red-600 mb-2" />
                <h3 className="font-medium">Güvenlik Taraması</h3>
                <p className="text-sm text-gray-600">Güvenlik kontrolü yap</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sistem Notları */}
        <Card>
          <CardHeader>
            <CardTitle>Sistem Notları</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Sistem başarıyla güncellenmiştir
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  15 Ocak 2024, 14:30
                </p>
              </div>

              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Veritabanı yedeği başarıyla oluşturuldu
                  </span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  15 Ocak 2024, 09:30
                </p>
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    Sistem bakımı planlandı
                  </span>
                </div>
                <p className="text-xs text-yellow-600 mt-1">
                  20 Ocak 2024, 02:00
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
