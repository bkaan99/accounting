import { prisma } from './prisma'

export type NotificationType =
  // Fatura bildirimleri
  | 'INVOICE_CREATED'
  | 'INVOICE_SENT'
  | 'INVOICE_PAID'
  | 'INVOICE_DUE_SOON'
  | 'INVOICE_OVERDUE'
  | 'INVOICE_STATUS_CHANGED'
  | 'INVOICE_EDITED'
  // İşlem bildirimleri
  | 'LARGE_TRANSACTION'
  | 'LOW_BALANCE'
  | 'NEGATIVE_BALANCE'
  | 'TRANSACTION_DELETED'
  | 'TRANSACTION_EDITED'
  // Sistem bildirimleri
  | 'USER_ADDED'
  | 'PASSWORD_CHANGED'
  | 'SUSPICIOUS_LOGIN'
  | 'SYSTEM_UPDATE'
  // Kullanıcı aktivite bildirimleri
  | 'CLIENT_ADDED'
  | 'CLIENT_DELETED'
  | 'BULK_TRANSACTION'
  | 'REPORT_GENERATED'

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

interface CreateNotificationParams {
  userId: string
  companyId?: string | null
  type: NotificationType
  priority?: NotificationPriority
  title: string
  message: string
  link?: string
  metadata?: Record<string, any>
}

/**
 * Bildirim oluşturur (tercihler kontrol edilir)
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const { userId, companyId, type, priority = 'MEDIUM', title, message, link, metadata } = params

    // Önce kullanıcının var olduğunu kontrol et
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      console.error(`Kullanıcı bulunamadı: ${userId}`)
      return null
    }

    // Kullanıcının bildirim tercihlerini kontrol et
    const preference = await prisma.notificationPreference.findUnique({
      where: { userId },
    })

  // Eğer kullanıcının tercihi yoksa, varsayılan tercihler oluştur
  if (!preference) {
    try {
      await prisma.notificationPreference.create({
        data: {
          userId,
          companyId: companyId || null,
        },
      })
    } catch (error) {
      console.error('NotificationPreference oluşturulurken hata:', error)
      // Hata olsa bile devam et, varsayılan tercihlerle çalış
    }
    // Varsayılan tercihlerle devam et (hepsi true)
  }

    // Bildirim türüne göre tercih kontrolü
    const isEnabled = await checkNotificationPreference(userId, type)
    
    if (!isEnabled) {
      return null // Bildirim gönderilmez
    }

    // Bildirimi oluştur
    const notification = await prisma.notification.create({
      data: {
        userId,
        companyId: companyId || null,
        type,
        priority,
        title,
        message,
        link,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })

    return notification
  } catch (error) {
    console.error('Bildirim oluşturulurken hata:', error)
    return null
  }
}

/**
 * Bildirim tercihini kontrol eder
 */
async function checkNotificationPreference(
  userId: string,
  type: NotificationType
): Promise<boolean> {
  try {
    const preference = await prisma.notificationPreference.findUnique({
      where: { userId },
    })

  if (!preference) {
    return true // Varsayılan: hepsi açık
  }

  switch (type) {
    // Fatura bildirimleri
    case 'INVOICE_CREATED':
      return preference.invoiceCreated
    case 'INVOICE_SENT':
      return preference.invoiceSent
    case 'INVOICE_PAID':
      return preference.invoicePaid
    case 'INVOICE_DUE_SOON':
      return preference.invoiceDueSoon
    case 'INVOICE_OVERDUE':
      return preference.invoiceOverdue
    case 'INVOICE_STATUS_CHANGED':
      return preference.invoiceStatusChanged
    case 'INVOICE_EDITED':
      return preference.invoiceEdited

    // İşlem bildirimleri
    case 'LARGE_TRANSACTION':
      return preference.largeTransaction
    case 'LOW_BALANCE':
      return preference.lowBalance
    case 'NEGATIVE_BALANCE':
      return preference.negativeBalance
    case 'TRANSACTION_DELETED':
      return preference.transactionDeleted
    case 'TRANSACTION_EDITED':
      return preference.transactionEdited

    // Sistem bildirimleri
    case 'USER_ADDED':
      return preference.userAdded
    case 'PASSWORD_CHANGED':
      return preference.passwordChanged
    case 'SUSPICIOUS_LOGIN':
      return preference.suspiciousLogin
    case 'SYSTEM_UPDATE':
      return preference.systemUpdate

    // Kullanıcı aktivite bildirimleri
    case 'CLIENT_ADDED':
      return preference.clientAdded
    case 'CLIENT_DELETED':
      return preference.clientAdded // Tedarikçi silme de aynı tercihi kullanır
    case 'BULK_TRANSACTION':
      return preference.bulkTransaction
    case 'REPORT_GENERATED':
      return preference.reportGenerated

    default:
      return true
  }
  } catch (error) {
    console.error('Bildirim tercihi kontrol edilirken hata:', error)
    return true // Hata durumunda varsayılan: hepsi açık
  }
}

