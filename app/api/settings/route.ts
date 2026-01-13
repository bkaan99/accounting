import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SettingsUpdateSchema } from '@/lib/validations'

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
        companyId: true,
        company: {
          select: {
            id: true,
            name: true,
            taxId: true,
            address: true,
            phone: true,
            email: true,
            website: true,
            logo: true,
          },
        },
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

    const body = await request.json()
    
    // Zod validation
    const validatedData = SettingsUpdateSchema.parse(body)
    const { 
      name, 
      phone, 
      address,
      company, // Şirket adı
      companyLogo // Şirket logosu
    } = validatedData

    // Kullanıcı bilgilerini güncelle
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (address !== undefined) updateData.address = address

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        companyId: true,
        company: {
          select: {
            id: true,
            name: true,
            taxId: true,
            address: true,
            phone: true,
            email: true,
            website: true,
            logo: true,
          },
        },
      },
    })

    // Şirket bilgilerini güncelle (varsa)
    if ((company !== undefined || companyLogo !== undefined) && updatedUser.companyId) {
      const companyUpdateData: any = {}
      if (company !== undefined) companyUpdateData.name = company
      if (companyLogo !== undefined) companyUpdateData.logo = companyLogo

      await prisma.company.update({
        where: { id: updatedUser.companyId },
        data: companyUpdateData,
      })

      // Güncellenmiş şirket bilgisini tekrar al
      const userWithUpdatedCompany = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          companyId: true,
          company: {
            select: {
              id: true,
              name: true,
              taxId: true,
              address: true,
              phone: true,
              email: true,
              website: true,
              logo: true,
            },
          },
        },
      })

      return NextResponse.json(userWithUpdatedCompany || updatedUser)
    }

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    console.error('Ayarlar güncellenirken hata:', error)
    
    // Zod validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Geçersiz veri', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Ayarlar güncellenemedi' },
      { status: 500 }
    )
  }
} 