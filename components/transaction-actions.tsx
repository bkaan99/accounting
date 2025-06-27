'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Edit3, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface TransactionActionsProps {
  transactionId: string
}

export function TransactionActions({ transactionId }: TransactionActionsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Bu işlemi silmek istediğinizden emin misiniz?')) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh() // Sayfayı yenile
      } else {
        alert('İşlem silinirken hata oluştu')
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert('İşlem silinirken hata oluştu')
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
      <Button
        variant="outline"
        size="sm"
        title="Sil"
        onClick={handleDelete}
        disabled={isDeleting}
        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
