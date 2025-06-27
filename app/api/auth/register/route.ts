import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { RegisterSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = RegisterSchema.parse(body)

    // Kullanıcının zaten var olup olmadığını kontrol et
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi zaten kullanılıyor' },
        { status: 400 }
      )
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Kullanıcıyı oluştur
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        company: validatedData.company,
        phone: validatedData.phone,
        address: validatedData.address,
      },
    })

    // Şifreyi response'dan çıkar
    const { password, ...userWithoutPassword } = user

    return NextResponse.json(
      { message: 'Kullanıcı başarıyla oluşturuldu', user: userWithoutPassword },
      { status: 201 }
    )
  } catch (error) {
    console.error('Kayıt hatası:', error)
    return NextResponse.json(
      { error: 'Kayıt olurken bir hata oluştu' },
      { status: 500 }
    )
  }
} 