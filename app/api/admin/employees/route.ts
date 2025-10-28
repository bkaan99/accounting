import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// ADMIN için çalışanları getir (sadece kendi şirketindeki USER'ları)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    // ADMIN veya SUPERADMIN yetkisi kontrolü
    if (!session?.user?.id || !session.user.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    let whereClause = {}

    // ADMIN ise sadece kendi şirketindeki USER'ları getir
    if (session.user.role === 'ADMIN') {
      whereClause = {
        role: 'USER', // Sadece USER rolündekiler
        companyId: session.user.companyId, // Aynı şirketteki çalışanlar
      }
    }

    // SUPERADMIN ise tüm USER'ları getir
    if (session.user.role === 'SUPERADMIN') {
      whereClause = {
        role: { in: ['USER', 'ADMIN'] } // USER ve ADMIN rolleri
      }
    }

    const employees = await prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            clients: true,
            invoices: true,
            transactions: true,
          },
        },
      },
    })

    return NextResponse.json(employees)
  } catch (error) {
    console.error('Çalışanlar getirilirken hata:', error)
    return NextResponse.json(
      { error: 'Çalışanlar getirilemedi' },
      { status: 500 }
    )
  }
}

// ADMIN için yeni çalışan ekle
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    // ADMIN veya SUPERADMIN yetkisi kontrolü
    if (!session?.user?.id || !session.user.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const { name, email, phone, role } = await request.json()

    // ADMIN sadece USER rolü ekleyebilir
    if (session.user.role === 'ADMIN' && role !== 'USER') {
      return NextResponse.json(
        { error: 'ADMIN sadece USER rolü ekleyebilir' },
        { status: 400 }
      )
    }

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

    // Yeni çalışan için varsayılan şifre
    const defaultPassword = '123456'
    const hashedPassword = await bcrypt.hash(defaultPassword, 12)

    const newEmployee = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: role || 'USER', // Varsayılan USER
        // @ts-ignore - Prisma client cache sorunu
        companyId: session.user.companyId, // Admin'in şirketini ata
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            clients: true,
            invoices: true,
            transactions: true,
          },
        },
      },
    })

    return NextResponse.json(newEmployee)
  } catch (error) {
    console.error('Çalışan oluşturulurken hata:', error)
    return NextResponse.json(
      { error: 'Çalışan oluşturulamadı' },
      { status: 500 }
    )
  }
}
