'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { downloadInvoicePDF } from '@/lib/pdf-generator'
import { Eye, Download, Trash2, Edit3 } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/toast'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

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
  onDelete?: () => void | Promise<void>
}

export function InvoiceActions({ invoice, onDelete }: InvoiceActionsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (): Promise<boolean> => {
    setIsDeleting(true)
    const loadingToastId = toast.loading('Fatura siliniyor...')
    
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success_update(loadingToastId, 'Fatura başarıyla silindi!')
        
        // Parent component'ten gelen onDelete callback'i çağır
        if (onDelete) {
          await onDelete()
        } else {
          // Fallback olarak router refresh
          router.refresh()
        }
        
        return true // Başarılı silme - dialog kapatılacak
      } else {
        const errorData = await response.json()
        toast.error_update(loadingToastId, errorData.error || 'Fatura silinirken hata oluştu')
        return false // Hata durumu - dialog açık kalacak
      }
    } catch (error) {
      console.error('Error deleting invoice:', error)
      toast.error_update(loadingToastId, 'Bağlantı hatası oluştu')
      return false // Hata durumu - dialog açık kalacak
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex justify-end space-x-2">
      <Link href={`/invoices/${invoice.id}`}>
        <Button variant="outline" size="sm" title="Detayları Görüntüle">
          <Eye className="h-4 w-4" />
        </Button>
      </Link>
      <Link href={`/invoices/${invoice.id}/edit`}>
        <Button variant="outline" size="sm" title="Düzenle">
          <Edit3 className="h-4 w-4" />
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
      <ConfirmDialog
        title="Fatura Sil"
        description={`"${invoice.number}" numaralı faturayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve ilgili işlemler de silinecektir.`}
        confirmText="Sil"
        cancelText="İptal"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      >
        <Button
          variant="outline"
          size="sm"
          title="Sil"
          disabled={isDeleting}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </ConfirmDialog>
    </div>
  )
}
