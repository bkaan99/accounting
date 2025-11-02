import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const { name, email, company, phone, role } = await request.json()

    // Kendi hesabının rolünü değiştirmeye izin verme
    if (params.id === session.user.id && role !== session.user.role) {
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

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        name,
        email,
        company,
        phone,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
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

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Kullanıcı güncellenirken hata:', error)
    return NextResponse.json(
      { error: 'Kullanıcı güncellenemedi' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    // Kendi hesabını silmeye izin verme
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: 'Kendi hesabınızı silemezsiniz' },
        { status: 400 }
      )
    }

    // Kullanıcının verilerini kontrol et
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            clients: true,
            invoices: true,
            transactions: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }

    // Eğer kullanıcıya ait veri varsa uyarı ver
    const hasData = user._count.clients > 0 || user._count.invoices > 0 || user._count.transactions > 0

    if (hasData) {
      return NextResponse.json(
        { error: 'Bu kullanıcıya ait tedarikçi, fatura veya işlem kayıtları var. Önce bunları silin.' },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Kullanıcı başarıyla silindi' })
  } catch (error) {
    console.error('Kullanıcı silinirken hata:', error)
    return NextResponse.json(
      { error: 'Kullanıcı silinemedi' },
      { status: 500 }
    )
  }
} 