/**
 * Bildirimi okundu olarak işaretler
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  return await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId, // Güvenlik: sadece kendi bildirimlerini işaretleyebilir
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  })
}

/**
 * Kullanıcının tüm bildirimlerini okundu olarak işaretler
 */
export async function markAllNotificationsAsRead(userId: string) {
  return await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  })
}

/**
 * Kullanıcının okunmamış bildirim sayısını döndürür
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    return await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    })
  } catch (error) {
    console.error('Okunmamış bildirim sayısı alınırken hata:', error)
    return 0
  }
}

/**
 * Vade yaklaşan faturalar için bildirim oluşturur
 * Bu fonksiyon cron job veya scheduled task tarafından çağrılır
 */
export async function checkAndNotifyDueInvoices() {
  const now = new Date()
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  // 7 gün içinde vadesi gelecek faturalar
  const invoicesDueIn7Days = await prisma.invoice.findMany({
    where: {
      status: { in: ['DRAFT', 'SENT', 'UNPAID'] },
      dueDate: {
        gte: now,
        lte: sevenDaysLater,
      },
    },
    include: {
      company: {
        include: {
          users: true,
        },
      },
      client: true,
    },
  })

  for (const invoice of invoicesDueIn7Days) {
    const daysUntilDue = Math.ceil(
      (invoice.dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    )

    let priority: NotificationPriority = 'MEDIUM'
    let message = ''

    if (daysUntilDue <= 1) {
      priority = 'HIGH'
      message = `"${invoice.number}" numaralı faturanın vadesi 1 gün sonra!`
    } else if (daysUntilDue <= 3) {
      priority = 'HIGH'
      message = `"${invoice.number}" numaralı faturanın vadesi ${daysUntilDue} gün sonra!`
    } else {
      priority = 'MEDIUM'
      message = `"${invoice.number}" numaralı faturanın vadesi ${daysUntilDue} gün sonra.`
    }

    // Şirketteki tüm kullanıcılara bildirim gönder
    for (const user of invoice.company.users) {
      await createNotification({
        userId: user.id,
        companyId: invoice.companyId,
        type: 'INVOICE_DUE_SOON',
        priority,
        title: 'Fatura Vadesi Yaklaşıyor',
        message,
        link: `/invoices/${invoice.id}`,
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.number,
          dueDate: invoice.dueDate.toISOString(),
          daysUntilDue,
        },
      })
    }
  }

  return invoicesDueIn7Days.length
}

/**
 * Gecikmiş faturalar için bildirim oluşturur
 */
export async function checkAndNotifyOverdueInvoices() {
  const now = new Date()

  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: { in: ['DRAFT', 'SENT', 'UNPAID'] },
      dueDate: { lt: now },
    },
    include: {
      company: {
        include: {
          users: true,
        },
      },
      client: true,
    },
  })

  for (const invoice of overdueInvoices) {
    const daysOverdue = Math.ceil((now.getTime() - invoice.dueDate.getTime()) / (24 * 60 * 60 * 1000))

    // Şirketteki tüm kullanıcılara bildirim gönder
    for (const user of invoice.company.users) {
      await createNotification({
        userId: user.id,
        companyId: invoice.companyId,
        type: 'INVOICE_OVERDUE',
        priority: 'URGENT',
        title: 'Gecikmiş Fatura',
        message: `"${invoice.number}" numaralı fatura ${daysOverdue} gün gecikmiş!`,
        link: `/invoices/${invoice.id}`,
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.number,
          dueDate: invoice.dueDate.toISOString(),
          daysOverdue,
        },
      })
    }
  }

  return overdueInvoices.length
}

