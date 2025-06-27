import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { invoiceSchema } from '@/lib/validations'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invoices = await prisma.invoice.findMany({
      where: { userId: session.user.id },
      include: {
        clientInfo: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error('Invoice fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = invoiceSchema.parse(body)

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count({
      where: { userId: session.user.id }
    })
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(4, '0')}`

    // Calculate total amount
    const totalAmount = validatedData.items.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice),
      0
    )

    const invoice = await prisma.invoice.create({
      data: {
        number: invoiceNumber,
        userId: session.user.id,
        clientId: validatedData.clientId,
        issueDate: new Date(validatedData.issueDate),
        dueDate: new Date(validatedData.dueDate),
        totalAmount,
        status: validatedData.status || 'DRAFT',
        notes: validatedData.notes,
        items: {
          create: validatedData.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            price: item.unitPrice,
            total: item.quantity * item.unitPrice,
          }))
        }
      },
      include: {
        clientInfo: true,
        items: true,
      }
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Invoice creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 