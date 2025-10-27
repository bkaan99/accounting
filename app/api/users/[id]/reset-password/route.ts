import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Güvenli şifre oluşturma fonksiyonu
function generateSecurePassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  
  // En az bir küçük harf, büyük harf, rakam ve özel karakter garantisi
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
  password += '0123456789'[Math.floor(Math.random() * 10)]
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]
  
  // Kalan karakterleri rastgele ekle
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }
  
  // Şifreyi karıştır
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Süperadmin yetkisi kontrolü
    if (!session?.user?.id || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Bu işlem için süperadmin yetkisi gereklidir' },
        { status: 403 }
      )
    }

    const userId = params.id

    // Kullanıcının varlığını kontrol et
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }

    // Kendi şifresini sıfırlamaya izin verme
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Kendi şifrenizi sıfırlayamazsınız' },
        { status: 400 }
      )
    }

    // Yeni güvenli şifre oluştur
    const newPassword = generateSecurePassword(12)
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Kullanıcının şifresini güncelle
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    return NextResponse.json({
      success: true,
      message: 'Şifre başarıyla sıfırlandı',
      newPassword: newPassword, // Sadece bu seferlik gösterilecek
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })

  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error)
    return NextResponse.json(
      { error: 'Şifre sıfırlanırken bir hata oluştu' },
      { status: 500 }
    )
  }
}
