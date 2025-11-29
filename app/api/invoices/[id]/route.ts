import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { updateInvoiceStatus } from '@/lib/invoice-status'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let invoice
    
    // Süperadmin tüm faturaları görebilir
    if (session.user.role === 'SUPERADMIN') {
      invoice = await prisma.invoice.findUnique({
        where: { 
          id: params.id,
        },
        include: {
          client: true,
          items: true,
        }
      })
    } else {
      // Admin ve User sadece kendi şirketinin faturalarını görebilir
      invoice = await prisma.invoice.findUnique({
        where: { 
          id: params.id,
          companyId: session.user.companyId,
        },
        include: {
          client: true,
          items: true,
        }
      })
    }

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Invoice fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Sadece durum güncellemesi mi yoksa tam düzenleme mi?
    if (body.items && body.clientId) {
      // Tam fatura düzenlemesi
      const { clientId, issueDate, dueDate, status, notes, items } = body

      // Calculate total amount
      const totalAmount = items.reduce(
        (sum: number, item: any) => sum + (item.quantity * item.unitPrice),
        0
      )

      // Get client (tedarikçi) info
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { name: true }
      })

      // Transaction içinde fatura ve ilgili transaction'ı güncelle
      const invoice = await prisma.$transaction(async (tx) => {
        // Önce mevcut invoice item'larını sil
        await tx.invoiceItem.deleteMany({
          where: { invoiceId: params.id }
        })

        // Invoice'ı güncelle ve yeni item'ları ekle
        const whereClause = session.user.role === 'SUPERADMIN' 
          ? { id: params.id }
          : { id: params.id, companyId: session.user.companyId }
        
        // Vade tarihine göre otomatik durum belirleme
        const now = new Date()
        const dueDateObj = new Date(dueDate)
        let finalStatus = status
        
        // Eğer vade tarihi geçmişse ve fatura ödenmemişse, OVERDUE yap
        if (dueDateObj < now && status !== 'PAID') {
          finalStatus = 'OVERDUE'
        }

        const updatedInvoice = await tx.invoice.update({
          where: whereClause,
          data: {
            clientId,
            issueDate: new Date(issueDate),
            dueDate: dueDateObj,
            status: finalStatus,
            notes,
            totalAmount,
            updatedAt: new Date(),
            items: {
              create: items.map((item: any) => ({
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
        
        // Fatura durumunu kontrol et ve güncelle (transaction içinde)
        await updateInvoiceStatus(
          updatedInvoice.id,
          finalStatus === 'PAID',
          updatedInvoice.dueDate,
          tx
        )

        // İlgili transaction'ı güncelle
        const transactionWhereClause = session.user.role === 'SUPERADMIN'
          ? { invoiceId: params.id }
          : { invoiceId: params.id, companyId: session.user.companyId }
        
        await tx.transaction.updateMany({
          where: transactionWhereClause,
          data: {
            amount: totalAmount,
            description: `${client?.name || 'Tedarikçi'} - Fatura No: ${updatedInvoice.number}`,
            date: new Date(issueDate),
          }
        })

        return updatedInvoice
      })

      // Fatura düzenlendiğinde bildirim gönder
      await createNotification({
        userId: session.user.id,
        companyId: session.user.companyId,
        type: 'INVOICE_EDITED',
        priority: 'LOW',
        title: 'Fatura Düzenlendi',
        message: `"${invoice.number}" numaralı fatura güncellendi. Yeni tutar: ₺${invoice.totalAmount.toFixed(2)}`,
        link: `/invoices/${invoice.id}`,
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.number,
          amount: invoice.totalAmount,
        },
      })

      return NextResponse.json(invoice)
    } else {
      // Sadece durum güncellemesi - transaction'a dokunma
      const { status, notes } = body

      const whereClause = session.user.role === 'SUPERADMIN' 
        ? { id: params.id }
        : { id: params.id, companyId: session.user.companyId }
      
      // Önce eski durumu al
      const oldInvoice = await prisma.invoice.findUnique({
        where: whereClause,
      })

      if (!oldInvoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      }

      // Vade tarihine göre otomatik durum kontrolü
      const now = new Date()
      let finalStatus = status
      
      // Eğer durum değiştirilmiyorsa ve vade tarihi geçmişse, otomatik OVERDUE yap
      if (oldInvoice.dueDate < now && status !== 'PAID' && status === oldInvoice.status) {
        finalStatus = 'OVERDUE'
      }
      // Eğer durum manuel olarak değiştiriliyorsa ama vade tarihi geçmişse ve PAID değilse, OVERDUE yap
      else if (oldInvoice.dueDate < now && status !== 'PAID' && status !== 'OVERDUE') {
        finalStatus = 'OVERDUE'
      }

      const invoice = await prisma.invoice.update({
        where: whereClause,
        data: {
          status: finalStatus,
          notes,
          updatedAt: new Date(),
        },
        include: {
          client: true,
          items: true,
        }
      })
      
      // Fatura durumunu kontrol et ve güncelle
      await updateInvoiceStatus(
        invoice.id,
        finalStatus === 'PAID',
        invoice.dueDate
      )

      // Durum değiştiyse bildirim gönder
      if (oldInvoice.status !== status) {
        let notificationType: 'INVOICE_SENT' | 'INVOICE_PAID' | 'INVOICE_STATUS_CHANGED' = 'INVOICE_STATUS_CHANGED'
        let priority: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'
        let title = 'Fatura Durumu Değişti'
        let message = `"${invoice.number}" numaralı faturanın durumu "${oldInvoice.status}" → "${status}" olarak güncellendi.`

        if (status === 'SENT') {
          notificationType = 'INVOICE_SENT'
          title = 'Fatura Gönderildi'
          message = `"${invoice.number}" numaralı fatura gönderildi.`
          priority = 'MEDIUM'
        } else if (status === 'PAID') {
          notificationType = 'INVOICE_PAID'
          title = 'Fatura Ödendi'
          message = `"${invoice.number}" numaralı fatura ödendi. Tutar: ₺${invoice.totalAmount.toFixed(2)}`
          priority = 'HIGH'
        }

        await createNotification({
          userId: session.user.id,
          companyId: session.user.companyId,
          type: notificationType,
          priority,
          title,
          message,
          link: `/invoices/${invoice.id}`,
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.number,
            oldStatus: oldInvoice.status,
            newStatus: status,
            amount: invoice.totalAmount,
          },
        })
      }

      return NextResponse.json(invoice)
    }
  } catch (error) {
    console.error('Invoice update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Önce fatura bilgilerini al (bildirim için)
    const whereClause = session.user.role === 'SUPERADMIN' 
      ? { id: params.id }
      : { id: params.id, companyId: session.user.companyId }
    
    const invoice = await prisma.invoice.findUnique({
      where: whereClause,
      select: {
        id: true,
        number: true,
        totalAmount: true,
      },
    })

    // Transaction içinde fatura ve ilgili transaction'ı sil
    await prisma.$transaction(async (tx) => {
      const transactionWhereClause = session.user.role === 'SUPERADMIN'
        ? { invoiceId: params.id }
        : { invoiceId: params.id, companyId: session.user.companyId }
      
      // İlgili transaction'ları soft delete yap
      await tx.transaction.updateMany({
        where: transactionWhereClause,
        data: { isDeleted: true }
      })

      // Faturayı soft delete yap
      await tx.invoice.update({
        where: whereClause,
        data: { isDeleted: true }
      })
    })

    // Fatura silindiğinde bildirim gönder (eğer fatura bulunduysa)
    if (invoice) {
      await createNotification({
        userId: session.user.id,
        companyId: session.user.companyId,
        type: 'INVOICE_STATUS_CHANGED',
        priority: 'MEDIUM',
        title: 'Fatura Silindi',
        message: `"${invoice.number}" numaralı fatura silindi.`,
        link: '/invoices',
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.number,
          action: 'deleted',
        },
      }).catch((error) => {
        console.error('Fatura silindi bildirimi gönderilirken hata:', error)
      })
    }

    return NextResponse.json({ message: 'Invoice deleted successfully' })
  } catch (error) {
    console.error('Invoice delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 