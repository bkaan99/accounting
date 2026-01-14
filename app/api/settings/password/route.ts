import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { createNotification } from '@/lib/notifications'
import { PasswordChangeSchema } from '@/lib/validations'

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const body = await request.json()
    
    // Zod validation
    const { currentPassword, newPassword } = PasswordChangeSchema.parse(body)

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    // Mevcut şifreyi kontrol et
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Mevcut şifre hatalı' },
        { status: 400 }
      )
    }

    // Yeni şifreyi hashle
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // Şifreyi güncelle
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedNewPassword },
    })

    // Şifre değiştirildiğinde bildirim gönder
    createNotification({
      userId: session.user.id,
      companyId: session.user.companyId,
      type: 'PASSWORD_CHANGED',
      priority: 'HIGH',
      title: 'Şifre Değiştirildi',
      message: 'Hesap şifreniz başarıyla değiştirildi. Eğer siz yapmadıysanız, lütfen derhal işlem yapın.',
      link: '/settings',
      metadata: {
        timestamp: new Date().toISOString(),
      },
    }).catch((err) => console.error('Şifre değiştirme bildirimi hatası:', err))

    return NextResponse.json({ message: 'Şifre başarıyla güncellendi' })
  } catch (error: any) {
    console.error('Şifre güncellenirken hata:', error)
    
    // Zod validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Geçersiz veri', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Şifre güncellenemedi' },
      { status: 500 }
    )
  }
} 