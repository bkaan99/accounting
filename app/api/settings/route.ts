import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        company: true,
        taxId: true,
        companyAddress: true,
        website: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Ayarlar getirilirken hata:', error)
    return NextResponse.json(
      { error: 'Ayarlar getirilemedi' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const { 
      name, 
      phone, 
      address, 
      company, 
      taxId, 
      companyAddress, 
      website 
    } = await request.json()

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        phone,
        address,
        company,
        taxId,
        companyAddress,
        website,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        company: true,
        taxId: true,
        companyAddress: true,
        website: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Ayarlar güncellenirken hata:', error)
    return NextResponse.json(
      { error: 'Ayarlar güncellenemedi' },
      { status: 500 }
    )
  }
} 