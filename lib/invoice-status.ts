import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'UNPAID' | 'PAID' | 'OVERDUE'

/**
 * Fatura durumunu günceller
 * @param invoiceId Fatura ID'si
 * @param isPaid İşlem ödendi mi?
 * @param dueDate Son ödeme tarihi
 * @param tx Prisma transaction (opsiyonel)
 * @returns Güncellenmiş durum
 */
export async function updateInvoiceStatus(
  invoiceId: string,
  isPaid: boolean,
  dueDate: Date,
  tx?: Prisma.TransactionClient
): Promise<InvoiceStatus> {
  const now = new Date()
  const isOverdue = now > dueDate && !isPaid

  let newStatus: InvoiceStatus

  if (isPaid) {
    newStatus = 'PAID'
  } else if (isOverdue) {
    newStatus = 'OVERDUE'
  } else {
    newStatus = 'UNPAID'
  }

  // Fatura durumunu güncelle
  const client = tx || prisma
  await client.invoice.update({
    where: { id: invoiceId },
    data: { status: newStatus }
  })

  return newStatus
}

/**
 * Tüm gecikmiş faturaları günceller
 * Sistem başlangıcında çalıştırılır
 */
export async function updateOverdueInvoices(): Promise<void> {
  const now = new Date()
  
  // Gecikmiş faturaları bul (ödenmemiş ve vadesi geçmiş)
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: { in: ['DRAFT', 'SENT', 'UNPAID'] },
      dueDate: { lt: now }
    }
  })

  // Her birini gecikmiş olarak işaretle
  for (const invoice of overdueInvoices) {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: 'OVERDUE' }
    })
  }
}

/**
 * Fatura durumuna göre renk döndürür
 */
export function getInvoiceStatusColor(status: InvoiceStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'bg-gray-100 text-gray-800'
    case 'SENT':
      return 'bg-blue-100 text-blue-800'
    case 'UNPAID':
      return 'bg-yellow-100 text-yellow-800'
    case 'PAID':
      return 'bg-green-100 text-green-800'
    case 'OVERDUE':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Fatura durumuna göre Türkçe metin döndürür
 */
export function getInvoiceStatusText(status: InvoiceStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'Taslak'
    case 'SENT':
      return 'Gönderildi'
    case 'UNPAID':
      return 'Ödenmemiş'
    case 'PAID':
      return 'Ödenmiş'
    case 'OVERDUE':
      return 'Gecikmiş'
    default:
      return 'Bilinmiyor'
  }
}
