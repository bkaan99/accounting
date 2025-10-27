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

    // ADMIN veya SUPERADMIN yetkisi kontrolü
    if (!session?.user?.id || !session.user.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Bu işlem için ADMIN veya SUPERADMIN yetkisi gereklidir' },
        { status: 403 }
      )
    }

    const employeeId = params.id

    // Çalışanın varlığını kontrol et
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { id: true, email: true, name: true, role: true }
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Çalışan bulunamadı' },
        { status: 404 }
      )
    }

    // Kendi şifresini sıfırlamaya izin verme
    if (employeeId === session.user.id) {
      return NextResponse.json(
        { error: 'Kendi şifrenizi sıfırlayamazsınız' },
        { status: 400 }
      )
    }

    // ADMIN sadece USER rolündekilerin şifresini sıfırlayabilir
    if (session.user.role === 'ADMIN' && employee.role !== 'USER') {
      return NextResponse.json(
        { error: 'ADMIN sadece USER rolündeki çalışanların şifresini sıfırlayabilir' },
        { status: 400 }
      )
    }

    // Yeni güvenli şifre oluştur
    const newPassword = generateSecurePassword(12)
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Çalışanın şifresini güncelle
    await prisma.user.update({
      where: { id: employeeId },
      data: { password: hashedPassword }
    })

    return NextResponse.json({
      success: true,
      message: 'Şifre başarıyla sıfırlandı',
      newPassword: newPassword, // Sadece bu seferlik gösterilecek
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email
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
