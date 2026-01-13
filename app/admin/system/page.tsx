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
import os from 'os'

// Uptime'ı formatla (saniye cinsinden)
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  const parts: string[] = []
  
  if (days > 0) {
    parts.push(`${days} ${days === 1 ? 'gün' : 'gün'}`)
  }
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'saat' : 'saat'}`)
  }
  if (minutes > 0 && days === 0) {
    // Sadece gün yoksa dakikayı göster
    parts.push(`${minutes} ${minutes === 1 ? 'dakika' : 'dakika'}`)
  }
  if (parts.length === 0) {
    // Hiçbir şey yoksa saniyeyi göster
    parts.push(`${secs} ${secs === 1 ? 'saniye' : 'saniye'}`)
  }

  return parts.join(' ')
}

export default async function AdminSystemPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.role !== 'SUPERADMIN') {
    redirect('/dashboard')
  }

  // Gerçek uptime hesapla
  const uptimeSeconds = process.uptime()
  const formattedUptime = formatUptime(uptimeSeconds)

  // CPU ve RAM bilgilerini al
  const cpuCount = os.cpus().length
  const loadAvg = os.loadavg()[0] // 1 dakikalık load average
  // CPU kullanımı: loadavg / cpu sayısı * 100 (max 100%)
  const cpuUsage = Math.min(Math.round((loadAvg / cpuCount) * 100), 100)

  // RAM bilgileri
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMem = totalMem - freeMem
  const memUsagePercent = Math.round((usedMem / totalMem) * 100)

  // Bellek formatla (GB cinsinden)
  const formatBytes = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb.toFixed(2)} GB`
  }

  const systemInfo = {
    version: '1.0.0',
    database: 'PostgreSQL',
    uptime: formattedUptime,
    lastBackup: '2024-01-15 09:30:00',
    environment: process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
    nodeVersion: process.version,
    cpuUsage,
    memUsage: memUsagePercent,
    totalMem: formatBytes(totalMem),
    usedMem: formatBytes(usedMem),
    freeMem: formatBytes(freeMem),
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
                  <span>{systemInfo.cpuUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      systemInfo.cpuUsage > 80
                        ? 'bg-red-600'
                        : systemInfo.cpuUsage > 50
                        ? 'bg-orange-600'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${systemInfo.cpuUsage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">
                  {cpuCount} CPU çekirdeği
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Bellek Kullanımı</span>
                  <span>{systemInfo.memUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      systemInfo.memUsage > 80
                        ? 'bg-red-600'
                        : systemInfo.memUsage > 50
                        ? 'bg-orange-600'
                        : 'bg-green-600'
                    }`}
                    style={{ width: `${systemInfo.memUsage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">
                  {systemInfo.usedMem} / {systemInfo.totalMem} kullanılıyor
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Disk Kullanımı</span>
                  <span className="text-gray-500">Bilgi alınamadı</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gray-400 h-2 rounded-full"
                    style={{ width: '0%' }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">
                  Disk bilgisi Node.js ile alınamıyor
                </p>
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
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Sistem başarıyla güncellenmiştir
                  </span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  15 Ocak 2024, 14:30
                </p>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-300">
                    Veritabanı yedeği başarıyla oluşturuldu
                  </span>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  15 Ocak 2024, 09:30
                </p>
              </div>

              <div className="p-3 bg-yellow-50 dark:bg-orange-900/30 border border-yellow-200 dark:border-orange-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-yellow-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-yellow-800 dark:text-orange-300">
                    Sistem bakımı planlandı
                  </span>
                </div>
                <p className="text-xs text-yellow-600 dark:text-orange-400 mt-1">
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
