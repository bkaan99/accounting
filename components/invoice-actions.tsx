'use client'

import { Button } from '@/components/ui/button'
import { downloadInvoicePDF } from '@/lib/pdf-generator'
import { Eye, Download } from 'lucide-react'
import Link from 'next/link'

interface InvoiceActionsProps {
  invoice: {
    id: string
    number: string
    issueDate: string
    dueDate: string
    status: string
    totalAmount: number
    notes?: string
    clientInfo: {
      name: string
      email?: string
      phone?: string
      address?: string
    }
    items: {
      description: string
      quantity: number
      price: number
      total: number
    }[]
  }
}

export function InvoiceActions({ invoice }: InvoiceActionsProps) {
  return (
    <div className="flex justify-end space-x-2">
      <Link href={`/invoices/${invoice.id}`}>
        <Button variant="outline" size="sm" title="Detayları Görüntüle">
          <Eye className="h-4 w-4" />
        </Button>
      </Link>
      <Button
        variant="outline"
        size="sm"
        title="PDF İndir"
        onClick={() => downloadInvoicePDF(invoice)}
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  )
}
