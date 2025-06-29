'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from '@/components/ui/toast'
import { LoadingButton } from '@/components/ui/loading'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const loadingToastId = toast.loading('Giriş yapılıyor...')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Giriş bilgileri hatalı')
        toast.error_update(loadingToastId, 'Giriş bilgileri hatalı!')
      } else {
        toast.success_update(loadingToastId, 'Giriş başarılı! Yönlendiriliyorsunuz...')
        router.push('/dashboard')
      }
    } catch (error) {
      setError('Bir hata oluştu')
      toast.error_update(loadingToastId, 'Bağlantı hatası oluştu!')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Giriş Yap</CardTitle>
          <CardDescription>Muhasebe uygulamasına hoşgeldiniz</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                placeholder="Şifrenizi giriniz"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}
            <LoadingButton 
              type="submit" 
              className="w-full" 
              loading={isLoading}
              loadingText="Giriş yapılıyor..."
            >
              Giriş Yap
            </LoadingButton>
          </form>
          <div className="mt-4 text-center text-sm">
            Hesabınız yok mu?{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              Kayıt Ol
            </Link>
          </div>
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Test hesabı:
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              E-posta: test@muhasebe.com
              <br />
              Şifre: 123456
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
