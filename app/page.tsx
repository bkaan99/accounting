import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  // Eğer kullanıcı giriş yapmışsa dashboard'a yönlendir
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Muhasebe Uygulaması
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Modern ve kullanıcı dostu muhasebe çözümü
        </p>
        <div className="space-x-4">
          <Button asChild>
            <Link href="/login">Giriş Yap</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/register">Kayıt Ol</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
