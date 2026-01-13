import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart3,
  Users,
  Shield,
  Smartphone,
  Moon,
  ArrowRight,
  Calculator,
  Receipt,
  Wallet,
  Settings,
  Zap
} from 'lucide-react'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  // Eğer kullanıcı giriş yapmışsa dashboard'a yönlendir
  if (session) {
    redirect('/dashboard')
  }

  const features = [
    {
      icon: BarChart3,
      title: 'Dashboard & Raporlama',
      description: 'Gelir-gider özet paneli, detaylı grafikler ve istatistiklerle finansal durumunuzu takip edin.'
    },
    {
      icon: Users,
      title: 'Tedarikçi Yönetimi',
      description: 'Tedarikçi bilgilerini kolayca ekleyin, düzenleyin ve organize edin.'
    },
    {
      icon: Receipt,
      title: 'Fatura Yönetimi',
      description: 'Profesyonel faturalar oluşturun, PDF olarak indirin ve durumlarını takip edin.'
    },
    {
      icon: Calculator,
      title: 'İşlem Takibi',
      description: 'Gelir ve gider kayıtlarınızı kategorilere göre organize edin ve analiz edin.'
    },
    {
      icon: Wallet,
      title: 'Nakit Hesaplar',
      description: 'Birden fazla nakit hesabınızı yönetin ve bakiyelerini takip edin.'
    },
    {
      icon: Settings,
      title: 'Kolay Yönetim',
      description: 'Kullanıcı dostu arayüz ile tüm işlemlerinizi kolayca gerçekleştirin.'
    }
  ]

  const benefits = [
    {
      icon: Shield,
      title: 'Güvenli',
      description: 'Verileriniz şifrelenmiş olarak saklanır ve sadece sizin erişiminizdedir.'
    },
    {
      icon: Smartphone,
      title: 'Mobil Uyumlu',
      description: 'Responsive tasarım sayesinde tüm cihazlarda sorunsuz çalışır.'
    },
    {
      icon: Moon,
      title: 'Dark Mode',
      description: 'Göz yormayan karanlık tema desteği ile rahatça çalışın.'
    },
    {
      icon: Zap,
      title: 'Hızlı & Modern',
      description: 'Next.js 14 ile geliştirilmiş, hızlı ve modern bir deneyim sunar.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Modern Muhasebe
            <span className="text-blue-600 dark:text-blue-400"> Çözümü</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
            Küçük ve orta ölçekli işletmeler için geliştirilmiş, kullanıcı dostu muhasebe uygulaması
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/register">
                Hemen Başla
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg" className="text-lg px-8">
              <Link href="/login">Giriş Yap</Link>
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Özellikler
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            İşletmenizin finansal yönetimini kolaylaştıran güçlü özellikler
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Neden Bizi Seçmelisiniz?
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            Modern teknoloji ve kullanıcı odaklı tasarım ile işletmenize değer katıyoruz
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {benefit.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Nasıl Çalışır?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Kayıt Ol
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Hızlı ve kolay kayıt işlemi ile hesabınızı oluşturun
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Verilerinizi Ekleyin
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tedarikçiler, faturalar ve işlemlerinizi sisteme kaydedin
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Yönetin & Analiz Edin
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Dashboard'dan finansal durumunuzu takip edin ve raporlar alın
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Hemen Başlamaya Hazır mısınız?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Ücretsiz kayıt olun ve işletmenizin finansal yönetimini kolaylaştırın
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="text-lg px-8">
              <Link href="/register">
                Ücretsiz Kayıt Ol
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 bg-transparent border-white text-white hover:bg-white hover:text-blue-600">
              <Link href="/login">Zaten Hesabınız Var mı?</Link>
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-600 dark:text-gray-400">
          <p className="mb-2">
            Modern ve güvenilir muhasebe çözümü
          </p>
          <p className="text-sm">
            Next.js 14 • TypeScript • Prisma • Tailwind CSS
          </p>
        </div>
      </div>
    </div>
  )
}
