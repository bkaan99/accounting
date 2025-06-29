'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Edit3, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/toast'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface TransactionActionsProps {
  transactionId: string
  onDelete?: () => void | Promise<void>
}

export function TransactionActions({ transactionId, onDelete }: TransactionActionsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (): Promise<boolean> => {
    setIsDeleting(true)
    const loadingToastId = toast.loading('İşlem siliniyor...')
    
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success_update(loadingToastId, 'İşlem başarıyla silindi!')
        
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
        toast.error_update(loadingToastId, errorData.error || 'İşlem silinirken hata oluştu')
        return false // Hata durumu - dialog açık kalacak
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      toast.error_update(loadingToastId, 'Bağlantı hatası oluştu')
      return false // Hata durumu - dialog açık kalacak
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex justify-end space-x-2">
      <Link href={`/transactions/${transactionId}/edit`}>
        <Button variant="outline" size="sm" title="Düzenle">
          <Edit3 className="h-4 w-4" />
        </Button>
      </Link>
      <ConfirmDialog
        title="İşlem Sil"
        description="Bu işlemi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
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
