import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ADMIN için çalışan güncelleme
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // ADMIN veya SUPERADMIN yetkisi kontrolü
    if (!session?.user?.id || !session.user.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const { name, email, phone, role } = await request.json()

    // ADMIN sadece USER rolüne değiştirebilir
    if (session.user.role === 'ADMIN' && role && role !== 'USER') {
      return NextResponse.json(
        { error: 'ADMIN sadece USER rolüne değiştirebilir' },
        { status: 400 }
      )
    }

    // Kendi hesabının rolünü değiştirmeye izin verme
    if (params.id === session.user.id && role && role !== session.user.role) {
      return NextResponse.json(
        { error: 'Kendi rolünüzü değiştiremezsiniz' },
        { status: 400 }
      )
    }

    // Email benzersizliği kontrolü
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: params.id }
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu email adresi zaten kullanılıyor' },
        { status: 400 }
      )
    }

    const updatedEmployee = await prisma.user.update({
      where: { id: params.id },
      data: {
        name,
        email,
        phone,
        role: role || 'USER',
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

    return NextResponse.json(updatedEmployee)
  } catch (error) {
    console.error('Çalışan güncellenirken hata:', error)
    return NextResponse.json(
      { error: 'Çalışan güncellenemedi' },
      { status: 500 }
    )
  }
}

// ADMIN için çalışan silme
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // ADMIN veya SUPERADMIN yetkisi kontrolü
    if (!session?.user?.id || !session.user.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    // Kendi hesabını silmeye izin verme
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: 'Kendi hesabınızı silemezsiniz' },
        { status: 400 }
      )
    }

    // Çalışanın varlığını kontrol et
    const employee = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, role: true }
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Çalışan bulunamadı' },
        { status: 404 }
      )
    }

    // ADMIN sadece USER rolündekileri silebilir
    if (session.user.role === 'ADMIN' && employee.role !== 'USER') {
      return NextResponse.json(
        { error: 'ADMIN sadece USER rolündeki çalışanları silebilir' },
        { status: 400 }
      )
    }

    // Çalışanı sil
    await prisma.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Çalışan başarıyla silindi'
    })

  } catch (error) {
    console.error('Çalışan silinirken hata:', error)
    return NextResponse.json(
      { error: 'Çalışan silinemedi' },
      { status: 500 }
    )
  }
}
