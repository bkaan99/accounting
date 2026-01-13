import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { UserCreateSchema } from '@/lib/validations'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            taxId: true,
          },
        },
        _count: {
          select: {
            clients: true,
            invoices: true,
            transactions: true,
          },
        },
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Kullanıcılar getirilirken hata:', error)
    return NextResponse.json(
      { error: 'Kullanıcılar getirilemedi' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const body = await request.json()
    
    // Zod validation
    const validatedData = UserCreateSchema.parse(body)
    const { name, email, phone, address, role, companyId } = validatedData

    // Email benzersizliği kontrolü
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu email adresi zaten kullanılıyor' },
        { status: 400 }
      )
    }

    // Yeni kullanıcı için varsayılan şifre
    const bcrypt = require('bcryptjs')
    const defaultPassword = '123456'
    const hashedPassword = await bcrypt.hash(defaultPassword, 12)

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        address,
        role,
        companyId,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            taxId: true,
          },
        },
        _count: {
          select: {
            clients: true,
            invoices: true,
            transactions: true,
          },
        },
      },
    })

    // Yeni kullanıcı eklendiğinde admin'lere bildirim gönder
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPERADMIN'] },
        companyId: companyId || undefined,
      },
    })

    await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin.id,
          companyId: admin.companyId,
          type: 'USER_ADDED',
          priority: 'MEDIUM',
          title: 'Yeni Kullanıcı Eklendi',
          message: `${name} (${email}) adlı yeni kullanıcı sisteme eklendi.`,
          link: '/admin/users',
          metadata: {
            userId: newUser.id,
            userName: name,
            userEmail: email,
            role,
          },
        }).catch((err) => console.error('Yeni kullanıcı bildirimi hatası:', err))
      )
    )

    return NextResponse.json(newUser)
  } catch (error: any) {
    console.error('Kullanıcı oluşturulurken hata:', error)
    
    // Zod validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Geçersiz veri', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Kullanıcı oluşturulamadı' },
      { status: 500 }
    )
  }
} 