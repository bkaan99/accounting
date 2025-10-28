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

    // Süperadmin tüm faturaları görebilir
    if (session.user.role === 'SUPERADMIN') {
      const invoices = await prisma.invoice.findMany({
        include: {
          client: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json(invoices)
    }

    // Admin ve User sadece kendi şirketinin faturalarını görebilir
    if (session.user.companyId) {
      const invoices = await prisma.invoice.findMany({
        where: { companyId: session.user.companyId },
        include: {
          client: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json(invoices)
    }

    return NextResponse.json([])
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

    // Kullanıcının şirketi yoksa fatura oluşturamaz
    if (!session.user.companyId) {
      return NextResponse.json(
        { error: 'Şirket bilgisi bulunamadı' },
        { status: 400 }
      )
    }

    // Generate unique invoice number
    const generateInvoiceNumber = async (): Promise<string> => {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      
      // Get the latest invoice number for this company in this month
      const latestInvoice = await prisma.invoice.findFirst({
        where: {
          companyId: session.user.companyId,
          number: {
            startsWith: `INV-${year}${month}`
          }
        },
        orderBy: {
          number: 'desc'
        }
      })

      let nextNumber = 1
      if (latestInvoice) {
        const lastNumber = parseInt(latestInvoice.number.split('-')[2] || '0')
        nextNumber = lastNumber + 1
      }

      return `INV-${year}${month}-${String(nextNumber).padStart(4, '0')}`
    }

    const invoiceNumber = await generateInvoiceNumber()

    // Calculate total amount
    const totalAmount = validatedData.items.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice),
      0
    )

    // Get client (tedarikçi) info
    const client = await prisma.client.findUnique({
      where: { id: validatedData.clientId },
      select: { name: true }
    })

    // Create invoice with transaction using transaction (database transaction)
    const invoice = await prisma.$transaction(async (tx) => {
      // Create invoice
      const newInvoice = await tx.invoice.create({
        data: {
          number: invoiceNumber,
          userId: session.user.id,
          companyId: session.user.companyId,
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
          client: true,
          items: true,
        }
      })

      // Auto-create expense transaction (ödendi olarak işaretlenmez, manuel olarak ödenecek)
      await tx.transaction.create({
        data: {
          userId: session.user.id,
          companyId: session.user.companyId,
          type: 'EXPENSE',
          category: 'Tedarikçi Faturası',
          amount: totalAmount,
          description: `${client?.name || 'Tedarikçi'} - Fatura No: ${invoiceNumber}`,
          date: new Date(validatedData.issueDate),
          invoiceId: newInvoice.id,
          isPaid: false, // Fatura oluşturulduğunda henüz ödenmemiş
        }
      })

      return newInvoice
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