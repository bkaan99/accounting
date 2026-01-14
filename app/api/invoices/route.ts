import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { invoiceSchema } from '@/lib/validations'
import { createNotification } from '@/lib/notifications'
import { updateInvoiceStatus } from '@/lib/invoice-status'
import { parsePaginationParams, type PaginationResponse } from '@/lib/utils'
import { handleApiError } from '@/lib/error-handler'
import { requireAuth, requireValidCompany, isSuperAdmin } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ('response' in authResult) {
      return authResult.response
    }
    const { session } = authResult

    // Pagination parametrelerini al
    const searchParams = request.nextUrl.searchParams
    const { page, limit, skip, take } = parsePaginationParams(searchParams, 10)

    // Süperadmin tüm faturaları görebilir
    if (isSuperAdmin(session)) {
      const where = {
        isDeleted: false
      }
      
      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          select: {
            id: true,
            number: true,
            clientId: true,
            userId: true,
            companyId: true,
            issueDate: true,
            dueDate: true,
            status: true,
            subtotal: true,
            taxAmount: true,
            totalAmount: true,
            notes: true,
            isDeleted: true,
            createdAt: true,
            updatedAt: true,
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                taxId: true,
              },
            },
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
            items: {
              select: {
                id: true,
                description: true,
                quantity: true,
                price: true,
                total: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.invoice.count({ where })
      ])

      // Gecikmiş faturaları otomatik güncelle
      const now = new Date()
      const overdueInvoiceIds: string[] = []
      
      for (const invoice of invoices) {
        if (invoice.dueDate < now && invoice.status !== 'PAID' && invoice.status !== 'OVERDUE') {
          overdueInvoiceIds.push(invoice.id)
        }
      }

      // Bulk update yap
      if (overdueInvoiceIds.length > 0) {
        await prisma.invoice.updateMany({
          where: {
            id: { in: overdueInvoiceIds }
          },
          data: {
            status: 'OVERDUE'
          }
        })
      }

      // Güncellenmiş durumları response'a ekle
      const updatedInvoices = invoices.map(invoice => {
        if (overdueInvoiceIds.includes(invoice.id)) {
          return { ...invoice, status: 'OVERDUE' as const }
        }
        return invoice
      })

      const response: PaginationResponse<typeof updatedInvoices[0]> = {
        data: updatedInvoices,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      }

      return NextResponse.json(response)
    }

    // Admin ve User sadece kendi şirketinin faturalarını görebilir
    if (session.user.companyId) {
      const where = { 
        companyId: session.user.companyId,
        isDeleted: false // Soft delete edilmemiş faturalar
      }
      
      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          select: {
            id: true,
            number: true,
            clientId: true,
            userId: true,
            companyId: true,
            issueDate: true,
            dueDate: true,
            status: true,
            subtotal: true,
            taxAmount: true,
            totalAmount: true,
            notes: true,
            isDeleted: true,
            createdAt: true,
            updatedAt: true,
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                taxId: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
              },
            },
            items: {
              select: {
                id: true,
                description: true,
                quantity: true,
                price: true,
                total: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.invoice.count({ where })
      ])

      // Gecikmiş faturaları otomatik güncelle
      const now = new Date()
      const overdueInvoiceIds: string[] = []
      
      for (const invoice of invoices) {
        if (invoice.dueDate < now && invoice.status !== 'PAID' && invoice.status !== 'OVERDUE') {
          overdueInvoiceIds.push(invoice.id)
        }
      }

      // Bulk update yap
      if (overdueInvoiceIds.length > 0) {
        await prisma.invoice.updateMany({
          where: {
            id: { in: overdueInvoiceIds },
            companyId: session.user.companyId
          },
          data: {
            status: 'OVERDUE'
          }
        })
      }

      // Güncellenmiş durumları response'a ekle
      const updatedInvoices = invoices.map(invoice => {
        if (overdueInvoiceIds.includes(invoice.id)) {
          return { ...invoice, status: 'OVERDUE' as const }
        }
        return invoice
      })

      const response: PaginationResponse<typeof updatedInvoices[0]> = {
        data: updatedInvoices,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      }

      return NextResponse.json(response)
    }

    const emptyResponse: PaginationResponse<never> = {
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    }

    return NextResponse.json(emptyResponse)
  } catch (error) {
    return handleApiError(error, 'GET /api/invoices')
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireValidCompany()
    if ('response' in authResult) {
      return authResult.response
    }
    const { session, company } = authResult

    const body = await request.json()
    const validatedData = invoiceSchema.parse(body)

    // Generate unique invoice number
    const generateInvoiceNumber = async (): Promise<string> => {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      
      // Get the latest invoice number for this company in this month
      const latestInvoice = await prisma.invoice.findFirst({
        where: {
          companyId: company.id,
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
          companyId: company.id,
          clientId: validatedData.clientId,
          issueDate: new Date(validatedData.issueDate),
          dueDate: new Date(validatedData.dueDate),
          totalAmount,
          status: validatedData.status || 'UNPAID',
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
        select: {
          id: true,
          number: true,
          clientId: true,
          userId: true,
          companyId: true,
          issueDate: true,
          dueDate: true,
          status: true,
          subtotal: true,
          taxAmount: true,
          totalAmount: true,
          notes: true,
          isDeleted: true,
          createdAt: true,
          updatedAt: true,
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
              taxId: true,
            },
          },
          items: {
            select: {
              id: true,
              description: true,
              quantity: true,
              price: true,
              total: true,
            },
          },
        }
      })

      // Auto-create expense transaction (ödendi olarak işaretlenmez, manuel olarak ödenecek)
      await tx.transaction.create({
        data: {
          userId: session.user.id,
          companyId: company.id,
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

    // Fatura oluşturulduğunda bildirim gönder
    createNotification({
      userId: session.user.id,
      companyId: company.id,
      type: 'INVOICE_CREATED',
      priority: 'LOW',
      title: 'Yeni Fatura Oluşturuldu',
      message: `"${invoice.number}" numaralı fatura oluşturuldu. Tutar: ₺${totalAmount.toFixed(2)}`,
      link: `/invoices/${invoice.id}`,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        amount: totalAmount,
      },
    }).catch((error) => {
      console.error('Fatura oluşturuldu bildirimi gönderilirken hata:', error)
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'POST /api/invoices')
  }
} 