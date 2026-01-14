import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { UserCreateSchema } from '@/lib/validations'
import { handleApiError } from '@/lib/error-handler'
import { requireSuperAdmin } from '@/lib/auth-helpers'

export async function GET() {
  try {
    const authResult = await requireSuperAdmin()
    if ('response' in authResult) {
      return authResult.response
    }
    const { session } = authResult

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
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
    return handleApiError(error, 'GET /api/users')
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireSuperAdmin()
    if ('response' in authResult) {
      return authResult.response
    }
    const { session } = authResult

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
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
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
  } catch (error) {
    return handleApiError(error, 'POST /api/users')
  }
} 