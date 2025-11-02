import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'

/**
 * Vadesi yaklaşan faturaları kontrol eder ve bildirim gönderir
 * Bu endpoint manuel olarak çağrılabilir veya cron job ile otomatik çalıştırılabilir
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // İsteğe bağlı: sadece admin/superadmin çağırabilir
    // Veya cron job için secret key kontrolü eklenebilir
    // if (session?.user?.role !== 'SUPERADMIN' && request.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)

    // Gecikmiş faturalar
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        isDeleted: false,
        status: { in: ['DRAFT', 'SENT', 'UNPAID'] },
        dueDate: { lt: now },
      },
      include: {
        client: { select: { name: true } },
        user: { select: { id: true, companyId: true } },
      },
    })

    // 1 gün kala
    const dueIn1Day = await prisma.invoice.findMany({
      where: {
        isDeleted: false,
        status: { in: ['DRAFT', 'SENT', 'UNPAID'] },
        dueDate: { gte: now, lte: oneDayFromNow },
      },
      include: {
        client: { select: { name: true } },
        user: { select: { id: true, companyId: true } },
      },
    })

    // 3 gün kala
    const dueIn3Days = await prisma.invoice.findMany({
      where: {
        isDeleted: false,
        status: { in: ['DRAFT', 'SENT', 'UNPAID'] },
        dueDate: { gte: oneDayFromNow, lte: threeDaysFromNow },
      },
      include: {
        client: { select: { name: true } },
        user: { select: { id: true, companyId: true } },
      },
    })

    // 7 gün kala
    const dueIn7Days = await prisma.invoice.findMany({
      where: {
        isDeleted: false,
        status: { in: ['DRAFT', 'SENT', 'UNPAID'] },
        dueDate: { gte: threeDaysFromNow, lte: sevenDaysFromNow },
      },
      include: {
        client: { select: { name: true } },
        user: { select: { id: true, companyId: true } },
      },
    })

    let notificationsSent = 0

    // Gecikmiş faturalar için bildirim (sadece daha önce bildirim gönderilmemiş olanlar için)
    for (const invoice of overdueInvoices) {
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: invoice.user.id,
          type: 'INVOICE_OVERDUE',
          metadata: { contains: `"invoiceId":"${invoice.id}"` },
          createdAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Son 24 saat içinde
          },
        },
      })

      if (!existingNotification) {
        await createNotification({
          userId: invoice.user.id,
          companyId: invoice.user.companyId,
          type: 'INVOICE_OVERDUE',
          priority: 'URGENT',
          title: 'Gecikmiş Fatura!',
          message: `"${invoice.number}" numaralı fatura gecikti. Müşteri: ${invoice.client.name}, Tutar: ₺${invoice.totalAmount.toFixed(2)}`,
          link: `/invoices/${invoice.id}`,
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.number,
            dueDate: invoice.dueDate.toISOString(),
            amount: invoice.totalAmount,
          },
        }).catch((err) => console.error('Gecikmiş fatura bildirimi hatası:', err))
        notificationsSent++
      }
    }

    // 1 gün kala bildirim
    for (const invoice of dueIn1Day) {
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: invoice.user.id,
          type: 'INVOICE_DUE_SOON',
          metadata: { contains: `"invoiceId":"${invoice.id}"` },
          createdAt: {
            gte: new Date(now.getTime() - 12 * 60 * 60 * 1000), // Son 12 saat içinde
          },
        },
      })

      if (!existingNotification) {
        await createNotification({
          userId: invoice.user.id,
          companyId: invoice.user.companyId,
          type: 'INVOICE_DUE_SOON',
          priority: 'HIGH',
          title: 'Fatura Vadesi Yarın!',
          message: `"${invoice.number}" numaralı faturanın vadesi yarın doluyor. Müşteri: ${invoice.client.name}, Tutar: ₺${invoice.totalAmount.toFixed(2)}`,
          link: `/invoices/${invoice.id}`,
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.number,
            dueDate: invoice.dueDate.toISOString(),
            daysUntilDue: 1,
            amount: invoice.totalAmount,
          },
        }).catch((err) => console.error('Vade yaklaşan fatura bildirimi hatası:', err))
        notificationsSent++
      }
    }

    // 3 gün kala bildirim
    for (const invoice of dueIn3Days) {
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: invoice.user.id,
          type: 'INVOICE_DUE_SOON',
          metadata: { contains: `"invoiceId":"${invoice.id}"` },
          createdAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Son 24 saat içinde
          },
        },
      })

      if (!existingNotification) {
        await createNotification({
          userId: invoice.user.id,
          companyId: invoice.user.companyId,
          type: 'INVOICE_DUE_SOON',
          priority: 'MEDIUM',
          title: 'Fatura Vadesi Yaklaşıyor',
          message: `"${invoice.number}" numaralı faturanın vadesi 3 gün içinde dolacak. Müşteri: ${invoice.client.name}, Tutar: ₺${invoice.totalAmount.toFixed(2)}`,
          link: `/invoices/${invoice.id}`,
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.number,
            dueDate: invoice.dueDate.toISOString(),
            daysUntilDue: 3,
            amount: invoice.totalAmount,
          },
        }).catch((err) => console.error('Vade yaklaşan fatura bildirimi hatası:', err))
        notificationsSent++
      }
    }

    // 7 gün kala bildirim
    for (const invoice of dueIn7Days) {
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: invoice.user.id,
          type: 'INVOICE_DUE_SOON',
          metadata: { contains: `"invoiceId":"${invoice.id}"` },
          createdAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Son 24 saat içinde
          },
        },
      })

      if (!existingNotification) {
        await createNotification({
          userId: invoice.user.id,
          companyId: invoice.user.companyId,
          type: 'INVOICE_DUE_SOON',
          priority: 'MEDIUM',
          title: 'Fatura Vadesi Yaklaşıyor',
          message: `"${invoice.number}" numaralı faturanın vadesi 7 gün içinde dolacak. Müşteri: ${invoice.client.name}, Tutar: ₺${invoice.totalAmount.toFixed(2)}`,
          link: `/invoices/${invoice.id}`,
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.number,
            dueDate: invoice.dueDate.toISOString(),
            daysUntilDue: 7,
            amount: invoice.totalAmount,
          },
        }).catch((err) => console.error('Vade yaklaşan fatura bildirimi hatası:', err))
        notificationsSent++
      }
    }

    return NextResponse.json({
      message: 'Vade kontrolü tamamlandı',
      notificationsSent,
      overdue: overdueInvoices.length,
      dueIn1Day: dueIn1Day.length,
      dueIn3Days: dueIn3Days.length,
      dueIn7Days: dueIn7Days.length,
    })
  } catch (error) {
    console.error('Vade kontrolü hatası:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

