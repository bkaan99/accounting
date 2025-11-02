import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ClientSchema } from '@/lib/validations'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = ClientSchema.parse(body)

    const client = await prisma.client.update({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      data: validatedData,
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error('Tedarikçi güncellenirken hata:', error)
    return NextResponse.json(
      { error: 'Tedarikçi güncellenirken hata oluştu' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    await prisma.client.update({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      data: { isDeleted: true }
    })

    return NextResponse.json({ message: 'Tedarikçi silindi' })
  } catch (error) {
    console.error('Tedarikçi silinirken hata:', error)
    return NextResponse.json(
      { error: 'Tedarikçi silinirken hata oluştu' },
      { status: 500 }
    )
  }
} 